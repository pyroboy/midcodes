import "../styles.js";

import { useState } from "react";
import { PACKAGES, MEATS, SIDES, FLOOR_TABLES, INIT_INV } from "../constants.js";
import { MEAT_CATALOG, SIDES_CATALOG, PANTRY_CATALOG, initMeatStock, initSideStock, initPantryStock, RECIPES } from "../adminConstants.js";
import { uid, sBill, sCost, sMeatG, fc } from "../helpers.js";
import { Chip } from "./ui/Chip.jsx";
import { UserBadge } from "./ui/UserBadge.jsx";
import { MWrap } from "./ui/MWrap.jsx";
import { Splash } from "./Splash.jsx";
import { PINModal } from "./PINModal.jsx";
import { FloorMap } from "./FloorMap.jsx";
import { RunningBill } from "./RunningBill.jsx";
import { AddItemModal } from "./AddItemModal.jsx";
import { KitchenView } from "./KitchenView.jsx";
import { Reports } from "./Reports.jsx";
import { ReceiptModal } from "./ReceiptModal.jsx";
import { OpenForm } from "./forms/OpenForm.jsx";
import { PaxForm } from "./forms/PaxForm.jsx";

// Admin components
import { StockManager } from "./admin/StockManager.jsx";
import { YieldHub } from "./admin/YieldHub.jsx";
import { RecipeView } from "./admin/RecipeView.jsx";
import { MenuManager } from "./admin/MenuManager.jsx";
import { MeatInputModal } from "./admin/MeatInputModal.jsx";
import { SideInputModal } from "./admin/SideInputModal.jsx";
import { Tag } from "./admin/Tag.jsx";

export default function App() {
  /* ═══════════════ STATE ═══════════════ */
  const [user,      setUser]      = useState(null);
  const [view,      setView]      = useState("floor");
  const [tables,    setTables]    = useState(FLOOR_TABLES.map(t=>({...t,status:"available",session:null})));
  const [inv,       setInv]       = useState(INIT_INV);
  const [activeId,  setActiveId]  = useState(null);
  const [txns,      setTxns]      = useState([]);
  const [voidLog,   setVoidLog]   = useState([]);
  const [scpwdLog,  setScpwdLog]  = useState([]);
  const [leftLog,   setLeftLog]   = useState([]);
  const [modal,     setModal]     = useState(null);
  const [mdata,     setMdata]     = useState({});
  const [floorMenu, setFloorMenu] = useState(null);
  const [mergeFrom, setMergeFrom] = useState(null);
  const [transferFrom, setTransferFrom] = useState(null);
  const [pinGate,   setPinGate]   = useState(null);

  // Advanced stock (Admin)
  const [meatStock,  setMeatStock]  = useState(initMeatStock);
  const [sideStock,  setSideStock]  = useState(initSideStock);
  const [pantryStock,setPantryStock]= useState(initPantryStock);
  const [inputModal, setInputModal] = useState(null);
  const [auditLog,   setAuditLog]   = useState([]);
  const [showAudit,  setShowAudit]  = useState(false);

  // Yield Hub
  const [rawDeliveries, setRawDeliveries] = useState([
    { id:"rd1", meatId:"beef_shortrib", kg:6, costPerKg:750, arrivedAt:Date.now()-86400000 },
    { id:"rd2", meatId:"pork_samgyup",  kg:10,costPerKg:380, arrivedAt:Date.now()-43200000 },
  ]);
  const [yieldLog, setYieldLog] = useState([]);
  const [rcvForm,  setRcvForm]  = useState({ meatId:"beef_shortrib", kg:"", costPerKg:"" });

  /* ═══════════════ DERIVED ═══════════════ */
  const atd       = tables.find(t=>t.id===activeId);
  const role      = user?.role || "staff";
  const isManager = role === "manager";
  const isKitchen = role === "kitchen";
  const isStaff   = role === "staff";

  /* ═══════════════ HELPERS ═══════════════ */
  const requireManager = (reason, cb) => {
    if (isManager) { cb(); return; }
    setPinGate({ reason, onSuccess: cb });
  };

  const deduct = (id, amt) =>
    setInv(p=>({...p,[id]:{...p[id],stock:Math.max(0,p[id].stock-amt)}}));

  const addOrder = (tid, order) =>
    setTables(p=>p.map(t=>t.id!==tid?t:{
      ...t,session:{...t.session,orders:[...t.session.orders,
        {...order,id:uid(),time:Date.now(),voided:false}]}
    }));

  /* ═══════════════ TABLE OPERATIONS ═══════════════ */

  // Open table — pax only, no package required
  const openTable = (tid, n) => {
    const persons = parseInt(n);
    setTables(p=>p.map(t=>t.id!==tid?t:{...t,status:"occupied",
      session:{id:uid(),persons,pkgId:null,openedAt:Date.now(),orders:[],mergedFrom:[]}}));
    setActiveId(tid); setFloorMenu(null); setModal(null);
  };

  // Select or swap package
  const selectPackage = pkgId => {
    if (!atd?.session) return;
    const pkg     = PACKAGES.find(p=>p.id===pkgId);
    const persons = atd.session.persons;
    const gId     = uid(); // group ID for audit
    // Keep non-package, non-auto orders
    const kept = atd.session.orders.filter(o=>o.type!=="package"&&!o.isAuto&&!o.voided);
    const newOrders = [
      { type:"package", itemId:pkg.id, name:`${pkg.name} × ${persons} pax`,
        price:pkg.price*persons, cost:0, note:`${pkg.emoji} ${pkg.desc}`,
        time:Date.now(), id:uid(), voided:false },
      ...pkg.auto_sides.map(sid=>{
        const s = SIDES.find(x=>x.id===sid); if(!s) return null;
        const qty = persons; deduct(sid,qty);
        adjustSide(sid, -qty, `Auto · ${pkg.name} · ${atd?.label||""} (${persons}pax)`, gId);
        return { type:"side", itemId:sid, name:s.name, qty, price:0, cost:s.cost*qty,
          note:`×${qty} included`, isAuto:true, time:Date.now(), id:uid(), voided:false };
      }).filter(Boolean),
      ...kept,
    ];
    setTables(p=>p.map(t=>t.id!==activeId?t:{...t,session:{...t.session,pkgId,orders:newOrders}}));
  };

  // Add meat by weight
  const addMeat = (meat, grams) => {
    const g = parseFloat(grams); if(!g||g<=0) return;
    const gId = uid();
    addOrder(activeId,{ type:"meat", itemId:meat.id, name:meat.name,
      weight_g:g, price:0, cost:(g/100)*meat.cost_per_100g, note:`${g}g`, isFree:true });
    if(inv[meat.id]) deduct(meat.id,g);

    // Map general meat.id to detailed service pools
    const MEAT_INV_MAP = {
      meat_samgyup: "pork_samgyup_sliced",
      meat_liempo:  "pork_liempo_sliced",
      meat_kasim:   "pork_kasim_sliced",
      meat_beef:    "beef_shortrib_sliced",
      meat_chadol:  "beef_chadol_sliced"
    };
    
    // Also deduct from detailed meatStock service pool to keep it in sync
    const vId = MEAT_INV_MAP[meat.id];
    if (vId) adjustMeat(vId, -g, `Order · ${atd?.label||""}`, gId);
  };

  const addSide = side => {
    const gId = uid();
    addOrder(activeId,{ type:"side", itemId:side.id, name:side.name, qty:1,
      price:0, cost:side.cost, isFree:true });
    if(inv[side.id]) deduct(side.id,1);
    adjustSide(side.id, -1, `Order · ${atd?.label||""}`, gId);
  };

  const addPaid = item => {
    const oId = uid();
    addOrder(activeId,{
      type:item.id.startsWith("drk")?"drink":"dish",
      itemId:item.id, name:item.name, qty:1, price:item.price, cost:Math.round(item.price*0.35),
      id:oId
    });

    // Check for recipe deductions
    const rec = RECIPES.find(r => r.dishId === item.id);
    if (rec) {
      const gId = `recipe_${oId}`;
      rec.ingredients.forEach(ing => {
        if (!ing.invId) return;
        const note = `Recipe · ${rec.name} · ${atd?.label||""}`;
        if (ing.source === "meat_scrap") adjustMeat(ing.invId, -ing.qty, note, gId);
        else if (ing.source === "side") adjustSide(ing.invId, -ing.qty, note, gId);
        else if (ing.source === "pantry") adjustPantry(ing.invId, -ing.qty, note, gId);
      });
    }
  };

  const voidItem = (tid, orderId) => requireManager("Void order item",()=>{
    const t = tables.find(x=>x.id===tid);
    const o = t?.session?.orders.find(x=>x.id===orderId);
    setVoidLog(p=>[...p,{orderId,tableLabel:t?.label,itemName:o?.name,price:o?.price,
      voidedBy:user?.name,approvedBy:isManager?user?.name:"Manager",time:Date.now()}]);
    setTables(p=>p.map(t=>t.id!==tid?t:{...t,session:{...t.session,orders:t.session.orders.map(o=>
      o.id===orderId?{...o,voided:true,voidedAt:Date.now(),voidedBy:user?.name}:o
    )}}));
  });

  const changePax = (tid, newPax) => {
    setTables(p=>p.map(t=>t.id!==tid?t:{...t,session:{...t.session,persons:parseInt(newPax)}}));
    setModal(null); setFloorMenu(null);
  };

  const voidTable = tid => requireManager("Void entire table",()=>{
    const t = tables.find(x=>x.id===tid);
    if(t?.session) {
      t.session.orders.filter(o=>!o.voided&&o.price>0).forEach(o=>{
        setVoidLog(p=>[...p,{orderId:o.id,tableLabel:t.label,itemName:o.name,price:o.price,
          voidedBy:user?.name,approvedBy:user?.name,time:Date.now(),reason:"Table Void"}]);
      });
    }
    setTables(p=>p.map(t=>t.id!==tid?t:{...t,status:"available",session:null}));
    if(activeId===tid) setActiveId(null);
    setFloorMenu(null); setModal(null);
  });

  // Merge
  const startMerge = tid => { setMergeFrom(tid); setFloorMenu(null); };
  const completeMerge = targetId => {
    const src = tables.find(t=>t.id===mergeFrom);
    const tgt = tables.find(t=>t.id===targetId);
    if(!src?.session||!tgt?.session){ setMergeFrom(null); return; }
    setTables(p=>p.map(t=>{
      if(t.id===targetId) return{...t,session:{...t.session,
        persons:tgt.session.persons+src.session.persons,
        orders:[...tgt.session.orders,...src.session.orders.map(o=>
          ({...o,note:(o.note||"")+` [from ${src.label}]`,id:uid()}))],
        mergedFrom:[...(tgt.session.mergedFrom||[]),src.label]}};
      if(t.id===mergeFrom) return{...t,status:"available",session:null};
      return t;
    }));
    if(activeId===mergeFrom) setActiveId(targetId);
    setMergeFrom(null);
  };

  // Transfer
  const startTransfer = tid => { setTransferFrom(tid); setFloorMenu(null); };
  const completeTransfer = targetId => {
    const src = tables.find(t=>t.id===transferFrom);
    const tgt = tables.find(t=>t.id===targetId);
    if(!src?.session||tgt?.status==="occupied"){ setTransferFrom(null); return; }
    setTables(p=>p.map(t=>{
      if(t.id===targetId) return{...t,status:"occupied",session:{...src.session}};
      if(t.id===transferFrom) return{...t,status:"available",session:null};
      return t;
    }));
    if(activeId===transferFrom) setActiveId(targetId);
    setTransferFrom(null);
  };

  const closeTable = (tid, method, disc, leftover) => {
    const t = tables.find(x=>x.id===tid);
    const bill    = sBill(t.session);
    const discAmt = disc.type==="senior"?bill*0.2:disc.type==="promo10"?bill*0.1:0;
    const finalBill = bill - discAmt;
    setTxns(p=>[...p,{...t.session,tableLabel:t.label,closedAt:Date.now(),method,disc,finalBill,
      meatG:sMeatG(t.session),closedBy:user?.name}]);
    if(disc.type==="senior"||disc.type==="pwd"){
      setScpwdLog(p=>[...p,{tableLabel:t.label,customerName:disc.customerName,
        idNumber:disc.idNumber,discountType:disc.type,grossAmount:bill,
        discountAmt:discAmt,netAmount:finalBill,cashier:user?.name,time:Date.now()}]);
    }
    if(leftover.applied){
      setLeftLog(p=>[...p,{tableLabel:t.label,persons:t.session.persons,
        gramsLeftover:leftover.grams,penalty:leftover.penalty,
        overrideBy:leftover.override?user?.name:null,time:Date.now(),cashier:user?.name}]);
    }
    setTables(p=>p.map(t=>t.id!==tid?t:{...t,status:"available",session:null}));
    setActiveId(null); setModal(null);
  };

  /* ── Floor map interactions ── */
  const handleTableClick = t => {
    if(mergeFrom){
      if(t.status==="occupied"&&t.id!==mergeFrom) completeMerge(t.id);
      else setMergeFrom(null);
      return;
    }
    if(transferFrom){
      if(t.status!=="occupied"&&t.id!==transferFrom) completeTransfer(t.id);
      else setTransferFrom(null);
      return;
    }
    if(t.status!=="occupied"){
      setMdata({tid:t.id,label:t.label}); setModal("open");
    } else {
      // If clicking already-active table, show context menu. Otherwise select it.
      if(activeId===t.id) {
        setFloorMenu(floorMenu?.tid===t.id?null:{tid:t.id});
      } else {
        setActiveId(t.id); setFloorMenu(null);
      }
    }
  };

  const handleFloorMenuAction = (action, t) => {
    setFloorMenu(null);
    if(action==="view")      { setActiveId(t.id); }
    if(action==="changePax") { setMdata({tid:t.id}); setModal("changePax"); }
    if(action==="merge")     { startMerge(t.id); }
    if(action==="transfer")  { startTransfer(t.id); }
    if(action==="void")      { voidTable(t.id); }
  };

  /* ── Advanced stock helpers (with audit logging) ── */
  const logAudit = (itemName, category, delta, unit, note, groupId = null, image = null) => {
    setAuditLog(prev => [{
      itemName, category, delta, unit, note, groupId, image,
      userName: user?.name || "System",
      userRole: user?.role || "staff",
      time: Date.now(),
    }, ...prev].slice(0, 200));
  };

  const adjustMeat = (variantId, delta, note = "", groupId = null, image = null) => {
    const allVariants = MEAT_CATALOG.flatMap(m => m.variants);
    const variant = allVariants.find(v => v.id === variantId);
    setMeatStock(p => {
      const cur = p[variantId]?.current ?? 0;
      const next = Math.max(0, cur + delta);
      return { ...p, [variantId]: {
        current: next,
        history: [{ delta, note, time:Date.now(), before:cur, after:next }, ...(p[variantId]?.history||[])].slice(0,30),
      }};
    });
    if (variant) logAudit(variant.label, "Meat", delta, "g", note, groupId, image);
  };

  const adjustSide = (sideId, delta, note = "", groupId = null, image = null) => {
    const side = SIDES_CATALOG.find(s => s.id === sideId);
    setSideStock(p => {
      const cur = p[sideId]?.current ?? 0;
      const next = Math.max(0, cur + delta);
      return { ...p, [sideId]: {
        current: next,
        history: [{ delta, note, time:Date.now(), before:cur, after:next }, ...(p[sideId]?.history||[])].slice(0,30),
      }};
    });
    if (side) logAudit(side.name, "Side", delta, side.unit, note, groupId, image);
  };

  const adjustPantry = (itemId, delta, note = "", groupId = null, image = null) => {
    const item = PANTRY_CATALOG.find(p => p.id === itemId);
    setPantryStock(p => {
      const cur = p[itemId]?.current ?? 0;
      const next = Math.max(0, cur + delta);
      return { ...p, [itemId]: {
        current: next,
        history: [{ delta, note, time:Date.now(), before:cur, after:next }, ...(p[itemId]?.history||[])].slice(0,30),
      }};
    });
    if (item) logAudit(item.name, "Pantry", delta, item.unit, note, groupId, image);
  };

  /* ═══════════════ COMPUTED ═══════════════ */
  const occ = tables.filter(t=>t.status==="occupied").length;

  const totalServableG = MEAT_CATALOG.reduce((sum, m) => {
    const sv = m.variants.find(v => v.pool === "service");
    return sum + (sv ? (meatStock[sv.id]?.current ?? 0) : 0);
  }, 0);

  /* ═══════════════ NAVIGATION ═══════════════ */
  // Role-based nav:
  // Staff:   Floor, Reports (limited)
  // Manager: Floor, Meat Stock, Pantry, Yield Hub, Recipes, Menu, Reports (full)
  // Kitchen: Kitchen Queue
  const NAV_ITEMS = [
    { k:"floor",   icon:"⬜", label:"Floor",      roles:["staff","manager"] },
    { k:"kitchen", icon:"🍳", label:"Kitchen",    roles:["kitchen"] },
    { k:"stock",   icon:"📦", label:"Stock",      roles:["manager"] },
    { k:"yield",   icon:"⚗️", label:"Yield Hub",  roles:["manager"] },
    { k:"recipes", icon:"📖", label:"Recipes",    roles:["manager"] },
    { k:"menu",    icon:"🍽️", label:"Menu",       roles:["manager"] },
    { k:"reports", icon:"📊", label:"Reports",    roles:["staff","manager"] },
  ];

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(role));

  // Auto-set view on login
  if (user && !visibleNav.find(n => n.k === view)) {
    const first = visibleNav[0]?.k;
    if (first && first !== view) setView(first);
  }

  if (!user) return <Splash onLogin={u => { setUser(u); setView(u.role==="kitchen"?"kitchen":"floor"); }}/>;

  return (
    <div className="app">
      {/* ═══ TOP BAR ═══ */}
      <div style={{height:52,background:"var(--panel)",borderBottom:"1px solid var(--border)",
        display:"flex",alignItems:"center",padding:"0 16px",gap:12,flexShrink:0}}>
        <span style={{fontSize:20}}>🔥</span>
        <span className="hd" style={{fontSize:21,color:"var(--ember)",letterSpacing:0.5}}>SAMGYUP</span>
        <span className="mono" style={{fontSize:9,color:"var(--muted)"}}>POS</span>
        <div style={{display:"flex",gap:3,marginLeft:4}}>
          {visibleNav.map(({k,icon,label,roles:r})=>(
            <button key={k} className="btn" onClick={()=>{
              setView(k);setActiveId(null);setFloorMenu(null);setMergeFrom(null);setTransferFrom(null);
            }} style={{
              background:view===k?"var(--ember)":"transparent",
              color:view===k?"#fff":"var(--muted)",
              padding:"5px 12px",borderRadius:8,fontSize:12,letterSpacing:0.5,
              position:"relative",
            }}>
              {icon} {label}
              {!r.includes("staff") && (
                <span style={{
                  position:"absolute", top:-2, right:-2,
                  width:6, height:6, borderRadius:"50%",
                  background: r.includes("kitchen") ? "#b45309" : "#7c3aed",
                }}/>
              )}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:6,marginLeft:"auto",alignItems:"center"}}>
          <Chip label={`${occ} occ`} c="#f97316"/>
          <Chip label={`${17-occ} free`} c="#16a34a"/>
          {view === "stock" && (
            <Tag color="#16a34a" bg="#052e16">{(totalServableG/1000).toFixed(1)}kg servable</Tag>
          )}
        </div>
        <UserBadge user={user} onLogout={()=>{setUser(null);setActiveId(null);setView("floor");}}/>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{flex:1,overflow:"hidden",display:"flex",position:"relative"}}>

        {/* ── FLOOR = FloorMap + RunningBill side panel ── */}
        {view==="floor"&&(
          <>
            <FloorMap
              tables={tables} mergeFrom={mergeFrom} transferFrom={transferFrom}
              floorMenu={floorMenu} activeId={activeId} isManager={isManager}
              onTableClick={handleTableClick}
              onFloorMenuAction={handleFloorMenuAction}
              onDismissFloorMenu={()=>setFloorMenu(null)}
              onCancelMerge={()=>setMergeFrom(null)}
              onCancelTransfer={()=>setTransferFrom(null)}
            />
            {/* Side panel — Running Bill */}
            {activeId && atd?.session && (
              <RunningBill
                table={atd} session={atd.session}
                isManager={isManager} isKitchen={isKitchen}
                onVoidItem={id=>voidItem(activeId,id)}
                onVoidTable={()=>voidTable(activeId)}
                onCheckout={()=>setModal("receipt")}
                onAdd={()=>setModal("addItem")}
                onChangePax={()=>{setMdata({tid:activeId});setModal("changePax");}}
                onClose={()=>setActiveId(null)}
              />
            )}
          </>
        )}

        {/* ── KITCHEN VIEW ── */}
        {view==="kitchen"&&(
          <KitchenView tables={tables}/>
        )}

        {/* ── STOCK (Manager) — Merged Meats + Sides + Pantry ── */}
        {view==="stock"&&(
          <StockManager
            meatStock={meatStock} sideStock={sideStock} pantryStock={pantryStock}
            auditLog={auditLog}
            onMeatInputModal={(meatId,variantId)=>setInputModal({meatId,variantId})}
            onSideInputModal={(sideId)=>setInputModal({sideId})}
            onPantryAdjust={adjustPantry}
            showAudit={showAudit}
            onToggleAudit={()=>setShowAudit(p=>!p)}
          />
        )}

        {/* ── YIELD HUB (Manager) ── */}
        {view==="yield"&&(
          <div style={{flex:1,overflow:"auto",padding:"16px 20px"}} className="scr fi">
            <YieldHub
              rawDeliveries={rawDeliveries} setRawDeliveries={setRawDeliveries}
              yieldLog={yieldLog} setYieldLog={setYieldLog}
              meatStock={meatStock} adjustMeat={adjustMeat}
              rcvForm={rcvForm} setRcvForm={setRcvForm}
            />
          </div>
        )}

        {/* ── RECIPES (Manager) ── */}
        {view==="recipes"&&<RecipeView/>}

        {/* ── MENU (Manager) ── */}
        {view==="menu"&&<MenuManager/>}

        {/* ── REPORTS ── */}
        {view==="reports"&&(
          <Reports txns={txns} voidLog={voidLog} scpwdLog={scpwdLog} leftLog={leftLog} isManager={isManager}/>
        )}
      </div>

      {/* ═══ MODALS ═══ */}
      {modal==="open"&&(
        <MWrap title={`Open ${mdata.label}`} onClose={()=>setModal(null)}>
          <OpenForm onConfirm={n=>openTable(mdata.tid,n)}/>
        </MWrap>
      )}
      {modal==="addItem"&&atd?.session&&(
        <AddItemModal
          session={atd.session} inv={inv} isManager={isManager}
          onSelectPackage={selectPackage}
          onAddMeat={addMeat}
          onAddSide={addSide}
          onAddPaid={addPaid}
          onClose={()=>setModal(null)}
        />
      )}
      {modal==="changePax"&&(
        <MWrap title="Change Pax" onClose={()=>setModal(null)}>
          <PaxForm current={tables.find(t=>t.id===mdata.tid)?.session?.persons||2}
            onConfirm={n=>changePax(mdata.tid,n)}/>
        </MWrap>
      )}
      {modal==="receipt"&&atd?.session&&(
        <ReceiptModal
          table={atd} session={atd.session} bill={sBill(atd.session)}
          cost={sCost(atd.session)} meatG={sMeatG(atd.session)} isManager={isManager}
          onClose={()=>setModal(null)}
          onConfirm={(method,disc,leftover)=>closeTable(activeId,method,disc,leftover)}
        />
      )}
      {pinGate&&(
        <PINModal reason={pinGate.reason}
          onSuccess={()=>{pinGate.onSuccess();setPinGate(null);}}
          onClose={()=>setPinGate(null)}/>
      )}
      {floorMenu&&<div style={{position:"fixed",inset:0,zIndex:90}} onClick={()=>setFloorMenu(null)}/>}

      {/* Admin input modals */}
      {inputModal && inputModal.meatId && (
        <MeatInputModal
          meatId={inputModal.meatId} variantId={inputModal.variantId}
          meatStock={meatStock} onAdjust={adjustMeat}
          onClose={()=>setInputModal(null)}
        />
      )}
      {inputModal && inputModal.sideId && (
        <SideInputModal
          sideId={inputModal.sideId} sideStock={sideStock}
          onAdjust={adjustSide} onClose={()=>setInputModal(null)}
        />
      )}
    </div>
  );
}
