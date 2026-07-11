// api/entitlements.js
// GET /api/entitlements?email=someone@example.com
// -> { scopes: ["all"] } or { scopes: ["3","5"] }
//
// Authoritative "what is unlocked". Only returns paid, non-expired purchases.
// Runs server-side (service role) so the browser can't forge it.

import { supabaseAdmin } from "./_lib/supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "email is required" });

  try {
    const nowIso = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("purchases")
      .select("scope, status, expires_at")
      .eq("customer_email", email)
      .eq("status", "paid");

    if (error) throw error;

    // Keep a scope if it has no expiry (lifetime) or expiry is in the future.
    const scopes = [
      ...new Set(
        (data || [])
          .filter((r) => !r.expires_at || r.expires_at > nowIso)
          .map((r) => r.scope)
      ),
    ];

    return res.status(200).json({ scopes });
  } catch (err) {
    console.error("[entitlements]", err);
    return res.status(500).json({ error: "Could not load entitlements" });
  }
}
