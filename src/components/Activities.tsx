"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ACTIVITIES, type Activity } from "@/data/activities";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function Activities() {
  return (
    <section id="activities" className="relative px-5 py-16 sm:py-24 lg:px-10">
      <div className="mx-auto max-w-[1300px]">
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="mx-auto max-w-[46ch] text-center"
        >
          <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-yellow-deep">
            Two days · One place
          </p>
          <h2 className="font-display mt-2 text-balance text-[clamp(2.2rem,6vw,4rem)] text-cream">
            Everything going down
          </h2>
          <p className="mt-3 text-pretty text-[15px] font-semibold leading-relaxed text-cream/80">
            Six reasons to show up. Hover a card or tap it on a phone to see what
            you&apos;re walking into.
          </p>
        </motion.div>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIVITIES.map((a, i) => (
            <ActivityCard key={a.id} activity={a} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  // Pointer-follow tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 220, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-11, 11]), { stiffness: 220, damping: 20 });

  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.li
      initial={{ opacity: 0, y: 26, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1], delay: (index % 3) * 0.08 }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => {
          reset();
          setRevealed(false);
        }}
        onPointerEnter={(e) => e.pointerType === "mouse" && setRevealed(true)}
        style={{
          rotateX: reduced ? 0 : rx,
          rotateY: reduced ? 0 : ry,
          rotate: reduced ? 0 : activity.tilt,
          transformStyle: "preserve-3d",
        }}
        whileHover={reduced ? undefined : { scale: 1.03, z: 24 }}
        transition={{ type: "spring", stiffness: 240, damping: 20 }}
        className="group relative h-full"
      >
        {/* The whole card is one button so keyboard gets the same reveal. */}
        <button
          type="button"
          aria-expanded={revealed}
          onClick={() => setRevealed((v) => !v)}
          onFocus={() => setRevealed(true)}
          onBlur={() => setRevealed(false)}
          className="block w-full cursor-pointer text-left"
        >
          <div className="overflow-hidden rounded-[22px] border-[5px] border-cream bg-cream shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-ink/10">
              <Image
                src={activity.photo}
                alt={`${activity.title} at the last Real Essence Festival`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-110"
              />

              {/* reveal panel — the mockup's on-hover copy */}
              <motion.div
                initial={false}
                animate={
                  revealed
                    ? { opacity: 1, y: "0%" }
                    : { opacity: 0, y: reduced ? "0%" : "12%" }
                }
                transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-red/95 px-5 text-center"
                aria-hidden={!revealed}
              >
                <BuntingSvg />
                <p className="text-pretty text-[15px] font-bold leading-snug text-cream">
                  {activity.blurb}
                </p>
              </motion.div>

              <span
                aria-hidden="true"
                className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-yellow-deep text-xl shadow-md transition-transform duration-200 group-hover:rotate-12"
              >
                {activity.emoji}
              </span>
            </div>

            <div className="px-4 py-3.5">
              <h3 className="font-display text-center text-[clamp(1.25rem,2.4vw,1.7rem)] text-red">
                {activity.title}
              </h3>
            </div>
          </div>
        </button>
      </motion.div>
    </motion.li>
  );
}

/** The bunting from the mockup's hover cards, inline so it inherits colour. */
function BuntingSvg() {
  return (
    <svg
      viewBox="0 0 300 36"
      className="h-6 w-[78%] text-yellow-deep"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M2 6q75 20 148 8T298 4" strokeLinecap="round" />
      {[22, 58, 94, 130, 166, 202, 238, 272].map((x, i) => (
        <path
          key={x}
          d={`M${x} ${11 + Math.sin(i) * 2} l11 1 -5 16z`}
          fill={i % 2 ? "currentColor" : "none"}
        />
      ))}
    </svg>
  );
}
