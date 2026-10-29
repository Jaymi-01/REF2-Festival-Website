"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const GLYPHS = ["🍜", "🎉", "⭐", "🎈", "🥢", "✱"];

type Bit = {
  el: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  rot: number;
  vr: number;
};

/**
 * Festival confetti that trails the pointer. Mouse-only (a finger already has
 * a touch target under it), disabled under reduced motion, and capped so it
 * can never become a performance problem on a long page.
 */
export default function CursorTrail() {
  const reduced = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const layer = layerRef.current;
    if (!layer) return;

    const bits: Bit[] = [];
    const MAX = 26;
    let last = { x: 0, y: 0 };
    let since = 0;
    let frame = 0;
    let running = true;

    const spawn = (x: number, y: number) => {
      if (bits.length >= MAX) {
        const old = bits.shift();
        old?.el.remove();
      }
      const el = document.createElement("span");
      el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      el.style.cssText =
        "position:fixed;left:0;top:0;font-size:17px;will-change:transform,opacity;user-select:none;";
      layer.appendChild(el);
      bits.push({
        el,
        x,
        y,
        vx: (Math.random() - 0.5) * 1.6,
        vy: -(0.6 + Math.random() * 1.1),
        life: 1,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 9,
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const d = Math.hypot(e.clientX - last.x, e.clientY - last.y);
      since += d;
      last = { x: e.clientX, y: e.clientY };
      if (since > 68) {
        since = 0;
        spawn(e.clientX, e.clientY);
      }
    };

    const tick = () => {
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.07;
        b.rot += b.vr;
        b.life -= 0.016;
        if (b.life <= 0) {
          b.el.remove();
          bits.splice(i, 1);
          continue;
        }
        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.rot}deg) scale(${b.life})`;
        b.el.style.opacity = String(Math.min(1, b.life * 1.4));
      }
      if (running) frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      bits.forEach((b) => b.el.remove());
    };
  }, [reduced]);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90]"
    />
  );
}
