import { NextResponse } from "next/server";
import { sendEventReminderEmail } from "@/lib/email";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const REMINDER_DATES = {
  "2026-11-04": { final: false, column: "reminder_week_sent_at" },
  "2026-11-06": { final: true, column: "reminder_final_sent_at" },
} as const;
const BATCH_SIZE = 100;

/**
 * Sends the reminder for the current Lagos date. Supabase Cron calls this
 * endpoint once daily; dates not listed above intentionally do nothing.
 */
export async function POST(request: Request) {
  const expectedSecret = process.env.REMINDER_CRON_SECRET;
  const providedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ message: "Database is not configured." }, { status: 503 });
  }

  const lagosDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const lagosHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  const reminder = REMINDER_DATES[lagosDate as keyof typeof REMINDER_DATES];

  if (!reminder || lagosHour < 12) {
    return NextResponse.json({ ok: true, sent: 0, message: "No reminder is scheduled for today." });
  }

  const db = supabase();
  const { data: registrations, error } = await db
    .from("registrations")
    .select(`id, first_name, email, ${reminder.column}`)
    .is(reminder.column, null)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[reminders] failed to load registrations:", error.message);
    return NextResponse.json({ message: "Could not load registrations." }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  for (const registration of registrations ?? []) {
    const delivered = await sendEventReminderEmail({
      firstName: registration.first_name,
      email: registration.email,
      final: reminder.final,
    });

    if (!delivered) {
      failed += 1;
      continue;
    }

    const { error: updateError } = await db
      .from("registrations")
      .update({ [reminder.column]: new Date().toISOString() })
      .eq("id", registration.id);

    if (updateError) {
      failed += 1;
      console.error("[reminders] failed to mark email as sent:", updateError.message);
      continue;
    }

    sent += 1;
  }

  return NextResponse.json({ ok: failed === 0, sent, failed, total: registrations?.length ?? 0 });
}

export function GET() {
  return NextResponse.json({ message: "POST with the reminder cron secret." }, { status: 405 });
}
