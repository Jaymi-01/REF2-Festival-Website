import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const inputPath = process.argv[2] ?? "private/email.csv";
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const contents = await fs.readFile(inputPath, "utf8");
const emails = [...new Set(
  contents
    .split(/\r?\n/)
    .map((value) => value.trim().replace(/^['\"]|['\"]$/g, "").toLowerCase())
    .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)),
)];

const db = createClient(url, key, { auth: { persistSession: false } });
const rows = emails.map((email) => ({ email }));

for (let index = 0; index < rows.length; index += 500) {
  const batch = rows.slice(index, index + 500);
  const { error } = await db.from("broadcast_contacts").upsert(batch, {
    onConflict: "email",
    ignoreDuplicates: true,
  });

  if (error) throw new Error(`Import failed near row ${index + 1}: ${error.message}`);
  console.log(`Imported ${Math.min(index + batch.length, rows.length)} / ${rows.length}`);
}

console.log(`Finished. ${emails.length} unique email addresses are ready for the broadcast.`);
