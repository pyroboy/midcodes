export function UserBadge({user, onLogout}) {
  const r = user?.role;
  const isManager = r === "manager";
  const isKitchen = r === "kitchen";
  const grad = isManager ? "linear-gradient(135deg,#7c3aed,#4f46e5)"
    : isKitchen ? "linear-gradient(135deg,#b45309,#92400e)"
    : "linear-gradient(135deg,#1d4ed8,#0284c7)";
  const labelColor = isManager ? "#a78bfa" : isKitchen ? "#fbbf24" : "#60a5fa";
  const labelText = isManager ? "MANAGER" : isKitchen ? "KITCHEN" : "STAFF";

  return (
    <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--card)",
      border:"1px solid var(--border2)",borderRadius:10,padding:"5px 10px"}}>
      <div style={{width:28,height:28,borderRadius:8,
        background:grad,
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff"}}>
        {user.name[0]?.toUpperCase()}
      </div>
      <div>
        <div className="hd" style={{fontSize:12,lineHeight:1}}>{user.name}</div>
        <div style={{fontSize:9,color:labelColor,lineHeight:1,marginTop:1,letterSpacing:0.5}}>
          {labelText}
        </div>
      </div>
      <button className="btn" onClick={onLogout} title="Logout"
        style={{background:"none",color:"var(--muted)",fontSize:14,marginLeft:2}}>⏏</button>
    </div>
  );
}
