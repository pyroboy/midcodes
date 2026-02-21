import { useState } from "react";
import { PACKAGES, DISHES, DRINKS } from "../../constants.js";
import { MENU_CATEGORIES, RECIPES } from "../../adminConstants.js";
import { fc } from "../../helpers.js";
import { SectionHeader } from "./SectionHeader.jsx";

export function MenuManager() {
  const [activeCat, setActiveCat] = useState("cat_unli");
  const [expandedId, setExpandedId] = useState(null);

  const menuData = {
    cat_unli: PACKAGES.map(p => ({
      id:p.id, name:p.name, emoji:p.emoji, price:p.price,
      desc:p.desc, image:p.image, type:"package", priceSuffix:"/pax",
      meats:p.meats, sides:p.auto_sides.length,
    })),
    cat_snacks: DISHES.filter(d=>d.cat==="Snacks").map(d => {
      const recipe = RECIPES.find(r=>r.dishId===d.id);
      return { id:d.id, name:d.name, emoji:d.emoji, price:d.price, image:d.image, type:"dish", recipe };
    }),
    cat_rice: DISHES.filter(d=>d.cat==="Rice").map(d => {
      const recipe = RECIPES.find(r=>r.dishId===d.id);
      return { id:d.id, name:d.name, emoji:d.emoji, price:d.price, image:d.image, type:"dish", recipe };
    }),
    cat_noodles: DISHES.filter(d=>d.cat==="Noodles").map(d => {
      const recipe = RECIPES.find(r=>r.dishId===d.id);
      return { id:d.id, name:d.name, emoji:d.emoji, price:d.price, image:d.image, type:"dish", recipe };
    }),
    cat_soup: DISHES.filter(d=>d.cat==="Soup").map(d => {
      const recipe = RECIPES.find(r=>r.dishId===d.id);
      return { id:d.id, name:d.name, emoji:d.emoji, price:d.price, image:d.image, type:"dish", recipe };
    }),
    cat_drinks: DRINKS.map(d => ({
      id:d.id, name:d.name, emoji:d.emoji, price:d.price, image:d.image, type:"drink",
    })),
  };

  const cat = MENU_CATEGORIES.find(c=>c.id===activeCat);
  const items = menuData[activeCat] || [];
  const totalItems = Object.values(menuData).reduce((s,arr)=>s+arr.length,0);

  return (
    <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }} className="scr fi">
      <SectionHeader label="🍽️ Menu Management" sub={`${totalItems} items across ${MENU_CATEGORIES.length} categories`}/>

      {/* Category tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:16, flexWrap:"wrap" }}>
        {MENU_CATEGORIES.map(c=>{
          const count = (menuData[c.id]||[]).length;
          return (
            <button key={c.id} className="btn" onClick={()=>{setActiveCat(c.id);setExpandedId(null);}} style={{
              padding:"8px 16px", borderRadius:10, fontSize:12,
              background:activeCat===c.id?c.color:"var(--card)",
              color:activeCat===c.id?"#fff":"var(--muted)",
              border:`1px solid ${activeCat===c.id?c.color:"var(--border)"}`,
              display:"flex", alignItems:"center", gap:6, transition:"all .15s",
            }}>
              <span style={{ fontSize:16 }}>{c.icon}</span>
              <span>{c.name}</span>
              <span style={{
                fontSize:9, background:activeCat===c.id?"rgba(0,0,0,.3)":"var(--card2)",
                padding:"2px 7px", borderRadius:10, fontFamily:"'DM Mono',monospace",
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Category hero banner */}
      <div style={{
        background:`linear-gradient(135deg, ${cat?.color}22, ${cat?.color}08)`,
        border:`1px solid ${cat?.color}44`, borderRadius:16,
        padding:"18px 22px", marginBottom:16,
        display:"flex", alignItems:"center", gap:14,
      }}>
        <span style={{ fontSize:42 }}>{cat?.icon}</span>
        <div>
          <div className="hd" style={{ fontSize:22, color:cat?.color }}>{cat?.name}</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
            {items.length} items · {activeCat==="cat_unli"?"Unlimited grill packages with auto-sides"
              :activeCat==="cat_drinks"?"Ready to serve beverages"
              :"All items have linked recipes for cost tracking"}
          </div>
        </div>
        <div style={{ marginLeft:"auto", textAlign:"right" }}>
          {activeCat!=="cat_unli"&&activeCat!=="cat_drinks"&&(
            <>
              <div className="mono" style={{ fontSize:11, color:"var(--muted)" }}>Avg. Margin</div>
              <div className="hd" style={{ fontSize:18, color:"#4ade80" }}>
                {Math.round(items.filter(i=>i.recipe).reduce((s,i)=>{
                  const m = (i.price-i.recipe.est_cost)/i.price*100;
                  return s+m;
                },0)/(items.filter(i=>i.recipe).length||1))}%
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
        {items.map(item=>{
          const margin = item.recipe ? item.price - item.recipe.est_cost : null;
          const marginPct = item.recipe ? Math.round((margin/item.price)*100) : null;
          const expanded = expandedId === item.id;

          return (
            <div key={item.id} style={{
              background:"var(--card)", border:"1px solid var(--border2)",
              borderRadius:14, overflow:"hidden",
            }} className="card-hover">
              {/* Image header */}
              {item.image && (
                <div style={{ position:"relative", height:120, overflow:"hidden" }}>
                  <img src={item.image} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  <div className="img-overlay"/>
                  {/* Price badge */}
                  <div style={{
                    position:"absolute", top:8, right:8,
                    background:"rgba(0,0,0,.7)", backdropFilter:"blur(6px)",
                    border:"1px solid rgba(255,255,255,.1)",
                    borderRadius:10, padding:"4px 12px",
                  }}>
                    <span className="hd" style={{ fontSize:18, color:cat?.color }}>
                      {fc(item.price)}{item.priceSuffix||""}
                    </span>
                  </div>
                  {/* Category badge */}
                  <div style={{
                    position:"absolute", bottom:8, left:8,
                    background:"rgba(0,0,0,.6)", backdropFilter:"blur(4px)",
                    borderRadius:6, padding:"2px 8px", fontSize:9, color:"var(--muted)",
                    fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:.5,
                  }}>{cat?.name}</div>
                </div>
              )}

              {/* Content */}
              <div style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:20 }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>{item.name}</div>
                      {item.desc && <div style={{ fontSize:10, color:"var(--muted)", marginTop:1 }}>{item.desc}</div>}
                    </div>
                  </div>
                  {!item.image && (
                    <div className="hd" style={{ fontSize:20, color:cat?.color }}>
                      {fc(item.price)}{item.priceSuffix||""}
                    </div>
                  )}
                </div>

                {/* Package details */}
                {item.type==="package"&&(
                  <div style={{ marginTop:6, padding:"8px 10px", background:"var(--card2)", borderRadius:8 }}>
                    <div style={{ fontSize:10, marginBottom:4 }}>
                      <span style={{ color:"#f97316" }}>{item.meats?.length} meats</span>
                      <span style={{ color:"var(--muted)" }}> · </span>
                      <span style={{ color:"#16a34a" }}>{item.sides} auto-sides</span>
                    </div>
                    <div style={{ fontSize:9, color:"var(--muted)" }}>Unlimited grill · Per person pricing</div>
                  </div>
                )}

                {/* Recipe data */}
                {item.recipe && (
                  <>
                    <div style={{
                      marginTop:8, paddingTop:8, borderTop:"1px solid var(--border)",
                      display:"flex", gap:16,
                    }}>
                      {[
                        { label:"COST", value:fc(item.recipe.est_cost), color:"#f87171" },
                        { label:"MARGIN", value:fc(margin), color:"#4ade80" },
                        { label:"%", value:`${marginPct}%`, color:marginPct>60?"#4ade80":marginPct>40?"#fbbf24":"#f87171" },
                        { label:"PREP", value:item.recipe.prep_time, color:"var(--muted)" },
                      ].map(s=>(
                        <div key={s.label}>
                          <div style={{ fontSize:8, color:"var(--muted)", letterSpacing:.5 }}>{s.label}</div>
                          <div className="mono" style={{ fontSize:12, color:s.color, fontWeight:700 }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Expand ingredients */}
                    <button className="btn" onClick={()=>setExpandedId(expanded?null:item.id)} style={{
                      marginTop:6, width:"100%", background:"var(--card2)", border:"1px solid var(--border)",
                      borderRadius:6, padding:"4px 8px", fontSize:9, color:"var(--muted)", textAlign:"center",
                    }}>
                      {expanded ? "▲ Hide ingredients" : `▼ Show ${item.recipe.ingredients.length} ingredients`}
                    </button>
                    {expanded && (
                      <div style={{ marginTop:6, padding:"6px 8px", background:"var(--card2)", borderRadius:8 }}>
                        {item.recipe.ingredients.map((ing,i)=>{
                          const srcClr = ing.source==="meat_scrap"?"#f87171":ing.source==="side"?"#4ade80"
                            :ing.source==="pantry"?"#fbbf24":"var(--muted)";
                          const srcLbl = ing.source==="meat_scrap"?"SCRAP":ing.source==="side"?"SIDE"
                            :ing.source==="pantry"?"PANTRY":"FREE";
                          return (
                            <div key={i} style={{
                              display:"flex", alignItems:"center", justifyContent:"space-between",
                              padding:"3px 4px", borderBottom:i<item.recipe.ingredients.length-1?"1px solid #191919":"none",
                              fontSize:10,
                            }}>
                              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                <span>{ing.label}</span>
                                <span style={{
                                  fontSize:7, background:srcClr+"1a", color:srcClr,
                                  padding:"1px 4px", borderRadius:3, fontWeight:700,
                                }}>{srcLbl}</span>
                              </div>
                              <span className="mono" style={{ fontSize:9, color:"var(--muted)" }}>{ing.qty} {ing.unit}</span>
                            </div>
                          );
                        })}
                        {item.recipe.ingredients.filter(i=>i.source==="meat_scrap").length>0&&(
                          <div style={{ marginTop:4, fontSize:9, color:"#fca5a5", paddingTop:4, borderTop:"1px solid #191919" }}>
                            ♻ Uses kitchen scraps — reduces waste cost
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Drink (no recipe) */}
                {item.type==="drink"&&!item.recipe&&(
                  <div style={{ marginTop:6, fontSize:10, color:"var(--muted)", display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:"#16a34a" }}/> Ready to serve
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
