
import { NextResponse } from "next/server";
import { sendBroadcastEmail } from "@/lib/email";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const CAMPAIGN_KEY = "real-essence-2-thank-you";
const BATCH_SIZE = 100;
const PAGE_SIZE = 100;
const DELAY_MS = 2000;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const expectedSecret = process.env.BROADCAST_CRON_SECRET;
  const providedSecret = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!supabaseConfigured()) {
    return NextResponse.json(
      { message: "Database is not configured." },
      { status: 503 }
    );
  }

  const db = supabase();
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let stopped = false;

  // Read contacts in pages so previously processed
  // contacts do not prevent reaching new recipients.
  for (let offset = 0; sent < BATCH_SIZE; offset += PAGE_SIZE) {
    const { data: contacts, error } = await db
      .from("broadcast_contacts")
      .select("id, email")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error("[broadcast] Load failed:", error.message);
      return NextResponse.json(
        { message: "Could not load contacts.", sent, failed },
        { status: 500 }
      );
    }

    if (!contacts?.length) break;

    for (const contact of contacts) {
      if (sent >= BATCH_SIZE) break;

      // Claim the recipient for this campaign.
      // The database UNIQUE constraint prevents
      // simultaneous requests from claiming the same contact.
      const { error: claimError } = await db
        .from("broadcast_campaign_sends")
        .insert({
          campaign_key: CAMPAIGN_KEY,
          contact_id: contact.id,
        });

      if (claimError) {
        if (claimError.code === "23505") {
          skipped++;
          continue;
        }

        console.error("[broadcast] Claim failed:", claimError.message);
        stopped = true;
        break;
      }

      let delivered = false;

      try {
        delivered = await sendBroadcastEmail(contact.email);
      } catch (error) {
        console.error("[broadcast] Send error:", error);
      }

      if (!delivered) {
        failed++;

        // Release failed claim for a future retry.
        const { error: releaseError } = await db
          .from("broadcast_campaign_sends")
          .delete()
          .eq("campaign_key", CAMPAIGN_KEY)
          .eq("contact_id", contact.id)
          .is("sent_at", null);

        if (releaseError) {
          console.error(
            "[broadcast] Claim release failed:",
            releaseError.message
          );
        }

        // Stop rather than hammering a restricted SMTP account.
        stopped = true;
        break;
      }

      const { error: updateError } = await db
        .from("broadcast_campaign_sends")
        .update({ sent_at: new Date().toISOString() })
        .eq("campaign_key", CAMPAIGN_KEY)
        .eq("contact_id", contact.id)
        .is("sent_at", null);

      if (updateError) {
        console.error(
          "[broadcast] Tracking failed:",
          updateError.message
        );

        // Keep the claim to avoid automatically
        // resending an email that was accepted.
        stopped = true;
        break;
      }

      sent++;
      console.log(`[broadcast] Thank-you sent: ${sent}`);

      if (sent < BATCH_SIZE) {
        await sleep(DELAY_MS);
      }
    }

    if (stopped || contacts.length < PAGE_SIZE) break;
  }

  return NextResponse.json({
    campaign: CAMPAIGN_KEY,
    sent,
    failed,
    skipped,
    stopped,
    message: stopped
      ? "Batch stopped. Check logs before retrying."
      : "Batch completed.",
  });
}

export function GET() {
  return NextResponse.json(
    { message: "POST with the broadcast secret." },
    { status: 405 }
  );
}
