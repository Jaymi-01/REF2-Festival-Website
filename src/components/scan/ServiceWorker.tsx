"use client";

import { useEffect } from "react";

/**
 * Registers the scanner's service worker so the app opens with no signal.
 *
 * Production only: in development the cached shell fights hot reload and you
 * end up debugging a stale bundle instead of your code.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/scan-sw.js", { scope: "/scan" })
        .catch(() => {
          /* a scanner that can't cache still works online — not worth a message */
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
