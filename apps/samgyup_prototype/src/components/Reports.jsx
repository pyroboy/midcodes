import { useState } from "react";
import { PACKAGES } from "../constants.js";
import { fc, ft } from "../helpers.js";
import { SecH, Empty } from "./ui/Misc.jsx";
import { TCM } from "./ui/TCM.jsx";
import { 
  getZCounter, getGrandAccumulatedTotal, generateESalesData, getAuditLog,
  incrementZCounter, updateGrandAccumulatedTotal, getBIRSettings, addAuditLog
} from "../birSettings.js";

function ReceiptPreview({ txn, receiptNo, onClose }) {
  if (!txn) return null;
  const settings = getBIRSettings();
  const isSCPWD = txn.disc?.type === "senior" || txn.disc?.type === "pwd";
  
  const bill = Array.isArray(txn.orders) ? txn.orders.reduce((s, o) => s + (!o.voided && o.price ? o.price : 0), 0) : 0;
  const discAmt = isSCPWD ? bill * 0.2 : txn.disc?.type === "promo10" ? bill * 0.1 : 0;
  const leftPenalty = txn.leftover?.applied && !txn.leftover?.override ? txn.leftover.penalty : 0;
  const finalBill = txn.finalBill || (bill - discAmt + leftPenalty);

  const vatable = isSCPWD ? 0 : finalBill / 1.12;
  const vat = isSCPWD ? 0 : finalBill - vatable;
  const exempt = isSCPWD ? finalBill : 0;

  const d = new Date(txn.closedAt || Date.now());
  const orNumber = `OR-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(receiptNo).padStart(4, "0")}`;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:150,padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",color:"#000",padding:"20px 24px",borderRadius:8,width:"100%",maxWidth:340,fontFamily:"'Courier New', monospace",fontSize:12,maxHeight:"90vh",overflow:"auto"}}>
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontSize:16,fontWeight:"bold"}}>{settings.businessName}</div>
          <div>{settings.businessAddress}</div>
          <div>VAT REG TIN: {settings.tin}</div>
          <div>MIN: {settings.machineSerialNumber || "N/A"}</div>
        </div>
        <div style={{borderBottom:"1px dashed #000",paddingBottom:8,marginBottom:8}}>
          <div>Receipt No: {orNumber}</div>
          <div>Date: {d.toLocaleString("en-PH")}</div>
          <div>Table: {txn.tableLabel} | Pax: {txn.persons}</div>
          <div>Cashier: {txn.closedBy || "System"}</div>
        </div>
        <div style={{minHeight:100}}>
          {Array.isArray(txn.orders) && txn.orders.filter(o=>!o.voided).map((o,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}>
              <span>{o.qty||1}x {o.name.substring(0,18)}</span>
              <span>{o.price>0 ? fc(o.price) : "0.00"}</span>
            </div>
          ))}
          {discAmt > 0 && <div style={{display:"flex",justifyContent:"space-between",color:"#444",marginTop:4}}><span>Discount ({txn.disc?.type})</span><span>-{fc(discAmt)}</span></div>}
          {leftPenalty > 0 && <div style={{display:"flex",justifyContent:"space-between",color:"#444",marginTop:4}}><span>Leftover Penalty</span><span>{fc(leftPenalty)}</span></div>}
        </div>
        <div style={{borderTop:"1px dashed #000",borderBottom:"1px dashed #000",padding:"8px 0",margin:"8px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:"bold",fontSize:14}}>
            <span>TOTAL DUE</span><span>{fc(finalBill)}</span>
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>VATable Sales</span><span>{fc(vatable)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>VAT Amount (12%)</span><span>{fc(vat)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>VAT Exempt Sales</span><span>{fc(exempt)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span>Zero Rated Sales</span><span>0.00</span></div>
        </div>
        <div style={{textAlign:"center",fontSize:10,color:"#666",marginTop:20}}>
          <div>PTU No: {settings.ptuNumber || "N/A"}</div>
          <div style={{marginTop:8,fontSize:9}}>{settings.footerText}</div>
        </div>
        <button onClick={onClose} style={{width:"100%",marginTop:16,padding:10,background:"#222",color:"#fff",border:"none",borderRadius:6,cursor:"pointer"}}>Close Preview</button>
      </div>
    </div>
  );
}

export function Reports({txns, voidLog, scpwdLog, leftLog, isManager}) {
  const [tab, setTab] = useState("xread");
  const [previewTxn, setPreviewTxn] = useState(null);
  
  // For eSales Export
  const [esYear, setEsYear] = useState(new Date().getFullYear());
  const [esMonth, setEsMonth] = useState(new Date().getMonth() + 1);

  const TABS = [
    ["xread","X-Read"],["zread","Z-Read"],["analytics","📊 Analytics"],
    ["voids"," voids"],["scpwd","SC/PWD"],["leftover","Leftover"],
    ["audit","Audit"],["esales","eSales"]
  ];

  const zCounter = getZCounter();
  const grandTotal = getGrandAccumulatedTotal();
  const auditLogs = getAuditLog(100);
  
  // Aggregate stats based on ALL txns for Analytics
  const totalRevenue = txns.reduce((s,t)=>s+t.finalBill, 0);
  const totalVoided  = voidLog.reduce((s,v)=>s+(v.price||0), 0);
  const totalPax     = txns.reduce((s,t)=>s+t.persons, 0);
  const totalMeatG   = txns.reduce((s,t)=>s+t.meatG, 0);

  // For X-read and Z-read, we compute from "today's" transactions.
  // In a robust POS, Z-Read sets a flag, but here we just filter by the current day.
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  // Add sequential receipt number to txns for preview UI logic.
  const txnsWithRecv = txns.map((t, i) => ({ ...t, _receiptNo: i + 1 }));
  const todaysTxns = txnsWithRecv.filter(t => t.closedAt >= todayStart.getTime());

  let dailyGross = 0;
  let dailyDiscounts = 0;
  let dailyVatable = 0;
  let dailyVatAmount = 0;
  let dailyVatExempt = 0;
  let dailyNet = 0;

  todaysTxns.forEach(t => {
    const isSCPWD = t.disc?.type === "senior" || t.disc?.type === "pwd";
    const bill = Array.isArray(t.orders) ? t.orders.reduce((s, o) => s + (!o.voided && o.price ? o.price : 0), 0) : 0;
    const discAmt = isSCPWD ? bill * 0.2 : t.disc?.type === "promo10" ? bill * 0.1 : 0;
    const leftPenalty = t.leftover?.applied && !t.leftover?.override ? t.leftover.penalty : 0;
    const finalBill = t.finalBill || (bill - discAmt + leftPenalty);

    dailyGross += (bill + leftPenalty);
    dailyDiscounts += discAmt;
    dailyNet += finalBill;
    
    if (isSCPWD) {
      dailyVatExempt += finalBill;
    } else {
      const v = finalBill / 1.12;
      dailyVatable += v;
      dailyVatAmount += (finalBill - v);
    }
  });

  const dailyVoids = voidLog.filter(v => v.time >= todayStart.getTime()).reduce((s,v)=>s+(v.price||0), 0);
  const beginningOR = todaysTxns.length > 0 ? todaysTxns[0]._receiptNo : 0;
  const endingOR = todaysTxns.length > 0 ? todaysTxns[todaysTxns.length - 1]._receiptNo : 0;

  const handlePerformZRead = () => {
    if(!isManager) return alert("Manager permission required.");
    if(todaysTxns.length === 0) return alert("No transactions today to Z-Read.");
    if(confirm("Are you sure you want to perform a Z-Reading? This will increment the Z-Counter and log the day's sales.")) {
      const newZ = incrementZCounter();
      updateGrandAccumulatedTotal(dailyNet);
      addAuditLog({ 
        itemName: "Z-Reading Performed", 
        category: "System", 
        delta: 0, 
        unit: "", 
        note: `Z-Counter: ${newZ}, Net Sales: ${fc(dailyNet)}, ORs: ${beginningOR}-${endingOR}` 
      });
      alert(`Z-Reading successful! New Z-Counter: ${newZ}`);
      setTab("xread");
    }
  };

  const handleExportESales = () => {
    if(!isManager) return alert("Manager permission required.");
    const data = generateESalesData(esYear, esMonth, txns);
    const content = JSON.stringify(data, null, 2);
    // Simple text download
    const blob = new Blob([content], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `esales_${esYear}_${esMonth}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const RenderReading = ({ isZ }) => (
    <div>
      <SecH>{isZ ? "Z-Reading (End of Day)" : "X-Reading (Mid-Day)"} — {new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</SecH>
      {isZ && (
        <div style={{background:"var(--panel)",border:"1px solid #92400e",borderRadius:12,padding:16,marginBottom:20}}>
          <div style={{fontSize:14,color:"#fde68a",marginBottom:10}}>⚠️ Perform Z-Reading to finalize today's sales and increment the Z-Counter. </div>
          <button className="btn" onClick={handlePerformZRead} style={{background:"#b45309",color:"#fff",padding:"10px 20px",borderRadius:8,fontWeight:"bold",border:"none"}}>
            Execute Z-Reading now
          </button>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {[
          ["Gross Sales", fc(dailyGross), "#fff"],
          ["Voids / Refunds", fc(dailyVoids), "#fca5a5"],
          ["Discounts (SC/PWD)", fc(dailyDiscounts), "#fde047"],
          ["VATable Sales", fc(dailyVatable), "#bae6fd"],
          ["VAT Amount (12%)", fc(dailyVatAmount), "#bae6fd"],
          ["VAT Exempt Sales", fc(dailyVatExempt), "#bae6fd"],
          ["Net Sales", fc(dailyNet), "#4ade80"],
          ["Grand Acc. Total", fc(grandTotal + (isZ?0:dailyNet)), "#c084fc"],
          ["Z-Counter", zCounter, "#f9a8d4"],
          ["Beginning OR", String(beginningOR).padStart(4,"0"), "#fff"],
          ["Ending OR", String(endingOR).padStart(4,"0"), "#fff"],
          ["Total Txns", todaysTxns.length, "#fff"]
        ].map(([l,v,c], i)=>(
          <div key={i} style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:14}}>
            <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1}}>{l}</div>
            <div className="hd" style={{fontSize:18,color:c,marginTop:4}}>{v}</div>
          </div>
        ))}
      </div>

      <SecH>Today's Transactions</SecH>
      {todaysTxns.length===0&&<Empty icon="📋" label="No transactions today"/>}
      {[...todaysTxns].reverse().map((t,i)=>(
        <div key={i} onClick={()=>setPreviewTxn(t)} 
          style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",marginBottom:5,display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"background 0.2s"}}
          onMouseEnter={e=>e.currentTarget.style.background="var(--card)"}
          onMouseLeave={e=>e.currentTarget.style.background="var(--panel)"}>
          <span className="hd" style={{fontSize:16,color:"var(--ember)",minWidth:60}}>OR-{String(t._receiptNo).padStart(4,"0")}</span>
          <span className="hd" style={{fontSize:15,color:"#fff",minWidth:44}}>{t.tableLabel}</span>
          <div style={{flex:1,fontSize:11,color:"var(--muted)"}}>
            {t.persons} pax · {t.meatG}g · {ft(t.closedAt)} {t.closedBy&&`· ${t.closedBy}`}
          </div>
          <TCM label={t.method?.toUpperCase()} bg="var(--card)" c="var(--muted)"/>
          <span className="hd" style={{fontSize:16}}>{fc(t.finalBill)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}} className="fi">
      {previewTxn && <ReceiptPreview txn={previewTxn} receiptNo={previewTxn._receiptNo} onClose={()=>setPreviewTxn(null)}/>}

      {/* Tab bar */}
      <div style={{background:"var(--panel)",borderBottom:"1px solid var(--border)",padding:"10px 16px",display:"flex",gap:6,flexShrink:0,overflowX:"auto"}} className="scr">
        {TABS.map(([v,l])=>(
          <button key={v} className="btn" onClick={()=>setTab(v)} style={{
            background:tab===v?"var(--ember)":"transparent",color:tab===v?"#fff":"var(--muted)",
            padding:"6px 14px",borderRadius:8,fontSize:12,letterSpacing:0.5,whiteSpace:"nowrap"}}>
            {l}
            {v==="voids"&&voidLog.length>0&&(<span style={{marginLeft:5,background:"#dc2626",borderRadius:10,padding:"1px 5px",fontSize:9}}>{voidLog.length}</span>)}
          </button>
        ))}
        {!isManager&&(<span style={{marginLeft:"auto",fontSize:10,color:"var(--muted)",alignSelf:"center",whiteSpace:"nowrap"}}>⚠ Limited (Staff)</span>)}
      </div>

      <div style={{flex:1,overflow:"auto",padding:20}} className="scr">
        {tab==="xread" && <RenderReading isZ={false} />}
        {tab==="zread" && <RenderReading isZ={true} />}

        {/* SALES ANALYTICS */}
        {tab==="analytics"&&(
          <div>
            <SecH>📊 Sales Analytics (All Time)</SecH>
            {txns.length===0&&<Empty icon="📊" label="No transaction data yet"/>}
            {txns.length>0&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
                   <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:10,padding:14}}>
                     <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase"}}>Total Revenue</div>
                     <div className="hd" style={{fontSize:20,color:"#4ade80",marginTop:4}}>{fc(totalRevenue)}</div>
                   </div>
                   <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:10,padding:14}}>
                     <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase"}}>Total Pax</div>
                     <div className="hd" style={{fontSize:20,color:"#0891b2",marginTop:4}}>{totalPax}</div>
                   </div>
                   <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:10,padding:14}}>
                     <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase"}}>Total Voids</div>
                     <div className="hd" style={{fontSize:20,color:"#f87171",marginTop:4}}>{fc(totalVoided)}</div>
                   </div>
                   <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:10,padding:14}}>
                     <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase"}}>Meat Consumption</div>
                     <div className="hd" style={{fontSize:20,color:"#f97316",marginTop:4}}>{(totalMeatG/1000).toFixed(1)} kg</div>
                   </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                  {(()=>{
                    const counts = {};
                    txns.forEach(t=>{
                      if(Array.isArray(t.orders)) {
                        t.orders.filter(o=>!o.voided&&(o.type==="dish"||o.type==="drink")).forEach(o=>{
                          if(!counts[o.itemId]) counts[o.itemId] = {name:o.name,qty:0,rev:0,type:o.type};
                          counts[o.itemId].qty += (o.qty||1);
                          counts[o.itemId].rev += (o.price||0);
                        });
                      }
                    });
                    const items = Object.values(counts).sort((a,b)=>b.qty-a.qty).slice(0,10);
                    const topQty = items[0]?.qty||1;

                    return (
                      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
                        <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>🏆 Best Sellers</div>
                        {items.length===0&&<div style={{fontSize:11,color:"var(--muted)",padding:"12px 0"}}>No à la carte orders yet</div>}
                        {items.length>0&&(
                          <>
                            {items.map((item,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                <span className="hd" style={{fontSize:12,color:i<3?"var(--ember)":"var(--muted)",width:20}}>{i+1}</span>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11}}>{item.type==="dish"?"🍜":"🥤"} {item.name}</div>
                                  <div style={{height:4,borderRadius:2,background:"var(--card)",marginTop:2}}>
                                    <div style={{height:"100%",borderRadius:2,width:`${(item.qty/topQty)*100}%`,
                                      background:i===0?"var(--ember)":i<3?"#ca8a04":"var(--muted2)"}}/>
                                  </div>
                                </div>
                                <span className="mono" style={{fontSize:10,color:"var(--muted)"}}>{item.qty}×</span>
                                <span className="hd" style={{fontSize:11,color:"var(--ember)"}}>{fc(item.rev)}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {(()=>{
                    const methods = {};
                    txns.forEach(t=>{
                      const m = (t.method||"cash").toUpperCase();
                      if(!methods[m]) methods[m] = {count:0,rev:0};
                      methods[m].count++;
                      methods[m].rev += t.finalBill;
                    });
                    return (
                      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
                        <div style={{fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>💳 Payment Methods</div>
                        <div style={{display:"grid",gap:10}}>
                          {Object.entries(methods).map(([m,d])=>(
                            <div key={m} style={{display:"flex",justifyContent:"space-between",background:"var(--card)",borderRadius:8,padding:"10px 14px",border:"1px solid var(--border)"}}>
                              <div>
                                <div style={{fontSize:11,fontWeight:"bold",color:"#fff"}}>{m}</div>
                                <div style={{fontSize:9,color:"var(--muted)"}}>{d.count} txns</div>
                              </div>
                              <div style={{textAlign:"right"}}>
                                <div className="hd" style={{fontSize:14,color:"var(--ember)"}}>{fc(d.rev)}</div>
                                <div style={{fontSize:9,color:"var(--muted)"}}>{totalRevenue>0 ? (d.rev/totalRevenue*100).toFixed(1) : 0}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {/* VOIDS */}
        {tab==="voids"&&(
          <div>
            <SecH>Void & Exception Audit</SecH>
            {voidLog.length===0&&<Empty icon="✅" label="No voids recorded"/>}
            {voidLog.map((v,i)=>(
              <div key={i} style={{background:"var(--panel)",border:"1px solid #450a0a",borderRadius:10,padding:"10px 14px",marginBottom:5,display:"flex",alignItems:"center",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{v.itemName}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>{v.tableLabel} · by {v.voidedBy} · approved by {v.approvedBy} · {ft(v.time)}</div>
                  {v.reason&&<div style={{fontSize:10,color:"#fca5a5"}}>{v.reason}</div>}
                </div>
                <span className="hd" style={{fontSize:15,color:"#f87171"}}>{v.price>0?fc(v.price):"free"}</span>
              </div>
            ))}
            {isManager&&voidLog.length>0&&(<div style={{marginTop:12,fontSize:11,color:"var(--muted)"}}>Total voided value: <span style={{color:"#f87171",fontWeight:700}}>{fc(totalVoided)}</span></div>)}
          </div>
        )}

        {/* SC/PWD */}
        {tab==="scpwd"&&(
          <div>
            <SecH>Senior Citizen / PWD Discount Log</SecH>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:14}}>BIR-required audit trail for all tax-exempt transactions.</div>
            {scpwdLog.length===0&&<Empty icon="📄" label="No SC/PWD discounts applied"/>}
            {scpwdLog.map((e,i)=>(
              <div key={i} style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:600}}>{e.customerName||"—"}</span>
                    <span style={{fontSize:11,color:"var(--muted)",marginLeft:8}}>ID: {e.idNumber||"—"}</span>
                  </div>
                  <TCM label={e.discountType==="senior"?"SENIOR":"PWD"} bg="#451a03" c="var(--ember)"/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,fontSize:12}}>
                  {[["Gross",fc(e.grossAmount),"var(--text)"],["Discount",fc(e.discountAmt),"#4ade80"],["Net",fc(e.netAmount),"var(--ember)"]].map(([l,v,c])=>(
                    <div key={l}><div style={{fontSize:9,color:"var(--muted)"}}>{l}</div><div className="hd" style={{fontSize:15,color:c}}>{v}</div></div>
                  ))}
                </div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:6}}>{e.tableLabel} · {e.cashier} · {ft(e.time)}</div>
              </div>
            ))}
          </div>
        )}

        {/* LEFTOVER */}
        {tab==="leftover"&&(
          <div>
            <SecH>Leftover / Penalty Fee Log</SecH>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:14}}>Tracks ₱200/head leftover penalty charges</div>
            {leftLog.length===0&&<Empty icon="🍖" label="No leftover penalties recorded"/>}
            {leftLog.map((e,i)=>(
              <div key={i} style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span className="hd" style={{fontSize:16,color:"var(--ember)"}}>{e.tableLabel}</span>
                  {e.overrideBy&&<TCM label="MANAGER OVERRIDE" bg="#451a03" c="#fca5a5"/>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {[["Persons",e.persons,"#fff"],["Leftover",e.gramsLeftover+"g","#f87171"],["Penalty",fc(e.penalty),"var(--ember)"]].map(([l,v,c])=>(
                    <div key={l}><div style={{fontSize:9,color:"var(--muted)"}}>{l}</div><div className="hd" style={{fontSize:15,color:c}}>{v}</div></div>
                  ))}
                </div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:6}}>{e.cashier} · {ft(e.time)}{e.overrideBy&&` · override by ${e.overrideBy}`}</div>
              </div>
            ))}
          </div>
        )}

        {/* AUDIT */}
        {tab==="audit"&&(
          <div>
            <SecH>System Audit Trail</SecH>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:14}}>System logs tracking critical operations and inventory tweaks.</div>
            {!isManager && <div style={{padding:10,background:"#451a03",color:"#fde68a",borderRadius:6,fontSize:12,marginBottom:10}}>⚠️ You are viewing limited audit logs.</div>}
            {auditLogs.length===0&&<Empty icon="🔎" label="No audit trails found"/>}
            {[...auditLogs].reverse().map((a,i)=>(
              <div key={i} style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:8,padding:"10px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                  <span style={{fontWeight:600}}>{a.itemName}</span>
                  <TCM label={a.category} bg="var(--card)" c="var(--muted)"/>
                </div>
                {a.delta !== 0 && (
                  <div style={{fontSize:11,color:a.delta>0?"#4ade80":"#fca5a5",marginBottom:4,fontWeight:600}}>
                    {a.delta > 0 ? "+" : ""}{a.delta} {a.unit}
                  </div>
                )}
                {a.note && <div style={{fontSize:11,color:"var(--muted)",marginBottom:4}}>{a.note}</div>}
                <div style={{fontSize:9,color:"var(--muted2)"}}>{ft(a.time)} · {a.userName} ({a.userRole})</div>
              </div>
            ))}
          </div>
        )}

        {/* ESALES */}
        {tab==="esales"&&(
          <div>
            <SecH>eSales Export</SecH>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:14}}>Generate standardized BIR eSales report for submission.</div>
            
            <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:16,maxWidth:400}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div>
                  <label style={{fontSize:10,color:"var(--muted)",marginBottom:4,display:"block"}}>Year</label>
                  <input type="number" value={esYear} onChange={e=>setEsYear(parseInt(e.target.value)||2025)} 
                    style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid var(--border2)",background:"var(--card)",color:"#fff"}} />
                </div>
                <div>
                  <label style={{fontSize:10,color:"var(--muted)",marginBottom:4,display:"block"}}>Month (1-12)</label>
                  <input type="number" value={esMonth} min="1" max="12" onChange={e=>setEsMonth(parseInt(e.target.value)||1)} 
                    style={{width:"100%",padding:"8px",borderRadius:6,border:"1px solid var(--border2)",background:"var(--card)",color:"#fff"}} />
                </div>
              </div>
              <button className="btn" onClick={handleExportESales} style={{background:"#166534",color:"#fff",padding:"10px",width:"100%",borderRadius:8,border:"none",fontWeight:"bold"}}>
                📥 Export JSON Data
              </button>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}
