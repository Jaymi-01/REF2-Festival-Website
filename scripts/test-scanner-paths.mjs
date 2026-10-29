/**
 * Scans repeatedly down BOTH decode paths.
 *
 * The gate scanner prefers the platform BarcodeDetector and falls back to
 * ZXing where it doesn't exist — which is iOS Safari, i.e. a large share of
 * the phones at the gate. Headless Chromium always has BarcodeDetector, so
 * until this existed the ZXing path had never actually been run.
 *
 * The thing under test is the SECOND and THIRD read, not the first: a scanner
 * that decodes once and then goes quiet is useless at a gate.
 *
 *   node scripts/test-scanner-paths.mjs        (needs npm run demo:phone)
 */
import { chromium } from "playwright";
import { writeQrY4m } from "./qr-y4m.mjs";
import demo from "../src/data/demo-guests.json" with { type: "json" };

const BASE = process.env.BASE ?? "https://127.0.0.1:3002";
const SCANS = 3;

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : "  FAIL"}  ${label}${ok ? "" : `  (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`,
  );
};

const VERDICT = "[data-verdict]";
const payload = demo.cards.find((c) => c.t === "DEM01111").payload;

async function run({ label, forceZxing }) {
  console.log(`\n${label}`);
  const file = `/tmp/paths-${forceZxing ? "zxing" : "native"}.y4m`;
  writeQrY4m(file, payload);

  const browser = await chromium.launch({
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      `--use-file-for-fake-video-capture=${file}`,
      "--autoplay-policy=no-user-gesture-required",
      "--ignore-certificate-errors",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 420, height: 880 },
    permissions: ["camera"],
    ignoreHTTPSErrors: true,
    isMobile: true,
    hasTouch: true,
  });

  if (forceZxing) {
    // Exactly what iOS Safari presents: no BarcodeDetector at all.
    await context.addInitScript(() => {
      delete window.BarcodeDetector;
    });
  }

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(`${BASE}/scan`, { waitUntil: "networkidle" });
  await page.getByLabel(/which gate/i).fill("Path test");
  await page.getByLabel(/staff pin/i).fill("1234");
  await page.getByRole("button", { name: /start scanning/i }).click();
  await page.waitForSelector("text=/on list/", { timeout: 20_000 });

  check(
    "uses the expected decoder",
    await page.evaluate(() => typeof window.BarcodeDetector),
    forceZxing ? "undefined" : "function",
  );

  const seen = [];
  for (let i = 1; i <= SCANS; i++) {
    try {
      await page.waitForSelector(VERDICT, { timeout: 25_000 });
    } catch {
      seen.push("(nothing)");
      break;
    }
    const t = (await page.locator(VERDICT).innerText()).replace(/\s+/g, " ").trim();
    seen.push(/LET THEM IN/.test(t) ? "admitted" : /ALREADY IN/.test(t) ? "duplicate" : t.slice(0, 20));
    await page.locator(VERDICT).click();
    await page.waitForSelector(VERDICT, { state: "detached", timeout: 10_000 }).catch(() => {});
  }

  console.log(`        reads: ${seen.join(" → ")}`);
  check(`decodes ${SCANS} times in a row`, seen.length, SCANS);
  check("first read admits", seen[0], "admitted");
  check("later reads keep coming", seen.slice(1).every((s) => s === "duplicate"), true);

  if (errors.length) {
    console.log(`        page errors: ${[...new Set(errors)].slice(0, 3).join(" | ")}`);
  }
  await browser.close();
}

await run({ label: "native BarcodeDetector (Android Chrome)", forceZxing: false });
await run({ label: "ZXing fallback (iOS Safari)", forceZxing: true });

console.log(`\n${failures === 0 ? "both decode paths keep scanning" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
