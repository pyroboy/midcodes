import { PACKAGES } from "../constants.js";
import { fc, ft, ela, sBill, sCost, sMeatG } from "../helpers.js";
import { TCM } from "./ui/TCM.jsx";
import { AddPanel } from "./AddPanel.jsx";

export function TableSession({
  atd, addTab, setAddTab, dishCat, setDishCat,
  inv, isManager,
  onBack, onVoidItem, onVoidTable, onCheckout, onChangePax,
  onSwapPackage, onMeat, onSide, onPaid,
}) {
  const session = atd.session;

  return (
    <div style={{flex:1,display:"flex",overflow:"hidden"}} className="fi">
      {/* Order list */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:"var(--panel)",borderBottom:"1px solid var(--border)",
          padding:"10px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <button className="btn" onClick={onBack}
            style={{background:"none",color:"var(--muted)",fontSize:20,padding:"2px 6px"}}>←</button>
          <div>
            <span className="hd" style={{fontSize:20,color:"var(--ember)"}}>{atd.label}</span>
            <span style={{fontSize:11,color:"var(--muted)",marginLeft:8}}>
              {session?.persons} pax · {PACKAGES.find(p=>p.id===session?.pkgId)?.name} · {session?ela(session.openedAt):""}
              {session?.mergedFrom?.length>0&&(
                <span style={{color:"#ca8a04"}}> · w/ {session.mergedFrom.join(", ")}</span>
              )}
            </span>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:6}}>
            <button className="btn" onClick={onChangePax} style={{
              background:"var(--card)",color:"var(--muted)",border:"1px solid var(--border)",
              padding:"6px 12px",borderRadius:8,fontSize:11}}>
              👥 {session?.persons}pax
            </button>
            <button className="btn" onClick={onVoidTable} style={{
              background:"#450a0a",color:"#fca5a5",padding:"6px 12px",borderRadius:8,fontSize:11}}>
              🗑 Void
            </button>
            <button className="btn" onClick={onCheckout} style={{
              background:"#166534",color:"#fff",padding:"6px 14px",borderRadius:8,fontSize:12}}>
              💳 Checkout
            </button>
          </div>
        </div>

        {/* Orders */}
        <div style={{flex:1,padding:"10px 16px",overflow:"auto"}} className="scr">
          {!session?.orders.length&&(
            <div style={{textAlign:"center",color:"var(--muted)",padding:"50px 0"}}>
              <div style={{fontSize:36,marginBottom:8}}>🍽️</div>No orders yet
            </div>
          )}
          {session?.orders.map(o=>(
            <div key={o.id} style={{
              background:o.voided?"#0e0e0e":o.type==="package"?"#150f05":o.isAuto?"#0e0e0e":"var(--card)",
              border:`1px solid ${o.voided?"#1a1a1a":o.type==="package"?"var(--edim)":o.isAuto?"#191919":"var(--border)"}`,
              borderRadius:9,padding:"9px 12px",marginBottom:5,
              display:"flex",alignItems:"center",gap:10,
              opacity:o.isAuto||o.voided?0.45:1,
              textDecoration:o.voided?"line-through":"none",
            }}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,fontWeight:500}}>{o.name}</span>
                  {o.type==="meat"&&!o.voided&&<TCM label={`${o.weight_g}g`} bg="#450a0a" c="#fca5a5"/>}
                  {o.type==="package"&&<TCM label="PKG" bg="#451a03" c="var(--ember)"/>}
                  {(o.isFree||o.isAuto)&&o.type!=="package"&&!o.voided&&<TCM label="FREE" bg="#052e16" c="#4ade80"/>}
                  {o.voided&&<TCM label="VOIDED" bg="#450a0a" c="#f87171"/>}
                </div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>
                  {o.note||""} · {ft(o.time)}
                  {o.voided&&o.voidedBy&&<span style={{color:"#f87171"}}> · voided by {o.voidedBy}</span>}
                </div>
              </div>
              <div className="hd" style={{fontSize:15,color:o.voided?"var(--muted2)":o.price>0?"var(--text)":"var(--muted2)"}}>
                {o.voided?"—":o.price>0?fc(o.price):"—"}
              </div>
              {!o.voided&&(
                <button className="btn" onClick={()=>onVoidItem(o.id)} title="Void item" style={{
                  width:24,height:24,borderRadius:6,background:"#2a0a0a",color:"#f87171",
                  fontSize:13,lineHeight:1,flexShrink:0,border:"1px solid #450a0a"}}>✕</button>
              )}
            </div>
          ))}
        </div>

        {/* Footer bill */}
        <div style={{background:"var(--panel)",borderTop:"1px solid var(--border)",
          padding:"9px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontSize:11,color:"var(--muted)"}}>
            {session?.orders.filter(o=>!o.voided).length} active · 🥩 {sMeatG(session)}g
            {isManager&&<span style={{color:"#ca8a04"}}> · cost ≈{fc(sCost(session))}</span>}
          </div>
          <div style={{display:"flex",alignItems:"baseline",gap:6}}>
            <span style={{fontSize:10,color:"var(--muted)"}}>BILL</span>
            <span className="hd" style={{fontSize:26,color:"var(--ember)"}}>{fc(sBill(session))}</span>
          </div>
        </div>
      </div>

      <AddPanel
        addTab={addTab} setAddTab={setAddTab}
        dishCat={dishCat} setDishCat={setDishCat}
        session={session} inv={inv} isManager={isManager}
        onSwapPackage={onSwapPackage}
        onMeat={onMeat} onSide={onSide} onPaid={onPaid}
      />
    </div>
  );
}
