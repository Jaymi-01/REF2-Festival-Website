/**
 * Renders the confirmation email at desktop and phone widths, and reports the
 * things that actually break emails: total weight, remote images, and whether
 * the ticket number survives when images are blocked.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const OUT = process.argv[2] ?? "/tmp/email";
mkdirSync(OUT, { recursive: true });

const html = await (await fetch("http://localhost:3000/api/email/preview")).text();
const text = await (await fetch("http://localhost:3000/api/email/preview?format=text")).text();
writeFileSync(`${OUT}/confirmation.html`, html);
writeFileSync(`${OUT}/confirmation.txt`, text);

const bytes = Buffer.byteLength(html);
console.log(`html ${(bytes / 1024).toFixed(1)}KB  ${bytes < 102_000 ? "ok — under Gmail's 102KB clip" : "TOO BIG — Gmail will clip it"}`);
console.log(`plain text ${text.length} chars, ticket present: ${/REF2-A7K2 M9XP/.test(text)}`);
console.log(`<style> blocks (stripped by Gmail): ${(html.match(/<style/g) ?? []).length}`);
console.log(`remote images: ${(html.match(/<img/g) ?? []).length}`);

const browser = await chromium.launch();
for (const [name, width] of [["desktop", 760], ["mobile", 390]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });

  if (name === "mobile") {
    // What it looks like with images off — the default in most clients.
    await page.addStyleTag({ content: "img{visibility:hidden}" });
    await page.screenshot({ path: `${OUT}/mobile-images-blocked.png`, fullPage: true });
    const visible = await page.locator("body").innerText();
    console.log(`ticket readable with images blocked: ${/REF2-A7K2 M9XP/.test(visible)}`);
  }
  await page.close();
}
await browser.close();
console.log(`written to ${OUT}`);
