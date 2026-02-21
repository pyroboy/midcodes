import { useState } from "react";

export function OpenForm({onConfirm}) {
  const [pax, setPax] = useState("2");

  return (
    <div>
      <div style={{fontSize:10,color:"var(--muted)",marginBottom:8,letterSpacing:1,textTransform:"uppercase"}}>
        How many guests?
      </div>
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
      <div style={{fontSize:10,color:"var(--muted)",marginBottom:12,textAlign:"center"}}>
        You can add packages and orders after opening the table.
      </div>
      <button className="btn" onClick={()=>onConfirm(pax)} style={{
        width:"100%",marginTop:4,background:"var(--ember)",color:"#fff",
        padding:14,borderRadius:10,fontSize:15,letterSpacing:1}}>
        OPEN TABLE · {pax} PAX
      </button>
    </div>
  );
}
