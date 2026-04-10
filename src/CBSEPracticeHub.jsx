import { useState, useMemo, useEffect, useCallback } from "react";
import WORKSHEETS from "../data.json";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const FREE_DOWNLOADS_PER_CLASS = 3;
const RAZORPAY_KEY = "rzp_test_SbHfJChwJysf1R"; // ← replace with your Razorpay key

const PLANS = {
  class: { monthly: 49,  annual: 299,  label: "Single Class", desc: "Unlimited worksheets for 1 class" },
  all:   { monthly: 149, annual: 799,  label: "All Classes",  desc: "Unlimited for all 8 classes" },
};

const SUBJECT_META = {
  English:          { icon: "📖", color: "#b45309", bg: "#fef9ee", border: "#fbbf24" },
  Mathematics:      { icon: "🔢", color: "#1d4ed8", bg: "#eff6ff", border: "#60a5fa" },
  EVS:              { icon: "🌿", color: "#047857", bg: "#f0fdf4", border: "#34d399" },
  Science:          { icon: "🔬", color: "#6d28d9", bg: "#f5f3ff", border: "#a78bfa" },
  "Social Science": { icon: "🌍", color: "#be185d", bg: "#fdf2f8", border: "#f472b6" },
};

const SUBJECTS_BY_CLASS = (c) =>
  c <= 5 ? ["English","Mathematics","EVS"] : ["English","Mathematics","Science","Social Science"];

const DIFFICULTIES = ["Easy","Medium","Hard"];
const DS = {
  Easy:   { bg:"#dcfce7", color:"#15803d", border:"#86efac" },
  Medium: { bg:"#fef9c3", color:"#92400e", border:"#fde047" },
  Hard:   { bg:"#fee2e2", color:"#b91c1c", border:"#fca5a5" },
};
const CC = ["#1d4ed8","#0891b2","#047857","#d97706","#dc2626","#7c3aed","#be185d","#0369a1"];

const NCERT_STAGES = [
  { cls:"1–5",  label:"Primary Stage",    subjects:["English","Mathematics","EVS","Hindi"],                           desc:"Foundation concepts with activities" },
  { cls:"6–8",  label:"Middle Stage",     subjects:["English","Mathematics","Science","Social Science","Hindi"],       desc:"Core CBSE subjects with exercises" },
  { cls:"9–10", label:"Secondary Stage",  subjects:["English","Mathematics","Science","Social Science","Hindi"],       desc:"Board exam preparation" },
  { cls:"11–12",label:"Senior Secondary", subjects:["Physics","Chemistry","Biology","Mathematics","Economics"],        desc:"Advanced subject knowledge" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

// Track free downloads per class + subscriptions in localStorage
function useAccess() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem("cbse_access");
      return raw ? JSON.parse(raw) : { downloads: {}, subscribed: [] };
    } catch { return { downloads: {}, subscribed: [] }; }
  });

  const persist = (next) => {
    setState(next);
    try { localStorage.setItem("cbse_access", JSON.stringify(next)); } catch {}
  };

  const downloadsUsed = (cls) => state.downloads[cls] || 0;

  const freeLeft = (cls) => {
    if (isUnlocked(cls)) return Infinity;
    return Math.max(0, FREE_DOWNLOADS_PER_CLASS - downloadsUsed(cls));
  };

  const isUnlocked = (cls) =>
    state.subscribed.includes("all") || state.subscribed.includes(String(cls));

  const recordDownload = (cls) => {
    if (isUnlocked(cls)) return true; // unlimited
    const used = downloadsUsed(cls);
    if (used >= FREE_DOWNLOADS_PER_CLASS) return false; // blocked
    persist({ ...state, downloads: { ...state.downloads, [cls]: used + 1 } });
    return true;
  };

  const subscribe = (cls) => { // cls = number | "all"
    const key = cls === "all" ? "all" : String(cls);
    if (!state.subscribed.includes(key)) {
      persist({ ...state, subscribed: [...state.subscribed, key] });
    }
  };

  return { freeLeft, isUnlocked, recordDownload, subscribe, downloadsUsed };
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  page: { minHeight:"100vh", background:"#f0f4fa", fontFamily:"'Outfit',system-ui,sans-serif" },
  hdr:  { background:"#fff", borderBottom:"1px solid #e8edf5", padding:"0 20px",
          display:"flex", alignItems:"center", justifyContent:"space-between", height:58,
          position:"sticky", top:0, zIndex:200 },
  main: { maxWidth:1100, margin:"0 auto", padding:"28px 20px" },
  card: { background:"#fff", border:"1px solid #e8edf5", borderRadius:14, padding:"20px 22px" },
  bp:   { background:"#1e40af", color:"#fff", border:"none", padding:"10px 20px", borderRadius:9,
          fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"0.1px" },
  bpG:  { background:"linear-gradient(135deg,#059669,#047857)", color:"#fff", border:"none",
          padding:"10px 20px", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer" },
  bs:   { background:"none", color:"#475569", border:"1px solid #e2e8f0", padding:"10px 20px",
          borderRadius:9, fontSize:13, cursor:"pointer" },
  inp:  { width:"100%", padding:"10px 13px", borderRadius:8, border:"1px solid #d1d9e6",
          fontSize:13, background:"#fff", color:"#0f172a", boxSizing:"border-box",
          outline:"none", fontFamily:"inherit" },
  sel:  { padding:"10px 13px", borderRadius:8, border:"1px solid #d1d9e6", fontSize:13,
          background:"#fff", color:"#0f172a", cursor:"pointer", fontFamily:"inherit" },
  chip: { display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20,
          fontSize:11, background:"#f1f5f9", border:"1px solid #e2e8f0", color:"#64748b" },
  badge:(s) => ({ display:"inline-flex", alignItems:"center", padding:"2px 9px", borderRadius:20,
                  fontSize:11, fontWeight:600, border:`1px solid ${s.border}`, background:s.bg, color:s.color }),
  nb:   { padding:"7px 15px", borderRadius:7, border:"1px solid #e2e8f0", background:"none",
          fontSize:13, cursor:"pointer", color:"#475569", fontWeight:500 },
  nba:  { background:"#1e40af", color:"#fff", border:"1px solid #1e40af" },
  over: { position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", zIndex:500,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
};

// ─────────────────────────────────────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type="ok", onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  const bg = type === "ok" ? "#1e293b" : type === "warn" ? "#92400e" : "#15803d";
  return (
    <div style={{ position:"fixed", bottom:20, right:20, zIndex:9999, background:bg, color:"#fff",
      padding:"12px 18px", borderRadius:12, fontSize:13, display:"flex", alignItems:"center",
      gap:10, maxWidth:340, boxShadow:"0 10px 30px rgba(0,0,0,0.25)" }}>
      <span>{type==="ok"?"✅":type==="warn"?"⚠️":"🎉"}</span>
      <span style={{ flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:16, padding:0 }}>×</button>
    </div>
  );
};

const Bc = ({ crumbs, onNav }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:4, alignItems:"center", marginBottom:20, fontSize:13 }}>
    {crumbs.map((c,i) => (
      <span key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
        {i < crumbs.length-1
          ? <button onClick={() => onNav(c.a)} style={{ background:"none", border:"none", color:"#2563eb", cursor:"pointer", fontSize:13, padding:0, fontFamily:"inherit" }}>{c.l}</button>
          : <span style={{ color:"#0f172a", fontWeight:600 }}>{c.l}</span>}
        {i < crumbs.length-1 && <span style={{ color:"#cbd5e1" }}>›</span>}
      </span>
    ))}
  </div>
);

// Free downloads remaining pill
const FreeBadge = ({ left, unlocked }) => {
  if (unlocked) return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#f0fdf4",
      border:"1px solid #86efac", borderRadius:20, padding:"3px 10px", fontSize:11, color:"#15803d", fontWeight:600 }}>
      ⭐ Premium Unlocked
    </span>
  );
  if (left <= 0) return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#fff1f2",
      border:"1px solid #fecaca", borderRadius:20, padding:"3px 10px", fontSize:11, color:"#dc2626", fontWeight:600 }}>
      🔒 Upgrade to Download
    </span>
  );
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      background: left===1 ? "#fff7ed" : "#eff6ff",
      border: `1px solid ${left===1?"#fed7aa":"#bfdbfe"}`,
      borderRadius:20, padding:"3px 10px", fontSize:11,
      color: left===1 ? "#c2410c":"#1d4ed8", fontWeight:600 }}>
      {left===1?"⚠️":"📥"} {left} free {left===1?"download":"downloads"} left
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYWALL MODAL
// ─────────────────────────────────────────────────────────────────────────────
const PaywallModal = ({ cls, onSubscribe, onClose }) => (
  <div style={T.over} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, padding:"36px 32px",
      maxWidth:480, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.18)", textAlign:"center" }}>
      <div style={{ fontSize:52, marginBottom:12 }}>🔒</div>
      <h2 style={{ fontSize:22, fontWeight:700, color:"#0f172a", margin:"0 0 10px", letterSpacing:"-0.5px" }}>
        You've used your 3 free downloads
      </h2>
      <p style={{ fontSize:14, color:"#64748b", margin:"0 0 24px", lineHeight:1.6 }}>
        You've used all <strong>3 free worksheets</strong> for <strong>Class {cls}</strong>.
        Unlock unlimited downloads for just ₹49/month.
      </p>

      <div style={{ background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"1px solid #bfdbfe",
        borderRadius:14, padding:"20px", marginBottom:20, textAlign:"left" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#1d4ed8", marginBottom:12 }}>✨ What you get with Premium:</div>
        {["Unlimited downloads for all 15 worksheets in Class "+cls,
          "Easy, Medium & Hard — all 5 sets per difficulty",
          "New worksheets added every month",
          "Ad-free experience"].map(f => (
          <div key={f} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8, fontSize:13, color:"#1e3a8a" }}>
            <span style={{ color:"#16a34a", flexShrink:0, marginTop:1 }}>✓</span>{f}
          </div>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button onClick={() => onSubscribe(cls, "class")} style={{ ...T.bpG, padding:"14px 20px", fontSize:15, borderRadius:10 }}>
          🔓 Unlock Class {cls} — ₹49/month
        </button>
        <button onClick={() => onSubscribe("all", "all")} style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", color:"#fff",
          border:"none", padding:"12px 20px", borderRadius:10, fontSize:14, cursor:"pointer", fontWeight:600 }}>
          🚀 Unlock All Classes — ₹149/month
        </button>
        <button onClick={onClose} style={{ ...T.bs, fontSize:13 }}>Maybe later</button>
      </div>
      <p style={{ fontSize:11, color:"#94a3b8", marginTop:14 }}>
        Secure payment · Cancel anytime · UPI / Cards / Wallets accepted
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT GATEWAY MODAL
// ─────────────────────────────────────────────────────────────────────────────
const WALLETS = [
  { id:"gpay",    name:"Google Pay",   icon:"🟢", color:"#1a73e8" },
  { id:"phonepe", name:"PhonePe",      icon:"🟣", color:"#5f259f" },
  { id:"paytm",   name:"Paytm",        icon:"🔵", color:"#00baf2" },
  { id:"amazon",  name:"Amazon Pay",   icon:"🟡", color:"#ff9900" },
  { id:"cred",    name:"CRED",         icon:"⚫", color:"#1c1c1c" },
];

const PaymentModal = ({ plan, cls, billing, onSuccess, onClose }) => {
  const amount = billing === "annual" ? PLANS[plan].annual : PLANS[plan].monthly;
  const label  = plan === "all" ? "All Classes" : `Class ${cls}`;
  const [tab,    setTab]    = useState("upi"); // upi | card | wallet | netbanking
  const [upiId,  setUpiId]  = useState("");
  const [paying, setPaying] = useState(false);
  const [selWal, setSelWal] = useState(null);
  const [cardNo, setCardNo] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv,    setCvv]    = useState("");
  const [name,   setName]   = useState("");

  // Razorpay checkout integration
  const launchRazorpay = useCallback(() => {
    if (typeof window.Razorpay === "undefined") {
      // Load Razorpay script dynamically
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = doRazorpay;
      document.head.appendChild(s);
    } else { doRazorpay(); }
  }, [amount, label]);

  const doRazorpay = () => {
    const options = {
      key: RAZORPAY_KEY,
      amount: amount * 100, // paise
      currency: "INR",
      name: "CBSE Practice Hub",
      description: `${label} — ${billing === "annual" ? "Annual" : "Monthly"} Plan`,
      image: "https://cbse-practice-hub.vercel.app/favicon.ico",
      handler: () => { onSuccess(); },
      prefill: { name: "", email: "", contact: "" },
      theme: { color: "#1e40af" },
      method: {
        upi: true, card: true, netbanking: true, wallet: true,
        emi: false, paylater: false,
      },
    };
    new window.Razorpay(options).open();
  };

  const simulatePay = () => {
    setPaying(true);
    setTimeout(() => { setPaying(false); onSuccess(); }, 2000);
  };

  const tabStyle = (id) => ({
    flex:1, padding:"10px 4px", border:"none", background:"none", cursor:"pointer",
    fontSize:12, fontWeight:600, fontFamily:"inherit", borderBottom:"2px solid",
    borderColor: tab===id ? "#1e40af":"transparent",
    color: tab===id ? "#1e40af":"#64748b",
  });

  return (
    <div style={T.over} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, padding:"0",
        maxWidth:440, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.2)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#1e3a8a,#1e40af)", padding:"20px 24px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.15)",
            border:"none", color:"#fff", width:28, height:28, borderRadius:"50%", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:4 }}>CBSE PRACTICE HUB · SECURE CHECKOUT</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"-0.3px" }}>₹{amount}<span style={{ fontSize:14, fontWeight:400 }}>/{billing==="annual"?"year":"month"}</span></div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", marginTop:4 }}>{label} · {billing==="annual"?"Annual (save 50%)":"Monthly"} Plan</div>
          {billing==="annual" && <div style={{ display:"inline-flex", marginTop:8, background:"#fbbf24", color:"#1e3a8a", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>🎉 50% OFF vs Monthly</div>}
        </div>

        {/* Payment tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid #e8edf5", padding:"0 16px" }}>
          {[["upi","📱 UPI"],["wallet","👛 Wallets"],["card","💳 Card"],["netbanking","🏦 Net Banking"]].map(([id,lb]) => (
            <button key={id} style={tabStyle(id)} onClick={() => setTab(id)}>{lb}</button>
          ))}
        </div>

        <div style={{ padding:"20px 24px" }}>

          {/* UPI TAB */}
          {tab==="upi" && (
            <div>
              {/* UPI QR */}
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ display:"inline-block", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:"16px" }}>
                  {/* Simulated QR */}
                  <svg width="140" height="140" viewBox="0 0 140 140" style={{ display:"block" }}>
                    <rect width="140" height="140" fill="#fff"/>
                    {/* QR pattern simulation */}
                    {[0,1,2,3,4,5,6].map(r=>
                      [0,1,2,3,4,5,6].map(c=> {
                        const edge = r<7&&r>=0&&(c===0||c===6||r===0||r===6);
                        const inner = r>=2&&r<=4&&c>=2&&c<=4;
                        if(edge||inner) return <rect key={`${r}-${c}`} x={8+c*18} y={8+r*18} width="15" height="15" fill="#0f172a" rx="2"/>;
                        return null;
                      })
                    )}
                    {[7,8,9].map(r=>
                      [0,1,2,3,4,5,6,7,8,9].map(c=> {
                        if (Math.random()>0.5) return null;
                        return <rect key={`${r}-${c}`} x={8+c*12} y={8+r*12} width="9" height="9" fill="#0f172a" rx="1"/>;
                      })
                    )}
                    <text x="70" y="130" textAnchor="middle" fill="#1e40af" fontSize="9" fontWeight="bold">Scan to Pay ₹{amount}</text>
                  </svg>
                </div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:10 }}>Scan with any UPI app · PhonePe · GPay · Paytm</div>
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:10, margin:"0 0 16px" }}>
                <div style={{ flex:1, height:"1px", background:"#e2e8f0" }}/>
                <span style={{ fontSize:12, color:"#94a3b8" }}>or enter UPI ID</span>
                <div style={{ flex:1, height:"1px", background:"#e2e8f0" }}/>
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <input style={T.inp} placeholder="yourname@upi · phonepe · gpay" value={upiId} onChange={e=>setUpiId(e.target.value)}/>
                <button onClick={simulatePay} disabled={!upiId||paying}
                  style={{ ...T.bpG, padding:"10px 16px", opacity:(!upiId||paying)?0.6:1, whiteSpace:"nowrap" }}>
                  {paying ? "Verifying…":"Pay ₹"+amount}
                </button>
              </div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:8, textAlign:"center" }}>
                Supports: @okaxis · @okicici · @oksbi · @ybl · @paytm · @apl
              </div>
            </div>
          )}

          {/* WALLET TAB */}
          {tab==="wallet" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {WALLETS.map(w => (
                  <button key={w.id} onClick={() => setSelWal(w.id)}
                    style={{ background: selWal===w.id ? "#eff6ff":"#f8fafc",
                      border:`1.5px solid ${selWal===w.id?"#1e40af":"#e2e8f0"}`,
                      borderRadius:10, padding:"14px 12px", cursor:"pointer",
                      display:"flex", alignItems:"center", gap:10, fontFamily:"inherit" }}>
                    <span style={{ fontSize:20 }}>{w.icon}</span>
                    <span style={{ fontSize:13, fontWeight:600, color: selWal===w.id?"#1e40af":"#334155" }}>{w.name}</span>
                  </button>
                ))}
              </div>
              <button onClick={simulatePay} disabled={!selWal||paying}
                style={{ ...T.bpG, width:"100%", padding:"13px", opacity:(!selWal||paying)?0.6:1 }}>
                {paying?"Processing…":selWal?`Pay ₹${amount} via ${WALLETS.find(w=>w.id===selWal)?.name}`:"Select a wallet"}
              </button>
            </div>
          )}

          {/* CARD TAB */}
          {tab==="card" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:5, display:"block" }}>Card Number</label>
                <div style={{ position:"relative" }}>
                  <input style={T.inp} placeholder="1234  5678  9012  3456" maxLength={19}
                    value={cardNo} onChange={e=>setCardNo(e.target.value.replace(/\D/g,"").replace(/(.{4})/g,"$1 ").trim())}/>
                  <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:18 }}>💳</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:5, display:"block" }}>Cardholder Name</label>
                <input style={T.inp} placeholder="As on card" value={name} onChange={e=>setName(e.target.value)}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:5, display:"block" }}>Expiry</label>
                  <input style={T.inp} placeholder="MM/YY" maxLength={5}
                    value={expiry} onChange={e=>setExpiry(e.target.value.replace(/\D/g,"").replace(/^(.{2})/,"$1/").slice(0,5))}/>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:5, display:"block" }}>CVV</label>
                  <input style={T.inp} placeholder="•••" maxLength={4} type="password"
                    value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,""))}/>
                </div>
              </div>
              <button onClick={simulatePay} disabled={paying||!cardNo||!name||!expiry||!cvv}
                style={{ ...T.bpG, padding:"13px", opacity:(paying||!cardNo||!name||!expiry||!cvv)?0.6:1 }}>
                {paying?"Processing…":`Pay ₹${amount} Securely`}
              </button>
              <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                {["Visa","Mastercard","RuPay","Amex"].map(b => (
                  <span key={b} style={{ fontSize:10, background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:5, padding:"3px 7px", color:"#475569" }}>{b}</span>
                ))}
              </div>
            </div>
          )}

          {/* NET BANKING TAB */}
          {tab==="netbanking" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
                {[["SBI","🟦"],["HDFC","🟥"],["ICICI","🟧"],["Axis","🟪"],["Kotak","🟥"],["PNB","🟦"]].map(([b,ic]) => (
                  <button key={b} onClick={simulatePay}
                    style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"12px 8px",
                      cursor:"pointer", textAlign:"center", fontFamily:"inherit" }}>
                    <div style={{ fontSize:18, marginBottom:4 }}>{ic}</div>
                    <div style={{ fontSize:11, fontWeight:600, color:"#334155" }}>{b}</div>
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <select style={{ ...T.sel, flex:1 }}>
                  <option>Select other bank…</option>
                  {["Yes Bank","Bank of Baroda","Canara Bank","UCO Bank","IDBI Bank"].map(b=><option key={b}>{b}</option>)}
                </select>
                <button onClick={simulatePay} style={T.bp}>Go →</button>
              </div>
            </div>
          )}
        </div>

        {/* Security strip */}
        <div style={{ background:"#f8fafc", borderTop:"1px solid #e8edf5", padding:"12px 24px",
          display:"flex", alignItems:"center", justifyContent:"center", gap:16 }}>
          {["🔒 256-bit SSL","🛡️ PCI-DSS Secure","↩️ Easy Refunds"].map(f=>(
            <span key={f} style={{ fontSize:11, color:"#64748b" }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PRICING PAGE
// ─────────────────────────────────────────────────────────────────────────────
const PricingPage = ({ onPay, onBack, access }) => {
  const [billing, setBilling] = useState("monthly");

  return (
    <div style={T.page}>
      {/* Back button overlay in top left */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e8edf5", padding:"0 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between", height:58 }}>
        <button onClick={onBack} style={{ ...T.nb, display:"flex", alignItems:"center", gap:6 }}>← Back</button>
        <span style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>📚 CBSE Practice Hub</span>
        <div style={{ width:80 }}/>
      </div>

      <div style={{ ...T.main, maxWidth:860 }}>

        {/* Hero */}
        <div style={{ textAlign:"center", padding:"32px 0 28px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#eff6ff",
            border:"1px solid #bfdbfe", borderRadius:20, padding:"5px 14px", fontSize:12, color:"#1d4ed8", fontWeight:600, marginBottom:16 }}>
            ⭐ Premium Plans
          </div>
          <h1 style={{ fontSize:32, fontWeight:800, color:"#0f172a", margin:"0 0 12px", letterSpacing:"-1px" }}>
            Unlock Unlimited Worksheets
          </h1>
          <p style={{ fontSize:16, color:"#64748b", margin:"0 0 24px", lineHeight:1.6 }}>
            3 downloads free · then just ₹49/month per class · Cancel any time
          </p>

          {/* Billing toggle */}
          <div style={{ display:"inline-flex", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:10, padding:4 }}>
            {["monthly","annual"].map(b => (
              <button key={b} onClick={() => setBilling(b)}
                style={{ padding:"8px 20px", borderRadius:7, border:"none", cursor:"pointer", fontSize:13,
                  fontWeight:600, fontFamily:"inherit", background: billing===b?"#fff":"transparent",
                  color: billing===b?"#0f172a":"#64748b",
                  boxShadow: billing===b?"0 1px 4px rgba(0,0,0,0.1)":"none", transition:"all 0.15s" }}>
                {b==="monthly"?"Monthly":"Annual"}{b==="annual"&&<span style={{ marginLeft:6, fontSize:10, background:"#dcfce7", color:"#15803d", padding:"1px 6px", borderRadius:10, fontWeight:700 }}>-50%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16, marginBottom:36 }}>

          {/* Free plan */}
          <div style={{ ...T.card, border:"1px solid #e2e8f0" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#64748b", letterSpacing:"0.5px", marginBottom:8 }}>FREE</div>
            <div style={{ fontSize:28, fontWeight:800, color:"#0f172a", marginBottom:4 }}>₹0</div>
            <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>Forever free</div>
            {["3 downloads per class","All subjects accessible","Easy, Medium & Hard","Preview all worksheets"].map(f=>(
              <div key={f} style={{ display:"flex", gap:8, fontSize:13, color:"#334155", marginBottom:8 }}>
                <span style={{ color:"#16a34a", flexShrink:0 }}>✓</span>{f}
              </div>
            ))}
            <div style={{ height:1, background:"#f1f5f9", margin:"16px 0" }}/>
            {["Unlimited downloads","No ads"].map(f=>(
              <div key={f} style={{ display:"flex", gap:8, fontSize:13, color:"#94a3b8", marginBottom:8 }}>
                <span style={{ color:"#d1d5db", flexShrink:0 }}>✗</span>{f}
              </div>
            ))}
            <button disabled style={{ ...T.bs, width:"100%", marginTop:16, opacity:0.5, cursor:"not-allowed" }}>Current Plan</button>
          </div>

          {/* Per class plan */}
          <div style={{ ...T.card, border:"2px solid #1e40af", position:"relative" }}>
            <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
              background:"#1e40af", color:"#fff", fontSize:11, fontWeight:700, padding:"4px 14px", borderRadius:20 }}>
              MOST POPULAR
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:"#1d4ed8", letterSpacing:"0.5px", marginBottom:8 }}>SINGLE CLASS</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:4 }}>
              <span style={{ fontSize:28, fontWeight:800, color:"#0f172a" }}>₹{billing==="annual"?PLANS.class.annual:PLANS.class.monthly}</span>
              <span style={{ fontSize:13, color:"#64748b" }}>/{billing==="annual"?"year":"month"}</span>
            </div>
            {billing==="annual" && <div style={{ fontSize:12, color:"#15803d", marginBottom:4 }}>= ₹{Math.round(PLANS.class.annual/12)}/month · 50% savings</div>}
            <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>Per class of your choice</div>
            {["Unlimited downloads — that class","All 15 worksheets per subject","5 sets × 3 difficulty levels","Answer keys included","New content monthly"].map(f=>(
              <div key={f} style={{ display:"flex", gap:8, fontSize:13, color:"#334155", marginBottom:8 }}>
                <span style={{ color:"#16a34a", flexShrink:0 }}>✓</span>{f}
              </div>
            ))}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:16 }}>
              {[1,2,3,4,5,6,7,8].map(c => (
                <button key={c} onClick={() => onPay(c,"class",billing)}
                  style={{ background: access.isUnlocked(c)?"#f0fdf4":"#1e40af",
                    color: access.isUnlocked(c)?"#15803d":"#fff",
                    border: `1px solid ${access.isUnlocked(c)?"#86efac":"#1e40af"}`,
                    padding:"8px 4px", borderRadius:7, fontSize:12, cursor: access.isUnlocked(c)?"default":"pointer",
                    fontWeight:600, fontFamily:"inherit" }}>
                  {access.isUnlocked(c)?"✓ Class "+c:"Class "+c}
                </button>
              ))}
            </div>
          </div>

          {/* All classes plan */}
          <div style={{ ...T.card, background:"linear-gradient(160deg,#f5f3ff,#ede9fe)", border:"2px solid #7c3aed" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#7c3aed", letterSpacing:"0.5px", marginBottom:8 }}>ALL CLASSES 🚀</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:4 }}>
              <span style={{ fontSize:28, fontWeight:800, color:"#0f172a" }}>₹{billing==="annual"?PLANS.all.annual:PLANS.all.monthly}</span>
              <span style={{ fontSize:13, color:"#64748b" }}>/{billing==="annual"?"year":"month"}</span>
            </div>
            {billing==="annual" && <div style={{ fontSize:12, color:"#15803d", marginBottom:4 }}>= ₹{Math.round(PLANS.all.annual/12)}/month · 55% savings</div>}
            <div style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>Best value for families</div>
            {["Unlimited for all 8 classes","Perfect for siblings","405 total worksheets","Priority new content","All future classes included"].map(f=>(
              <div key={f} style={{ display:"flex", gap:8, fontSize:13, color:"#4c1d95", marginBottom:8 }}>
                <span style={{ color:"#7c3aed", flexShrink:0 }}>✓</span>{f}
              </div>
            ))}
            <button onClick={() => onPay("all","all",billing)}
              disabled={access.isUnlocked("all")}
              style={{ background: access.isUnlocked("all")?"#f0fdf4":"linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: access.isUnlocked("all")?"#15803d":"#fff",
                border:"none", padding:"13px", borderRadius:9, fontSize:14, cursor: access.isUnlocked("all")?"default":"pointer",
                fontWeight:700, width:"100%", marginTop:20, fontFamily:"inherit" }}>
              {access.isUnlocked("all")?"✓ All Classes Unlocked":"🚀 Unlock All Classes"}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ ...T.card, marginBottom:24 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Frequently Asked Questions</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20 }}>
            {[["Can I cancel anytime?","Yes. Cancel from your account dashboard before the next billing cycle and you won't be charged."],
              ["Which payment methods are accepted?","UPI (GPay, PhonePe, Paytm), Debit/Credit Cards (Visa, Mastercard, RuPay), Net Banking, and all major wallets."],
              ["Do I get a refund if I cancel?","We offer a 7-day money-back guarantee if you are not satisfied with your purchase."],
              ["Is the subscription per child or per family?","Your subscription covers one account and can be used by one family across all devices."]].map(([q,a]) => (
              <div key={q}>
                <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:5 }}>{q}</div>
                <div style={{ fontSize:13, color:"#64748b", lineHeight:1.6 }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust strip */}
        <div style={{ textAlign:"center", display:"flex", justifyContent:"center", gap:24, flexWrap:"wrap" }}>
          {["🔒 Secure Payments","↩️ 7-Day Refund","📱 UPI & Cards","🇮🇳 Indian Payment Gateway"].map(f=>(
            <div key={f} style={{ fontSize:13, color:"#64748b" }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESS MODAL
// ─────────────────────────────────────────────────────────────────────────────
const SuccessModal = ({ cls, plan, onClose }) => (
  <div style={T.over}>
    <div style={{ background:"#fff", borderRadius:20, padding:"40px 32px", maxWidth:400, width:"100%",
      textAlign:"center", boxShadow:"0 24px 80px rgba(0,0,0,0.2)" }}>
      <div style={{ fontSize:60, marginBottom:16 }}>🎉</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:"#0f172a", margin:"0 0 10px", letterSpacing:"-0.5px" }}>Payment Successful!</h2>
      <p style={{ fontSize:14, color:"#64748b", margin:"0 0 24px", lineHeight:1.6 }}>
        {plan==="all"
          ? "All 8 classes are now unlocked! Download unlimited worksheets."
          : `Class ${cls} is now unlocked! Download all 15 worksheets for every subject.`}
      </p>
      <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"16px", marginBottom:24, textAlign:"left" }}>
        {["Unlimited downloads active","All sets A–E available","Answer keys included","New content added monthly"].map(f=>(
          <div key={f} style={{ display:"flex", gap:8, fontSize:13, color:"#166534", marginBottom:6 }}>
            <span style={{ color:"#16a34a" }}>✓</span>{f}
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ ...T.bpG, padding:"13px 32px", fontSize:15, width:"100%" }}>
        Start Downloading 📥
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────
const Hdr = ({ nav, active, onPricing }) => (
  <header style={T.hdr}>
    <div onClick={() => nav("home")} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
      <div style={{ width:30, height:30, borderRadius:7, background:"linear-gradient(135deg,#1e3a8a,#2563eb)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>📚</div>
      <span style={{ fontWeight:800, fontSize:15, color:"#0f172a", letterSpacing:"-0.3px" }}>CBSE Practice Hub</span>
    </div>
    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
      <button onClick={() => nav("search")}  style={{ ...T.nb, ...(active==="search"?T.nba:{}) }}>🔍 Search</button>
      <button onClick={() => nav("ebooks")}  style={{ ...T.nb, ...(active==="ebooks"?T.nba:{}) }}>📗 Ebooks</button>
      <button onClick={onPricing}
        style={{ background:"linear-gradient(135deg,#059669,#047857)", color:"#fff", border:"none",
          padding:"7px 15px", borderRadius:7, fontSize:13, fontWeight:700, cursor:"pointer",
          display:"flex", alignItems:"center", gap:5 }}>
        ⭐ Upgrade
      </button>
    </div>
  </header>
);

// ─────────────────────────────────────────────────────────────────────────────
// WORKSHEET CARD — handles free/locked state
// ─────────────────────────────────────────────────────────────────────────────
const WsCard = ({ ws, access, onDownload, onUpgradePrompt }) => {
  const unlocked = access.isUnlocked(ws.class);
  const left     = access.freeLeft(ws.class);
  const canDl    = unlocked || left > 0;
  const ds       = DS[ws.difficulty];

  return (
    <div style={{ ...T.card, display:"flex", flexDirection:"column", gap:10, cursor:"default",
      borderTop:`3px solid ${canDl?ds.border:"#e2e8f0"}`,
      opacity: canDl ? 1 : 1, transition:"box-shadow 0.15s",
      position:"relative", overflow:"hidden" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.07)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>

      {/* Lock overlay for fully locked */}
      {!canDl && (
        <div style={{ position:"absolute", inset:0, background:"rgba(248,250,252,0.85)", display:"flex",
          flexDirection:"column", alignItems:"center", justifyContent:"center", borderRadius:11, zIndex:2, backdropFilter:"blur(2px)" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🔒</div>
          <div style={{ fontSize:12, fontWeight:700, color:"#0f172a", marginBottom:10 }}>Free downloads used</div>
          <button onClick={onUpgradePrompt}
            style={{ background:"linear-gradient(135deg,#1e40af,#2563eb)", color:"#fff", border:"none",
              padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            Unlock — ₹49/month
          </button>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ width:36, height:36, borderRadius:8, background:ds.bg, border:`1px solid ${ds.border}`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:ds.color }}>
          {ws.set}
        </div>
        <span style={T.badge(ds)}>{ws.difficulty}</span>
      </div>

      <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", lineHeight:1.3 }}>{ws.title}</div>

      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        <span style={T.chip}>❓ {ws.question_count}Q</span>
        <span style={T.chip}>📄 {ws.pages}p</span>
        {ws.has_answer_key && <span style={{ ...T.chip, color:"#15803d", borderColor:"#86efac", background:"#f0fdf4" }}>✅ Answers</span>}
        {unlocked && <span style={{ ...T.chip, color:"#1d4ed8", borderColor:"#bfdbfe", background:"#eff6ff" }}>⭐ Premium</span>}
      </div>

      {canDl ? (
        <div style={{ display:"flex", gap:7 }}>
          <button onClick={() => onDownload(ws)} style={{ ...T.bp, flex:1, textAlign:"center", padding:"9px 8px", fontSize:12 }}>
            📥 Download PDF
          </button>
          <button onClick={() => ws.pdf_url ? window.open(ws.pdf_url,"_blank") : null}
            style={{ ...T.bs, padding:"9px 12px", fontSize:12 }}>👁</button>
        </div>
      ) : (
        <button onClick={onUpgradePrompt}
          style={{ ...T.bp, width:"100%", background:"linear-gradient(135deg,#1e40af,#2563eb)", fontSize:12, padding:"10px" }}>
          🔓 Unlock to Download
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function CBSEPracticeHub() {
  const [view,       setView]       = useState("home");
  const [cls,        setCls]        = useState(null);
  const [subj,       setSubj]       = useState(null);
  const [toast,      setToast]      = useState(null);
  const [q,          setQ]          = useState("");
  const [fCls,       setFCls]       = useState("");
  const [fSub,       setFSub]       = useState("");
  const [fDiff,      setFDiff]      = useState("");
  // Modals
  const [paywall,    setPaywall]    = useState(null);  // { cls }
  const [payment,    setPayment]    = useState(null);  // { cls, plan, billing }
  const [success,    setSuccess]    = useState(null);  // { cls, plan }
  const [showPricing,setShowPricing]= useState(false);

  const access = useAccess();
  const toast2 = (m,t="ok") => setToast({ m, t });

  const nav = (a) => {
    if      (a==="home")    { setView("home");    setCls(null); setSubj(null); }
    else if (a==="class")   { setView("class");   setSubj(null); }
    else if (a==="subject") { setView("subject"); }
    else                    { setView(a); }
    setShowPricing(false);
  };

  const subjWS = useMemo(() =>
    cls && subj ? WORKSHEETS.filter(w => w.class===cls && w.subject===subj) : [],
    [cls,subj]);

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
    [q,fCls,fSub,fDiff]);

  // Download handler — checks free limit
  const handleDownload = (ws) => {
    const ok = access.recordDownload(ws.class);
    if (!ok) { setPaywall({ cls: ws.class }); return; }
    if (ws.pdf_url) {
      window.open(ws.pdf_url,"_blank","noopener,noreferrer");
      const left = access.freeLeft(ws.class);
      if (!access.isUnlocked(ws.class)) {
        if (left === 0) toast2(`Last free download used for Class ${ws.class}. Upgrade to continue!`,"warn");
        else toast2(`"${ws.title}" opened · ${left} free download${left>1?"s":""} left for Class ${ws.class}`);
      } else {
        toast2(`"${ws.title}" opened`);
      }
    } else { toast2("PDF not available yet","warn"); }
  };

  // Paywall → payment
  const handlePaywallSubscribe = (planCls, plan) => {
    setPaywall(null);
    setPayment({ cls: planCls, plan, billing:"monthly" });
  };

  // Pricing → payment
  const handlePricingPay = (planCls, plan, billing) => {
    setShowPricing(false);
    setPayment({ cls: planCls, plan, billing });
  };

  // Payment → success
  const handlePaySuccess = () => {
    const { cls: pCls, plan } = payment;
    access.subscribe(plan==="all" ? "all" : pCls);
    setPayment(null);
    setSuccess({ cls: pCls, plan });
    toast2(plan==="all" ? "🎉 All classes unlocked!" : `🎉 Class ${pCls} unlocked!`,"success");
  };

  if (showPricing) return (
    <>
      <PricingPage onPay={handlePricingPay} onBack={() => setShowPricing(false)} access={access} />
      {payment && <PaymentModal {...payment} onSuccess={handlePaySuccess} onClose={() => setPayment(null)} />}
      {success  && <SuccessModal {...success} onClose={() => setSuccess(null)} />}
    </>
  );

  // ── HOME ──────────────────────────────────────────────────────────────────
  const HomeView = () => (
    <div style={T.page}>
      <Hdr nav={nav} active="home" onPricing={() => setShowPricing(true)} />

      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a8a 40%,#1e40af 70%,#2563eb)", padding:"64px 24px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"20%", left:"10%", width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.03)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"10%", right:"8%", width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }}/>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.12)",
          border:"1px solid rgba(255,255,255,0.25)", borderRadius:20, padding:"5px 14px", fontSize:12,
          color:"rgba(255,255,255,0.9)", fontWeight:600, marginBottom:18 }}>
          ✨ CBSE 2025–26 · 405 Free Worksheets Available
        </div>
        <h1 style={{ fontSize:40, fontWeight:900, color:"#fff", margin:"0 0 14px", letterSpacing:"-1.5px", lineHeight:1.1 }}>
          Practice Smarter with<br/><span style={{ color:"#fbbf24" }}>CBSE Worksheets</span>
        </h1>
        <p style={{ fontSize:16, color:"rgba(255,255,255,0.7)", margin:"0 0 28px", maxWidth:460, marginLeft:"auto", marginRight:"auto", lineHeight:1.7 }}>
          3 free downloads per class · Then ₹49/month for unlimited access · All subjects · Answer keys included
        </p>
        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={() => document.getElementById("cg")?.scrollIntoView({ behavior:"smooth" })}
            style={{ background:"#fbbf24", color:"#1e3a8a", border:"none", padding:"13px 26px", borderRadius:9, fontSize:14, fontWeight:800, cursor:"pointer" }}>
            Browse Free Worksheets ↓
          </button>
          <button onClick={() => setShowPricing(true)}
            style={{ background:"rgba(255,255,255,0.12)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", padding:"13px 26px", borderRadius:9, fontSize:14, cursor:"pointer", fontWeight:600 }}>
            ⭐ See Pricing
          </button>
        </div>
      </div>

      {/* Feature strip */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e8edf5" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))" }}>
          {[["📥","3 Free per Class","No sign-up needed"],["🔓","₹49/month","Unlock a class fully"],
            ["📚","All Subjects","English, Math, Science+"],["✅","Answer Keys","Every PDF has answers"],
            ["🖨️","A4 Print-Ready","Download & print instantly"]].map(([ic,lb,ds],i,arr) => (
            <div key={i} style={{ padding:"14px", textAlign:"center", borderRight: i<arr.length-1?"1px solid #e8edf5":"none" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{ic}</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#0f172a", marginBottom:2 }}>{lb}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{ds}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={T.main}>
        <div id="cg" style={{ scrollMarginTop:64 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, flexWrap:"wrap", gap:8 }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", letterSpacing:"-0.4px", margin:0 }}>Browse by Class</h2>
            <button onClick={() => setShowPricing(true)}
              style={{ background:"#f0fdf4", border:"1px solid #86efac", color:"#15803d", borderRadius:8, padding:"7px 14px", fontSize:12, cursor:"pointer", fontWeight:700 }}>
              🔓 Unlock Unlimited Access
            </button>
          </div>
          <p style={{ fontSize:14, color:"#64748b", marginBottom:22 }}>3 free downloads per class · Upgrade for unlimited</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:12, marginBottom:40 }}>
            {[1,2,3,4,5,6,7,8].map((c,i) => {
              const count = WORKSHEETS.filter(w=>w.class===c).length;
              const left  = access.freeLeft(c);
              const unlocked = access.isUnlocked(c);
              return (
                <div key={c} onClick={() => { setCls(c); nav("class"); }}
                  style={{ ...T.card, textAlign:"center", padding:"18px 10px", cursor:"pointer", transition:"all 0.15s",
                    border: unlocked?"2px solid #16a34a":"1px solid #e8edf5" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = unlocked?"#16a34a":CC[i]; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 20px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = unlocked?"#16a34a":"#e8edf5"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:`${CC[i]}15`,
                    border:`2px solid ${CC[i]}40`, display:"flex", alignItems:"center", justifyContent:"center",
                    margin:"0 auto 10px", fontSize:18, fontWeight:800, color:CC[i] }}>{c}</div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#0f172a", marginBottom:3 }}>Class {c}</div>
                  <div style={{ fontSize:10, color:"#64748b", marginBottom:6 }}>{SUBJECTS_BY_CLASS(c).length} subjects</div>
                  {unlocked
                    ? <div style={{ fontSize:10, background:"#f0fdf4", color:"#15803d", padding:"3px 8px", borderRadius:20, border:"1px solid #86efac", fontWeight:700 }}>⭐ Unlocked</div>
                    : left > 0
                      ? <div style={{ fontSize:10, background:"#eff6ff", color:"#1d4ed8", padding:"3px 8px", borderRadius:20, border:"1px solid #bfdbfe" }}>{left}/{FREE_DOWNLOADS_PER_CLASS} free</div>
                      : <div style={{ fontSize:10, background:"#fff1f2", color:"#dc2626", padding:"3px 8px", borderRadius:20, border:"1px solid #fecaca", fontWeight:700 }}>🔒 Upgrade</div>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ background:"linear-gradient(135deg,#f8fafc,#f1f5f9)", borderRadius:14, padding:"24px", border:"1px solid #e8edf5", marginBottom:36 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:"#0f172a", marginBottom:4 }}>📊 What's Available</h2>
          <p style={{ fontSize:14, color:"#64748b", marginBottom:16 }}>Free to browse · 3 downloads free per class</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
            {[["Total PDFs",WORKSHEETS.length],["Classes","1 – 8"],["Subjects",5],["Sets per Subject","A – E"],["Questions Each",25]].map(([l,v]) => (
              <div key={l} style={{ background:"#fff", border:"1px solid #e8edf5", borderRadius:10, padding:"12px", textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize:22, fontWeight:800, color:"#1e40af", marginBottom:3 }}>{v}</div>
                <div style={{ fontSize:11, color:"#64748b" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade banner */}
        <div style={{ background:"linear-gradient(135deg,#1e3a8a,#1e40af)", borderRadius:14, padding:"28px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:36 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:6 }}>Unlock Unlimited Downloads</div>
            <div style={{ fontSize:14, color:"rgba(255,255,255,0.75)", lineHeight:1.5 }}>₹49/month per class · ₹149/month for all 8 classes · Cancel anytime</div>
          </div>
          <button onClick={() => setShowPricing(true)}
            style={{ background:"#fbbf24", color:"#1e3a8a", border:"none", padding:"13px 24px", borderRadius:9, fontSize:14, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>
            ⭐ View Plans →
          </button>
        </div>

        {/* How it works */}
        <h2 style={{ fontSize:18, fontWeight:800, color:"#0f172a", marginBottom:6 }}>How It Works</h2>
        <p style={{ fontSize:14, color:"#64748b", marginBottom:18 }}>Start free, upgrade when you need more</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
          {[["🆓","Step 1","Start for Free","3 worksheets free per class — no sign up, no credit card"],
            ["📥","Step 2","Download & Practice","Choose any subject, pick your difficulty set, download instantly"],
            ["⭐","Step 3","Upgrade When Ready","Just ₹49/month to unlock unlimited for one class"]].map(([ic,n,t,d]) => (
            <div key={n} style={{ ...T.card, display:"flex", gap:14, cursor:"default" }}>
              <div style={{ fontSize:24, flexShrink:0 }}>{ic}</div>
              <div>
                <div style={{ fontSize:10, color:"#2563eb", fontWeight:800, marginBottom:3, letterSpacing:"0.5px" }}>{n}</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:4 }}>{t}</div>
                <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderTop:"1px solid #e8edf5", padding:"18px 20px", textAlign:"center", fontSize:12, color:"#94a3b8", background:"#fff" }}>
        © 2025 CBSE Practice Hub · Free & Premium Worksheets · Classes 1–8
      </div>
    </div>
  );

  // ── CLASS VIEW ────────────────────────────────────────────────────────────
  const ClassView = () => {
    const left = access.freeLeft(cls);
    const unlocked = access.isUnlocked(cls);
    return (
      <div style={T.page}>
        <Hdr nav={nav} active="" onPricing={() => setShowPricing(true)} />
        <div style={T.main}>
          <Bc crumbs={[{l:"Home",a:"home"},{l:`Class ${cls}`}]} onNav={nav} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, flexWrap:"wrap", gap:10 }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>Class {cls} — Choose a Subject</h2>
            <FreeBadge left={left} unlocked={unlocked} />
          </div>
          <p style={{ fontSize:14, color:"#64748b", marginBottom:24 }}>
            {unlocked ? "Unlimited access · Download all 15 worksheets per subject" : `${left} of ${FREE_DOWNLOADS_PER_CLASS} free downloads remaining for Class ${cls}`}
          </p>
          {!unlocked && left === 0 && (
            <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:10, padding:"14px 18px", marginBottom:20,
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
              <div style={{ fontSize:13, color:"#92400e", fontWeight:600 }}>🔒 You've used all free downloads for Class {cls}</div>
              <button onClick={() => setPaywall({ cls })} style={{ ...T.bp, padding:"8px 16px", fontSize:12 }}>Unlock — ₹49/month</button>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
            {SUBJECTS_BY_CLASS(cls).map(s => {
              const m = SUBJECT_META[s];
              const count = WORKSHEETS.filter(w=>w.class===cls&&w.subject===s).length;
              return (
                <div key={s} onClick={() => { setSubj(s); nav("subject"); }}
                  style={{ ...T.card, border:`1px solid ${m.border}`, background:m.bg, cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform="none"}>
                  <div style={{ fontSize:30, marginBottom:8 }}>{m.icon}</div>
                  <div style={{ fontSize:17, fontWeight:800, color:m.color, marginBottom:4 }}>{s}</div>
                  <div style={{ fontSize:12, color:`${m.color}99`, marginBottom:10 }}>{count} worksheets · Sets A–E</div>
                  <div style={{ display:"flex", gap:5 }}>
                    {DIFFICULTIES.map(d => (
                      <span key={d} style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:"rgba(255,255,255,0.65)", color:m.color, border:`1px solid ${m.border}` }}>{d}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {!unlocked && <div style={{ marginTop:24, textAlign:"center" }}>
            <button onClick={() => setPaywall({ cls })} style={{ ...T.bpG, padding:"12px 28px", fontSize:14 }}>🔓 Unlock All of Class {cls} — ₹49/month</button>
          </div>}
        </div>
      </div>
    );
  };

  // ── SUBJECT VIEW ──────────────────────────────────────────────────────────
  const SubjectView = () => {
    const m = SUBJECT_META[subj] || {};
    const left = access.freeLeft(cls);
    const unlocked = access.isUnlocked(cls);
    return (
      <div style={T.page}>
        <Hdr nav={nav} active="" onPricing={() => setShowPricing(true)} />
        <div style={T.main}>
          <Bc crumbs={[{l:"Home",a:"home"},{l:`Class ${cls}`,a:"class"},{l:subj}]} onNav={nav} />
          <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:28 }}>{m.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:2 }}>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", margin:0 }}>{subj} — Class {cls}</h2>
                <FreeBadge left={left} unlocked={unlocked} />
              </div>
              <p style={{ margin:0, fontSize:13, color:"#64748b" }}>
                {subjWS.length} worksheets · 5 sets per difficulty · {subjWS[0]?.question_count||25}Q each · Answer key on last page
              </p>
            </div>
          </div>

          <div style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:8, padding:"11px 16px", marginBottom:24, fontSize:12, color:"#1d4ed8" }}>
            💡 <strong>Tip:</strong> Download sets A→E progressively. Each set has unique questions for continuous practice.
            {!unlocked && left>0 && <strong> · {left} free download{left>1?"s":""} remaining for Class {cls}.</strong>}
          </div>

          {DIFFICULTIES.map(diff => {
            const sheets = subjWS.filter(w=>w.difficulty===diff).sort((a,b)=>a.set.localeCompare(b.set));
            if (!sheets.length) return null;
            const ds2 = DS[diff];
            return (
              <div key={diff} style={{ marginBottom:28 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <span style={{ ...T.badge(ds2), fontSize:13, padding:"4px 12px" }}>
                    {diff==="Easy"?"🟢":diff==="Medium"?"🟡":"🔴"} {diff} Level
                  </span>
                  <div style={{ flex:1, height:"1px", background:"#e8edf5" }}/>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>{sheets.length} sets</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:12 }}>
                  {sheets.map(ws => (
                    <WsCard key={ws.set} ws={ws} access={access}
                      onDownload={handleDownload}
                      onUpgradePrompt={() => setPaywall({ cls })} />
                  ))}
                </div>
              </div>
            );
          })}

          {!unlocked && (
            <div style={{ background:"linear-gradient(135deg,#f0fdf4,#dcfce7)", border:"1px solid #86efac", borderRadius:14, padding:"24px", textAlign:"center", marginTop:28 }}>
              <div style={{ fontSize:18, fontWeight:800, color:"#15803d", marginBottom:6 }}>Want unlimited {subj} worksheets?</div>
              <div style={{ fontSize:14, color:"#166534", marginBottom:16 }}>Unlock all 15 worksheets for Class {cls} for just ₹49/month</div>
              <button onClick={() => setPaywall({ cls })} style={{ ...T.bpG, padding:"12px 28px", fontSize:14 }}>🔓 Unlock Class {cls}</button>
            </div>
          )}

          <div style={{ marginTop:24, borderTop:"1px solid #e8edf5", paddingTop:18 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:10 }}>Other subjects in Class {cls}</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {SUBJECTS_BY_CLASS(cls).filter(s=>s!==subj).map(s=>(
                <button key={s} onClick={()=>setSubj(s)}
                  style={{ padding:"7px 14px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", fontSize:13, cursor:"pointer", color:"#0f172a", fontFamily:"inherit" }}>
                  {SUBJECT_META[s]?.icon} {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── SEARCH VIEW ───────────────────────────────────────────────────────────
  const SearchView = () => (
    <div style={T.page}>
      <Hdr nav={nav} active="search" onPricing={() => setShowPricing(true)} />
      <div style={T.main}>
        <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", marginBottom:6 }}>🔍 Search Worksheets</h2>
        <p style={{ fontSize:14, color:"#64748b", marginBottom:20 }}>Find any worksheet — 3 free per class, upgrade for more</p>
        <div style={{ ...T.card, marginBottom:20, cursor:"default" }}>
          <div style={{ position:"relative", marginBottom:12 }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:"#94a3b8" }}>🔍</span>
            <input style={{ ...T.inp, paddingLeft:36, fontSize:14 }} placeholder="Subject, class, difficulty…" value={q} onChange={e=>setQ(e.target.value)} autoFocus/>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <select style={T.sel} value={fCls}  onChange={e=>setFCls(e.target.value)}>
              <option value="">All Classes</option>
              {[1,2,3,4,5,6,7,8].map(c=><option key={c} value={c}>Class {c}</option>)}
            </select>
            <select style={T.sel} value={fSub}  onChange={e=>setFSub(e.target.value)}>
              <option value="">All Subjects</option>
              {Object.keys(SUBJECT_META).map(s=><option key={s}>{s}</option>)}
            </select>
            <select style={T.sel} value={fDiff} onChange={e=>setFDiff(e.target.value)}>
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map(d=><option key={d}>{d}</option>)}
            </select>
            <button onClick={()=>{setQ("");setFCls("");setFSub("");setFDiff("");}} style={T.bs}>Clear</button>
          </div>
        </div>
        <div style={{ fontSize:13, color:"#64748b", marginBottom:14 }}>
          Showing <strong>{Math.min(searchWS.length,60)}</strong> of {searchWS.length} worksheets
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {searchWS.slice(0,60).map((ws,i) => {
            const left = access.freeLeft(ws.class);
            const unlocked = access.isUnlocked(ws.class);
            const canDl = unlocked || left > 0;
            const ds2 = DS[ws.difficulty];
            return (
              <div key={i} style={{ ...T.card, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", cursor:"default",
                opacity:canDl?1:0.9, transition:"border-color 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#bfdbfe"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#e8edf5"}>
                <div style={{ width:34, height:34, borderRadius:7, background:`${CC[ws.class-1]}15`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:CC[ws.class-1], flexShrink:0 }}>
                  {ws.class}
                </div>
                <div style={{ width:28, height:28, borderRadius:6, background:ds2.bg, border:`1px solid ${ds2.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:ds2.color, flexShrink:0 }}>
                  {ws.set}
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", marginBottom:3 }}>{ws.title}</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
                    <span style={{ fontSize:11, color:"#64748b" }}>{ws.subject}</span>
                    <span style={{ color:"#cbd5e1" }}>·</span>
                    <span style={T.badge(ds2)}>{ws.difficulty}</span>
                    <span style={{ fontSize:10, color:"#94a3b8" }}>{ws.question_count}Q</span>
                    {!unlocked && <FreeBadge left={left} unlocked={false}/>}
                    {unlocked && <span style={{ fontSize:10, color:"#15803d" }}>⭐ Unlocked</span>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                  <button onClick={()=>{setCls(ws.class);setSubj(ws.subject);nav("subject");}}
                    style={{ ...T.bs, padding:"7px 12px", fontSize:12 }}>View All</button>
                  {canDl
                    ? <button onClick={()=>handleDownload(ws)} style={{ ...T.bp, padding:"7px 14px", fontSize:12 }}>📥 Download</button>
                    : <button onClick={()=>setPaywall({cls:ws.class})} style={{ ...T.bp, padding:"7px 14px", fontSize:12, background:"linear-gradient(135deg,#059669,#047857)" }}>🔒 Unlock</button>
                  }
                </div>
              </div>
            );
          })}
          {searchWS.length===0&&(
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:28, marginBottom:10 }}>🔍</div>
              <div style={{ fontSize:14, color:"#64748b" }}>No worksheets found. Try different filters.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── EBOOKS ────────────────────────────────────────────────────────────────
  const EbooksView = () => (
    <div style={T.page}>
      <Hdr nav={nav} active="ebooks" onPricing={() => setShowPricing(true)} />
      <div style={T.main}>
        <h2 style={{ fontSize:20, fontWeight:800, color:"#0f172a", marginBottom:6 }}>📗 NCERT Ebooks & Textbooks</h2>
        <p style={{ fontSize:14, color:"#64748b", marginBottom:24 }}>Official NCERT digital textbooks for all classes — free from the government portal</p>
        <div style={{ background:"linear-gradient(135deg,#1e3a8a,#2563eb)", borderRadius:14, padding:"32px 28px", marginBottom:28, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-10, right:-10, fontSize:100, opacity:0.06 }}>📗</div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:20, padding:"4px 12px", fontSize:11, color:"rgba(255,255,255,0.9)", marginBottom:14 }}>🏛️ Official Government of India Resource</div>
          <h3 style={{ fontSize:22, fontWeight:800, color:"#fff", margin:"0 0 10px" }}>NCERT Textbook Portal</h3>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.75)", margin:"0 0 20px", maxWidth:480, lineHeight:1.6 }}>Download NCERT textbooks in PDF — Classes 1–12, English/Hindi/Urdu. Completely free, updated annually.</p>
          <button onClick={()=>window.open("https://ncert.nic.in/textbook.php","_blank","noopener,noreferrer")}
            style={{ background:"#fbbf24", color:"#1e3a8a", border:"none", padding:"12px 24px", borderRadius:8, fontSize:14, fontWeight:800, cursor:"pointer" }}>
            📗 Open NCERT Textbooks ↗
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14, marginBottom:28 }}>
          {NCERT_STAGES.map(s=>(
            <div key={s.cls} style={{ ...T.card, cursor:"default" }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#2563eb", letterSpacing:"0.3px", marginBottom:3 }}>CLASS {s.cls}</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:6 }}>{s.label}</div>
              <p style={{ fontSize:12, color:"#64748b", margin:"0 0 12px", lineHeight:1.5 }}>{s.desc}</p>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {s.subjects.map(sub=>(
                  <span key={sub} style={{ fontSize:10, padding:"2px 7px", borderRadius:10, background:"#f1f5f9", color:"#64748b", border:"1px solid #e2e8f0" }}>{sub}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:"#fef9c3", border:"1px solid #fde047", borderRadius:8, padding:"12px 16px", fontSize:12, color:"#713f12", lineHeight:1.6 }}>
          <strong>Note:</strong> NCERT textbooks are also on the DIKSHA app — GoI's official digital learning platform. CBSE Practice Hub worksheets are complementary practice material.
        </div>
      </div>
    </div>
  );

  // Render current view
  const renderView = () => {
    switch(view) {
      case "class":   return <ClassView/>;
      case "subject": return <SubjectView/>;
      case "search":  return <SearchView/>;
      case "ebooks":  return <EbooksView/>;
      default:        return <HomeView/>;
    }
  };

  return (
    <>
      {renderView()}

      {/* Global modals */}
      {paywall && (
        <PaywallModal
          cls={paywall.cls}
          onSubscribe={handlePaywallSubscribe}
          onClose={() => setPaywall(null)}
        />
      )}
      {payment && (
        <PaymentModal
          {...payment}
          onSuccess={handlePaySuccess}
          onClose={() => setPayment(null)}
        />
      )}
      {success && (
        <SuccessModal
          {...success}
          onClose={() => setSuccess(null)}
        />
      )}
      {toast && <Toast msg={toast.m} type={toast.t} onClose={() => setToast(null)} />}
    </>
  );
}
