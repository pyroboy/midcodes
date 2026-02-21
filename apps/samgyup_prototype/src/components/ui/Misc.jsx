export function SecH({children}){
  return(
    <div className="hd" style={{fontSize:11,color:"var(--muted)",letterSpacing:3,
      textTransform:"uppercase",marginBottom:14}}>
      {children}
    </div>
  );
}

export function SecLab({children}){
  return(
    <div style={{fontSize:9,color:"var(--muted)",letterSpacing:3,textTransform:"uppercase",
      marginBottom:8,paddingBottom:4,borderBottom:"1px solid var(--border)"}}>
      {children}
    </div>
  );
}

export function Empty({icon,label}){
  return(
    <div style={{textAlign:"center",color:"var(--muted)",padding:"40px 0"}}>
      <div style={{fontSize:36,marginBottom:8}}>{icon}</div>
      <div style={{fontSize:13}}>{label}</div>
    </div>
  );
}
