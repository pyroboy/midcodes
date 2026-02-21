import { useState } from "react";
import { PACKAGES, MEATS, SIDES, DISHES, DRINKS } from "../constants.js";
import { fc } from "../helpers.js";

export function AddItemModal({
  session, inv, isManager,
  onSelectPackage, onAddMeat, onAddSide, onAddPaid, onClose,
}) {
  const [tab, setTab] = useState(session?.pkgId ? "meat" : "package");
  const [dishCat, setDishCat] = useState("Snacks");
  const [wMeat, setWMeat] = useState(null);
  const [wVal, setWVal] = useState("");

  const pkg = session?.pkgId ? PACKAGES.find(p=>p.id===session.pkgId) : null;

  const commitMeat = () => {
    const g = parseFloat(wVal);
    if (!g || g <= 0 || !wMeat) return;
    onAddMeat(wMeat, g);
    setWMeat(null); setWVal("");
  };

  const TABS = [
    { k:"package", icon:"🎫", label:"Package" },
    { k:"meat",    icon:"🥩", label:"Meats" },
    { k:"sides",   icon:"🥬", label:"Sides" },
    { k:"dishes",  icon:"🍜", label:"Dishes" },
    { k:"drinks",  icon:"🥤", label:"Drinks" },
  ];

  const IMG = { objectFit:"cover", borderRadius:8, flexShrink:0 };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.88)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:150, padding:16,
    }} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="pop" style={{
        background:"var(--panel)", border:"1px solid var(--border2)",
        borderRadius:20, width:"100%", maxWidth:680, maxHeight:"88vh",
        display:"flex", flexDirection:"column", overflow:"hidden",
        boxShadow:"0 40px 80px rgba(0,0,0,.7)",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding:"14px 18px", borderBottom:"1px solid var(--border)",
          display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0,
        }}>
          <div>
            <div className="hd" style={{ fontSize:18 }}>➕ Add to Order</div>
            <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>
              {pkg ? `${pkg.emoji} ${pkg.name} · ${session.persons} pax` : `${session.persons} pax · No package selected`}
            </div>
          </div>
          <button onClick={onClose} className="btn" style={{
            background:"var(--card)", border:"1px solid var(--border)",
            borderRadius:10, padding:"4px 12px", color:"var(--muted)", fontSize:14,
          }}>✕</button>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:3, padding:"10px 18px 0", flexShrink:0 }}>
          {TABS.map(({k,icon,label})=>(
            <button key={k} className="btn" onClick={()=>{setTab(k);setWMeat(null);}} style={{
              flex:1, background:tab===k?"var(--ember)":"var(--card)",
              color:tab===k?"#fff":"var(--muted)",
              padding:"7px 4px", borderRadius:8, fontSize:11, letterSpacing:.3,
              border:`1px solid ${tab===k?"var(--ember)":"var(--border)"}`,
            }}>{icon} {label}</button>
          ))}
        </div>
        <div style={{
          fontSize:9, color:"var(--muted)", textAlign:"center", padding:"5px 0 8px",
          borderBottom:"1px solid var(--border)", flexShrink:0,
        }}>
          {["package","meat","sides"].includes(tab) ? "FREE — inventory tracked" : "PAID ITEM"}
        </div>

        {/* ── Content ── */}
        <div style={{ flex:1, overflow:"auto", padding:"10px 18px 16px" }} className="scr">

          {/* ═══ PACKAGES ═══ */}
          {tab==="package"&&(
            <>
              {pkg && (
                <div style={{ fontSize:10, color:"#ca8a04", marginBottom:10, padding:"6px 10px",
                  background:"#451a0322", border:"1px solid #451a03", borderRadius:8 }}>
                  ⚠ Selecting a new package will replace the current one ({pkg.name})
                </div>
              )}
              {PACKAGES.map(p=>(
                <div key={p.id} onClick={()=>{onSelectPackage(p.id);onClose();}} style={{
                  background:"var(--card)", borderRadius:14, marginBottom:8, cursor:"pointer",
                  border:`1.5px solid ${session?.pkgId===p.id?p.color:p.color+"33"}`,
                  overflow:"hidden", transition:"border-color .15s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=p.color}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=session?.pkgId===p.id?p.color:p.color+"33"}>
                  <div style={{ display:"flex", gap:12 }}>
                    <img src={p.image} alt={p.name} style={{ width:100, height:80, ...IMG }}/>
                    <div style={{ flex:1, padding:"10px 12px 10px 0", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:600 }}>{p.emoji} {p.name}</div>
                          <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{p.desc}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div className="hd" style={{ fontSize:16, color:p.color }}>{fc(p.price)}/pax</div>
                          <div className="hd" style={{ fontSize:12, color:"#fff" }}>= {fc(p.price*(session?.persons||1))}</div>
                        </div>
                      </div>
                      <div style={{ marginTop:6, display:"flex", justifyContent:"space-between", fontSize:10 }}>
                        <span style={{ color:"#16a34a" }}>✓ {p.auto_sides.length} sides auto-added</span>
                        {session?.pkgId===p.id&&<span style={{ color:"var(--ember)", fontWeight:700 }}>✓ ACTIVE</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ═══ MEAT ═══ */}
          {tab==="meat"&&(
            <>
              {!pkg && (
                <div style={{ textAlign:"center", color:"var(--muted)", padding:"30px 0" }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>🎫</div>
                  <div style={{ fontSize:12 }}>Select a package first to add meats</div>
                  <button className="btn" onClick={()=>setTab("package")} style={{
                    marginTop:10, background:"var(--ember)", color:"#fff",
                    padding:"8px 20px", borderRadius:8, fontSize:12,
                  }}>Go to Packages</button>
                </div>
              )}
              {pkg && !wMeat && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:8 }}>
                  {MEATS.map(m=>{
                    const allowed = pkg.meats.includes(m.id);
                    const stock   = inv[m.id]?.stock ?? 0;
                    const out     = stock === 0;
                    const low     = !out && stock <= (inv[m.id]?.low || 0);
                    return (
                      <div key={m.id} onClick={()=>{if(!allowed||out)return;setWMeat(m);setWVal("");}}
                        style={{
                          background:"var(--card)", borderRadius:12, overflow:"hidden",
                          border:`1px solid ${!allowed?"var(--border)":out?"#450a0a":low?"#451a03":"var(--border2)"}`,
                          cursor:!allowed||out?"not-allowed":"pointer", opacity:!allowed||out?0.35:1,
                          transition:"border-color .15s",
                        }}
                        onMouseEnter={e=>{if(allowed&&!out)e.currentTarget.style.borderColor="#f97316";}}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=!allowed?"var(--border)":out?"#450a0a":low?"#451a03":"var(--border2)"}>
                        <img src={m.image} alt={m.name} style={{ width:"100%", height:80, objectFit:"cover" }}/>
                        <div style={{ padding:"8px 10px" }}>
                          <div style={{ fontSize:13, fontWeight:600 }}>{m.name}</div>
                          {isManager&&<div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>≈{fc(m.cost_per_100g)}/100g</div>}
                          <div style={{ fontSize:10, marginTop:3,
                            color:!allowed?"var(--muted2)":out?"#f87171":low?"#fbbf24":"var(--muted)" }}>
                            {!allowed?"Not in package":out?"Out of stock":low?`⚠ Low — ${stock}g`:`${stock}g available`}
                          </div>
                          {allowed&&!out&&<div style={{ fontSize:10, color:"#16a34a", marginTop:2 }}>FREE · tap to weigh</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Weight entry for selected meat */}
              {pkg && wMeat && (
                <div>
                  <button className="btn" onClick={()=>setWMeat(null)} style={{
                    background:"none",color:"var(--muted)",fontSize:12,marginBottom:10,
                  }}>← Back to meats</button>
                  <div style={{ borderRadius:14, overflow:"hidden", marginBottom:12 }}>
                    <img src={wMeat.image} alt={wMeat.name} style={{ width:"100%", height:140, objectFit:"cover" }}/>
                  </div>
                  <div style={{ textAlign:"center", marginBottom:12 }}>
                    <div className="hd" style={{ fontSize:18 }}>{wMeat.name}</div>
                    <div className="mono" style={{ fontSize:11, color:"var(--muted)" }}>
                      {inv[wMeat.id]?.stock ?? 0}g available · FREE with {pkg.name}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"center", marginBottom:10 }}>
                    {[100,150,200,250,300,500].map(g=>(
                      <button key={g} className="btn" onClick={()=>setWVal(String(g))} style={{
                        padding:"7px 14px", borderRadius:8, fontSize:13,
                        background:wVal===String(g)?"var(--ember)":"var(--card)",
                        color:wVal===String(g)?"#fff":"var(--text)",
                        border:`1px solid ${wVal===String(g)?"var(--ember)":"var(--border)"}`,
                        fontFamily:"'DM Mono',monospace",
                      }}>{g}g</button>
                    ))}
                  </div>
                  <input type="number" value={wVal} onChange={e=>setWVal(e.target.value)}
                    placeholder="Enter grams..."
                    style={{ width:"100%", background:"var(--card)", border:"1px solid var(--border2)",
                      borderRadius:10, padding:"12px", fontSize:24, textAlign:"center", color:"#fff",
                      outline:"none", fontFamily:"'DM Mono',monospace", marginBottom:10 }}/>
                  <button className="btn" onClick={commitMeat}
                    disabled={!parseFloat(wVal)||parseFloat(wVal)<=0}
                    style={{ width:"100%", background:parseFloat(wVal)>0?"#166534":"var(--card)",
                      color:"#fff", padding:"12px", borderRadius:10, fontSize:14, letterSpacing:1,
                      opacity:parseFloat(wVal)>0?1:0.4 }}>
                    ADD {wVal ? `${wVal}g` : ""} {wMeat.name}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ═══ SIDES ═══ */}
          {tab==="sides"&&(
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
              {SIDES.map(s=>{
                const stock = inv[s.id]?.stock ?? 0;
                const outS  = stock === 0;
                return (
                  <div key={s.id} style={{
                    background:"var(--card)", borderRadius:12, overflow:"hidden",
                    border:`1px solid var(--border)`, opacity:outS?0.35:1,
                    position:"relative",
                  }}>
                    <img src={s.image} alt={s.name} style={{ width:"100%", height:70, objectFit:"cover" }}/>
                    <div style={{ padding:"6px 8px" }}>
                      <div style={{ fontSize:11, fontWeight:500 }}>{s.name}</div>
                      <div style={{ fontSize:9, color:"var(--muted)" }}>{stock} {s.unit} · FREE</div>
                    </div>
                    <button className="btn" onClick={()=>!outS&&onAddSide(s)} disabled={outS}
                      style={{
                        position:"absolute", top:4, right:4, width:28, height:28,
                        borderRadius:"50%", fontSize:16, lineHeight:1,
                        background:outS?"#111":"#166534bb", color:outS?"#374151":"#fff",
                        backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,.1)",
                      }}>+</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ DISHES ═══ */}
          {tab==="dishes"&&(
            <>
              <div style={{ display:"flex", gap:3, marginBottom:10 }}>
                {["Snacks","Rice","Noodles","Soup"].map(c=>(
                  <button key={c} className="btn" onClick={()=>setDishCat(c)} style={{
                    flex:1, padding:"5px 4px", borderRadius:7, fontSize:10,
                    background:dishCat===c?"#7c3aed":"var(--card)",
                    color:dishCat===c?"#fff":"var(--muted)",
                    border:`1px solid ${dishCat===c?"#7c3aed":"var(--border)"}`,
                  }}>{c}</button>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8 }}>
                {DISHES.filter(d=>d.cat===dishCat).map(d=>(
                  <div key={d.id} style={{
                    background:"var(--card)", borderRadius:12, overflow:"hidden",
                    border:"1px solid var(--border)", position:"relative",
                  }}>
                    <img src={d.image} alt={d.name} style={{ width:"100%", height:100, objectFit:"cover" }}/>
                    <div style={{ padding:"8px 10px" }}>
                      <div style={{ fontSize:12, fontWeight:600 }}>{d.name}</div>
                      <div className="hd" style={{ fontSize:15, color:"#a855f7", marginTop:2 }}>{fc(d.price)}</div>
                    </div>
                    <button className="btn" onClick={()=>onAddPaid(d)}
                      style={{
                        position:"absolute", top:6, right:6, width:30, height:30,
                        borderRadius:"50%", fontSize:16, lineHeight:1,
                        background:"#4c1d95cc", color:"#c4b5fd",
                        border:"1px solid rgba(255,255,255,.15)", backdropFilter:"blur(4px)",
                      }}>+</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ═══ DRINKS ═══ */}
          {tab==="drinks"&&(
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
              {DRINKS.map(d=>(
                <div key={d.id} style={{
                  background:"var(--card)", borderRadius:12, overflow:"hidden",
                  border:"1px solid var(--border)", position:"relative",
                }}>
                  <img src={d.image} alt={d.name} style={{ width:"100%", height:80, objectFit:"cover" }}/>
                  <div style={{ padding:"6px 8px" }}>
                    <div style={{ fontSize:11, fontWeight:500 }}>{d.name}</div>
                    <div className="hd" style={{ fontSize:14, color:"#3b82f6", marginTop:1 }}>{fc(d.price)}</div>
                  </div>
                  <button className="btn" onClick={()=>onAddPaid(d)}
                    style={{
                      position:"absolute", top:4, right:4, width:28, height:28,
                      borderRadius:"50%", fontSize:16, lineHeight:1,
                      background:"#1e3a8acc", color:"#93c5fd",
                      border:"1px solid rgba(255,255,255,.1)", backdropFilter:"blur(4px)",
                    }}>+</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
