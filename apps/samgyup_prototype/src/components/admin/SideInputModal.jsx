import { useState } from "react";
import { SIDES_CATALOG } from "../../adminConstants.js";
import { ft } from "../../helpers.js";

export function SideInputModal({ sideId, sideStock, onAdjust, onClose }) {
  const side   = SIDES_CATALOG.find(s => s.id === sideId);
  const [amount,setAmount] = useState("");
  const [mode,  setMode]   = useState("add");
  const [note,  setNote]   = useState("");
  const [imgErr,setImgErr] = useState(false);

  if (!side) return null;
  const cur     = sideStock[sideId]?.current ?? 0;
  const history = sideStock[sideId]?.history ?? [];
  const parsed  = parseFloat(amount) || 0;
  const preview = mode==="add" ? cur+parsed : mode==="deduct" ? Math.max(0,cur-parsed) : parsed;
  const pct     = Math.min(100,Math.round((cur/side.par)*100));

  const commit = () => {
    if(!parsed && mode!=="set") return;
    const delta = mode==="add" ? parsed : mode==="deduct" ? -parsed : parsed-cur;
    onAdjust(sideId, delta, note||mode);
    setAmount(""); setNote("");
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.88)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:16,
    }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="pop" style={{
        background:"var(--panel)", border:"1px solid var(--border2)",
        borderRadius:20, width:"100%", maxWidth:440, overflow:"hidden",
        boxShadow:"0 40px 80px rgba(0,0,0,.7)",
      }}>
        {/* Hero */}
        <div style={{ position:"relative", height:160, background:"#111", overflow:"hidden" }}>
          {!imgErr ? (
            <img src={side.image} alt={side.name} onError={()=>setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover", filter:"brightness(.5) saturate(1.1)" }}/>
          ) : (
            <div style={{ width:"100%", height:"100%", background:"#111", display:"flex", alignItems:"center", justifyContent:"center", fontSize:64 }}>{side.icon}</div>
          )}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent,rgba(0,0,0,.85))" }}/>
          <div style={{ position:"absolute", bottom:12, left:16, right:16, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
            <div>
              <div className="hd" style={{ fontSize:22, color:"#fff" }}>{side.icon} {side.name}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.5)", marginTop:2 }}>Par: {side.par} {side.unit} · Current: {cur} {side.unit}</div>
            </div>
            <button onClick={onClose} style={{
              background:"rgba(0,0,0,.5)", border:"1px solid rgba(255,255,255,.15)",
              borderRadius:20, padding:"3px 10px", color:"rgba(255,255,255,.6)",
              fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding:"16px 18px" }}>
          {/* Stock bar */}
          <div style={{ marginBottom:16 }}>
            <div style={{ height:6, background:"var(--card2)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:pct>50?"#166534":pct>25?"#92400e":"#7f1d1d", borderRadius:3 }}/>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"var(--muted)", marginTop:4 }}>
              <span>{pct}% of par level</span>
              <span className="mono">{cur} / {side.par} {side.unit}</span>
            </div>
          </div>

          {/* Mode */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:12 }}>
            {[["add","➕ Add","#16a34a"],["deduct","➖ Deduct","#dc2626"],["set","📌 Set","#ca8a04"]].map(([m,l,c])=>(
              <button key={m} onClick={()=>setMode(m)} style={{
                padding:"7px", borderRadius:8, fontSize:11,
                background:mode===m?c+"22":"var(--card2)",
                color:mode===m?c:"var(--muted)",
                border:`1px solid ${mode===m?c+"44":"var(--border)"}`,
                cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:700,
              }}>{l}</button>
            ))}
          </div>

          {/* Quick presets */}
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
            {[1,2,5,10,20,50].map(p=>(
              <button key={p} onClick={()=>setAmount(String(p))} style={{
                padding:"5px 10px", borderRadius:7, fontSize:12,
                background:amount===String(p)?"var(--ember)":"var(--card2)",
                color:amount===String(p)?"#fff":"var(--text2)",
                border:`1px solid ${amount===String(p)?"var(--ember)":"var(--border)"}`,
                cursor:"pointer", fontFamily:"'DM Mono',monospace",
              }}>{p}</button>
            ))}
          </div>

          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
            placeholder={`Enter ${side.unit}...`}
            style={{ width:"100%", background:"var(--card2)", border:"1px solid var(--border2)", borderRadius:9, padding:"11px", fontSize:22, color:"#fff", outline:"none", fontFamily:"'DM Mono',monospace", textAlign:"center", marginBottom:8 }}/>

          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)..."
            style={{ width:"100%", background:"var(--card2)", border:"1px solid var(--border)", borderRadius:8, padding:"7px 12px", fontSize:12, color:"var(--text)", outline:"none", marginBottom:10 }}/>

          {parsed > 0 && (
            <div style={{ background:"var(--card2)", border:"1px solid var(--border2)", borderRadius:8, padding:"7px 12px", marginBottom:10, fontSize:11, display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:"var(--muted)" }}>Preview</span>
              <span className="mono">{cur} → <span style={{ color:"#fff", fontWeight:700 }}>{preview}</span> {side.unit}</span>
            </div>
          )}

          <button onClick={commit} disabled={!parsed&&mode!=="set"} style={{
            width:"100%",
            background:!parsed&&mode!=="set"?"var(--card2)":mode==="add"?"#166534":mode==="deduct"?"#7f1d1d":"#92400e",
            color:"#fff", padding:"12px", borderRadius:10,
            fontSize:14, fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:.5,
            cursor:!parsed&&mode!=="set"?"not-allowed":"pointer",
            opacity:!parsed&&mode!=="set"?0.4:1, border:"none",
          }}>
            {mode==="add"?"➕ ADD STOCK":mode==="deduct"?"➖ DEDUCT":"📌 SET VALUE"}
          </button>

          {/* Compact history */}
          {history.length > 0 && (
            <div style={{ marginTop:14, paddingTop:10, borderTop:"1px solid var(--border)" }}>
              <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Recent History</div>
              {history.slice(0,4).map((h,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"4px 0", borderBottom:"1px solid var(--border)", color:"var(--muted)" }}>
                  <span style={{ color:h.delta>0?"#4ade80":"#f87171" }}>{h.delta>0?"+":""}{h.delta} {side.unit}</span>
                  <span>{h.note||"—"}</span>
                  <span className="mono" style={{ fontSize:9 }}>{ft(h.time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
