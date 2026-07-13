# UPLOAD MANIFEST — duttsiddharth/Cbse-Practice-Hub

Copy into your repo at the SAME paths, commit & push (Vercel auto-deploys and
regenerates the SEO pages via the new build script).

## REPLACE (overwrite existing)
- `src/CBSEPracticeHub.jsx`   ← payments + pricing + SEO deep-linking
- `index.html`                ← SEO meta, no-JS fallback content, structured data
- `package.json`              ← razorpay + supabase deps; build now generates SEO pages
- `vercel.json`               ← SPA fallback that leaves static SEO pages crawlable
                                  (create it if you don't have one)

## ADD (new files)
Payments:
- `api/_lib/razorpay.js`, `api/_lib/supabaseAdmin.js`
- `api/order/create.js`, `api/order/verify.js`, `api/entitlements.js`
- `src/lib/payments.js`, `src/lib/supabaseClient.js`
- `supabase/schema.sql`
- `public/terms.html`, `public/privacy.html`, `public/refunds.html`, `public/contact.html`
- `.env.example`

SEO:
- `scripts/generate-seo.mjs`          ← generates the pages at build time
- `public/class/**`                   ← 35 generated pages (regenerated on each build)
- `public/sitemap.xml`, `public/robots.txt`  ← generated

Docs:
- `SETUP.md` (payments), `SEO_STEPS.md` (search), this manifest

## DELETE (from the repo)
- `src/supabase,js`
- `src/CBSEPracticeHub.-old.jsx`

## DO NOT COMMIT
- Real secrets. Keys live in Vercel env vars only.

## After deploy
1. Confirm `/class/5/maths/`, `/sitemap.xml`, `/robots.txt` load.
2. Google Search Console → verify → submit `sitemap.xml` (see SEO_STEPS.md).
3. Payments: env vars set (Production) + `supabase/schema.sql` run + redeploy.

## Note
`data.json` is NOT included — your repo's copy is the source of truth; the build
script reads it to generate the pages. Edit worksheets there and they propagate
to the SEO pages on next deploy.
