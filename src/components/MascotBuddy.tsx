"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Mr Supreme pops up after you've scrolled a while, and reacts to the cursor. */
const LINES = [
  "Oya, register now now!",
  "₦1,000,000 for the cook-off. No pressure.",
  "I'll be there. Will you?",
  "Free entry, free goodie bags. Free everything.",
  "Tap me again, I dare you.",
];

const SCROLL_TOP_AT = 900;

export default function MascotBuddy() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [taps, setTaps] = useState(0);
  const [line, setLine] = useState<string | null>(null);
  const [partyMode, setPartyMode] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_TOP_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  async function onTap() {
    const next = taps + 1;
    setTaps(next);
    setLine(LINES[next % LINES.length]);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLine(null), 3200);

    // Easter egg: five taps turns the whole page into a party.
    if (next === 5 && !partyMode) {
      setPartyMode(true);
      setLine("NOODLE RAIN! 🍜");
      if (!reduced) {
        const { default: confetti } = await import("canvas-confetti");
        const end = Date.now() + 2600;
        const burst = () => {
          confetti({
            particleCount: 6,
            angle: 60,
            spread: 70,
            origin: { x: 0, y: 0.7 },
            colors: ["#ffd701", "#b10008", "#0a4e24"],
          });
          confetti({
            particleCount: 6,
            angle: 120,
            spread: 70,
            origin: { x: 1, y: 0.7 },
            colors: ["#ffd701", "#b10008", "#fff9ec"],
          });
          if (Date.now() < end) requestAnimationFrame(burst);
        };
        burst();
      }
      setTimeout(() => setPartyMode(false), 4000);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 70, scale: 0.7 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 70, scale: 0.7 }}
          transition={{ type: "spring", stiffness: 160, damping: 16 }}
          className="fixed bottom-2 right-1 z-[95] flex items-end gap-2 sm:bottom-3 sm:right-2"
        >
          <AnimatePresence>
            {line && (
              <motion.div
                initial={{ opacity: 0, x: 14, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className="relative mb-6 max-w-[190px] rounded-2xl rounded-br-sm border-[3px] border-ink bg-cream px-3.5 py-2.5 text-[13px] font-extrabold leading-snug text-ink shadow-lg"
                role="status"
              >
                {line}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={onTap}
            whileHover={reduced ? undefined : { scale: 1.08, y: -6 }}
            whileTap={{ scale: 0.92 }}
            animate={
              partyMode && !reduced
                ? { rotate: [0, -12, 12, -12, 0] }
                : reduced
                  ? undefined
                  : { y: [0, -4, 0], rotate: [0, 1.5, 0] }
            }
            transition={
              partyMode && !reduced
                ? { duration: 0.8, ease: "easeInOut" }
                : reduced
                  ? { type: "spring", stiffness: 300, damping: 16 }
                  : { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }
            className="relative w-[clamp(56px,11vw,86px)] origin-bottom cursor-pointer"
          >
            <span className="sr-only">
              Mr Supreme says hello — tap for a message
            </span>
            <Image
              src="/brand/mascot.webp"
              alt=""
              width={300}
              height={449}
              className="h-auto w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)]"
            />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
