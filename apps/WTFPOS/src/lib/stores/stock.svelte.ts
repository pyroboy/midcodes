/**
 * Stock Management Store — Svelte 5 Runes
 * Reactive inventory connected to POS deductions, deliveries, and waste.
 */
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StockStatus   = 'ok' | 'low' | 'critical';
export type StockCategory = 'Meats' | 'Sides' | 'Dishes' | 'Drinks';
export type CountPeriod   = '10am' | '4pm' | '10pm';
export type MeatProtein = 'beef' | 'pork' | 'chicken' | 'other';

export interface StockItem {
	id: string;
	/** Maps to a menuItemId from POS (e.g. 'meat-samgyup') */
	menuItemId: string;
	name: string;
	category: StockCategory;
	proteinType?: MeatProtein;
	locationId: string; // Changed from location: StockLocation
	openingStock: number;
	unit: string;
	minLevel: number;
}

export interface Delivery {
	id: string;
	stockItemId: string;
	itemName: string;
	qty: number;
	unit: string;
	supplier: string;
	notes: string;
	receivedAt: string;
	batchNo?: string;
	expiryDate?: string; // YYYY-MM-DD
	usedQty?: number;
	depleted?: boolean;
}

export interface WasteEntry {
	id: string;
	stockItemId: string;
	itemName: string;
	qty: number;
	unit: string;
	reason: string;
	loggedBy: string;
	loggedAt: string;
}

export interface StockAdjustment {
	id: string;
	stockItemId: string;
	itemName: string;
	type: 'add' | 'deduct';
	qty: number;
	unit: string;
	reason: string;
	loggedBy: string;
	loggedAt: string;
}

export interface Deduction {
	id: string;
	stockItemId: string;
	qty: number;
	tableId: string;
	orderId: string;
	timestamp: string;
}

export interface StockCount {
	stockItemId: string;
	counted: Record<CountPeriod, number | null>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const STOCK_ITEMS_LIST: { menuItemId: string; name: string; category: StockCategory; proteinType?: MeatProtein; locationId: string; unit: string; minLevel: number }[] = [
	// ── QC Branch Stock ──────────────────────────────────────────────────────
	{ menuItemId: 'meat-pork-bone-in',   name: 'Pork Bone-In',               category: 'Meats', proteinType: 'pork', locationId: 'qc', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-bone-out',  name: 'Pork Bone-Out',              category: 'Meats', proteinType: 'pork', locationId: 'qc', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-sliced',    name: 'Sliced Pork',                category: 'Meats', proteinType: 'pork', locationId: 'qc', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-bones',     name: 'Pork Bones',                 category: 'Meats', proteinType: 'pork', locationId: 'qc', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-pork-trimmings', name: 'Pork Trimmings',             category: 'Meats', proteinType: 'pork', locationId: 'qc', unit: 'g',        minLevel: 1000 },
	{ menuItemId: 'meat-beef-bone-in',   name: 'Beef Bone-In',               category: 'Meats', proteinType: 'beef', locationId: 'qc', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-bone-out',  name: 'Beef Bone-Out',              category: 'Meats', proteinType: 'beef', locationId: 'qc', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-sliced',    name: 'Sliced Beef',                category: 'Meats', proteinType: 'beef', locationId: 'qc', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-bones',     name: 'Beef Bones',                 category: 'Meats', proteinType: 'beef', locationId: 'qc', unit: 'g',        minLevel: 1000 },
	{ menuItemId: 'meat-beef-trimmings', name: 'Beef Trimmings',             category: 'Meats', proteinType: 'beef', locationId: 'qc', unit: 'g',        minLevel: 500  },
	{ menuItemId: 'meat-chicken-wing',   name: 'Chicken Wing',               category: 'Meats', proteinType: 'chicken', locationId: 'qc', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-chicken-leg',    name: 'Chicken Leg',                category: 'Meats', proteinType: 'chicken', locationId: 'qc', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'side-kimchi',         name: 'Kimchi',                     category: 'Sides',  locationId: 'qc', unit: 'portions', minLevel: 10   },
	{ menuItemId: 'side-rice',           name: 'Steamed Rice',               category: 'Sides',  locationId: 'qc', unit: 'portions', minLevel: 15   },
	{ menuItemId: 'drink-soju',          name: 'Soju (Original)',            category: 'Drinks', locationId: 'qc', unit: 'bottles',  minLevel: 12   },

	// ── Additional Mock Data for qc ─────────────────────────────────────────────────────────
	{ menuItemId: 'sides-lettuce',                         name: 'Lettuce',                   category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-perilla-leaves-kkaennip',         name: 'Perilla Leaves (Kkaennip)', category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-garlic-whole-cloves',             name: 'Garlic (Whole Cloves)',     category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-garlic-sliced',                   name: 'Garlic (Sliced)',           category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-green-onions-scallions',          name: 'Green Onions / Scallions',  category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-jalape-o-green-chilies',          name: 'Jalapeño / Green Chilies',  category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-white-yellow-onions',             name: 'White/Yellow Onions',       category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-korean-radish-mu',                name: 'Korean Radish (Mu)',        category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-enoki-mushrooms',                 name: 'Enoki Mushrooms',           category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-button-mushrooms',                name: 'Button Mushrooms',          category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-corn',                            name: 'Corn',                      category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-baguio-pechay',                   name: 'Baguio Pechay',             category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-squash',                          name: 'Squash',                    category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-baechu-kimchi',                   name: 'Baechu Kimchi',             category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-kkakdugi',                        name: 'Kkakdugi',                  category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-kongnamul-muchim',                name: 'Kongnamul-muchim',          category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-oi-muchim',                       name: 'Oi Muchim',                 category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pickled-white-onions',            name: 'Pickled White Onions',      category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pickled-daikon-radish',           name: 'Pickled Daikon Radish',     category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-eomuk-bokkeum',                   name: 'Eomuk Bokkeum',             category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-japchae',                         name: 'Japchae',                   category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gamja-jorim',                     name: 'Gamja Jorim',               category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gyeran-jjim',                     name: 'Gyeran-jjim',               category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pajeon',                          name: 'Pajeon',                    category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gamja-salad',                     name: 'Gamja Salad',               category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-cheesy-tteokbokki',               name: 'Cheesy Tteokbokki',         category: 'Sides',     locationId: 'qc',      unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gochujang',                       name: 'Gochujang',                 category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-doenjang',                        name: 'Doenjang',                  category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-gochugaru-coarse',                name: 'Gochugaru (Coarse)',        category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-gochugaru-fine',                  name: 'Gochugaru (Fine)',          category: 'Sides',     locationId: 'qc',      unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-jin-ganjang-dark-soy-sauce',      name: 'Jin-ganjang (Dark Soy Sauce)', category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-guk-ganjang-soup-soy-sauce',      name: 'Guk-ganjang (Soup Soy Sauce)', category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-yangjo-ganjang-brewed-soy',       name: 'Yangjo-ganjang (Brewed Soy)', category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-toasted-sesame-oil',              name: 'Toasted Sesame Oil',        category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mulyeot-corn-rice-syrup',         name: 'Mulyeot (Corn/Rice Syrup)', category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mirin-rice-wine',                 name: 'Mirin / Rice Wine',         category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-aekjeot-fish-sauce',              name: 'Aekjeot (Fish Sauce)',      category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-dasida-beef-stock-powder',        name: 'Dasida (Beef Stock Powder)', category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mayonnaise',                      name: 'Mayonnaise',                category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-ssamjang',                        name: 'Ssamjang',                  category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-sogeumjang',                      name: 'Sogeumjang',                category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-cheese-sauce',                    name: 'Cheese Sauce',              category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-wasabi-soy',                      name: 'Wasabi Soy',                category: 'Sides',     locationId: 'qc',      unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'drinks-original-soju',                  name: 'Original Soju',             category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-grapefruit',       name: 'Flavored Soju - Grapefruit', category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-green-grape',      name: 'Flavored Soju - Green Grape', category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-plum',             name: 'Flavored Soju - Plum',      category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-strawberry',       name: 'Flavored Soju - Strawberry', category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-makgeolli',                      name: 'Makgeolli',                 category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-san-miguel-pilsen',              name: 'San Miguel Pilsen',         category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-san-miguel-light',               name: 'San Miguel Light',          category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-red-horse',                      name: 'Red Horse',                 category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-cass',                           name: 'Cass',                      category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-hite',                           name: 'Hite',                      category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-ob',                             name: 'OB',                        category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-taedonggang',                    name: 'Taedonggang',               category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-coca-cola',                      name: 'Coca-Cola',                 category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-sprite',                         name: 'Sprite',                    category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-coke-zero',                      name: 'Coke Zero',                 category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-chilsung-cider',                 name: 'Chilsung Cider',            category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-iced-red-tea',                   name: 'Iced Red Tea',              category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-barley-tea-boricha',             name: 'Barley Tea (Boricha)',      category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-lemonade',                       name: 'Lemonade',                  category: 'Drinks',    locationId: 'qc',      unit: 'bottles',    minLevel: 24     },

	// ── Makati Branch Stock ──────────────────────────────────────────────────
	{ menuItemId: 'meat-pork-bone-in',   name: 'Pork Bone-In',               category: 'Meats', proteinType: 'pork', locationId: 'mkti', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-bone-out',  name: 'Pork Bone-Out',              category: 'Meats', proteinType: 'pork', locationId: 'mkti', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-sliced',    name: 'Sliced Pork',                category: 'Meats', proteinType: 'pork', locationId: 'mkti', unit: 'g',        minLevel: 5000 },
	{ menuItemId: 'meat-pork-bones',     name: 'Pork Bones',                 category: 'Meats', proteinType: 'pork', locationId: 'mkti', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-pork-trimmings', name: 'Pork Trimmings',             category: 'Meats', proteinType: 'pork', locationId: 'mkti', unit: 'g',        minLevel: 1000 },
	{ menuItemId: 'meat-beef-bone-in',   name: 'Beef Bone-In',               category: 'Meats', proteinType: 'beef', locationId: 'mkti', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-bone-out',  name: 'Beef Bone-Out',              category: 'Meats', proteinType: 'beef', locationId: 'mkti', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-sliced',    name: 'Sliced Beef',                category: 'Meats', proteinType: 'beef', locationId: 'mkti', unit: 'g',        minLevel: 3000 },
	{ menuItemId: 'meat-beef-bones',     name: 'Beef Bones',                 category: 'Meats', proteinType: 'beef', locationId: 'mkti', unit: 'g',        minLevel: 1000 },
	{ menuItemId: 'meat-beef-trimmings', name: 'Beef Trimmings',             category: 'Meats', proteinType: 'beef', locationId: 'mkti', unit: 'g',        minLevel: 500  },
	{ menuItemId: 'meat-chicken-wing',   name: 'Chicken Wing',               category: 'Meats', proteinType: 'chicken', locationId: 'mkti', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-chicken-leg',    name: 'Chicken Leg',                category: 'Meats', proteinType: 'chicken', locationId: 'mkti', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'drink-soju',          name: 'Soju (Original)',            category: 'Drinks', locationId: 'mkti', unit: 'bottles',  minLevel: 12   },

	// ── Additional Mock Data for mkti ─────────────────────────────────────────────────────────
	{ menuItemId: 'sides-lettuce',                         name: 'Lettuce',                   category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-perilla-leaves-kkaennip',         name: 'Perilla Leaves (Kkaennip)', category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-garlic-whole-cloves',             name: 'Garlic (Whole Cloves)',     category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-garlic-sliced',                   name: 'Garlic (Sliced)',           category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-green-onions-scallions',          name: 'Green Onions / Scallions',  category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-jalape-o-green-chilies',          name: 'Jalapeño / Green Chilies',  category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-white-yellow-onions',             name: 'White/Yellow Onions',       category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-korean-radish-mu',                name: 'Korean Radish (Mu)',        category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-enoki-mushrooms',                 name: 'Enoki Mushrooms',           category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-button-mushrooms',                name: 'Button Mushrooms',          category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-corn',                            name: 'Corn',                      category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-baguio-pechay',                   name: 'Baguio Pechay',             category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-squash',                          name: 'Squash',                    category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-baechu-kimchi',                   name: 'Baechu Kimchi',             category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-kkakdugi',                        name: 'Kkakdugi',                  category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-kongnamul-muchim',                name: 'Kongnamul-muchim',          category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-oi-muchim',                       name: 'Oi Muchim',                 category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pickled-white-onions',            name: 'Pickled White Onions',      category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pickled-daikon-radish',           name: 'Pickled Daikon Radish',     category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-eomuk-bokkeum',                   name: 'Eomuk Bokkeum',             category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-japchae',                         name: 'Japchae',                   category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gamja-jorim',                     name: 'Gamja Jorim',               category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gyeran-jjim',                     name: 'Gyeran-jjim',               category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-pajeon',                          name: 'Pajeon',                    category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gamja-salad',                     name: 'Gamja Salad',               category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-cheesy-tteokbokki',               name: 'Cheesy Tteokbokki',         category: 'Sides',     locationId: 'mkti',    unit: 'portions',   minLevel: 20     },
	{ menuItemId: 'sides-gochujang',                       name: 'Gochujang',                 category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-doenjang',                        name: 'Doenjang',                  category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-gochugaru-coarse',                name: 'Gochugaru (Coarse)',        category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-gochugaru-fine',                  name: 'Gochugaru (Fine)',          category: 'Sides',     locationId: 'mkti',    unit: 'g',          minLevel: 2000   },
	{ menuItemId: 'sides-jin-ganjang-dark-soy-sauce',      name: 'Jin-ganjang (Dark Soy Sauce)', category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-guk-ganjang-soup-soy-sauce',      name: 'Guk-ganjang (Soup Soy Sauce)', category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-yangjo-ganjang-brewed-soy',       name: 'Yangjo-ganjang (Brewed Soy)', category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-toasted-sesame-oil',              name: 'Toasted Sesame Oil',        category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mulyeot-corn-rice-syrup',         name: 'Mulyeot (Corn/Rice Syrup)', category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mirin-rice-wine',                 name: 'Mirin / Rice Wine',         category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-aekjeot-fish-sauce',              name: 'Aekjeot (Fish Sauce)',      category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-dasida-beef-stock-powder',        name: 'Dasida (Beef Stock Powder)', category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-mayonnaise',                      name: 'Mayonnaise',                category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 2000   },
	{ menuItemId: 'sides-ssamjang',                        name: 'Ssamjang',                  category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-sogeumjang',                      name: 'Sogeumjang',                category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-cheese-sauce',                    name: 'Cheese Sauce',              category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'sides-wasabi-soy',                      name: 'Wasabi Soy',                category: 'Sides',     locationId: 'mkti',    unit: 'ml',         minLevel: 1000   },
	{ menuItemId: 'drinks-original-soju',                  name: 'Original Soju',             category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-grapefruit',       name: 'Flavored Soju - Grapefruit', category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-green-grape',      name: 'Flavored Soju - Green Grape', category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-plum',             name: 'Flavored Soju - Plum',      category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-flavored-soju-strawberry',       name: 'Flavored Soju - Strawberry', category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-makgeolli',                      name: 'Makgeolli',                 category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-san-miguel-pilsen',              name: 'San Miguel Pilsen',         category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-san-miguel-light',               name: 'San Miguel Light',          category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-red-horse',                      name: 'Red Horse',                 category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-cass',                           name: 'Cass',                      category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-hite',                           name: 'Hite',                      category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-ob',                             name: 'OB',                        category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-taedonggang',                    name: 'Taedonggang',               category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-coca-cola',                      name: 'Coca-Cola',                 category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-sprite',                         name: 'Sprite',                    category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-coke-zero',                      name: 'Coke Zero',                 category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-chilsung-cider',                 name: 'Chilsung Cider',            category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-iced-red-tea',                   name: 'Iced Red Tea',              category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-barley-tea-boricha',             name: 'Barley Tea (Boricha)',      category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },
	{ menuItemId: 'drinks-lemonade',                       name: 'Lemonade',                  category: 'Drinks',    locationId: 'mkti',    unit: 'bottles',    minLevel: 24     },

	// ── Central Warehouse Stock ──────────────────────────────────────────────
	{ menuItemId: 'meat-pork-bone-in',   name: 'Pork Bone-In (Bulk)',        category: 'Meats', proteinType: 'pork', locationId: 'wh-qc', unit: 'g',        minLevel: 20000 },
	{ menuItemId: 'meat-pork-bone-out',  name: 'Pork Bone-Out (Bulk)',       category: 'Meats', proteinType: 'pork', locationId: 'wh-qc', unit: 'g',        minLevel: 20000 },
	{ menuItemId: 'meat-pork-sliced',    name: 'Sliced Pork (Bulk)',         category: 'Meats', proteinType: 'pork', locationId: 'wh-qc', unit: 'g',        minLevel: 20000 },
	{ menuItemId: 'meat-pork-bones',     name: 'Pork Bones (Bulk)',          category: 'Meats', proteinType: 'pork', locationId: 'wh-qc', unit: 'g',        minLevel: 10000 },
	{ menuItemId: 'meat-pork-trimmings', name: 'Pork Trimmings (Bulk)',      category: 'Meats', proteinType: 'pork', locationId: 'wh-qc', unit: 'g',        minLevel: 5000  },
	{ menuItemId: 'meat-beef-bone-in',   name: 'Beef Bone-In (Bulk)',        category: 'Meats', proteinType: 'beef', locationId: 'wh-qc', unit: 'g',        minLevel: 15000 },
	{ menuItemId: 'meat-beef-bone-out',  name: 'Beef Bone-Out (Bulk)',       category: 'Meats', proteinType: 'beef', locationId: 'wh-qc', unit: 'g',        minLevel: 15000 },
	{ menuItemId: 'meat-beef-sliced',    name: 'Sliced Beef (Bulk)',         category: 'Meats', proteinType: 'beef', locationId: 'wh-qc', unit: 'g',        minLevel: 15000 },
	{ menuItemId: 'meat-beef-bones',     name: 'Beef Bones (Bulk)',          category: 'Meats', proteinType: 'beef', locationId: 'wh-qc', unit: 'g',        minLevel: 10000 },
	{ menuItemId: 'meat-beef-trimmings', name: 'Beef Trimmings (Bulk)',      category: 'Meats', proteinType: 'beef', locationId: 'wh-qc', unit: 'g',        minLevel: 5000  },
	{ menuItemId: 'meat-chicken-wing',   name: 'Chicken Wing (Bulk)',        category: 'Meats', proteinType: 'chicken', locationId: 'wh-qc', unit: 'g',        minLevel: 10000 },
	{ menuItemId: 'meat-chicken-leg',    name: 'Chicken Leg (Bulk)',         category: 'Meats', proteinType: 'chicken', locationId: 'wh-qc', unit: 'g',        minLevel: 10000 },
	{ menuItemId: 'side-noodles',        name: 'Dangmyeon Bulk',             category: 'Sides',  locationId: 'wh-qc', unit: 'portions', minLevel: 50    },

	// ── Additional Mock Data for wh-qc ─────────────────────────────────────────────────────────
	{ menuItemId: 'sides-lettuce',                         name: 'Lettuce',                   category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-perilla-leaves-kkaennip',         name: 'Perilla Leaves (Kkaennip)', category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-garlic-whole-cloves',             name: 'Garlic (Whole Cloves)',     category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-garlic-sliced',                   name: 'Garlic (Sliced)',           category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-green-onions-scallions',          name: 'Green Onions / Scallions',  category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-jalape-o-green-chilies',          name: 'Jalapeño / Green Chilies',  category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-white-yellow-onions',             name: 'White/Yellow Onions',       category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-korean-radish-mu',                name: 'Korean Radish (Mu)',        category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-enoki-mushrooms',                 name: 'Enoki Mushrooms',           category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-button-mushrooms',                name: 'Button Mushrooms',          category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-corn',                            name: 'Corn',                      category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-baguio-pechay',                   name: 'Baguio Pechay',             category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-squash',                          name: 'Squash',                    category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-baechu-kimchi',                   name: 'Baechu Kimchi',             category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-kkakdugi',                        name: 'Kkakdugi',                  category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-kongnamul-muchim',                name: 'Kongnamul-muchim',          category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-oi-muchim',                       name: 'Oi Muchim',                 category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-pickled-white-onions',            name: 'Pickled White Onions',      category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-pickled-daikon-radish',           name: 'Pickled Daikon Radish',     category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-eomuk-bokkeum',                   name: 'Eomuk Bokkeum',             category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-japchae',                         name: 'Japchae',                   category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-gamja-jorim',                     name: 'Gamja Jorim',               category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-gyeran-jjim',                     name: 'Gyeran-jjim',               category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-pajeon',                          name: 'Pajeon',                    category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-gamja-salad',                     name: 'Gamja Salad',               category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-cheesy-tteokbokki',               name: 'Cheesy Tteokbokki',         category: 'Sides',     locationId: 'wh-qc',   unit: 'portions',   minLevel: 80     },
	{ menuItemId: 'sides-gochujang',                       name: 'Gochujang',                 category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-doenjang',                        name: 'Doenjang',                  category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-gochugaru-coarse',                name: 'Gochugaru (Coarse)',        category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-gochugaru-fine',                  name: 'Gochugaru (Fine)',          category: 'Sides',     locationId: 'wh-qc',   unit: 'g',          minLevel: 8000   },
	{ menuItemId: 'sides-jin-ganjang-dark-soy-sauce',      name: 'Jin-ganjang (Dark Soy Sauce)', category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-guk-ganjang-soup-soy-sauce',      name: 'Guk-ganjang (Soup Soy Sauce)', category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-yangjo-ganjang-brewed-soy',       name: 'Yangjo-ganjang (Brewed Soy)', category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-toasted-sesame-oil',              name: 'Toasted Sesame Oil',        category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-mulyeot-corn-rice-syrup',         name: 'Mulyeot (Corn/Rice Syrup)', category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-mirin-rice-wine',                 name: 'Mirin / Rice Wine',         category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-aekjeot-fish-sauce',              name: 'Aekjeot (Fish Sauce)',      category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-dasida-beef-stock-powder',        name: 'Dasida (Beef Stock Powder)', category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-mayonnaise',                      name: 'Mayonnaise',                category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 8000   },
	{ menuItemId: 'sides-ssamjang',                        name: 'Ssamjang',                  category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 4000   },
	{ menuItemId: 'sides-sogeumjang',                      name: 'Sogeumjang',                category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 4000   },
	{ menuItemId: 'sides-cheese-sauce',                    name: 'Cheese Sauce',              category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 4000   },
	{ menuItemId: 'sides-wasabi-soy',                      name: 'Wasabi Soy',                category: 'Sides',     locationId: 'wh-qc',   unit: 'ml',         minLevel: 4000   },
	{ menuItemId: 'drinks-original-soju',                  name: 'Original Soju',             category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-flavored-soju-grapefruit',       name: 'Flavored Soju - Grapefruit', category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-flavored-soju-green-grape',      name: 'Flavored Soju - Green Grape', category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-flavored-soju-plum',             name: 'Flavored Soju - Plum',      category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-flavored-soju-strawberry',       name: 'Flavored Soju - Strawberry', category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-makgeolli',                      name: 'Makgeolli',                 category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-san-miguel-pilsen',              name: 'San Miguel Pilsen',         category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-san-miguel-light',               name: 'San Miguel Light',          category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-red-horse',                      name: 'Red Horse',                 category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-cass',                           name: 'Cass',                      category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-hite',                           name: 'Hite',                      category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-ob',                             name: 'OB',                        category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-taedonggang',                    name: 'Taedonggang',               category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-coca-cola',                      name: 'Coca-Cola',                 category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-sprite',                         name: 'Sprite',                    category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-coke-zero',                      name: 'Coke Zero',                 category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-chilsung-cider',                 name: 'Chilsung Cider',            category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-iced-red-tea',                   name: 'Iced Red Tea',              category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-barley-tea-boricha',             name: 'Barley Tea (Boricha)',      category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },
	{ menuItemId: 'drinks-lemonade',                       name: 'Lemonade',                  category: 'Drinks',    locationId: 'wh-qc',   unit: 'bottles',    minLevel: 96     },

];

export const WASTE_REASONS = ['Dropped / Spilled', 'Expired', 'Unusable (damaged)', 'Overcooked', 'Trimming (bone/fat)', 'Other'] as const;

// ─── Reactive State ───────────────────────────────────────────────────────────

export const proteinConfig: Record<MeatProtein, { 
  label: string; 
  color: string; 
  bgLight: string; 
  borderColor: string;
  gradientFrom: string;
}> = {
  beef: { 
    label: 'Beef', 
    color: 'text-red-600', 
    bgLight: 'bg-red-50', 
    borderColor: 'border-red-200',
    gradientFrom: 'from-red-50/80'
  },
  pork: { 
    label: 'Pork', 
    color: 'text-orange-600', 
    bgLight: 'bg-orange-50', 
    borderColor: 'border-orange-200',
    gradientFrom: 'from-orange-50/80'
  },
  chicken: { 
    label: 'Chicken', 
    color: 'text-yellow-600', 
    bgLight: 'bg-yellow-50', 
    borderColor: 'border-yellow-200',
    gradientFrom: 'from-yellow-50/80'
  },
  other: { 
    label: 'Other Meats', 
    color: 'text-gray-600', 
    bgLight: 'bg-gray-50', 
    borderColor: 'border-gray-200',
    gradientFrom: 'from-gray-50/80'
  },
};

export function getProteinType(menuItemId: string): MeatProtein | undefined {
  if (menuItemId.includes('beef')) return 'beef';
  if (menuItemId.includes('pork')) return 'pork';
  if (menuItemId.includes('chicken')) return 'chicken';
  return undefined;
}

export const stockItems = $state<StockItem[]>(
	STOCK_ITEMS_LIST.map((s, i) => ({
		id: `si-${i}`,
		menuItemId: s.menuItemId,
		name: s.name,
		category: s.category,
		proteinType: s.proteinType || getProteinType(s.menuItemId),
		locationId: s.locationId,
		openingStock: getOpeningStock(s.menuItemId, s.locationId),
		unit: s.unit,
		minLevel: s.minLevel,
	}))
);

const getSiId = (menuItemId: string, locationId: string = 'qc') => {
	const idx = STOCK_ITEMS_LIST.findIndex(s => s.menuItemId === menuItemId && s.locationId === locationId);
	return idx >= 0 ? `si-${idx}` : 'si-0'; // fallback
};

export const deliveries = $state<Delivery[]>([
	{ id: 'd1', stockItemId: getSiId('meat-pork-bone-in', 'qc'), itemName: 'Pork Bone-In',            qty: 5000, unit: 'g',        supplier: 'Metro Meat Co.',   notes: '',                    receivedAt: new Date().toISOString(), usedQty: 0, depleted: false, batchNo: 'B-241', expiryDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0] },
	{ id: 'd2', stockItemId: getSiId('drink-soju', 'qc'), itemName: 'Soju (Original)',         qty: 6,    unit: 'bottles',   supplier: 'SM Trading',       notes: '',                    receivedAt: new Date(Date.now() - 3600000).toISOString(), usedQty: 0, depleted: false, batchNo: 'B-242' },
	{ id: 'd3', stockItemId: getSiId('side-kimchi', 'qc'), itemName: 'Kimchi',                  qty: 10,   unit: 'portions',  supplier: 'Korean Foods PH',  notes: 'Checked freshness',   receivedAt: new Date(Date.now() - 7200000).toISOString(), usedQty: 5, depleted: false, batchNo: 'B-243', expiryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] },
]);

export const wasteEntries = $state<WasteEntry[]>([
	{ id: 'w1', stockItemId: getSiId('meat-pork-bones', 'qc'),  itemName: 'Pork Bones',            qty: 150, unit: 'g',        reason: 'Trimming (bone/fat)', loggedBy: 'Maria S.', loggedAt: new Date(Date.now() - 14400000).toISOString() },
	{ id: 'w2', stockItemId: getSiId('side-rice', 'qc'), itemName: 'Steamed Rice',          qty: 2,   unit: 'portions', reason: 'Overcooked',          loggedBy: 'Pedro C.', loggedAt: new Date(Date.now() - 7200000).toISOString() },
	{ id: 'w3', stockItemId: getSiId('drink-soju', 'qc'), itemName: 'Soju (Original)',       qty: 1,   unit: 'bottles',  reason: 'Unusable (damaged)',  loggedBy: 'Maria S.', loggedAt: new Date().toISOString() },
]);

export const deductions = $state<Deduction[]>([]);

export const stockCounts = $state<StockCount[]>(
	stockItems.map(s => ({
		stockItemId: s.id,
		counted: {
			'10am': getMorningCount(s.menuItemId),
			'4pm': getAfternoonCount(s.menuItemId),
			'10pm': null,
		},
	}))
);

export const countPeriods = $state<{ id: CountPeriod; label: string; time: string; status: 'done' | 'pending' }[]>([
	{ id: '10am', label: 'Morning',   time: '10:00 AM', status: 'done' },
	{ id: '4pm',  label: 'Afternoon', time: '4:00 PM',  status: 'done' },
	{ id: '10pm', label: 'Evening',   time: '10:00 PM', status: 'pending' },
]);

export const adjustments = $state<StockAdjustment[]>([]);


/** Get the current stock for a stock item, computed reactively */
export function getCurrentStock(stockItemId: string): number {
	const item = stockItems.find(s => s.id === stockItemId);
	if (!item) return 0;
	const totalDelivered  = deliveries.filter(d => d.stockItemId === stockItemId).reduce((s, d) => s + d.qty, 0);
	const totalWasted     = wasteEntries.filter(w => w.stockItemId === stockItemId).reduce((s, w) => s + w.qty, 0);
	const totalDeducted   = deductions.filter(d => d.stockItemId === stockItemId).reduce((s, d) => s + d.qty, 0);
	const totalAdjAdded   = adjustments.filter(a => a.stockItemId === stockItemId && a.type === 'add').reduce((s, a) => s + a.qty, 0);
	const totalAdjDeducted = adjustments.filter(a => a.stockItemId === stockItemId && a.type === 'deduct').reduce((s, a) => s + a.qty, 0);
	return item.openingStock + totalDelivered - totalWasted - totalDeducted + totalAdjAdded - totalAdjDeducted;
}

export function getStockStatus(stockItemId: string): StockStatus {
	const item = stockItems.find(s => s.id === stockItemId);
	if (!item) return 'ok';
	const current = getCurrentStock(stockItemId);
	if (current <= item.minLevel * 0.25) return 'critical';
	if (current <= item.minLevel) return 'low';
	return 'ok';
}

/** Dynamically compute expected stock at the time of counting */
export function getExpectedStock(stockItemId: string): number {
	return getCurrentStock(stockItemId); // live expected = current live stock
}

/** Drift = expected - counted. Positive drift = missing inventory */
export function getDrift(stockItemId: string, period: CountPeriod): number | null {
	const count = stockCounts.find(c => c.stockItemId === stockItemId);
	if (!count) return null;
	const counted = count.counted[period];
	if (counted === null) return null;
	const expected = getExpectedStock(stockItemId);
	return expected - counted; // positive = missing
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export function receiveDelivery(stockItemId: string, itemName: string, qty: number, unit: string, supplier: string, notes: string = '', batchNo?: string, expiryDate?: string) {
	deliveries.unshift({
		id: nanoid(),
		stockItemId,
		itemName,
		qty,
		unit,
		supplier,
		notes,
		receivedAt: new Date().toISOString(),
		batchNo,
		expiryDate,
		usedQty: 0,
		depleted: false
	});
	log.deliveryReceived(itemName, qty, unit, supplier);
}

export function logWaste(stockItemId: string, itemName: string, qty: number, unit: string, reason: string, loggedBy?: string) {
	const logger = loggedBy ?? session.userName ?? 'Staff';
	wasteEntries.unshift({
		id: nanoid(),
		stockItemId,
		itemName,
		qty,
		unit,
		reason,
		loggedBy: logger,
		loggedAt: new Date().toISOString(),
	});
	log.wasteLogged(itemName, qty, unit, reason);
}

export function adjustStock(
	stockItemId: string,
	itemName: string,
	type: 'add' | 'deduct',
	qty: number,
	unit: string,
	reason: string,
	loggedBy?: string
) {
	const logger = loggedBy ?? session.userName ?? 'Staff';
	adjustments.unshift({
		id: nanoid(),
		stockItemId,
		itemName,
		type,
		qty,
		unit,
		reason,
		loggedBy: logger,
		loggedAt: new Date().toISOString(),
	});
}

/** Set stock to an absolute value by computing the delta and calling adjustStock */
export function setStock(
	stockItemId: string,
	itemName: string,
	targetQty: number,
	unit: string,
	reason: string,
	loggedBy: string = 'Staff'
) {
	const current = getCurrentStock(stockItemId);
	const delta = targetQty - current;
	if (delta === 0) return;
	const type = delta > 0 ? 'add' : 'deduct';
	adjustStock(stockItemId, itemName, type, Math.abs(delta), unit, reason || 'Manual stock set', loggedBy);
}

/** Called by POS when items are charged to a table */
export function deductFromStock(menuItemId: string, qty: number, tableId: string, orderId: string, isTracked: boolean = false, locationId?: string) {
	console.log(`[STOCK-DEDUCT] Attempt: menuItemId=${menuItemId}, qty=${qty}, orderId=${orderId.slice(-6)}, isTracked=${isTracked}`);
	if (!isTracked) {
		console.log(`[STOCK-DEDUCT] SKIPPED: Item not tracked`);
		return;
	}
	const locId = locationId ?? session.locationId ?? '';
	const item = stockItems.find(s => s.menuItemId === menuItemId && s.locationId === locId);
	if (!item) {
		console.warn(`[STOCK-DEDUCT] FAILED: Stock item not found for menuItemId=${menuItemId} at location=${locId}`);
		return; // item not tracked in stock (e.g. packages themselves)
	}
	const currentStock = getCurrentStock(item.id);
	console.log(`[STOCK-DEDUCT] Current stock for ${item.name}: ${currentStock}${item.unit}, deducting: ${qty}`);
	if (currentStock < qty) {
		console.error(`[STOCK-DEDUCT] WARNING: Insufficient stock! Have ${currentStock}, need ${qty}`);
		qty = Math.max(0, currentStock); // Limit deduction to what is available to prevent negative stock
		if (qty <= 0) return; // Do not create a deduction instance if we cannot deduct anything
	}

	// Add the actual deduction logic
	deductions.push({
		id: nanoid(),
		stockItemId: item.id,
		qty,
		tableId,
		orderId,
		timestamp: new Date().toISOString(),
	});

	// Tier 3: Process FIFO queue for batches
	let remainingToDeduct = qty;
	// Oldest deliveries first (assuming array is prepended via unshift, so reverse or findLast-ish)
	// We'll iterate from the end (oldest) to start (newest)
	for (let i = deliveries.length - 1; i >= 0; i--) {
		const d = deliveries[i];
		if (d.stockItemId !== item.id || d.depleted) continue;

		const dUsed = d.usedQty || 0;
		const availableInBatch = d.qty - dUsed;

		if (availableInBatch > 0) {
			const deductNow = Math.min(availableInBatch, remainingToDeduct);
			d.usedQty = dUsed + deductNow;
			if (d.usedQty >= d.qty) {
				d.depleted = true;
			}
			remainingToDeduct -= deductNow;
			if (remainingToDeduct <= 0) break;
		}
	}
}

/**
 * Restore stock when an item is rejected/cancelled from KDS
 * Creates a stock adjustment to add the quantity back
 */
export function restoreStock(menuItemId: string, qty: number, tableId: string, orderId: string) {
	const item = stockItems.find(s => s.menuItemId === menuItemId && s.locationId === (session.locationId ?? ''));
	if (!item) return; // item not tracked in stock

	// Find and remove the deduction using compound orderId + stockItemId match (not qty-based to avoid ghost deductions)
	const deductionIndex = deductions.findIndex(d =>
		d.stockItemId === item.id && d.orderId === orderId
	);
	if (deductionIndex !== -1) {
		deductions.splice(deductionIndex, 1);
	}

	// Create a stock adjustment to add the quantity back
	adjustStock(
		item.id,
		item.name,
		'add',
		qty,
		item.unit,
		`Restored from KDS rejection — Order ${orderId.slice(-6)}`,
		'Kitchen'
	);
}

/** Tier 3: Returns active deliveries nearing expiration (within 3 days) */
export function getSpoilageAlerts() {
	const todayMs = Date.now();
	const THRESHOLD = 86400000 * 3; // 3 days
	
	return deliveries.filter(d => {
		if (d.depleted || !d.expiryDate) return false;
		const expMs = new Date(d.expiryDate).getTime();
		const diff = expMs - todayMs;
		return diff > -86400000 && diff <= THRESHOLD; // between 1 day ago (already expired) and 3 days from now
	}).map(d => {
		const daysLeft = Math.ceil((new Date(d.expiryDate!).getTime() - todayMs) / 86400000);
		return { ...d, daysLeft };
	});
}

/** Tier 3: Transfer stock between branches/warehouses */
export function transferStock(stockItemMenuItemId: string, qty: number, fromLocationId: string, toLocationId: string, loggedBy?: string, notes?: string) {
	const fromItem = stockItems.find(s => s.menuItemId === stockItemMenuItemId && s.locationId === fromLocationId);
	const toItem = stockItems.find(s => s.menuItemId === stockItemMenuItemId && s.locationId === toLocationId);

	if (!fromItem || !toItem) return false; // Stock link must exist in both locations

	const currentFrom = getCurrentStock(fromItem.id);
	if (currentFrom < qty) return false; // Not enough stock to transfer

	const logger = loggedBy ?? session.userName ?? 'Staff';
	const noteSuffix = notes ? ` — ${notes}` : '';
	adjustStock(fromItem.id, fromItem.name, 'deduct', qty, fromItem.unit, `Transfer to ${toLocationId}${noteSuffix}`, logger);
	adjustStock(toItem.id, toItem.name, 'add', qty, toItem.unit, `Transfer from ${fromLocationId}${noteSuffix}`, logger);
	return true;
}

export function submitCount(stockItemId: string, period: CountPeriod, value: number) {
	const count = stockCounts.find(c => c.stockItemId === stockItemId);
	if (count) {
		count.counted[period] = value;
	}
}

/** Mark a count period as done (called by Submit Count button) */
export function markPeriodDone(period: CountPeriod) {
	const p = countPeriods.find(cp => cp.id === period);
	if (p) {
		p.status = 'done';
		const periodLabels: Record<CountPeriod, string> = { '10am': 'Morning', '4pm': 'Afternoon', '10pm': 'Evening' };
		log.countSubmitted(periodLabels[period]);
	}
}

// ─── Seed Helpers ─────────────────────────────────────────────────────────────

function getOpeningStock(menuItemId: string, locationId: string): number {
	if (locationId === 'wh-qc') return 50000; // Large stock for warehouse
	const item = STOCK_ITEMS_LIST.find(s => s.menuItemId === menuItemId && s.locationId === locationId);
	return item ? Math.round(item.minLevel * 1.5) : 0;
}

function getMorningCount(menuItemId: string): number | null {
	const item = STOCK_ITEMS_LIST.find(s => s.menuItemId === menuItemId && s.locationId === (session.locationId || 'qc'));
	return item ? Math.round(item.minLevel * 1.45) : null;
}

function getAfternoonCount(menuItemId: string): number | null {
	const item = STOCK_ITEMS_LIST.find(s => s.menuItemId === menuItemId && s.locationId === (session.locationId || 'qc'));
	return item ? Math.round(item.minLevel * 0.8) : null;
}
