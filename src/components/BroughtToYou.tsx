"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function BroughtToYou() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const badgeRot = useTransform(scrollYProgress, [0, 1], [-40, reduced ? -40 : 40]);

  return (
    <section ref={ref} className="relative px-5 py-16 sm:py-24 lg:px-10">
      <div className="mx-auto grid max-w-[1250px] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        {/* ---- Wordmark lockup, rebuilt as live type ---- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
          className="relative text-center lg:text-left"
        >
          <motion.p
            initial={{ opacity: 0, rotate: -12, y: 10 }}
            whileInView={{ opacity: 1, rotate: -8, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 140, damping: 12, delay: 0.1 }}
            className="font-display inline-block text-[clamp(1.2rem,3vw,2rem)] text-yellow-deep"
          >
            Brought to you by
          </motion.p>

          <div className="relative">
            <h2 className="font-display text-[clamp(3rem,10vw,7rem)] leading-[0.88] text-cream">
              <motion.span
                initial={{ opacity: 0, x: -30, rotate: -6 }}
                whileInView={{ opacity: 1, x: 0, rotate: -3 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 110, damping: 14, delay: 0.15 }}
                className="block"
              >
                Supreme
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 30, rotate: 6 }}
                whileInView={{ opacity: 1, x: 0, rotate: 2 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 110, damping: 14, delay: 0.25 }}
                className="block pl-[0.12em]"
              >
                Noodles
              </motion.span>
            </h2>

            {/* the badge sits over the wordmark, spinning as you scroll */}
            <motion.div
              style={{ rotate: badgeRot }}
              className="pointer-events-none absolute left-[46%] top-[14%] w-[clamp(60px,13vw,120px)] -translate-x-1/2"
            >
              <Image
                src="/brand/supreme-badge.webp"
                alt=""
                width={200}
                height={200}
                className="h-auto w-full drop-shadow-lg"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* ---- Body copy with the mockup's highlighter marks ---- */}
        <HighlightedCopy />
      </div>
    </section>
  );
}

function HighlightedCopy() {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduced = useReducedMotion();

  /** Marker sweeps in left-to-right as the line enters view. */
  const mark = (text: string, delay: number) => (
    <motion.span
      className="marker"
      initial={{ "--marker-size": "0%" } as never}
      animate={inView ? ({ "--marker-size": "100%" } as never) : undefined}
      transition={{ duration: reduced ? 0.2 : 0.5, ease: [0.2, 0, 0, 1], delay: reduced ? 0 : delay }}
    >
      {text}
    </motion.span>
  );

  return (
    <motion.p
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
      className="text-pretty text-[clamp(1.05rem,2.1vw,1.5rem)] font-bold leading-[1.55] text-cream"
    >
      The Real Essence Festival brings {mark("flavour, music, games and culture", 0.2)}{" "}
      together for one exciting experience. Now in its {mark("second edition", 0.5)},
      we&apos;re turning up the fun with more to taste, more to play and more memories to
      make with your {mark("favourite people", 0.75)}.
    </motion.p>
  );
}
