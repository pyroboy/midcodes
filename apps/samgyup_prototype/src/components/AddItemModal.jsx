import { useState, useEffect } from "react";
import { PACKAGES, MEATS, SIDES, DISHES, DRINKS } from "../constants.js";
import { fc } from "../helpers.js";
import { MWrap } from "./ui/MWrap.jsx";
import { PaxForm } from "./forms/PaxForm.jsx";

function GhostCard({ g, index }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    // sequential delay for the ghost animations
    setTimeout(() => {
      requestAnimationFrame(() => setActive(true));
    }, index * 50);
  }, [index]);
  
  // Fly towards the main running bill on the right edge of the window
  const targetX = window.innerWidth - 100; 
  const targetY = window.innerHeight / 2 + (index * 10);
  
  return (
    <div style={{
      position:"fixed", left:g.x, top:g.y, width:g.w, height:g.h,
      background: "var(--ember)", 
      borderRadius: "50%", zIndex:9999, pointerEvents:"none",
      transition:"all 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
      transform: active ? `translate(${targetX - g.x}px, ${targetY - g.y}px) scale(0.1)` : "translate(0,0) scale(1)",
      opacity: active ? 0 : 0.8,
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
    }}/>
  );
}

function MeatAdjuster({ currentWeight, onAdjust }) {
  const [val, setVal] = useState(0);

  const apply = () => {
    if (val !== 0) {
      onAdjust(val);
      setVal(0);
    }
  };

  const finalWeight = currentWeight + val;

  return (
    <div style={{ marginTop: 8, padding: "0 4px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
        <span>-50g</span>
        <span className="hd" style={{ color: val === 0 ? "var(--muted)" : "var(--ember)", fontSize: 13, fontWeight: val !== 0 ? 800 : 500 }}>
          {val === 0 ? "Fine-tune Weight" : `${finalWeight}g`}
        </span>
        <span>+50g</span>
      </div>
      <input type="range" min="-50" max="50" step="1" value={val} 
        onChange={e => setVal(parseInt(e.target.value))}
        onMouseUp={apply} onTouchEnd={apply} onMouseLeave={() => val !== 0 && apply()}
        style={{ width: "100%", accentColor: "var(--ember)", cursor: "pointer" }} 
      />
    </div>
  );
}

export function AddItemModal({
  session, inv, isManager,
  onSelectPackage, onAddMeat, onAddSide, onAddPaid, onChangePax, onClose,
}) {
  const [tab, setTab] = useState(session?.pkgId ? "meat" : "package");
  const [dishCat, setDishCat] = useState("Snacks");
  const [wMeat, setWMeat] = useState(null);
  const [wVal, setWVal] = useState("");
  const [ghosts, setGhosts] = useState([]);
  const [showPaxModal, setShowPaxModal] = useState(false);
  
  // Local pending items for the mini running bill
  const [pState, setPState] = useState({ items: [], history: [] });
  const pendingItems = pState.items;

  const setP = (updater) => {
    setPState(s => {
      const nextItems = updater(s.items);
      return { items: nextItems, history: [...s.history, s.items] };
    });
  };

  const addPending = (item, price, isMeat=false, weightG=0) => {
    setP(prev => {
      const existingIdx = prev.findIndex(p => p.id === item.id && !!p._isMeat === isMeat);
      if (existingIdx !== -1) {
        const next = [...prev];
        const p = next.splice(existingIdx, 1)[0];
        if (isMeat) {
          next.push({ ...p, weightG: p.weightG + weightG, _isAutoMeat: false });
        } else {
          next.push({ ...p, qty: p.qty + 1 });
        }
        return next;
      }
      return [...prev, { ...item, qty: 1, _price: price, _isMeat: isMeat, weightG, uid: Date.now()+Math.random() }];
    });
  };

  const addPendingPkg = (pkgItem) => {
    setP(prev => {
      const next = prev.filter(p => !p._isPkg && !p._isAutoMeat && !p._isAutoSide);
      const persons = session?.persons || 1;
      
      pkgItem.meats.forEach((mId, i) => {
        const existingIdx = next.findIndex(p => p.id === mId && p._isMeat);
        if (existingIdx !== -1) {
           const p = next.splice(existingIdx, 1)[0];
           next.push({ ...p, weightG: p.weightG + (150 * persons), _isAutoMeat: true });
        } else {
           const mObj = MEATS.find(m => m.id === mId);
           next.push({
             ...mObj,
             qty: 1, _price: 0, _isMeat: true, 
             weightG: 150 * persons, 
             uid: Date.now() + Math.random() + i,
             _isAutoMeat: true
           });
        }
      });
      
      pkgItem.auto_sides.forEach((sId, i) => {
        const existingIdx = next.findIndex(p => p.id === sId && !p._isMeat);
        if (existingIdx !== -1) {
           const p = next.splice(existingIdx, 1)[0];
           next.push({ ...p, qty: p.qty + 1, _isAutoSide: true });
        } else {
           const sObj = SIDES.find(s => s.id === sId);
           if (sObj) {
             next.push({
               ...sObj,
               qty: 1, _price: 0, _isMeat: false,
               uid: Date.now() + Math.random() + i + 100,
               _isAutoSide: true
             });
           }
        }
      });

      return [
        ...next, 
        { ...pkgItem, qty: persons, _price: pkgItem.price, _isPkg: true, uid: Date.now()+Math.random() }
      ];
    });
  };

  const undoLast = () => {
    setPState(s => {
      if (s.history.length === 0) return s;
      const prevItems = s.history[s.history.length - 1];
      return { items: prevItems, history: s.history.slice(0, -1) };
    });
  };

  const updateQty = (idx, delta) => {
    setP(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + delta };
      if (next[idx].qty <= 0) next.splice(idx, 1);
      return next;
    });
  };

  const snapMeatWeightTo50 = (idx, direction) => {
    setP(prev => {
      const next = [...prev];
      const p = next[idx];
      let newWeight;
      if (direction > 0) {
        newWeight = Math.ceil((p.weightG + 1) / 50) * 50;
      } else {
        newWeight = Math.floor((p.weightG - 1) / 50) * 50;
      }
      next[idx] = { ...p, weightG: newWeight };
      if (next[idx].weightG <= 0) next.splice(idx, 1);
      return next;
    });
  };

  const updateMeatWeight = (idx, delta) => {
    setP(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], weightG: next[idx].weightG + delta };
      if (next[idx].weightG <= 0) next.splice(idx, 1);
      return next;
    });
  };

  const removePendingItem = (idx) => {
    setP(prev => {
      const removed = prev[idx];
      if (removed?._isPkg) {
         return prev.filter((_, i) => i !== idx && !prev[i]._isAutoMeat && !prev[i]._isAutoSide);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const commitCharge = () => {
    // Commit all pending items sequentially and trigger ghosts to main bill
    // Then close the modal.
    pendingItems.forEach(pi => {
      if (pi._isPkg) {
        onSelectPackage(pi.id);
      } else {
        for(let i=0; i<pi.qty; i++){
          if (pi._isMeat) onAddMeat(pi, pi.weightG);
          else if (pi.price !== undefined) onAddPaid(pi);
          else onAddSide(pi);
        }
      }
    });

    // Spawn purely visual ghosts towards the bottom left main running bill corner
    setGhosts([]); // clear previous
    // calculate start position from the "Charge" button rough area
    const startX = window.innerWidth * 0.8;
    const startY = window.innerHeight * 0.8;
    
    let allGhosts = [];
    pendingItems.forEach((pi, idx) => {
      const ghostCount = pi._isPkg ? 1 : pi.qty;
      for(let i=0; i<ghostCount; i++){
        allGhosts.push({ id: "bulk"+idx+"_"+i, x: startX, y: startY, w: 20, h: 20 });
      }
    });

    setGhosts(allGhosts);
    
    // Wait for the last animation to finish before closing
    setTimeout(() => {
      setGhosts([]);
      onClose();
    }, 400 + (allGhosts.length * 50)); 
  };

  const pendingPkg = pendingItems.find(p => p._isPkg);
  const pkg = pendingPkg ? PACKAGES.find(p=>p.id===pendingPkg.id) : (session?.pkgId ? PACKAGES.find(p=>p.id===session.pkgId) : null);

  const commitMeat = () => {
    const g = parseFloat(wVal);
    if (!g || g <= 0 || !wMeat) return;
    addPending(wMeat, 0, true, g);
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
    <>
      {showPaxModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000 }}>
          <MWrap title="Change Pax" onClose={() => setShowPaxModal(false)}>
            <PaxForm current={session.persons}
              onConfirm={n => {
                onChangePax?.(n);
                setShowPaxModal(false);
              }} />
          </MWrap>
        </div>
      )}
      <div style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,.88)",
        display:"flex", alignItems:"center", justifyContent:"center", zIndex:150, padding:16,
      }} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
        {ghosts.map((g, i) => <GhostCard key={g.id} g={g} index={i} />)}
      
      <div className="pop" style={{
        background:"var(--panel)", border:"1px solid var(--border2)",
        borderRadius:20, width:"100%", maxWidth: 1000, height: "90vh",
        display:"flex", overflow:"hidden",
        boxShadow:"0 40px 80px rgba(0,0,0,.7)",
      }}>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--border)"}}>

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
        <div style={{ display:"flex", gap:6, padding:"12px 18px 0", flexShrink:0 }}>
          {TABS.map(({k,icon,label})=>(
            <button key={k} className="btn" onClick={()=>{setTab(k);setWMeat(null);}} style={{
              flex:1, background:tab===k?"var(--ember)":"var(--card)",
              color:tab===k?"#fff":"var(--muted)",
              padding:"10px 4px", borderRadius:12, fontSize:13, letterSpacing:.3,
              border:`1.5px solid ${tab===k?"var(--ember)":"var(--border)"}`,
              display:"flex", flexDirection:"column", alignItems:"center", gap:4
            }}>
              <span style={{fontSize:20, lineHeight:1}}>{icon}</span>
              <span>{label}</span>
            </button>
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
                <div key={p.id} onClick={()=>addPendingPkg(p)} style={{
                  background:"var(--card)", borderRadius:14, marginBottom:8, cursor:"pointer",
                  border:`1.5px solid ${pkg?.id===p.id?p.color:p.color+"33"}`,
                  overflow:"hidden", transition:"border-color .15s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=p.color}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=pkg?.id===p.id?p.color:p.color+"33"}>
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
                        <span style={{ color:"#16a34a" }}>✓ {p.auto_sides.length} sides, {p.meats.length * 150 * (session?.persons || 1)}g initial meats</span>
                        {pkg?.id===p.id&&<span style={{ color:"var(--ember)", fontWeight:700 }}>✓ ACTIVE</span>}
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
                  <div key={s.id} onClick={()=>!outS&&addPending(s, 0)} className={outS?"":"btn"} style={{
                    background:"var(--card)", borderRadius:12, overflow:"hidden",
                    border:`1px solid var(--border)`, opacity:outS?0.35:1,
                    position:"relative", textAlign:"left", cursor:outS?"not-allowed":"pointer"
                  }}>
                    <img src={s.image} alt={s.name} style={{ width:"100%", height:80, objectFit:"cover" }}/>
                    <div style={{ padding:"8px 10px" }}>
                      <div style={{ fontSize:12, fontWeight:600 }}>{s.name}</div>
                      <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{stock} {s.unit} · FREE</div>
                    </div>
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
                  <div key={d.id} onClick={()=>addPending(d, d.price)} className="btn" style={{
                    background:"var(--card)", borderRadius:12, overflow:"hidden",
                    border:"1px solid var(--border)", position:"relative", textAlign:"left"
                  }}>
                    <img src={d.image} alt={d.name} style={{ width:"100%", height:100, objectFit:"cover" }}/>
                    <div style={{ padding:"8px 10px" }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{d.name}</div>
                      <div className="hd" style={{ fontSize:15, color:"#a855f7", marginTop:2 }}>{fc(d.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ═══ DRINKS ═══ */}
          {tab==="drinks"&&(
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:8 }}>
              {DRINKS.map(d=>(
                <div key={d.id} onClick={()=>addPending(d, d.price)} className="btn" style={{
                  background:"var(--card)", borderRadius:12, overflow:"hidden",
                  border:"1px solid var(--border)", position:"relative", textAlign:"left"
                }}>
                  <img src={d.image} alt={d.name} style={{ width:"100%", height:80, objectFit:"cover" }}/>
                  <div style={{ padding:"8px 10px" }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>{d.name}</div>
                    <div className="hd" style={{ fontSize:14, color:"#3b82f6", marginTop:2 }}>{fc(d.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div> {/* end content */}
        </div> {/* end left column */}
        
        {/* ── Mini Running Bill Sidebar (Right) ── */}
        <div style={{ width: 340, background: "var(--card2)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="hd" style={{ fontSize: 16, color: "var(--ember)" }}>Pending Items</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Review items before pushing to the main table bill.</div>
            </div>
            <button className="btn" onClick={() => setShowPaxModal(true)} style={{ background: "var(--card)", border: "1px solid var(--border)", padding: "6px 10px", borderRadius: 8, color: "var(--text)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <span>👥 {session.persons} Pax</span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>✎</span>
            </button>
          </div>
          
          <div style={{ flex: 1, overflow: "auto", padding: "12px" }} className="scr">
            {pendingItems.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0" }}>
                <div style={{ fontSize: 32, opacity: 0.5, marginBottom: 8 }}>🍽️</div>
                <div style={{ fontSize: 13 }}>No pending items</div>
              </div>
            )}
            
            {pendingItems.map((p, idx) => (
              <div key={idx} style={{ 
                background: "var(--panel)", border: "1px solid var(--border)", 
                borderRadius: 12, padding: "10px", marginBottom: 8,
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                {/* Qty Controls or Weight Display */}
                {p._isPkg ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ background: "var(--card)", color: "#fff", padding: "4px 8px", borderRadius: 6, fontSize: 13, border: "1px solid var(--border2)" }}>
                      {p.qty} pax
                    </div>
                    <button className="btn" onClick={() => removePendingItem(idx)} style={{
                      width: 24, height: 24, borderRadius: 6, background: "var(--border)", color: "var(--muted)", border: "none", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center"
                    }}>✕</button>
                  </div>
                ) : p._isMeat ? (
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{p.weightG}g total</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", background: "#450a0a", borderRadius: 8, padding: 2 }}>
                          <button className="btn" onClick={() => snapMeatWeightTo50(idx, -1)} style={{ width: 22, height: 22, borderRadius: 6, background: "transparent", border: "none", color: "#fca5a5", fontSize: 14 }}>-</button>
                          <div className="hd" style={{ fontSize: 13, width: 44, textAlign: "center", color: "#fca5a5", fontWeight: 700 }}>{p.weightG}g</div>
                          <button className="btn" onClick={() => snapMeatWeightTo50(idx, 1)} style={{ width: 22, height: 22, borderRadius: 6, background: "transparent", border: "none", color: "#fca5a5", fontSize: 14 }}>+</button>
                        </div>
                        <button className="btn" onClick={() => removePendingItem(idx)} style={{
                          width: 24, height: 24, borderRadius: 6, background: "var(--border)", color: "var(--muted)", border: "none", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center"
                        }}>✕</button>
                      </div>
                    </div>
                    {/* Add the MeatAdjuster Slider! */}
                    <MeatAdjuster currentWeight={p.weightG} onAdjust={(val) => val !== 0 && updateMeatWeight(idx, val)} />
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                        {p._price > 0 ? fc(p._price) : "FREE"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--card)", padding: "4px", borderRadius: 8, border: "1px solid var(--border2)" }}>
                      <button className="btn" onClick={() => updateQty(idx, -1)} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--border)", border: "none", color: "#fff", fontSize: 14 }}>-</button>
                      <div className="hd" style={{ fontSize: 14, width: 20, textAlign: "center", color: "#fff" }}>{p.qty}</div>
                      <button className="btn" onClick={() => updateQty(idx, 1)} style={{ width: 24, height: 24, borderRadius: 6, background: "#166534", border: "none", color: "#fff", fontSize: 14 }}>+</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--panel)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color:"var(--muted)", textTransform: "uppercase" }}>Pending Total</span>
              <span className="hd" style={{ fontSize: 18, color: "var(--ember)" }}>{fc(pendingItems.reduce((sum, p) => sum + ((p._price||0) * p.qty), 0))}</span>
            </div>
            
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn" onClick={undoLast} disabled={pendingItems.length === 0} style={{
                flex: 1, padding: "12px", background: "var(--border)", color: "var(--muted)",
                borderRadius: 10, fontSize: 13, opacity: pendingItems.length === 0 ? 0.4 : 1
              }}>Undo</button>
              
              <button className="btn" onClick={commitCharge} disabled={pendingItems.length === 0} style={{
                flex: 2, padding: "12px", background: pendingItems.length === 0 ? "var(--card)" : "#166534", 
                color: "#fff", borderRadius: 10, fontSize: 14, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: pendingItems.length === 0 ? 0.4 : 1
              }}>
                ⚡ CHARGE ({pendingItems.reduce((s, p) => s + p.qty, 0)})
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
