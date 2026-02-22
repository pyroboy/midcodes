import "../styles.js";

import { useState, useEffect, useRef } from "react";
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

import { RecipeView } from "./admin/RecipeView.jsx";
import { MenuManager } from "./admin/MenuManager.jsx";
import { MeatInputModal } from "./admin/MeatInputModal.jsx";
import { SideInputModal } from "./admin/SideInputModal.jsx";
import { Tag } from "./admin/Tag.jsx";

/* ── localStorage helpers ── */
const LS_PREFIX = "samgyup_";
const lsGet = (key, fallback) => { try { const v = localStorage.getItem(LS_PREFIX + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const lsSet = (key, val) => { try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(val)); } catch {} };

const DEFAULT_TABLES = FLOOR_TABLES.map(t=>({...t,status:"available",session:null}));

export default function App() {
  /* ═══════════════ STATE ═══════════════ */
  const [user,      setUser]      = useState(null);
  const [view,      setView]      = useState("floor");
  const [tables,    setTables]    = useState(() => lsGet("tables", DEFAULT_TABLES));
  const [inv,       setInv]       = useState(() => lsGet("inv", INIT_INV));
  const [activeId,  setActiveId]  = useState(null);
  const [txns,      setTxns]      = useState(() => lsGet("txns", []));
  const [voidLog,   setVoidLog]   = useState(() => lsGet("voidLog", []));
  const [scpwdLog,  setScpwdLog]  = useState(() => lsGet("scpwdLog", []));
  const [leftLog,   setLeftLog]   = useState(() => lsGet("leftLog", []));
  const [modal,     setModal]     = useState(null);
  const [mdata,     setMdata]     = useState({});
  const [floorMenu, setFloorMenu] = useState(null);
  const [mergeFrom, setMergeFrom] = useState(null);
  const [transferFrom, setTransferFrom] = useState(null);
  const [pinGate,   setPinGate]   = useState(null);

  // Advanced stock (Admin)
  const [meatStock,  setMeatStock]  = useState(() => lsGet("meatStock", initMeatStock()));
  const [sideStock,  setSideStock]  = useState(() => lsGet("sideStock", initSideStock()));
  const [pantryStock,setPantryStock]= useState(() => lsGet("pantryStock", initPantryStock()));
  const [inputModal, setInputModal] = useState(null);
  const [auditLog,   setAuditLog]   = useState(() => lsGet("auditLog", []));
  const [showAudit,  setShowAudit]  = useState(false);

  // Receipt counter (BIR)
  const [receiptCounter, setReceiptCounter] = useState(() => lsGet("receiptCounter", 0));

  // Time alerts & stock alerts
  const [timeAlerts, setTimeAlerts] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [hiddenAlerts, setHiddenAlerts] = useState([]);

  /* ═══════════════ PERSISTENCE ═══════════════ */
  useEffect(() => { lsSet("tables", tables); }, [tables]);
  useEffect(() => { lsSet("inv", inv); }, [inv]);
  useEffect(() => { lsSet("txns", txns); }, [txns]);
  useEffect(() => { lsSet("voidLog", voidLog); }, [voidLog]);
  useEffect(() => { lsSet("scpwdLog", scpwdLog); }, [scpwdLog]);
  useEffect(() => { lsSet("leftLog", leftLog); }, [leftLog]);
  useEffect(() => { lsSet("meatStock", meatStock); }, [meatStock]);
  useEffect(() => { lsSet("sideStock", sideStock); }, [sideStock]);
  useEffect(() => { lsSet("pantryStock", pantryStock); }, [pantryStock]);
  useEffect(() => { lsSet("auditLog", auditLog); }, [auditLog]);
  useEffect(() => { lsSet("receiptCounter", receiptCounter); }, [receiptCounter]);

  /* ═══════════════ BROADCAST CHANNEL (multi-tab sync) ═══════════════ */
  const bcRef = useRef(null);
  const ignoreNextBroadcast = useRef(false);

  useEffect(() => {
    const bc = new BroadcastChannel("samgyup_pos");
    bcRef.current = bc;
    bc.onmessage = (e) => {
      const { key, value } = e.data;
      ignoreNextBroadcast.current = true;
      if (key === "tables") setTables(value);
      else if (key === "inv") setInv(value);
      else if (key === "txns") setTxns(value);
      else if (key === "meatStock") setMeatStock(value);
      else if (key === "sideStock") setSideStock(value);
      else if (key === "pantryStock") setPantryStock(value);
      else if (key === "auditLog") setAuditLog(value);
      else if (key === "voidLog") setVoidLog(value);
      else if (key === "receiptCounter") setReceiptCounter(value);
    };
    return () => bc.close();
  }, []);

  const broadcast = (key, value) => {
    if (ignoreNextBroadcast.current) { ignoreNextBroadcast.current = false; return; }
    bcRef.current?.postMessage({ key, value });
  };

  // Broadcast on state changes
  useEffect(() => { broadcast("tables", tables); }, [tables]);
  useEffect(() => { broadcast("inv", inv); }, [inv]);
  useEffect(() => { broadcast("txns", txns); }, [txns]);
  useEffect(() => { broadcast("meatStock", meatStock); }, [meatStock]);
  useEffect(() => { broadcast("sideStock", sideStock); }, [sideStock]);
  useEffect(() => { broadcast("pantryStock", pantryStock); }, [pantryStock]);
  useEffect(() => { broadcast("auditLog", auditLog); }, [auditLog]);
  useEffect(() => { broadcast("voidLog", voidLog); }, [voidLog]);
  useEffect(() => { broadcast("receiptCounter", receiptCounter); }, [receiptCounter]);

  /* ═══════════════ SESSION TIME LIMITS (90 min) ═══════════════ */
  const SESSION_LIMIT_MS = 90 * 60 * 1000;
  const [, setTick] = useState(0); // force re-render for live timers
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30000); // every 30s
    return () => clearInterval(iv);
  }, []);

  const getTimeStatus = (openedAt) => {
    if (!openedAt) return "ok";
    const elapsed = Date.now() - openedAt;
    if (elapsed >= SESSION_LIMIT_MS) return "overtime";
    if (elapsed >= 80 * 60 * 1000) return "warning_red";
    if (elapsed >= 60 * 60 * 1000) return "warning_yellow";
    return "ok";
  };

  /* ═══════════════ STOCK ALERTS (low/out items) ═══════════════ */
  useEffect(() => {
    const alerts = [];
    // Check basic inventory
    Object.entries(inv).forEach(([id, v]) => {
      if (v.stock <= 0) alerts.push({ id, name: id.replace(/_/g, " "), level: "out" });
      else if (v.stock <= v.low) alerts.push({ id, name: id.replace(/_/g, " "), level: "low" });
    });
    // Check meat service pools
    MEAT_CATALOG.forEach(m => {
      const sv = m.variants.find(v => v.pool === "service");
      if (sv) {
        const cur = meatStock[sv.id]?.current ?? 0;
        if (cur <= 0) alerts.push({ id: sv.id, name: sv.label, level: "out" });
        else if (cur < 500) alerts.push({ id: sv.id, name: sv.label, level: "low" });
      }
    });
    // Check sides
    SIDES_CATALOG.forEach(s => {
      const cur = sideStock[s.id]?.current ?? 0;
      if (cur <= 0) alerts.push({ id: s.id, name: s.name, level: "out" });
      else if (cur < s.par * 0.3) alerts.push({ id: s.id, name: s.name, level: "low" });
    });
    setStockAlerts(alerts);
  }, [inv, meatStock, sideStock, pantryStock]);

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
    setActiveId(tid); setFloorMenu(null); setModal("addItem");
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
  // Manager: Floor, Meat Stock, Pantry, Recipes, Menu, Reports (full)
  // Kitchen: Kitchen Queue
  const NAV_ITEMS = [
    { k:"floor",   icon:"⬜", label:"Floor",      roles:["staff","manager"] },
    { k:"kitchen", icon:"🍳", label:"Kitchen",    roles:["kitchen"] },
    { k:"stock",   icon:"📦", label:"Stock",      roles:["manager"] },

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
        <span className="hd" style={{fontSize:21,color:"var(--ember)",letterSpacing:0.5}}>WTF! SAMGYUP</span>
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

      {/* ═══ STOCK ALERT BAR ═══ */}
      {isManager && stockAlerts.length > 0 && (
        <div style={{
          padding:"6px 16px", background:"#451a03", borderBottom:"1px solid #92400e",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8, flexShrink:0, overflow:"hidden",
        }} className="stock-alert-flash">
          <span style={{fontSize:11,color:"#fbbf24",fontWeight:700,flexShrink:0}}>⚠ Low Stock:</span>
          <div style={{display:"flex",gap:4,overflow:"auto"}} className="no-scrollbar">
            {stockAlerts.filter(a => !hiddenAlerts.includes(a.id)).map(a => (
              <span 
                key={a.id} 
                className="stock-alert-pulse"
                style={{
                  fontSize:10, padding:"2px 8px", borderRadius:6, flexShrink:0,
                  background: a.level==="out" ? "#7f1d1d" : "#78350f",
                  color: a.level==="out" ? "#fca5a5" : "#fde68a",
                  fontWeight:600, cursor:"pointer",
                }}
                onClick={()=>setHiddenAlerts(prev=>[...prev, a.id])}
                title="Click to hide"
              >{a.level==="out"?"❌":"⚠"} {a.name} ✕</span>
            ))}
          </div>
          {hiddenAlerts.length > 0 && (
            <span 
              style={{fontSize:10, color:"#fbbf24", cursor:"pointer", marginLeft:8, flexShrink:0, textDecoration:"underline"}}
              onClick={()=>setHiddenAlerts([])}
            >👁 {hiddenAlerts.length} hidden</span>
          )}
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{flex:1,overflow:"hidden",display:"flex",position:"relative"}}>

        {/* ── FLOOR = FloorMap + RunningBill side panel ── */}
        {view==="floor"&&(
          <>
            <FloorMap
              tables={tables} mergeFrom={mergeFrom} transferFrom={transferFrom}
              floorMenu={floorMenu} activeId={activeId} isManager={isManager}
              getTimeStatus={getTimeStatus}
              onTableClick={handleTableClick}
              onFloorMenuAction={handleFloorMenuAction}
              onDismissFloorMenu={()=>{setFloorMenu(null);setActiveId(null);}}
              onCancelMerge={()=>setMergeFrom(null)}
              onCancelTransfer={()=>setTransferFrom(null)}
            />
            {/* Side panel — Running Bill */}
            {activeId && atd?.session ? (
              <RunningBill
                table={atd} session={atd.session}
                isManager={isManager} isKitchen={isKitchen}
                timeStatus={getTimeStatus(atd.session.openedAt)}
                onVoidItem={id=>voidItem(activeId,id)}
                onVoidTable={()=>voidTable(activeId)}
                onCheckout={()=>setModal("receipt")}
                onAdd={()=>setModal("addItem")}
                onChangePax={()=>{setMdata({tid:activeId});setModal("changePax");}}
                onPrintKOT={()=>setModal("kot")}
                onClose={()=>setActiveId(null)}
              />
            ) : (
              <div style={{width: 320, background: "var(--panel)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative"}} className="fi">
                {!isKitchen && (
                  <button className="btn" disabled style={{
                    position: "absolute", left: -36, top: "50%", transform: "translateY(-50%)",
                    width: 72, height: 72, background: "var(--card)", color: "var(--muted)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 2, border: "4px solid var(--border)", borderRadius: "50%",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.3)", opacity: 0.5, zIndex: 10, cursor: "not-allowed"
                  }}>
                    <span style={{ fontSize: 24, lineHeight: 1, marginTop: 4 }}>➕</span>
                    <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1 }}>ADD</span>
                  </button>
                )}
                <div style={{fontSize: 54, marginBottom: 16, opacity: 0.3}}>📋</div>
                <div style={{fontSize: 16, fontWeight: 600, color: "var(--muted)"}}>No Table Selected</div>
                <div style={{fontSize: 12, marginTop: 8, color: "var(--muted2)"}}>Tap an occupied table to view orders.</div>
              </div>
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
          onChangePax={(n) => changePax(activeId, n)}
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
          receiptNo={receiptCounter + 1}
          onClose={()=>setModal(null)}
          onConfirm={(method,disc,leftover)=>{
            setReceiptCounter(p => p + 1);
            closeTable(activeId,method,disc,leftover);
          }}
        />
      )}
      {/* KOT Print Preview */}
      {modal==="kot"&&atd?.session&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",
          alignItems:"center",justifyContent:"center",zIndex:150,padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div id="kot-print" style={{background:"#fff",color:"#000",borderRadius:12,width:"100%",maxWidth:320,
            padding:"20px 16px",fontFamily:"'Courier New',monospace",fontSize:12}}>
            <div style={{textAlign:"center",borderBottom:"2px dashed #000",paddingBottom:8,marginBottom:8}}>
              <div style={{fontSize:16,fontWeight:700}}>🔥 WTF! SAMGYUP</div>
              <div style={{fontSize:11}}>KITCHEN ORDER TICKET</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span><strong>Table:</strong> {atd.label}</span>
              <span><strong>Pax:</strong> {atd.session.persons}</span>
            </div>
            <div style={{marginBottom:8,fontSize:10,color:"#555"}}>
              {new Date().toLocaleString("en-PH",{dateStyle:"medium",timeStyle:"short"})}
            </div>
            <div style={{borderTop:"1px dashed #000",paddingTop:6}}>
              {atd.session.orders.filter(o=>!o.voided).map(o=>(
                <div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px dotted #ccc"}}>
                  <span>{o.type==="meat"?"🥩":o.type==="dish"?"🍜":o.type==="drink"?"🥤":"🥬"} {o.name}</span>
                  <span style={{fontWeight:700}}>{o.weight_g?o.weight_g+"g":o.qty||1}</span>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",marginTop:12,paddingTop:8,borderTop:"2px dashed #000",fontSize:10,color:"#888"}}>
              Printed: {new Date().toLocaleTimeString("en-PH")}
            </div>
          </div>
          <div style={{position:"absolute",bottom:40,display:"flex",gap:10}}>
            <button onClick={()=>{window.print();}} style={{background:"var(--ember)",color:"#fff",padding:"10px 24px",borderRadius:10,border:"none",fontSize:14,fontWeight:700,cursor:"pointer"}}>🖨 Print</button>
            <button onClick={()=>setModal(null)} style={{background:"var(--card)",color:"var(--muted)",padding:"10px 24px",borderRadius:10,border:"1px solid var(--border)",fontSize:14,cursor:"pointer"}}>Close</button>
          </div>
        </div>
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
