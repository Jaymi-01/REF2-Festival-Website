/* Ticket references are human-readable and are used in registration emails. */

const PREFIX = "REF2";

/** Crockford base32: no I, L, O or U, so it can't be misread or spell words. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TICKET_LEN = 8;

export function generateTicket(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TICKET_LEN));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Display form, e.g. "REF2-A7K2 M9XP". Grouped so it's easy to read aloud. */
export function formatTicket(ticket: string) {
  return `${PREFIX}-${ticket.slice(0, 4)} ${ticket.slice(4)}`;
}
