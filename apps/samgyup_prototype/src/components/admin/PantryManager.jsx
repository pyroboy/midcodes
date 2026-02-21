import { useState } from "react";
import { PANTRY_CATALOG } from "../../adminConstants.js";
import { fc, ft } from "../../helpers.js";
import { SectionHeader } from "./SectionHeader.jsx";

export function PantryManager({ pantryStock, onAdjust }) {
  const [inputId, setInputId] = useState(null);
  const [amount,  setAmount]  = useState("");
  const [mode,    setMode]    = useState("add");
  const [note,    setNote]    = useState("");

  const categories = [...new Set(PANTRY_CATALOG.map(p=>p.category))];

  const commit = (pid) => {
    const parsed = parseFloat(amount) || 0;
    if (!parsed && mode !== "set") return;
    const cur = pantryStock[pid]?.current ?? 0;
    const delta = mode==="add" ? parsed : mode==="deduct" ? -parsed : parsed - cur;
    onAdjust(pid, delta, note || mode);
    setAmount(""); setNote(""); setInputId(null);
  };

  return (
    <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }} className="scr fi">
      <SectionHeader label="📦 Pantry & Supplies" sub="Kitchen ingredients, sauces, and operational supplies"/>

      {categories.map(cat => (
        <div key={cat} style={{ marginBottom:20 }}>
          <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase",
            marginBottom:8, paddingBottom:4, borderBottom:"1px solid var(--border)" }}>
            {cat}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:8 }}>
            {PANTRY_CATALOG.filter(p=>p.category===cat).map(item => {
              const cur = pantryStock[item.id]?.current ?? 0;
              const pct = Math.min(100, Math.round((cur / item.par) * 100));
              const out = cur === 0;
              const low = !out && pct < 30;
              const clr = out ? "#dc2626" : low ? "#ca8a04" : "#16a34a";
              const editing = inputId === item.id;
              const history = pantryStock[item.id]?.history ?? [];

              return (
                <div key={item.id} style={{
                  background:"var(--card)", border:`1px solid ${editing?clr+"66":"var(--border2)"}`,
                  borderRadius:10, overflow:"hidden",
                }}>
                  <div style={{
                    padding:"10px 12px", cursor:"pointer",
                    display:"flex", alignItems:"center", gap:10,
                  }} onClick={() => setInputId(editing ? null : item.id)}>
                    <span style={{ fontSize:22 }}>{item.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:500, display:"flex", alignItems:"center", gap:6 }}>
                        {item.name}
                        {out && <span style={{ fontSize:8, background:"#450a0a", color:"#f87171", padding:"1px 5px", borderRadius:4, fontWeight:700 }}>OUT</span>}
                        {low && !out && <span style={{ fontSize:8, background:"#451a03", color:"#fbbf24", padding:"1px 5px", borderRadius:4, fontWeight:700 }}>LOW</span>}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                        <div style={{ flex:1, height:3, background:"var(--card2)", borderRadius:2, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:out?"#7f1d1d":low?"#92400e":"#166534", borderRadius:2 }}/>
                        </div>
                        <span className="mono" style={{ fontSize:10, color:clr, fontWeight:700, flexShrink:0 }}>
                          {cur} {item.unit}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>par: {item.par}</div>
                      <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>{fc(item.cost)}/{item.unit}</div>
                    </div>
                  </div>

                  {/* Inline input */}
                  {editing && (
                    <div style={{ padding:"0 12px 10px", borderTop:"1px solid var(--border)" }}>
                      <div style={{ display:"flex", gap:4, marginTop:8, marginBottom:6 }}>
                        {[["add","+ Add","#16a34a"],["deduct","− Deduct","#dc2626"],["set","= Set","#ca8a04"]].map(([m,l,c])=>(
                          <button key={m} className="btn" onClick={()=>setMode(m)} style={{
                            flex:1, padding:"4px", borderRadius:6, fontSize:9,
                            background:mode===m?c+"22":"var(--card2)",
                            color:mode===m?c:"var(--muted)",
                            border:`1px solid ${mode===m?c+"44":"var(--border)"}`, fontWeight:700,
                          }}>{l}</button>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                          placeholder={`${item.unit}...`} autoFocus
                          style={{ flex:1, background:"var(--card2)", border:"1px solid var(--border2)",
                            borderRadius:6, padding:"6px 8px", fontSize:13, color:"#fff", outline:"none",
                            fontFamily:"'DM Mono',monospace" }}/>
                        <button className="btn" onClick={()=>commit(item.id)} style={{
                          background:parseFloat(amount)>0?"#166534":"var(--card2)",
                          color:"#fff", padding:"6px 14px", borderRadius:6, fontSize:11,
                          opacity:parseFloat(amount)>0?1:0.4
                        }}>✓</button>
                      </div>
                      {history.length > 0 && (
                        <div style={{ marginTop:6, paddingTop:6, borderTop:"1px solid #191919" }}>
                          {history.slice(0,3).map((h,i) => (
                            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"var(--muted)", padding:"2px 0" }}>
                              <span style={{ color:h.delta>0?"#4ade80":"#f87171" }}>{h.delta>0?"+":""}{h.delta} {item.unit}</span>
                              <span>{h.note||"—"}</span>
                              <span className="mono">{ft(h.time)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
