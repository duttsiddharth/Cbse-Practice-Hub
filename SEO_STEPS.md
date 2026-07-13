# Getting CBSE Practice Hub into Google — steps

## What was added
- **35 static, crawlable pages** generated from `data.json`: one per class
  (`/class/5/`) and one per class+subject (`/class/5/maths/`), each with real
  worksheet listings, FAQs, unique titles/descriptions, canonical tags, and
  structured data (Breadcrumb + FAQ + Course/ItemList).
- **`sitemap.xml`** and **`robots.txt`** (auto-generated).
- **Homepage** now has a `<noscript>` block with real links + `WebSite`
  structured data, so crawlers see content immediately instead of an empty shell.
- **Deep-linking**: a Google visitor landing on `/class/5/maths/` and clicking
  "Practise" opens the app right at that class.
- Pages regenerate on every deploy (wired into `npm run build`).

## 1. Deploy
Upload the new/changed files (see UPLOAD_MANIFEST.md), commit, push. Vercel runs
`npm run build`, which runs `scripts/generate-seo.mjs` first — so the pages and
sitemap are rebuilt from your latest `data.json` automatically.

After deploy, confirm these load:
- `https://cbse-practice-hub.vercel.app/class/5/maths/` (real content, not the app)
- `https://cbse-practice-hub.vercel.app/sitemap.xml`
- `https://cbse-practice-hub.vercel.app/robots.txt`

## 2. Google Search Console (this is what gets you indexed)
1. Go to search.google.com/search-console → **Add property** → **URL prefix** →
   enter `https://cbse-practice-hub.vercel.app` (or your custom domain).
2. **Verify.** Easiest for Vercel: the **HTML tag** method — copy the
   `<meta name="google-site-verification" ...>` tag it gives you and paste it
   into `index.html` inside `<head>`, redeploy, then click Verify. (Send me the
   tag and I'll place it for you.)
3. **Submit your sitemap:** left menu → **Sitemaps** → enter `sitemap.xml` →
   Submit.
4. **Request indexing for a few key pages:** use the search bar at the top
   ("URL Inspection"), paste `https://cbse-practice-hub.vercel.app/class/5/` →
   **Request indexing**. Do this for the homepage and 3–4 top class pages to
   kick-start crawling; the rest follow via the sitemap.

## 3. Bing (5 minutes, ~30% of India search + powers ChatGPT/Copilot)
bing.com/webmasters → add site → you can **import from Google Search Console**
in one click, then submit the same `sitemap.xml`.

## 4. When you move to a custom domain
1. Add the domain in Vercel (Settings → Domains) + the DNS record at Hostinger.
2. Set a Vercel **environment variable** `SITE_URL=https://yourdomain` (Production)
   so canonicals, sitemap, and OG URLs use the new domain. Redeploy.
3. Update the hardcoded `https://cbse-practice-hub.vercel.app/` in `index.html`
   (canonical + OG + JSON-LD) to the new domain — or tell me the domain and I'll
   swap them.
4. Add the new domain as a **separate property** in Search Console and resubmit
   the sitemap. Keep the vercel.app redirecting to the new domain.

## 5. What to expect
- Indexing starts within a few days of sitemap submission; meaningful ranking
  for long-tail terms ("class 5 maths worksheets cbse") typically builds over
  4–12 weeks.
- The pages are content-rich (real worksheet lists + FAQs), not thin doorways,
  which is what keeps them safely indexable.

## Boosters (optional, high ROI later)
- Add a couple of paragraphs of unique guidance per subject page (what the class
  covers, how to use the sheets) — more unique text ranks better.
- Get a few inbound links (parenting forums, school WhatsApp groups, a LinkedIn
  post from you) — even a handful accelerates ranking a lot for a new site.
- A simple blog (`/blog/how-to-help-your-child-with-cbse-maths`) captures
  informational searches that convert into worksheet buyers.
