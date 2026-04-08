import { useState, useMemo, useEffect } from "react";

const SUBJECTS_BY_CLASS = (cls) =>
  cls <= 5
    ? ["English", "Mathematics", "EVS"]
    : ["English", "Mathematics", "Science", "Social Science"];

const SUBJECT_META = {
  English: { icon: "📖", color: "#b45309", bg: "#fef3c7", border: "#fbbf24" },
  Mathematics: { icon: "🔢", color: "#1d4ed8", bg: "#dbeafe", border: "#60a5fa" },
  EVS: { icon: "🌿", color: "#047857", bg: "#d1fae5", border: "#34d399" },
  Science: { icon: "🔬", color: "#6d28d9", bg: "#ede9fe", border: "#a78bfa" },
  "Social Science": { icon: "🌍", color: "#be185d", bg: "#fce7f3", border: "#f472b6" },
};

const CHAPTERS = {
  English: {
    1: ["My Family", "Animals Around Us", "The Seasons", "Action Words"],
    2: ["A Busy Market", "Plants We Eat", "Time & Clock", "Story Words"],
    3: ["Community Helpers", "Weather Watch", "Nouns & Pronouns", "Describing Words"],
    4: ["Tenses", "Paragraph Writing", "Reading Comprehension", "Vocabulary Building"],
    5: ["Verb Forms", "Letter Writing", "Comprehension Passages", "Grammar Practice"],
    6: ["Prose & Poetry", "Active & Passive Voice", "Email Writing", "Comprehension"],
    7: ["Literature Chapters", "Reported Speech", "Essay Writing", "Editing & Omission"],
    8: ["The Best Christmas Present", "Advanced Reported Speech", "Article Writing", "Formal Letters"],
  },
  Mathematics: {
    1: ["Numbers 1–100", "Addition", "Subtraction", "Shapes & Patterns"],
    2: ["Numbers 1–1000", "Multiplication", "Division Basics", "Measurement"],
    3: ["4-Digit Numbers", "Multiplication Tables", "Fractions Intro", "Time & Calendar"],
    4: ["Large Numbers", "Factors & Multiples", "Fractions", "Geometry Basics"],
    5: ["Roman Numerals", "HCF & LCM", "Decimals", "Area & Perimeter"],
    6: ["Integers", "Fractions & Decimals", "Ratio & Proportion", "Basic Algebra"],
    7: ["Rational Numbers", "Linear Equations", "Congruence of Triangles", "Comparing Quantities"],
    8: ["Rational Numbers Advanced", "Squares & Cubes", "Algebraic Expressions", "Mensuration"],
  },
  EVS: {
    1: ["My Body", "Food We Eat", "Plants Around Us", "Animals & Pets"],
    2: ["Our Family", "Water & Air", "Transport", "Safety Rules"],
    3: ["Food & Nutrition", "Shelter", "Occupation", "Earth & Sky"],
    4: ["States of India", "Water Conservation", "Plants & Animals", "Human Body Systems"],
    5: ["Food Chain", "Natural Disasters", "Maps & Directions", "Our Environment"],
  },
  Science: {
    6: ["Food & Nutrition", "Fibre to Fabric", "Sorting Materials", "Changes Around Us", "The Living World"],
    7: ["Nutrition in Plants", "Nutrition in Animals", "Heat & Temperature", "Acids Bases Salts", "Physical & Chemical Changes"],
    8: ["Crop Production", "Microorganisms", "Combustion & Flame", "Cell Structure", "Reproduction in Animals"],
  },
  "Social Science": {
    6: ["What Where How & When", "Earliest People", "Motions of Earth", "Maps & Globes"],
    7: ["Changes Through 1000 Years", "Inside Our Earth", "Our Changing Earth", "Democracy"],
    8: ["Resources", "Land Soil Water", "Mineral & Power Resources", "The Indian Constitution"],
  },
};

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DIFF_STYLE = {
  Easy:   { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
  Medium: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
  Hard:   { bg: "#fee2e2", color: "#7f1d1d", border: "#fca5a5" },
};

const CLASS_COLORS = ["#1d4ed8","#0891b2","#047857","#d97706","#dc2626","#7c3aed","#be185d","#0369a1"];

let _id = 1;
const INITIAL_SHEETS = (() => {
  const sheets = [];
  for (let cls = 1; cls <= 8; cls++) {
    const subjects = SUBJECTS_BY_CLASS(cls);
    for (const sub of subjects) {
      const chaps = CHAPTERS[sub]?.[cls] || [];
      for (const ch of chaps) {
        for (const diff of DIFFICULTIES) {
          sheets.push({
            id: _id++, class: cls, subject: sub, chapter: ch, difficulty: diff,
            title: `${ch} – ${diff} Practice`,
            description: `Strengthen your understanding of ${ch} with ${diff.toLowerCase()}-level questions including MCQs, fill in the blanks, and short answers. Answer key included.`,
            questions: diff === "Easy" ? 10 : diff === "Medium" ? 15 : 20,
            pages: diff === "Easy" ? 2 : diff === "Medium" ? 3 : 4,
            uploadedOn: "2025-12-15",
          });
        }
      }
    }
  }
  return sheets;
})();

const Toast = ({ msg, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:"#1e293b", color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:14, display:"flex", alignItems:"center", gap:10, boxShadow:"0 4px 20px rgba(0,0,0,0.2)", maxWidth:320 }}>
      <span style={{ fontSize:16 }}>✅</span>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", marginLeft:8, fontSize:16 }}>×</button>
    </div>
  );
};

const Breadcrumb = ({ crumbs, onNav }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:4, alignItems:"center", marginBottom:20, fontSize:13, color:"var(--color-text-secondary)" }}>
    {crumbs.map((c, i) => (
      <span key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
        {i < crumbs.length - 1 ? (
          <button onClick={() => onNav(c.action)} style={{ background:"none", border:"none", color:"#2563eb", cursor:"pointer", fontSize:13, padding:0, fontFamily:"inherit" }}>{c.label}</button>
        ) : (
          <span style={{ color:"var(--color-text-primary)", fontWeight:500 }}>{c.label}</span>
        )}
        {i < crumbs.length - 1 && <span style={{ color:"var(--color-text-tertiary)" }}>›</span>}
      </span>
    ))}
  </div>
);

export default function CBSEPracticeHub() {
  const [view, setView] = useState("home");
  const [selClass, setSelClass] = useState(null);
  const [selSubject, setSelSubject] = useState(null);
  const [selChapter, setSelChapter] = useState(null);
  const [worksheets, setWorksheets] = useState(INITIAL_SHEETS);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [fClass, setFClass] = useState("");
  const [fSubject, setFSubject] = useState("");
  const [fDiff, setFDiff] = useState("");
  const [adminTab, setAdminTab] = useState("list");
  const [adminSearch, setAdminSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ class: "", subject: "", chapter: "", difficulty: "Easy", title: "", description: "", questions: 10 });
  const [formErrors, setFormErrors] = useState({});

  const showToast = (msg) => setToast(msg);

  const handleDownload = (ws) => {
    showToast(`Downloading "${ws.title}" (${ws.questions} questions, ${ws.pages} pages)`);
  };

  const filteredSearchSheets = useMemo(() => {
    return worksheets.filter(ws => {
      const q = search.toLowerCase();
      const matchSearch = !q || ws.title.toLowerCase().includes(q) || ws.chapter.toLowerCase().includes(q) || ws.subject.toLowerCase().includes(q);
      const matchClass = !fClass || ws.class === parseInt(fClass);
      const matchSubject = !fSubject || ws.subject === fSubject;
      const matchDiff = !fDiff || ws.difficulty === fDiff;
      return matchSearch && matchClass && matchSubject && matchDiff;
    });
  }, [worksheets, search, fClass, fSubject, fDiff]);

  const availableChapters = useMemo(() => {
    if (selClass && selSubject) return CHAPTERS[selSubject]?.[selClass] || [];
    return [];
  }, [selClass, selSubject]);

  const chapterWorksheets = useMemo(() => {
    if (!selChapter) return [];
    return worksheets.filter(ws => ws.class === selClass && ws.subject === selSubject && ws.chapter === selChapter);
  }, [worksheets, selClass, selSubject, selChapter]);

  const nav = (action) => {
    if (action === "home") { setView("home"); setSelClass(null); setSelSubject(null); setSelChapter(null); }
    else if (action === "class") { setView("class"); setSelSubject(null); setSelChapter(null); }
    else if (action === "subject") { setView("subject"); setSelChapter(null); }
    else if (action === "chapter") setView("chapter");
    else if (action === "search") setView("search");
    else if (action === "admin") setView("admin");
  };

  const validateForm = () => {
    const e = {};
    if (!form.class) e.class = "Required";
    if (!form.subject) e.subject = "Required";
    if (!form.chapter.trim()) e.chapter = "Required";
    if (!form.title.trim()) e.title = "Required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdminSubmit = () => {
    if (!validateForm()) return;
    if (editId) {
      setWorksheets(ws => ws.map(w => w.id === editId ? { ...w, ...form, class: parseInt(form.class) } : w));
      showToast("Worksheet updated successfully");
      setEditId(null);
    } else {
      const newWs = { ...form, id: Date.now(), class: parseInt(form.class), questions: parseInt(form.questions), pages: 2, uploadedOn: new Date().toISOString().split("T")[0] };
      setWorksheets(ws => [newWs, ...ws]);
      showToast("Worksheet uploaded successfully");
    }
    setForm({ class: "", subject: "", chapter: "", difficulty: "Easy", title: "", description: "", questions: 10 });
    setAdminTab("list");
  };

  const handleEdit = (ws) => {
    setForm({ class: String(ws.class), subject: ws.subject, chapter: ws.chapter, difficulty: ws.difficulty, title: ws.title, description: ws.description, questions: ws.questions });
    setEditId(ws.id);
    setAdminTab("upload");
  };

  const handleDelete = (id) => {
    setWorksheets(ws => ws.filter(w => w.id !== id));
    showToast("Worksheet deleted");
  };

  const adminSheets = useMemo(() => {
    const q = adminSearch.toLowerCase();
    return worksheets.filter(ws => !q || ws.title.toLowerCase().includes(q) || ws.chapter.toLowerCase().includes(q) || ws.subject.toLowerCase().includes(q) || String(ws.class).includes(q));
  }, [worksheets, adminSearch]);

  const S = {
    page: { minHeight:"100vh", background:"var(--color-background-tertiary)", fontFamily:"var(--font-sans)" },
    header: { background:"var(--color-background-primary)", borderBottom:"0.5px solid var(--color-border-tertiary)", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, position:"sticky", top:0, zIndex:100 },
    logo: { display:"flex", alignItems:"center", gap:10, cursor:"pointer" },
    logoIcon: { width:32, height:32, borderRadius:8, background:"#1e40af", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 },
    logoText: { fontWeight:600, fontSize:16, color:"var(--color-text-primary)", letterSpacing:"-0.3px" },
    nav: { display:"flex", gap:6 },
    navBtn: { padding:"6px 14px", borderRadius:6, border:"0.5px solid var(--color-border-secondary)", background:"none", fontSize:13, cursor:"pointer", fontFamily:"var(--font-sans)", color:"var(--color-text-secondary)" },
    navBtnActive: { background:"#1e40af", color:"#fff", border:"0.5px solid #1e40af" },
    main: { maxWidth:1200, margin:"0 auto", padding:"32px 24px" },
    sectionTitle: { fontSize:22, fontWeight:500, color:"var(--color-text-primary)", marginBottom:8, letterSpacing:"-0.5px" },
    sectionSub: { fontSize:15, color:"var(--color-text-secondary)", marginBottom:28 },
    card: { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"20px 22px", cursor:"pointer", transition:"border-color 0.15s" },
    cardHover: { borderColor:"var(--color-border-primary)" },
    grid4: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 },
    grid3: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 },
    grid2: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 },
    badge: (style) => ({ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:500, border:`0.5px solid ${style.border}`, background:style.bg, color:style.color }),
    input: { width:"100%", padding:"9px 12px", borderRadius:8, border:"0.5px solid var(--color-border-secondary)", fontSize:14, background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", boxSizing:"border-box" },
    select: { padding:"9px 12px", borderRadius:8, border:"0.5px solid var(--color-border-secondary)", fontSize:14, background:"var(--color-background-primary)", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)", cursor:"pointer" },
    btnPrimary: { background:"#1e40af", color:"#fff", border:"none", padding:"10px 20px", borderRadius:8, fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"var(--font-sans)" },
    btnSecondary: { background:"none", color:"var(--color-text-secondary)", border:"0.5px solid var(--color-border-secondary)", padding:"10px 20px", borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"var(--font-sans)" },
    btnSm: (color) => ({ background:color||"#1e40af", color:"#fff", border:"none", padding:"7px 14px", borderRadius:6, fontSize:12, cursor:"pointer", fontFamily:"var(--font-sans)", fontWeight:500 }),
    label: { fontSize:13, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:5, display:"block" },
    formRow: { marginBottom:16 },
    errorText: { fontSize:12, color:"#dc2626", marginTop:4 },
    chip: { display:"inline-flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:20, fontSize:12, background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-tertiary)", color:"var(--color-text-secondary)" },
  };

  if (view === "home") return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.logo} onClick={() => nav("home")}>
          <div style={S.logoIcon}>📚</div>
          <span style={S.logoText}>CBSE Practice Hub</span>
        </div>
        <div style={S.nav}>
          <button style={S.navBtn} onClick={() => nav("search")}>🔍 Search</button>
          <button style={{ ...S.navBtn, ...S.navBtnActive }} onClick={() => nav("admin")}>⚙ Admin</button>
        </div>
      </header>

      <div style={{ background:"linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#1d4ed8 100%)", padding:"72px 24px", textAlign:"center" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.15)", border:"0.5px solid rgba(255,255,255,0.3)", borderRadius:20, padding:"5px 14px", fontSize:13, color:"rgba(255,255,255,0.9)", marginBottom:20 }}>
          ✨ Updated as per CBSE 2025–26 Syllabus
        </div>
        <h1 style={{ fontSize:42, fontWeight:600, color:"#fff", margin:"0 0 16px", letterSpacing:"-1px", lineHeight:1.1 }}>
          Practice Smarter with<br/>
          <span style={{ color:"#fbbf24" }}>CBSE Worksheets</span>
        </h1>
        <p style={{ fontSize:18, color:"rgba(255,255,255,0.75)", margin:"0 0 32px", maxWidth:540, marginLeft:"auto", marginRight:"auto" }}>
          Free printable worksheets for Class 1–8. All subjects. All chapters. Three difficulty levels with answer keys.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => { document.getElementById("classes-grid")?.scrollIntoView({ behavior:"smooth" }); }} style={{ background:"#fbbf24", color:"#1e3a8a", border:"none", padding:"13px 28px", borderRadius:8, fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-sans)" }}>Browse by Class ↓</button>
          <button onClick={() => nav("search")} style={{ background:"rgba(255,255,255,0.15)", color:"#fff", border:"0.5px solid rgba(255,255,255,0.4)", padding:"13px 28px", borderRadius:8, fontSize:15, cursor:"pointer", fontFamily:"var(--font-sans)" }}>Search Worksheets</button>
        </div>
      </div>

      <div style={{ background:"var(--color-background-primary)", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:0 }}>
          {[
            { icon:"📥", label:"Free Downloads", desc:"All worksheets are 100% free" },
            { icon:"📚", label:"All Subjects", desc:"English, Math, Science & more" },
            { icon:"🎯", label:"3 Difficulty Levels", desc:"Easy, Medium & Hard" },
            { icon:"✅", label:"Answer Keys", desc:"Every worksheet includes answers" },
            { icon:"🖨️", label:"Print-Ready PDFs", desc:"Formatted for A4 printing" },
          ].map((f, i) => (
            <div key={i} style={{ padding:"16px 20px", textAlign:"center", borderRight: i < 4 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{f.icon}</div>
              <div style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)", marginBottom:3 }}>{f.label}</div>
              <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...S.main }}>
        <div id="classes-grid">
          <h2 style={S.sectionTitle}>Browse by Class</h2>
          <p style={S.sectionSub}>Choose your class to find worksheets for all subjects and chapters</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:14, marginBottom:48 }}>
            {[1,2,3,4,5,6,7,8].map((cls, i) => {
              const subjects = SUBJECTS_BY_CLASS(cls);
              const count = worksheets.filter(w => w.class === cls).length;
              return (
                <div key={cls} onClick={() => { setSelClass(cls); setView("class"); }} style={{ ...S.card, textAlign:"center", padding:"24px 16px" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="#93c5fd"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="var(--color-border-tertiary)"}>
                  <div style={{ width:48, height:48, borderRadius:12, background:`${CLASS_COLORS[i]}18`, border:`1.5px solid ${CLASS_COLORS[i]}40`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:20, fontWeight:700, color:CLASS_COLORS[i] }}>{cls}</div>
                  <div style={{ fontWeight:600, fontSize:15, color:"var(--color-text-primary)", marginBottom:4 }}>Class {cls}</div>
                  <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:8 }}>{subjects.length} subjects</div>
                  <div style={{ fontSize:11, background:"#eff6ff", color:"#1d4ed8", padding:"3px 8px", borderRadius:20, display:"inline-block", border:"0.5px solid #bfdbfe" }}>{count} sheets</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background:"var(--color-background-secondary)", borderRadius:14, padding:"28px 28px 24px", border:"0.5px solid var(--color-border-tertiary)", marginBottom:48 }}>
          <h2 style={{ ...S.sectionTitle, marginBottom:4 }}>📊 Quick Stats</h2>
          <p style={{ ...S.sectionSub, marginBottom:20 }}>What's available on the platform right now</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
            {[
              { label:"Total Worksheets", value:worksheets.length },
              { label:"Classes Covered", value:"1–8" },
              { label:"Subjects", value:5 },
              { label:"Chapters", value:"150+" },
              { label:"Questions", value:"3000+" },
            ].map(s => (
              <div key={s.label} style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:8, padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:24, fontWeight:600, color:"#1e40af", marginBottom:4 }}>{s.value}</div>
                <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <h2 style={S.sectionTitle}>How It Works</h2>
        <p style={{ ...S.sectionSub, marginBottom:24 }}>Three simple steps to get your practice worksheet</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16 }}>
          {[
            { step:"01", title:"Choose Your Class", desc:"Select your class from 1 to 8 to see all available subjects", icon:"🎓" },
            { step:"02", title:"Pick a Chapter", desc:"Navigate to your subject and find the chapter you're studying", icon:"📋" },
            { step:"03", title:"Download & Practice", desc:"Download your preferred difficulty level and start practicing", icon:"📥" },
          ].map(s => (
            <div key={s.step} style={{ ...S.card, display:"flex", gap:16 }}>
              <div style={{ fontSize:28, flexShrink:0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:11, color:"#2563eb", fontWeight:600, marginBottom:4, letterSpacing:"0.5px" }}>STEP {s.step}</div>
                <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)", marginBottom:6 }}>{s.title}</div>
                <div style={{ fontSize:13, color:"var(--color-text-secondary)", lineHeight:1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ borderTop:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-primary)", padding:"24px", textAlign:"center", fontSize:13, color:"var(--color-text-secondary)" }}>
        © 2025 CBSE Practice Hub · Free educational resources for CBSE students · Classes 1–8
      </footer>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );

  if (view === "class") return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.logo} onClick={() => nav("home")}>
          <div style={S.logoIcon}>📚</div>
          <span style={S.logoText}>CBSE Practice Hub</span>
        </div>
        <div style={S.nav}>
          <button style={S.navBtn} onClick={() => nav("search")}>🔍 Search</button>
          <button style={{ ...S.navBtn, ...S.navBtnActive }} onClick={() => nav("admin")}>⚙ Admin</button>
        </div>
      </header>
      <div style={S.main}>
        <Breadcrumb crumbs={[{ label:"Home", action:"home" }, { label:`Class ${selClass}` }]} onNav={nav} />
        <h2 style={S.sectionTitle}>Class {selClass} — Subjects</h2>
        <p style={S.sectionSub}>Choose a subject to browse chapters and worksheets</p>
        <div style={S.grid3}>
          {SUBJECTS_BY_CLASS(selClass).map(sub => {
            const m = SUBJECT_META[sub];
            const count = worksheets.filter(w => w.class === selClass && w.subject === sub).length;
            const chapCount = (CHAPTERS[sub]?.[selClass] || []).length;
            return (
              <div key={sub} onClick={() => { setSelSubject(sub); setView("subject"); }} style={{ ...S.card, border:`0.5px solid ${m.border}`, background:m.bg }}
                onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform="none"}>
                <div style={{ fontSize:36, marginBottom:12 }}>{m.icon}</div>
                <div style={{ fontSize:18, fontWeight:600, color:m.color, marginBottom:6 }}>{sub}</div>
                <div style={{ fontSize:13, color:`${m.color}bb`, marginBottom:14 }}>{chapCount} chapters · {count} worksheets</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {DIFFICULTIES.map(d => (
                    <span key={d} style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"rgba(255,255,255,0.6)", color:m.color, border:`0.5px solid ${m.border}` }}>{d}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:32, padding:"20px", background:"var(--color-background-secondary)", borderRadius:10, border:"0.5px solid var(--color-border-tertiary)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)", marginBottom:4 }}>Looking for something specific?</div>
            <div style={{ fontSize:13, color:"var(--color-text-secondary)" }}>Search across all chapters and subjects in Class {selClass}</div>
          </div>
          <button onClick={() => { setFClass(String(selClass)); nav("search"); }} style={S.btnPrimary}>Search Class {selClass} →</button>
        </div>
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );

  if (view === "subject") return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.logo} onClick={() => nav("home")}>
          <div style={S.logoIcon}>📚</div>
          <span style={S.logoText}>CBSE Practice Hub</span>
        </div>
        <div style={S.nav}>
          <button style={S.navBtn} onClick={() => nav("search")}>🔍 Search</button>
          <button style={{ ...S.navBtn, ...S.navBtnActive }} onClick={() => nav("admin")}>⚙ Admin</button>
        </div>
      </header>
      <div style={S.main}>
        <Breadcrumb crumbs={[{ label:"Home", action:"home" }, { label:`Class ${selClass}`, action:"class" }, { label:selSubject }]} onNav={nav} />
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:8 }}>
          <span style={{ fontSize:32 }}>{SUBJECT_META[selSubject]?.icon}</span>
          <div>
            <h2 style={{ ...S.sectionTitle, marginBottom:2 }}>{selSubject}</h2>
            <p style={{ margin:0, fontSize:14, color:"var(--color-text-secondary)" }}>Class {selClass} · {availableChapters.length} chapters · {worksheets.filter(w => w.class===selClass && w.subject===selSubject).length} worksheets</p>
          </div>
        </div>
        <div style={{ marginBottom:28, marginTop:20 }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ position:"relative", flex:1, minWidth:200 }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"var(--color-text-tertiary)" }}>🔍</span>
              <input style={{ ...S.input, paddingLeft:36 }} placeholder="Search chapters..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select style={S.select} value={fDiff} onChange={e => setFDiff(e.target.value)}>
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {availableChapters.filter(ch => !search || ch.toLowerCase().includes(search.toLowerCase())).map((ch, i) => {
            const chSheets = worksheets.filter(w => w.class===selClass && w.subject===selSubject && w.chapter===ch && (!fDiff || w.difficulty===fDiff));
            return (
              <div key={i} style={{ ...S.card, display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}
                onMouseEnter={e => e.currentTarget.style.borderColor="var(--color-border-primary)"}
                onMouseLeave={e => e.currentTarget.style.borderColor="var(--color-border-tertiary)"}>
                <div style={{ display:"flex", gap:14, alignItems:"center", flex:1 }}>
                  <div style={{ width:40, height:40, borderRadius:8, background:"var(--color-background-secondary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:600, color:"var(--color-text-secondary)", flexShrink:0 }}>{i+1}</div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:500, color:"var(--color-text-primary)", marginBottom:4 }}>{ch}</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {DIFFICULTIES.map(d => {
                        const exists = worksheets.find(w => w.class===selClass && w.subject===selSubject && w.chapter===ch && w.difficulty===d);
                        return exists ? <span key={d} style={{ ...S.badge(DIFF_STYLE[d]) }}>{d}</span> : null;
                      })}
                      <span style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>· {chSheets.length} sheets</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => { setSelChapter(ch); setView("chapter"); }} style={S.btnPrimary}>View Worksheets →</button>
              </div>
            );
          })}
        </div>
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );

  if (view === "chapter") return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.logo} onClick={() => nav("home")}>
          <div style={S.logoIcon}>📚</div>
          <span style={S.logoText}>CBSE Practice Hub</span>
        </div>
        <div style={S.nav}>
          <button style={S.navBtn} onClick={() => nav("search")}>🔍 Search</button>
          <button style={{ ...S.navBtn, ...S.navBtnActive }} onClick={() => nav("admin")}>⚙ Admin</button>
        </div>
      </header>
      <div style={S.main}>
        <Breadcrumb crumbs={[{ label:"Home", action:"home" }, { label:`Class ${selClass}`, action:"class" }, { label:selSubject, action:"subject" }, { label:selChapter }]} onNav={nav} />
        <h2 style={S.sectionTitle}>{selChapter}</h2>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:24, flexWrap:"wrap" }}>
          <span style={S.chip}>📚 Class {selClass}</span>
          <span style={S.chip}>{SUBJECT_META[selSubject]?.icon} {selSubject}</span>
          <span style={S.chip}>📄 {chapterWorksheets.length} worksheets</span>
        </div>
        <div style={{ background:"#eff6ff", border:"0.5px solid #bfdbfe", borderRadius:10, padding:"14px 18px", marginBottom:28, fontSize:13, color:"#1d4ed8" }}>
          💡 <strong>Tip:</strong> Start with Easy level to build confidence, then progress to Medium and Hard for exam preparation.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {DIFFICULTIES.map(diff => {
            const sheets = chapterWorksheets.filter(w => w.difficulty === diff);
            if (!sheets.length) return null;
            const ds = DIFF_STYLE[diff];
            return (
              <div key={diff}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ ...S.badge(ds), fontSize:13 }}>{diff === "Easy" ? "🟢" : diff === "Medium" ? "🟡" : "🔴"} {diff} Level</span>
                  <div style={{ flex:1, height:"0.5px", background:"var(--color-border-tertiary)" }} />
                </div>
                <div style={S.grid2}>
                  {sheets.map(ws => (
                    <div key={ws.id} style={{ ...S.card, display:"flex", flexDirection:"column", gap:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                        <div style={{ fontSize:15, fontWeight:500, color:"var(--color-text-primary)", lineHeight:1.4 }}>{ws.title}</div>
                        <span style={{ ...S.badge(ds), flexShrink:0 }}>{diff}</span>
                      </div>
                      <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:0, lineHeight:1.6 }}>{ws.description}</p>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <span style={S.chip}>❓ {ws.questions} questions</span>
                        <span style={S.chip}>📄 {ws.pages} pages</span>
                        <span style={S.chip}>✅ Answer key</span>
                      </div>
                      <div style={{ display:"flex", gap:8, marginTop:4 }}>
                        <button onClick={() => handleDownload(ws)} style={{ ...S.btnPrimary, flex:1, textAlign:"center" }}>📥 Download PDF</button>
                        <button onClick={() => showToast("Opening preview...")} style={{ ...S.btnSecondary, padding:"10px 14px" }}>👁 Preview</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:36, borderTop:"0.5px solid var(--color-border-tertiary)", paddingTop:24 }}>
          <h3 style={{ fontSize:15, fontWeight:500, color:"var(--color-text-primary)", marginBottom:14 }}>Other chapters in {selSubject} — Class {selClass}</h3>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {(CHAPTERS[selSubject]?.[selClass] || []).filter(ch => ch !== selChapter).map(ch => (
              <button key={ch} onClick={() => setSelChapter(ch)} style={{ padding:"7px 14px", borderRadius:6, border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-primary)", fontSize:13, cursor:"pointer", fontFamily:"var(--font-sans)", color:"var(--color-text-primary)" }}>{ch}</button>
            ))}
          </div>
        </div>
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );

  if (view === "search") return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.logo} onClick={() => nav("home")}>
          <div style={S.logoIcon}>📚</div>
          <span style={S.logoText}>CBSE Practice Hub</span>
        </div>
        <div style={S.nav}>
          <button style={S.navBtn} onClick={() => nav("home")}>← Home</button>
          <button style={{ ...S.navBtn, ...S.navBtnActive }} onClick={() => nav("admin")}>⚙ Admin</button>
        </div>
      </header>
      <div style={S.main}>
        <h2 style={S.sectionTitle}>Search Worksheets</h2>
        <p style={S.sectionSub}>Find worksheets by topic, subject, class, or difficulty</p>
        <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"20px", marginBottom:24 }}>
          <div style={{ position:"relative", marginBottom:14 }}>
            <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"var(--color-text-tertiary)" }}>🔍</span>
            <input style={{ ...S.input, paddingLeft:42, fontSize:15, padding:"11px 14px 11px 42px" }} placeholder="Search chapters, topics, or subjects..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <select style={S.select} value={fClass} onChange={e => setFClass(e.target.value)}>
              <option value="">All Classes</option>
              {[1,2,3,4,5,6,7,8].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
            <select style={S.select} value={fSubject} onChange={e => setFSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {Object.keys(SUBJECT_META).map(s => <option key={s}>{s}</option>)}
            </select>
            <select style={S.select} value={fDiff} onChange={e => setFDiff(e.target.value)}>
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>
            <button onClick={() => { setSearch(""); setFClass(""); setFSubject(""); setFDiff(""); }} style={S.btnSecondary}>Clear</button>
          </div>
        </div>
        <div style={{ marginBottom:16, fontSize:14, color:"var(--color-text-secondary)" }}>
          Showing <strong>{filteredSearchSheets.length}</strong> of {worksheets.length} worksheets
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filteredSearchSheets.slice(0, 40).map(ws => (
            <div key={ws.id} style={{ ...S.card, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}
              onMouseEnter={e => e.currentTarget.style.borderColor="var(--color-border-primary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor="var(--color-border-tertiary)"}>
              <div style={{ width:36, height:36, borderRadius:8, background:`${CLASS_COLORS[ws.class-1]}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:CLASS_COLORS[ws.class-1], flexShrink:0 }}>{ws.class}</div>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)", marginBottom:4 }}>{ws.title}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{ws.subject}</span>
                  <span style={{ color:"var(--color-text-tertiary)" }}>·</span>
                  <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{ws.chapter}</span>
                  <span style={{ color:"var(--color-text-tertiary)" }}>·</span>
                  <span style={{ ...S.badge(DIFF_STYLE[ws.difficulty]), fontSize:11 }}>{ws.difficulty}</span>
                  <span style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{ws.questions}Q</span>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                <button onClick={() => { setSelClass(ws.class); setSelSubject(ws.subject); setSelChapter(ws.chapter); setView("chapter"); }} style={S.btnSecondary}>View</button>
                <button onClick={() => handleDownload(ws)} style={S.btnPrimary}>📥 Download</button>
              </div>
            </div>
          ))}
          {filteredSearchSheets.length > 40 && <div style={{ textAlign:"center", padding:"20px", color:"var(--color-text-secondary)", fontSize:13 }}>Showing first 40 results. Refine your search to narrow down.</div>}
          {filteredSearchSheets.length === 0 && (
            <div style={{ textAlign:"center", padding:"48px 24px", color:"var(--color-text-secondary)" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
              <div style={{ fontSize:15, marginBottom:8 }}>No worksheets found</div>
              <div style={{ fontSize:13 }}>Try different keywords or clear some filters</div>
            </div>
          )}
        </div>
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );

  if (view === "admin") {
    const formSubjects = form.class ? SUBJECTS_BY_CLASS(parseInt(form.class)) : [];
    const formChapters = form.class && form.subject ? (CHAPTERS[form.subject]?.[parseInt(form.class)] || []) : [];
    return (
      <div style={S.page}>
        <header style={S.header}>
          <div style={S.logo} onClick={() => nav("home")}>
            <div style={S.logoIcon}>📚</div>
            <span style={S.logoText}>CBSE Practice Hub</span>
          </div>
          <div style={S.nav}>
            <button style={S.navBtn} onClick={() => nav("home")}>← Back to Site</button>
          </div>
        </header>
        <div style={{ ...S.main, maxWidth:1100 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
            <div>
              <h2 style={{ ...S.sectionTitle, marginBottom:4 }}>⚙ Admin Panel</h2>
              <p style={{ margin:0, fontSize:14, color:"var(--color-text-secondary)" }}>Manage all worksheets · {worksheets.length} total</p>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setAdminTab("list"); setEditId(null); }} style={{ ...S.navBtn, ...(adminTab==="list" ? S.navBtnActive : {}) }}>📋 All Worksheets</button>
              <button onClick={() => { setAdminTab("upload"); setEditId(null); setForm({ class:"", subject:"", chapter:"", difficulty:"Easy", title:"", description:"", questions:10 }); setFormErrors({}); }} style={{ ...S.navBtn, ...(adminTab==="upload" ? { background:"#15803d", color:"#fff", border:"0.5px solid #15803d" } : {}) }}>+ Upload New</button>
            </div>
          </div>

          {adminTab === "upload" && (
            <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"28px" }}>
              <h3 style={{ fontSize:16, fontWeight:500, color:"var(--color-text-primary)", marginBottom:20 }}>{editId ? "✏️ Edit Worksheet" : "📤 Upload New Worksheet"}</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:16 }}>
                <div style={S.formRow}>
                  <label style={S.label}>Class *</label>
                  <select style={{ ...S.select, width:"100%" }} value={form.class} onChange={e => setForm(f => ({ ...f, class:e.target.value, subject:"", chapter:"" }))}>
                    <option value="">Select class</option>
                    {[1,2,3,4,5,6,7,8].map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                  {formErrors.class && <div style={S.errorText}>{formErrors.class}</div>}
                </div>
                <div style={S.formRow}>
                  <label style={S.label}>Subject *</label>
                  <select style={{ ...S.select, width:"100%" }} value={form.subject} onChange={e => setForm(f => ({ ...f, subject:e.target.value, chapter:"" }))} disabled={!form.class}>
                    <option value="">Select subject</option>
                    {formSubjects.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {formErrors.subject && <div style={S.errorText}>{formErrors.subject}</div>}
                </div>
                <div style={S.formRow}>
                  <label style={S.label}>Chapter *</label>
                  <select style={{ ...S.select, width:"100%" }} value={form.chapter} onChange={e => setForm(f => ({ ...f, chapter:e.target.value }))} disabled={!form.subject}>
                    <option value="">Select or type chapter</option>
                    {formChapters.map(c => <option key={c}>{c}</option>)}
                    <option value="__custom__">+ Custom chapter</option>
                  </select>
                  {form.chapter === "__custom__" && (
                    <input style={{ ...S.input, marginTop:8 }} placeholder="Enter chapter name" onChange={e => setForm(f => ({ ...f, chapter:e.target.value === "__custom__" ? "" : e.target.value }))} />
                  )}
                  {formErrors.chapter && <div style={S.errorText}>{formErrors.chapter}</div>}
                </div>
                <div style={S.formRow}>
                  <label style={S.label}>Difficulty</label>
                  <select style={{ ...S.select, width:"100%" }} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty:e.target.value }))}>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div style={S.formRow}>
                  <label style={S.label}>Number of Questions</label>
                  <input type="number" min={5} max={30} style={S.input} value={form.questions} onChange={e => setForm(f => ({ ...f, questions:e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={S.label}>Worksheet Title *</label>
                <input style={S.input} placeholder="e.g. Fractions – Easy Practice" value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} />
                {formErrors.title && <div style={S.errorText}>{formErrors.title}</div>}
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={S.label}>Description</label>
                <textarea style={{ ...S.input, minHeight:80, resize:"vertical" }} placeholder="Brief description of the worksheet content..." value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))} />
              </div>
              <div style={{ border:"1.5px dashed var(--color-border-secondary)", borderRadius:8, padding:"24px", textAlign:"center", marginBottom:20, background:"var(--color-background-secondary)" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>📎</div>
                <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)", marginBottom:4 }}>Attach PDF File</div>
                <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:12 }}>Drag & drop or click to browse · Max 10MB · PDF only</div>
                <button style={S.btnSecondary}>Browse File</button>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleAdminSubmit} style={S.btnPrimary}>{editId ? "✅ Save Changes" : "📤 Upload Worksheet"}</button>
                <button onClick={() => { setAdminTab("list"); setEditId(null); setFormErrors({}); }} style={S.btnSecondary}>Cancel</button>
              </div>
            </div>
          )}

          {adminTab === "list" && (
            <div>
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                <div style={{ position:"relative", flex:1, minWidth:200 }}>
                  <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"var(--color-text-tertiary)" }}>🔍</span>
                  <input style={{ ...S.input, paddingLeft:36 }} placeholder="Search worksheets..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} />
                </div>
              </div>
              <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"50px 1fr 100px 80px 80px 70px 130px", gap:0, padding:"10px 16px", background:"var(--color-background-secondary)", borderBottom:"0.5px solid var(--color-border-tertiary)", fontSize:12, fontWeight:500, color:"var(--color-text-secondary)" }}>
                  <span>Class</span><span>Title / Chapter</span><span>Subject</span><span>Diff.</span><span>Questions</span><span>Pages</span><span>Actions</span>
                </div>
                <div style={{ maxHeight:500, overflowY:"auto" }}>
                  {adminSheets.slice(0, 60).map((ws, i) => (
                    <div key={ws.id} style={{ display:"grid", gridTemplateColumns:"50px 1fr 100px 80px 80px 70px 130px", gap:0, padding:"12px 16px", borderBottom:"0.5px solid var(--color-border-tertiary)", fontSize:13, alignItems:"center", background: i % 2 === 0 ? "transparent" : "var(--color-background-secondary)" }}>
                      <div style={{ width:28, height:28, borderRadius:6, background:`${CLASS_COLORS[ws.class-1]}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:CLASS_COLORS[ws.class-1] }}>{ws.class}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)", marginBottom:2 }}>{ws.title}</div>
                        <div style={{ fontSize:11, color:"var(--color-text-secondary)" }}>{ws.chapter}</div>
                      </div>
                      <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{ws.subject}</div>
                      <div><span style={{ ...S.badge(DIFF_STYLE[ws.difficulty]), fontSize:10 }}>{ws.difficulty}</span></div>
                      <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{ws.questions}Q</div>
                      <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{ws.pages}p</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => handleEdit(ws)} style={S.btnSm("#2563eb")}>✏ Edit</button>
                        <button onClick={() => { if(confirm(`Delete "${ws.title}"?`)) handleDelete(ws.id); }} style={S.btnSm("#dc2626")}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:"12px 16px", borderTop:"0.5px solid var(--color-border-tertiary)", fontSize:12, color:"var(--color-text-secondary)", background:"var(--color-background-secondary)" }}>
                  Showing {Math.min(adminSheets.length, 60)} of {adminSheets.length} worksheets
                </div>
              </div>
            </div>
          )}
        </div>
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return null;
}
