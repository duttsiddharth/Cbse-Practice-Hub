# UPLOAD MANIFEST — what goes where in duttsiddharth/Cbse-Practice-Hub

Copy these into your repo at the SAME paths. Then commit & push (Vercel
auto-deploys).

## REPLACE (overwrite existing files)
- `src/CBSEPracticeHub.jsx`   ← new pricing, real one-time checkout, restore, 2026–27
- `index.html`                ← SEO title + meta, favicon.svg
- `package.json`              ← adds razorpay + @supabase/supabase-js

## ADD (new files)
- `api/_lib/razorpay.js`
- `api/_lib/supabaseAdmin.js`
- `api/order/create.js`
- `api/order/verify.js`
- `api/entitlements.js`
- `src/lib/payments.js`
- `src/lib/supabaseClient.js`
- `supabase/schema.sql`
- `public/terms.html`
- `public/privacy.html`
- `public/refunds.html`
- `public/contact.html`
- `.env.example`   (do NOT commit real secrets — set them in Vercel)
- `SETUP.md`

## DELETE (from the repo)
- `src/supabase,js`            (empty, mis-named, unused)
- `src/CBSEPracticeHub.-old.jsx`  (stale backup; still has ₹49/month + 2025)

## DO NOT COMMIT
- Any real key values. Put them in Vercel env vars only.

---

### Quick sanity after deploy
1. `npm install` locally builds without errors.
2. Env vars set in Vercel (test keys first).
3. Supabase schema run.
4. Use 3 free downloads → paywall → checkout → unlock works and a `paid` row
   lands in Supabase `purchases`.
