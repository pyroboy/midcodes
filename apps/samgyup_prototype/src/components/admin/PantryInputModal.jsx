import { useState, useRef } from "react";
import { PANTRY_CATALOG } from "../../adminConstants.js";
import { ft } from "../../helpers.js";

export function PantryInputModal({ pantryId, pantryStock, onAdjust, onClose }) {
  const item      = PANTRY_CATALOG.find(p => p.id === pantryId);
  const [amount,  setAmount]  = useState("");
  const [mode,    setMode]    = useState("add");
  const [note,    setNote]    = useState("");
  const [image,   setImage]   = useState(null);
  const fileRef   = useRef(null);

  if (!item) return null;

  const cur       = pantryStock[item.id]?.current ?? 0;
  const history   = pantryStock[item.id]?.history ?? [];
  const parsed    = parseFloat(amount) || 0;
  const previewVal = mode === "add" ? cur + parsed : mode === "deduct" ? Math.max(0, cur - parsed) : parsed;

  const commit = () => {
    if (!parsed && mode !== "set") return;
    const delta = mode === "add" ? parsed : mode === "deduct" ? -parsed : parsed - cur;
    onAdjust(item.id, delta, note || mode, image);
    setAmount(""); setNote(""); setImage(null);
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const PRESETS = [1, 2, 5, 10, 20];

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.88)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:16,
    }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="pop" style={{
        background:"var(--panel)", border:"1px solid var(--border2)",
        borderRadius:20, width:"100%", maxWidth:480, overflow:"hidden",
        boxShadow:"0 40px 80px rgba(0,0,0,.7)",
      }}>

        {/* ── HEADER ── */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:32, background:"var(--card)", width:48, height:48, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid var(--border)" }}>
              {item.icon}
            </div>
            <div>
              <div className="hd" style={{ fontSize:20 }}>{item.name}</div>
              <div style={{ fontSize:12, color:"var(--muted)", display:"flex", gap:8 }}>
                <span>{item.category}</span>
                <span>·</span>
                <span>₱{item.cost}/{item.unit}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:"var(--card2)", border:"1px solid var(--border)",
            borderRadius:20, padding:"6px 12px", color:"var(--muted)",
            fontSize:13, cursor:"pointer",
          }}>✕ Close</button>
        </div>

        <div style={{ padding:"20px", background:"var(--app-bg)" }}>

          {/* Mode picker */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, fontWeight:600 }}>Action</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[["add","➕ Add","#16a34a","#052e16"],["deduct","➖ Deduct","#dc2626","#450a0a"],["set","📌 Set","#ca8a04","#451a03"]].map(([m,l,c,bg])=>(
                <button key={m} onClick={()=>setMode(m)} style={{
                  padding:"10px 4px", borderRadius:10, fontSize:12,
                  background: mode===m ? bg : "var(--card)",
                  color: mode===m ? c : "var(--muted)",
                  border:`1px solid ${mode===m?c+"44":"var(--border)"}`,
                  cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:700,
                  transition:"all .15s"
                }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {/* Amount presets */}
            <div>
              <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, fontWeight:600 }}>Presets ({item.unit})</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {PRESETS.map(p => (
                  <button key={p} onClick={() => setAmount(String(p))} style={{
                    padding:"6px 12px", borderRadius:8,
                    background: amount===String(p) ? "var(--ember)" : "var(--card)",
                    color: amount===String(p) ? "#fff" : "var(--text2)",
                    border:`1px solid ${amount===String(p)?"var(--ember)":"var(--border)"}`,
                    fontSize:13, cursor:"pointer", fontFamily:"'DM Mono',monospace",
                  }}>{p}</button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8, fontWeight:600 }}>Amount</div>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                placeholder={`0 ${item.unit}`}
                style={{
                  width:"100%", background:"var(--card)",
                  border:"1px solid var(--border)", borderRadius:8,
                  padding:"12px 14px", fontSize:24, color:"#fff", outline:"none",
                  fontFamily:"'DM Mono',monospace", textAlign:"center",
                }}/>
            </div>
          </div>

          <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"2fr 1fr", gap:12 }}>
            <input value={note} onChange={e=>setNote(e.target.value)}
              placeholder="Reason for adjustment..."
              style={{
                width:"100%", background:"var(--card)",
                border:"1px solid var(--border)", borderRadius:8,
                padding:"10px 14px", fontSize:13, color:"var(--text)",
                outline:"none",
              }}/>
            
            <div>
              <input type="file" ref={fileRef} onChange={handleFileChange} accept="image/*" style={{display:"none"}} />
              <button onClick={() => fileRef.current?.click()} style={{
                width:"100%", background: image ? "#1e3a8a" : "var(--card)",
                border:`1px solid ${image?"#3b82f6":"var(--border)"}`, borderRadius:8,
                padding:"10px", fontSize:13, color:image?"#bfdbfe":"var(--muted)",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6
              }}>
                {image ? "📷 Attached" : "📷 Attach pic"}
              </button>
            </div>
          </div>

          {image && (
            <div style={{ marginTop:12, position:"relative", borderRadius:8, overflow:"hidden", border:"1px solid var(--border)", height:120 }}>
              <img src={image} alt="upload preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              <button onClick={()=>setImage(null)} style={{
                position:"absolute", top:6, right:6, background:"rgba(0,0,0,.7)",
                border:"none", color:"#fff", fontSize:10, padding:"4px 8px", borderRadius:4, cursor:"pointer"
              }}>Remove</button>
            </div>
          )}

          {/* Preview + confirm */}
          <div style={{ marginTop:24 }}>
            {parsed > 0 && (
              <div style={{ background:"var(--card)", border:"1px solid var(--border2)", borderRadius:10, padding:"12px 16px", marginBottom:12, fontSize:13 }}>
                <div style={{ display:"flex", justifyContent:"space-between", color:"var(--muted)", marginBottom:4 }}>
                  <span>Current Stock</span><span className="mono">{cur} {item.unit}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px dashed var(--border)", paddingTop:8 }}>
                  <span style={{ color: mode==="add"?"#4ade80":mode==="deduct"?"#f87171":"#fbbf24", fontWeight:600 }}>
                    {mode==="add"?"+":mode==="deduct"?"-":"="} {parsed} {item.unit}
                  </span>
                  <span className="mono" style={{ color:"#fff", fontWeight:700, fontSize:16 }}>→ {previewVal} {item.unit}</span>
                </div>
              </div>
            )}

            <button onClick={commit} disabled={!parsed && mode !== "set"} style={{
              width:"100%",
              background: !parsed && mode!=="set" ? "var(--border)" : mode==="add"?"#166534":mode==="deduct"?"#7f1d1d":"#92400e",
              color:!parsed&&mode!=="set"?"var(--muted)":"#fff", padding:"14px", borderRadius:12,
              fontSize:15, fontFamily:"'Syne',sans-serif", fontWeight:700,
              letterSpacing:.5, cursor:!parsed&&mode!=="set"?"not-allowed":"pointer",
              border:"none", transition:"all .2s"
            }}>
              {mode==="add"?"➕ CONFIRM ADDITION":mode==="deduct"?"➖ CONFIRM DEDUCTION":"📌 CONFIRM OVERRIDE"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
