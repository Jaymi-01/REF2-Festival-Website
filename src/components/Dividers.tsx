"use client";

import { useId } from "react";

/**
 * Section-transition shapes, rebuilt from the mockup as SVG so they scale to any
 * viewport width (the PDF ships them as 5760px rasters that can't tile).
 *
 * The repeating edges use an SVG <pattern> in userSpaceOnUse units rather than a
 * stretched viewBox, so a tooth stays the same size at 390px and at 2560px —
 * stretching one viewBox across the width makes the teeth absurdly wide on desktop.
 */

const CASTLE_TILE = 68;
const CASTLE_H = 38;

export function CastellatedEdge({
  topColor,
  bottomColor,
  className = "",
}: {
  topColor: string;
  bottomColor: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={`relative w-full leading-[0] ${className}`} aria-hidden="true">
      <svg width="100%" height={CASTLE_H} className="block" role="presentation">
        <defs>
          <pattern
            id={`castle-${id}`}
            width={CASTLE_TILE}
            height={CASTLE_H}
            patternUnits="userSpaceOnUse"
          >
            <rect width={CASTLE_TILE} height={CASTLE_H} fill={bottomColor} />
            <path
              d={`M0 0h${CASTLE_TILE}v16H${CASTLE_TILE / 2 + 9}V${CASTLE_H}H${CASTLE_TILE / 2 - 9}V16H0z`}
              fill={topColor}
            />
          </pattern>
        </defs>
        <rect width="100%" height={CASTLE_H} fill={`url(#castle-${id})`} />
      </svg>
    </div>
  );
}

const CHECK = 22;

export function CheckerEdge({
  topColor,
  bottomColor,
  checkColor = "#ffffff",
  className = "",
}: {
  topColor: string;
  bottomColor: string;
  checkColor?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const H = CHECK * 2;
  return (
    <div className={`relative w-full leading-[0] ${className}`} aria-hidden="true">
      <svg width="100%" height={H} className="block" role="presentation">
        <defs>
          <pattern
            id={`check-${id}`}
            width={CHECK * 2}
            height={H}
            patternUnits="userSpaceOnUse"
          >
            <rect width={CHECK * 2} height={CHECK} fill={topColor} />
            <rect y={CHECK} width={CHECK * 2} height={CHECK} fill={bottomColor} />
            <rect width={CHECK} height={CHECK} fill={checkColor} />
            <rect x={CHECK} y={CHECK} width={CHECK} height={CHECK} fill={checkColor} />
          </pattern>
        </defs>
        <rect width="100%" height={H} fill={`url(#check-${id})`} />
      </svg>
    </div>
  );
}

/** Organic torn edge — stretching this one is invisible, so it keeps a viewBox. */
export function TornEdge({
  fill,
  flip = false,
  className = "",
}: {
  fill: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full leading-[0] ${className}`}
      aria-hidden="true"
      style={flip ? { transform: "scaleY(-1)" } : undefined}
    >
      <svg
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        className="block h-[clamp(30px,4.5vw,74px)] w-full"
        role="presentation"
      >
        <path
          fill={fill}
          d="M0 96 44 72l38 6 26-28 34 10 30-34 42 16 26-30 36 24 30-46 40 30 24-18 34 36 30-12 28 28 36-10 26 34 40-22 30 42 34-26 28 32 38-12 26 26 34-36 30 24 28-30 36 10 30 36 40-20 26 30 34-14 30 24 38-32 26 40 30-18 34 26 26-10v84H0z"
        />
      </svg>
    </div>
  );
}
