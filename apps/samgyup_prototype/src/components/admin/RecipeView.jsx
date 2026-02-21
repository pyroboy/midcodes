import { useState } from "react";
import { RECIPES, MENU_CATEGORIES } from "../../adminConstants.js";
import { fc } from "../../helpers.js";
import { SectionHeader } from "./SectionHeader.jsx";

export function RecipeView() {
  const [activeCat, setActiveCat] = useState("all");
  const categories = [...new Set(RECIPES.map(r => r.category))];

  const filtered = activeCat === "all" ? RECIPES : RECIPES.filter(r => r.category === activeCat);

  return (
    <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }} className="scr fi">
      <SectionHeader label="📖 Recipe Book" sub="Ingredient breakdown, cost analysis, and margin tracking"/>

      {/* Category filter */}
      <div style={{ display:"flex", gap:4, marginBottom:16, flexWrap:"wrap" }}>
        <button className="btn" onClick={() => setActiveCat("all")} style={{
          padding:"5px 12px", borderRadius:8, fontSize:11,
          background: activeCat==="all" ? "var(--ember)" : "var(--card)",
          color: activeCat==="all" ? "#fff" : "var(--muted)",
          border:`1px solid ${activeCat==="all"?"var(--ember)":"var(--border)"}`,
        }}>All ({RECIPES.length})</button>
        {categories.map(cat => {
          const mc = MENU_CATEGORIES.find(c => c.name.includes(cat));
          return (
            <button key={cat} className="btn" onClick={() => setActiveCat(cat)} style={{
              padding:"5px 12px", borderRadius:8, fontSize:11,
              background: activeCat===cat ? (mc?.color||"var(--ember)") : "var(--card)",
              color: activeCat===cat ? "#fff" : "var(--muted)",
              border:`1px solid ${activeCat===cat?(mc?.color||"var(--ember)"):"var(--border)"}`,
            }}>{cat}</button>
          );
        })}
      </div>

      {/* Recipe cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:12 }}>
        {filtered.map(recipe => {
          const margin = recipe.sell_price - recipe.est_cost;
          const marginPct = Math.round((margin / recipe.sell_price) * 100);
          const scrapIngredients = recipe.ingredients.filter(i => i.source === "meat_scrap");

          return (
            <div key={recipe.id} style={{
              background:"var(--card)", border:"1px solid var(--border2)",
              borderRadius:12, overflow:"hidden",
            }}>
              {/* Header */}
              <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:24 }}>{recipe.emoji}</span>
                    <div>
                      <div className="hd" style={{ fontSize:14 }}>{recipe.name}</div>
                      <div style={{ fontSize:10, color:"var(--muted)" }}>{recipe.category} · {recipe.prep_time}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div className="hd" style={{ fontSize:16, color:"var(--ember)" }}>{fc(recipe.sell_price)}</div>
                    <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>sell price</div>
                  </div>
                </div>
                <div style={{ fontSize:10, color:"var(--muted)", marginTop:6 }}>{recipe.description}</div>
              </div>

              {/* Ingredients */}
              <div style={{ padding:"10px 14px" }}>
                <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>
                  Ingredients ({recipe.ingredients.length})
                </div>
                {recipe.ingredients.map((ing, i) => {
                  const sourceColor = ing.source === "meat_scrap" ? "#f87171"
                    : ing.source === "side" ? "#4ade80"
                    : ing.source === "pantry" ? "#fbbf24" : "var(--muted)";
                  const sourceLabel = ing.source === "meat_scrap" ? "SCRAP"
                    : ing.source === "side" ? "SIDE"
                    : ing.source === "pantry" ? "PANTRY" : "FREE";

                  return (
                    <div key={i} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"4px 6px", borderBottom:"1px solid #191919", fontSize:11,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span>{ing.label}</span>
                        <span style={{
                          fontSize:7, background:sourceColor+"1a", color:sourceColor,
                          padding:"1px 4px", borderRadius:3, fontWeight:700,
                          fontFamily:"'Syne',sans-serif", letterSpacing:0.5,
                        }}>{sourceLabel}</span>
                      </div>
                      <span className="mono" style={{ fontSize:10, color:"var(--muted)" }}>
                        {ing.qty} {ing.unit}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Cost breakdown */}
              <div style={{
                padding:"10px 14px", borderTop:"1px solid var(--border)",
                display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6,
              }}>
                <div>
                  <div style={{ fontSize:8, color:"var(--muted)" }}>EST. COST</div>
                  <div className="mono" style={{ fontSize:13, color:"#f87171" }}>{fc(recipe.est_cost)}</div>
                </div>
                <div>
                  <div style={{ fontSize:8, color:"var(--muted)" }}>MARGIN</div>
                  <div className="mono" style={{ fontSize:13, color:"#4ade80" }}>{fc(margin)}</div>
                </div>
                <div>
                  <div style={{ fontSize:8, color:"var(--muted)" }}>MARGIN %</div>
                  <div className="hd" style={{
                    fontSize:13,
                    color: marginPct > 60 ? "#4ade80" : marginPct > 40 ? "#fbbf24" : "#f87171",
                  }}>{marginPct}%</div>
                </div>
              </div>

              {/* Scrap usage badge */}
              {scrapIngredients.length > 0 && (
                <div style={{
                  padding:"6px 14px", borderTop:"1px solid #191919",
                  background:"#1a0505", fontSize:9, color:"#fca5a5",
                }}>
                  ♻ Uses kitchen scraps: {scrapIngredients.map(i=>i.label).join(", ")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
