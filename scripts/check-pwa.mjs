/** Confirms the phone preview really is installable and really serves over HTTPS. */
import { chromium } from "playwright";
const BASE = process.env.BASE ?? "https://192.168.200.103:3002";
const b = await chromium.launch({ args: ["--ignore-certificate-errors"] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, isMobile: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", e => errs.push(String(e)));
await p.goto(`${BASE}/scan`, { waitUntil: "networkidle" });
await p.waitForTimeout(2500);

console.log("secure context:", await p.evaluate(() => window.isSecureContext));
console.log("camera API available:", await p.evaluate(() => !!navigator.mediaDevices?.getUserMedia));
console.log("manifest linked:", await p.evaluate(() => document.querySelector('link[rel=manifest]')?.getAttribute("href")));
console.log("apple web app meta:", await p.evaluate(() => !!document.querySelector('meta[name="apple-mobile-web-app-capable"]')));
console.log("apple touch icon:", await p.evaluate(() => document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href")));
console.log("theme colour:", await p.evaluate(() => document.querySelector('meta[name=theme-color]')?.getAttribute("content")));
const sw = await p.evaluate(async () => {
  const r = await navigator.serviceWorker.getRegistrations();
  return r.map(x => x.scope);
});
console.log("service worker scopes:", sw);
console.log("demo banner:", await p.getByText(/not the real gate|Demo build/i).first().isVisible());
await p.screenshot({ path: "/tmp/phone-signin.png" });
console.log(errs.length ? "ERRORS: " + errs.slice(0,3).join(" | ") : "no page errors");
await b.close();
