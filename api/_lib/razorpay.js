// api/_lib/razorpay.js
// Server-only Razorpay client + signature helper.
// NEVER import this from browser code — it uses the key SECRET.

import Razorpay from "razorpay";
import crypto from "node:crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
  console.error("[razorpay] Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET env vars");
}

export const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
export const RAZORPAY_KEY_ID = KEY_ID;

/**
 * Verify the signature returned by Checkout for a ONE-TIME ORDER.
 * Signed string is:  order_id + "|" + payment_id
 */
export function verifyOrderSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  return timingSafeEqual(expected, razorpay_signature);
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ── Product catalogue (server is the source of truth for prices) ─────────────
// Amounts in paise. Keep in sync with the PLANS object in src/CBSEPracticeHub.jsx.
export const CATALOG = {
  class:    { amount: 19900, scope: "class",    kind: "year",     label: "Single Class — 1 Year" },
  all:      { amount: 49900, scope: "all",      kind: "year",     label: "All Classes — 1 Year" },
  lifetime: { amount: 99900, scope: "all",      kind: "lifetime", label: "All Classes — Lifetime" },
};
