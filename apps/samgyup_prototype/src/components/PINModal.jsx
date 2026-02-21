import { useState } from "react";
import { MANAGER_PIN } from "../constants.js";

export function PINModal({reason, onSuccess, onClose}) {
  const [pin,  setPin]  = useState("");
  const [shake,setShake]= useState(false);

  const addD = d => {
    if (pin.length >= 4) return;
    const np = pin + d;
    setPin(np);
    if (np.length === 4) {
      if (np === MANAGER_PIN) setTimeout(onSuccess, 100);
      else { setShake(true); setPin(""); setTimeout(()=>setShake(false), 400); }
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",
      alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:"var(--panel)",border:"1px solid #7c3aed55",borderRadius:16,
        padding:24,width:"100%",maxWidth:300}} className="fi">
        <div style={{textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:28}}>🔐</div>
          <div className="hd" style={{fontSize:16}}>Manager PIN</div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>{reason}</div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:18,
          animation:shake?"shake .4s":"none"}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:14,height:14,borderRadius:"50%",
              background:i<pin.length?"#7c3aed":"var(--border2)",
              transition:"background .15s"}}/>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
            <button key={i} className="btn"
              onClick={()=>d===""?null:d==="⌫"?setPin(p=>p.slice(0,-1)):addD(String(d))}
              style={{height:46,borderRadius:10,fontSize:d==="⌫"?18:16,
                background:d===""?"transparent":"var(--card)",
                color:d==="⌫"?"#f87171":"var(--text)",
                border:`1px solid ${d===""?"transparent":"var(--border)"}`,
                cursor:d===""?"default":"pointer"}}>
              {d}
            </button>
          ))}
        </div>
        <button className="btn" onClick={onClose} style={{width:"100%",background:"none",
          color:"var(--muted)",padding:"8px",borderRadius:8,fontSize:12}}>
          Cancel
        </button>
      </div>
    </div>
  );
}
