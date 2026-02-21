export function TCM({label,bg,c}){
  return(
    <span style={{background:bg,color:c,borderRadius:5,padding:"1px 5px",fontSize:9,
      fontWeight:700,fontFamily:"'Syne',sans-serif",letterSpacing:0.8}}>
      {label}
    </span>
  );
}
