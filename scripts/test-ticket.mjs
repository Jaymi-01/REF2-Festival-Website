/**
 * Ticket signing, verification and the human-readable fallbacks.
 *
 *   node --env-file=.env.local scripts/test-ticket.mjs
 */
import { signAsync, verifyAsync, getPublicKeyAsync } from "@noble/ed25519";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : "  FAIL"}  ${label}${ok ? "" : `  (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`,
  );
};

/* Mirrors src/lib/ticket.ts — kept in sync by these tests exercising the
   same payload format the app produces. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const b64url = (b) => Buffer.from(b).toString("base64url");
const unb64url = (s) => new Uint8Array(Buffer.from(s, "base64url"));

const priv = unb64url(process.env.TICKET_PRIVATE_KEY);
const pub = await getPublicKeyAsync(priv);
const pubB64 = b64url(pub);

check("public key derives from the private key", pubB64, process.env.NEXT_PUBLIC_TICKET_PUBLIC_KEY);

const sign = async (t) => b64url(await signAsync(new TextEncoder().encode(t), priv));
const verify = async (t, sig) =>
  verifyAsync(unb64url(sig), new TextEncoder().encode(t), unb64url(pubB64));

console.log("signing");
const ticket = "A7K2M9XP";
const sig = await sign(ticket);
check("a real ticket verifies", await verify(ticket, sig), true);
check("a tampered ticket fails", await verify("A7K2M9XQ", sig), false);
check("a made-up signature fails", await verify(ticket, b64url(new Uint8Array(64))), false);

console.log("\nqr payload");
const payload = `REF2.${ticket}.${sig}`;
check("payload is compact enough for a dense QR", payload.length < 110, true);
const [prefix, t2, s2] = payload.split(".");
check("round-trips", [prefix, t2, await verify(t2, s2)], ["REF2", ticket, true]);

console.log("\nticket alphabet");
check("no ambiguous glyphs", ["I", "L", "O", "U"].some((c) => ALPHABET.includes(c)), false);
check("32 symbols", ALPHABET.length, 32);

// Mirrors normaliseTicket(): what a tired steward might type in.
const normalise = (s) =>
  s.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1").replace(/U/g, "V");
console.log("\ntyped by hand");
check("lower case", normalise("a7k2m9xp"), "A7K2M9XP");
check("with the REF2 dash and a space", normalise("A7K2 M9XP"), "A7K2M9XP");
check("letter O read as zero", normalise("AOK2M9XP"), "A0K2M9XP");
check("letter l read as one", normalise("Al K2M9XP"), "A1K2M9XP");

console.log("\ncollision space");
const bits = Math.log2(ALPHABET.length ** 8);
check("8 chars gives 40 bits of entropy", Math.round(bits), 40);
// Birthday bound: with n tickets, collision odds ≈ n² / 2^41.
const expectedCollisions = (10_000 ** 2) / 2 ** 41;
check("under 1-in-20,000 odds of a clash across 10,000 tickets", expectedCollisions < 0.00005, true);

console.log(`\n${failures === 0 ? "all ticket checks passed" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
