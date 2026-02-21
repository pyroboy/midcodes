import { PACKAGES, MEATS, SIDES, DISHES, DRINKS } from "../constants.js";
import { fc } from "../helpers.js";

export function AddPanel({
  addTab, setAddTab, dishCat, setDishCat,
  session, inv, isManager,
  onSwapPackage, onMeat, onSide, onPaid,
}) {
  const pkg = PACKAGES.find(p => p.id === session?.pkgId);

  return (
    <div style={{width:285,background:"var(--panel)",borderLeft:"1px solid var(--border)",
      display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
      {/* Tab bar */}
      <div style={{padding:"10px 10px 8px",borderBottom:"1px solid var(--border)"}}>
        <div style={{fontSize:9,color:"var(--muted)",letterSpacing:3,textTransform:"uppercase",marginBottom:7}}>Add to Order</div>
        <div style={{display:"flex",gap:3}}>
          {[["package","🎫"],["meat","🥩"],["sides","🥬"],["dishes","🍜"],["drinks","🥤"]].map(([k,e])=>(
            <button key={k} className="btn" onClick={()=>setAddTab(k)} style={{
              flex:1,background:addTab===k?"var(--ember)":"var(--card)",
              color:addTab===k?"#fff":"var(--muted)",
              padding:"6px 4px",borderRadius:7,fontSize:14,
              border:`1px solid ${addTab===k?"var(--ember)":"var(--border)"}`}}>
              {e}
            </button>
          ))}
        </div>
        <div style={{fontSize:9,color:"var(--muted)",textAlign:"center",marginTop:4}}>
          {["package","meat","sides"].includes(addTab)?"FREE — inventory tracked":"PAID ITEM"}
        </div>
      </div>

      <div style={{flex:1,overflow:"auto",padding:10}} className="scr">
        {/* PACKAGE */}
        {addTab==="package"&&PACKAGES.map(p=>(
          <div key={p.id} onClick={()=>onSwapPackage(p.id)}
            style={{background:"var(--card)",
              border:`1.5px solid ${session?.pkgId===p.id?p.color:p.color+"33"}`,
              borderRadius:12,padding:12,marginBottom:7,cursor:"pointer"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=p.color}
            onMouseLeave={e=>e.currentTarget.style.borderColor=session?.pkgId===p.id?p.color:p.color+"33"}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{p.emoji} {p.name}</div>
                <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{p.desc}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div className="hd" style={{fontSize:15,color:p.color}}>{fc(p.price)}/pax</div>
                <div className="hd" style={{fontSize:12,color:"#fff"}}>={fc(p.price*(session?.persons||1))}</div>
              </div>
            </div>
            <div style={{marginTop:8,paddingTop:6,borderTop:"1px solid var(--border)",
              display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:10,color:"#16a34a"}}>✓ {p.auto_sides.length} sides auto</span>
              {session?.pkgId===p.id&&<span style={{fontSize:10,color:"var(--ember)",fontWeight:700}}>✓ ACTIVE</span>}
            </div>
          </div>
        ))}

        {/* MEAT */}
        {addTab==="meat"&&MEATS.map(m=>{
          const allowed = pkg?.meats.includes(m.id);
          const stock   = inv[m.id]?.stock ?? 0;
          const out     = stock === 0;
          const low     = !out && stock <= (inv[m.id]?.low || 0);
          return (
            <div key={m.id} onClick={()=>{if(!allowed||out)return;onMeat(m);}}
              style={{background:"var(--card)",
                border:`1px solid ${!allowed?"var(--border)":out?"#450a0a":low?"#451a03":"var(--border2)"}`,
                borderRadius:10,padding:"10px 12px",marginBottom:6,
                cursor:!allowed||out?"not-allowed":"pointer",opacity:!allowed||out?0.35:1}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:13,fontWeight:500}}>🥩 {m.name}</span>
                {isManager&&<span className="mono" style={{fontSize:9,color:"var(--muted)"}}>≈{fc(m.cost_per_100g)}/100g</span>}
              </div>
              <div style={{fontSize:10,marginTop:3,
                color:!allowed?"var(--muted2)":out?"#f87171":low?"#fbbf24":"var(--muted)"}}>
                {!allowed?"Not in package":out?"Out of stock":low?`⚠ Low — ${stock}g`:`${stock}g available`}
              </div>
              {allowed&&!out&&<div style={{fontSize:10,color:"#16a34a",marginTop:2}}>FREE · tap to add weight</div>}
            </div>
          );
        })}

        {/* SIDES */}
        {addTab==="sides"&&SIDES.map(s=>{
          const stock = inv[s.id]?.stock ?? 0;
          return (
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,background:"var(--card)",
              border:"1px solid var(--border)",borderRadius:9,padding:"8px 10px",marginBottom:5}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:500}}>🥬 {s.name}</div>
                <div style={{fontSize:10,color:"var(--muted)"}}>{stock} {s.unit} · FREE</div>
              </div>
              <button className="btn" onClick={()=>onSide(s)} disabled={stock===0}
                style={{width:28,height:28,borderRadius:6,fontSize:17,lineHeight:1,
                  background:stock===0?"#111":"#166534",
                  color:stock===0?"#374151":"#fff",opacity:stock===0?0.4:1}}>
                +
              </button>
            </div>
          );
        })}

        {/* DISHES */}
        {addTab==="dishes"&&(
          <>
            <div style={{display:"flex",gap:3,marginBottom:8}}>
              {["Snacks","Rice","Noodles","Soup"].map(c=>(
                <button key={c} className="btn" onClick={()=>setDishCat(c)} style={{
                  flex:1,padding:"5px 4px",borderRadius:7,fontSize:10,
                  background:dishCat===c?"#7c3aed":"var(--card)",
                  color:dishCat===c?"#fff":"var(--muted)",
                  border:`1px solid ${dishCat===c?"#7c3aed":"var(--border)"}`}}>
                  {c}
                </button>
              ))}
            </div>
            {DISHES.filter(d=>d.cat===dishCat).map(d=>(
              <div key={d.id} style={{display:"flex",alignItems:"center",gap:8,background:"var(--card)",
                border:"1px solid var(--border)",borderRadius:9,padding:"8px 10px",marginBottom:5}}>
                <span style={{fontSize:18}}>{d.emoji}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500}}>{d.name}</div>
                  <div className="hd" style={{fontSize:14,color:"#a855f7"}}>{fc(d.price)}</div>
                </div>
                <button className="btn" onClick={()=>onPaid(d)}
                  style={{width:28,height:28,borderRadius:6,fontSize:17,lineHeight:1,
                    background:"#4c1d95",color:"#c4b5fd"}}>+</button>
              </div>
            ))}
          </>
        )}

        {/* DRINKS */}
        {addTab==="drinks"&&DRINKS.map(d=>(
          <div key={d.id} style={{display:"flex",alignItems:"center",gap:8,background:"var(--card)",
            border:"1px solid var(--border)",borderRadius:9,padding:"8px 10px",marginBottom:5}}>
            <span style={{fontSize:18}}>{d.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:500}}>{d.name}</div>
              <div className="hd" style={{fontSize:14,color:"#3b82f6"}}>{fc(d.price)}</div>
            </div>
            <button className="btn" onClick={()=>onPaid(d)}
              style={{width:28,height:28,borderRadius:6,fontSize:17,lineHeight:1,
                background:"#1e3a8a",color:"#93c5fd"}}>+</button>
          </div>
        ))}
      </div>
    </div>
  );
}
