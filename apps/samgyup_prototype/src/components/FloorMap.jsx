import { fc, ela, sBill } from "../helpers.js";

export function FloorMap({
  tables, mergeFrom, transferFrom, floorMenu, activeId, isManager,
  getTimeStatus,
  onTableClick, onFloorMenuAction,
  onDismissFloorMenu, onCancelMerge, onCancelTransfer,
}) {
  const specialMode = mergeFrom || transferFrom;
  const specialLabel = mergeFrom
    ? `🔀 Merging from ${tables.find(t=>t.id===mergeFrom)?.label} — tap occupied table to merge into`
    : `🔄 Transferring from ${tables.find(t=>t.id===transferFrom)?.label} — tap empty table`;

  return (
    <div style={{flex:1,padding:14,display:"flex",flexDirection:"column",overflow:"hidden"}} className="fi">
      {/* Legend row */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexShrink:0}}>
        <span className="hd" style={{fontSize:10,color:"var(--muted)",letterSpacing:3,textTransform:"uppercase"}}>
          Floor Plan
        </span>
        {specialMode&&(
          <div style={{background:"#451a03",border:"1px solid var(--ember)",borderRadius:8,
            padding:"4px 12px",fontSize:11,color:"var(--ember)",display:"flex",alignItems:"center",gap:8}}>
            <span className="hd">{specialLabel}</span>
            <button className="btn" onClick={mergeFrom ? onCancelMerge : onCancelTransfer}
              style={{background:"none",color:"var(--muted)",fontSize:14}}>✕</button>
          </div>
        )}
        <div style={{flex:1,height:1,background:"var(--border)"}}/>
        {[["#16a34a","Available"],["#f97316","Occupied"],["#7c3aed","VIP"],["#0891b2","Bar"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:7,height:7,borderRadius:2,background:c}}/>
            <span style={{fontSize:10,color:"var(--muted)"}}>{l}</span>
          </div>
        ))}
      </div>

      {/* Map canvas */}
      <div style={{flex:1,position:"relative",background:"#0e0e0e",border:"2px solid var(--border2)",
        borderRadius:14,overflow:"hidden"}}
        onClick={e=>{if(e.target===e.currentTarget)onDismissFloorMenu();}}>
        <div style={{position:"absolute",inset:0,border:"3px solid #1e1e1e",borderRadius:12,pointerEvents:"none"}}/>
        {/* Room dividers */}
        <div style={{position:"absolute",left:"67%",top:"3%",width:2,height:"71%",background:"#1e1e1e"}}/>
        <div style={{position:"absolute",left:"67%",top:"59%",right:"2%",height:2,background:"#1e1e1e"}}/>
        {/* Labels */}
        {[
          {label:"WINDOW",x:"0.5%",y:"45%",rotate:"-90deg"},
          {label:"MAIN DINING",x:"28%",y:"1.5%"},
          {label:"VIP / PRIVATE",x:"68%",y:"1.5%"},
          {label:"BAR",x:"72%",y:"56%"},
        ].map(({label,x,y,rotate})=>(
          <div key={label} style={{position:"absolute",left:x,top:y,fontSize:8,color:"#1f2937",
            letterSpacing:3,textTransform:"uppercase",
            transform:rotate?`rotate(${rotate})`:"none",
            transformOrigin:"left center",whiteSpace:"nowrap",pointerEvents:"none"}}>
            {label}
          </div>
        ))}
        {/* Kitchen & entrance */}
        <div style={{position:"absolute",left:"2%",bottom:"2%",width:"63%",height:"8%",
          border:"1px dashed #1e1e1e",borderRadius:8,display:"flex",alignItems:"center",
          justifyContent:"center",pointerEvents:"none"}}>
          <span style={{fontSize:9,color:"#1f2937",letterSpacing:3,textTransform:"uppercase"}}>🍳 KITCHEN COUNTER</span>
        </div>
        <div style={{position:"absolute",left:"30%",bottom:"2%",fontSize:9,color:"#1f2937",pointerEvents:"none"}}>
          🚪 ENTRANCE
        </div>

        {/* Tables */}
        {tables.map(t=>{
          const occ       = t.status==="occupied";
          const isVip     = t.type==="vip";
          const isBar     = t.type==="bar";
          const clr       = isVip?"#7c3aed":isBar?"#0891b2":occ?"#f97316":"#16a34a";
          const isMergeSrc= mergeFrom===t.id;
          const isTransSrc= transferFrom===t.id;
          const isMergeTgt= mergeFrom&&mergeFrom!==t.id&&occ;
          const isTransTgt= transferFrom&&transferFrom!==t.id&&!occ;
          const isMenuOpen= floorMenu?.tid===t.id;
          const isActive  = activeId===t.id;

          return (
            <div key={t.id} style={{position:"absolute",left:`${t.x}%`,top:`${t.y}%`,
              width:`${t.w}%`,height:`${t.h}%`}}>
              {occ&&!isMergeSrc&&!isTransSrc&&(
                <div className="ring" style={{position:"absolute",inset:-3,
                  borderRadius:isVip?14:10,border:`1.5px solid ${clr}`,
                  pointerEvents:"none",zIndex:0}}/>
              )}
              <div className="tbl" onClick={()=>onTableClick(t)} style={{
                position:"absolute",inset:0,zIndex:isActive?10:1,
                background:isActive?`${clr}25`:isMergeSrc||isTransSrc?"#1f0a00":isMergeTgt?"#001a0a":isTransTgt?"#0a1020"
                  :occ?(isVip?"#130d1f":"#1a0f05"):(isVip?"#0f0d15":isBar?"#0a1020":"#111"),
                border:`1.5px solid ${isMergeSrc||isTransSrc?"var(--ember)"
                  :isMergeTgt?"#16a34a":isTransTgt?"#0891b2":clr}${(occ||isMergeTgt||isTransTgt||isActive)?"":"33"}`,
                borderRadius:isVip?12:isBar?20:8,
                display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",padding:3,
                boxShadow:isActive?`0 0 0 2px #0a0a0a, 0 0 0 5px ${clr}, 0 0 30px ${clr}80`:occ?`0 0 10px ${clr}30`:"none",
                outline:isMenuOpen?"2px solid var(--ember)":"none",
              }}>
                {occ&&<div style={{position:"absolute",top:2,right:3,fontSize:isVip?12:9,opacity:.5}}>🔥</div>}
                <span className="hd" style={{fontSize:isVip?16:isBar?12:t.type==="large"?14:13,
                  fontWeight:800,color:occ?clr:"#6b7280",lineHeight:1.1,textAlign:"center",letterSpacing:0.5}}>
                  {t.label}
                </span>
                <span style={{fontSize:10,color:occ?"#9ca3af":"#4b5563",lineHeight:1.2,marginTop:2}}>{t.seats}p</span>
                {occ&&t.session&&(
                  <>
                    {(() => {
                      const ts = getTimeStatus?.(t.session.openedAt) || "ok";
                      const isOvertime = ts === "overtime";
                      const isWarningRed = ts === "warning_red";
                      const isWarningYellow = ts === "warning_yellow";
                      const timerColor = isOvertime?"#fff":isWarningRed?"#fca5a5":isWarningYellow?"#fde047":"#4ade80";
                      const bgColor = isOvertime?"#dc2626":isWarningRed?"#7f1d1d":isWarningYellow?"#713f12":"transparent";
                      return (
                        <div style={{
                          fontSize:isOvertime?11:10,
                          color:timerColor,
                          lineHeight:1.3,
                          marginTop:3,
                          padding:isOvertime?"3px 8px":isWarningRed||isWarningYellow?"2px 6px":"0",
                          background:bgColor,
                          borderRadius:4,
                          fontWeight:isOvertime?700:isWarningRed?600:400,
                          boxShadow:isOvertime?"0 0 8px rgba(220,38,38,0.6)":"none",
                        }}
                          className={isOvertime?"overtime-badge":""}>
                          ⏱{ela(t.session.openedAt)}{(isOvertime||isWarningRed)?" ⚠":""}
                        </div>
                      );
                    })()}
                    <div className="hd" style={{fontSize:isVip||t.type==="large"?13:12,color:"#fff",lineHeight:1.2,marginTop:3,fontWeight:600,textShadow:"0 1px 2px rgba(0,0,0,0.5)"}}>
                      {fc(sBill(t.session))}
                    </div>
                    {t.session.mergedFrom?.length>0&&(
                      <div style={{fontSize:9,color:"#fbbf24",marginTop:1,fontWeight:500}}>+{t.session.mergedFrom.join(",")}</div>
                    )}
                  </>
                )}
                {!occ&&<div style={{fontSize:9,color:"#4b5563",marginTop:3}}>tap</div>}
              </div>

              {/* Floor action menu */}
              {isMenuOpen&&(
                <div style={{position:"absolute",
                  left:t.x>60?"auto":"105%",right:t.x>60?"105%":"auto",top:0,
                  background:"var(--panel)",border:"1px solid var(--border2)",
                  borderRadius:10,padding:8,zIndex:100,minWidth:172,
                  boxShadow:"0 8px 32px rgba(0,0,0,.6)"}}
                  onClick={e=>e.stopPropagation()}>
                  <div style={{fontSize:9,color:"var(--muted)",letterSpacing:2,
                    textTransform:"uppercase",marginBottom:6,paddingBottom:4,
                    borderBottom:"1px solid var(--border)"}}>
                    {t.label} Actions
                  </div>
                  {[
                    {icon:"📋",label:"View Orders",   action:()=>onFloorMenuAction("view",t)},
                    {icon:"👥",label:"Change Pax",    action:()=>onFloorMenuAction("changePax",t)},
                    ...(isManager?[
                      {icon:"🔀",label:"Merge Table",   action:()=>onFloorMenuAction("merge",t)},
                      {icon:"🔄",label:"Transfer Table", action:()=>onFloorMenuAction("transfer",t)},
                      {icon:"🗑", label:"Void Table",    action:()=>onFloorMenuAction("void",t),danger:true},
                    ]:[]),
                  ].map(({icon,label,action,danger})=>(
                    <button key={label} className="btn" onClick={action} style={{
                      display:"flex",alignItems:"center",gap:8,width:"100%",background:"none",
                      color:danger?"#f87171":"var(--text)",padding:"7px 8px",borderRadius:7,
                      fontSize:12,textAlign:"left"}}
                      onMouseEnter={e=>e.currentTarget.style.background=danger?"#450a0a":"var(--card)"}
                      onMouseLeave={e=>e.currentTarget.style.background="none"}>
                      <span style={{fontSize:14}}>{icon}</span>{label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


