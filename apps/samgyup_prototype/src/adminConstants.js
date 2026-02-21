/* ═══════════════════════════════════════════════════════════
   MEAT CATALOG — Detailed variant tracking
═══════════════════════════════════════════════════════════ */
export const MEAT_CATALOG = [
  {
    id:"beef_shortrib", name:"Beef Short Rib", name_ko:"갈비", color:"#1d4ed8", emoji:"🐄",
    image:"https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=600&q=80",
    description:"USDA-grade bone-in short rib. High marbling. Grill-ready after slicing.",
    par_kg:5, cost_per_kg:750,
    variants:[
      { id:"beef_shortrib_raw",    label:"Whole Block",    sub:"Unprocessed raw",   unit:"g", icon:"🧱", color:"#374151", pool:"raw"     },
      { id:"beef_shortrib_sliced", label:"Sliced (Grill)", sub:"For samgyup plates",unit:"g", icon:"🔪", color:"#16a34a", pool:"service" },
      { id:"beef_shortrib_bones",  label:"Bones",          sub:"For broth / soups", unit:"g", icon:"🦴", color:"#6366f1", pool:"kitchen" },
      { id:"beef_shortrib_scraps", label:"Kitchen Scraps", sub:"Stew / bibimbap",   unit:"g", icon:"🍲", color:"#ca8a04", pool:"kitchen" },
      { id:"beef_shortrib_waste",  label:"True Waste",     sub:"Fat trim / gristle",unit:"g", icon:"🗑", color:"#4b5563", pool:"waste"   },
    ],
  },
  {
    id:"beef_chadol", name:"Beef Brisket", name_ko:"차돌박이", color:"#0891b2", emoji:"🥩",
    image:"https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80",
    description:"Thinly-sliced brisket with fat cap. Cooks fast. High customer turnover.",
    par_kg:4, cost_per_kg:700,
    variants:[
      { id:"beef_chadol_raw",    label:"Whole Block",    sub:"Unprocessed raw",    unit:"g", icon:"🧱", color:"#374151", pool:"raw"     },
      { id:"beef_chadol_sliced", label:"Sliced (Grill)", sub:"For samgyup plates", unit:"g", icon:"🔪", color:"#16a34a", pool:"service" },
      { id:"beef_chadol_fat",    label:"Fat Cap",        sub:"Grill seasoning",    unit:"g", icon:"🫙", color:"#6366f1", pool:"kitchen" },
      { id:"beef_chadol_scraps", label:"Kitchen Scraps", sub:"For soups / jjigae", unit:"g", icon:"🍲", color:"#ca8a04", pool:"kitchen" },
    ],
  },
  {
    id:"pork_samgyup", name:"Pork Belly", name_ko:"삼겹살", color:"#c2410c", emoji:"🐷",
    image:"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80",
    description:"Layered pork belly, 5-layer fat. Highest demand cut in the menu.",
    par_kg:8, cost_per_kg:380,
    variants:[
      { id:"pork_samgyup_raw",    label:"Whole Slab",     sub:"Unprocessed raw",    unit:"g", icon:"🧱", color:"#374151", pool:"raw"     },
      { id:"pork_samgyup_sliced", label:"Sliced (Grill)", sub:"For samgyup plates", unit:"g", icon:"🔪", color:"#16a34a", pool:"service" },
      { id:"pork_samgyup_scraps", label:"Kitchen Scraps", sub:"Fried rice / mandu", unit:"g", icon:"🍲", color:"#ca8a04", pool:"kitchen" },
      { id:"pork_samgyup_fat",    label:"Fat / Skin",     sub:"Grill greasing",     unit:"g", icon:"🫙", color:"#6366f1", pool:"kitchen" },
    ],
  },
  {
    id:"pork_liempo", name:"Pork Liempo", name_ko:"리엠포", color:"#d97706", emoji:"🥓",
    image:"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80",
    description:"Thicker pork belly cut, skin-on. Richer fat content. Popular reorder.",
    par_kg:6, cost_per_kg:350,
    variants:[
      { id:"pork_liempo_raw",    label:"Whole Slab",     sub:"Unprocessed raw",    unit:"g", icon:"🧱", color:"#374151", pool:"raw"     },
      { id:"pork_liempo_sliced", label:"Sliced (Grill)", sub:"For samgyup plates", unit:"g", icon:"🔪", color:"#16a34a", pool:"service" },
      { id:"pork_liempo_scraps", label:"Kitchen Scraps", sub:"Kimchi jjigae",      unit:"g", icon:"🍲", color:"#ca8a04", pool:"kitchen" },
    ],
  },
  {
    id:"pork_kasim", name:"Pork Kasim", name_ko:"카심", color:"#b45309", emoji:"🫀",
    image:"https://images.unsplash.com/photo-1645078834870-6d9c1875f5bd?w=600&q=80",
    description:"Pork collar / shoulder. Leaner cut with good marbling. Tender when thin-sliced.",
    par_kg:5, cost_per_kg:300,
    variants:[
      { id:"pork_kasim_raw",    label:"Whole Block",    sub:"Unprocessed raw",    unit:"g", icon:"🧱", color:"#374151", pool:"raw"     },
      { id:"pork_kasim_sliced", label:"Sliced (Grill)", sub:"For samgyup plates", unit:"g", icon:"🔪", color:"#16a34a", pool:"service" },
      { id:"pork_kasim_scraps", label:"Kitchen Scraps", sub:"Mandu / fried rice", unit:"g", icon:"🍲", color:"#ca8a04", pool:"kitchen" },
    ],
  },
];

/* ── SIDES CATALOG ───────────────────────────────────────── */
export const SIDES_CATALOG = [
  { id:"side_rice",     name:"Steamed Rice",   unit:"pc",  par:150, icon:"🍚", image:"https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&q=80" },
  { id:"side_lettuce",  name:"Lettuce Wrap",   unit:"set", par:80,  icon:"🥬", image:"https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80" },
  { id:"side_kimchi",   name:"Kimchi",         unit:"set", par:80,  icon:"🌶", image:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80" },
  { id:"side_sauce",    name:"Sauce Set",      unit:"set", par:100, icon:"🥫", image:"https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80" },
  { id:"side_garlic",   name:"Garlic & Onion", unit:"set", par:100, icon:"🧄", image:"https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&q=80" },
  { id:"side_mushroom", name:"Mushroom Set",   unit:"set", par:60,  icon:"🍄", image:"https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=400&q=80" },
  { id:"side_egg",      name:"Egg",            unit:"pc",  par:100, icon:"🥚", image:"https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80" },
  { id:"side_tofu",     name:"Grilled Tofu",   unit:"set", par:40,  icon:"⬜", image:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" },
  { id:"side_corn",     name:"Cheese Corn",    unit:"set", par:40,  icon:"🌽", image:"https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80" },
];

/* ── PANTRY / SUPPLIES CATALOG ───────────────────────────── */
export const PANTRY_CATALOG = [
  { id:"pantry_rice",       name:"Rice (Sack)",     unit:"kg",   par:50,   cost:45,   icon:"🍚", category:"Staples" },
  { id:"pantry_oil",        name:"Cooking Oil",     unit:"L",    par:20,   cost:85,   icon:"🫗", category:"Staples" },
  { id:"pantry_soy",        name:"Soy Sauce",       unit:"L",    par:10,   cost:60,   icon:"🫙", category:"Sauces" },
  { id:"pantry_sesame",     name:"Sesame Oil",      unit:"L",    par:5,    cost:320,  icon:"🫙", category:"Sauces" },
  { id:"pantry_salt",       name:"Salt",            unit:"kg",   par:5,    cost:25,   icon:"🧂", category:"Staples" },
  { id:"pantry_sugar",      name:"Sugar",           unit:"kg",   par:5,    cost:55,   icon:"🍬", category:"Staples" },
  { id:"pantry_gochujang",  name:"Gochujang",       unit:"kg",   par:5,    cost:280,  icon:"🌶", category:"Korean" },
  { id:"pantry_doenjang",   name:"Doenjang",        unit:"kg",   par:3,    cost:320,  icon:"🫘", category:"Korean" },
  { id:"pantry_gochugaru",  name:"Gochugaru",       unit:"kg",   par:3,    cost:450,  icon:"🌶", category:"Korean" },
  { id:"pantry_flour",      name:"Flour",           unit:"kg",   par:10,   cost:40,   icon:"🌾", category:"Staples" },
  { id:"pantry_eggs_tray",  name:"Eggs (Tray/30)",  unit:"tray", par:5,    cost:220,  icon:"🥚", category:"Fresh" },
  { id:"pantry_garlic_bulk",name:"Garlic (Bulk)",   unit:"kg",   par:5,    cost:180,  icon:"🧄", category:"Fresh" },
  { id:"pantry_onion",      name:"Onion",           unit:"kg",   par:10,   cost:80,   icon:"🧅", category:"Fresh" },
  { id:"pantry_tofu_bulk",  name:"Tofu (Block)",    unit:"pc",   par:30,   cost:35,   icon:"⬜", category:"Fresh" },
  { id:"pantry_noodles",    name:"Glass Noodles",   unit:"pack", par:20,   cost:45,   icon:"🍜", category:"Dry Goods" },
  { id:"pantry_ramyun",     name:"Ramyun Packs",    unit:"pack", par:50,   cost:25,   icon:"🍜", category:"Dry Goods" },
  { id:"pantry_tteok",      name:"Tteok (Rice Cake)",unit:"kg",  par:5,    cost:180,  icon:"🍡", category:"Korean" },
  { id:"pantry_seaweed",    name:"Seaweed Sheets",  unit:"pack", par:10,   cost:120,  icon:"🍙", category:"Dry Goods" },
  { id:"pantry_charcoal",   name:"Charcoal",        unit:"kg",   par:30,   cost:35,   icon:"⬛", category:"Supplies" },
  { id:"pantry_foil",       name:"Aluminum Foil",   unit:"roll", par:10,   cost:95,   icon:"🫙", category:"Supplies" },
  { id:"pantry_tissue",     name:"Tissue/Napkins",  unit:"pack", par:20,   cost:45,   icon:"🧻", category:"Supplies" },
  { id:"pantry_gloves",     name:"Disposable Gloves",unit:"box", par:5,    cost:180,  icon:"🧤", category:"Supplies" },
];

/* ── RECIPES ─────────────────────────────────────────────── */
export const RECIPES = [
  {
    id:"recipe_kimchijj", dishId:"dish_kimchijj", name:"Kimchi Jjigae", emoji:"🫕",
    category:"Soup", servings:1, prep_time:"15 min",
    description:"Spicy kimchi stew with pork scraps and tofu — uses kitchen scraps",
    ingredients:[
      { label:"Pork Scraps",  qty:80,  unit:"g",  source:"meat_scrap", invId:"pork_samgyup_scraps" },
      { label:"Kimchi",       qty:100, unit:"g",  source:"side", invId:"side_kimchi" },
      { label:"Tofu",         qty:0.5, unit:"pc", source:"pantry", invId:"pantry_tofu_bulk" },
      { label:"Gochugaru",    qty:10,  unit:"g",  source:"pantry", invId:"pantry_gochugaru" },
      { label:"Garlic",       qty:10,  unit:"g",  source:"pantry", invId:"pantry_garlic_bulk" },
      { label:"Soy Sauce",    qty:15,  unit:"ml", source:"pantry", invId:"pantry_soy" },
      { label:"Water/Broth",  qty:300, unit:"ml", source:"free" },
    ],
    est_cost:52, sell_price:189,
  },
  {
    id:"recipe_sundubu", dishId:"dish_sundubu", name:"Sundubu Jjigae", emoji:"🍲",
    category:"Soup", servings:1, prep_time:"12 min",
    description:"Soft tofu stew with pork scraps and egg",
    ingredients:[
      { label:"Pork Scraps",  qty:60,  unit:"g",  source:"meat_scrap", invId:"pork_samgyup_scraps" },
      { label:"Soft Tofu",    qty:1,   unit:"pc", source:"pantry", invId:"pantry_tofu_bulk" },
      { label:"Egg",          qty:1,   unit:"pc", source:"pantry", invId:"pantry_eggs_tray" },
      { label:"Gochugaru",    qty:8,   unit:"g",  source:"pantry", invId:"pantry_gochugaru" },
      { label:"Garlic",       qty:8,   unit:"g",  source:"pantry", invId:"pantry_garlic_bulk" },
      { label:"Sesame Oil",   qty:5,   unit:"ml", source:"pantry", invId:"pantry_sesame" },
    ],
    est_cost:48, sell_price:189,
  },
  {
    id:"recipe_bibim", dishId:"dish_bibim", name:"Bibimbap", emoji:"🍲",
    category:"Rice", servings:1, prep_time:"10 min",
    description:"Mixed rice bowl with beef scraps and vegetables",
    ingredients:[
      { label:"Steamed Rice", qty:200, unit:"g",  source:"pantry", invId:"pantry_rice" },
      { label:"Beef Scraps",  qty:60,  unit:"g",  source:"meat_scrap", invId:"beef_shortrib_scraps" },
      { label:"Egg",          qty:1,   unit:"pc", source:"pantry", invId:"pantry_eggs_tray" },
      { label:"Gochujang",    qty:20,  unit:"g",  source:"pantry", invId:"pantry_gochujang" },
      { label:"Sesame Oil",   qty:5,   unit:"ml", source:"pantry", invId:"pantry_sesame" },
      { label:"Garlic",       qty:5,   unit:"g",  source:"pantry", invId:"pantry_garlic_bulk" },
      { label:"Vegetables",   qty:80,  unit:"g",  source:"pantry", invId:null }, // generic
    ],
    est_cost:55, sell_price:179,
  },
  {
    id:"recipe_dolbibim", dishId:"dish_dolbibim", name:"Dolsot Bibimbap", emoji:"🫕",
    category:"Rice", servings:1, prep_time:"12 min",
    description:"Hot stone pot bibimbap — extra crispy rice bottom",
    ingredients:[
      { label:"Steamed Rice", qty:220, unit:"g",  source:"pantry", invId:"pantry_rice" },
      { label:"Beef Scraps",  qty:70,  unit:"g",  source:"meat_scrap", invId:"beef_shortrib_scraps" },
      { label:"Egg",          qty:1,   unit:"pc", source:"pantry", invId:"pantry_eggs_tray" },
      { label:"Gochujang",    qty:25,  unit:"g",  source:"pantry", invId:"pantry_gochujang" },
      { label:"Sesame Oil",   qty:8,   unit:"ml", source:"pantry", invId:"pantry_sesame" },
      { label:"Cooking Oil",  qty:5,   unit:"ml", source:"pantry", invId:"pantry_oil" },
    ],
    est_cost:62, sell_price:199,
  },
  {
    id:"recipe_fried", dishId:"dish_fried", name:"Fried Rice", emoji:"🍚",
    category:"Rice", servings:1, prep_time:"8 min",
    description:"Pork scrap fried rice with garlic and soy",
    ingredients:[
      { label:"Steamed Rice", qty:250, unit:"g",  source:"pantry", invId:"pantry_rice" },
      { label:"Pork Scraps",  qty:60,  unit:"g",  source:"meat_scrap", invId:"pork_samgyup_scraps" },
      { label:"Egg",          qty:1,   unit:"pc", source:"pantry", invId:"pantry_eggs_tray" },
      { label:"Garlic",       qty:10,  unit:"g",  source:"pantry", invId:"pantry_garlic_bulk" },
      { label:"Onion",        qty:30,  unit:"g",  source:"pantry", invId:"pantry_onion" },
      { label:"Soy Sauce",    qty:15,  unit:"ml", source:"pantry", invId:"pantry_soy" },
      { label:"Cooking Oil",  qty:10,  unit:"ml", source:"pantry", invId:"pantry_oil" },
    ],
    est_cost:38, sell_price:149,
  },
  {
    id:"recipe_tteok", dishId:"dish_tteok", name:"Tteokbokki", emoji:"🍢",
    category:"Snacks", servings:1, prep_time:"10 min",
    description:"Spicy rice cake with gochujang sauce",
    ingredients:[
      { label:"Tteok",       qty:200, unit:"g",  source:"pantry", invId:"pantry_tteok" },
      { label:"Gochujang",   qty:30,  unit:"g",  source:"pantry", invId:"pantry_gochujang" },
      { label:"Sugar",       qty:10,  unit:"g",  source:"pantry", invId:"pantry_sugar" },
      { label:"Soy Sauce",   qty:10,  unit:"ml", source:"pantry", invId:"pantry_soy" },
      { label:"Garlic",      qty:5,   unit:"g",  source:"pantry", invId:"pantry_garlic_bulk" },
    ],
    est_cost:42, sell_price:149,
  },
  {
    id:"recipe_kimbap", dishId:"dish_kimbap", name:"Kimbap", emoji:"🍙",
    category:"Snacks", servings:1, prep_time:"12 min",
    description:"Korean seaweed rice roll with vegetables",
    ingredients:[
      { label:"Steamed Rice", qty:200, unit:"g",  source:"pantry", invId:"pantry_rice" },
      { label:"Seaweed",      qty:2,   unit:"sheet",source:"pantry", invId:"pantry_seaweed" },
      { label:"Egg",          qty:1,   unit:"pc", source:"pantry", invId:"pantry_eggs_tray" },
      { label:"Vegetables",   qty:60,  unit:"g",  source:"pantry", invId:null },
      { label:"Sesame Oil",   qty:5,   unit:"ml", source:"pantry", invId:"pantry_sesame" },
    ],
    est_cost:35, sell_price:99,
  },
  {
    id:"recipe_mandu", dishId:"dish_mandu", name:"Mandu", emoji:"🥟",
    category:"Snacks", servings:1, prep_time:"20 min",
    description:"Korean dumplings with pork scraps and vegetables",
    ingredients:[
      { label:"Pork Scraps",  qty:100, unit:"g",  source:"meat_scrap", invId:"pork_kasim_scraps" },
      { label:"Flour",        qty:80,  unit:"g",  source:"pantry", invId:"pantry_flour" },
      { label:"Garlic",       qty:8,   unit:"g",  source:"pantry", invId:"pantry_garlic_bulk" },
      { label:"Onion",        qty:40,  unit:"g",  source:"pantry", invId:"pantry_onion" },
      { label:"Soy Sauce",    qty:10,  unit:"ml", source:"pantry", invId:"pantry_soy" },
      { label:"Cooking Oil",  qty:15,  unit:"ml", source:"pantry", invId:"pantry_oil" },
    ],
    est_cost:40, sell_price:129,
  },
  {
    id:"recipe_haemul", dishId:"dish_haemul", name:"Haemul Pajeon", emoji:"🥞",
    category:"Snacks", servings:1, prep_time:"15 min",
    description:"Seafood green onion pancake",
    ingredients:[
      { label:"Flour",        qty:100, unit:"g",  source:"pantry", invId:"pantry_flour" },
      { label:"Eggs",         qty:2,   unit:"pc", source:"pantry", invId:"pantry_eggs_tray" },
      { label:"Green Onion",  qty:50,  unit:"g",  source:"pantry", invId:null },
      { label:"Cooking Oil",  qty:20,  unit:"ml", source:"pantry", invId:"pantry_oil" },
      { label:"Soy Sauce",    qty:10,  unit:"ml", source:"pantry", invId:"pantry_soy" },
    ],
    est_cost:65, sell_price:219,
  },
  {
    id:"recipe_japchae", dishId:"dish_japchae", name:"Japchae", emoji:"🍜",
    category:"Noodles", servings:1, prep_time:"15 min",
    description:"Korean glass noodles with vegetables and sesame",
    ingredients:[
      { label:"Glass Noodles",qty:100, unit:"g",  source:"pantry", invId:"pantry_noodles" },
      { label:"Beef Scraps",  qty:50,  unit:"g",  source:"meat_scrap", invId:"beef_chadol_scraps" },
      { label:"Vegetables",   qty:80,  unit:"g",  source:"pantry", invId:null },
      { label:"Sesame Oil",   qty:10,  unit:"ml", source:"pantry", invId:"pantry_sesame" },
      { label:"Soy Sauce",    qty:15,  unit:"ml", source:"pantry", invId:"pantry_soy" },
      { label:"Sugar",        qty:5,   unit:"g",  source:"pantry", invId:"pantry_sugar" },
    ],
    est_cost:52, sell_price:169,
  },
  {
    id:"recipe_ramyun", dishId:"dish_ramyun", name:"Ramyun", emoji:"🍜",
    category:"Noodles", servings:1, prep_time:"6 min",
    description:"Korean instant noodles with egg and vegetables",
    ingredients:[
      { label:"Ramyun Pack",  qty:1,   unit:"pack",source:"pantry", invId:"pantry_ramyun" },
      { label:"Egg",          qty:1,   unit:"pc", source:"pantry", invId:"pantry_eggs_tray" },
      { label:"Green Onion",  qty:10,  unit:"g",  source:"pantry", invId:null },
    ],
    est_cost:18, sell_price:99,
  },
];

/* ── MENU CATEGORIES ─────────────────────────────────────── */
export const MENU_CATEGORIES = [
  { id:"cat_unli",    name:"Unlimited Grill",       icon:"🔥", color:"#f97316" },
  { id:"cat_snacks",  name:"Snacks & Appetizers",   icon:"🍢", color:"#7c3aed" },
  { id:"cat_rice",    name:"Rice Dishes",            icon:"🍚", color:"#ca8a04" },
  { id:"cat_noodles", name:"Noodles",                icon:"🍜", color:"#0891b2" },
  { id:"cat_soup",    name:"Soups & Stews",          icon:"🍲", color:"#dc2626" },
  { id:"cat_drinks",  name:"Beverages",              icon:"🥤", color:"#16a34a" },
];

/* ── INIT STOCK FUNCTIONS ────────────────────────────────── */
export function initMeatStock() {
  const s = {};
  MEAT_CATALOG.forEach(m => {
    m.variants.forEach(v => { s[v.id] = { current: 0, history: [] }; });
  });
  s["beef_shortrib_raw"]    = { current: 4200, history: [] };
  s["beef_shortrib_sliced"] = { current: 2800, history: [] };
  s["beef_shortrib_bones"]  = { current: 900,  history: [] };
  s["beef_shortrib_scraps"] = { current: 400,  history: [] };
  s["pork_samgyup_raw"]     = { current: 7000, history: [] };
  s["pork_samgyup_sliced"]  = { current: 4500, history: [] };
  s["pork_samgyup_scraps"]  = { current: 1200, history: [] };
  s["pork_liempo_sliced"]   = { current: 3100, history: [] };
  s["pork_kasim_sliced"]    = { current: 2200, history: [] };
  s["beef_chadol_sliced"]   = { current: 1800, history: [] };
  return s;
}

export function initSideStock() {
  const s = {};
  SIDES_CATALOG.forEach(sd => { s[sd.id] = { current: Math.floor(sd.par * .6), history: [] }; });
  return s;
}

export function initPantryStock() {
  const s = {};
  PANTRY_CATALOG.forEach(p => { s[p.id] = { current: Math.floor(p.par * 0.7), history: [] }; });
  return s;
}
