"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#activities", label: "What's On" },
  { href: "#lineup", label: "Line-up" },
  { href: "#gallery", label: "Last Year" },
  { href: "#story", label: "The Brand" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the sheet on Escape, and lock the page behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      /* Always filled: the bar sits over the yellow hero, where cream text on
         a transparent background is unreadable. */
      className={cn(
        "fixed inset-x-0 top-0 z-[100] h-[var(--nav-h)] bg-red transition-shadow duration-200",
        scrolled && "shadow-lg shadow-black/25",
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-4 px-5 lg:px-10"
      >
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/brand/supreme-badge.webp"
            alt=""
            width={44}
            height={44}
            className="h-10 w-10 drop-shadow-md"
          />
          <span className="font-display hidden text-lg leading-none text-cream sm:block">
            REF&nbsp;2.0
          </span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="relative text-sm font-bold uppercase tracking-wide text-cream/90 transition-colors duration-150 hover:text-yellow-deep after:absolute after:-bottom-1.5 after:left-0 after:h-[3px] after:w-0 after:rounded-full after:bg-yellow-deep after:transition-[width] after:duration-200 hover:after:w-full"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <motion.a
            href="#register"
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="hidden rounded-full bg-yellow-deep px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-ink transition-colors duration-150 hover:bg-yellow sm:block"
          >
            Register free
          </motion.a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="grid h-11 w-11 place-items-center rounded-full bg-cream/15 text-cream md:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="absolute inset-x-0 top-[var(--nav-h)] origin-top border-t-4 border-yellow-deep bg-red px-5 py-6 shadow-2xl md:hidden"
          >
            <ul className="space-y-1">
              {[...LINKS, { href: "#register", label: "Register free" }].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 font-display text-2xl text-cream transition-colors duration-150 hover:bg-cream/10 hover:text-yellow-deep"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
