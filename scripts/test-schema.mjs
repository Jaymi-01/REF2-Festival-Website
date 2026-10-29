/**
 * Runs supabase/schema.sql against a real Postgres (PGlite, in WASM) and
 * exercises admit() — the one piece of this system where a subtle bug lets
 * two people through on one ticket, or loses a check-in entirely.
 *
 *   node scripts/test-schema.mjs
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const db = new PGlite();
let failures = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${label}${ok ? "" : `\n          expected ${JSON.stringify(expected)}\n          got      ${JSON.stringify(actual)}`}`);
}

const sql = readFileSync("supabase/schema.sql", "utf8");
try {
  await db.exec(sql);
} catch (e) {
  console.error("schema failed to apply:", e.message);
  process.exit(1);
}
console.log("schema applied\n");

const admit = async (ticket, device = "Gate 1", scanId = randomUUID(), at = new Date()) => {
  const r = await db.query(
    "select * from admit($1, $2, $3, $4)",
    [ticket, device, scanId, at.toISOString()],
  );
  return r.rows[0];
};

await db.query(
  `insert into registrations (ticket, first_name, last_name, email, phone)
   values ('AAAA1111','Ada','Obi','ada@example.com','08031234567'),
          ('BBBB2222','Chidi','Eze','chidi@example.com','08031234568')`,
);

console.log("admit()");
const first = await admit("AAAA1111");
check("first scan admits", first.result, "admitted");
check("returns their name", `${first.first_name} ${first.last_name}`, "Ada Obi");

const second = await admit("AAAA1111");
check("second scan is a duplicate", second.result, "duplicate");
check("duplicate still reports first entry time", Boolean(second.checked_in_at), true);

check("unknown ticket", (await admit("ZZZZ9999")).result, "unknown");

console.log("\nidempotency (the offline queue replays)");
const replayId = randomUUID();
const a = await admit("BBBB2222", "Gate 2", replayId);
check("queued scan admits", a.result, "admitted");
const b = await admit("BBBB2222", "Gate 2", replayId);
check("replaying the same scan id is a no-op", b.result, "admitted");
const scanRows = await db.query("select count(*)::int as n from scans where id = $1", [replayId]);
check("only one scan row was written", scanRows.rows[0].n, 1);

console.log("\ntwo gates, same ticket, offline");
await db.query(
  `insert into registrations (ticket, first_name, last_name, email, phone)
   values ('CCCC3333','Ngozi','Bello','ngozi@example.com','08031234569')`,
);
// Both gates let her in while offline; both now replay.
const gate1 = await admit("CCCC3333", "Gate 1", randomUUID());
const gate2 = await admit("CCCC3333", "Gate 2", randomUUID());
check("exactly one gate wins", [gate1.result, gate2.result], ["admitted", "duplicate"]);

const audit = await db.query(
  "select result from scans where ticket = 'CCCC3333' order by synced_at",
);
check(
  "both attempts are in the audit trail",
  audit.rows.map((r) => r.result),
  ["admitted", "duplicate"],
);

console.log("\nconstraints");
const dupEmail = await db
  .query(
    `insert into registrations (ticket, first_name, last_name, email, phone)
     values ('DDDD4444','Ada','Again','ADA@example.com','08031234570')`,
  )
  .then(() => "inserted")
  .catch((e) => (e.message.includes("registrations_email_key") ? "rejected" : `other: ${e.message}`));
check("a second registration on the same email is rejected", dupEmail, "rejected");

const dupTicket = await db
  .query(
    `insert into registrations (ticket, first_name, last_name, email, phone)
     values ('AAAA1111','Someone','Else','else@example.com','08031234571')`,
  )
  .then(() => "inserted")
  .catch((e) => (e.message.includes("unique") ? "rejected" : `other: ${e.message}`));
check("a duplicate ticket is rejected", dupTicket, "rejected");

console.log("\ngate_stats");
const stats = (await db.query("select * from gate_stats")).rows[0];
check("registered count", stats.registered, 3);
check("admitted count", stats.admitted, 3);

console.log(`\n${failures === 0 ? "all schema checks passed" : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
