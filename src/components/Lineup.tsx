"use client";

import Image from "next/image";
import { motion } from "motion/react";

/**
 * The lineup cards stay flexible while confirmed performers can be added with
 * their supplied artwork and name.
 */
const SLOTS = [
  {
    role: "Music Performance - Rybeena",
    hint: "Live performance",
    image: "/line-ups/Rybeena.jpeg",
    date: "(Performing - 8th November)",
  },
  { role: "DJ", hint: "Decks all day" },
  { role: "MC", hint: "Keeping it moving" },
  {
    role: "Music Performance - T. I. Blaze",
    hint: "Live performance",
    image: "/line-ups/T. I. Blaze.PNG",
    date: "(Performing - 7th November)",
  },
  { role: "Guest", hint: "Surprise drop-in" },
  { role: "Guest", hint: "Surprise drop-in" },
];

export default function Lineup() {
  return (
    <section id="lineup" className="relative px-5 py-16 sm:py-24 lg:px-10">
      <div className="mx-auto max-w-[1250px]">
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="text-center"
        >
          <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-yellow-deep">
            The line-up
          </p>
          <h2 className="font-display mt-2 text-balance text-[clamp(2.2rem,6vw,4rem)] text-cream">
            Names dropping soon
          </h2>
          <p className="mx-auto mt-3 max-w-[44ch] text-pretty text-[15px] font-semibold leading-relaxed text-cream/80">
            We&apos;re still locking in the bill. Register and you&apos;ll be the first to
            know who&apos;s playing.
          </p>
        </motion.div>

        <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
          {SLOTS.map((s, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, ease: [0.2, 0, 0, 1], delay: (i % 3) * 0.08 }}
            >
              <motion.div
                whileHover={{ y: -8, rotate: i % 2 ? 1.5 : -1.5 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="group relative overflow-hidden rounded-[20px] border-[3px] border-cream/25 bg-ink/45"
              >
                <div className="relative grid aspect-[5/4] place-items-center overflow-hidden">
                  {s.image ? (
                    <Image
                      src={s.image}
                      alt={`${s.role} at Real Essence Festival 2.0`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      loading="lazy"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <>
                      {/* Animated static keeps an unannounced slot intentional. */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.16]"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(135deg, #fff9ec 0 2px, transparent 2px 9px)",
                        }}
                      />
                      <div className="relative text-center">
                        <motion.span
                          aria-hidden="true"
                          className="block text-[clamp(2rem,6vw,3.4rem)]"
                          animate={{ rotate: [0, -8, 8, 0] }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            repeatDelay: i * 0.6,
                            ease: "easeInOut",
                          }}
                        >
                          ?
                        </motion.span>
                        <span className="mt-1 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-cream/55">
                          {s.hint}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t-[3px] border-cream/25 px-4 py-3">
                  <div className="min-w-0 text-center">
                    <h3 className="font-display text-[clamp(0.85rem,2vw,1.35rem)] leading-tight text-cream">
                      {s.role}
                    </h3>
                    {s.date && (
                      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-yellow-deep">
                        {s.date}
                      </p>
                    )}
                  </div>
                  {!s.image && (
                    <span className="rounded-full bg-yellow-deep/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ink">
                      TBA
                    </span>
                  )}
                </div>
              </motion.div>
            </motion.li>
          ))}
        </ul>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-12 flex flex-col items-center justify-between gap-6 rounded-[24px] border-[3px] border-cream/20 bg-cream/[0.06] px-6 py-7 text-center md:flex-row md:text-left"
        >
          <p className="max-w-[46ch] text-pretty text-[clamp(1rem,1.9vw,1.3rem)] font-bold leading-snug text-cream">
            Come for the food. Stay for the music, the games and the vibes. Whatever
            brings you, there&apos;s a whole lot of fun waiting for you.
          </p>
          <motion.a
            href="#register"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-green px-7 py-4 text-lg font-extrabold text-cream shadow-[0_8px_0_#063317] transition-colors duration-150 hover:bg-green-bright"
          >
            Register Now!
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
