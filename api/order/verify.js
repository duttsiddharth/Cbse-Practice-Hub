// api/order/verify.js
// POST { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// -> { ok: true, scope, expires_at }
//
// Confirms the Checkout response is authentic BEFORE granting access, then
// records the entitlement (with a 1-year expiry, or none for lifetime).

import { verifyOrderSignature } from "../_lib/razorpay.js";
import { supabaseAdmin } from "../_lib/supabaseAdmin.js";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    const valid = verifyOrderSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    if (!valid) return res.status(400).json({ ok: false, error: "Signature verification failed" });

    // Look up the order we created to get its scope + kind.
    const { data: purchase, error } = await supabaseAdmin
      .from("purchases")
      .select("razorpay_order_id, scope, kind, customer_email")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (error || !purchase) return res.status(404).json({ ok: false, error: "Order not found" });

    const expiresAt =
      purchase.kind === "lifetime" ? null : new Date(Date.now() + YEAR_MS).toISOString();

    await supabaseAdmin
      .from("purchases")
      .update({
        status: "paid",
        payment_id: razorpay_payment_id,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id);

    return res.status(200).json({
      ok: true,
      scope: purchase.scope,
      email: purchase.customer_email,
      expires_at: expiresAt,
    });
  } catch (err) {
    console.error("[order/verify]", err);
    return res.status(500).json({ ok: false, error: "Verification error" });
  }
}
