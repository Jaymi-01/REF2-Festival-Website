"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Scanner from "@/components/scan/Scanner";
import { useGate, type Verdict } from "@/lib/useGate";
import { formatTicket, isWellFormedTicket, normaliseTicket } from "@/lib/ticket";
import { DEMO_CARDS, DEMO_PIN, SCANNER_DEMO } from "@/lib/scanner-demo";

/* ===========================================================================
 * THE GATE SCANNER
 *
 * Designed to be read at arm's length, outdoors, by someone who has been on
 * their feet for six hours: one enormous colour-coded verdict, a name to check
 * against the person, and nothing else competing for attention.
 * ========================================================================= */

const VERDICT = {
  admitted: { bg: "bg-green-bright", label: "LET THEM IN", icon: "✓" },
  duplicate: { bg: "bg-[#c25800]", label: "ALREADY IN", icon: "!" },
  unknown: { bg: "bg-red", label: "NOT FOUND", icon: "✕" },
  bad_signature: { bg: "bg-red", label: "FAKE TICKET", icon: "✕" },
} as const;

export default function GatePage() {
  const gate = useGate();
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [manual, setManual] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handle = useCallback(
    async (raw: string, opts?: { manual?: boolean }) => {
      const v = await gate.admit(raw, opts);
      setVerdict(v);

      // A short, distinct buzz per outcome — staff learn it faster than reading.
      try {
        navigator.vibrate?.(
          v.result === "admitted" ? 60 : v.result === "duplicate" ? [50, 70, 50] : [120, 80, 120],
        );
      } catch {
        /* no vibration on this device */
      }

      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setVerdict(null), v.result === "admitted" ? 1800 : 3600);
    },
    [gate],
  );

  useEffect(() => () => void (clearTimer.current && clearTimeout(clearTimer.current)), []);

  if (!gate.token) return <SignIn gate={gate} />;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col gap-3 p-3">
      {SCANNER_DEMO && <DemoBanner onTickets={() => setShowTickets(true)} />}
      <StatusBar gate={gate} onHistory={() => setShowHistory(true)} />

      <div className="relative">
        <Scanner onScan={(t) => void handle(t)} paused={Boolean(verdict) || manual} />

        <AnimatePresence>
          {verdict && (
            <motion.div
              key={verdict.ticket + verdict.result}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
              role="alert"
              data-verdict={verdict.result}
              onClick={() => setVerdict(null)}
              className={`absolute inset-0 grid cursor-pointer place-content-center gap-1 rounded-2xl px-6 text-center ${VERDICT[verdict.result].bg}`}
            >
              <p aria-hidden="true" className="text-[clamp(3.5rem,18vw,6rem)] font-black leading-none text-white">
                {VERDICT[verdict.result].icon}
              </p>
              <p className="text-[clamp(1.4rem,7vw,2.2rem)] font-black uppercase leading-tight tracking-tight text-white">
                {VERDICT[verdict.result].label}
              </p>
              {verdict.name && (
                <p className="mt-1 text-lg font-bold text-white/95">{verdict.name}</p>
              )}
              <p className="mt-1 font-mono text-sm tracking-widest text-white/75">
                {isWellFormedTicket(verdict.ticket) ? formatTicket(verdict.ticket) : "unreadable"}
              </p>
              {verdict.result === "duplicate" && (
                <p className="mt-1 text-sm font-semibold text-white/85">
                  This ticket has already been used. Check their ID or send them to the help desk.
                </p>
              )}
              {verdict.result === "bad_signature" && (
                <p className="mt-1 text-sm font-semibold text-white/85">
                  Not one of ours — this wasn&apos;t issued by the festival.
                </p>
              )}
              {verdict.result === "unknown" && (
                <p className="mt-1 text-sm font-semibold text-white/85">
                  {gate.pending > 0 || !gate.online
                    ? "Not on this device's list. Sync and try again, or register them on the spot."
                    : "No registration with this ticket."}
                </p>
              )}
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/60">
                Tap to scan the next one
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={() => setManual(true)}
        className="rounded-xl border-2 border-cream/25 py-3.5 text-sm font-extrabold uppercase tracking-wide text-cream transition-colors hover:bg-cream/10"
      >
        Enter code by hand
      </button>

      <p className="pb-2 text-center text-[11px] leading-relaxed text-cream/40">
        Camera won&apos;t read it? Their email shows the ticket number in large type —
        type that in instead.
      </p>

      <AnimatePresence>
        {manual && (
          <ManualEntry
            onClose={() => setManual(false)}
            onSubmit={async (code) => {
              setManual(false);
              await handle(code, { manual: true });
            }}
          />
        )}
        {showHistory && <History gate={gate} onClose={() => setShowHistory(false)} />}
        {showTickets && <DemoTickets onClose={() => setShowTickets(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Impossible to miss, impossible to dismiss. A demo build must never be
 *  mistaken for the real gate. */
function DemoBanner({ onTickets }: { onTickets: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-yellow-deep px-3 py-2 text-ink">
      <p className="text-[11px] font-extrabold uppercase leading-tight tracking-wide">
        Demo — not the real gate
        <span className="block font-bold normal-case tracking-normal opacity-70">
          Sample guests only. Nothing is saved anywhere.
        </span>
      </p>
      <button
        type="button"
        onClick={onTickets}
        className="shrink-0 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cream"
      >
        Tickets
      </button>
    </div>
  );
}

function DemoTickets({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/97 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Sample tickets"
    >
      <div className="mx-auto max-w-[520px]">
        <div className="sticky top-0 flex items-center justify-between bg-ink/97 py-2">
          <h2 className="font-display text-2xl text-cream">Sample tickets</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-cream/10 px-4 py-2 text-xs font-extrabold uppercase text-cream"
          >
            Close
          </button>
        </div>

        <p className="mb-4 text-[12px] leading-relaxed text-cream/60">
          Open this page on a laptop and scan these with your phone — or scan
          them off a second screen. Every signature here is real, so the
          forged one really does fail the check.
        </p>

        <ul className="space-y-3 pb-8">
          {DEMO_CARDS.map((c) => (
            <li
              key={c.t}
              className="flex items-center gap-3 rounded-xl bg-cream/[0.06] p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/demo-tickets/${c.file}`}
                alt={`Sample QR — ${c.note}`}
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 rounded-md bg-white p-1"
              />
              <div className="min-w-0">
                <p className="font-mono text-[13px] tracking-widest text-cream">
                  {isWellFormedTicket(c.t) ? formatTicket(c.t) : c.t}
                </p>
                {c.n && <p className="text-[13px] font-bold text-cream/80">{c.n}</p>}
                <p className="mt-0.5 text-[12px] font-semibold leading-snug text-cream/55">
                  {c.note}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function StatusBar({
  gate,
  onHistory,
}: {
  gate: ReturnType<typeof useGate>;
  onHistory: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setMsg(null);
    try {
      const n = await gate.pullManifest();
      setMsg(`${n.toLocaleString()} guests loaded`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  return (
    <div className="rounded-xl bg-cream/[0.07] px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest ${
            gate.online ? "text-green-bright" : "text-[#ffb13d]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${gate.online ? "bg-green-bright" : "bg-[#ffb13d]"}`}
          />
          {gate.online ? "Online" : "Offline"}
        </span>

        <span className="truncate text-[11px] font-bold text-cream/50">{gate.device}</span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onHistory}
            className="rounded-lg px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-cream/70 hover:bg-cream/10"
          >
            Log
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={busy || !gate.online}
            className="rounded-lg bg-cream/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-cream disabled:opacity-40"
          >
            {busy ? "…" : "Sync"}
          </button>
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-3 text-[11px] font-semibold text-cream/55">
        <span>{gate.guests.toLocaleString()} on list</span>
        {gate.pending > 0 && (
          <span className="rounded-full bg-[#ffb13d]/20 px-2 py-0.5 font-extrabold text-[#ffb13d]">
            {gate.pending} to upload
          </span>
        )}
        {gate.syncing && <span>syncing…</span>}
      </div>

      {msg && (
        <p aria-live="polite" className="mt-1.5 text-[11px] font-bold text-yellow-deep">
          {msg}
        </p>
      )}

      {gate.guests === 0 && (
        <p className="mt-2 rounded-lg bg-[#ffb13d]/15 px-2.5 py-2 text-[11px] font-bold leading-relaxed text-[#ffb13d]">
          No guest list on this device yet. Tap Sync while you still have signal —
          without it nothing can be admitted offline.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SignIn({ gate }: { gate: ReturnType<typeof useGate> }) {
  const [pin, setPin] = useState("");
  const [device, setDevice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await gate.signIn(pin, device || "Gate");
      await gate.pullManifest(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[100dvh] place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-[360px]">
        <h1 className="font-display text-center text-3xl text-cream">Gate scanner</h1>
        <p className="mt-1.5 text-center text-sm font-semibold text-cream/60">
          Real Essence Festival 2.0 — staff only
        </p>

        {SCANNER_DEMO && (
          <p className="mt-4 rounded-xl bg-yellow-deep px-3 py-2.5 text-center text-[12px] font-bold leading-snug text-ink">
            Demo build — sample guests, nothing saved.
            <span className="mt-0.5 block font-extrabold uppercase tracking-wide">
              PIN {DEMO_PIN}
            </span>
          </p>
        )}

        <label className="mt-7 block text-[11px] font-extrabold uppercase tracking-widest text-cream/60">
          Which gate is this?
          <input
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            placeholder="Main gate"
            autoComplete="off"
            className="mt-1.5 w-full rounded-xl border-2 border-cream/25 bg-transparent px-4 py-3 text-[16px] font-semibold normal-case tracking-normal text-cream placeholder:text-cream/30"
          />
        </label>

        <label className="mt-4 block text-[11px] font-extrabold uppercase tracking-widest text-cream/60">
          Staff PIN
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            className="mt-1.5 w-full rounded-xl border-2 border-cream/25 bg-transparent px-4 py-3 text-center text-[22px] font-bold tracking-[0.4em] text-cream"
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 text-center text-sm font-bold text-[#ff8a8a]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !pin}
          className="mt-5 w-full rounded-full bg-yellow-deep py-4 text-base font-extrabold uppercase tracking-wide text-ink disabled:opacity-50"
        >
          {busy ? "Loading the guest list…" : "Start scanning"}
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-cream/40">
          Signing in downloads the guest list to this phone so it keeps working
          with no signal. Sign out at the end of your shift to wipe it.
        </p>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ManualEntry({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const normalised = normaliseTicket(code);
  const valid = isWellFormedTicket(normalised);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/92 p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Enter a ticket number"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSubmit(normalised);
        }}
        className="w-full max-w-[360px]"
      >
        <h2 className="font-display text-center text-2xl text-cream">Ticket number</h2>
        <p className="mt-1 text-center text-[12px] font-semibold text-cream/55">
          It&apos;s printed under the QR in their email.
        </p>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="REF2-XXXX XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="mt-4 w-full rounded-xl border-2 border-cream/30 bg-transparent px-4 py-4 text-center font-mono text-[20px] uppercase tracking-[0.2em] text-cream placeholder:text-cream/25"
        />
        <p className="mt-2 min-h-[18px] text-center text-[11px] font-bold text-cream/45">
          {code && !valid ? "That's not a full ticket number yet." : ""}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border-2 border-cream/25 py-3.5 text-sm font-extrabold uppercase text-cream"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="flex-[2] rounded-full bg-yellow-deep py-3.5 text-sm font-extrabold uppercase text-ink disabled:opacity-40"
          >
            Check
          </button>
        </div>
      </form>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */

function History({
  gate,
  onClose,
}: {
  gate: ReturnType<typeof useGate>;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scan log"
    >
      <div className="mx-auto max-w-[520px]">
        <div className="sticky top-0 flex items-center justify-between bg-ink/95 py-2">
          <h2 className="font-display text-2xl text-cream">Scan log</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-cream/10 px-4 py-2 text-xs font-extrabold uppercase text-cream"
          >
            Close
          </button>
        </div>

        <p className="mb-3 text-[11px] leading-relaxed text-cream/45">
          This device only. A scan shows as <strong>disputed</strong> when the server
          disagreed with what this phone decided offline — usually because another
          gate admitted the same ticket first.
        </p>

        {gate.history.length === 0 && (
          <p className="py-8 text-center text-sm font-semibold text-cream/50">
            Nothing scanned yet.
          </p>
        )}

        <ul className="space-y-1.5 pb-20">
          {gate.history.map((s) => {
            const disputed = s.serverResult && s.serverResult !== s.localResult;
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-cream/[0.06] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[13px] tracking-widest text-cream">
                    {isWellFormedTicket(s.ticket) ? formatTicket(s.ticket) : s.ticket}
                  </p>
                  <p className="text-[11px] font-semibold text-cream/45">
                    {new Date(s.scannedAt).toLocaleTimeString()}
                    {!s.serverResult && " · not uploaded"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                    disputed
                      ? "bg-[#ffb13d] text-ink"
                      : s.localResult === "admitted"
                        ? "bg-green-bright text-white"
                        : s.localResult === "duplicate"
                          ? "bg-[#c25800] text-white"
                          : "bg-red text-white"
                  }`}
                >
                  {disputed ? `disputed · ${s.serverResult}` : s.localResult}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="fixed inset-x-0 bottom-0 bg-ink/95 p-4">
          <button
            type="button"
            onClick={() => {
              if (gate.pending > 0 && !confirm(`${gate.pending} scans haven't uploaded yet. Sign out anyway and lose them?`)) return;
              void gate.signOut();
              onClose();
            }}
            className="mx-auto block max-w-[520px] rounded-full border-2 border-[#ff8a8a]/40 px-6 py-3 text-xs font-extrabold uppercase tracking-wide text-[#ff8a8a]"
          >
            Sign out &amp; wipe this device
          </button>
        </div>
      </div>
    </motion.div>
  );
}
