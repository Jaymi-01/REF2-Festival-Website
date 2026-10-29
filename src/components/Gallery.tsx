"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import photos from "@/data/photos.json";
import Marquee from "./Marquee";

type Photo = {
  id: string;
  cat: string;
  w: number;
  h: number;
  src: string;
  thumb: string;
  portrait: boolean;
};

const ALL = photos as Photo[];

export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);

  const strips = useMemo(
    () => [ALL.slice(0, 26), ALL.slice(26, 52), ALL.slice(52, 76)],
    [],
  );

  const close = useCallback(() => setOpen(null), []);
  // The lightbox walks the whole set, not just the strip a photo came from.
  const step = useCallback(
    (d: number) => setOpen((i) => (i === null ? null : (i + d + ALL.length) % ALL.length)),
    [],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, close, step]);

  return (
    <section id="gallery" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-[1300px] px-5 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="text-center"
        >
          <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-yellow-deep">
            Edition one · receipts
          </p>
          <h2 className="font-display mt-2 text-balance text-[clamp(2.2rem,6vw,4rem)] text-cream">
            We did this already
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-pretty text-[15px] font-semibold leading-relaxed text-cream/80">
            Every photo below is from the last Real Essence Festival. Tap one to
            see it big.
          </p>
        </motion.div>
      </div>

      {/* ---- Scrolling photo walls ---- */}
      <div className="mt-10 space-y-3 sm:space-y-4">
        {strips.map((strip, i) => (
          <Marquee key={i} speed={i === 1 ? 64 : 52} reverse={i === 1} repeat={1}>
            {strip.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setOpen(ALL.indexOf(p))}
                className="group relative mx-1.5 block h-[clamp(120px,19vw,230px)] shrink-0 overflow-hidden rounded-xl border-2 border-cream/20 sm:mx-2"
                style={{ aspectRatio: `${p.w} / ${p.h}` }}
              >
                {/* These tiles are the only way into the lightbox now, so each
                    one needs a name a screen reader can announce. */}
                <span className="sr-only">{`Real Essence Festival — ${p.cat}`}</span>
                <Image
                  src={p.src}
                  alt=""
                  fill
                  sizes="260px"
                  loading="lazy"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <span className="absolute inset-0 bg-red/0 transition-colors duration-200 group-hover:bg-red/25" />
              </button>
            ))}
          </Marquee>
        ))}
      </div>

      {/* ---- Lightbox ---- */}
      <AnimatePresence>
        {open !== null && ALL[open] && (
          <Lightbox
            photo={ALL[open]}
            index={open}
            total={ALL.length}
            onClose={close}
            onStep={step}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function Lightbox({
  photo,
  index,
  total,
  onClose,
  onStep,
}: {
  photo: Photo;
  index: number;
  total: number;
  onClose: () => void;
  onStep: (d: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${total}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[150] grid place-items-center bg-ink/92 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.92, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[86vh] w-full max-w-[min(92vw,1000px)]"
      >
        <div
          className="relative mx-auto overflow-hidden rounded-2xl border-4 border-cream"
          style={{ aspectRatio: `${photo.w} / ${photo.h}`, maxHeight: "80vh" }}
        >
          <Image
            src={photo.src}
            alt={`Real Essence Festival — ${photo.cat}`}
            fill
            sizes="92vw"
            className="object-contain"
            priority
          />
        </div>

        <div className="mt-3 flex items-center justify-center gap-3">
          <LightboxBtn onClick={() => onStep(-1)} label="Previous photo">
            <path d="M15 18l-6-6 6-6" />
          </LightboxBtn>
          <span className="min-w-[72px] text-center text-sm font-bold text-cream/80" style={{ fontVariantNumeric: "tabular-nums" }}>
            {index + 1} / {total}
          </span>
          <LightboxBtn onClick={() => onStep(1)} label="Next photo">
            <path d="M9 18l6-6-6-6" />
          </LightboxBtn>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute -top-3 right-0 grid h-11 w-11 place-items-center rounded-full bg-cream text-ink shadow-lg transition-transform duration-150 hover:scale-105 sm:-right-3"
        >
          <span className="sr-only">Close</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
}

function LightboxBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-full bg-cream/15 text-cream transition-colors duration-150 hover:bg-cream/30"
    >
      <span className="sr-only">{label}</span>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}
