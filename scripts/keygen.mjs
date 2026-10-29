/**
 * Generates the Ed25519 key pair that signs tickets.
 *
 *   npm run keygen
 *
 * Put the private key in .env.local (server only, never commit it) and the
 * public key in the same file — the public one is deliberately exposed to the
 * browser so scanners can verify tickets with no signal.
 *
 * Rotating the keys invalidates every ticket already issued, so do it before
 * registration opens, not after.
 */
import { getPublicKeyAsync } from "@noble/ed25519";
import { webcrypto } from "node:crypto";

const priv = webcrypto.getRandomValues(new Uint8Array(32));
const pub = await getPublicKeyAsync(priv);

const b64 = (b) => Buffer.from(b).toString("base64url");

console.log(`
Add these to site/.env.local (and to your host's environment variables):

# Signs tickets. SERVER ONLY — never expose, never commit.
TICKET_PRIVATE_KEY=${b64(priv)}

# Verifies tickets. Safe in the browser — every scanner needs it.
NEXT_PUBLIC_TICKET_PUBLIC_KEY=${b64(pub)}
`);
