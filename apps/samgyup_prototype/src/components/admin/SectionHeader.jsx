export function SectionHeader({ label, sub, action }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
      <div>
        <div className="hd" style={{ fontSize:16 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{sub}</div>}
      </div>
      {action && <div style={{ marginLeft:"auto" }}>{action}</div>}
    </div>
  );
}
