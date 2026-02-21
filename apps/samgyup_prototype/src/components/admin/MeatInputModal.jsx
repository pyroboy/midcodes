import { useState } from "react";
import { MEAT_CATALOG } from "../../adminConstants.js";
import { fc, ft } from "../../helpers.js";

export function MeatInputModal({ meatId, variantId, meatStock, onAdjust, onClose }) {
  const meat      = MEAT_CATALOG.find(m => m.id === meatId);
  const [selVar,  setSelVar]  = useState(variantId || meat?.variants[0]?.id);
  const [amount,  setAmount]  = useState("");
  const [mode,    setMode]    = useState("add");
  const [note,    setNote]    = useState("");
  const [imgErr,  setImgErr]  = useState(false);

  if (!meat) return null;
  const variant   = meat.variants.find(v => v.id === selVar);
  const cur       = meatStock[selVar]?.current ?? 0;
  const history   = meatStock[selVar]?.history ?? [];
  const parsed    = parseFloat(amount) || 0;
  const previewVal = mode === "add" ? cur + parsed : mode === "deduct" ? Math.max(0, cur - parsed) : parsed;

  const commit = () => {
    if (!parsed && mode !== "set") return;
    const delta = mode === "add" ? parsed : mode === "deduct" ? -parsed : parsed - cur;
    onAdjust(selVar, delta, note || mode);
    setAmount(""); setNote("");
  };

  const PRESETS = variant?.unit === "g"
    ? [100, 200, 250, 300, 500, 1000]
    : [1, 2, 5, 10];

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.88)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:16,
    }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="pop" style={{
        background:"var(--panel)", border:"1px solid var(--border2)",
        borderRadius:20, width:"100%", maxWidth:560, overflow:"hidden",
        boxShadow:"0 40px 80px rgba(0,0,0,.7)",
      }}>

        {/* ── HERO IMAGE ── */}
        <div style={{ position:"relative", height:200, background:"#111", overflow:"hidden" }}>
          {!imgErr ? (
            <img src={meat.image} alt={meat.name}
              onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(.65) saturate(1.3)" }}/>
          ) : (
            <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#1a1005,#0a0a0a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:72 }}>
              {meat.emoji}
            </div>
          )}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,rgba(0,0,0,.05) 0%,rgba(0,0,0,.8) 100%)" }}/>
          <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"14px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
              <div>
                <div className="hd" style={{ fontSize:26, color:"#fff", lineHeight:1 }}>{meat.name}</div>
                <div className="mono" style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:2 }}>{meat.name_ko} · {fc(meat.cost_per_kg)}/kg</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:4, maxWidth:320 }}>{meat.description}</div>
              </div>
              <button onClick={onClose} style={{
                background:"rgba(0,0,0,.5)", border:"1px solid rgba(255,255,255,.15)",
                borderRadius:20, padding:"4px 10px", color:"rgba(255,255,255,.6)",
                fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
              }}>✕ Close</button>
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>

          {/* LEFT: Variant selector + input */}
          <div style={{ padding:"16px 18px", borderRight:"1px solid var(--border)" }}>

            {/* Variant tabs */}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Select Cut / Pool</div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {meat.variants.map(v => {
                  const c = meatStock[v.id]?.current ?? 0;
                  const active = selVar === v.id;
                  return (
                    <button key={v.id} onClick={() => { setSelVar(v.id); setAmount(""); }} style={{
                      display:"flex", alignItems:"center", gap:8,
                      padding:"8px 10px", borderRadius:9,
                      background: active ? v.color + "20" : "var(--card2)",
                      border:`1px solid ${active ? v.color + "66" : "var(--border)"}`,
                      cursor:"pointer", textAlign:"left", transition:"all .12s",
                      fontFamily:"'DM Sans',sans-serif",
                    }}>
                      <span style={{ fontSize:16 }}>{v.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:500, color: active ? v.color : "var(--text)" }}>{v.label}</div>
                        <div style={{ fontSize:9, color:"var(--muted)" }}>{v.sub}</div>
                      </div>
                      <div className="mono" style={{ fontSize:12, color: c===0 ? "#374151" : v.color }}>{c}g</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode picker */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Action</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5 }}>
                {[["add","➕ Add","#16a34a","#052e16"],["deduct","➖ Deduct","#dc2626","#450a0a"],["set","📌 Set","#ca8a04","#451a03"]].map(([m,l,c,bg])=>(
                  <button key={m} onClick={()=>setMode(m)} style={{
                    padding:"7px 4px", borderRadius:8, fontSize:11,
                    background: mode===m ? bg : "var(--card2)",
                    color: mode===m ? c : "var(--muted)",
                    border:`1px solid ${mode===m?c+"44":"var(--border)"}`,
                    cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:700,
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Amount presets */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Quick Presets (g)</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {PRESETS.map(p => (
                  <button key={p} onClick={() => setAmount(String(p))} style={{
                    padding:"5px 10px", borderRadius:7,
                    background: amount===String(p) ? "var(--ember)" : "var(--card2)",
                    color: amount===String(p) ? "#fff" : "var(--text2)",
                    border:`1px solid ${amount===String(p)?"var(--ember)":"var(--border)"}`,
                    fontSize:12, cursor:"pointer", fontFamily:"'DM Mono',monospace",
                  }}>{p}{variant?.unit}</button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
              placeholder={`Enter ${variant?.unit || "g"}...`}
              style={{
                width:"100%", background:"var(--card2)",
                border:"1px solid var(--border2)", borderRadius:9,
                padding:"11px 14px", fontSize:22, color:"#fff", outline:"none",
                fontFamily:"'DM Mono',monospace", textAlign:"center",
                marginBottom:8,
              }}/>

            {/* Note */}
            <input value={note} onChange={e=>setNote(e.target.value)}
              placeholder="Note (optional)..."
              style={{
                width:"100%", background:"var(--card2)",
                border:"1px solid var(--border)", borderRadius:8,
                padding:"8px 12px", fontSize:12, color:"var(--text)",
                outline:"none", marginBottom:12,
              }}/>

            {/* Preview + confirm */}
            {parsed > 0 && (
              <div style={{ background:"var(--card2)", border:"1px solid var(--border2)", borderRadius:9, padding:"8px 12px", marginBottom:10, fontSize:11 }}>
                <div style={{ display:"flex", justifyContent:"space-between", color:"var(--muted)" }}>
                  <span>Current</span><span className="mono">{cur}g</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
                  <span style={{ color: mode==="add"?"#4ade80":mode==="deduct"?"#f87171":"#fbbf24" }}>
                    {mode==="add"?"+":mode==="deduct"?"-":"="} {parsed}g
                  </span>
                  <span className="mono" style={{ color:"#fff", fontWeight:700 }}>→ {previewVal}g</span>
                </div>
              </div>
            )}

            <button onClick={commit} disabled={!parsed && mode !== "set"} style={{
              width:"100%",
              background: !parsed && mode!=="set" ? "var(--card2)" : mode==="add"?"#166534":mode==="deduct"?"#7f1d1d":"#92400e",
              color:"#fff", padding:"12px", borderRadius:10,
              fontSize:14, fontFamily:"'Syne',sans-serif", fontWeight:700,
              letterSpacing:.5, cursor:!parsed&&mode!=="set"?"not-allowed":"pointer",
              opacity:!parsed&&mode!=="set"?0.4:1, border:"none",
            }}>
              {mode==="add"?"➕ ADD STOCK":mode==="deduct"?"➖ DEDUCT":"📌 SET VALUE"}
            </button>
          </div>

          {/* RIGHT: History */}
          <div style={{ padding:"16px 16px", display:"flex", flexDirection:"column" }}>
            <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>
              Transaction History — {variant?.label}
            </div>
            <div style={{ flex:1, overflow:"auto", maxHeight:400 }} className="scr">
              {history.length === 0 ? (
                <div style={{ textAlign:"center", color:"var(--muted2)", padding:"30px 0", fontSize:12 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
                  No entries yet.
                </div>
              ) : (
                history.map((h, i) => (
                  <div key={i} style={{
                    padding:"8px 10px", borderRadius:8, marginBottom:5,
                    background:"var(--card2)", border:"1px solid var(--border)",
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{
                        fontSize:12, fontWeight:600,
                        color: h.delta > 0 ? "#4ade80" : "#f87171",
                      }}>
                        {h.delta > 0 ? "+" : ""}{h.delta}g
                      </span>
                      <span className="mono" style={{ fontSize:10, color:"var(--muted)" }}>{ft(h.time)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--muted)", marginTop:3 }}>
                      <span>{h.note || "—"}</span>
                      <span className="mono">{h.before}→<span style={{ color:"var(--text)" }}>{h.after}g</span></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary stats */}
            <div style={{ paddingTop:12, borderTop:"1px solid var(--border)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {[
                ["Current", `${cur}g`, cur===0?"#dc2626":variant?.color||"#fff"],
                ["Added today", `${history.filter(h=>h.delta>0).reduce((s,h)=>s+h.delta,0)}g`, "#4ade80"],
                ["Used today",  `${Math.abs(history.filter(h=>h.delta<0).reduce((s,h)=>s+h.delta,0))}g`, "#f87171"],
                ["Log entries", history.length, "var(--muted)"],
              ].map(([l,v,c]) => (
                <div key={l} style={{ background:"var(--card2)", borderRadius:7, padding:"7px 9px" }}>
                  <div style={{ fontSize:9, color:"var(--muted)" }}>{l}</div>
                  <div className="mono" style={{ fontSize:14, color:c, marginTop:2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
