"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { doodleUrl } from "@/lib/doodle";
import { useReducedMotion } from "@/lib/useReducedMotion";

export default function BrandStory() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Kept shallow on purpose — wider offsets pull the group apart and leave
  // the section reading as empty green.
  const packY = useTransform(scrollYProgress, [0, 1], [26, reduced ? 26 : -26]);
  const bowlY = useTransform(scrollYProgress, [0, 1], [40, reduced ? 40 : -16]);
  const mascotY = useTransform(scrollYProgress, [0, 1], [18, reduced ? 18 : -14]);

  return (
    <section
      ref={ref}
      id="story"
      className="relative isolate overflow-hidden bg-green px-5 py-16 sm:py-24 lg:px-10"
    >
      <div
        aria-hidden="true"
        style={{ ["--doodle" as string]: doodleUrl("#ffffff", 0.1) }}
        className="doodle-bg pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto grid max-w-[1250px] items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        {/* mascot */}
        <motion.div
          style={{ y: mascotY }}
          initial={{ opacity: 0, x: -40, rotate: -8 }}
          whileInView={{ opacity: 1, x: 0, rotate: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 15 }}
          className="relative mx-auto w-[clamp(180px,34vw,340px)]"
        >
          <div className="wobble" style={{ ["--wobble-dur" as string]: "5.5s" }}>
            <Image
              src="/brand/mascot.webp"
              alt="Mr Supreme, the Sedaap Supreme Noodles mascot"
              width={595}
              height={891}
              className="h-auto w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.3)]"
            />
          </div>
        </motion.div>

        {/* torn-paper statements + product shots */}
        <div className="relative space-y-2 sm:space-y-4">
          <TornStatement delay={0}>
            With Sedaap Supreme Noodles, it&apos;s more than satisfying cravings.
          </TornStatement>

          <div className="relative flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <motion.div style={{ y: packY }} className="w-[clamp(140px,26vw,260px)]">
              <div className="bob" style={{ ["--bob-dur" as string]: "6s" }}>
                <Image
                  src="/brand/pack-tasty-chicken.webp"
                  alt="Sedaap Supreme Tasty Chicken pack"
                  width={700}
                  height={420}
                  className="h-auto w-full drop-shadow-xl"
                />
              </div>
            </motion.div>
            <motion.div style={{ y: bowlY }} className="w-[clamp(140px,26vw,250px)]">
              <div className="bob" style={{ ["--bob-dur" as string]: "7s", ["--bob-delay" as string]: "0.6s" }}>
                <Image
                  src="/brand/noodle-bowl.webp"
                  alt="A bowl of Supreme Noodles with chicken"
                  width={600}
                  height={549}
                  className="h-auto w-full drop-shadow-xl"
                />
              </div>
            </motion.div>
            <motion.div style={{ y: packY }} className="w-[clamp(140px,26vw,260px)]">
              <div className="bob" style={{ ["--bob-dur" as string]: "6.5s", ["--bob-delay" as string]: "1.1s" }}>
                <Image
                  src="/brand/pack-rich-spices.webp"
                  alt="Sedaap Supreme Chicken Flavour with Rich Spices pack"
                  width={700}
                  height={495}
                  className="h-auto w-full drop-shadow-xl"
                />
              </div>
            </motion.div>
          </div>

          <TornStatement delay={0.15} align="right">
            It&apos;s about making every moment more exciting.
          </TornStatement>
        </div>
      </div>
    </section>
  );
}

function TornStatement({
  children,
  delay,
  align = "left",
}: {
  children: React.ReactNode;
  delay: number;
  align?: "left" | "right";
}) {
  return (
    <motion.blockquote
      initial={{ opacity: 0, y: 24, rotate: align === "right" ? 2 : -2 }}
      whileInView={{ opacity: 1, y: 0, rotate: align === "right" ? 1 : -1 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ type: "spring", stiffness: 110, damping: 15, delay }}
      className={`relative max-w-[32ch] bg-cream px-6 py-5 sm:px-8 sm:py-6 ${
        align === "right" ? "ml-auto" : ""
      }`}
      style={{
        // torn top and bottom edges, drawn with clip-path
        clipPath:
          "polygon(0% 7%, 6% 2%, 14% 8%, 23% 1%, 33% 7%, 44% 2%, 55% 8%, 66% 2%, 77% 8%, 88% 2%, 96% 7%, 100% 3%, 100% 93%, 94% 98%, 85% 92%, 74% 98%, 63% 92%, 52% 98%, 41% 92%, 30% 98%, 19% 92%, 9% 98%, 0% 94%)",
      }}
    >
      <p className="font-display text-[clamp(1.15rem,2.5vw,1.9rem)] leading-tight text-ink">
        {children}
      </p>
    </motion.blockquote>
  );
}
