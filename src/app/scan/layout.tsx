import type { Metadata, Viewport } from "next";
import ServiceWorker from "@/components/scan/ServiceWorker";

/**
 * The scanner is its own installable app: `scope` and `start_url` in the
 * manifest are /scan, so adding it to a home screen gives the gate team a
 * standalone scanner, not a shortcut into the marketing site.
 */
export const metadata: Metadata = {
  title: "REF 2.0 Gate Scanner",
  // Staff tool — keep it out of search results entirely.
  robots: { index: false, follow: false, nocache: true },
  manifest: "/scanner.webmanifest",
  appleWebApp: {
    capable: true,
    title: "REF Gate",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/app-icons/apple-touch-icon.png",
    icon: "/app-icons/icon-192.png",
  },
  other: {
    // Next emits the modern `mobile-web-app-capable`. iOS before 16.4 only
    // honours the apple-prefixed one, and gate phones are rarely the newest.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1207",
  width: "device-width",
  initialScale: 1,
  // A steward will double-tap by accident a hundred times a shift.
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="on-dark min-h-[100dvh] bg-ink text-cream"
      /* Respect the notch and the home indicator when installed standalone. */
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ServiceWorker />
      {children}
    </div>
  );
}
