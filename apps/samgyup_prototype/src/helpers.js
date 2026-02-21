export const fc  = n=>`₱${Number(n).toLocaleString("en-PH",{minimumFractionDigits:2})}`;
export const ft  = ts=>new Date(ts).toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"});
export const fd  = ts=>new Date(ts).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"});
export const ela = ts=>{const m=Math.floor((Date.now()-ts)/60000);return m<60?`${m}m`:`${Math.floor(m/60)}h${m%60}m`;};
export const uid = ()=>Date.now()+Math.random();
export const sBill = s=>s?.orders.filter(o=>!o.voided).reduce((a,o)=>a+o.price,0)??0;
export const sCost = s=>s?.orders.filter(o=>!o.voided).reduce((a,o)=>a+(o.cost||0),0)??0;
export const sMeatG= s=>s?.orders.filter(o=>o.type==="meat"&&!o.voided).reduce((a,o)=>a+(o.weight_g||0),0)??0;
