import { useState } from "react";
import { MEAT_CATALOG } from "../../adminConstants.js";
import { fc, ft, uid } from "../../helpers.js";
import { FL } from "./Tag.jsx";

const SINP = {
  background:"var(--card2,#1e1e1e)", border:"1px solid var(--border2)",
  borderRadius:8, padding:"8px 10px", fontSize:13, color:"#fff", outline:"none",
  fontFamily:"'DM Sans',sans-serif", width:"100%",
};

export function YieldHub({ rawDeliveries, setRawDeliveries, yieldLog, setYieldLog, meatStock, adjustMeat, rcvForm, setRcvForm }) {
  const [yldForm, setYldForm] = useState(null);

  const receiveStock = () => {
    if(!rcvForm.kg||!rcvForm.costPerKg) return;
    const meat = MEAT_CATALOG.find(m=>m.id===rcvForm.meatId);
    const rawVar = meat?.variants.find(v=>v.pool==="raw");
    setRawDeliveries(p=>[...p,{id:uid(),meatId:rcvForm.meatId,kg:parseFloat(rcvForm.kg),costPerKg:parseFloat(rcvForm.costPerKg),arrivedAt:Date.now()}]);
    if(rawVar) adjustMeat(rawVar.id, parseFloat(rcvForm.kg)*1000, "Delivery");
    setRcvForm(p=>({...p,kg:"",costPerKg:""}));
  };

  const executeYield = () => {
    if(!yldForm) return;
    const meat    = MEAT_CATALOG.find(m=>m.id===yldForm.meatId);
    const sliced  = parseFloat(yldForm.slicedG)||0;
    const scraps  = parseFloat(yldForm.scrapsG)||0;
    const byp     = parseFloat(yldForm.byproductG)||0;
    const rawTotal= yldForm.availKg*1000;
    const waste   = Math.max(0, rawTotal-sliced-scraps-byp);
    const rawVar  = meat?.variants.find(v=>v.pool==="raw");
    const svcVar  = meat?.variants.find(v=>v.pool==="service");
    const kitVars = meat?.variants.filter(v=>v.pool==="kitchen");
    const wastVar = meat?.variants.find(v=>v.pool==="waste");
    if(rawVar) adjustMeat(rawVar.id, -rawTotal, "Conversion");
    if(svcVar) adjustMeat(svcVar.id, sliced, "Conversion → sliced");
    if(kitVars?.length && scraps) adjustMeat(kitVars[0].id, scraps, "Conversion → scraps");
    if(kitVars?.length>1 && byp) adjustMeat(kitVars[1].id, byp, "Conversion → by-product");
    if(wastVar && waste) adjustMeat(wastVar.id, waste, "Conversion → waste");
    setYieldLog(p=>[...p,{id:uid(),meatId:yldForm.meatId,rawKg:yldForm.availKg,slicedG:sliced,scrapsG:scraps,byproductG:byp,wasteG:waste,date:Date.now()}]);
    setRawDeliveries(p=>p.filter(r=>r.id!==yldForm.rsId));
    setYldForm(null);
  };

  return(
    <div>
      <div className="hd" style={{ fontSize:20, marginBottom:6 }}>Raw-to-Yield Conversion Hub</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {/* Receive Delivery */}
        <div style={{background:"var(--panel)",border:"1px solid var(--border2)",borderRadius:14,padding:18}}>
          <div className="hd" style={{fontSize:12,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>📥 Stage 1 — Receive Delivery</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div>
              <FL>Meat Type</FL>
              <select value={rcvForm.meatId} onChange={e=>setRcvForm(p=>({...p,meatId:e.target.value}))} style={{...SINP,width:"100%"}}>
                {MEAT_CATALOG.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div><FL>Weight (kg)</FL><input type="number" value={rcvForm.kg} onChange={e=>setRcvForm(p=>({...p,kg:e.target.value}))} placeholder="e.g. 10" style={SINP}/></div>
            <div><FL>Cost per kg (₱)</FL><input type="number" value={rcvForm.costPerKg} onChange={e=>setRcvForm(p=>({...p,costPerKg:e.target.value}))} placeholder="e.g. 750" style={SINP}/></div>
            <div style={{display:"flex",alignItems:"flex-end"}}>
              {rcvForm.kg&&rcvForm.costPerKg&&<div style={{fontSize:10,color:"#ca8a04"}}>Total: {fc(parseFloat(rcvForm.kg)*parseFloat(rcvForm.costPerKg))}</div>}
            </div>
          </div>
          <button onClick={receiveStock} disabled={!rcvForm.kg||!rcvForm.costPerKg} style={{width:"100%",background:rcvForm.kg&&rcvForm.costPerKg?"#166534":"var(--card)",color:"#fff",padding:"10px",borderRadius:9,fontSize:13,fontFamily:"'Syne',sans-serif",fontWeight:700,border:"none",cursor:"pointer",opacity:!rcvForm.kg||!rcvForm.costPerKg?0.4:1}}>
            + RECEIVE INTO RAW STOCK
          </button>
        </div>
        {/* Raw Stock */}
        <div style={{background:"var(--panel)",border:"1px solid var(--border2)",borderRadius:14,padding:18}}>
          <div className="hd" style={{fontSize:12,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🧱 Raw Stock — Awaiting Prep</div>
          {rawDeliveries.length===0&&<div style={{fontSize:12,color:"var(--muted)",textAlign:"center",padding:"20px 0"}}>No pending deliveries.</div>}
          {rawDeliveries.map(rd=>{
            const meat=MEAT_CATALOG.find(m=>m.id===rd.meatId);
            return(
              <div key={rd.id} style={{display:"flex",alignItems:"center",gap:10,background:"var(--card)",border:"1px solid #451a03",borderRadius:10,padding:"10px 12px",marginBottom:6}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{meat?.emoji} {meat?.name}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}} className="mono">{rd.kg}kg · {fc(rd.costPerKg)}/kg</div>
                </div>
                <button onClick={()=>setYldForm({rsId:rd.id,meatId:rd.meatId,availKg:rd.kg,slicedG:"",scrapsG:"",byproductG:""})} style={{background:"#451a03",color:"var(--ember)",padding:"5px 10px",borderRadius:8,fontSize:11,border:"1px solid #7c2d12",cursor:"pointer",fontFamily:"'Syne',sans-serif",fontWeight:700}}>⚗️ Convert</button>
              </div>
            );
          })}
        </div>
      </div>
      {/* Conversion form */}
      {yldForm&&(
        <div style={{background:"var(--panel)",border:"2px solid var(--ember)",borderRadius:14,padding:18,marginBottom:16}}>
          <div className="hd" style={{fontSize:16,marginBottom:12}}>⚗️ Breakdown: {MEAT_CATALOG.find(m=>m.id===yldForm.meatId)?.name} · {yldForm.availKg}kg raw</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
            {[["slicedG","🔪 Sliced (Grill)","#16a34a"],["scrapsG","🍲 Kitchen Scraps","#ca8a04"],["byproductG","🦴 By-Products","#6366f1"]].map(([f,l,c])=>(
              <div key={f}><FL><span style={{color:c}}>{l}</span></FL><input type="number" value={yldForm[f]} onChange={e=>setYldForm(p=>({...p,[f]:e.target.value}))} placeholder="grams" style={{...SINP,borderColor:c+"44"}}/></div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setYldForm(null)} style={{flex:1,background:"var(--card)",color:"var(--muted)",padding:"10px",borderRadius:9,fontSize:13,fontFamily:"'Syne',sans-serif",fontWeight:700,border:"none",cursor:"pointer"}}>Cancel</button>
            <button onClick={executeYield} style={{flex:2,background:"var(--ember)",color:"#fff",padding:"10px",borderRadius:9,fontSize:13,fontFamily:"'Syne',sans-serif",fontWeight:700,border:"none",cursor:"pointer"}}>✓ COMMIT CONVERSION</button>
          </div>
        </div>
      )}
      {/* Yield History */}
      {yieldLog.length>0&&(
        <div style={{background:"var(--panel)",border:"1px solid var(--border2)",borderRadius:14,padding:18}}>
          <div className="hd" style={{fontSize:12,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>📋 Yield History</div>
          {[...yieldLog].reverse().map(y=>{
            const meat=MEAT_CATALOG.find(m=>m.id===y.meatId);
            const yp=Math.round((y.slicedG/(y.rawKg*1000))*100);
            return(
              <div key={y.id} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)",fontSize:12,alignItems:"center"}}>
                <span style={{fontSize:18}}>{meat?.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:500}}>{meat?.name} · {y.rawKg}kg raw</div>
                  <div style={{fontSize:10,color:"var(--muted)"}} className="mono">Sliced: {y.slicedG}g · Scraps: {y.scrapsG}g · Waste: {y.wasteG}g · {ft(y.date)}</div>
                </div>
                <span style={{background:yp>70?"#052e16":yp>55?"#451a03":"#450a0a",color:yp>70?"#4ade80":yp>55?"#fbbf24":"#f87171",padding:"2px 8px",borderRadius:6,fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:700}}>{yp}% yield</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
