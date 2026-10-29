import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Festival dates — the one source of truth for every countdown and label. */
export const FESTIVAL = {
  startsAt: new Date("2026-11-07T09:00:00+01:00"),
  endsAt: new Date("2026-11-08T20:00:00+01:00"),
  venue: "Ikeja City Mall",
  city: "Lagos",
  doors: "9am",
  // Non-breaking spaces hold "7th – 8th," together, so a narrow screen never
  // starts a line with a dangling en dash.
  dateLabel: "November, 7th – 8th, 2026",
} as const;

/**
 * Path for an asset referenced outside `next/image` (a CSS url(), a raw
 * `new Image()`). Relative, because the static export is hosted without a
 * guaranteed root — and "./x" resolves the same as "/x" when it is at the root.
 */
export function asset(path: string) {
  return path.startsWith("/") ? `.${path}` : path;
}
