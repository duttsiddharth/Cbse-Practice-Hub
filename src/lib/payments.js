// src/lib/payments.js
// Front-end payment helpers. No secrets here — only talks to our own /api.

let rzpScriptPromise = null;
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  if (rzpScriptPromise) return rzpScriptPromise;
  rzpScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.head.appendChild(s);
  });
  return rzpScriptPromise;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/**
 * One-time purchase flow.
 *  args: { planKey, cls, label, customer:{name,email,contact} }
 *  onSuccess(scope, email)  — only after server-side signature verification
 *  onError(message)
 *  onDismiss()              — user closed Checkout without paying
 */
export async function startPurchase({ planKey, cls, label, customer }, { onSuccess, onError, onDismiss }) {
  try {
    await loadRazorpay();

    // 1) Create the order server-side (amount decided on the server).
    const { order_id, key_id, amount, currency, scope } = await postJSON("/api/order/create", {
      planKey,
      cls,
      customer,
    });

    // 2) Open Razorpay Checkout (renders UPI/QR, cards, netbanking, wallets).
    const rzp = new window.Razorpay({
      key: key_id,
      order_id,
      amount,
      currency,
      name: "CBSE Practice Hub",
      description: label,
      image: "/favicon.svg",
      theme: { color: "#1e40af" },
      prefill: {
        name: customer?.name || "",
        email: customer?.email || "",
        contact: customer?.contact || "",
      },
      handler: async (resp) => {
        // 3) Verify the signature server-side BEFORE unlocking.
        try {
          const v = await postJSON("/api/order/verify", {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
          if (v.ok) onSuccess?.(v.scope || scope, v.email || customer?.email);
          else onError?.("Payment could not be verified. If money was deducted, it will be refunded.");
        } catch (e) {
          onError?.(e.message);
        }
      },
      modal: { ondismiss: () => onDismiss?.() },
    });

    rzp.on("payment.failed", (r) => onError?.(r?.error?.description || "Payment failed. Please try again."));
    rzp.open();
  } catch (e) {
    onError?.(e.message);
  }
}

/**
 * Fetch unlocked scopes for an email (restore purchases / cross-device).
 * Returns ["all"] or ["3","5"] etc.
 */
export async function fetchEntitlements(email) {
  if (!email) return [];
  const res = await fetch(`/api/entitlements?email=${encodeURIComponent(email)}`);
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data.scopes) ? data.scopes : [];
}
