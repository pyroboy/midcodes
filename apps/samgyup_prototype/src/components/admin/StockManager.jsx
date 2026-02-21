import { useState } from "react";
import { MEAT_CATALOG, SIDES_CATALOG, PANTRY_CATALOG } from "../../adminConstants.js";
import { fc, ft } from "../../helpers.js";
import { SectionHeader } from "./SectionHeader.jsx";
import { PantryInputModal } from "./PantryInputModal.jsx";

export function StockManager({
  meatStock, sideStock, pantryStock, auditLog,
  onMeatInputModal, onSideInputModal, onPantryAdjust,
  showAudit, onToggleAudit,
}) {
  const [subTab, setSubTab] = useState("meats");
  const [pantryModal, setPantryModal] = useState(null);

  const today = new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});

  const pantryCategories = [...new Set(PANTRY_CATALOG.map(p=>p.category))];

  const handlePantryAdjust = (pid, delta, note, image) => {
    onPantryAdjust(pid, delta, note, image);
    setPantryModal(null);
  };

  /* stats */
  const totalServableG = MEAT_CATALOG.reduce((sum, m) => {
    const sv = m.variants.find(v => v.pool === "service");
    return sum + (sv ? (meatStock[sv.id]?.current ?? 0) : 0);
  }, 0);
  const lowSides = SIDES_CATALOG.filter(s => {
    const cur = sideStock[s.id]?.current ?? 0;
    return cur < s.par * 0.3;
  }).length;
  const lowPantry = PANTRY_CATALOG.filter(p => {
    const cur = pantryStock[p.id]?.current ?? 0;
    return cur < p.par * 0.3;
  }).length;

  const SUB_TABS = [
    { k:"meats",  icon:"🥩", label:"Meats",   badge:null },
    { k:"sides",  icon:"🥬", label:"Sides",   badge:lowSides > 0 ? lowSides : null },
    { k:"pantry", icon:"📦", label:"Pantry",  badge:lowPantry > 0 ? lowPantry : null },
  ];

  return (
    <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }} className="scr fi">

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <SectionHeader label="📦 Stock Management" sub="Meat, sides, and pantry inventory"/>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span className="mono" style={{ fontSize:10, color:"var(--muted)" }}>{today}</span>
            <button className="btn" onClick={onToggleAudit} style={{
              background:showAudit?"var(--ember)":"var(--card)",
              border:`1px solid ${showAudit?"var(--ember)":"var(--border)"}`,
              color:showAudit?"#fff":"var(--muted)",
              padding:"5px 12px", borderRadius:8, fontSize:10, letterSpacing:.5,
            }}>🕐 Audit Log {showAudit ? "◂" : "▸"}</button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:14 }}>
          {SUB_TABS.map(({ k, icon, label, badge }) => (
            <button key={k} className="btn" onClick={() => setSubTab(k)} style={{
              padding:"7px 16px", borderRadius:8, fontSize:12,
              background: subTab===k ? "var(--ember)" : "var(--card)",
              color: subTab===k ? "#fff" : "var(--muted)",
              border:`1px solid ${subTab===k?"var(--ember)":"var(--border)"}`,
              position:"relative",
            }}>
              {icon} {label}
              {badge && (
                <span style={{
                  position:"absolute", top:-4, right:-4,
                  background:"#dc2626", color:"#fff", fontSize:8,
                  width:16, height:16, borderRadius:"50%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:700,
                }}>{badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Quick stat bar */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {[
            { label:"Servable Meat", value:`${(totalServableG/1000).toFixed(1)}kg`, color:"#16a34a" },
            { label:"Low Sides",     value:lowSides,   color:lowSides>0?"#ca8a04":"#16a34a" },
            { label:"Low Pantry",    value:lowPantry,   color:lowPantry>0?"#dc2626":"#16a34a" },
          ].map(s => (
            <div key={s.label} style={{
              background:s.color+"1a", border:`1px solid ${s.color}33`,
              borderRadius:20, padding:"3px 12px", fontSize:10,
              color:s.color, fontFamily:"'Syne',sans-serif", fontWeight:700,
            }}>{s.value} {s.label}</div>
          ))}
        </div>

        {/* ═══ MEATS SUB-TAB ═══ */}
        {subTab==="meats"&&(
          <>
            <div style={{ fontSize:9, color:"var(--muted)", textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>
              🥩 Meat Inventory · All weights in grams
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
              {MEAT_CATALOG.map(meat => {
                const sv = meat.variants.find(v=>v.pool==="service");
                const servG = sv ? (meatStock[sv.id]?.current ?? 0) : 0;
                const parG  = meat.par_kg * 1000;
                const pct   = Math.min(100, Math.round((servG / parG) * 100));
                const out   = servG === 0;
                const low   = !out && pct < 30;
                const tag   = out ? { label:"OUT", bg:"#450a0a", color:"#f87171" }
                  : low ? { label:"LOW", bg:"#451a03", color:"#fbbf24" }
                  : { label:"OK", bg:"#052e16", color:"#4ade80" };

                return (
                  <div key={meat.id} style={{
                    background:"var(--card)", border:"1px solid var(--border2)",
                    borderRadius:14, overflow:"hidden",
                  }} className="card-hover">
                    {/* Hero image */}
                    <div style={{ position:"relative", height:90, overflow:"hidden" }}>
                      <img src={meat.image} alt={meat.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      <div className="img-overlay"/>
                      <span style={{
                        position:"absolute", top:8, right:8,
                        background:tag.bg, color:tag.color, padding:"2px 8px",
                        borderRadius:6, fontSize:9, fontWeight:700,
                        fontFamily:"'Syne',sans-serif", letterSpacing:.5,
                      }}>✓ {tag.label}</span>
                    </div>
                    {/* Info */}
                    <div style={{ padding:"10px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div>
                          <div className="hd" style={{ fontSize:14 }}>{meat.name}</div>
                          <div className="mono" style={{ fontSize:10, color:"var(--muted)" }}>{meat.name_ko}</div>
                        </div>
                        <div className="hd mono" style={{ fontSize:20, color:tag.color }}>{servG}<span style={{fontSize:10,color:"var(--muted)"}}>g</span></div>
                      </div>
                      <div style={{ marginTop:6, fontSize:9, color:"var(--muted)" }}>
                        Servable / Par Level
                        <span style={{ float:"right" }}>{servG}g / {parG}g</span>
                      </div>
                      <div style={{ height:4, background:"var(--card2)", borderRadius:2, marginTop:3, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:out?"#7f1d1d":low?"#92400e":"#166534", borderRadius:2, transition:"width .3s" }}/>
                      </div>
                      {/* Variants */}
                      <div style={{ marginTop:10 }}>
                        {meat.variants.map(v => {
                          const cur = meatStock[v.id]?.current ?? 0;
                          return (
                            <div key={v.id}
                              onClick={()=>onMeatInputModal(meat.id, v.id)}
                              style={{
                                display:"flex", alignItems:"center", gap:8,
                                padding:"5px 6px", borderBottom:"1px solid #191919",
                                cursor:"pointer", borderRadius:4,
                              }}
                              onMouseEnter={e=>e.currentTarget.style.background="var(--card2)"}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <span style={{ fontSize:14 }}>{v.icon}</span>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:11, fontWeight:500 }}>{v.label}</div>
                                <div style={{ fontSize:9, color:"var(--muted)" }}>{v.sub}</div>
                              </div>
                              <span className="mono" style={{ fontSize:12, color:v.color, fontWeight:700 }}>
                                {cur}<span style={{fontSize:8,color:"var(--muted)"}}>g</span>
                              </span>
                              <span style={{ fontSize:9, color:"var(--muted)" }}>•</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop:8, display:"flex", justifyContent:"space-between", fontSize:9, color:"var(--muted)", borderTop:"1px solid #191919", paddingTop:6 }}>
                        <span>Cost: {fc(meat.cost_per_kg)}/kg</span>
                        <span>Servable value: <span style={{ color:"#16a34a" }}>{fc((servG/1000)*meat.cost_per_kg)}</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ SIDES SUB-TAB ═══ */}
        {subTab==="sides"&&(
          <>
            <div style={{ fontSize:9, color:"var(--muted)", textTransform:"uppercase", letterSpacing:2, marginBottom:8 }}>
              🥬 Sides & Accompaniments · Tap a card to restock or deduct
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
              {SIDES_CATALOG.map(side => {
                const cur = sideStock[side.id]?.current ?? 0;
                const pct = Math.min(100, Math.round((cur/side.par)*100));
                const out = cur === 0; const low = !out && pct < 30;
                const clr = out ? "#dc2626" : low ? "#ca8a04" : "#16a34a";
                return (
                  <div key={side.id}
                    onClick={() => onSideInputModal(side.id)}
                    style={{
                      background:"var(--card)", border:`1px solid var(--border2)`,
                      borderRadius:12, overflow:"hidden", cursor:"pointer",
                    }} className="card-hover">
                    <div style={{ position:"relative", height:80, overflow:"hidden" }}>
                      <img src={side.image} alt={side.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      <div className="img-overlay"/>
                      <span style={{ position:"absolute", bottom:4, left:6, fontSize:18 }}>{side.icon}</span>
                    </div>
                    <div style={{ padding:"6px 10px" }}>
                      <div style={{ fontSize:11, fontWeight:500 }}>{side.name}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                        <div style={{ flex:1, height:3, background:"var(--card2)", borderRadius:2, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:out?"#7f1d1d":low?"#92400e":"#166534", borderRadius:2 }}/>
                        </div>
                        <span className="mono" style={{ fontSize:10, color:clr, fontWeight:700 }}>{cur}</span>
                      </div>
                      <div style={{ fontSize:9, color:"var(--muted)", marginTop:2 }}>Par: {side.par}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ PANTRY SUB-TAB ═══ */}
        {subTab==="pantry"&&(
          <>
            {pantryCategories.map(cat => (
              <div key={cat} style={{ marginBottom:20 }}>
                <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase",
                  marginBottom:8, paddingBottom:4, borderBottom:"1px solid var(--border)" }}>
                  {cat}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:8 }}>
                  {PANTRY_CATALOG.filter(p=>p.category===cat).map(item => {
                    const cur = pantryStock[item.id]?.current ?? 0;
                    const pct = Math.min(100, Math.round((cur / item.par) * 100));
                    const out = cur === 0; const low = !out && pct < 30;
                    const clr = out ? "#dc2626" : low ? "#ca8a04" : "#16a34a";

                    return (
                      <div key={item.id} style={{
                        background:"var(--card)", border:"1px solid var(--border2)",
                        borderRadius:10, overflow:"hidden",
                      }}>
                        <div style={{
                          padding:"10px 12px", cursor:"pointer",
                          display:"flex", alignItems:"center", gap:10,
                        }} onClick={() => setPantryModal(item.id)} className="card-hover">
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
                              <span className="mono" style={{ fontSize:10, color:clr, fontWeight:700, flexShrink:0 }}>{cur} {item.unit}</span>
                            </div>
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>par: {item.par}</div>
                            <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>{fc(item.cost)}/{item.unit}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ═══ AUDIT SIDEBAR ═══ */}
      {showAudit && (
        <div style={{
          width:280, background:"var(--panel)", borderLeft:"1px solid var(--border)",
          display:"flex", flexDirection:"column", overflow:"hidden", flexShrink:0,
        }} className="fi">
          {/* Audit header */}
          <div style={{
            padding:"12px 14px", borderBottom:"1px solid var(--border)",
            display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
          }}>
            <div>
              <div className="hd" style={{ fontSize:14 }}>🕐 Audit Log</div>
              <div style={{ fontSize:9, color:"var(--muted)", marginTop:1 }}>{auditLog.length} entries</div>
            </div>
            <button className="btn" onClick={onToggleAudit} style={{
              background:"none", color:"var(--muted)", fontSize:14,
            }}>✕</button>
          </div>

          {/* Audit entries */}
          <div style={{ flex:1, overflow:"auto", padding:"8px 10px" }} className="scr">
            {auditLog.length === 0 && (
              <div style={{ textAlign:"center", color:"var(--muted)", padding:"30px 0", fontSize:11 }}>
                No stock changes yet
              </div>
            )}
            {(() => {
              const grouped = [];
              for (const e of auditLog) {
                if (e.groupId) {
                  let existingGroup = grouped.find(g => g.isGroup && g.id === e.groupId);
                  if (existingGroup) {
                    existingGroup.entries.push(e);
                  } else {
                    grouped.push({
                      id: e.groupId, isGroup: true, entries: [e],
                      time: e.time, title: e.note || "Grouped Order"
                    });
                  }
                } else {
                  grouped.push({ isGroup: false, entry: e });
                }
              }

              const renderEntry = (entry, i, inGroup = false) => {
                const isAdd = entry.delta > 0;
                return (
                  <div key={i} style={{
                    padding: inGroup ? "6px 8px" : "8px 10px",
                    marginBottom: inGroup ? 2 : 4,
                    borderRadius: 8,
                    background: inGroup ? "transparent" : (isAdd ? "#052e1622" : "#450a0a22"),
                    border: inGroup ? "none" : `1px solid ${isAdd?"#16a34a22":"#dc262622"}`,
                    borderLeft: inGroup ? `2px solid ${isAdd?"#4ade80":"#f87171"}` : undefined,
                  }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:11, fontWeight:500 }}>{entry.itemName}</span>
                      <span className="mono" style={{
                        fontSize:12, fontWeight:700,
                        color: isAdd ? "#4ade80" : "#f87171",
                      }}>{isAdd?"+":""}{entry.delta} {entry.unit||""}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:3, fontSize:9, color:"var(--muted)" }}>
                      {!inGroup && (
                        <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{
                            width:5, height:5, borderRadius:"50%",
                            background: entry.userRole === "manager" ? "#7c3aed" : "#1d4ed8",
                          }}/>
                          {entry.userName}
                        </span>
                      )}
                      <span>{entry.category}</span>
                    </div>
                    <div style={{ fontSize:9, color:"var(--muted2)", marginTop:2 }}>
                      {!inGroup && ft(entry.time)}
                      {entry.note && !inGroup && <span> · {entry.note}</span>}
                    </div>
                    {entry.image && (
                      <div style={{ marginTop:6 }}>
                        <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:"var(--card)", padding:"4px 6px", borderRadius:6, border:"1px solid var(--border)", fontSize:9, color:"#60a5fa", cursor:"pointer" }} onClick={(e)=>{const img=e.currentTarget.nextElementSibling; img.style.display=img.style.display==='none'?'block':'none'}}>
                          📷 View Attachment
                        </div>
                        <img src={entry.image} alt="attached" style={{ display:"none", width:"100%", marginTop:4, borderRadius:6, border:"1px solid var(--border)" }} />
                      </div>
                    )}
                  </div>
                );
              };

              return grouped.map((g, idx) => {
                if (!g.isGroup) return renderEntry(g.entry, idx);
                return (
                  <div key={idx} style={{
                    marginBottom:4, borderRadius:8,
                    background: "var(--card)", border: "1px solid var(--border)",
                    overflow: "hidden"
                  }}>
                    <div style={{ padding:"8px 10px", borderBottom:"1px solid var(--border2)", background:"var(--card2)" }}>
                      <div style={{ fontSize:10, fontWeight:600, color:"#fff" }}>{g.title}</div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:2, fontSize:9, color:"var(--muted)" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ width:5, height:5, borderRadius:"50%", background: g.entries[0]?.userRole === "manager" ? "#7c3aed" : "#1d4ed8" }}/>
                          {g.entries[0]?.userName}
                        </span>
                        <span>{ft(g.time)}</span>
                      </div>
                    </div>
                    <div style={{ padding:"4px 6px" }}>
                      {g.entries.map((e, i) => renderEntry(e, i, true))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {pantryModal && (
        <PantryInputModal
          pantryId={pantryModal}
          pantryStock={pantryStock}
          onAdjust={handlePantryAdjust}
          onClose={() => setPantryModal(null)}
        />
      )}
    </div>
  );
}
