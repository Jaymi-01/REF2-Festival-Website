import { NextResponse } from "next/server";
import { supabase, supabaseConfigured, type Registration } from "@/lib/supabase";
import { generateTicket, formatTicket } from "@/lib/ticket";
import { sendConfirmationEmail } from "@/lib/email";

/* ===========================================================================
 * REGISTRATION
 *
 * Persists the registrant, issues a ticket reference, and returns it.
 *
 * Re-registering with an email we already have returns the ORIGINAL ticket
 * rather than issuing a second one — otherwise one person could mint tickets
 * for a whole group by submitting the form repeatedly.
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
  // The database keeps first/last name columns for the gate manifest, so the
  // public Full Name field is split only at the server boundary.
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

  // Already registered? Hand back the ticket they already have.
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
        ticket: existing.ticket,
        ticketDisplay: formatTicket(existing.ticket),
        emailSent: false,
      },
      { status: 200 },
    );
  }

  // Issue a new one. The unique index on `ticket` is the real guard against a
  // collision; retrying a couple of times is cheaper than locking.
  let saved: Registration | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 3 && !saved; attempt++) {
    const { data, error } = await db
      .from("registrations")
      .insert({
        ticket: generateTicket(),
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      })
      .select()
      .single<Registration>();

    if (data) saved = data;
    else if (error?.code === "23505" && error.message.includes("email")) {
      // Lost a race with a simultaneous submit of the same email.
      const { data: raced } = await db
        .from("registrations")
        .select("*")
        .eq("email", email)
        .maybeSingle<Registration>();
      if (raced) {
        return NextResponse.json(
          {
            ok: true,
            alreadyRegistered: true,
            ticket: raced.ticket,
            ticketDisplay: formatTicket(raced.ticket),
            emailSent: false,
          },
          { status: 200 },
        );
      }
      lastError = error.message;
    } else {
      lastError = error?.message ?? "unknown error";
      if (error?.code !== "23505") break; // only retry ticket collisions
    }
  }

  if (!saved) {
    console.error("[register] insert failed:", lastError);
    return NextResponse.json(
      { message: "Couldn't save your registration. Please try again." },
      { status: 500 },
    );
  }

  /* -------------------------------------------------------------------------
   * Confirmation emails are sent after the registration is safely saved. A
   * provider outage must not discard a valid registration.
   * ---------------------------------------------------------------------- */

  // Send after the ticket is saved. A provider outage must not discard a
  // valid registration, so the helper returns false instead of throwing.
  let emailSent = false;
  try {
    const origin = new URL(request.url).origin;
    emailSent = await sendConfirmationEmail({
      firstName,
      email,
      ticket: saved.ticket,
      siteUrl: origin,
    });
  } catch (error) {
    console.error("[register] confirmation email failed:", error);
  }

  return NextResponse.json(
    {
      ok: true,
      ticket: saved.ticket,
      ticketDisplay: formatTicket(saved.ticket),
      emailSent,
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
