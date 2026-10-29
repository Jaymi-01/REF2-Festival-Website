"use client";

import { motion } from "motion/react";
import Marquee from "./Marquee";

export default function FinalCta() {
  return (
    <section className="relative bg-cream py-14 text-center sm:py-20">
      <div className="mx-auto max-w-[900px] px-5">
        <motion.h2
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="font-display text-balance text-[clamp(2.2rem,7vw,4.4rem)] leading-[0.95] text-red"
        >
          See you at the Real Essence Festival 2.0.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mx-auto mt-4 max-w-[42ch] text-pretty text-[clamp(1rem,2vw,1.2rem)] font-bold leading-relaxed text-ink/80"
        >
          Two days. Zero naira at the gate. Register so we know to expect you.
        </motion.p>

        <motion.a
          href="#top"
          initial={{ opacity: 0, scale: 0.88 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          whileHover={{ scale: 1.05, rotate: -1.5 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.15 }}
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-red px-10 py-5 text-xl font-extrabold uppercase tracking-wide text-cream shadow-[0_9px_0_#6d0005] transition-colors duration-150 hover:bg-red-bright"
        >
          Register Now!
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </motion.a>
      </div>

      <div className="mt-12 border-y-4 border-red bg-red py-2">
        <Marquee speed={28} reverse>
          {["Real Essence Festival 2.0", "7–8 Nov 2026", "Ikeja City Mall", "Free entry"].map((w) => (
            <span
              key={w}
              className="font-display flex items-center whitespace-nowrap px-6 text-[clamp(1rem,2.2vw,1.7rem)] text-cream"
            >
              {w}
              <span aria-hidden="true" className="ml-6 text-yellow-deep">
                ★
              </span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
