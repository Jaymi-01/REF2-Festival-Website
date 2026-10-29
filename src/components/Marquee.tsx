"use client";

import { cn } from "@/lib/utils";

/**
 * Infinite ticker. Duplicates its children once and translates -50%, so the
 * loop is seamless at any content width. Pauses on hover and under
 * prefers-reduced-motion (handled in globals.css).
 */
export default function Marquee({
  children,
  speed = 34,
  reverse = false,
  className,
  itemClassName,
  repeat = 2,
}: {
  children: React.ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
  repeat?: number;
}) {
  return (
    <div
      className={cn("marquee-root relative w-full overflow-hidden", className)}
      style={
        {
          "--marquee-duration": `${speed}s`,
          "--marquee-direction": reverse ? "reverse" : "normal",
        } as React.CSSProperties
      }
    >
      <div className="marquee-track flex w-max">
        {Array.from({ length: repeat * 2 }).map((_, i) => (
          <div
            key={i}
            className={cn("flex shrink-0 items-center", itemClassName)}
            /* The duplicate copies exist only to make the loop seamless.
               `inert` as well as aria-hidden, because a hidden copy that still
               takes Tab focus strands keyboard users on invisible controls. */
            aria-hidden={i > 0}
            inert={i > 0}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
