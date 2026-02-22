import { PACKAGES } from "../constants.js";
import { fc, ft, ela, sBill, sCost, sMeatG } from "../helpers.js";

export function RunningBill({
  table, session, isManager, isKitchen, timeStatus,
  onVoidItem, onVoidTable, onCheckout, onAdd, onChangePax, onPrintKOT, onClose,
}) {
  if (!session) return null;
  const pkg = session.pkgId ? PACKAGES.find(p=>p.id===session.pkgId) : null;
  const bill = sBill(session);
  const activeOrders = session.orders.filter(o=>!o.voided);

  return (
    <div style={{
      width:320, background:"var(--panel)", borderLeft:"1px solid var(--border)",
      display:"flex", flexDirection:"column", position:"relative", flexShrink:0,
    }} className="fi">

      {/* ── Floating Add Button ── */}
      {!isKitchen && (
        <button className="btn stock-alert-pulse" onClick={onAdd} style={{
          position: "absolute", left: -36, top: "50%", transform: "translateY(-50%)",
          width: 72, height: 72, background: "#166534", color: "#fff",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 2, border: "4px solid #11421f", borderRadius: "50%",
          boxShadow: "0 6px 16px rgba(0,0,0,0.6)", cursor: "pointer", zIndex: 10
        }}>
          <span style={{ fontSize: 24, lineHeight: 1, marginTop: 4 }}>➕</span>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1 }}>ADD</span>
        </button>
      )}

      {/* ── Header ── */}
      <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span className="hd" style={{ fontSize:26, color:"#fff", fontWeight: 800, textShadow:"0 1px 3px rgba(0,0,0,0.8)" }}>{table.label}</span>
            <button className="btn" onClick={onChangePax} style={{
              background:"var(--card)", border:"1px solid var(--border)", borderRadius:6,
              padding:"2px 8px", fontSize:10, color:"var(--muted)",
            }}>👥 {session.persons} pax</button>
          </div>
          <button className="btn" onClick={onClose} style={{
            background:"none", color:"var(--muted)", fontSize:16
          }}>✕</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:10, color:"var(--muted)" }}>
          {pkg && <span style={{ color: pkg.color }}>{pkg.emoji} {pkg.name}</span>}
          {!pkg && <span style={{ color:"#fbbf24" }}>No package — à la carte</span>}
          <span>·</span>
          <span className={timeStatus==="overtime"?"pulse":""} style={{
            padding: (timeStatus==="overtime"||timeStatus==="warning_red")?"3px 8px":timeStatus==="warning_yellow"?"2px 6px":"0",
            background: timeStatus==="overtime"?"#dc2626":timeStatus==="warning_red"?"#7f1d1d":timeStatus==="warning_yellow"?"#713f12":"transparent",
            borderRadius:4,
            fontWeight: timeStatus==="overtime"?700:timeStatus==="warning_red"?600:400,
            color: timeStatus==="overtime"?"#fff":timeStatus==="warning_red"?"#fca5a5":timeStatus==="warning_yellow"?"#fde047":"var(--ember)",
          }}>⏱ {ela(session.openedAt)}{timeStatus==="overtime"?" ⚠ OVERTIME":timeStatus==="warning_red"?" ⚠":""}</span>
          {session.mergedFrom?.length > 0 && (
            <span style={{ color:"#ca8a04" }}>· +{session.mergedFrom.join(",")}</span>
          )}
        </div>
        {timeStatus==="overtime" && (
          <div style={{marginTop:6,padding:"10px 14px",background:"#dc2626",border:"2px solid #fca5a5",borderRadius:8,
            fontSize:13,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:8,boxShadow:"0 2px 8px rgba(220,38,38,0.4)"}}>
            ⚠ Session exceeded 90 minutes! Consider checkout.
          </div>
        )}
        {timeStatus==="warning_red" && (
          <div style={{marginTop:6,padding:"8px 12px",background:"#7f1d1d",border:"1px solid #dc2626",borderRadius:8,
            fontSize:12,fontWeight:600,color:"#fca5a5",display:"flex",alignItems:"center",gap:8}}>
            ⚠ Session approaching time limit. Consider checkout soon.
          </div>
        )}
      </div>

      {/* ── Orders list ── */}
      <div style={{ flex:1, overflow:"auto", padding:"8px 10px" }} className="scr">
        {activeOrders.length === 0 && (
          <div style={{ textAlign:"center", color:"var(--muted)", padding:"40px 0" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🍽️</div>
            <div style={{ fontSize:12 }}>No orders yet</div>
            {!isKitchen && (
              <div style={{ fontSize:10, color:"var(--muted2)", marginTop:4 }}>
                Tap "➕ Add" below to start
              </div>
            )}
          </div>
        )}

        {session.orders.map(o => (
          <div key={o.id} style={{
            display:"flex", alignItems:"center", gap:8,
            padding:"7px 10px", marginBottom:3, borderRadius:8,
            background: o.voided ? "#0e0e0e" : o.type==="package" ? "#150f05" : o.isAuto ? "#0e0e0e" : "var(--card)",
            border:`1px solid ${o.voided?"#1a1a1a":o.type==="package"?"var(--edim)":o.isAuto?"#191919":"var(--border)"}`,
            opacity: o.isAuto || o.voided ? 0.45 : 1,
            textDecoration: o.voided ? "line-through" : "none",
          }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, fontWeight:500 }}>{o.name}</span>
                {o.type==="meat" && !o.voided && (
                  <span style={{ fontSize:9, background:"#450a0a", color:"#fca5a5", padding:"1px 5px", borderRadius:4 }}>{o.weight_g}g</span>
                )}
                {o.type==="package" && (
                  <span style={{ fontSize:9, background:"#451a03", color:"var(--ember)", padding:"1px 5px", borderRadius:4 }}>PKG</span>
                )}
                {(o.isFree||o.isAuto) && o.type!=="package" && !o.voided && (
                  <span style={{ fontSize:9, background:"#052e16", color:"#4ade80", padding:"1px 5px", borderRadius:4 }}>FREE</span>
                )}
                {o.voided && (
                  <span style={{ fontSize:9, background:"#450a0a", color:"#f87171", padding:"1px 5px", borderRadius:4 }}>VOID</span>
                )}
              </div>
              <div style={{ fontSize:9, color:"var(--muted)", marginTop:1 }}>
                {o.note||""} · {ft(o.time)}
                {o.voided && o.voidedBy && <span style={{ color:"#f87171" }}> · voided by {o.voidedBy}</span>}
              </div>
            </div>
            <div className="hd" style={{
              fontSize:13, flexShrink:0,
              color: o.voided ? "var(--muted2)" : o.price > 0 ? "var(--text)" : "var(--muted2)",
            }}>
              {o.voided ? "—" : o.price > 0 ? fc(o.price) : "—"}
            </div>
            {!o.voided && !isKitchen && (
              <button className="btn" onClick={()=>onVoidItem(o.id)} title="Void"
                style={{
                  width:20, height:20, borderRadius:5, background:"#2a0a0a", color:"#f87171",
                  fontSize:11, lineHeight:1, flexShrink:0, border:"1px solid #450a0a",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>✕</button>
            )}
          </div>
        ))}
      </div>

      {/* ── Footer totals ── */}
      <div style={{ padding:"8px 12px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--muted)", marginBottom:4 }}>
          <span>{activeOrders.length} items · 🥩 {sMeatG(session)}g</span>
          {isManager && <span style={{ color:"#ca8a04" }}>cost ≈{fc(sCost(session))}</span>}
        </div>
        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between" }}>
          <span style={{ fontSize:10, color:"var(--muted)" }}>BILL</span>
          <span className="hd" style={{ fontSize:24, color:"var(--ember)" }}>{fc(bill)}</span>
        </div>
      </div>

      {/* ── Action buttons ── */}
      {!isKitchen && (
        <div style={{ padding:"8px 10px", borderTop:"1px solid var(--border)", display:"flex", gap:6, flexShrink:0 }}>
          <button className="btn" onClick={onVoidTable} style={{
            flex:1, background:"#450a0a", color:"#fca5a5", padding:"10px 8px", borderRadius:8,
            fontSize:12, fontWeight:500,
          }}>🗑 Void</button>
          <button className="btn" onClick={onCheckout} disabled={activeOrders.length===0} style={{
            flex:2, background: activeOrders.length===0 ? "var(--card)" : "var(--ember)",
            color:"#fff", padding:"10px 8px", borderRadius:8, fontSize:13, fontWeight:600,
            opacity: activeOrders.length===0 ? 0.4 : 1,
          }}>💳 Checkout</button>
          <button className="btn" onClick={onPrintKOT} style={{
            flex:1, background:"var(--card)", color:"var(--muted)", padding:"10px 8px", borderRadius:8,
            fontSize:12, border:"1px solid var(--border)",
          }}>🖨 KOT</button>
        </div>
      )}
    </div>
  );
}

