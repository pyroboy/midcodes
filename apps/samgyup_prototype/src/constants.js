export const MANAGER_PIN = "1234";

export const PACKAGES = [
  { id:"pkg_pork", name:"Unli Pork", price:349, emoji:"🐷", color:"#c2410c",
    desc:"Samgyupsal · Liempo · Kasim",
    image:"https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=600&q=80",
    meats:["meat_samgyup","meat_liempo","meat_kasim"],
    auto_sides:["side_rice","side_lettuce","side_sauce","side_garlic","side_kimchi"] },
  { id:"pkg_beef", name:"Unli Beef", price:449, emoji:"🐄", color:"#1d4ed8",
    desc:"Beef Short Rib · Chadolbaegi",
    image:"https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=600&q=80",
    meats:["meat_beef","meat_chadol"],
    auto_sides:["side_rice","side_lettuce","side_sauce","side_garlic","side_kimchi","side_mushroom"] },
  { id:"pkg_both", name:"Unli Pork & Beef", price:499, emoji:"🔥", color:"#7c3aed",
    desc:"All meats — Full Pork + Beef",
    image:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
    meats:["meat_samgyup","meat_liempo","meat_kasim","meat_beef","meat_chadol"],
    auto_sides:["side_rice","side_lettuce","side_sauce","side_garlic","side_kimchi","side_mushroom","side_egg"] },
];

export const MEATS = [
  {id:"meat_samgyup",name:"Samgyupsal",   pkgs:["pkg_pork","pkg_both"],cost_per_100g:38,
    image:"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80"},
  {id:"meat_liempo", name:"Liempo",        pkgs:["pkg_pork","pkg_both"],cost_per_100g:35,
    image:"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80"},
  {id:"meat_kasim",  name:"Kasim",         pkgs:["pkg_pork","pkg_both"],cost_per_100g:30,
    image:"https://images.unsplash.com/photo-1645078834870-6d9c1875f5bd?w=400&q=80"},
  {id:"meat_beef",   name:"Beef Short Rib",pkgs:["pkg_beef","pkg_both"],cost_per_100g:75,
    image:"https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=400&q=80"},
  {id:"meat_chadol", name:"Chadolbaegi",   pkgs:["pkg_beef","pkg_both"],cost_per_100g:70,
    image:"https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80"},
];

export const SIDES = [
  {id:"side_rice",    name:"Steamed Rice",  unit:"pc", cost:12, image:"https://images.unsplash.com/photo-1516684732162-798a0062be99?w=300&q=80"},
  {id:"side_lettuce", name:"Lettuce Wrap",  unit:"set",cost:18, image:"https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&q=80"},
  {id:"side_sauce",   name:"Sauce Set",     unit:"set",cost:10, image:"https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300&q=80"},
  {id:"side_garlic",  name:"Garlic & Onion",unit:"set",cost:8,  image:"https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=300&q=80"},
  {id:"side_kimchi",  name:"Kimchi",        unit:"set",cost:15, image:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80"},
  {id:"side_mushroom",name:"Mushroom Set",  unit:"set",cost:20, image:"https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=300&q=80"},
  {id:"side_egg",     name:"Egg",           unit:"pc", cost:8,  image:"https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&q=80"},
  {id:"side_tofu",    name:"Grilled Tofu",  unit:"set",cost:22, image:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80"},
  {id:"side_corn",    name:"Cheese Corn",   unit:"set",cost:25, image:"https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&q=80"},
];

export const DISHES = [
  {id:"dish_tteok",   name:"Tteokbokki",      price:149,emoji:"🍢",cat:"Snacks",  image:"https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=400&q=80"},
  {id:"dish_kimbap",  name:"Kimbap",           price:99, emoji:"🍙",cat:"Snacks",  image:"https://images.unsplash.com/photo-1583187855070-2a97bf44b456?w=400&q=80"},
  {id:"dish_mandu",   name:"Mandu",            price:129,emoji:"🥟",cat:"Snacks",  image:"https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80"},
  {id:"dish_haemul",  name:"Haemul Pajeon",    price:219,emoji:"🥞",cat:"Snacks",  image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80"},
  {id:"dish_bibim",   name:"Bibimbap",         price:179,emoji:"🍲",cat:"Rice",    image:"https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400&q=80"},
  {id:"dish_dolbibim",name:"Dolsot Bibimbap",  price:199,emoji:"🫕",cat:"Rice",    image:"https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80"},
  {id:"dish_fried",   name:"Fried Rice",       price:149,emoji:"🍚",cat:"Rice",    image:"https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80"},
  {id:"dish_japchae", name:"Japchae",          price:169,emoji:"🍜",cat:"Noodles", image:"https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=400&q=80"},
  {id:"dish_ramyun",  name:"Ramyun",           price:99, emoji:"🍜",cat:"Noodles", image:"https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80"},
  {id:"dish_sundubu", name:"Sundubu Jjigae",   price:189,emoji:"🍲",cat:"Soup",    image:"https://images.unsplash.com/photo-1583224994076-6c0e0c27e94e?w=400&q=80"},
  {id:"dish_kimchijj",name:"Kimchi Jjigae",    price:189,emoji:"🫕",cat:"Soup",    image:"https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&q=80"},
];

export const DRINKS = [
  {id:"drk_water",  name:"Mineral Water",price:35, emoji:"💧", image:"https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&q=80"},
  {id:"drk_soda",   name:"Softdrinks",   price:45, emoji:"🥤", image:"https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=300&q=80"},
  {id:"drk_beer",   name:"San Miguel",   price:80, emoji:"🍺", image:"https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&q=80"},
  {id:"drk_soju",   name:"Soju",         price:130,emoji:"🍶", image:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80"},
  {id:"drk_juice",  name:"Fruit Juice",  price:60, emoji:"🧃", image:"https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=300&q=80"},
  {id:"drk_milktea",name:"Milk Tea",     price:75, emoji:"🧋", image:"https://images.unsplash.com/photo-1558857563-b371033873b8?w=300&q=80"},
  {id:"drk_somaek", name:"Somaek",       price:100,emoji:"🍻", image:"https://images.unsplash.com/photo-1575037614876-c38a4c44f4f4?w=300&q=80"},
];

export const FLOOR_TABLES = [
  // Right Column (Top to Bottom: T1, T4, T7 etc. looks like a 3x3 grid)
  {id:1,  label:"T1",  seats:2, x:85, y:5,  w:8,  h:12, type:"normal"},
  {id:2,  label:"T2",  seats:4, x:85, y:20, w:8,  h:15, type:"normal"},
  {id:3,  label:"T3",  seats:2, x:85, y:42, w:8,  h:12, type:"normal"},
  
  {id:4,  label:"T4",  seats:2, x:75, y:5,  w:8,  h:12, type:"normal"},
  {id:5,  label:"T5",  seats:4, x:75, y:20, w:8,  h:15, type:"normal"},
  {id:6,  label:"T6",  seats:4, x:75, y:42, w:8,  h:15, type:"normal"},
  
  {id:7,  label:"T7",  seats:2, x:65, y:5,  w:8,  h:12, type:"normal"},
  {id:8,  label:"T8",  seats:4, x:65, y:20, w:8,  h:15, type:"normal"},
  {id:9,  label:"T9",  seats:4, x:65, y:42, w:8,  h:15, type:"normal"},

  // Middle Top Row (Left to Right: T16, T14, T12, T10)
  {id:10, label:"T10", seats:4, x:45, y:10, w:8,  h:15, type:"normal"},
  {id:12, label:"T12", seats:4, x:35, y:10, w:8,  h:15, type:"normal"},
  {id:14, label:"T14", seats:4, x:25, y:10, w:8,  h:15, type:"normal"},
  {id:16, label:"T16", seats:4, x:15, y:10, w:8,  h:15, type:"normal"},

  // Middle Bottom Row (Left to Right: T18, T17, T15, T13, T11)
  {id:11, label:"T11", seats:2, x:47, y:35, w:8,  h:12, type:"normal"},
  {id:13, label:"T13", seats:4, x:34, y:37, w:11, h:11, type:"normal"},
  {id:15, label:"T15", seats:2, x:26, y:35, w:7,  h:12, type:"normal"},
  {id:17, label:"T17", seats:4, x:13, y:37, w:11, h:11, type:"normal"},
  {id:18, label:"T18", seats:4, x:1,  y:37, w:11, h:11, type:"normal"},

  // Bottom Row (Center: T19, T20)
  {id:19, label:"T19", seats:4, x:35, y:55, w:11, h:9,  type:"normal"},
  {id:20, label:"T20", seats:4, x:48, y:55, w:11, h:9,  type:"normal"},
];



export const INIT_INV = {
  meat_samgyup:{stock:6000,unit:"g",low:500},meat_liempo:{stock:5000,unit:"g",low:500},
  meat_kasim:{stock:4000,unit:"g",low:400},meat_beef:{stock:3000,unit:"g",low:300},
  meat_chadol:{stock:2500,unit:"g",low:250},side_rice:{stock:200,unit:"pc",low:20},
  side_lettuce:{stock:120,unit:"set",low:12},side_sauce:{stock:150,unit:"set",low:15},
  side_garlic:{stock:150,unit:"set",low:15},side_kimchi:{stock:100,unit:"set",low:10},
  side_mushroom:{stock:80,unit:"set",low:8},side_egg:{stock:100,unit:"pc",low:10},
  side_tofu:{stock:60,unit:"set",low:6},side_corn:{stock:60,unit:"set",low:6},
};
