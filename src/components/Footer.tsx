"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { doodleUrl } from "@/lib/doodle";

const SOCIALS = [
  { id: "social-tiktok", label: "TikTok", href: "https://vm.tiktok.com/ZS9ymK85pcGNe-5yMOW/" },
  { id: "social-instagram", label: "Instagram", href: "https://www.instagram.com/supremenoodlesng?cplk=MTgzaG44cDlwZTk1dQ==" },
  { id: "social-x", label: "X", href: "https://x.com/SSupremeNoodles" },
  { id: "social-facebook", label: "Facebook", href: "https://www.facebook.com/share/1Taj2S1UCR/" },
  { id: "social-youtube", label: "YouTube", href: "https://www.youtube.com/@sedaapsupremenoodles" },
];

export default function Footer() {
  return (
    <footer className="on-yellow relative isolate overflow-hidden bg-yellow-deep px-5 py-14 text-ink lg:px-10">
      <div
        aria-hidden="true"
        style={{ ["--doodle" as string]: doodleUrl("#8a6f10", 0.22) }}
        className="doodle-bg pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto grid max-w-[1250px] gap-10 md:grid-cols-3">
        <div>
          <h2 className="font-display text-[clamp(1.7rem,4vw,2.4rem)]">Contact</h2>
          <address className="mt-3 space-y-3 text-[15px] font-semibold not-italic leading-relaxed">
            <p>
              Seedap Supreme Noodles
              <br />
              Plot 4 – 6, Block 1, Industrial Opic
              <br />
              Estate, Agbara, Ogun State.
            </p>
            <p>
              <a
                href="mailto:info@sedaapsupremenoodles.org"
                className="underline decoration-2 underline-offset-4 transition-colors duration-150 hover:text-red"
              >
                info@sedaapsupremenoodles.org
              </a>
            </p>
            <p className="text-ink/75">
              For more enquiries, send us a DM on our social media platforms.
            </p>
          </address>
        </div>

        <div className="md:text-center">
          <h2 className="font-display text-[clamp(1.7rem,4vw,2.4rem)]">Follow Us</h2>
          <ul className="mt-4 flex gap-4 md:justify-center">
            {SOCIALS.map((s) => (
              <li key={s.id}>
                <motion.a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -4, rotate: -6 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 340, damping: 16 }}
                  className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 transition-colors duration-150 hover:bg-ink/12"
                >
                  <span className="sr-only">{s.label}</span>
                  <Image
                    src={`/brand/${s.id}.webp`}
                    alt=""
                    width={26}
                    height={26}
                    className="h-6 w-auto"
                  />
                </motion.a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:text-right">
          <motion.a
            href="#register"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="inline-flex items-center gap-2 rounded-full bg-red px-7 py-4 text-base font-extrabold uppercase tracking-wide text-cream shadow-[0_7px_0_#6d0005] transition-colors duration-150 hover:bg-red-bright"
          >
            Register free
          </motion.a>
          <p className="mt-5 text-[13px] font-semibold text-ink/70">
            7–8 November 2026
            <br />
            Ikeja City Mall, Lagos · 9am
          </p>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-[1250px] border-t-2 border-ink/15 pt-5 text-center text-[13px] font-semibold text-ink/70">
        © 2026 Sedaap Supreme Noodles. All Rights Reserved
      </div>
    </footer>
  );
}
