import { useState } from "react";
import { PACKAGES, MEATS, DISHES, DRINKS, SIDES } from "../constants.js";
import { fc, ft } from "../helpers.js";
import { SecH, Empty } from "./ui/Misc.jsx";
import { TCM } from "./ui/TCM.jsx";

export function Reports({txns, voidLog, scpwdLog, leftLog, isManager}) {
  const [tab, setTab] = useState("zread");
  const TABS = [
    ["zread","Z-Read"],["analytics","📊 Analytics"],
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

        {/* SALES ANALYTICS */}
        {tab==="analytics"&&(
          <div>
            <SecH>📊 Sales Analytics</SecH>
            {txns.length===0&&<Empty icon="📊" label="No transaction data yet — complete some checkouts first"/>}
            {txns.length>0&&(
              <>
                {/* ── Revenue by Day ── */}
                {(()=>{
                  const byDay = {};
                  txns.forEach(t=>{
                    const d = new Date(t.closedAt).toLocaleDateString("en-PH",{month:"short",day:"numeric"});
                    byDay[d] = (byDay[d]||0) + t.finalBill;
                  });
                  const days = Object.entries(byDay);
                  const maxRev = Math.max(...days.map(d=>d[1]),1);
                  return (
                    <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:16,marginBottom:16}}>
                      <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Daily Revenue</div>
                      <div style={{display:"flex",alignItems:"flex-end",gap:4,height:140}}>
                        {days.map(([day,rev])=>(
                          <div key={day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                            <span className="mono" style={{fontSize:9,color:"var(--ember)"}}>{fc(rev)}</span>
                            <div style={{
                              width:"100%",maxWidth:48,borderRadius:"6px 6px 0 0",
                              background:"linear-gradient(180deg,#f97316 0%,#7c2d12 100%)",
                              height:`${Math.max(8,(rev/maxRev)*110)}px`,
                              transition:"height .3s",
                            }}/>
                            <span style={{fontSize:8,color:"var(--muted)",whiteSpace:"nowrap"}}>{day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Peak Hours + Best Sellers side by side ── */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>

                  {/* Peak Hours */}
                  {(()=>{
                    const byHour = {};
                    txns.forEach(t=>{
                      const h = new Date(t.closedAt).getHours();
                      if(!byHour[h]) byHour[h] = {count:0,rev:0};
                      byHour[h].count++;
                      byHour[h].rev += t.finalBill;
                    });
                    const hours = Array.from({length:24},(_,i)=>i);
                    const maxCount = Math.max(...hours.map(h=>byHour[h]?.count||0),1);
                    return (
                      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
                        <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>⏰ Peak Hours</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:2}}>
                          {hours.filter(h=>h>=10&&h<=21).map(h=>{
                            const d = byHour[h]||{count:0,rev:0};
                            const intensity = d.count/maxCount;
                            return (
                              <div key={h} style={{
                                textAlign:"center",padding:"6px 2px",borderRadius:6,
                                background: intensity>0.7?"#7c2d12":intensity>0.3?"#451a03":"var(--card)",
                                border:`1px solid ${intensity>0.7?"#f97316":intensity>0.3?"#92400e":"var(--border)"}`,
                              }}>
                                <div style={{fontSize:10,color:intensity>0.3?"var(--ember)":"var(--muted)",fontWeight:700}}>{h}:00</div>
                                <div className="hd" style={{fontSize:14,color:intensity>0.7?"#fff":intensity>0.3?"var(--ember)":"var(--muted2)",marginTop:2}}>{d.count}</div>
                                <div className="mono" style={{fontSize:8,color:"var(--muted)"}}>{d.rev>0?fc(d.rev):"—"}</div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{display:"flex",gap:10,marginTop:8,justifyContent:"center"}}>
                          {[["var(--card)","Quiet"],["#451a03","Moderate"],["#7c2d12","Peak"]].map(([bg,label])=>(
                            <div key={label} style={{display:"flex",alignItems:"center",gap:4}}>
                              <div style={{width:10,height:10,borderRadius:3,background:bg,border:"1px solid var(--border)"}}/>
                              <span style={{fontSize:8,color:"var(--muted)"}}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Best-Selling Items */}
                  {(()=>{
                    const counts = {};
                    txns.forEach(t=>{
                      t.orders?.filter(o=>!o.voided&&(o.type==="dish"||o.type==="drink")).forEach(o=>{
                        if(!counts[o.itemId]) counts[o.itemId] = {name:o.name,qty:0,rev:0,type:o.type};
                        counts[o.itemId].qty += (o.qty||1);
                        counts[o.itemId].rev += (o.price||0);
                      });
                    });
                    const items = Object.values(counts).sort((a,b)=>b.qty-a.qty).slice(0,10);
                    const topQty = items[0]?.qty||1;

                    const pkgCounts = {};
                    txns.forEach(t=>{
                      if(t.pkgId){
                        if(!pkgCounts[t.pkgId]) pkgCounts[t.pkgId] = {name:PACKAGES.find(p=>p.id===t.pkgId)?.name||t.pkgId,qty:0,rev:0};
                        pkgCounts[t.pkgId].qty += t.persons;
                        pkgCounts[t.pkgId].rev += (PACKAGES.find(p=>p.id===t.pkgId)?.price||0)*t.persons;
                      }
                    });
                    const pkgs = Object.values(pkgCounts).sort((a,b)=>b.qty-a.qty);

                    return (
                      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
                        <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>🏆 Best Sellers</div>
                        {pkgs.length>0&&(
                          <>
                            <div style={{fontSize:9,color:"#7c3aed",letterSpacing:1,marginBottom:6}}>PACKAGES</div>
                            {pkgs.map((p,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,padding:"4px 0"}}>
                                <span className="hd" style={{fontSize:12,color:"#7c3aed",width:20}}>{i+1}</span>
                                <span style={{flex:1,fontSize:11}}>{p.name}</span>
                                <span className="mono" style={{fontSize:10,color:"var(--muted)"}}>{p.qty} pax</span>
                                <span className="hd" style={{fontSize:11,color:"var(--ember)"}}>{fc(p.rev)}</span>
                              </div>
                            ))}
                            <div style={{height:1,background:"var(--border)",margin:"8px 0"}}/>
                          </>
                        )}
                        {items.length===0&&<div style={{fontSize:11,color:"var(--muted)",padding:"12px 0"}}>No à la carte orders yet</div>}
                        {items.length>0&&(
                          <>
                            <div style={{fontSize:9,color:"var(--ember)",letterSpacing:1,marginBottom:6}}>MENU ITEMS</div>
                            {items.map((item,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                                <span className="hd" style={{fontSize:12,color:i<3?"var(--ember)":"var(--muted)",width:20}}>{i+1}</span>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11}}>{item.type==="dish"?"🍜":"🥤"} {item.name}</div>
                                  <div style={{height:3,borderRadius:2,background:"var(--card)",marginTop:2}}>
                                    <div style={{height:"100%",borderRadius:2,width:`${(item.qty/topQty)*100}%`,
                                      background:i===0?"var(--ember)":i<3?"#ca8a04":"var(--muted2)",transition:"width .3s"}}/>
                                  </div>
                                </div>
                                <span className="mono" style={{fontSize:10,color:"var(--muted)",flexShrink:0}}>{item.qty}×</span>
                                <span className="hd" style={{fontSize:11,color:"var(--ember)",flexShrink:0}}>{fc(item.rev)}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* ── Payment Method Breakdown ── */}
                {(()=>{
                  const methods = {};
                  txns.forEach(t=>{
                    const m = (t.method||"cash").toUpperCase();
                    if(!methods[m]) methods[m] = {count:0,rev:0};
                    methods[m].count++;
                    methods[m].rev += t.finalBill;
                  });
                  return (
                    <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:16,marginBottom:16}}>
                      <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>💳 Payment Methods</div>
                      <div style={{display:"grid",gridTemplateColumns:`repeat(${Object.keys(methods).length},1fr)`,gap:10}}>
                        {Object.entries(methods).map(([m,d])=>(
                          <div key={m} style={{textAlign:"center",background:"var(--card)",borderRadius:10,padding:12,border:"1px solid var(--border)"}}>
                            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:1}}>{m}</div>
                            <div className="hd" style={{fontSize:20,color:"var(--ember)",marginTop:4}}>{d.count}</div>
                            <div className="mono" style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{fc(d.rev)}</div>
                            <div style={{fontSize:9,color:"var(--muted2)",marginTop:2}}>{(d.rev/totalRevenue*100).toFixed(0)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Meat Consumption Summary ── */}
                {isManager&&(()=>{
                  const meatUsage = {};
                  txns.forEach(t=>{
                    t.orders?.filter(o=>!o.voided&&o.type==="meat").forEach(o=>{
                      if(!meatUsage[o.itemId]) meatUsage[o.itemId] = {name:o.name,grams:0,orders:0};
                      meatUsage[o.itemId].grams += (o.weight_g||0);
                      meatUsage[o.itemId].orders++;
                    });
                  });
                  const meats = Object.values(meatUsage).sort((a,b)=>b.grams-a.grams);
                  const maxG = meats[0]?.grams||1;
                  return meats.length>0 ? (
                    <div style={{background:"var(--panel)",border:"1px solid #166534",borderRadius:12,padding:16}}>
                      <div style={{fontSize:10,color:"#4ade80",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>🥩 Meat Consumption</div>
                      {meats.map((m,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                          <span style={{fontSize:12,width:100}}>{m.name}</span>
                          <div style={{flex:1,height:18,background:"var(--card)",borderRadius:4,overflow:"hidden"}}>
                            <div style={{height:"100%",borderRadius:4,
                              width:`${(m.grams/maxG)*100}%`,
                              background:"linear-gradient(90deg,#dc2626,#f97316)",
                              display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:6
                            }}>
                              <span className="mono" style={{fontSize:9,color:"#fff",fontWeight:700}}>{(m.grams/1000).toFixed(1)}kg</span>
                            </div>
                          </div>
                          <span className="mono" style={{fontSize:10,color:"var(--muted)",width:40,textAlign:"right"}}>{m.orders}×</span>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
              </>
            )}
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
