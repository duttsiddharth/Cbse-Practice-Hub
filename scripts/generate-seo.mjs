// scripts/generate-seo.mjs
// Generates crawlable static HTML landing pages (one per class and per
// class+subject), plus sitemap.xml and robots.txt, into /public.
// Run automatically at build time (see package.json "build").
//
// Set SITE_URL when you move to a custom domain, e.g.:
//   SITE_URL=https://cbsepracticehub.in node scripts/generate-seo.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SITE = (process.env.SITE_URL || "https://cbse-practice-hub.vercel.app").replace(/\/$/, "");

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data.json"), "utf8"));

// Subject → URL slug (Indian search terms) and display name.
const SUBJECT_SLUG = {
  "Mathematics": "maths",
  "English": "english",
  "EVS": "evs",
  "Science": "science",
  "Social Science": "social-science",
};
const DISPLAY = { "Mathematics": "Maths" }; // shown in titles; others use their own name

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const dispSubject = (s) => DISPLAY[s] || s;

// ── group data ───────────────────────────────────────────────────────────────
const classes = {};
for (const w of data) {
  classes[w.class] ??= {};
  (classes[w.class][w.subject] ??= []).push(w);
}
const classList = Object.keys(classes).map(Number).sort((a, b) => a - b);

// ── shared page chrome ───────────────────────────────────────────────────────
const STYLE = `
:root{--brand:#1e40af;--ink:#0f172a;--muted:#475569;--line:#e8edf5;--bg:#f0f4fa}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6}
a{color:var(--brand);text-decoration:none}
.top{background:#fff;border-bottom:1px solid var(--line);padding:12px 20px;display:flex;justify-content:space-between;align-items:center}
.top .logo{font-weight:800}
.cta-top{background:var(--brand);color:#fff;padding:8px 16px;border-radius:8px;font-weight:600;font-size:14px}
.wrap{max-width:860px;margin:0 auto;padding:24px 20px 60px}
.bc{font-size:13px;color:var(--muted);margin:10px 0 18px}
h1{font-size:30px;letter-spacing:-.6px;margin:6px 0 10px}
h2{font-size:19px;margin:30px 0 10px}
.lede{font-size:16px;color:var(--muted)}
.facts{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0}
.facts span{background:#fff;border:1px solid var(--line);border-radius:20px;padding:6px 14px;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:6px}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px}
.card h3{margin:0 0 4px;font-size:15px}
.card p{margin:0;font-size:13px;color:var(--muted)}
.cta{display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:#fff;padding:14px 26px;border-radius:10px;font-weight:700;font-size:16px;margin:8px 0}
ul.sheets{list-style:none;padding:0;margin:8px 0}
ul.sheets li{background:#fff;border:1px solid var(--line);border-radius:10px;padding:11px 14px;margin-bottom:8px;font-size:14px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
ul.sheets .meta{color:var(--muted);font-size:12.5px}
.faq h3{font-size:15px;margin:16px 0 4px}
.faq p{margin:0 0 6px;color:var(--muted);font-size:14px}
.other{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.other a{background:#fff;border:1px solid var(--line);border-radius:8px;padding:7px 12px;font-size:13px}
footer{border-top:1px solid var(--line);margin-top:36px;padding-top:16px;font-size:12.5px;color:var(--muted)}
footer a{color:var(--muted);margin-right:12px}
`;

function page({ url, title, desc, jsonld, body }) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${url}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${url}">
<meta property="og:site_name" content="CBSE Practice Hub">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg">
<style>${STYLE}</style>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head><body>
<div class="top"><a class="logo" href="/">📚 CBSE Practice Hub</a><a class="cta-top" href="/">Open the app →</a></div>
<div class="wrap">${body}
<footer>
<div class="other" style="margin-bottom:12px">${classList.map(c => `<a href="/class/${c}/">Class ${c}</a>`).join("")}</div>
<a href="/terms.html">Terms</a><a href="/privacy.html">Privacy</a><a href="/refunds.html">Refunds</a><a href="/contact.html">Contact</a>
<div style="margin-top:10px">© 2026 SD Advisory · CBSE Practice Hub. Aligned to the CBSE/NCERT 2026–27 session. Not affiliated with CBSE or NCERT.</div>
</footer>
</div></body></html>`;
}

function breadcrumb(items) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem", position: i + 1, name: it.name,
      ...(it.url ? { item: SITE + it.url } : {}),
    })),
  };
}

function faqJsonLd(faqs) {
  return {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

// ── write files ──────────────────────────────────────────────────────────────
const urls = ["/"]; // homepage first
function writePage(url, html) {
  const dir = path.join(ROOT, "public", url.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  urls.push(url);
}

// Class pages
for (const c of classList) {
  const subjects = Object.keys(classes[c]).sort();
  const total = subjects.reduce((n, s) => n + classes[c][s].length, 0);
  const url = `/class/${c}/`;
  const title = `CBSE Class ${c} Worksheets (2026–27) — Free Printable Practice | CBSE Practice Hub`;
  const desc = `Free printable CBSE Class ${c} practice worksheets for ${subjects.map(dispSubject).join(", ")} — ${total} worksheets with answer keys, aligned to the 2026–27 session. Download PDFs and start practising.`;
  const faqs = [
    [`Are the Class ${c} worksheets free?`, `You get 3 free downloads per class. Unlock unlimited downloads for Class ${c} with a one-time payment of ₹199 (or ₹499 for all classes).`],
    [`Are these worksheets aligned to the CBSE syllabus?`, `Yes — all Class ${c} worksheets follow the CBSE/NCERT curriculum for the 2026–27 session across ${subjects.map(dispSubject).join(", ")}.`],
    [`Do the worksheets include answer keys?`, `Yes, every worksheet comes with an answer key so parents can check their child's work quickly.`],
    [`Can I download the worksheets as PDF?`, `Yes, each worksheet is a printable PDF you can download and print at home.`],
  ];
  const body = `
<div class="bc"><a href="/">Home</a> › Class ${c}</div>
<h1>CBSE Class ${c} Practice Worksheets</h1>
<p class="lede">Printable CBSE/NCERT worksheets for Class ${c}, aligned to the <strong>2026–27 session</strong>. ${total} worksheets across ${subjects.length} subjects, each with an answer key. Start with 3 free downloads.</p>
<div class="facts"><span>📄 ${total} worksheets</span><span>📚 ${subjects.length} subjects</span><span>🎯 Easy · Medium · Hard</span><span>✅ Answer keys included</span><span>🖨️ Printable PDF</span></div>
<a class="cta" href="/?class=${c}">Start practising free →</a>
<h2>Subjects for Class ${c}</h2>
<div class="grid">
${subjects.map(s => `<a class="card" href="/class/${c}/${SUBJECT_SLUG[s]}/"><h3>${esc(dispSubject(s))}</h3><p>${classes[c][s].length} worksheets · answer keys</p></a>`).join("")}
</div>
<h2>What's included</h2>
<p>Each subject has worksheets at three difficulty levels (Easy, Medium, Hard) with multiple sets, so your child can practise progressively. Every sheet is a ready-to-print PDF with a matching answer key. New worksheets are added through the session.</p>
<h2>Frequently asked questions</h2>
<div class="faq">${faqs.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}</div>
<h2>Other classes</h2>
<div class="other">${classList.filter(x => x !== c).map(x => `<a href="/class/${x}/">Class ${x} worksheets</a>`).join("")}</div>`;

  writePage(url, page({
    url, title, desc,
    jsonld: [
      breadcrumb([{ name: "Home", url: "/" }, { name: `Class ${c}` }]),
      faqJsonLd(faqs),
      { "@context": "https://schema.org", "@type": "Course", name: `CBSE Class ${c} Practice Worksheets`,
        description: desc, provider: { "@type": "Organization", name: "CBSE Practice Hub", url: SITE } },
    ],
    body,
  }));

  // Class + subject pages
  for (const s of subjects) {
    const sheets = classes[c][s].slice().sort((a, b) => a.title.localeCompare(b.title));
    const surl = `/class/${c}/${SUBJECT_SLUG[s]}/`;
    const sd = dispSubject(s);
    const stitle = `CBSE Class ${c} ${sd} Worksheets (2026–27) — Free Printable PDF | CBSE Practice Hub`;
    const sdesc = `Free printable CBSE Class ${c} ${sd} worksheets — ${sheets.length} practice sheets with answer keys at Easy, Medium & Hard levels, aligned to the 2026–27 session. Download PDFs.`;
    const sfaqs = [
      [`Are the Class ${c} ${sd} worksheets free?`, `You get 3 free downloads per class. Unlock all Class ${c} ${sd} worksheets with a one-time ₹199 (single class) payment.`],
      [`What topics do the Class ${c} ${sd} worksheets cover?`, `They cover the CBSE/NCERT Class ${c} ${sd} curriculum for 2026–27 at Easy, Medium and Hard levels, with ${sheets.length} worksheets in total.`],
      [`Do they include answer keys?`, `Yes — every Class ${c} ${sd} worksheet includes an answer key.`],
    ];
    const sbody = `
<div class="bc"><a href="/">Home</a> › <a href="/class/${c}/">Class ${c}</a> › ${esc(sd)}</div>
<h1>CBSE Class ${c} ${esc(sd)} Worksheets</h1>
<p class="lede">${sheets.length} printable Class ${c} ${esc(sd)} worksheets with answer keys, at Easy, Medium and Hard levels — aligned to the CBSE/NCERT <strong>2026–27 session</strong>. First 3 downloads free.</p>
<div class="facts"><span>📄 ${sheets.length} worksheets</span><span>🎯 3 difficulty levels</span><span>✅ Answer keys</span><span>🖨️ Printable PDF</span></div>
<a class="cta" href="/?class=${c}&subject=${SUBJECT_SLUG[s]}">Practise Class ${c} ${esc(sd)} free →</a>
<h2>Class ${c} ${esc(sd)} worksheet list</h2>
<ul class="sheets">
${sheets.map(w => `<li><span>${esc(w.title)}</span><span class="meta">${w.question_count} questions · ${w.pages} pages${w.has_answer_key ? " · answer key" : ""}</span></li>`).join("")}
</ul>
<h2>Frequently asked questions</h2>
<div class="faq">${sfaqs.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}</div>
<h2>More Class ${c} subjects</h2>
<div class="other">${Object.keys(classes[c]).filter(x => x !== s).map(x => `<a href="/class/${c}/${SUBJECT_SLUG[x]}/">Class ${c} ${esc(dispSubject(x))}</a>`).join("")}</div>`;

    writePage(surl, page({
      url: surl, title: stitle, desc: sdesc,
      jsonld: [
        breadcrumb([{ name: "Home", url: "/" }, { name: `Class ${c}`, url: `/class/${c}/` }, { name: sd }]),
        faqJsonLd(sfaqs),
        { "@context": "https://schema.org", "@type": "ItemList", name: `CBSE Class ${c} ${sd} Worksheets`,
          numberOfItems: sheets.length,
          itemListElement: sheets.map((w, i) => ({ "@type": "ListItem", position: i + 1, name: w.title })) },
      ],
      body: sbody,
    }));
  }
}

// ── sitemap.xml + robots.txt ─────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${u === "/" ? "1.0" : u.split("/").length <= 3 ? "0.8" : "0.6"}</priority></url>`).join("\n")}
</urlset>`;
fs.writeFileSync(path.join(ROOT, "public", "sitemap.xml"), sitemap);

fs.writeFileSync(path.join(ROOT, "public", "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`✓ Generated ${urls.length - 1} SEO pages + sitemap.xml + robots.txt (base: ${SITE})`);
