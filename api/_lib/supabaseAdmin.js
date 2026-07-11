// api/_lib/supabaseAdmin.js
// Server-only Supabase client using the SERVICE ROLE key (bypasses RLS).
// NEVER expose this key to the browser.

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("[supabase] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars");
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// "all" or a single class number as a string ("1".."8").
export function normaliseScope(scope) {
  if (scope === "all") return "all";
  const n = parseInt(scope, 10);
  if (Number.isInteger(n) && n >= 1 && n <= 8) return String(n);
  return null;
}
