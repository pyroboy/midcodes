export function SidebarStat({ label, value, color }) {
  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      background:"var(--card)", borderRadius:8, padding:"5px 9px",
      border:"1px solid var(--border)",
    }}>
      <span style={{ fontSize:10, color:"var(--muted)" }}>{label}</span>
      <span className="mono" style={{ fontSize:11, color, fontWeight:700 }}>{value}</span>
    </div>
  );
}
