export function MWrap({title, onClose, children}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",
      alignItems:"center",justifyContent:"center",zIndex:150,padding:16}}>
      <div style={{background:"var(--panel)",border:"1px solid var(--border2)",borderRadius:16,
        padding:20,width:"100%",maxWidth:380,maxHeight:"90vh",overflow:"auto"}} className="scr fi">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span className="hd" style={{fontSize:18}}>{title}</span>
          <button className="btn" onClick={onClose} style={{background:"none",color:"var(--muted)",fontSize:20}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
