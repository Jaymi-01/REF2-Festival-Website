import type { Metadata, Viewport } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

/**
 * FONT SUBSTITUTION — see PRD.md
 * The mockup uses `Bringbold Nineties` (display) and `JUST Sans` (UI). Neither is
 * freely licensed, so we ship the closest open equivalents and keep the real
 * names first in the stack: drop the licensed woff2 files into /public/fonts,
 * add an @font-face for each, and the brand faces take over with no other edits.
 */
const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

const sans = Outfit({
  variable: "--font-sans-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE = "https://realessencefestival.ng";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Real Essence Festival 2.0",
    template: "%s · Real Essence Festival 2.0",
  },
  description:
    "Two days of Delicious Sedaap Supreme Noodles, great music, cool games and unforgettable vibes. Brought to you by Sedaap Supreme Noodles. Free entry — register now.",
  icons: {
    icon: [{ url: "/brand/festival-logo.webp", type: "image/webp" }],
    shortcut: "/brand/festival-logo.webp",
  },
  keywords: [
    "Real Essence Festival",
    "Supreme Noodles",
    "Sedaap",
    "Ikeja City Mall",
    "Lagos festival 2026",
    "food festival Nigeria",
  ],
  openGraph: {
    title: "Real Essence Festival 2.0",
    description:
      "7–8 November 2026 · Ikeja City Mall · 9am. Delicious Sedaap Supreme Noodles. Great music. Cool games. Register free.",
    url: SITE,
    siteName: "Real Essence Festival 2.0",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Essence Festival 2.0",
    description: "7–8 November 2026 · Ikeja City Mall. Register free.",
  },
};

export const viewport: Viewport = {
  themeColor: "#b10008",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-NG"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      {/* Browser extensions may add attributes before React hydrates the body. */}
      <body className="min-h-full" suppressHydrationWarning>
        <a
          href="#register"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-full focus:bg-yellow-deep focus:px-5 focus:py-3 focus:font-bold focus:text-ink"
        >
          Skip to registration
        </a>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
