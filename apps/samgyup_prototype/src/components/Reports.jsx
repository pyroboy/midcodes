import { useState } from "react";
import { PACKAGES, MEATS } from "../constants.js";
import { fc, ft } from "../helpers.js";
import { SecH, Empty } from "./ui/Misc.jsx";
import { TCM } from "./ui/TCM.jsx";

export function Reports({txns, voidLog, scpwdLog, leftLog, isManager}) {
  const [tab, setTab] = useState("zread");
  const TABS = [
    ["zread","Z-Read"],["meatyield","Meat Yield"],
    ["voids","Void Audit"],["scpwd","SC/PWD"],["leftover","Leftover"],
  ];

  const totalRevenue = txns.reduce((s,t)=>s+t.finalBill, 0);
  const totalVoided  = voidLog.reduce((s,v)=>s+(v.price||0), 0);
  const totalPax     = txns.reduce((s,t)=>s+t.persons, 0);
  const totalMeatG   = txns.reduce((s,t)=>s+t.meatG, 0);

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}} className="fi">
      {/* Tab bar */}
      <div style={{background:"var(--panel)",borderBottom:"1px solid var(--border)",
        padding:"10px 16px",display:"flex",gap:6,flexShrink:0}}>
        {TABS.map(([v,l])=>(
          <button key={v} className="btn" onClick={()=>setTab(v)} style={{
            background:tab===v?"var(--ember)":"transparent",color:tab===v?"#fff":"var(--muted)",
            padding:"5px 12px",borderRadius:8,fontSize:12,letterSpacing:0.5}}>
            {l}
            {v==="voids"&&voidLog.length>0&&(
              <span style={{marginLeft:5,background:"#dc2626",borderRadius:10,padding:"1px 5px",fontSize:9}}>
                {voidLog.length}
              </span>
            )}
          </button>
        ))}
        {!isManager&&(
          <span style={{marginLeft:"auto",fontSize:10,color:"var(--muted)",alignSelf:"center"}}>
            ⚠ Limited view (Staff)
          </span>
        )}
      </div>

      <div style={{flex:1,overflow:"auto",padding:20}} className="scr">

        {/* Z-READ */}
        {tab==="zread"&&(
          <div>
            <SecH>Z-Reading — {new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</SecH>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
              {[
                ["Gross Sales",  fc(totalRevenue+totalVoided),  "#16a34a"],
                ["Voids / Returns",fc(totalVoided),             "#dc2626"],
                ["Net Sales",    fc(totalRevenue),               "#f97316"],
                ["Total Tables", txns.length,                   "#6366f1"],
                ["Total Pax",    totalPax,                      "#0891b2"],
                ["Avg per Table",txns.length?fc(totalRevenue/txns.length):fc(0),"#ca8a04"],
              ].map(([l,v,c])=>(
                <div key={l} style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:14}}>
                  <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                  <div className="hd" style={{fontSize:20,color:c,marginTop:4}}>{v}</div>
                </div>
              ))}
            </div>
            {isManager&&(
              <div style={{background:"var(--panel)",border:"1px solid #166534",borderRadius:12,padding:14,marginBottom:16}}>
                <div style={{fontSize:10,color:"#4ade80",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>
                  📊 Manager COGS Summary
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[
                    ["Total Meat Out", totalMeatG+"g",       "#f97316"],
                    ["Avg g/Pax",      totalPax?Math.round(totalMeatG/totalPax)+"g":"—","#f97316"],
                    ["Est. Revenue",   fc(totalRevenue),      "#16a34a"],
                  ].map(([l,v,c])=>(
                    <div key={l}>
                      <div style={{fontSize:10,color:"var(--muted)"}}>{l}</div>
                      <div className="hd" style={{fontSize:18,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {txns.length===0&&<Empty icon="📋" label="No transactions yet"/>}
            {[...txns].reverse().map((t,i)=>(
              <div key={i} style={{background:"var(--panel)",border:"1px solid var(--border)",
                borderRadius:10,padding:"10px 14px",marginBottom:5,display:"flex",alignItems:"center",gap:12}}>
                <span className="hd" style={{fontSize:18,color:"var(--ember)",minWidth:44}}>{t.tableLabel}</span>
                <div style={{flex:1,fontSize:11,color:"var(--muted)"}}>
                  {t.persons} pax · {PACKAGES.find(p=>p.id===t.pkgId)?.name} · {t.meatG}g · {ft(t.closedAt)}
                  {t.closedBy&&` · ${t.closedBy}`}
                </div>
                <TCM label={t.method?.toUpperCase()} bg="var(--card)" c="var(--muted)"/>
                <span className="hd" style={{fontSize:18}}>{fc(t.finalBill)}</span>
              </div>
            ))}
          </div>
        )}

        {/* MEAT YIELD */}
        {tab==="meatyield"&&(
          <div>
            <SecH>Meat Yield vs Revenue</SecH>
            {!isManager&&(
              <div style={{background:"#1a0f05",border:"1px solid var(--edim)",borderRadius:10,
                padding:12,marginBottom:16,fontSize:12,color:"#fca5a5"}}>
                🔒 COGS data visible to managers only
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
              {MEATS.map(m=>{
                const g = txns.reduce((s,t)=>s+
                  t.orders.filter(o=>o.itemId===m.id&&!o.voided)
                    .reduce((a,o)=>a+(o.weight_g||0),0),0);
                const paxCount = txns.reduce((s,t)=>s+(g>0?t.persons:0),0);
                return (
                  <div key={m.id} style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:14}}>
                    <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>🥩 {m.name}</div>
                    <div className="hd" style={{fontSize:22,color:"var(--ember)"}}>{g}g</div>
                    <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{paxCount?Math.round(g/paxCount)+"g/pax":"—"}</div>
                    {isManager&&<div className="mono" style={{fontSize:10,color:"#ca8a04",marginTop:4}}>≈{fc((g/100)*m.cost_per_100g)} COGS</div>}
                  </div>
                );
              })}
            </div>
            {txns.length===0&&<Empty icon="🥩" label="No transactions to analyze"/>}
          </div>
        )}

        {/* VOID AUDIT */}
        {tab==="voids"&&(
          <div>
            <SecH>Void & Exception Audit</SecH>
            {voidLog.length===0&&<Empty icon="✅" label="No voids recorded"/>}
            {voidLog.map((v,i)=>(
              <div key={i} style={{background:"var(--panel)",border:"1px solid #450a0a",
                borderRadius:10,padding:"10px 14px",marginBottom:5,display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{v.itemName}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>
                    {v.tableLabel} · by {v.voidedBy} · approved by {v.approvedBy} · {ft(v.time)}
                  </div>
                  {v.reason&&<div style={{fontSize:10,color:"#fca5a5"}}>{v.reason}</div>}
                </div>
                <span className="hd" style={{fontSize:15,color:"#f87171"}}>{v.price>0?fc(v.price):"free"}</span>
              </div>
            ))}
            {isManager&&voidLog.length>0&&(
              <div style={{marginTop:12,fontSize:11,color:"var(--muted)"}}>
                Total voided value: <span style={{color:"#f87171",fontWeight:700}}>{fc(totalVoided)}</span>
              </div>
            )}
          </div>
        )}

        {/* SC/PWD */}
        {tab==="scpwd"&&(
          <div>
            <SecH>Senior Citizen / PWD Discount Log</SecH>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:14}}>
              BIR-required audit trail for all tax-exempt transactions.
            </div>
            {scpwdLog.length===0&&<Empty icon="📄" label="No SC/PWD discounts applied"/>}
            {scpwdLog.map((e,i)=>(
              <div key={i} style={{background:"var(--panel)",border:"1px solid var(--border)",
                borderRadius:10,padding:"12px 14px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:600}}>{e.customerName||"—"}</span>
                    <span style={{fontSize:11,color:"var(--muted)",marginLeft:8}}>ID: {e.idNumber||"—"}</span>
                  </div>
                  <TCM label={e.discountType==="senior"?"SENIOR":"PWD"} bg="#451a03" c="var(--ember)"/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,fontSize:12}}>
                  {[
                    ["Gross",   fc(e.grossAmount),  "var(--text)"],
                    ["Discount",fc(e.discountAmt),  "#4ade80"],
                    ["Net",     fc(e.netAmount),     "var(--ember)"],
                  ].map(([l,v,c])=>(
                    <div key={l}>
                      <div style={{fontSize:9,color:"var(--muted)"}}>{l}</div>
                      <div className="hd" style={{fontSize:15,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:6}}>
                  {e.tableLabel} · {e.cashier} · {ft(e.time)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEFTOVER */}
        {tab==="leftover"&&(
          <div>
            <SecH>Leftover / Penalty Fee Log</SecH>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:14}}>
              Tracks ₱200/head leftover penalty charges to prevent staff from pocketing fees.
            </div>
            {leftLog.length===0&&<Empty icon="🍖" label="No leftover penalties recorded"/>}
            {leftLog.map((e,i)=>(
              <div key={i} style={{background:"var(--panel)",border:"1px solid var(--border)",
                borderRadius:10,padding:"12px 14px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span className="hd" style={{fontSize:16,color:"var(--ember)"}}>{e.tableLabel}</span>
                  {e.overrideBy&&<TCM label="MANAGER OVERRIDE" bg="#451a03" c="#fca5a5"/>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {[
                    ["Persons", e.persons,              "#fff"],
                    ["Leftover",e.gramsLeftover+"g",    "#f87171"],
                    ["Penalty", fc(e.penalty),          "var(--ember)"],
                  ].map(([l,v,c])=>(
                    <div key={l}>
                      <div style={{fontSize:9,color:"var(--muted)"}}>{l}</div>
                      <div className="hd" style={{fontSize:15,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:6}}>
                  {e.cashier} · {ft(e.time)}{e.overrideBy&&` · override by ${e.overrideBy}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
