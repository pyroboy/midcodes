import { useState } from "react";

export function InvRow({id, name, inv, setInv}) {
  const [val, setVal] = useState("");
  if (!inv) return null;
  const pct = Math.min(100, (inv.stock / Math.max(inv.stock, inv.low * 8)) * 100);
  const out = inv.stock === 0;
  const low = !out && inv.stock <= inv.low;

  return (
    <div style={{background:"var(--panel)",border:`1px solid ${out?"#450a0a":low?"#451a03":"var(--border)"}`,
      borderRadius:9,padding:"10px 12px",marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:12,fontWeight:500}}>{name}</span>
        <span className="mono" style={{fontSize:14,color:out?"#f87171":low?"#fbbf24":"#4ade80"}}>
          {inv.stock}{inv.unit}
        </span>
      </div>
      <div style={{height:3,background:"#111",borderRadius:2,marginBottom:6,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",
          background:out?"#7f1d1d":low?"#92400e":"#166534",
          borderRadius:2,transition:"width .3s"}}/>
      </div>
      <div style={{display:"flex",gap:5}}>
        <input type="number" value={val} onChange={e=>setVal(e.target.value)}
          placeholder="Restock amount..."
          style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",
            borderRadius:7,padding:"5px 8px",fontSize:12,color:"#fff",outline:"none"}}/>
        <button className="btn" onClick={()=>{
          if(!val||parseFloat(val)<=0)return;
          setInv(p=>({...p,[id]:{...p[id],stock:p[id].stock+parseFloat(val)}}));
          setVal("");
        }} style={{background:"#166534",color:"#fff",borderRadius:7,padding:"4px 10px",fontSize:11,letterSpacing:0.5}}>
          + ADD
        </button>
      </div>
    </div>
  );
}
