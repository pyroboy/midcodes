// Injects Google Fonts and global CSS classes once at module load time.
const _fl = document.createElement("link");
_fl.rel = "stylesheet";
_fl.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap";
document.head.appendChild(_fl);

const _gs = document.createElement("style");
_gs.textContent = `
*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a}
:root{
  --bg:#0a0a0a;--panel:#111111;--card:#181818;--card2:#1e1e1e;
  --border:#222;--border2:#2c2c2c;--border3:#363636;
  --ember:#f97316;--ember2:#7c2d12;--ember3:#431407;--edim:#7c2d12;
  --green:#16a34a;--green2:#052e16;--blue:#1d4ed8;
  --purple:#7c3aed;--purple2:#2e1065;
  --gold:#ca8a04;--gold2:#451a03;
  --red:#dc2626;--red2:#450a0a;
  --text:#e8e3db;--text2:#c4bfb7;--muted:#6b7280;--muted2:#4b5563;--muted3:#374151;
}
.app{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);height:100vh;display:flex;flex-direction:column;overflow:hidden}
.hd{font-family:'Syne',sans-serif}.mono{font-family:'DM Mono',monospace}
.scr{overflow:auto;scrollbar-width:thin;scrollbar-color:#222 transparent}
.scr::-webkit-scrollbar{width:5px}.scr::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:4px}
.tbl{transition:transform .12s;cursor:pointer}.tbl:hover{transform:scale(1.04)}
.pulse{animation:pu 2s infinite}@keyframes pu{0%,100%{opacity:1}50%{opacity:.4}}
.fi{animation:fi .22s cubic-bezier(.16,1,.3,1)}@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.pop{animation:pop .2s cubic-bezier(.34,1.56,.64,1)}@keyframes pop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
.ring{animation:rg 2s cubic-bezier(0,0,.2,1) infinite}@keyframes rg{0%{transform:scale(.9);opacity:.8}70%{transform:scale(1.3);opacity:0}100%{opacity:0}}
.splash{position:fixed;inset:0;background:#0d0d0d;display:flex;align-items:center;justify-content:center;z-index:100}
.splash-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 30% 60%,#7c2d1220 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,#1d4ed815 0%,transparent 50%)}
input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
input[type=number]{-moz-appearance:textfield}
input,select{font-family:'DM Sans',sans-serif;color:var(--text)}
.btn{cursor:pointer;border:none;font-family:'Syne',sans-serif;font-weight:700;transition:all .12s}
.btn:hover{opacity:.88}.btn:active{transform:scale(.97)}
.card-hover{transition:border-color .15s,box-shadow .15s}
.card-hover:hover{border-color:var(--border3)!important;box-shadow:0 4px 24px rgba(0,0,0,.4)}
.img-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.05) 0%,rgba(0,0,0,.7) 100%)}
.tag{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:20px;
  font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:.6px}
`;
document.head.appendChild(_gs);
