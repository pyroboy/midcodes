export function WForm({meat, val, setVal, inv, onConfirm}) {
  const stock = inv[meat.id]?.stock ?? 0;
  const over  = parseFloat(val) > stock;

  return (
    <div>
      <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>
        Available: <span className="mono" style={{color:"#4ade80"}}>{stock}g</span>
      </div>
      <div style={{fontSize:10,color:"var(--muted)",marginBottom:10}}>
        FREE — weight logged for inventory tracking.
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {[100,150,200,250,300,400,500].map(w=>(
          <button key={w} className="btn" onClick={()=>setVal(String(w))} style={{
            padding:"5px 10px",borderRadius:7,fontSize:12,
            background:val===String(w)?"var(--ember)":"var(--card)",
            color:"#fff",border:`1px solid ${val===String(w)?"var(--ember)":"var(--border)"}`}}>
            {w}g
          </button>
        ))}
      </div>
      <input type="number" value={val} onChange={e=>setVal(e.target.value)}
        placeholder="Enter grams..."
        style={{width:"100%",background:"var(--card)",
          border:`1px solid ${over?"#dc2626":"var(--border2)"}`,borderRadius:8,
          padding:"12px",fontSize:22,textAlign:"center",color:"#fff",outline:"none",
          fontFamily:"'DM Mono',monospace",marginBottom:6}}/>
      {over&&(
        <div style={{fontSize:10,color:"#f87171",textAlign:"center",marginBottom:6}}>
          ⚠ Exceeds available stock
        </div>
      )}
      <button className="btn" onClick={onConfirm}
        disabled={!val||parseFloat(val)<=0||over}
        style={{width:"100%",padding:12,borderRadius:10,fontSize:14,letterSpacing:1,
          background:(!val||parseFloat(val)<=0||over)?"#1a1a1a":"#991b1b",
          color:"#fff",opacity:(!val||parseFloat(val)<=0||over)?0.4:1}}>
        ADD {val?`${val}g`:""} (FREE)
      </button>
    </div>
  );
}
