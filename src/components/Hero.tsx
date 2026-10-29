"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { doodleUrl } from "@/lib/doodle";
import RegisterForm from "./RegisterForm";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Decorative props that drift at different depths behind the logo. */
const FLOATERS = [
  { src: "/brand/pack-tasty-chicken.webp", alt: "", cls: "left-[-2%] top-[16%] w-[13vw] max-w-[180px]", depth: 90, rot: -14, dur: 6.5 },
  { src: "/brand/pack-rich-spices.webp", alt: "", cls: "right-[-1%] top-[6%] w-[12vw] max-w-[170px]", depth: 140, rot: 12, dur: 7.5 },
  { src: "/brand/noodle-bowl.webp", alt: "", cls: "left-[-1%] bottom-[6%] w-[11vw] max-w-[150px]", depth: 60, rot: 8, dur: 5.5 },
  { src: "/brand/goodie-bag.webp", alt: "", cls: "right-[1%] bottom-[4%] w-[10vw] max-w-[130px]", depth: 110, rot: -10, dur: 8 },
];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const logoY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -140]);
  const logoScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 0.86]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 120]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduced ? 1 : 0.25]);

  return (
    <section
      ref={ref}
      id="top"
      className="on-yellow relative isolate overflow-hidden bg-yellow pt-[calc(var(--nav-h)+8px)]"
    >
      {/* doodle wallpaper, parallaxed */}
      <motion.div
        aria-hidden="true"
        style={{ y: bgY, ["--doodle" as string]: doodleUrl("#8a6f10", 0.3) }}
        className="doodle-bg pointer-events-none absolute inset-0 -z-10 h-[125%]"
      />

      {/* floating product props */}
      {FLOATERS.map((f, i) => (
        <Floater key={i} {...f} progress={scrollYProgress} reduced={reduced} />
      ))}

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-8 px-5 pb-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-10 lg:pb-16">
        {/* ---------------- Left: logo + promise ---------------- */}
        <motion.div style={{ opacity: fade }} className="relative z-10 text-center">
          <motion.div
            style={{ y: logoY, scale: logoScale }}
            initial={{ opacity: 0, scale: 0.72, rotate: -7 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 110, damping: 13, delay: 0.1 }}
            className="relative mx-auto w-full max-w-[560px]"
          >
            <div className="wobble sticker-shadow">
              <Image
                src="/brand/festival-logo.webp"
                alt="Real Essence Festival 2.0, brought to you by Sedaap Supreme Noodles"
                width={854}
                height={754}
                priority
                className="h-auto w-full"
              />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.45, ease: [0.2, 0, 0, 1], delay: 0.45 }}
            className="font-display mt-2 text-balance text-[clamp(1.6rem,4.4vw,2.9rem)] text-green"
          >
            Taste the real essence of Fun
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.45, ease: [0.2, 0, 0, 1], delay: 0.55 }}
            className="mx-auto mt-3 max-w-[30ch] text-pretty text-[clamp(1rem,1.7vw,1.22rem)] font-bold leading-[1.45] text-ink"
          >
            Delicious Sedaap Supreme Noodles. Great music. Cool games. Unforgettable vibes. The best moments
            happen when we come together.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.68 }}
            className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border-2 border-ink/15 bg-cream/70 px-5 py-2 text-sm font-extrabold uppercase tracking-[0.06em] text-ink"
          >
            <span>7–8 Nov 2026</span>
            <span aria-hidden="true" className="hidden text-red sm:inline">
              ●
            </span>
            <span>Ikeja City Mall</span>
            <span aria-hidden="true" className="hidden text-red sm:inline">
              ●
            </span>
            <span className="text-green">Free entry</span>
          </motion.p>
        </motion.div>

        {/* ---------------- Right: the one primary action ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 36, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.3 }}
          className="relative z-10 flex justify-center"
        >
          <RegisterForm />
        </motion.div>
      </div>
    </section>
  );
}

function Floater({
  src,
  alt,
  cls,
  depth,
  rot,
  dur,
  progress,
  reduced,
}: {
  src: string;
  alt: string;
  cls: string;
  depth: number;
  rot: number;
  dur: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduced: boolean;
}) {
  const y = useTransform(progress, [0, 1], [0, reduced ? 0 : depth]);
  return (
    <motion.div
      aria-hidden="true"
      style={{ y, rotate: rot }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 70, damping: 14, delay: 0.5 }}
      className={`pointer-events-none absolute -z-[5] hidden select-none xl:block ${cls}`}
    >
      <div
        className="bob drop-shadow-[0_14px_18px_rgba(0,0,0,0.16)]"
        style={
          { "--bob-dur": `${dur}s`, "--bob-dist": "-18px" } as React.CSSProperties
        }
      >
        <Image src={src} alt={alt} width={400} height={300} className="h-auto w-full" />
      </div>
    </motion.div>
  );
}
