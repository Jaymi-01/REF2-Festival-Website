"use client";

import { motion } from "motion/react";
import Marquee from "./Marquee";
import { FESTIVAL } from "@/lib/utils";
import { useMounted, useNow } from "@/lib/useReducedMotion";

const UNITS = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Mins" },
  { key: "seconds", label: "Secs" },
] as const;

/** Server-render value — the real clock is only read after mount. */
const ZERO = { days: 0, hours: 0, minutes: 0, seconds: 0, done: false };

function remaining(to: Date) {
  const ms = Math.max(0, to.getTime() - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor(ms / 3_600_000) % 24,
    minutes: Math.floor(ms / 60_000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
    done: ms === 0,
  };
}

export default function DateVenue() {
  const mounted = useMounted();
  // `useNow` ticks once a second from an external store, so the clock is never
  // read during render — reading it there makes Next refuse to prerender.
  useNow(1000);
  const t = mounted ? remaining(FESTIVAL.startsAt) : ZERO;

  return (
    <section className="relative bg-cream py-12 text-center sm:py-16">
      <div className="mx-auto max-w-[1100px] px-5">
        <motion.h2
          initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="font-display text-balance text-[clamp(2.1rem,6.6vw,4.6rem)] text-red"
        >
          {FESTIVAL.dateLabel}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1], delay: 0.1 }}
          className="font-display mt-1 text-[clamp(1.6rem,5vw,3.6rem)] text-red"
        >
          {FESTIVAL.venue} | {FESTIVAL.doors}
        </motion.p>

        {/* Countdown. Renders dashes until mounted so server and client agree. */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, delay: 0.2 }}
          /* A 4-up grid rather than a wrapping flex row — wrapping stranded
             "Secs" on its own line with a dangling colon on narrow phones. */
          className="mx-auto mt-7 grid max-w-[520px] grid-cols-4 items-center gap-2 sm:gap-3"
        >
          {t.done ? (
            <p className="font-display col-span-4 text-2xl text-green">
              It&apos;s happening right now — come through.
            </p>
          ) : (
            UNITS.map((u) => (
              <div key={u.key}>
                <div className="rounded-2xl border-[3px] border-red bg-yellow px-2 py-2.5 sm:px-4 sm:py-3.5">
                  <div
                    className="font-display text-[clamp(1.7rem,5vw,3rem)] leading-none text-red"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {mounted ? String(t[u.key]).padStart(2, "0") : "––"}
                  </div>
                  <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink/70 sm:text-xs">
                    {u.label}
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>

        <p className="sr-only" aria-live="off">
          {mounted && !t.done
            ? `${t.days} days, ${t.hours} hours and ${t.minutes} minutes until the festival opens.`
            : ""}
        </p>
      </div>

      {/* ticker */}
      <div className="mt-10 border-y-4 border-red bg-yellow py-2.5 sm:py-3">
        <Marquee speed={38}>
          {["Delicious Sedaap Supreme Noodles", "Great music", "Cool games", "Free entry", "₦1,000,000 cook-off", "Goodie bags", "Unforgettable vibes"].map(
            (w) => (
              <span
                key={w}
                className="font-display flex items-center whitespace-nowrap px-5 text-[clamp(1.1rem,2.4vw,1.9rem)] text-red sm:px-7"
              >
                {w}
                <span aria-hidden="true" className="ml-5 text-green sm:ml-7">
                  ✱
                </span>
              </span>
            ),
          )}
        </Marquee>
      </div>
    </section>
  );
}
