/**
 * Several tickets in one camera frame — a printed sheet, or two people holding
 * phones side by side. The scanner must read the one being AIMED at, not
 * whichever the decoder happens to list first.
 *
 * Both runs show the same three codes in the same frame; only which one sits
 * in the middle changes. If the scanner reads the same ticket both times, it
 * is locked onto the decoder's first result and the gate is unusable.
 *
 *   node scripts/test-aim.mjs        (needs npm run demo:phone)
 */
import { chromium } from "playwright";
import { writeQrY4m } from "./qr-y4m.mjs";
import demo from "../src/data/demo-guests.json" with { type: "json" };

const BASE = process.env.BASE ?? "https://127.0.0.1:3002";
const VERDICT = "[data-verdict]";
const SIZE = 480;

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : "  FAIL"}  ${label}${ok ? "" : `  (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`,
  );
};

const pay = (t) => demo.cards.find((c) => c.t === t).payload;

/* Three codes across the frame. `centre` is the one under the guide. */
function sheet(centreTicket) {
  const others = ["DEM01111", "DEM02222", "DEM04444"].filter((t) => t !== centreTicket);
  const w = 150;
  return [
    { text: pay(others[0]), x: 4, y: 4, w },
    { text: pay(centreTicket), x: (SIZE - w) / 2, y: (SIZE - w) / 2, w },
    { text: pay(others[1]), x: SIZE - w - 4, y: SIZE - w - 4, w },
  ];
}

async function readCentre(centreTicket, forceZxing) {
  const file = `/tmp/aim-${centreTicket}-${forceZxing ? "z" : "n"}.y4m`;
  writeQrY4m(file, sheet(centreTicket));

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
    await context.addInitScript(() => {
      delete window.BarcodeDetector;
    });
  }

  const page = await context.newPage();
  await page.goto(`${BASE}/scan`, { waitUntil: "networkidle" });
  await page.getByLabel(/which gate/i).fill("Aim test");
  await page.getByLabel(/staff pin/i).fill("1234");
  await page.getByRole("button", { name: /start scanning/i }).click();
  await page.waitForSelector("text=/on list/", { timeout: 20_000 });

  let read = "(nothing)";
  try {
    await page.waitForSelector(VERDICT, { timeout: 25_000 });
    const t = (await page.locator(VERDICT).innerText()).replace(/\s+/g, " ");
    const m = t.match(/REF2-(\w{4})\s*(\w{4})/);
    read = m ? `${m[1]}${m[2]}` : t.slice(0, 24);
  } catch {
    /* left as "(nothing)" */
  }
  await browser.close();
  return read;
}

for (const [label, forceZxing] of [
  ["native BarcodeDetector", false],
  ["ZXing fallback (iOS Safari)", true],
]) {
  console.log(`\n${label} — three tickets in frame`);
  const a = await readCentre("DEM01111", forceZxing);
  console.log(`        aiming at DEM01111 → read ${a}`);
  const b = await readCentre("DEM04444", forceZxing);
  console.log(`        aiming at DEM04444 → read ${b}`);

  check("reads the ticket being aimed at", a, "DEM01111");
  check("aiming elsewhere reads that one instead", b, "DEM04444");
  check("the two aims differ", a !== b, true);
}

console.log(`\n${failures === 0 ? "aiming works on both paths" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
