// src/lib/supabaseClient.js
// Browser-safe Supabase client using the PUBLIC anon key.
// Replaces the old, empty, mis-named "supabase,js".
//
// Payment entitlements are read via /api/entitlements (server-side, service
// role) — NOT from this client — so nothing sensitive is exposed here.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;
