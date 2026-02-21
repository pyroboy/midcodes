export function Tag({ children, color, bg }) {
  return (
    <div style={{
      background: bg, border:`1px solid ${color}44`,
      borderRadius:20, padding:"2px 9px", fontSize:10,
      color, fontFamily:"'Syne',sans-serif", fontWeight:700, letterSpacing:.4,
    }}>{children}</div>
  );
}

export function FL({ children }) {
  return <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase", marginBottom:5 }}>{children}</div>;
}
