/**
 * Visual-check harness. Scrolls the page in steps (driving Lenis so the
 * scroll-triggered animations actually fire) and writes one PNG per step.
 *
 *   node scripts/shots.mjs [outDir] [width] [height]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? "/tmp/ref-shots";
const W = Number(process.argv[3] ?? 1440);
const H = Number(process.argv[4] ?? 900);
const REDUCED = process.env.REDUCED === "1";
// Point at any running instance: BASE=https://staging.example.com npm run …
const BASE = process.env.BASE ?? `http://localhost:${process.env.PORT ?? 3000}`;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  reducedMotion: REDUCED ? "reduce" : "no-preference",
});

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1800);

const docH = await page.evaluate(() => document.body.scrollHeight);
const steps = Math.ceil(docH / H);
console.log(`${BASE} · doc ${docH}px · viewport ${W}x${H} · ${steps} frames · reduced=${REDUCED}`);

for (let i = 0; i < steps; i++) {
  const y = i * H;
  await page.evaluate((target) => {
    // The dev-only Lenis handle is absent in a production build, and some
    // bundles leave an unrelated `window.lenis` behind — check for the method.
    if (typeof window.lenis?.scrollTo === "function") {
      window.lenis.scrollTo(target, { immediate: true });
    } else {
      window.scrollTo(0, target);
    }
  }, y);
  // let entrance animations settle
  await page.waitForTimeout(950);
  await page.screenshot({ path: `${OUT}/${String(i).padStart(2, "0")}.png` });
}

if (errors.length) {
  console.log("\n--- page errors ---");
  [...new Set(errors)].slice(0, 12).forEach((e) => console.log("•", e.slice(0, 220)));
} else {
  console.log("\nno page errors");
}

await browser.close();
