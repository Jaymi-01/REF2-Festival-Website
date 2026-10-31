import { NextResponse } from "next/server";
import { supabase, supabaseConfigured, type Registration } from "@/lib/supabase";
import { scheduleEventReminders, sendConfirmationEmail } from "@/lib/email";
import { sendRegistrationToGoogleSheets } from "@/lib/googleSheets";

/* ===========================================================================
 * REGISTRATION
 *
 * Persists the registrant and sends an optional confirmation email.
 * ========================================================================= */

type Payload = {
  fullName?: string;
  phone?: string;
  email?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/* --- a small in-memory rate limit ----------------------------------------
 * Enough to stop a bored person hammering the form. It resets on redeploy and
 * is per-instance, so for a real spike put a shared limiter in front
 * (@upstash/ratelimit) or enable your host's WAF rules.
 * ------------------------------------------------------------------------ */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // crude bound on memory
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { message: "Too many attempts. Wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const fullName = (body.fullName ?? "").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  // Keep the database's existing first/last name columns while presenting one
  // simpler Full Name field to visitors.
  const firstName = nameParts.shift() ?? "";
  const lastName = nameParts.join(" ") || firstName;
  const phone = (body.phone ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const digits = phone.replace(/\D/g, "");

  // Server-side validation — the client's checks are a convenience, not a gate.
  if (!fullName) {
    return NextResponse.json({ message: "Name is required." }, { status: 422 });
  }
  if (fullName.length > 50) {
    return NextResponse.json({ message: "Name must be 50 characters or fewer." }, { status: 422 });
  }
  if (digits.length < 10 || digits.length > 14) {
    return NextResponse.json({ message: "Check that phone number." }, { status: 422 });
  }
  if (email.length > 254 || email.includes("..") || !EMAIL_RE.test(email)) {
    return NextResponse.json({ message: "Check that email address." }, { status: 422 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json(
      {
        message:
          "We couldn't complete your registration right now. Please try again shortly.",
      },
      { status: 503 },
    );
  }

  const db = supabase();

  // Already registered? Avoid creating a duplicate row.
  const { data: existing } = await db
    .from("registrations")
    .select("*")
    .eq("email", email)
    .maybeSingle<Registration>();

  if (existing) {
    return NextResponse.json(
      {
        ok: true,
        alreadyRegistered: true,
        emailSent: false,
      },
      { status: 200 },
    );
  }

  const { data: saved, error } = await db
    .from("registrations")
    .insert({ first_name: firstName, last_name: lastName, email, phone })
    .select()
    .single<Registration>();

  if (!saved && error?.code === "23505" && error.message.includes("email")) {
    // Lost a race with a simultaneous submit of the same email.
    return NextResponse.json(
      { ok: true, alreadyRegistered: true, emailSent: false },
      { status: 200 },
    );
  }

  if (!saved) {
    console.error("[register] insert failed:", error?.message ?? "unknown error");
    return NextResponse.json(
      { message: "Couldn't save your registration. Please try again." },
      { status: 500 },
    );
  }

  /* -------------------------------------------------------------------------
   * Confirmation emails are sent after the registration is safely saved. A
   * provider outage must not discard a valid registration.
   * ---------------------------------------------------------------------- */

  // Send after the registration is saved. A provider outage must not discard a
  // valid registration, so the helper returns false instead of throwing.
  let emailSent = false;
  try {
    emailSent = await sendConfirmationEmail({
      firstName,
      email,
    });
  } catch (error) {
    console.error("[register] confirmation email failed:", error);
  }

  let remindersScheduled = false;
  try {
    remindersScheduled = await scheduleEventReminders({ firstName, email });
  } catch (error) {
    console.error("[register] reminder scheduling failed:", error);
  }

  // Keep the Sheet sync independent from email delivery. A temporary webhook
  // outage must not make a successful registration fail.
  let googleSheetSaved = false;
  try {
    googleSheetSaved = await sendRegistrationToGoogleSheets({
      fullName,
      phone,
      email,
      registeredAt: saved.created_at,
    });
  } catch (error) {
    console.error("[register] Google Sheets sync failed:", error);
  }

  return NextResponse.json(
    {
      ok: true,
      emailSent,
      remindersScheduled,
      googleSheetSaved,
    },
    { status: 201 },
  );
}

export function GET() {
  return NextResponse.json(
    { message: "POST a registration to this endpoint." },
    { status: 405 },
  );
}
