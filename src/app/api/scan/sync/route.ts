import { NextResponse } from "next/server";
import { sessionFrom } from "@/lib/scanner-auth";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { AdmitResult } from "@/lib/supabase";

/* ===========================================================================
 * PUSHING QUEUED SCANS
 *
 * The scanner admits people locally and queues the scans. This replays that
 * queue. Every scan carries a device-generated UUID, and `admit()` ignores an
 * id it has already seen — so a replay after a flaky connection can never
 * double-count, and the device can retry freely.
 *
 * The server's answer is authoritative: if two gates both admitted the same
 * ticket while offline, exactly one gets 'admitted' back here and the other
 * gets 'duplicate'. The scanner surfaces that in its review list.
 * ========================================================================= */

type QueuedScan = {
  id: string;
  ticket: string;
  scannedAt: string;
  localResult: string;
};

const MAX_BATCH = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const session = sessionFrom(request);
  if (!session) {
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ message: "Database not configured." }, { status: 503 });
  }

  let body: { scans?: QueuedScan[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const scans = (body.scans ?? []).slice(0, MAX_BATCH);
  const db = supabase();
  const results: Record<string, AdmitResult> = {};

  for (const scan of scans) {
    if (!UUID_RE.test(scan.id ?? "")) continue;

    const { data, error } = await db.rpc("admit", {
      p_ticket: scan.ticket,
      p_device: session.device,
      p_scan_id: scan.id,
      p_scanned_at: scan.scannedAt,
    });

    if (error) {
      console.error("[sync] admit failed:", error.message);
      continue; // leave it queued; the device will retry
    }

    const row = (Array.isArray(data) ? data[0] : data) as AdmitResult | undefined;
    if (row) results[scan.id] = row;
  }

  const { data: stats } = await db.from("gate_stats").select("*").maybeSingle();

  return NextResponse.json({
    ok: true,
    accepted: Object.keys(results),
    results,
    stats: stats ?? null,
    syncedAt: new Date().toISOString(),
  });
}
