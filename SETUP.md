# CBSE Practice Hub — Payments (final)

Real, secure **one-time** purchases via Razorpay, backed by Supabase, on Vercel.
No subscription, no e-mandate, no lifecycle webhook — the simplest model that
fits downloadable worksheets.

## Pricing (live in the app)
- **Single Class — 1 year:** ₹199
- **All Classes — 1 year:** ₹499  *(most popular / siblings)*
- **All Classes — Lifetime:** ₹999  *(anchor + all future content)*
- Free tier unchanged: 3 downloads per class.

## How it works
```
Browser (PaymentModal, collects name/email/phone only)
   ▼  POST /api/order/create        → server sets amount from CATALOG, makes Razorpay order
Razorpay Checkout (UPI/QR/cards/netbanking/wallets — PCI-safe, on Razorpay's page)
   ▼  POST /api/order/verify        → verify HMAC(order_id|payment_id), grant entitlement
UNLOCK (localStorage cache + Supabase truth)
GET /api/entitlements?email=…       → restore purchases / cross-device (paid & non-expired only)
```
1-year plans store a 365-day `expires_at`; Lifetime stores `null` (never expires).

---

## Setup (about 20 minutes)

1. **Install deps** (already in the new `package.json`):
   ```bash
   npm install
   ```
2. **Supabase:** SQL Editor → paste `supabase/schema.sql` → Run.
3. **Env vars** (Vercel → Settings → Environment Variables), from `.env.example`:
   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` (+ optional `VITE_*`). Start with **test** keys.
4. **Deploy** to Vercel. The `/api` folder becomes serverless functions
   automatically.
5. **Test:** open the app → use up 3 free downloads → checkout with Razorpay
   test UPI `success@razorpay` or a test card. Confirm access unlocks *after*
   verify, and a `paid` row appears in Supabase `purchases`.
6. **Fill the policy pages:** replace every `{{PLACEHOLDER}}` in
   `public/{terms,privacy,refunds,contact}.html` with your real details.

## Go-live checklist (Razorpay live activation)
- [ ] KYC complete in Razorpay (PAN, bank, business proof).
- [ ] Policy pages live, filled, and linked (they're linked from the pricing page).
- [ ] Business name on site matches the Razorpay account name.
- [ ] Swap test keys → **live** keys in env vars.
- [ ] One real ₹199 transaction end-to-end, then refund it.

> No webhook is required for one-time orders (verify grants access
> synchronously). If you later want server-side reconciliation, add a
> `payment.captured` webhook — happy to provide it.

## Security
- Key **secret** and Supabase **service-role** key stay in server env only.
- Browser gets only the **public** Razorpay key id.
- Access is granted **only** after server-side signature verification
  (`order_id + "|" + payment_id`).
- `/api/entitlements` is the source of truth; editing localStorage grants
  nothing durable.
- No card/CVV/UPI-PIN ever touches your code.
