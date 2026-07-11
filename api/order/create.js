// api/order/create.js
// POST { planKey: "class"|"all"|"lifetime", cls: number|null,
//        customer: { name, email, contact } }
// -> { order_id, key_id, amount, currency, scope }
//
// The server picks the amount from CATALOG — never trust an amount from the
// client. Creates a Razorpay order and a "created" row in Supabase.

import { razorpay, RAZORPAY_KEY_ID, CATALOG } from "../_lib/razorpay.js";
import { supabaseAdmin, normaliseScope } from "../_lib/supabaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { planKey, cls, customer } = req.body || {};
    const product = CATALOG[planKey];
    if (!product) return res.status(400).json({ error: "Invalid plan" });

    // Resolve the scope the purchase unlocks.
    const scope = product.scope === "class" ? normaliseScope(cls) : "all";
    if (!scope) return res.status(400).json({ error: "Invalid class scope" });

    const email = (customer?.email || "").trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: "A valid email is required" });
    }

    await supabaseAdmin
      .from("customers")
      .upsert(
        { email, name: customer?.name || null, contact: customer?.contact || null },
        { onConflict: "email" }
      );

    const order = await razorpay.orders.create({
      amount: product.amount,
      currency: "INR",
      receipt: `cbse_${Date.now()}`,
      notes: { planKey, scope, kind: product.kind, email, product: "CBSE Practice Hub" },
    });

    await supabaseAdmin.from("purchases").upsert(
      {
        razorpay_order_id: order.id,
        customer_email: email,
        scope,
        plan_key: planKey,
        kind: product.kind,
        amount: product.amount,
        status: "created",
        raw: order,
      },
      { onConflict: "razorpay_order_id" }
    );

    return res.status(200).json({
      order_id: order.id,
      key_id: RAZORPAY_KEY_ID,
      amount: product.amount,
      currency: "INR",
      scope,
    });
  } catch (err) {
    console.error("[order/create]", err);
    return res.status(500).json({ error: "Could not create order" });
  }
}
