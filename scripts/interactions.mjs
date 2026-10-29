/**
 * Drives the interactive states so they can be eyeballed as screenshots:
 * form validation, the un-configured and success paths, a card reveal, the
 * lightbox, the mobile menu, reduced motion, section order and tab order.
 *
 * Needs `npm run dev`. The success path is served by a mocked /api/register,
 * so this runs without a Supabase project — see test-schema / test-gate for
 * the parts that are tested for real.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? "/tmp/ref-interactions";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];

async function newPage(opts = {}) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    ...opts,
  });
  page.on("pageerror", (e) => errors.push(`${opts.label ?? ""} ${e}`));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  return page;
}

const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` });

/* 1 — form validation ---------------------------------------------------- */
{
  const page = await newPage();
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForTimeout(500);
  await shot(page, "01-form-errors");
  const err = await page.getByText("We need your full name.").isVisible();
  console.log("validation errors shown:", err);

  // partial / bad input
  await page.locator("input[name=fullName]").fill("Ada Obi");
  await page.locator("input[name=phone]").fill("123");
  await page.locator("input[name=email]").fill("not-an-email");
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForTimeout(400);
  await shot(page, "02-form-bad-values");
  console.log(
    "phone error:",
    await page.getByText("That doesn't look like a Nigerian number.").isVisible(),
    "| email error:",
    await page.getByText("Check that email address.").isVisible(),
  );

  /* 2 — no database configured ------------------------------------------- */
  await page.locator("input[name=phone]").fill("08031234567");
  await page.locator("input[name=email]").fill("ada@example.com");
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForTimeout(2200);
  await shot(page, "03-form-no-database");
  console.log(
    "says so when no database is configured:",
    await page.getByText(/isn't connected to a database/i).isVisible(),
  );
  await page.close();
}

/* 2b — success state, with the endpoint mocked --------------------------- */
{
  const page = await newPage();
  await page.route("**/api/register", (route) =>
    route.fulfill({
      status: 201,
      json: { ok: true, ticket: "A7K2M9XP", ticketDisplay: "REF2-A7K2 M9XP" },
    }),
  );
  await page.locator("input[name=fullName]").fill("Ada Obi");
  await page.locator("input[name=phone]").fill("08031234567");
  await page.locator("input[name=email]").fill("ada@example.com");
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForTimeout(2400);
  await shot(page, "04-form-success");
  console.log("ticket shown:", (await page.locator("text=/REF2-/").first().textContent())?.trim());
  const qr = page.getByRole("img", { name: /QR code for ticket/i });
  console.log("QR shown on the stub:", await qr.isVisible());
  console.log(
    "QR actually loaded:",
    await qr.evaluate((el) => el.complete && el.naturalWidth > 0).catch(() => false),
  );
  await page.close();
}

/* 3 — activity card reveal + lightbox ------------------------------------- */
{
  const page = await newPage();
  await page.evaluate(() => window.lenis?.scrollTo(1750, { immediate: true }));
  await page.waitForTimeout(800);
  await page.getByRole("button", { expanded: false }).first().hover();
  await page.waitForTimeout(700);
  await shot(page, "06-card-hover-reveal");

  await page.evaluate(() => {
    const el = document.getElementById("gallery");
    const y = el.getBoundingClientRect().top + window.scrollY + 400;
    if (window.lenis) {
      window.lenis.scrollTo(y, { immediate: true });
    } else {
      window.scrollTo(0, y);
    }
  });
  await page.waitForTimeout(1600);
  // Freeze the drifting walls so a tile can be clicked deterministically.
  await page.addStyleTag({ content: ".marquee-track{animation:none !important}" });
  await page.waitForTimeout(400);
  const tile = page.getByRole("button", { name: /Real Essence Festival —/ }).first();
  await tile.click();
  await page.waitForTimeout(900);
  await shot(page, "07-lightbox");
  console.log("lightbox open:", await page.getByRole("dialog").isVisible());
  await page.getByRole("button", { name: "Next photo" }).click();
  await page.waitForTimeout(500);
  await shot(page, "07b-lightbox-next");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  console.log("lightbox closed on Escape:", !(await page.getByRole("dialog").count()));
  await page.close();
}

/* 4 — mobile ------------------------------------------------------------- */
{
  const page = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await shot(page, "08-mobile-hero");
  await page.getByRole("button", { name: /open menu/i }).click();
  await page.waitForTimeout(500);
  await shot(page, "09-mobile-menu");
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.lenis?.scrollTo(2200, { immediate: true }));
  await page.waitForTimeout(900);
  await shot(page, "10-mobile-activities");
  await page.close();
}

/* 5 — reduced motion ------------------------------------------------------ */
{
  const page = await newPage({ reducedMotion: "reduce" });
  await shot(page, "11-reduced-hero");
  await page.evaluate(() => window.scrollTo(0, 2900));
  await page.waitForTimeout(900);
  await shot(page, "12-reduced-midpage");
  const trail = await page.evaluate(
    () => document.querySelectorAll('[aria-hidden="true"] span').length,
  );
  console.log("reduced-motion page rendered, decorative spans:", trail);
  await page.close();
}

/* 6 — section order ------------------------------------------------------- */
{
  const page = await newPage();
  const order = await page.evaluate(() =>
    [...document.querySelectorAll("section[id]")].map((s) => s.id),
  );
  console.log("section order:", order.join(" → "));
  console.log(
    "line-up before 'brought to you by':",
    order.indexOf("lineup") < order.indexOf("gallery") && order.includes("lineup"),
  );
  console.log("no wheel section:", !order.includes("wheel"));
  const filters = await page.getByRole("tablist", { name: /filter photos/i }).count();
  console.log("no photo filters:", filters === 0);
  await page.close();
}

/* 7 — keyboard reachability ---------------------------------------------- */
{
  const page = await newPage();
  const order = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    order.push(
      await page.evaluate(() => {
        const a = document.activeElement;
        return `${a?.tagName}:${(a?.getAttribute("aria-label") || a?.textContent || a?.getAttribute("name") || "").trim().slice(0, 26)}`;
      }),
    );
  }
  console.log("tab order:", order.join(" → "));
  await page.close();
}

console.log(
  errors.length ? `\nERRORS:\n${[...new Set(errors)].slice(0, 10).join("\n")}` : "\nno page errors",
);
await browser.close();
