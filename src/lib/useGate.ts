"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  clearEverything,
  enqueue,
  gateServerSnapshot,
  gateSnapshot,
  getGuest,
  markGuestIn,
  pendingQueue,
  pruneSettled,
  refreshGate,
  replaceGuests,
  setSyncing,
  subscribeGate,
  updateQueued,
  type GateSnapshot,
  type ScanResult,
} from "./scan-store";
import { normaliseTicket, parseQrPayload, publicKey, verifyTicket } from "./ticket";
import { useLocalValue, useOnline, writeLocalValue } from "./useReducedMotion";
import { SCANNER_DEMO, demoManifest, demoSignIn } from "./scanner-demo";

const TOKEN_KEY = "ref2-gate-token";
const DEVICE_KEY = "ref2-gate-device";

export type Verdict = {
  result: ScanResult;
  ticket: string;
  name?: string;
  offline: boolean;
};

/**
 * Everything the gate UI needs. There is no React state in here on purpose:
 * the session lives in localStorage, connectivity in the browser, and the
 * guest list and scan queue in IndexedDB — all three are external systems,
 * subscribed to rather than mirrored.
 */
export function useGate() {
  const token = useLocalValue(TOKEN_KEY);
  const device = useLocalValue(DEVICE_KEY) ?? "";
  const online = useOnline();
  const store: GateSnapshot = useSyncExternalStore(
    subscribeGate,
    gateSnapshot,
    gateServerSnapshot,
  );

  const syncingRef = useRef(false);

  /* --- sign in / out ---------------------------------------------------- */

  const signIn = useCallback(async (pin: string, deviceName: string) => {
    if (SCANNER_DEMO) {
      const { token, device: name } = demoSignIn(pin, deviceName);
      writeLocalValue(TOKEN_KEY, token);
      writeLocalValue(DEVICE_KEY, name);
      return token;
    }

    const res = await fetch("/api/scan/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, device: deviceName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "Couldn't sign in.");
    writeLocalValue(TOKEN_KEY, data.token);
    writeLocalValue(DEVICE_KEY, data.device);
    return data.token as string;
  }, []);

  const signOut = useCallback(async () => {
    writeLocalValue(TOKEN_KEY, null);
    await clearEverything();
    await refreshGate();
  }, []);

  /* --- pull the guest list ---------------------------------------------- */

  const pullManifest = useCallback(
    async (useToken?: string) => {
      const t = useToken ?? token;
      if (!t) throw new Error("Not signed in.");

      if (SCANNER_DEMO) {
        const data = demoManifest();
        await replaceGuests(data.entries, data.syncedAt);
        await refreshGate();
        return data.count;
      }

      const res = await fetch("/api/scan/manifest", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) throw new Error("Session expired — sign in again.");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Couldn't load the guest list.");
      await replaceGuests(data.entries, data.syncedAt);
      await refreshGate();
      return data.count as number;
    },
    [token],
  );

  /* --- push queued scans -------------------------------------------------- */

  const sync = useCallback(async () => {
    if (!token || syncingRef.current || !navigator.onLine) return;
    const queue = await pendingQueue();
    if (!queue.length) return;

    // Demo mode has no server to reconcile with, so a scan settles as soon as
    // it is "uploaded" — the queue still fills and drains exactly as it would.
    if (SCANNER_DEMO) {
      setSyncing(true);
      await new Promise((r) => setTimeout(r, 600));
      for (const scan of queue) {
        await updateQueued({ ...scan, serverResult: scan.localResult });
      }
      await pruneSettled();
      await refreshGate();
      setSyncing(false);
      return;
    }

    syncingRef.current = true;
    setSyncing(true);
    try {
      const res = await fetch("/api/scan/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          scans: queue.map(({ id, ticket, scannedAt, localResult }) => ({
            id,
            ticket,
            scannedAt,
            localResult,
          })),
        }),
      });
      if (!res.ok) return; // leave it queued and try again later
      const data = await res.json();

      for (const scan of queue) {
        const verdict = data.results?.[scan.id];
        if (verdict) await updateQueued({ ...scan, serverResult: verdict.result });
      }
      await pruneSettled();
      await refreshGate();
    } catch {
      /* lost signal mid-flight — the queue survives, nothing is dropped */
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [token]);

  /* Retry whenever signal returns, and every 20s while we have it. */
  useEffect(() => {
    if (!token) return;
    const run = () => void sync();
    run();
    window.addEventListener("online", run);
    const id = setInterval(run, 20_000);
    return () => {
      window.removeEventListener("online", run);
      clearInterval(id);
    };
  }, [token, sync]);

  /* --- the decision at the gate ------------------------------------------- */

  const admit = useCallback(
    async (raw: string, opts?: { manual?: boolean }): Promise<Verdict> => {
      const now = new Date().toISOString();
      const offline = !navigator.onLine;

      const record = async (t: string, result: ScanResult) => {
        await enqueue({ id: crypto.randomUUID(), ticket: t, scannedAt: now, localResult: result });
        await refreshGate();
        void sync();
      };

      // A typed-in number has no signature to check, so it rests on the cached
      // guest list alone. A scanned QR gets the signature check as well, which
      // is what makes a forged code impossible to pass even with no signal.
      let ticket: string;
      if (opts?.manual) {
        ticket = normaliseTicket(raw);
      } else {
        const parsed = parseQrPayload(raw);
        if (!parsed) return { result: "bad_signature", ticket: raw.slice(0, 24), offline };
        if (!(await verifyTicket(parsed, publicKey()))) {
          return { result: "bad_signature", ticket: parsed.ticket, offline };
        }
        ticket = parsed.ticket;
      }

      const guest = await getGuest(ticket);
      if (!guest) {
        await record(ticket, "unknown");
        return { result: "unknown", ticket, offline };
      }
      if (guest.in) {
        await record(ticket, "duplicate");
        return { result: "duplicate", ticket, name: guest.n, offline };
      }

      await markGuestIn(ticket);
      await record(ticket, "admitted");
      return { result: "admitted", ticket, name: guest.n, offline };
    },
    [sync],
  );

  return {
    token,
    device,
    online,
    guests: store.guests,
    pending: store.pending,
    syncedAt: store.syncedAt,
    syncing: store.syncing,
    history: store.history,
    signIn,
    signOut,
    pullManifest,
    sync,
    admit,
  };
}
