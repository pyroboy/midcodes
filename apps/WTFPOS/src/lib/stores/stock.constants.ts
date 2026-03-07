/**
 * Stock Constants — Static seed data for inventory items.
 * Separated from stock.svelte.ts to reduce file size.
 */

export type StockCategory = 'Meats' | 'Sides' | 'Dishes' | 'Drinks' | 'Pantry';
export type MeatProtein = 'beef' | 'pork' | 'chicken' | 'other';

export const PROTEIN_ORDER: MeatProtein[] = ['pork', 'beef', 'chicken', 'other'];

/** Infers protein type from a menuItemId string (beef/pork/chicken check order matters). */
export function getProteinType(menuItemId: string): MeatProtein | undefined {
	if (menuItemId.includes('beef')) return 'beef';
	if (menuItemId.includes('pork')) return 'pork';
	if (menuItemId.includes('chicken')) return 'chicken';
	return undefined;
}

// ─── Meat Ontology (Conversion Graph) ────────────────────────────────────────

export type MeatCutRole = 'primal' | 'processed' | 'portioned' | 'byproduct' | 'direct';

export interface MeatOntologyNode {
	id: string;
	label: string;
	protein: MeatProtein;
	role: MeatCutRole;
	menuItemId: string;
}

export interface MeatOntologyEdge {
	from: string;
	to: string;
	defaultYieldPct: number;
}

export const MEAT_ONTOLOGY_NODES: MeatOntologyNode[] = [
	// Pork
	{ id: 'pork-bone-in',   label: 'Pork Bone-In',   protein: 'pork', role: 'primal',    menuItemId: 'meat-pork-bone-in' },
	{ id: 'pork-bone-out',  label: 'Pork Bone-Out',  protein: 'pork', role: 'processed', menuItemId: 'meat-pork-bone-out' },
	{ id: 'pork-sliced',    label: 'Sliced Pork',    protein: 'pork', role: 'portioned', menuItemId: 'meat-pork-sliced' },
	{ id: 'pork-bones',     label: 'Pork Bones',     protein: 'pork', role: 'byproduct', menuItemId: 'meat-pork-bones' },
	{ id: 'pork-trimmings', label: 'Pork Trimmings', protein: 'pork', role: 'byproduct', menuItemId: 'meat-pork-trimmings' },
	// Beef
	{ id: 'beef-bone-in',   label: 'Beef Bone-In',   protein: 'beef', role: 'primal',    menuItemId: 'meat-beef-bone-in' },
	{ id: 'beef-bone-out',  label: 'Beef Bone-Out',  protein: 'beef', role: 'processed', menuItemId: 'meat-beef-bone-out' },
	{ id: 'beef-sliced',    label: 'Sliced Beef',    protein: 'beef', role: 'portioned', menuItemId: 'meat-beef-sliced' },
	{ id: 'beef-bones',     label: 'Beef Bones',     protein: 'beef', role: 'byproduct', menuItemId: 'meat-beef-bones' },
	{ id: 'beef-trimmings', label: 'Beef Trimmings', protein: 'beef', role: 'byproduct', menuItemId: 'meat-beef-trimmings' },
	// Chicken (direct serve — no conversion edges)
	{ id: 'chicken-wing',   label: 'Chicken Wing',   protein: 'chicken', role: 'direct', menuItemId: 'meat-chicken-wing' },
	{ id: 'chicken-leg',    label: 'Chicken Leg',    protein: 'chicken', role: 'direct', menuItemId: 'meat-chicken-leg' },
];

export const DEFAULT_MEAT_EDGES: MeatOntologyEdge[] = [
	// Pork: bone-in → bone-out (72%), bone-in → bones (18%), bone-in → trimmings (10%)
	{ from: 'pork-bone-in', to: 'pork-bone-out',  defaultYieldPct: 72 },
	{ from: 'pork-bone-in', to: 'pork-bones',     defaultYieldPct: 18 },
	{ from: 'pork-bone-in', to: 'pork-trimmings', defaultYieldPct: 10 },
	{ from: 'pork-bone-out', to: 'pork-sliced',   defaultYieldPct: 95 },
	// Beef: bone-in → bone-out (68%), bone-in → bones (20%), bone-in → trimmings (12%)
	{ from: 'beef-bone-in', to: 'beef-bone-out',  defaultYieldPct: 68 },
	{ from: 'beef-bone-in', to: 'beef-bones',     defaultYieldPct: 20 },
	{ from: 'beef-bone-in', to: 'beef-trimmings', defaultYieldPct: 12 },
	{ from: 'beef-bone-out', to: 'beef-sliced',   defaultYieldPct: 93 },
];

export const STOCK_ITEMS_LIST: {
	menuItemId: string;
	name: string;
	category: StockCategory;
	proteinType?: MeatProtein;
	locationId: string;
	unit: string;
	minLevel: number;
}[] = [
	// ── Tagbilaran Branch Stock ──────────────────────────────────────────────────────
	{ menuItemId: 'meat-pork-bone-in',   name: 'Pork Bone-In',               category: 'Meats', proteinType: 'pork', locationId: 'tag', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-bone-out',  name: 'Pork Bone-Out',              category: 'Meats', proteinType: 'pork', locationId: 'tag', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-sliced',    name: 'Sliced Pork',                category: 'Meats', proteinType: 'pork', locationId: 'tag', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-bones',     name: 'Pork Bones',                 category: 'Meats', proteinType: 'pork', locationId: 'tag', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-pork-trimmings', name: 'Pork Trimmings',             category: 'Meats', proteinType: 'pork', locationId: 'tag', unit: 'g',        minLevel: 1000 },
	{ menuItemId: 'meat-beef-bone-in',   name: 'Beef Bone-In',               category: 'Meats', proteinType: 'beef', locationId: 'tag', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-bone-out',  name: 'Beef Bone-Out',              category: 'Meats', proteinType: 'beef', locationId: 'tag', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-sliced',    name: 'Sliced Beef',                category: 'Meats', proteinType: 'beef', locationId: 'tag', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-bones',     name: 'Beef Bones',                 category: 'Meats', proteinType: 'beef', locationId: 'tag', unit: 'g',        minLevel: 1000 },
	{ menuItemId: 'meat-beef-trimmings', name: 'Beef Trimmings',             category: 'Meats', proteinType: 'beef', locationId: 'tag', unit: 'g',        minLevel: 500  },
	{ menuItemId: 'meat-chicken-wing',   name: 'Chicken Wing',               category: 'Meats', proteinType: 'chicken', locationId: 'tag', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-chicken-leg',    name: 'Chicken Leg',                category: 'Meats', proteinType: 'chicken', locationId: 'tag', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'side-kimchi',         name: 'Kimchi',                     category: 'Sides',  locationId: 'tag', unit: 'portions', minLevel: 10   },
	{ menuItemId: 'side-rice',           name: 'Steamed Rice',               category: 'Sides',  locationId: 'tag', unit: 'portions', minLevel: 15   },
	{ menuItemId: 'drink-soju',          name: 'Soju (Original)',            category: 'Drinks', locationId: 'tag', unit: 'bottles',  minLevel: 12   },

	// ── Additional Tagbilaran stock ───────────────────────────────────────────────────
	{ menuItemId: 'sides-lettuce',                         name: 'Lettuce',                   category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-perilla-leaves-kkaennip',         name: 'Perilla Leaves (Kkaennip)', category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-garlic-whole-cloves',             name: 'Garlic (Whole Cloves)',     category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-garlic-sliced',                   name: 'Garlic (Sliced)',           category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-green-onions-scallions',          name: 'Green Onions / Scallions',  category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-jalape-o-green-chilies',          name: 'Jalapeño / Green Chilies',  category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-white-yellow-onions',             name: 'White/Yellow Onions',       category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-korean-radish-mu',                name: 'Korean Radish (Mu)',        category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-enoki-mushrooms',                 name: 'Enoki Mushrooms',           category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-button-mushrooms',                name: 'Button Mushrooms',          category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-corn',                            name: 'Corn',                      category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-baguio-pechay',                   name: 'Baguio Pechay',             category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-squash',                          name: 'Squash',                    category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-baechu-kimchi',                   name: 'Baechu Kimchi',             category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-kkakdugi',                        name: 'Kkakdugi',                  category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-kongnamul-muchim',                name: 'Kongnamul-muchim',          category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-oi-muchim',                       name: 'Oi Muchim',                 category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pickled-white-onions',            name: 'Pickled White Onions',      category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pickled-daikon-radish',           name: 'Pickled Daikon Radish',     category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-eomuk-bokkeum',                   name: 'Eomuk Bokkeum',             category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-japchae',                         name: 'Japchae',                   category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gamja-jorim',                     name: 'Gamja Jorim',               category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gyeran-jjim',                     name: 'Gyeran-jjim',               category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pajeon',                          name: 'Pajeon',                    category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gamja-salad',                     name: 'Gamja Salad',               category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-cheesy-tteokbokki',               name: 'Cheesy Tteokbokki',         category: 'Sides',     locationId: 'tag',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gochujang',                       name: 'Gochujang',                 category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-doenjang',                        name: 'Doenjang',                  category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-gochugaru-coarse',                name: 'Gochugaru (Coarse)',        category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-gochugaru-fine',                  name: 'Gochugaru (Fine)',          category: 'Sides',     locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-jin-ganjang-dark-soy-sauce',      name: 'Jin-ganjang (Dark Soy Sauce)', category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-guk-ganjang-soup-soy-sauce',      name: 'Guk-ganjang (Soup Soy Sauce)', category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-yangjo-ganjang-brewed-soy',       name: 'Yangjo-ganjang (Brewed Soy)', category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-toasted-sesame-oil',              name: 'Toasted Sesame Oil',        category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mulyeot-corn-rice-syrup',         name: 'Mulyeot (Corn/Rice Syrup)', category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mirin-rice-wine',                 name: 'Mirin / Rice Wine',         category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-aekjeot-fish-sauce',              name: 'Aekjeot (Fish Sauce)',      category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-dasida-beef-stock-powder',        name: 'Dasida (Beef Stock Powder)', category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mayonnaise',                      name: 'Mayonnaise',                category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-ssamjang',                        name: 'Ssamjang',                  category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-sogeumjang',                      name: 'Sogeumjang',                category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-cheese-sauce',                    name: 'Cheese Sauce',              category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-wasabi-soy',                      name: 'Wasabi Soy',                category: 'Sides',     locationId: 'tag',      unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'drinks-original-soju',                  name: 'Original Soju',             category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-grapefruit',       name: 'Flavored Soju - Grapefruit', category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-green-grape',      name: 'Flavored Soju - Green Grape', category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-plum',             name: 'Flavored Soju - Plum',      category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-strawberry',       name: 'Flavored Soju - Strawberry', category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-makgeolli',                      name: 'Makgeolli',                 category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-san-miguel-pilsen',              name: 'San Miguel Pilsen',         category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-san-miguel-light',               name: 'San Miguel Light',          category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-red-horse',                      name: 'Red Horse',                 category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-cass',                           name: 'Cass',                      category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-hite',                           name: 'Hite',                      category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-ob',                             name: 'OB',                        category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-taedonggang',                    name: 'Taedonggang',               category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-coca-cola',                      name: 'Coca-Cola',                 category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-sprite',                         name: 'Sprite',                    category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-coke-zero',                      name: 'Coke Zero',                 category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-chilsung-cider',                 name: 'Chilsung Cider',            category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-iced-red-tea',                   name: 'Iced Red Tea',              category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-barley-tea-boricha',             name: 'Barley Tea (Boricha)',      category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-lemonade',                       name: 'Lemonade',                  category: 'Drinks',    locationId: 'tag',      unit: 'bottles',    minLevel: 24     },

	// ── Panglao Branch Stock ───────────────────────────────────────────────────
	{ menuItemId: 'meat-pork-bone-in',   name: 'Pork Bone-In',               category: 'Meats', proteinType: 'pork', locationId: 'pgl', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-bone-out',  name: 'Pork Bone-Out',              category: 'Meats', proteinType: 'pork', locationId: 'pgl', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-sliced',    name: 'Sliced Pork',                category: 'Meats', proteinType: 'pork', locationId: 'pgl', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-bones',     name: 'Pork Bones',                 category: 'Meats', proteinType: 'pork', locationId: 'pgl', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-pork-trimmings', name: 'Pork Trimmings',             category: 'Meats', proteinType: 'pork', locationId: 'pgl', unit: 'g',        minLevel: 1000 },
	{ menuItemId: 'meat-beef-bone-in',   name: 'Beef Bone-In',               category: 'Meats', proteinType: 'beef', locationId: 'pgl', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-bone-out',  name: 'Beef Bone-Out',              category: 'Meats', proteinType: 'beef', locationId: 'pgl', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-sliced',    name: 'Sliced Beef',                category: 'Meats', proteinType: 'beef', locationId: 'pgl', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-bones',     name: 'Beef Bones',                 category: 'Meats', proteinType: 'beef', locationId: 'pgl', unit: 'g',        minLevel: 1000 },
	{ menuItemId: 'meat-beef-trimmings', name: 'Beef Trimmings',             category: 'Meats', proteinType: 'beef', locationId: 'pgl', unit: 'g',        minLevel: 500  },
	{ menuItemId: 'meat-chicken-wing',   name: 'Chicken Wing',               category: 'Meats', proteinType: 'chicken', locationId: 'pgl', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-chicken-leg',    name: 'Chicken Leg',                category: 'Meats', proteinType: 'chicken', locationId: 'pgl', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'drink-soju',          name: 'Soju (Original)',            category: 'Drinks', locationId: 'pgl', unit: 'bottles',  minLevel: 12   },

	// ── Additional Panglao stock ───────────────────────────────────────────────
	{ menuItemId: 'sides-lettuce',                         name: 'Lettuce',                   category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-perilla-leaves-kkaennip',         name: 'Perilla Leaves (Kkaennip)', category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-garlic-whole-cloves',             name: 'Garlic (Whole Cloves)',     category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-garlic-sliced',                   name: 'Garlic (Sliced)',           category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-green-onions-scallions',          name: 'Green Onions / Scallions',  category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-jalape-o-green-chilies',          name: 'Jalapeño / Green Chilies',  category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-white-yellow-onions',             name: 'White/Yellow Onions',       category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-korean-radish-mu',                name: 'Korean Radish (Mu)',        category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-enoki-mushrooms',                 name: 'Enoki Mushrooms',           category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-button-mushrooms',                name: 'Button Mushrooms',          category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-corn',                            name: 'Corn',                      category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-baguio-pechay',                   name: 'Baguio Pechay',             category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-squash',                          name: 'Squash',                    category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-baechu-kimchi',                   name: 'Baechu Kimchi',             category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-kkakdugi',                        name: 'Kkakdugi',                  category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-kongnamul-muchim',                name: 'Kongnamul-muchim',          category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-oi-muchim',                       name: 'Oi Muchim',                 category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pickled-white-onions',            name: 'Pickled White Onions',      category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pickled-daikon-radish',           name: 'Pickled Daikon Radish',     category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-eomuk-bokkeum',                   name: 'Eomuk Bokkeum',             category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-japchae',                         name: 'Japchae',                   category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gamja-jorim',                     name: 'Gamja Jorim',               category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gyeran-jjim',                     name: 'Gyeran-jjim',               category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pajeon',                          name: 'Pajeon',                    category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gamja-salad',                     name: 'Gamja Salad',               category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-cheesy-tteokbokki',               name: 'Cheesy Tteokbokki',         category: 'Sides',     locationId: 'pgl',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gochujang',                       name: 'Gochujang',                 category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-doenjang',                        name: 'Doenjang',                  category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-gochugaru-coarse',                name: 'Gochugaru (Coarse)',        category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-gochugaru-fine',                  name: 'Gochugaru (Fine)',          category: 'Sides',     locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-jin-ganjang-dark-soy-sauce',      name: 'Jin-ganjang (Dark Soy Sauce)', category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-guk-ganjang-soup-soy-sauce',      name: 'Guk-ganjang (Soup Soy Sauce)', category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-yangjo-ganjang-brewed-soy',       name: 'Yangjo-ganjang (Brewed Soy)', category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-toasted-sesame-oil',              name: 'Toasted Sesame Oil',        category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mulyeot-corn-rice-syrup',         name: 'Mulyeot (Corn/Rice Syrup)', category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mirin-rice-wine',                 name: 'Mirin / Rice Wine',         category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-aekjeot-fish-sauce',              name: 'Aekjeot (Fish Sauce)',      category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-dasida-beef-stock-powder',        name: 'Dasida (Beef Stock Powder)', category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mayonnaise',                      name: 'Mayonnaise',                category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-ssamjang',                        name: 'Ssamjang',                  category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-sogeumjang',                      name: 'Sogeumjang',                category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-cheese-sauce',                    name: 'Cheese Sauce',              category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-wasabi-soy',                      name: 'Wasabi Soy',                category: 'Sides',     locationId: 'pgl',    unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'drinks-original-soju',                  name: 'Original Soju',             category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-grapefruit',       name: 'Flavored Soju - Grapefruit', category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-green-grape',      name: 'Flavored Soju - Green Grape', category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-plum',             name: 'Flavored Soju - Plum',      category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-strawberry',       name: 'Flavored Soju - Strawberry', category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-makgeolli',                      name: 'Makgeolli',                 category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-san-miguel-pilsen',              name: 'San Miguel Pilsen',         category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-san-miguel-light',               name: 'San Miguel Light',          category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-red-horse',                      name: 'Red Horse',                 category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-cass',                           name: 'Cass',                      category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-hite',                           name: 'Hite',                      category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-ob',                             name: 'OB',                        category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-taedonggang',                    name: 'Taedonggang',               category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-coca-cola',                      name: 'Coca-Cola',                 category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-sprite',                         name: 'Sprite',                    category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-coke-zero',                      name: 'Coke Zero',                 category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-chilsung-cider',                 name: 'Chilsung Cider',            category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-iced-red-tea',                   name: 'Iced Red Tea',              category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-barley-tea-boricha',             name: 'Barley Tea (Boricha)',      category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-lemonade',                       name: 'Lemonade',                  category: 'Drinks',    locationId: 'pgl',    unit: 'bottles',    minLevel: 24     },

	// ── Central Warehouse Stock ───────────────────────────────────────────────
	{ menuItemId: 'meat-pork-bone-in',   name: 'Pork Bone-In (Bulk)',        category: 'Meats', proteinType: 'pork', locationId: 'wh-tag', unit: 'g',        minLevel: 20000 },
	{ menuItemId: 'meat-pork-bone-out',  name: 'Pork Bone-Out (Bulk)',       category: 'Meats', proteinType: 'pork', locationId: 'wh-tag', unit: 'g',        minLevel: 20000 },
	{ menuItemId: 'meat-pork-sliced',    name: 'Sliced Pork (Bulk)',         category: 'Meats', proteinType: 'pork', locationId: 'wh-tag', unit: 'g',        minLevel: 20000 },
	{ menuItemId: 'meat-pork-bones',     name: 'Pork Bones (Bulk)',          category: 'Meats', proteinType: 'pork', locationId: 'wh-tag', unit: 'g',        minLevel: 10000 },
	{ menuItemId: 'meat-pork-trimmings', name: 'Pork Trimmings (Bulk)',      category: 'Meats', proteinType: 'pork', locationId: 'wh-tag', unit: 'g',        minLevel: 5000  },
	{ menuItemId: 'meat-beef-bone-in',   name: 'Beef Bone-In (Bulk)',        category: 'Meats', proteinType: 'beef', locationId: 'wh-tag', unit: 'g',        minLevel: 15000 },
	{ menuItemId: 'meat-beef-bone-out',  name: 'Beef Bone-Out (Bulk)',       category: 'Meats', proteinType: 'beef', locationId: 'wh-tag', unit: 'g',        minLevel: 15000 },
	{ menuItemId: 'meat-beef-sliced',    name: 'Sliced Beef (Bulk)',         category: 'Meats', proteinType: 'beef', locationId: 'wh-tag', unit: 'g',        minLevel: 15000 },
	{ menuItemId: 'meat-beef-bones',     name: 'Beef Bones (Bulk)',          category: 'Meats', proteinType: 'beef', locationId: 'wh-tag', unit: 'g',        minLevel: 10000 },
	{ menuItemId: 'meat-beef-trimmings', name: 'Beef Trimmings (Bulk)',      category: 'Meats', proteinType: 'beef', locationId: 'wh-tag', unit: 'g',        minLevel: 5000  },
	{ menuItemId: 'meat-chicken-wing',   name: 'Chicken Wing (Bulk)',        category: 'Meats', proteinType: 'chicken', locationId: 'wh-tag', unit: 'g',        minLevel: 10000 },
	{ menuItemId: 'meat-chicken-leg',    name: 'Chicken Leg (Bulk)',         category: 'Meats', proteinType: 'chicken', locationId: 'wh-tag', unit: 'g',        minLevel: 10000 },
	{ menuItemId: 'side-noodles',        name: 'Dangmyeon Bulk',             category: 'Sides',  locationId: 'wh-tag', unit: 'portions', minLevel: 50    },

	// ── Additional Warehouse stock ────────────────────────────────────────────
	{ menuItemId: 'sides-lettuce',                         name: 'Lettuce',                   category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-perilla-leaves-kkaennip',         name: 'Perilla Leaves (Kkaennip)', category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-garlic-whole-cloves',             name: 'Garlic (Whole Cloves)',     category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-garlic-sliced',                   name: 'Garlic (Sliced)',           category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-green-onions-scallions',          name: 'Green Onions / Scallions',  category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-jalape-o-green-chilies',          name: 'Jalapeño / Green Chilies',  category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-white-yellow-onions',             name: 'White/Yellow Onions',       category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-korean-radish-mu',                name: 'Korean Radish (Mu)',        category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-enoki-mushrooms',                 name: 'Enoki Mushrooms',           category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-button-mushrooms',                name: 'Button Mushrooms',          category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-corn',                            name: 'Corn',                      category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-baguio-pechay',                   name: 'Baguio Pechay',             category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-squash',                          name: 'Squash',                    category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-baechu-kimchi',                   name: 'Baechu Kimchi',             category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-kkakdugi',                        name: 'Kkakdugi',                  category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-kongnamul-muchim',                name: 'Kongnamul-muchim',          category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-oi-muchim',                       name: 'Oi Muchim',                 category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-pickled-white-onions',            name: 'Pickled White Onions',      category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-pickled-daikon-radish',           name: 'Pickled Daikon Radish',     category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-eomuk-bokkeum',                   name: 'Eomuk Bokkeum',             category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-japchae',                         name: 'Japchae',                   category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-gamja-jorim',                     name: 'Gamja Jorim',               category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-gyeran-jjim',                     name: 'Gyeran-jjim',               category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-pajeon',                          name: 'Pajeon',                    category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-gamja-salad',                     name: 'Gamja Salad',               category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-cheesy-tteokbokki',               name: 'Cheesy Tteokbokki',         category: 'Sides',     locationId: 'wh-tag',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-gochujang',                       name: 'Gochujang',                 category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-doenjang',                        name: 'Doenjang',                  category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-gochugaru-coarse',                name: 'Gochugaru (Coarse)',        category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-gochugaru-fine',                  name: 'Gochugaru (Fine)',          category: 'Sides',     locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-jin-ganjang-dark-soy-sauce',      name: 'Jin-ganjang (Dark Soy Sauce)', category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-guk-ganjang-soup-soy-sauce',      name: 'Guk-ganjang (Soup Soy Sauce)', category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-yangjo-ganjang-brewed-soy',       name: 'Yangjo-ganjang (Brewed Soy)', category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-toasted-sesame-oil',              name: 'Toasted Sesame Oil',        category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-mulyeot-corn-rice-syrup',         name: 'Mulyeot (Corn/Rice Syrup)', category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-mirin-rice-wine',                 name: 'Mirin / Rice Wine',         category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-aekjeot-fish-sauce',              name: 'Aekjeot (Fish Sauce)',      category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-dasida-beef-stock-powder',        name: 'Dasida (Beef Stock Powder)', category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-mayonnaise',                      name: 'Mayonnaise',                category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-ssamjang',                        name: 'Ssamjang',                  category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 4000   },
	{ menuItemId: 'sides-sogeumjang',                      name: 'Sogeumjang',                category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 4000   },
	{ menuItemId: 'sides-cheese-sauce',                    name: 'Cheese Sauce',              category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 4000   },
	{ menuItemId: 'sides-wasabi-soy',                      name: 'Wasabi Soy',                category: 'Sides',     locationId: 'wh-tag',   unit: 'ml',         minLevel: 4000   },
	{ menuItemId: 'drinks-original-soju',                  name: 'Original Soju',             category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-flavored-soju-grapefruit',       name: 'Flavored Soju - Grapefruit', category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-flavored-soju-green-grape',      name: 'Flavored Soju - Green Grape', category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-flavored-soju-plum',             name: 'Flavored Soju - Plum',      category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-flavored-soju-strawberry',       name: 'Flavored Soju - Strawberry', category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-makgeolli',                      name: 'Makgeolli',                 category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-san-miguel-pilsen',              name: 'San Miguel Pilsen',         category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-san-miguel-light',               name: 'San Miguel Light',          category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-red-horse',                      name: 'Red Horse',                 category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-cass',                           name: 'Cass',                      category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-hite',                           name: 'Hite',                      category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-ob',                             name: 'OB',                        category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-taedonggang',                    name: 'Taedonggang',               category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-coca-cola',                      name: 'Coca-Cola',                 category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-sprite',                         name: 'Sprite',                    category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-coke-zero',                      name: 'Coke Zero',                 category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-chilsung-cider',                 name: 'Chilsung Cider',            category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-iced-red-tea',                   name: 'Iced Red Tea',              category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-barley-tea-boricha',             name: 'Barley Tea (Boricha)',      category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-lemonade',                       name: 'Lemonade',                  category: 'Drinks',    locationId: 'wh-tag',   unit: 'bottles',    minLevel: 96     },

	// ── Tagbilaran Pantry / Kitchen Staples ──────────────────────────────────────────
	{ menuItemId: 'pantry-raw-rice',           name: 'Raw Rice (Uncooked)',       category: 'Pantry',    locationId: 'tag',      unit: 'kg',         minLevel: 25     },
	{ menuItemId: 'pantry-salt',               name: 'Salt',                      category: 'Pantry',    locationId: 'tag',      unit: 'g',          minLevel: 3000   },
	{ menuItemId: 'pantry-black-pepper',       name: 'Black Pepper (Ground)',     category: 'Pantry',    locationId: 'tag',      unit: 'g',          minLevel: 500    },
	{ menuItemId: 'pantry-sugar',              name: 'Sugar',                     category: 'Pantry',    locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'pantry-cooking-oil',        name: 'Cooking Oil',               category: 'Pantry',    locationId: 'tag',      unit: 'ml',         minLevel: 5000   },
	{ menuItemId: 'pantry-sesame-seeds',       name: 'Sesame Seeds (Roasted)',    category: 'Pantry',    locationId: 'tag',      unit: 'g',          minLevel: 1000   },
	{ menuItemId: 'pantry-eggs',               name: 'Eggs',                      category: 'Pantry',    locationId: 'tag',      unit: 'pcs',        minLevel: 60     },
	{ menuItemId: 'pantry-tofu',               name: 'Tofu',                      category: 'Pantry',    locationId: 'tag',      unit: 'blocks',     minLevel: 10     },
	{ menuItemId: 'pantry-dried-seaweed',      name: 'Dried Seaweed (Gim)',       category: 'Pantry',    locationId: 'tag',      unit: 'packs',      minLevel: 20     },
	{ menuItemId: 'pantry-tteok',              name: 'Tteok (Rice Cakes)',        category: 'Pantry',    locationId: 'tag',      unit: 'g',          minLevel: 3000   },
	{ menuItemId: 'pantry-flour',              name: 'Flour',                     category: 'Pantry',    locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'pantry-cornstarch',         name: 'Cornstarch',                category: 'Pantry',    locationId: 'tag',      unit: 'g',          minLevel: 1000   },
	{ menuItemId: 'pantry-vinegar',            name: 'Vinegar',                   category: 'Pantry',    locationId: 'tag',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'pantry-dangmyeon',          name: 'Dangmyeon (Glass Noodles)', category: 'Pantry',    locationId: 'tag',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'pantry-charcoal',           name: 'Charcoal',                  category: 'Pantry',    locationId: 'tag',      unit: 'kg',         minLevel: 20     },

	// ── Panglao Pantry / Kitchen Staples ──────────────────────────────────────
	{ menuItemId: 'pantry-raw-rice',           name: 'Raw Rice (Uncooked)',       category: 'Pantry',    locationId: 'pgl',    unit: 'kg',         minLevel: 25     },
	{ menuItemId: 'pantry-salt',               name: 'Salt',                      category: 'Pantry',    locationId: 'pgl',    unit: 'g',          minLevel: 3000   },
	{ menuItemId: 'pantry-black-pepper',       name: 'Black Pepper (Ground)',     category: 'Pantry',    locationId: 'pgl',    unit: 'g',          minLevel: 500    },
	{ menuItemId: 'pantry-sugar',              name: 'Sugar',                     category: 'Pantry',    locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'pantry-cooking-oil',        name: 'Cooking Oil',               category: 'Pantry',    locationId: 'pgl',    unit: 'ml',         minLevel: 5000   },
	{ menuItemId: 'pantry-sesame-seeds',       name: 'Sesame Seeds (Roasted)',    category: 'Pantry',    locationId: 'pgl',    unit: 'g',          minLevel: 1000   },
	{ menuItemId: 'pantry-eggs',               name: 'Eggs',                      category: 'Pantry',    locationId: 'pgl',    unit: 'pcs',        minLevel: 60     },
	{ menuItemId: 'pantry-tofu',               name: 'Tofu',                      category: 'Pantry',    locationId: 'pgl',    unit: 'blocks',     minLevel: 10     },
	{ menuItemId: 'pantry-dried-seaweed',      name: 'Dried Seaweed (Gim)',       category: 'Pantry',    locationId: 'pgl',    unit: 'packs',      minLevel: 20     },
	{ menuItemId: 'pantry-tteok',              name: 'Tteok (Rice Cakes)',        category: 'Pantry',    locationId: 'pgl',    unit: 'g',          minLevel: 3000   },
	{ menuItemId: 'pantry-flour',              name: 'Flour',                     category: 'Pantry',    locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'pantry-cornstarch',         name: 'Cornstarch',                category: 'Pantry',    locationId: 'pgl',    unit: 'g',          minLevel: 1000   },
	{ menuItemId: 'pantry-vinegar',            name: 'Vinegar',                   category: 'Pantry',    locationId: 'pgl',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'pantry-dangmyeon',          name: 'Dangmyeon (Glass Noodles)', category: 'Pantry',    locationId: 'pgl',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'pantry-charcoal',           name: 'Charcoal',                  category: 'Pantry',    locationId: 'pgl',    unit: 'kg',         minLevel: 20     },

	// ── Warehouse Pantry / Kitchen Staples ───────────────────────────────────
	{ menuItemId: 'pantry-raw-rice',           name: 'Raw Rice (Bulk)',           category: 'Pantry',    locationId: 'wh-tag',   unit: 'kg',         minLevel: 100    },
	{ menuItemId: 'pantry-salt',               name: 'Salt (Bulk)',               category: 'Pantry',    locationId: 'wh-tag',   unit: 'g',          minLevel: 10000  },
	{ menuItemId: 'pantry-black-pepper',       name: 'Black Pepper (Bulk)',       category: 'Pantry',    locationId: 'wh-tag',   unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'pantry-sugar',              name: 'Sugar (Bulk)',              category: 'Pantry',    locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'pantry-cooking-oil',        name: 'Cooking Oil (Bulk)',        category: 'Pantry',    locationId: 'wh-tag',   unit: 'ml',         minLevel: 20000  },
	{ menuItemId: 'pantry-sesame-seeds',       name: 'Sesame Seeds (Bulk)',       category: 'Pantry',    locationId: 'wh-tag',   unit: 'g',          minLevel: 4000   },
	{ menuItemId: 'pantry-eggs',               name: 'Eggs (Bulk)',               category: 'Pantry',    locationId: 'wh-tag',   unit: 'pcs',        minLevel: 240    },
	{ menuItemId: 'pantry-tofu',               name: 'Tofu (Bulk)',               category: 'Pantry',    locationId: 'wh-tag',   unit: 'blocks',     minLevel: 40     },
	{ menuItemId: 'pantry-dried-seaweed',      name: 'Dried Seaweed (Bulk)',      category: 'Pantry',    locationId: 'wh-tag',   unit: 'packs',      minLevel: 80     },
	{ menuItemId: 'pantry-tteok',              name: 'Tteok (Bulk)',              category: 'Pantry',    locationId: 'wh-tag',   unit: 'g',          minLevel: 12000  },
	{ menuItemId: 'pantry-flour',              name: 'Flour (Bulk)',              category: 'Pantry',    locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'pantry-cornstarch',         name: 'Cornstarch (Bulk)',         category: 'Pantry',    locationId: 'wh-tag',   unit: 'g',          minLevel: 4000   },
	{ menuItemId: 'pantry-vinegar',            name: 'Vinegar (Bulk)',            category: 'Pantry',    locationId: 'wh-tag',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'pantry-dangmyeon',          name: 'Dangmyeon (Bulk)',          category: 'Pantry',    locationId: 'wh-tag',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'pantry-charcoal',           name: 'Charcoal (Bulk)',           category: 'Pantry',    locationId: 'wh-tag',   unit: 'kg',         minLevel: 80     },
];
