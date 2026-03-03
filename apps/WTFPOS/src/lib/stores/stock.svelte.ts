/**
 * Stock Management Store — Svelte 5 Runes
 * Reactive inventory connected to POS deductions, deliveries, and waste.
 */
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StockStatus = 'ok' | 'low' | 'critical';
export type StockCategory = 'Meats' | 'Sides' | 'Dishes' | 'Drinks';
export type CountPeriod = '10am' | '4pm' | '10pm';
export type MeatAnimal   = 'Pork' | 'Beef';
export type MeatCutType  = 'Bone-In' | 'Bone-Out' | 'Bones' | 'Trimmings';

export interface StockItem {
	id: string;
	/** Maps to a menuItemId from POS (e.g. 'meat-samgyup') */
	menuItemId: string;
	name: string;
	category: StockCategory;
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
	/** For Meats: 'Pork' or 'Beef' */
	meatAnimal?: MeatAnimal;
	/** For Meats: 'Bone-In', 'Bone-Out', 'Bones', 'Trimmings' */
	meatCut?: MeatCutType;
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

export const STOCK_ITEMS_LIST: { menuItemId: string; name: string; category: StockCategory; unit: string; minLevel: number }[] = [
	{ menuItemId: 'meat-samgyup', name: 'Samgyupsal (Pork Belly)',   category: 'Meats',  unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-chadol',  name: 'Chadolbaegi (Beef Brisket)',category: 'Meats',  unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-galbi',   name: 'Galbi (Short Ribs)',        category: 'Meats',  unit: 'g',        minLevel: 1500 },
	{ menuItemId: 'meat-beef',    name: 'US Beef Belly',             category: 'Meats',  unit: 'g',        minLevel: 1000 },
	{ menuItemId: 'side-kimchi',  name: 'Kimchi',                    category: 'Sides',  unit: 'portions', minLevel: 10 },
	{ menuItemId: 'side-japchae', name: 'Japchae',                   category: 'Sides',  unit: 'portions', minLevel: 8 },
	{ menuItemId: 'side-rice',    name: 'Steamed Rice',              category: 'Sides',  unit: 'portions', minLevel: 15 },
	{ menuItemId: 'dish-jjigae',  name: 'Doenjang Jjigae',           category: 'Dishes', unit: 'bowls',    minLevel: 5 },
	{ menuItemId: 'dish-bibim',   name: 'Bibimbap',                  category: 'Dishes', unit: 'bowls',    minLevel: 5 },
	{ menuItemId: 'drink-soju',   name: 'Soju (Original)',           category: 'Drinks', unit: 'bottles',  minLevel: 12 },
	{ menuItemId: 'drink-beer',   name: 'San Miguel Beer',           category: 'Drinks', unit: 'bottles',  minLevel: 12 },
	{ menuItemId: 'drink-tea',    name: 'Iced Tea',                  category: 'Drinks', unit: 'liters',   minLevel: 5 },
];

export const WASTE_REASONS = ['Dropped / Spilled', 'Expired', 'Unusable (damaged)', 'Overcooked', 'Trimming (bone/fat)', 'Other'] as const;

// ─── Reactive State ───────────────────────────────────────────────────────────

export const stockItems = $state<StockItem[]>(
	STOCK_ITEMS_LIST.map((s, i) => ({
		id: `si-${i}`,
		menuItemId: s.menuItemId,
		name: s.name,
		category: s.category,
		openingStock: getOpeningStock(s.menuItemId),
		unit: s.unit,
		minLevel: s.minLevel,
	}))
);

export const deliveries = $state<Delivery[]>([
	{ id: 'd1', stockItemId: 'si-0', itemName: 'Samgyupsal (Pork Belly)', qty: 5000, unit: 'g',        supplier: 'Metro Meat Co.',   notes: '',                    receivedAt: '8:15 AM' },
	{ id: 'd2', stockItemId: 'si-9', itemName: 'Soju (Original)',         qty: 6,    unit: 'bottles',   supplier: 'SM Trading',       notes: '',                    receivedAt: '8:30 AM' },
	{ id: 'd3', stockItemId: 'si-4', itemName: 'Kimchi',                  qty: 10,   unit: 'portions',  supplier: 'Korean Foods PH',  notes: 'Checked freshness',   receivedAt: '9:00 AM' },
]);

export const wasteEntries = $state<WasteEntry[]>([
	{ id: 'w1', stockItemId: 'si-2', itemName: 'Galbi (Short Ribs)',  qty: 150, unit: 'g',       reason: 'Trimming (bone/fat)', loggedBy: 'Maria S.', loggedAt: '11:20 AM' },
	{ id: 'w2', stockItemId: 'si-8', itemName: 'Bibimbap',            qty: 1,   unit: 'bowls',   reason: 'Overcooked',          loggedBy: 'Pedro C.', loggedAt: '12:45 PM' },
	{ id: 'w3', stockItemId: 'si-9', itemName: 'Soju (Original)',     qty: 1,   unit: 'bottles', reason: 'Unusable (damaged)',   loggedBy: 'Maria S.', loggedAt: '2:10 PM' },
]);

export const deductions = $state<Deduction[]>([
	// Seed: VIP1 existing order consumed these
	{ id: 'ded1', stockItemId: 'si-0', qty: 200, tableId: 'VIP1', orderId: 'order-vip1', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
	{ id: 'ded2', stockItemId: 'si-1', qty: 150, tableId: 'VIP1', orderId: 'order-vip1', timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
	{ id: 'ded3', stockItemId: 'si-4', qty: 1,   tableId: 'VIP1', orderId: 'order-vip1', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
	{ id: 'ded4', stockItemId: 'si-5', qty: 1,   tableId: 'VIP1', orderId: 'order-vip1', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
]);

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

export const countPeriods: { id: CountPeriod; label: string; time: string; status: 'done' | 'pending' }[] = [
	{ id: '10am', label: 'Morning',   time: '10:00 AM', status: 'done' },
	{ id: '4pm',  label: 'Afternoon', time: '4:00 PM',  status: 'done' },
	{ id: '10pm', label: 'Evening',   time: '10:00 PM', status: 'pending' },
];

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

export function receiveDelivery(stockItemId: string, itemName: string, qty: number, unit: string, supplier: string, notes: string = '') {
	deliveries.unshift({
		id: nanoid(),
		stockItemId,
		itemName,
		qty,
		unit,
		supplier,
		notes,
		receivedAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
	});
	log.deliveryReceived(itemName, qty, unit, supplier);
}

export function logWaste(stockItemId: string, itemName: string, qty: number, unit: string, reason: string, loggedBy: string = 'Staff') {
	wasteEntries.unshift({
		id: nanoid(),
		stockItemId,
		itemName,
		qty,
		unit,
		reason,
		loggedBy,
		loggedAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
	});
	log.wastLogged(itemName, qty, unit, reason);
}

export function adjustStock(
	stockItemId: string,
	itemName: string,
	type: 'add' | 'deduct',
	qty: number,
	unit: string,
	reason: string,
	meatAnimal?: MeatAnimal,
	meatCut?: MeatCutType,
	loggedBy: string = 'Staff'
) {
	adjustments.unshift({
		id: nanoid(),
		stockItemId,
		itemName,
		type,
		qty,
		unit,
		meatAnimal,
		meatCut,
		reason,
		loggedBy,
		loggedAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
	});
}

/** Called by POS when items are charged to a table */
export function deductFromStock(menuItemId: string, qty: number, tableId: string, orderId: string) {
	const item = stockItems.find(s => s.menuItemId === menuItemId);
	if (!item) return; // item not tracked in stock (e.g. packages themselves)
	deductions.push({
		id: nanoid(),
		stockItemId: item.id,
		qty,
		tableId,
		orderId,
		timestamp: new Date().toISOString(),
	});
}

export function submitCount(stockItemId: string, period: CountPeriod, value: number) {
	const count = stockCounts.find(c => c.stockItemId === stockItemId);
	if (count) {
		count.counted[period] = value;
		const periodLabels: Record<CountPeriod, string> = { '10am': 'Morning', '4pm': 'Afternoon', '10pm': 'Evening' };
		log.countSubmitted(periodLabels[period]);
	}
}

// ─── Seed Helpers ─────────────────────────────────────────────────────────────

function getOpeningStock(menuItemId: string): number {
	const map: Record<string, number> = {
		'meat-samgyup': 4200, 'meat-chadol': 3000, 'meat-galbi': 2000, 'meat-beef': 3000,
		'side-kimchi': 20, 'side-japchae': 10, 'side-rice': 30,
		'dish-jjigae': 12, 'dish-bibim': 5,
		'drink-soju': 24, 'drink-beer': 18, 'drink-tea': 8,
	};
	return map[menuItemId] ?? 0;
}

function getMorningCount(menuItemId: string): number | null {
	const map: Record<string, number> = {
		'meat-samgyup': 4180, 'meat-chadol': 2950, 'meat-galbi': 1920, 'meat-beef': 3000,
		'side-kimchi': 20, 'side-japchae': 10, 'side-rice': 30,
		'dish-jjigae': 12, 'dish-bibim': 5,
		'drink-soju': 30, 'drink-beer': 18, 'drink-tea': 8,
	};
	return map[menuItemId] ?? null;
}

function getAfternoonCount(menuItemId: string): number | null {
	const map: Record<string, number> = {
		'meat-samgyup': 2100, 'meat-chadol': 1800, 'meat-galbi': 900, 'meat-beef': 2600,
		'side-kimchi': 18, 'side-japchae': 6, 'side-rice': 25,
		'dish-jjigae': 10, 'dish-bibim': 3,
		'drink-soju': 24, 'drink-beer': 18, 'drink-tea': 8,
	};
	return map[menuItemId] ?? null;
}
