/**
 * End-to-end test of the gate scanner.
 *
 * Part 1 drives a REAL camera pipeline: Chromium's fake video device plays a
 * Y4M containing an actual signed QR, so the test covers video frame -> QR
 * decode -> Ed25519 verify -> IndexedDB lookup -> verdict. Chromium takes only
 * one capture file per launch, so each QR gets its own browser.
 *
 * Part 2 covers everything after the decode — manual entry, the offline queue,
 * sync, the log, sign-out — in one session with no camera, which also proves a
 * steward can still work when the camera is unavailable.
 *
 *   node --env-file=.env.local scripts/test-gate.mjs [outDir]
 */
import { chromium } from "playwright";
import { signAsync } from "@noble/ed25519";
import { mkdirSync } from "node:fs";
import { writeQrY4m } from "./qr-y4m.mjs";

const OUT = process.argv[2] ?? "/tmp/gate-shots";
const BASE = process.env.BASE ?? "http://localhost:3000";
const PIN = process.env.SCANNER_PIN ?? "4821";
mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : "  FAIL"}  ${label}${ok ? "" : `  (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`,
  );
};

const b64url = (b) => Buffer.from(b).toString("base64url");
const priv = new Uint8Array(Buffer.from(process.env.TICKET_PRIVATE_KEY, "base64url"));
const payloadFor = async (t) =>
  `REF2.${t}.${b64url(await signAsync(new TextEncoder().encode(t), priv))}`;

const GUESTS = [
  { t: "AAAA1111", n: "Ada O.", in: false },
  { t: "BBBB2222", n: "Chidi E.", in: false },
  { t: "CCCC3333", n: "Ngozi B.", in: true }, // already walked in
];

const VERDICT = "[data-verdict]"; // ours — Next injects its own role="alert"
const errors = [];

function wire(page, synced) {
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.route("**/api/scan/manifest", (route) =>
    route.fulfill({
      json: { syncedAt: new Date().toISOString(), count: GUESTS.length, entries: GUESTS },
    }),
  );
  page.route("**/api/scan/sync", (route) => {
    const body = route.request().postDataJSON();
    const results = {};
    for (const s of body.scans ?? []) {
      synced?.push(s);
      results[s.id] = {
        result: s.localResult,
        first_name: null,
        last_name: null,
        checked_in_at: null,
      };
    }
    return route.fulfill({ json: { ok: true, results, syncedAt: new Date().toISOString() } });
  });
}

async function signIn(page, gate) {
  await page.goto(`${BASE}/scan`, { waitUntil: "networkidle" });
  await page.getByLabel(/which gate/i).fill(gate);
  await page.getByLabel(/staff pin/i).fill(PIN);
  await page.getByRole("button", { name: /start scanning/i }).click();
  await page.waitForSelector("text=/on list/", { timeout: 20_000 });
}

const text = (page) =>
  page.locator(VERDICT).innerText().then((t) => t.replace(/\s+/g, " ").trim());

/* ========================================================================== */
/* Part 1 — through the camera                                                */
/* ========================================================================== */

async function withCamera(payload, fn) {
  const file = `/tmp/gate-qr-${Math.random().toString(36).slice(2)}.y4m`;
  writeQrY4m(file, payload);
  const browser = await chromium.launch({
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      `--use-file-for-fake-video-capture=${file}`,
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 420, height: 880 },
    permissions: ["camera"],
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  wire(page, []);
  try {
    await signIn(page, "Gate 1");
    await fn(page);
  } finally {
    await browser.close();
  }
}

console.log("through the camera");

await withCamera(await payloadFor("AAAA1111"), async (page) => {
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  const first = await text(page);
  check("a valid ticket is admitted", /LET THEM IN/.test(first), true);
  check("and shows who it is", /Ada O\./.test(first), true);
  check("and shows the ticket number", /REF2-AAAA 1111/.test(first), true);
  await page.screenshot({ path: `${OUT}/01-admitted.png` });

  // The same code is still in front of the lens; after the cooldown the
  // scanner reads it again, and this time it must refuse.
  await page.locator(VERDICT).click();
  await page.waitForSelector(VERDICT, { state: "detached", timeout: 10_000 });
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  check("the same ticket a second time is refused", /ALREADY IN/.test(await text(page)), true);
  await page.screenshot({ path: `${OUT}/02-duplicate.png` });
});

await withCamera(await payloadFor("CCCC3333"), async (page) => {
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  check(
    "someone already through another gate is refused",
    /ALREADY IN/.test(await text(page)),
    true,
  );
});

await withCamera(await payloadFor("DDDD4444"), async (page) => {
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  check("a signed ticket that isn't on the list", /NOT FOUND/.test(await text(page)), true);
  await page.screenshot({ path: `${OUT}/03-not-found.png` });
});

console.log("\nforgery");

// A real ticket number with a signature from the wrong key — what someone gets
// if they read the number off a friend's QR and try to re-mint it.
await withCamera(`REF2.BBBB2222.${b64url(new Uint8Array(64).fill(7))}`, async (page) => {
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  check("a forged signature is rejected", /FAKE TICKET/.test(await text(page)), true);
  await page.screenshot({ path: `${OUT}/04-forged.png` });
});

await withCamera("https://example.com/not-a-ticket", async (page) => {
  await page.waitForSelector(VERDICT, { timeout: 20_000 });
  check("someone else's QR is rejected", /FAKE TICKET/.test(await text(page)), true);
});

/* ========================================================================== */
/* Part 2 — everything after the decode                                       */
/* ========================================================================== */

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 420, height: 880 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const synced = [];
wire(page, synced);

console.log("\nsign in");
await page.goto(`${BASE}/scan`, { waitUntil: "networkidle" });
await page.getByLabel(/which gate/i).fill("Gate 2");
await page.getByLabel(/staff pin/i).fill("0000");
await page.getByRole("button", { name: /start scanning/i }).click();
await page.waitForTimeout(900);
check("a wrong PIN is refused", await page.getByText(/PIN isn't right/i).isVisible(), true);
await page.screenshot({ path: `${OUT}/05-wrong-pin.png` });

await page.getByLabel(/staff pin/i).fill(PIN);
await page.getByRole("button", { name: /start scanning/i }).click();
await page.waitForSelector("text=/on list/", { timeout: 20_000 });
check("the right PIN gets in", await page.getByText("3 on list").isVisible(), true);

console.log("\nno camera");
await page.waitForSelector("text=/Enter code instead|Camera access/", { timeout: 12_000 });
check(
  "it says so rather than looking broken",
  await page.getByText(/Enter code instead|Camera access/).isVisible(),
  true,
);
check(
  "manual entry is still reachable",
  await page.getByRole("button", { name: /enter code by hand/i }).isVisible(),
  true,
);
await page.screenshot({ path: `${OUT}/06-no-camera.png` });

console.log("\ntyped by hand");
await page.getByRole("button", { name: /enter code by hand/i }).click();
await page.getByPlaceholder(/REF2/).fill("bb");
check(
  "a partial code can't be submitted",
  await page.getByRole("button", { name: /^check$/i }).isDisabled(),
  true,
);
await page.getByPlaceholder(/REF2/).fill("bbbb-2222");
await page.screenshot({ path: `${OUT}/07-manual.png` });
await page.getByRole("button", { name: /^check$/i }).click();
await page.waitForSelector(VERDICT);
check("lower case with a stray dash still admits", /LET THEM IN/.test(await text(page)), true);
await page.locator(VERDICT).click();
await page.waitForTimeout(600);

console.log("\noffline");
await context.setOffline(true);
await page.waitForTimeout(900);
check("it says it's offline", await page.getByText(/^Offline$/).isVisible(), true);

const before = synced.length;
await page.getByRole("button", { name: /enter code by hand/i }).click();
await page.getByPlaceholder(/REF2/).fill("AAAA1111");
await page.getByRole("button", { name: /^check$/i }).click();
await page.waitForSelector(VERDICT);
check("it still decides with no signal", /LET THEM IN/.test(await text(page)), true);
await page.locator(VERDICT).click();
await page.waitForTimeout(800);
check("the scan is queued", await page.getByText(/to upload/).isVisible(), true);
await page.screenshot({ path: `${OUT}/08-offline-queued.png` });

await context.setOffline(false);
await page.waitForTimeout(3500);
check("the queue flushes when signal returns", synced.length > before, true);
check(
  "nothing is left to upload",
  await page
    .getByText(/to upload/)
    .isVisible()
    .catch(() => false),
  false,
);
await page.screenshot({ path: `${OUT}/09-synced.png` });

console.log("\nthe log");
await page.getByRole("button", { name: /^log$/i }).click();
await page.waitForTimeout(600);
const log = await page.locator('[role="dialog"]').innerText();
check("scans are logged", (log.match(/REF2-/g) ?? []).length >= 2, true);
check("and marked as uploaded", !/not uploaded/.test(log), true);
await page.screenshot({ path: `${OUT}/10-log.png` });

console.log("\nsign out");
page.on("dialog", (d) => d.accept());
await page.getByRole("button", { name: /sign out/i }).click();
await page.waitForTimeout(1500);
check("back to the PIN screen", await page.getByLabel(/staff pin/i).isVisible(), true);
const leftover = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const req = indexedDB.open("ref2-gate");
      req.onsuccess = () => {
        const t = req.result.transaction("guests", "readonly").objectStore("guests").count();
        t.onsuccess = () => resolve(t.result);
      };
    }),
);
check("the cached guest list is wiped", leftover, 0);
await page.screenshot({ path: `${OUT}/11-signed-out.png` });

await browser.close();

console.log(
  errors.length
    ? `\nPAGE ERRORS:\n${[...new Set(errors)].slice(0, 6).join("\n")}`
    : "\nno page errors",
);
console.log(failures === 0 ? "all gate checks passed" : `${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
