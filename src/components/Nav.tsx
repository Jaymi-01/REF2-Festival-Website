"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#activities", label: "The Experience" },
  { href: "#lineup", label: "Who’s Playing" },
  { href: "#gallery", label: "Festival Moments" },
  { href: "#story", label: "Sedaap Story" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(LINKS[0].href.slice(1));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keep the navigation state aligned with the section currently under the
  // visitor's reading position rather than relying on the URL hash.
  useEffect(() => {
    const sections = LINKS.map((link) => document.getElementById(link.href.slice(1))).filter(
      (section): section is HTMLElement => Boolean(section),
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
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
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                aria-current={activeSection === l.href.slice(1) ? "page" : undefined}
                className={cn(
                  "relative text-sm font-bold uppercase tracking-wide transition-colors duration-150 after:absolute after:-bottom-1.5 after:left-0 after:h-[3px] after:rounded-full after:bg-yellow-deep after:transition-[width] after:duration-200 hover:text-yellow-deep",
                  activeSection === l.href.slice(1)
                    ? "text-yellow-deep after:w-full"
                    : "text-cream/90 after:w-0 hover:after:w-full",
                )}
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
            className="grid h-11 w-11 place-items-center text-cream transition-colors duration-150 hover:text-yellow-deep md:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <motion.svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <motion.line
                animate={open ? { x1: 5, y1: 5, x2: 19, y2: 19 } : { x1: 3, y1: 7, x2: 21, y2: 7 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              />
              <motion.line
                animate={open ? { opacity: 0 } : { opacity: 1, x1: 3, y1: 12, x2: 21, y2: 12 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              />
              <motion.line
                animate={open ? { x1: 5, y1: 19, x2: 19, y2: 5 } : { x1: 3, y1: 17, x2: 21, y2: 17 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              />
            </motion.svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
            className="absolute inset-x-0 top-[var(--nav-h)] origin-top overflow-hidden border-t border-yellow-deep/60 bg-red px-5 pb-5 pt-3 shadow-2xl md:hidden"
          >
            <ul className="space-y-0">
              {[...LINKS, { href: "#register", label: "Register free" }].map((l) => (
                <li key={l.href} className={l.href === "#register" ? "pt-3" : "border-b border-cream/15"}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={activeSection === l.href.slice(1) ? "page" : undefined}
                    className={cn(
                      "block px-2 py-3.5 text-base font-extrabold uppercase tracking-wide transition-colors duration-150",
                      l.href === "#register"
                        ? "rounded-full bg-yellow-deep text-center text-ink hover:bg-yellow"
                        : activeSection === l.href.slice(1)
                          ? "bg-cream/10 text-yellow-deep"
                          : "text-cream/90 hover:text-yellow-deep",
                    )}
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
