/**
 * Checks the demo scanner — the build that goes on a phone.
 *
 * The point of these assertions is that the demo changes only the three
 * network calls: the camera, the signature check and the duplicate logic must
 * all still be the real ones. It also proves no API is contacted, which is
 * what lets the demo run with no server at all.
 *
 *   node scripts/test-demo.mjs [outDir]      (needs npm run demo:serve)
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { writeQrY4m } from "./qr-y4m.mjs";
import demo from "../src/data/demo-guests.json" with { type: "json" };

const OUT = process.argv[2] ?? "/tmp/demo-shots";
const BASE = process.env.BASE ?? "http://localhost:3002";
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : "  FAIL"}  ${label}${ok ? "" : `  (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`,
  );
};

const VERDICT = "[data-verdict]";
const payloadOf = (t) => demo.cards.find((c) => c.t === t).payload;
const errors = [];
const apiCalls = [];

async function withCamera(payload, fn) {
  const file = `/tmp/demo-qr-${Math.random().toString(36).slice(2)}.y4m`;
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
    // the phone preview runs behind a self-signed cert
    ignoreHTTPSErrors: true,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/")) apiCalls.push(r.url());
  });

  await page.goto(`${BASE}/scan`, { waitUntil: "networkidle" });
  await page.getByLabel(/which gate/i).fill("Demo gate");
  await page.getByLabel(/staff pin/i).fill("1234");
  await page.getByRole("button", { name: /start scanning/i }).click();
  await page.waitForSelector("text=/on list/", { timeout: 20_000 });

  try {
    await fn(page);
  } finally {
    await browser.close();
  }
}

const text = (page) =>
  page.locator(VERDICT).innerText().then((t) => t.replace(/\s+/g, " ").trim());

console.log("demo sign-in");
await withCamera(payloadOf("DEM01111"), async (page) => {
  check("the demo PIN gets in", await page.getByText("4 on list").isVisible(), true);
  check(
    "the demo banner is shown",
    await page.getByText(/not the real gate/i).isVisible(),
    true,
  );
  await page.screenshot({ path: `${OUT}/01-ready.png` });

  console.log("\nscanning, through the camera");
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  const first = await text(page);
  check("a valid sample ticket is admitted", /LET THEM IN/.test(first), true);
  check("and names the guest", /Ada O\./.test(first), true);
  await page.screenshot({ path: `${OUT}/02-admitted.png` });

  await page.locator(VERDICT).click();
  await page.waitForSelector(VERDICT, { state: "detached", timeout: 10_000 });
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  check("the same one again is refused", /ALREADY IN/.test(await text(page)), true);
  await page.screenshot({ path: `${OUT}/03-duplicate.png` });
});

await withCamera(payloadOf("DEM03333"), async (page) => {
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  check("a guest already marked in is refused", /ALREADY IN/.test(await text(page)), true);
});

await withCamera(payloadOf("DEM09999"), async (page) => {
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  check("signed but not on the list", /NOT FOUND/.test(await text(page)), true);
});

await withCamera(payloadOf("FORGED"), async (page) => {
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  check("the forged signature still fails", /FAKE TICKET/.test(await text(page)), true);
  await page.screenshot({ path: `${OUT}/04-forged.png` });

  console.log("\nthe sample ticket sheet");
  await page.locator(VERDICT).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^tickets$/i }).click();
  await page.waitForTimeout(800);
  const imgs = await page.getByRole("img", { name: /Sample QR/ }).count();
  check("every sample ticket is listed", imgs, demo.cards.length);
  const loaded = await page.evaluate(() =>
    [...document.querySelectorAll('img[alt^="Sample QR"]')].every(
      (i) => i.complete && i.naturalWidth > 0,
    ),
  );
  check("and the QR images load", loaded, true);
  await page.screenshot({ path: `${OUT}/05-sample-tickets.png` });
});

console.log("\nno server needed");
check(
  "nothing was requested from /api",
  apiCalls.length === 0,
  true,
);

console.log(
  errors.length
    ? `\nPAGE ERRORS:\n${[...new Set(errors)].slice(0, 6).join("\n")}`
    : "\nno page errors",
);
console.log(failures === 0 ? "all demo checks passed" : `${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
