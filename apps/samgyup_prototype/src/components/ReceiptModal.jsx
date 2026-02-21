import { useState } from "react";
import { PACKAGES } from "../constants.js";
import { fc, ft } from "../helpers.js";

const PENALTY_PER_HEAD = 200;

export function ReceiptModal({table, session, bill, cost, meatG, isManager, onClose, onConfirm}) {
  const [method,      setMethod]      = useState("cash");
  const [discType,    setDiscType]    = useState("none");
  const [custName,    setCustName]    = useState("");
  const [custId,      setCustId]      = useState("");
  const [cash,        setCash]        = useState("");
  const [leftGrams,   setLeftGrams]   = useState("");
  const [leftOverride,setLeftOverride]= useState(false);

  const discAmt    = discType==="senior"?bill*0.2:discType==="promo10"?bill*0.1:0;
  const leftPenalty= !leftOverride&&parseFloat(leftGrams)>0?session.persons*PENALTY_PER_HEAD:0;
  const finalBill  = bill - discAmt + leftPenalty;
  const change     = parseFloat(cash) - finalBill;
  const pkg        = PACKAGES.find(p=>p.id===session.pkgId);

  const handleConfirm = () => {
    onConfirm(method,
      {type:discType, customerName:custName, idNumber:custId},
      {applied:parseFloat(leftGrams)>0, grams:parseFloat(leftGrams)||0,
        penalty:leftPenalty, override:leftOverride}
    );
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",
      alignItems:"center",justifyContent:"center",zIndex:150,padding:16}}>
      <div style={{background:"var(--panel)",border:"1px solid var(--border2)",borderRadius:16,
        width:"100%",maxWidth:440,maxHeight:"92vh",overflow:"auto"}} className="scr fi">

        {/* Header */}
        <div style={{background:"var(--card)",padding:"12px 16px",borderBottom:"1px dashed var(--border2)",
          display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div>
            <div className="hd" style={{fontSize:18}}>🧾 {table.label} — Checkout</div>
            <div style={{fontSize:10,color:"var(--muted)"}}>{session.persons} pax · {pkg?.name} · {ft(session.openedAt)}</div>
          </div>
          <button className="btn" onClick={onClose} style={{background:"none",color:"var(--muted)",fontSize:20}}>✕</button>
        </div>

        {/* Line items */}
        <div style={{maxHeight:160,overflow:"auto",padding:"10px 16px"}} className="scr">
          {session.orders.filter(o=>!o.voided).map(o=>(
            <div key={o.id} style={{display:"flex",justifyContent:"space-between",
              padding:"5px 0",borderBottom:"1px solid #111",fontSize:12}}>
              <span>
                {o.name}
                {o.type==="meat"&&<span style={{color:"var(--muted)",fontSize:10}}> ({o.weight_g}g)</span>}
              </span>
              <span style={{color:o.price>0?"var(--text)":"var(--muted2)"}}>
                {o.price>0?fc(o.price):"free"}
              </span>
            </div>
          ))}
        </div>

        <div style={{padding:"10px 16px 16px"}}>
          {isManager&&(
            <div style={{background:"#0d1f0d",border:"1px solid #1a3a1a",borderRadius:8,
              padding:"7px 12px",fontSize:10,color:"#4ade80",marginBottom:10}}>
              📊 {meatG}g meat · est. cost {fc(cost)} · margin ≈{fc(bill-cost)}
            </div>
          )}

          {/* Discount */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:2,marginBottom:5}}>Discount</div>
            <div style={{display:"flex",gap:5,marginBottom:6}}>
              {[["none","None"],["senior","Senior 20%"],["pwd","PWD 20%"],["promo10","Promo 10%"]].map(([v,l])=>(
                <button key={v} className="btn" onClick={()=>setDiscType(v)} style={{
                  flex:1,padding:"6px 2px",borderRadius:7,fontSize:9,
                  background:discType===v?"var(--ember)":"var(--card)",color:"#fff",
                  border:`1px solid ${discType===v?"var(--ember)":"var(--border)"}`}}>
                  {l}
                </button>
              ))}
            </div>
            {(discType==="senior"||discType==="pwd")&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <input value={custName} onChange={e=>setCustName(e.target.value)}
                  placeholder="Customer name *"
                  style={{background:"var(--card)",border:"1px solid var(--border2)",
                    borderRadius:7,padding:"7px 10px",fontSize:12,color:"#fff",outline:"none"}}/>
                <input value={custId} onChange={e=>setCustId(e.target.value)}
                  placeholder="ID number *"
                  style={{background:"var(--card)",border:"1px solid var(--border2)",
                    borderRadius:7,padding:"7px 10px",fontSize:12,color:"#fff",outline:"none"}}/>
              </div>
            )}
          </div>

          {/* Leftover */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:2,marginBottom:5}}>
              Leftover Penalty (₱200/pax)
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input type="number" value={leftGrams} onChange={e=>setLeftGrams(e.target.value)}
                placeholder="Leftover grams (0 = none)"
                style={{flex:1,background:"var(--card)",border:"1px solid var(--border2)",
                  borderRadius:7,padding:"7px 10px",fontSize:12,color:"#fff",outline:"none"}}/>
              {parseFloat(leftGrams)>0&&isManager&&(
                <label style={{display:"flex",alignItems:"center",gap:5,fontSize:10,
                  color:"#fca5a5",cursor:"pointer",whiteSpace:"nowrap"}}>
                  <input type="checkbox" checked={leftOverride} onChange={e=>setLeftOverride(e.target.checked)}/>
                  Override
                </label>
              )}
            </div>
            {parseFloat(leftGrams)>0&&!leftOverride&&(
              <div style={{fontSize:11,color:"#f87171",marginTop:4}}>
                +{fc(leftPenalty)} penalty ({session.persons} pax × ₱200)
              </div>
            )}
          </div>

          {/* Totals */}
          <div style={{background:"var(--card)",borderRadius:10,padding:10,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--muted)",marginBottom:3}}>
              <span>Subtotal</span><span>{fc(bill)}</span>
            </div>
            {discAmt>0&&(
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#4ade80",marginBottom:3}}>
                <span>Discount</span><span>−{fc(discAmt)}</span>
              </div>
            )}
            {leftPenalty>0&&(
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#f87171",marginBottom:3}}>
                <span>Leftover penalty</span><span>+{fc(leftPenalty)}</span>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid var(--border)",paddingTop:8,marginTop:5}}>
              <span className="hd" style={{fontSize:16}}>TOTAL</span>
              <span className="hd" style={{fontSize:22,color:"var(--ember)"}}>{fc(finalBill)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div style={{display:"flex",gap:5,marginBottom:10}}>
            {[["cash","💵 Cash"],["card","💳 Card"],["gcash","📱 GCash"]].map(([v,l])=>(
              <button key={v} className="btn" onClick={()=>setMethod(v)} style={{
                flex:1,padding:"8px 4px",borderRadius:8,fontSize:11,
                background:method===v?"var(--ember)":"var(--card)",color:"#fff",
                border:`1px solid ${method===v?"var(--ember)":"var(--border)"}`}}>
                {l}
              </button>
            ))}
          </div>
          {method==="cash"&&(
            <div style={{marginBottom:10}}>
              <input type="number" value={cash} onChange={e=>setCash(e.target.value)}
                placeholder="Cash tendered..."
                style={{width:"100%",background:"var(--card)",border:"1px solid var(--border2)",
                  borderRadius:8,padding:10,fontSize:18,textAlign:"center",color:"#fff",outline:"none",
                  fontFamily:"'DM Mono',monospace"}}/>
              {cash&&change>=0&&(
                <div className="hd" style={{textAlign:"center",color:"#4ade80",fontSize:18,marginTop:5}}>
                  CHANGE: {fc(change)}
                </div>
              )}
            </div>
          )}

          <button className="btn" onClick={handleConfirm} style={{width:"100%",background:"#166534",
            color:"#fff",padding:13,borderRadius:10,fontSize:14,letterSpacing:1}}>
            ✓ CONFIRM & CLOSE TABLE
          </button>
        </div>
      </div>
    </div>
  );
}
