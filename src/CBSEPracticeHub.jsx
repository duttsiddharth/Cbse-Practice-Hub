import { useState, useMemo, useEffect } from "react";
import WORKSHEETS from "../data.json";

// ─── Subject metadata ────────────────────────────────────────────────────────
const SUBJECT_META = {
  English:          { icon: "📖", color: "#b45309", bg: "#fef9ee", border: "#fbbf24" },
  Mathematics:      { icon: "🔢", color: "#1d4ed8", bg: "#eff6ff", border: "#60a5fa" },
  EVS:              { icon: "🌿", color: "#047857", bg: "#f0fdf4", border: "#34d399" },
  Science:          { icon: "🔬", color: "#6d28d9", bg: "#f5f3ff", border: "#a78bfa" },
  "Social Science": { icon: "🌍", color: "#be185d", bg: "#fdf2f8", border: "#f472b6" },
};

const SUBJECTS_BY_CLASS = (cls) =>
  cls <= 5 ? ["English", "Mathematics", "EVS"]
           : ["English", "Mathematics", "Science", "Social Science"];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DIFF_STYLE = {
  Easy:   { bg: "#dcfce7", color: "#15803d", border: "#86efac" },
  Medium: { bg: "#fef9c3", color: "#92400e", border: "#fde047" },
  Hard:   { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
};
const CLASS_COLORS = ["#1d4ed8","#0891b2","#047857","#d97706","#dc2626","#7c3aed","#be185d","#0369a1"];

const NCERT_STAGES = [
  { cls:"1–5",  label:"Primary Stage",     subjects:["English","Mathematics","EVS","Hindi"],                                   desc:"Foundation concepts with illustrations and activities" },
  { cls:"6–8",  label:"Middle Stage",      subjects:["English","Mathematics","Science","Social Science","Hindi"],               desc:"Core CBSE subjects with exercises and diagrams" },
  { cls:"9–10", label:"Secondary Stage",   subjects:["English","Mathematics","Science","Social Science","Hindi"],               desc:"Board exam preparation content" },
  { cls:"11–12",label:"Senior Secondary",  subjects:["Physics","Chemistry","Biology","Mathematics","Economics","History"],      desc:"Advanced subject knowledge for board exams" },
];

// ─── Utilities ───────────────────────────────────────────────────────────────
const Toast = ({ msg, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:20, right:20, zIndex:9999, background:"#1e293b",
      color:"#fff", padding:"11px 18px", borderRadius:10, fontSize:13,
      display:"flex", alignItems:"center", gap:10, maxWidth:340, boxShadow:"0 8px 24px rgba(0,0,0,0.25)" }}>
      <span>✅</span>
      <span style={{ flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", fontSize:16, padding:0 }}>×</button>
    </div>
  );
};

const Bc = ({ crumbs, onNav }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:4, alignItems:"center", marginBottom:20, fontSize:13 }}>
    {crumbs.map((c, i) => (
      <span key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
        {i < crumbs.length - 1
          ? <button onClick={() => onNav(c.a)} style={{ background:"none", border:"none", color:"#2563eb", cursor:"pointer", fontSize:13, padding:0 }}>{c.l}</button>
          : <span style={{ color:"var(--color-text-primary,#0f172a)", fontWeight:500 }}>{c.l}</span>}
        {i < crumbs.length - 1 && <span style={{ color:"#cbd5e1" }}>›</span>}
      </span>
    ))}
  </div>
);

// ─── Style tokens ────────────────────────────────────────────────────────────
const T = {
  page:  { minHeight:"100vh", background:"var(--color-background-tertiary,#f8fafc)", fontFamily:"var(--font-sans,system-ui,sans-serif)" },
  hdr:   { background:"var(--color-background-primary,#fff)", borderBottom:"0.5px solid var(--color-border-tertiary,#e2e8f0)",
           padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
           height:56, position:"sticky", top:0, zIndex:100 },
  main:  { maxWidth:1100, margin:"0 auto", padding:"28px 20px" },
  H2:    { fontSize:20, fontWeight:600, color:"var(--color-text-primary,#0f172a)", marginBottom:6, letterSpacing:"-0.4px" },
  sub:   { fontSize:14, color:"var(--color-text-secondary,#64748b)", marginBottom:24 },
  card:  { background:"var(--color-background-primary,#fff)", border:"0.5px solid var(--color-border-tertiary,#e2e8f0)", borderRadius:12, padding:"18px 20px" },
  bp:    { background:"#1e40af", color:"#fff", border:"none", padding:"9px 18px", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer" },
  bs:    { background:"none", color:"var(--color-text-secondary,#475569)", border:"0.5px solid var(--color-border-secondary,#e2e8f0)", padding:"9px 18px", borderRadius:8, fontSize:13, cursor:"pointer" },
  inp:   { width:"100%", padding:"9px 12px", borderRadius:8, border:"0.5px solid var(--color-border-secondary,#e2e8f0)", fontSize:13, background:"var(--color-background-primary,#fff)", color:"var(--color-text-primary,#0f172a)", boxSizing:"border-box" },
  sel:   { padding:"9px 12px", borderRadius:8, border:"0.5px solid var(--color-border-secondary,#e2e8f0)", fontSize:13, background:"var(--color-background-primary,#fff)", color:"var(--color-text-primary,#0f172a)" },
  chip:  { display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, fontSize:11, background:"var(--color-background-secondary,#f1f5f9)", border:"0.5px solid var(--color-border-tertiary,#e2e8f0)", color:"var(--color-text-secondary,#64748b)" },
  badge: (s) => ({ display:"inline-flex", alignItems:"center", padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:500, border:`0.5px solid ${s.border}`, background:s.bg, color:s.color }),
  nb:    { padding:"6px 14px", borderRadius:6, border:"0.5px solid var(--color-border-secondary,#e2e8f0)", background:"none", fontSize:13, cursor:"pointer", color:"var(--color-text-secondary,#64748b)" },
  nba:   { background:"#1e40af", color:"#fff", border:"0.5px solid #1e40af" },
};

const Hdr = ({ nav, active }) => (
  <header style={T.hdr}>
    <div onClick={() => nav("home")} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
      <div style={{ width:30, height:30, borderRadius:7, background:"#1e40af", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📚</div>
      <span style={{ fontWeight:600, fontSize:15, color:"var(--color-text-primary,#0f172a)", letterSpacing:"-0.3px" }}>CBSE Practice Hub</span>
    </div>
    <div style={{ display:"flex", gap:6 }}>
      <button onClick={() => nav("search")} style={{ ...T.nb, ...(active==="search" ? T.nba:{}) }}>🔍 Search</button>
      <button onClick={() => nav("ebooks")} style={{ ...T.nb, ...(active==="ebooks" ? T.nba:{}) }}>📗 Ebooks</button>
    </div>
  </header>
);

const openPDF = (ws, showToast) => {
  if (ws.pdf_url) {
    window.open(ws.pdf_url, "_blank", "noopener,noreferrer");
    showToast(`Opening "${ws.title}"…`);
  } else {
    showToast("PDF link not available");
  }
};

// ════════════════════════════════════════════════════════════════════════════
export default function CBSEPracticeHub() {
  const [view,   setView]       = useState("home");
  const [cls,    setCls]        = useState(null);
  const [subj,   setSubj]       = useState(null);
  const [toast,  setToast]      = useState(null);
  const [q,      setQ]          = useState("");
  const [fCls,   setFCls]       = useState("");
  const [fSub,   setFSub]       = useState("");
  const [fDiff,  setFDiff]      = useState("");

  const toast2 = (m) => setToast(m);

  const nav = (a) => {
    if      (a === "home")    { setView("home");    setCls(null); setSubj(null); }
    else if (a === "class")   { setView("class");   setSubj(null); }
    else if (a === "subject") { setView("subject"); }
    else                      { setView(a); }
  };

  const subjWS = useMemo(() =>
    cls && subj ? WORKSHEETS.filter(w => w.class === cls && w.subject === subj) : [],
    [cls, subj]);

  const searchWS = useMemo(() =>
    WORKSHEETS.filter(w => {
      const lq = q.toLowerCase();
      return (
        (!lq || w.title.toLowerCase().includes(lq) || w.subject.toLowerCase().includes(lq) || `class ${w.class}`.includes(lq)) &&
        (!fCls  || w.class      === parseInt(fCls)) &&
        (!fSub  || w.subject    === fSub) &&
        (!fDiff || w.difficulty === fDiff)
      );
    }),
    [q, fCls, fSub, fDiff]);

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (view === "home") return (
    <div style={T.page}>
      <Hdr nav={nav} active="home" />

      <div style={{ background:"linear-gradient(135deg,#1e3a8a,#1e40af 55%,#2563eb)", padding:"60px 24px", textAlign:"center" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.15)",
          border:"0.5px solid rgba(255,255,255,0.3)", borderRadius:20, padding:"4px 14px", fontSize:12,
          color:"rgba(255,255,255,0.9)", marginBottom:16 }}>
          ✨ Updated as per CBSE 2025–26 Syllabus
        </div>
        <h1 style={{ fontSize:36, fontWeight:700, color:"#fff", margin:"0 0 14px", letterSpacing:"-1px", lineHeight:1.15 }}>
          Practice Smarter with<br/><span style={{ color:"#fbbf24" }}>CBSE Worksheets</span>
        </h1>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.75)", margin:"0 0 28px", maxWidth:480, marginLeft:"auto", marginRight:"auto", lineHeight:1.6 }}>
          Free printable PDFs for Class 1–8 · All subjects · Easy, Medium & Hard · 25 questions each · Answer keys included
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => document.getElementById("cg")?.scrollIntoView({ behavior:"smooth" })}
            style={{ background:"#fbbf24", color:"#1e3a8a", border:"none", padding:"12px 24px", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer" }}>
            Browse by Class ↓
          </button>
          <button onClick={() => nav("search")}
            style={{ background:"rgba(255,255,255,0.15)", color:"#fff", border:"0.5px solid rgba(255,255,255,0.4)", padding:"12px 24px", borderRadius:8, fontSize:14, cursor:"pointer" }}>
            Search Worksheets
          </button>
        </div>
      </div>

      {/* Feature strip */}
      <div style={{ background:"var(--color-background-primary,#fff)", borderBottom:"0.5px solid var(--color-border-tertiary,#e2e8f0)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))" }}>
          {[["📥","Free Downloads","100% free, no sign-up"],["📚","All Subjects","English, Math, Science & more"],
            ["🎯","3 Difficulty Levels","Easy, Medium & Hard"],["✅","Answer Keys","Every PDF has answers"],
            ["🖨️","Print-Ready A4","Download & print instantly"]].map(([ic,lb,ds],i,arr) => (
            <div key={i} style={{ padding:"14px", textAlign:"center", borderRight: i<arr.length-1 ? "0.5px solid var(--color-border-tertiary,#e2e8f0)":"none" }}>
              <div style={{ fontSize:20, marginBottom:5 }}>{ic}</div>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--color-text-primary,#0f172a)", marginBottom:2 }}>{lb}</div>
              <div style={{ fontSize:11, color:"var(--color-text-secondary,#64748b)" }}>{ds}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={T.main}>
        <div id="cg" style={{ scrollMarginTop:64 }}>
          <h2 style={T.H2}>Browse by Class</h2>
          <p style={T.sub}>Select your class to see all subjects and download practice sets A–E</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:12, marginBottom:40 }}>
            {[1,2,3,4,5,6,7,8].map((c, i) => {
              const count = WORKSHEETS.filter(w => w.class === c).length;
              return (
                <div key={c} onClick={() => { setCls(c); nav("class"); }}
                  style={{ ...T.card, textAlign:"center", padding:"20px 12px", cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = CLASS_COLORS[i]; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-tertiary,#e2e8f0)"; e.currentTarget.style.transform = "none"; }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:`${CLASS_COLORS[i]}18`,
                    border:`1.5px solid ${CLASS_COLORS[i]}40`, display:"flex", alignItems:"center", justifyContent:"center",
                    margin:"0 auto 10px", fontSize:18, fontWeight:700, color:CLASS_COLORS[i] }}>{c}</div>
                  <div style={{ fontWeight:600, fontSize:14, color:"var(--color-text-primary,#0f172a)", marginBottom:3 }}>Class {c}</div>
                  <div style={{ fontSize:11, color:"var(--color-text-secondary,#64748b)", marginBottom:6 }}>{SUBJECTS_BY_CLASS(c).length} subjects</div>
                  <span style={{ fontSize:10, background:"#eff6ff", color:"#1d4ed8", padding:"2px 7px", borderRadius:10, border:"0.5px solid #bfdbfe" }}>{count} sheets</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ background:"var(--color-background-secondary,#f1f5f9)", borderRadius:12, padding:"22px 24px", border:"0.5px solid var(--color-border-tertiary,#e2e8f0)", marginBottom:36 }}>
          <h2 style={{ ...T.H2, marginBottom:4 }}>📊 Platform Stats</h2>
          <p style={{ ...T.sub, marginBottom:16 }}>Everything available for free</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
            {[["Total PDFs",WORKSHEETS.length],["Classes","1 – 8"],["Subjects",5],["Sets per Subject","A – E"],["Questions per Sheet",25]].map(([l,v]) => (
              <div key={l} style={{ background:"var(--color-background-primary,#fff)", border:"0.5px solid var(--color-border-tertiary,#e2e8f0)", borderRadius:8, padding:"12px", textAlign:"center" }}>
                <div style={{ fontSize:22, fontWeight:700, color:"#1e40af", marginBottom:3 }}>{v}</div>
                <div style={{ fontSize:11, color:"var(--color-text-secondary,#64748b)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <h2 style={T.H2}>How It Works</h2>
        <p style={{ ...T.sub, marginBottom:18 }}>Two steps to your practice worksheet</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 }}>
          {[["🎓","01","Choose Your Class","Select from Class 1 to 8"],
            ["📚","02","Pick a Subject","Browse English, Maths, Science and more"],
            ["📥","03","Download PDF","Choose your difficulty set and download instantly"]].map(([ic,n,t,d]) => (
            <div key={n} style={{ ...T.card, display:"flex", gap:14, cursor:"default" }}>
              <div style={{ fontSize:26, flexShrink:0 }}>{ic}</div>
              <div>
                <div style={{ fontSize:10, color:"#2563eb", fontWeight:700, marginBottom:4, letterSpacing:"0.5px" }}>STEP {n}</div>
                <div style={{ fontSize:14, fontWeight:600, color:"var(--color-text-primary,#0f172a)", marginBottom:4 }}>{t}</div>
                <div style={{ fontSize:12, color:"var(--color-text-secondary,#64748b)", lineHeight:1.5 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop:"0.5px solid var(--color-border-tertiary,#e2e8f0)", padding:"18px 20px", textAlign:"center", fontSize:12, color:"var(--color-text-secondary,#64748b)", background:"var(--color-background-primary,#fff)" }}>
        © 2025 CBSE Practice Hub · Free educational resources · Classes 1–8
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );

  // ── CLASS VIEW — pick subject ──────────────────────────────────────────────
  if (view === "class") return (
    <div style={T.page}>
      <Hdr nav={nav} active="" />
      <div style={T.main}>
        <Bc crumbs={[{l:"Home",a:"home"},{l:`Class ${cls}`}]} onNav={nav} />
        <h2 style={T.H2}>Class {cls} — Choose a Subject</h2>
        <p style={T.sub}>Each subject has 15 worksheets: 5 unique sets at Easy, Medium and Hard</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
          {SUBJECTS_BY_CLASS(cls).map(s => {
            const m     = SUBJECT_META[s];
            const count = WORKSHEETS.filter(w => w.class === cls && w.subject === s).length;
            return (
              <div key={s} onClick={() => { setSubj(s); nav("subject"); }}
                style={{ ...T.card, border:`0.5px solid ${m.border}`, background:m.bg, cursor:"pointer", transition:"all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                <div style={{ fontSize:32, marginBottom:10 }}>{m.icon}</div>
                <div style={{ fontSize:17, fontWeight:700, color:m.color, marginBottom:5 }}>{s}</div>
                <div style={{ fontSize:12, color:`${m.color}99`, marginBottom:12 }}>{count} worksheets · 5 sets per difficulty</div>
                <div style={{ display:"flex", gap:5 }}>
                  {DIFFICULTIES.map(d => (
                    <span key={d} style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(255,255,255,0.65)", color:m.color, border:`0.5px solid ${m.border}` }}>{d}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );

  // ── SUBJECT VIEW — sets grouped by difficulty ──────────────────────────────
  if (view === "subject") {
    const m = SUBJECT_META[subj] || {};
    return (
      <div style={T.page}>
        <Hdr nav={nav} active="" />
        <div style={T.main}>
          <Bc crumbs={[{l:"Home",a:"home"},{l:`Class ${cls}`,a:"class"},{l:subj}]} onNav={nav} />

          <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:30 }}>{m.icon}</span>
            <div>
              <h2 style={{ ...T.H2, marginBottom:2 }}>{subj} — Class {cls}</h2>
              <p style={{ margin:0, fontSize:13, color:"var(--color-text-secondary,#64748b)" }}>
                {subjWS.length} worksheets · 5 sets per difficulty · {subjWS[0]?.question_count || 25} questions each · Answer key included
              </p>
            </div>
          </div>

          <div style={{ background:"#eff6ff", border:"0.5px solid #bfdbfe", borderRadius:8, padding:"11px 16px", marginBottom:24, fontSize:12, color:"#1d4ed8" }}>
            💡 <strong>Tip:</strong> Start with Easy Set A to build confidence, then move to Medium and Hard. Each set has a unique set of questions.
          </div>

          {DIFFICULTIES.map(diff => {
            const sheets = subjWS.filter(w => w.difficulty === diff).sort((a,b) => a.set.localeCompare(b.set));
            if (!sheets.length) return null;
            const ds = DIFF_STYLE[diff];
            return (
              <div key={diff} style={{ marginBottom:28 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ ...T.badge(ds), fontSize:13, padding:"4px 12px" }}>
                    {diff==="Easy"?"🟢":diff==="Medium"?"🟡":"🔴"} {diff} Level
                  </span>
                  <div style={{ flex:1, height:"0.5px", background:"var(--color-border-tertiary,#e2e8f0)" }} />
                  <span style={{ fontSize:11, color:"var(--color-text-secondary,#64748b)" }}>{sheets.length} sets</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:12 }}>
                  {sheets.map(ws => (
                    <div key={ws.set}
                      style={{ ...T.card, display:"flex", flexDirection:"column", gap:10, cursor:"default",
                        borderTop:`3px solid ${ds.border}`, transition:"box-shadow 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ width:36, height:36, borderRadius:8, background:ds.bg, border:`0.5px solid ${ds.border}`,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:ds.color }}>
                          {ws.set}
                        </div>
                        <span style={T.badge(ds)}>{diff}</span>
                      </div>
                      <div style={{ fontSize:14, fontWeight:600, color:"var(--color-text-primary,#0f172a)", lineHeight:1.3 }}>{ws.title}</div>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        <span style={T.chip}>❓ {ws.question_count}Q</span>
                        <span style={T.chip}>📄 {ws.pages}p</span>
                        {ws.has_answer_key && <span style={T.chip}>✅ Answers</span>}
                      </div>
                      <div style={{ display:"flex", gap:7 }}>
                        <button onClick={() => openPDF(ws, toast2)} style={{ ...T.bp, flex:1, textAlign:"center", padding:"9px 8px", fontSize:12 }}>
                          📥 Download PDF
                        </button>
                        <button onClick={() => ws.pdf_url ? window.open(ws.pdf_url,"_blank") : toast2("Not available")}
                          style={{ ...T.bs, padding:"9px 12px", fontSize:12 }}>
                          👁
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Other subjects */}
          <div style={{ marginTop:28, borderTop:"0.5px solid var(--color-border-tertiary,#e2e8f0)", paddingTop:20 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--color-text-primary,#0f172a)", marginBottom:10 }}>Other subjects in Class {cls}</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {SUBJECTS_BY_CLASS(cls).filter(s => s !== subj).map(s => (
                <button key={s} onClick={() => setSubj(s)}
                  style={{ padding:"7px 14px", borderRadius:6, border:"0.5px solid var(--color-border-secondary,#e2e8f0)", background:"var(--color-background-primary,#fff)", fontSize:13, cursor:"pointer", color:"var(--color-text-primary,#0f172a)" }}>
                  {SUBJECT_META[s]?.icon} {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ── SEARCH ────────────────────────────────────────────────────────────────
  if (view === "search") return (
    <div style={T.page}>
      <Hdr nav={nav} active="search" />
      <div style={T.main}>
        <h2 style={T.H2}>🔍 Search Worksheets</h2>
        <p style={T.sub}>Find worksheets by subject, class, difficulty or set letter</p>

        <div style={{ ...T.card, marginBottom:20, cursor:"default" }}>
          <div style={{ position:"relative", marginBottom:12 }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94a3b8" }}>🔍</span>
            <input style={{ ...T.inp, paddingLeft:36, fontSize:14 }}
              placeholder="Type subject, class or set…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <select style={T.sel} value={fCls}  onChange={e => setFCls(e.target.value)}>
              <option value="">All Classes</option>
              {[1,2,3,4,5,6,7,8].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select style={T.sel} value={fSub}  onChange={e => setFSub(e.target.value)}>
              <option value="">All Subjects</option>
              {Object.keys(SUBJECT_META).map(s => <option key={s}>{s}</option>)}
            </select>
            <select style={T.sel} value={fDiff} onChange={e => setFDiff(e.target.value)}>
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>
            <button onClick={() => { setQ(""); setFCls(""); setFSub(""); setFDiff(""); }} style={T.bs}>Clear</button>
          </div>
        </div>

        <div style={{ fontSize:13, color:"var(--color-text-secondary,#64748b)", marginBottom:14 }}>
          Showing <strong>{Math.min(searchWS.length,60)}</strong> of {searchWS.length} worksheets
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {searchWS.slice(0,60).map((ws,i) => {
            const ds = DIFF_STYLE[ws.difficulty];
            return (
              <div key={i} style={{ ...T.card, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", cursor:"default", transition:"border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-primary,#94a3b8)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary,#e2e8f0)"}>
                <div style={{ width:34, height:34, borderRadius:7, background:`${CLASS_COLORS[ws.class-1]}18`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:CLASS_COLORS[ws.class-1], flexShrink:0 }}>
                  {ws.class}
                </div>
                <div style={{ width:28, height:28, borderRadius:6, background:ds.bg, border:`0.5px solid ${ds.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:ds.color, flexShrink:0 }}>
                  {ws.set}
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary,#0f172a)", marginBottom:3 }}>{ws.title}</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
                    <span style={{ fontSize:11, color:"var(--color-text-secondary,#64748b)" }}>{ws.subject}</span>
                    <span style={{ color:"#cbd5e1" }}>·</span>
                    <span style={T.badge(ds)}>{ws.difficulty}</span>
                    <span style={{ fontSize:10, color:"var(--color-text-secondary,#64748b)" }}>{ws.question_count}Q</span>
                    {ws.has_answer_key && <span style={{ fontSize:10, color:"#15803d" }}>✅ Answers</span>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                  <button onClick={() => { setCls(ws.class); setSubj(ws.subject); nav("subject"); }}
                    style={{ ...T.bs, padding:"7px 12px", fontSize:12 }}>View All</button>
                  <button onClick={() => openPDF(ws, toast2)} style={{ ...T.bp, padding:"7px 14px", fontSize:12 }}>📥 Download</button>
                </div>
              </div>
            );
          })}
          {searchWS.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:28, marginBottom:10 }}>🔍</div>
              <div style={{ fontSize:14, color:"var(--color-text-secondary,#64748b)" }}>No worksheets found. Try different filters.</div>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );

  // ── EBOOKS ────────────────────────────────────────────────────────────────
  if (view === "ebooks") return (
    <div style={T.page}>
      <Hdr nav={nav} active="ebooks" />
      <div style={T.main}>
        <h2 style={T.H2}>📗 NCERT Ebooks & Textbooks</h2>
        <p style={T.sub}>Access official NCERT digital textbooks for all classes and subjects — free, directly from the NCERT portal</p>

        {/* Big CTA */}
        <div style={{ background:"linear-gradient(135deg,#1e3a8a,#2563eb)", borderRadius:14, padding:"32px 28px", marginBottom:28, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-10, right:-10, fontSize:100, opacity:0.06 }}>📗</div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.15)",
            border:"0.5px solid rgba(255,255,255,0.3)", borderRadius:20, padding:"4px 12px",
            fontSize:11, color:"rgba(255,255,255,0.9)", marginBottom:14 }}>
            🏛️ Official Government of India Resource
          </div>
          <h3 style={{ fontSize:22, fontWeight:700, color:"#fff", margin:"0 0 10px", letterSpacing:"-0.4px" }}>NCERT Textbook Portal</h3>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.75)", margin:"0 0 20px", maxWidth:480, lineHeight:1.6 }}>
            Download all NCERT textbooks in PDF format for Classes 1–12, available in English, Hindi and Urdu.
            Completely free and from the official source — updated every academic year.
          </p>
          <button onClick={() => window.open("https://ncert.nic.in/textbook.php","_blank","noopener,noreferrer")}
            style={{ background:"#fbbf24", color:"#1e3a8a", border:"none", padding:"12px 24px", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer" }}>
            📗 Open NCERT Textbooks ↗
          </button>
          <div style={{ marginTop:16, display:"flex", gap:16, flexWrap:"wrap" }}>
            {[["📚","Classes 1–12"],["🌐","English, Hindi & Urdu"],["📥","Free PDF Downloads"],["✅","Official NCERT Content"]].map(([ic,lb]) => (
              <div key={lb} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"rgba(255,255,255,0.8)" }}>
                <span>{ic}</span><span>{lb}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stages */}
        <h3 style={{ fontSize:16, fontWeight:600, color:"var(--color-text-primary,#0f172a)", marginBottom:14 }}>What's on the NCERT Portal</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14, marginBottom:32 }}>
          {NCERT_STAGES.map(s => (
            <div key={s.cls} style={{ ...T.card, cursor:"default" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:11, color:"#2563eb", fontWeight:700, letterSpacing:"0.3px", marginBottom:3 }}>CLASS {s.cls}</div>
                  <div style={{ fontSize:15, fontWeight:600, color:"var(--color-text-primary,#0f172a)" }}>{s.label}</div>
                </div>
                <span style={{ fontSize:10, background:"#eff6ff", color:"#1d4ed8", padding:"2px 7px", borderRadius:10, border:"0.5px solid #bfdbfe" }}>{s.subjects.length} subjects</span>
              </div>
              <p style={{ fontSize:12, color:"var(--color-text-secondary,#64748b)", margin:"0 0 12px", lineHeight:1.5 }}>{s.desc}</p>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {s.subjects.map(sub => (
                  <span key={sub} style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:"var(--color-background-secondary,#f1f5f9)", color:"var(--color-text-secondary,#64748b)", border:"0.5px solid var(--color-border-tertiary,#e2e8f0)" }}>{sub}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* How to use */}
        <div style={{ ...T.card, cursor:"default", marginBottom:24 }}>
          <h3 style={{ fontSize:15, fontWeight:600, color:"var(--color-text-primary,#0f172a)", marginBottom:14 }}>📋 How to Download NCERT Books</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[["1","Open the NCERT portal","Click 'Open NCERT Textbooks' above to go to ncert.nic.in/textbook.php"],
              ["2","Select your class","Use the Class dropdown on the NCERT portal to filter by grade"],
              ["3","Choose a subject","Pick from the Subject dropdown (English, Maths, Science, etc.)"],
              ["4","Download the PDF","Click on the chapter link or full-book PDF to download"]].map(([n,t,d]) => (
              <div key={n} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:24, height:24, borderRadius:6, background:"#1e40af", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>{n}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--color-text-primary,#0f172a)", marginBottom:2 }}>{t}</div>
                  <div style={{ fontSize:12, color:"var(--color-text-secondary,#64748b)", lineHeight:1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:16, paddingTop:14, borderTop:"0.5px solid var(--color-border-tertiary,#e2e8f0)" }}>
            <button onClick={() => window.open("https://ncert.nic.in/textbook.php","_blank","noopener,noreferrer")}
              style={{ ...T.bp, display:"inline-flex", alignItems:"center", gap:8 }}>
              📗 Go to NCERT Textbook Portal ↗
            </button>
          </div>
        </div>

        <div style={{ background:"#fef9c3", border:"0.5px solid #fde047", borderRadius:8, padding:"12px 16px", fontSize:12, color:"#713f12", lineHeight:1.6 }}>
          <strong>Note:</strong> NCERT textbooks are also available on the DIKSHA app — the Government of India's official digital learning platform.
          CBSE Practice Hub worksheets are complementary practice material based on the NCERT curriculum.
        </div>
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );

  return null;
}
