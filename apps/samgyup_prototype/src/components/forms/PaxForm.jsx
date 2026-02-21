import { useState } from "react";

export function PaxForm({current, onConfirm}) {
  const [pax, setPax] = useState(String(current));

  return (
    <div>
      <div style={{fontSize:11,color:"var(--muted)",marginBottom:10}}>Current: {current} pax</div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
        {[1,2,3,4,5,6,7,8,10,12].map(n=>(
          <button key={n} className="btn" onClick={()=>setPax(String(n))} style={{
            width:44,height:44,borderRadius:8,fontSize:16,
            background:pax===String(n)?"var(--ember)":"var(--card)",
            color:"#fff",border:`1px solid ${pax===String(n)?"var(--ember)":"var(--border)"}`}}>
            {n}
          </button>
        ))}
      </div>
      <button className="btn" onClick={()=>onConfirm(pax)} style={{
        width:"100%",background:"var(--ember)",color:"#fff",
        padding:13,borderRadius:10,fontSize:14,letterSpacing:1}}>
        UPDATE TO {pax} PAX
      </button>
    </div>
  );
}
