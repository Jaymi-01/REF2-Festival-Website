import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client, using the service-role key.
 *
 * This key bypasses row-level security, so it must never reach the browser —
 * every read and write goes through a route handler in this app. That is why
 * the tables have RLS on with no anon policy: the browser has no way in.
 */
let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set — see README.md",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** True when the app is configured to talk to a real database. */
export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export type Registration = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
};
