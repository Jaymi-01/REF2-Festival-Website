import { signAsync, verifyAsync } from "@noble/ed25519";

/* ===========================================================================
 * TICKET IDENTITY AND SIGNING
 *
 * A ticket's QR carries three parts:   REF2.<ticket>.<signature>
 *
 *   ticket     8 chars of Crockford base32 (no I, L, O, U — so a human can
 *              read one off a printout and type it in without ambiguity)
 *   signature  Ed25519 over the ticket, base64url, 86 chars
 *
 * Ed25519 rather than an HMAC on purpose: the gate scanners must verify
 * tickets with no signal, and a symmetric key would have to be shipped to
 * every staff phone — where it could be lifted and used to mint tickets.
 * Here each phone carries only the PUBLIC key. It can verify, never issue.
 * ========================================================================= */

const PREFIX = "REF2";

/** Crockford base32: no I, L, O or U, so it can't be misread or spell words. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TICKET_LEN = 8;

export type TicketPayload = { ticket: string; signature: string };

/* --- encoding helpers ---------------------------------------------------- */

/* Universal base64url. This module is imported by the scanner so it can verify
   tickets offline in the browser, so it cannot reach for Node's Buffer. */

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Normalises what a human typed: strips spaces/dashes, fixes lookalikes. */
export function normaliseTicket(input: string) {
  return input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V");
}

export function isWellFormedTicket(t: string) {
  return (
    t.length === TICKET_LEN && [...t].every((c) => ALPHABET.includes(c))
  );
}

/* --- generation ---------------------------------------------------------- */

export function generateTicket(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TICKET_LEN));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Display form, e.g. "REF2-A7K2 M9XP". Grouped so it's easy to read aloud. */
export function formatTicket(ticket: string) {
  return `${PREFIX}-${ticket.slice(0, 4)} ${ticket.slice(4)}`;
}

/* --- signing (server only — needs the private key) ----------------------- */

function privateKey(): Uint8Array {
  const raw = process.env.TICKET_PRIVATE_KEY;
  if (!raw) {
    throw new Error(
      "TICKET_PRIVATE_KEY is not set. Run `npm run keygen` and add both keys to .env.local",
    );
  }
  const key = fromBase64Url(raw);
  if (key.length !== 32) throw new Error("TICKET_PRIVATE_KEY must be 32 bytes");
  return key;
}

export async function signTicket(ticket: string): Promise<string> {
  const sig = await signAsync(new TextEncoder().encode(ticket), privateKey());
  return toBase64Url(sig);
}

/** The exact string encoded into the QR. */
export async function buildQrPayload(ticket: string) {
  return `${PREFIX}.${ticket}.${await signTicket(ticket)}`;
}

/* --- verification (runs on the server AND offline in the scanner) --------- */

export function parseQrPayload(raw: string): TicketPayload | null {
  const parts = raw.trim().split(".");
  if (parts.length !== 3) return null;
  const [prefix, ticket, signature] = parts;
  if (prefix !== PREFIX) return null;
  if (!isWellFormedTicket(ticket)) return null;
  if (!signature) return null;
  return { ticket, signature };
}

export async function verifyTicket(
  { ticket, signature }: TicketPayload,
  publicKeyB64: string,
): Promise<boolean> {
  try {
    return await verifyAsync(
      fromBase64Url(signature),
      new TextEncoder().encode(ticket),
      fromBase64Url(publicKeyB64),
    );
  } catch {
    return false;
  }
}

/** The public key, safe to ship to every scanner. */
export function publicKey() {
  const key = process.env.NEXT_PUBLIC_TICKET_PUBLIC_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_TICKET_PUBLIC_KEY is not set");
  return key;
}
