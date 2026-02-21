import { PACKAGES } from "../constants.js";
import { fc, ela, ft, sBill, sMeatG } from "../helpers.js";

export function KitchenView({ tables }) {
  const occupied = tables.filter(t => t.status === "occupied" && t.session);

  // Collect all active orders across tables for the queue
  const allOrders = [];
  occupied.forEach(t => {
    t.session.orders.filter(o => !o.voided).forEach(o => {
      allOrders.push({ ...o, tableLabel: t.label, tablePax: t.session.persons });
    });
  });

  const meatOrders = allOrders.filter(o => o.type === "meat");
  const dishOrders = allOrders.filter(o => o.type === "dish");
  const sideOrders = allOrders.filter(o => o.type === "side" && !o.isAuto);

  return (
    <div style={{ flex:1, overflow:"auto", padding:"16px 20px" }} className="scr fi">

      {/* ── Header stats ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div className="hd" style={{ fontSize:20 }}>🍳 Kitchen Queue</div>
        <div style={{ display:"flex", gap:6 }}>
          <StatPill label="Active Tables" value={occupied.length} color="#f97316"/>
          <StatPill label="Meat Orders" value={meatOrders.length} color="#dc2626"/>
          <StatPill label="Dish Orders" value={dishOrders.length} color="#7c3aed"/>
        </div>
      </div>

      {occupied.length === 0 && (
        <div style={{ textAlign:"center", color:"var(--muted)", padding:"60px 0" }}>
          <div style={{ fontSize:48, marginBottom:10 }}>😴</div>
          <div style={{ fontSize:14 }}>No active tables</div>
          <div style={{ fontSize:11, color:"var(--muted2)", marginTop:4 }}>Kitchen queue is clear</div>
        </div>
      )}

      {/* ── Table cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:12 }}>
        {occupied.map(t => {
          const session = t.session;
          const pkg = session.pkgId ? PACKAGES.find(p=>p.id===session.pkgId) : null;
          const orders = session.orders.filter(o => !o.voided);
          const meats = orders.filter(o => o.type === "meat");
          const dishes = orders.filter(o => o.type === "dish" || o.type === "drink");
          const sides = orders.filter(o => o.type === "side" && !o.isAuto);

          return (
            <div key={t.id} style={{
              background:"var(--card)", border:"1px solid var(--border2)",
              borderRadius:12, overflow:"hidden",
            }}>
              {/* Table header */}
              <div style={{
                padding:"10px 14px", borderBottom:"1px solid var(--border)",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                background:"var(--panel)",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span className="hd" style={{ fontSize:18, color:"var(--ember)" }}>{t.label}</span>
                  <span style={{ fontSize:10, color:"var(--muted)" }}>
                    {session.persons} pax {pkg ? `· ${pkg.name}` : "· à la carte"}
                  </span>
                </div>
                <span className="mono pulse" style={{ fontSize:10, color:"var(--ember)" }}>
                  ⏱ {ela(session.openedAt)}
                </span>
              </div>

              <div style={{ padding:"10px 12px" }}>
                {/* Meat orders — highlighted */}
                {meats.length > 0 && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:9, color:"#f87171", letterSpacing:2, textTransform:"uppercase", marginBottom:5 }}>
                      🥩 MEATS — {meats.reduce((s,o)=>s+(o.weight_g||0),0)}g total
                    </div>
                    {meats.map(o => (
                      <div key={o.id} style={{
                        display:"flex", justifyContent:"space-between", alignItems:"center",
                        padding:"5px 8px", borderRadius:6, marginBottom:3,
                        background:"#1a0f05", border:"1px solid #451a03",
                      }}>
                        <span style={{ fontSize:12 }}>🥩 {o.name}</span>
                        <span className="mono hd" style={{ fontSize:14, color:"#fbbf24" }}>{o.weight_g}g</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dish/drink orders */}
                {dishes.length > 0 && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontSize:9, color:"#a855f7", letterSpacing:2, textTransform:"uppercase", marginBottom:5 }}>
                      🍜 DISHES & DRINKS
                    </div>
                    {dishes.map(o => (
                      <div key={o.id} style={{
                        display:"flex", justifyContent:"space-between",
                        padding:"4px 8px", borderRadius:6, marginBottom:2,
                        background:"var(--card2)", border:"1px solid var(--border)",
                      }}>
                        <span style={{ fontSize:12 }}>{o.name}</span>
                        <span className="mono" style={{ fontSize:10, color:"var(--muted)" }}>{ft(o.time)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Extra sides requested */}
                {sides.length > 0 && (
                  <div>
                    <div style={{ fontSize:9, color:"#16a34a", letterSpacing:2, textTransform:"uppercase", marginBottom:5 }}>
                      🥬 SIDE REQUESTS
                    </div>
                    {sides.map(o => (
                      <div key={o.id} style={{
                        display:"flex", justifyContent:"space-between",
                        padding:"4px 8px", fontSize:11, color:"var(--muted)",
                      }}>
                        <span>{o.name}</span>
                        <span className="mono" style={{ fontSize:9 }}>{ft(o.time)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {meats.length===0 && dishes.length===0 && sides.length===0 && (
                  <div style={{ textAlign:"center", color:"var(--muted2)", padding:"12px 0", fontSize:11 }}>
                    No actionable orders yet
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

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: color + "1a", border:`1px solid ${color}44`,
      borderRadius:20, padding:"2px 10px",
      fontSize:10, color, fontFamily:"'Syne',sans-serif", fontWeight:700,
    }}>{value} {label}</div>
  );
}
