import { NextResponse } from "next/server";
import { sendBroadcastEmail } from "@/lib/email";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const BATCH_SIZE = 100;

/** Sends one controlled batch of the private 1.0 audience. */
export async function POST(request: Request) {
  const expectedSecret = process.env.BROADCAST_CRON_SECRET;
  const providedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseConfigured()) {
    return NextResponse.json({ message: "Database is not configured." }, { status: 503 });
  }

  const db = supabase();
  const { data: contacts, error } = await db
    .from("broadcast_contacts")
    .select("id, email")
    .is("sent_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error("[broadcast] failed to load contacts:", error.message);
    return NextResponse.json({ message: "Could not load broadcast contacts." }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  for (const contact of contacts ?? []) {
    const delivered = await sendBroadcastEmail(contact.email);
    if (!delivered) {
      failed += 1;
      continue;
    }

    const { error: updateError } = await db
      .from("broadcast_contacts")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", contact.id)
      .is("sent_at", null);

    if (updateError) {
      failed += 1;
      console.error("[broadcast] failed to mark contact as sent:", updateError.message);
      continue;
    }
    sent += 1;
  }

  return NextResponse.json({ ok: failed === 0, sent, failed, remaining: Math.max((contacts?.length ?? 0) - sent, 0) });
}

export function GET() {
  return NextResponse.json({ message: "POST with the broadcast secret." }, { status: 405 });
}
