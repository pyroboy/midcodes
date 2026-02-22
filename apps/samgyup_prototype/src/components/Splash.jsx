import { useState } from "react";
import { MANAGER_PIN } from "../constants.js";

export function Splash({onLogin}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("staff");
  const [pin,  setPin]  = useState("");
  const [step, setStep] = useState(1);
  const [shake,setShake]= useState(false);

  const attempt = () => {
    if (step === 1) {
      if (!name.trim()) return;
      if (role === "manager") { setStep(2); setPin(""); return; }
      onLogin({name: name.trim(), role});
    } else {
      if (pin === MANAGER_PIN) onLogin({name: name.trim(), role: "manager"});
      else { setShake(true); setPin(""); setTimeout(()=>setShake(false), 500); }
    }
  };

  const addD = d => { if (pin.length < 4) setPin(p => p + d); };

  const ROLES = [
    { id:"staff",   label:"👤 Staff",         desc:"Servers & Cashiers",   color:"#1d4ed8", gradient:"linear-gradient(135deg,#1d4ed8,#0284c7)" },
    { id:"manager", label:"👑 Manager",       desc:"Admin Access",         color:"#7c3aed", gradient:"linear-gradient(135deg,#7c3aed,#4f46e5)" },
    { id:"kitchen", label:"🍳 Kitchen Staff", desc:"BOH Team",             color:"#b45309", gradient:"linear-gradient(135deg,#b45309,#92400e)" },
  ];

  return (
    <div className="splash">
      <div className="splash-bg"/>
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:380,background:"var(--panel)",
        border:"1px solid var(--border2)",borderRadius:20,padding:32,
        boxShadow:"0 32px 80px rgba(0,0,0,.6)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48}}>🔥</div>
          <div className="hd" style={{fontSize:32,color:"var(--ember)",letterSpacing:2}}>WTF! SAMGYUP</div>
          <div className="mono" style={{fontSize:11,color:"var(--muted)",letterSpacing:4}}>RESTAURANT POS</div>
          <div style={{width:40,height:2,background:"var(--ember)",margin:"12px auto 0",borderRadius:2}}/>
        </div>

        {step===1&&(
          <>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Your Name</div>
              <input value={name} onChange={e=>setName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&attempt()}
                placeholder="Enter your name..." autoFocus
                style={{width:"100%",background:"var(--card)",border:"1px solid var(--border2)",
                  borderRadius:10,padding:"12px 14px",fontSize:15,color:"var(--text)",outline:"none"}}/>
            </div>
            <div style={{marginBottom:24}}>
              <div style={{fontSize:10,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Role</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {ROLES.map(r=>(
                  <button key={r.id} className="btn" onClick={()=>setRole(r.id)} style={{
                    display:"flex",alignItems:"center",gap:10,
                    padding:"10px 14px",borderRadius:10,fontSize:13,textAlign:"left",
                    background:role===r.id?r.gradient:"var(--card)",
                    color:"#fff",
                    border:`1px solid ${role===r.id?r.color:"var(--border)"}`,
                  }}>
                    <span style={{fontSize:18}}>{r.label.split(" ")[0]}</span>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>{r.label.slice(r.label.indexOf(" ")+1)}</div>
                      <div style={{fontSize:9,opacity:.7,marginTop:1}}>{r.desc}</div>
                    </div>
                    {role===r.id&&<span style={{marginLeft:"auto",fontSize:14}}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn" onClick={attempt} disabled={!name.trim()} style={{
              width:"100%",background:!name.trim()?"var(--card)":"var(--ember)",
              color:"#fff",padding:"14px",borderRadius:12,fontSize:15,letterSpacing:1,
              opacity:!name.trim()?0.5:1}}>
              {role==="manager"?"CONTINUE →":"START SHIFT"}
            </button>
          </>
        )}

        {step===2&&(
          <>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:12,color:"var(--muted)"}}>Manager PIN Required</div>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:18,
              animation:shake?"shake .4s":"none"}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:16,height:16,borderRadius:"50%",
                  background:i<pin.length?"var(--ember)":"var(--border2)",
                  transition:"background .15s"}}/>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
                <button key={i} className="btn"
                  onClick={()=>d===""?null:d==="⌫"?setPin(p=>p.slice(0,-1)):addD(String(d))}
                  style={{height:52,borderRadius:12,fontSize:d==="⌫"?20:18,
                    background:d===""?"transparent":"var(--card)",
                    color:d==="⌫"?"#f87171":"var(--text)",
                    border:`1px solid ${d===""?"transparent":"var(--border)"}`,
                    cursor:d===""?"default":"pointer"}}>
                  {d}
                </button>
              ))}
            </div>
            <button className="btn" onClick={attempt} disabled={pin.length<4} style={{
              width:"100%",background:pin.length<4?"var(--card)":"#7c3aed",
              color:"#fff",padding:"13px",borderRadius:12,fontSize:14,letterSpacing:1,
              opacity:pin.length<4?0.4:1,marginBottom:10}}>
              VERIFY PIN
            </button>
            <button className="btn" onClick={()=>{setStep(1);setPin("");}} style={{
              width:"100%",background:"none",color:"var(--muted)",padding:"8px",borderRadius:8,fontSize:12}}>
              ← Back
            </button>
          </>
        )}
      </div>
      <div style={{position:"absolute",bottom:16,fontSize:10,color:"var(--muted2)",
        letterSpacing:2,textTransform:"uppercase"}}>
        hint: manager pin is 1234
      </div>
    </div>
  );
}
