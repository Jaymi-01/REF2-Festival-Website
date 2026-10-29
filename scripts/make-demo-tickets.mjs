/**
 * Builds the sample tickets the demo scanner checks against.
 *
 *   node --env-file=.env.local scripts/make-demo-tickets.mjs
 *
 * Writes:
 *   public/demo-tickets/<TICKET>.png   a real, signed QR for each guest
 *   public/demo-tickets/sheet.png      all of them on one page, to scan from
 *   src/data/demo-guests.json          the guest list the demo serves
 *
 * The signatures are real — made with TICKET_PRIVATE_KEY — so the demo
 * exercises the same Ed25519 verification the live gate does. Regenerate
 * these if the signing key ever changes.
 */
import { signAsync } from "@noble/ed25519";
import QRCode from "qrcode";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/demo-tickets";
mkdirSync(OUT, { recursive: true });

const b64url = (b) => Buffer.from(b).toString("base64url");
const priv = new Uint8Array(Buffer.from(process.env.TICKET_PRIVATE_KEY, "base64url"));

/* Ticket ids are Crockford base32, which has no I, L, O or U — that is what
   stops a steward reading a letter O as a zero. So these spell "DEM0" with a
   zero; anything with a real O is malformed and the scanner refuses it. */
const GUESTS = [
  { t: "DEM01111", n: "Ada O.", in: false, note: "Valid — should be let in" },
  { t: "DEM02222", n: "Chidi E.", in: false, note: "Valid — should be let in" },
  { t: "DEM03333", n: "Ngozi B.", in: true, note: "Already walked in — refuse" },
  { t: "DEM04444", n: "Tunde A.", in: false, note: "Valid — should be let in" },
];

// Not on the guest list, but correctly signed → "NOT FOUND".
const NOT_ON_LIST = { t: "DEM09999", note: "Signed but not on the list" };
// A real ticket number with a signature from nowhere → "FAKE TICKET".
const FORGED = { t: "DEM02222", note: "Forged signature" };

const sign = async (t) => b64url(await signAsync(new TextEncoder().encode(t), priv));

const cards = [];
for (const g of [...GUESTS, NOT_ON_LIST]) {
  const payload = `REF2.${g.t}.${await sign(g.t)}`;
  await QRCode.toFile(`${OUT}/${g.t}.png`, payload, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 560,
    color: { dark: "#1a1207ff", light: "#ffffffff" },
  });
  cards.push({ ...g, payload, file: `${g.t}.png` });
}

const forgedPayload = `REF2.${FORGED.t}.${b64url(new Uint8Array(64).fill(7))}`;
await QRCode.toFile(`${OUT}/FORGED.png`, forgedPayload, {
  errorCorrectionLevel: "H",
  margin: 2,
  width: 560,
  color: { dark: "#1a1207ff", light: "#ffffffff" },
});
cards.push({ ...FORGED, t: "FORGED", payload: forgedPayload, file: "FORGED.png" });

writeFileSync(
  "src/data/demo-guests.json",
  JSON.stringify({ guests: GUESTS.map(({ t, n, in: i }) => ({ t, n, in: i })), cards }, null, 1),
);

console.log(`${cards.length} demo tickets written to ${OUT}`);
for (const c of cards) console.log(`  ${c.t.padEnd(10)} ${c.note}`);
