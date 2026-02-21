export function Chip({label,c}){
  return(
    <div style={{background:c+"1a",border:`1px solid ${c}44`,borderRadius:20,padding:"2px 9px",
      fontSize:10,color:c,fontWeight:600,fontFamily:"'Syne',sans-serif",letterSpacing:0.5}}>
      {label}
    </div>
  );
}
