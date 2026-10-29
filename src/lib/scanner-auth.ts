import { createHmac, timingSafeEqual } from "node:crypto";

/* ===========================================================================
 * STAFF ACCESS
 *
 * One shared PIN, briefed to the gate team on the day. Exchanging it returns a
 * signed token the device stores, so a scanner stays authorised once it is
 * offline — checking the PIN on every scan would defeat the whole point.
 *
 * Rotate by changing SCANNER_PIN (new sessions only) or SCANNER_SESSION_SECRET
 * (kicks every device out immediately).
 * ========================================================================= */

const TOKEN_TTL_MS = 36 * 60 * 60 * 1000; // covers both festival days

function secret() {
  const s = process.env.SCANNER_SESSION_SECRET;
  if (!s) throw new Error("SCANNER_SESSION_SECRET is not set");
  return s;
}

function sign(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

/** Compares without leaking length or position through timing. */
export function constantTimeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Still do the work, so a wrong length isn't faster than a wrong value.
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export function pinIsCorrect(pin: string) {
  const expected = process.env.SCANNER_PIN;
  if (!expected) throw new Error("SCANNER_PIN is not set");
  return constantTimeEqual(pin.trim(), expected);
}

export function issueToken(device: string) {
  const payload = `${device}|${Date.now() + TOKEN_TTL_MS}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export type Session = { device: string; expiresAt: number };

export function readToken(token: string | null | undefined): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  let payload: string;
  try {
    payload = Buffer.from(body, "base64url").toString();
  } catch {
    return null;
  }

  if (!constantTimeEqual(sig, sign(payload))) return null;

  const [device, expiry] = payload.split("|");
  const expiresAt = Number(expiry);
  if (!device || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  return { device, expiresAt };
}

/** Pulls the session out of a request, or null. */
export function sessionFrom(request: Request): Session | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return readToken(header.slice(7));
}

export function scannerConfigured() {
  return Boolean(process.env.SCANNER_PIN && process.env.SCANNER_SESSION_SECRET);
}
