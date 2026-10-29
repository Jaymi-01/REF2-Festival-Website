"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";

/** The mockup's red circle-and-chevron, plus a scroll-progress ring. */
export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 1200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="#top"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          /* cream ring so the button reads on red, green and cream alike */
          className="fixed bottom-4 left-3 z-[95] grid h-12 w-12 place-items-center rounded-full border-[3px] border-cream bg-red text-cream shadow-[0_6px_14px_rgba(0,0,0,0.35)] sm:bottom-6 sm:left-5 sm:h-14 sm:w-14"
        >
          <span className="sr-only">Back to the top</span>
          <svg
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
            aria-hidden="true"
          >
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#ffd701"
              strokeWidth="5"
              strokeLinecap="round"
              pathLength={1}
              style={{ pathLength: progress }}
            />
          </svg>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="relative"
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
