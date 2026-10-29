import { NextResponse } from "next/server";
import { sessionFrom } from "@/lib/scanner-auth";
import { supabase, supabaseConfigured } from "@/lib/supabase";

/* ===========================================================================
 * THE OFFLINE GUEST LIST
 *
 * A scanner caches this so it can admit people with no signal.
 *
 * It carries the minimum that still lets a steward check the person in front
 * of them is the person on the ticket: first name and last initial. Full
 * surnames, emails and phone numbers are NOT sent — a stolen or lost staff
 * phone shouldn't hand over the registrant database.
 * ========================================================================= */

export async function GET(request: Request) {
  const session = sessionFrom(request);
  if (!session) {
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ message: "Database not configured." }, { status: 503 });
  }

  const db = supabase();
  const page = 1000;
  const entries: { t: string; n: string; in: boolean }[] = [];

  // Supabase caps a response at 1000 rows, so page through the lot.
  for (let from = 0; ; from += page) {
    const { data, error } = await db
      .from("registrations")
      .select("ticket, first_name, last_name, checked_in_at")
      .order("created_at", { ascending: true })
      .range(from, from + page - 1);

    if (error) {
      console.error("[manifest]", error.message);
      return NextResponse.json({ message: "Couldn't load the list." }, { status: 500 });
    }
    if (!data?.length) break;

    for (const r of data) {
      entries.push({
        t: r.ticket,
        n: `${r.first_name} ${(r.last_name ?? "").charAt(0)}.`.trim(),
        in: Boolean(r.checked_in_at),
      });
    }
    if (data.length < page) break;
  }

  return NextResponse.json(
    { syncedAt: new Date().toISOString(), count: entries.length, entries },
    { headers: { "Cache-Control": "no-store" } },
  );
}
