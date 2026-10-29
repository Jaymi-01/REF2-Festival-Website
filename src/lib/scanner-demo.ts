"use client";

import demo from "@/data/demo-guests.json";
import type { Guest } from "./scan-store";

/* ===========================================================================
 * DEMO MODE
 *
 * Lets the scanner run with no server and no database, so it can be installed
 * on a phone and tried properly before Supabase exists.
 *
 * Everything the gate actually decides is unchanged: the QR is still decoded
 * from the camera, the Ed25519 signature is still verified against the real
 * public key, duplicates are still caught against the device's own list. Only
 * the three network calls are replaced.
 *
 * Turned on with NEXT_PUBLIC_SCANNER_DEMO=1 at build time, and the UI says so
 * in a banner that cannot be dismissed — nobody should ever mistake a demo
 * build for the real gate.
 * ========================================================================= */

export const SCANNER_DEMO = process.env.NEXT_PUBLIC_SCANNER_DEMO === "1";

export const DEMO_PIN = "1234";

export type DemoCard = {
  t: string;
  n?: string;
  note: string;
  file: string;
};

export const DEMO_GUESTS = demo.guests as Guest[];
export const DEMO_CARDS = demo.cards as DemoCard[];

export function demoSignIn(pin: string, device: string) {
  if (pin.trim() !== DEMO_PIN) {
    throw new Error(`Demo PIN is ${DEMO_PIN}.`);
  }
  return { token: `demo.${Date.now()}`, device: device || "Demo gate" };
}

export function demoManifest() {
  return {
    syncedAt: new Date().toISOString(),
    count: DEMO_GUESTS.length,
    // A fresh copy each pull, so "Sync" genuinely resets the demo.
    entries: DEMO_GUESTS.map((g) => ({ ...g })),
  };
}
