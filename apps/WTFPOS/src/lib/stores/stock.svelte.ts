/**
 * Stock Management Store — Svelte 5 Runes
 * Reactive inventory connected to POS deductions, deliveries, and waste.
 */
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StockStatus   = 'ok' | 'low' | 'critical';
export type StockCategory = 'Meats' | 'Sides' | 'Dishes' | 'Drinks';
export type CountPeriod   = '10am' | '4pm' | '10pm';
export type MeatAnimal    = 'Pork' | 'Beef';
export type MeatCutType   = 'Bone-In' | 'Bone-Out' | 'Bones' | 'Trimmings';
/** The Branch or Warehouse where this stock is physically located */
export interface StockItem {
	id: string;
	/** Maps to a menuItemId from POS (e.g. 'meat-samgyup') */
	menuItemId: string;
	name: string;
	category: StockCategory;
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

export const STOCK_ITEMS_LIST: { menuItemId: string; name: string; category: StockCategory; locationId: string; unit: string; minLevel: number }[] = [
	// ── QC Branch Stock ──────────────────────────────────────────────────────
	{ menuItemId: 'meat-samgyup',    name: 'Samgyupsal (Pork Belly)',    category: 'Meats',  locationId: 'qc', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-chadol',     name: 'Chadolbaegi (Beef Brisket)', category: 'Meats',  locationId: 'qc', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'side-kimchi',     name: 'Kimchi',                     category: 'Sides',  locationId: 'qc', unit: 'portions', minLevel: 10   },
	{ menuItemId: 'side-rice',       name: 'Steamed Rice',               category: 'Sides',  locationId: 'qc', unit: 'portions', minLevel: 15   },
	{ menuItemId: 'drink-soju',      name: 'Soju (Original)',            category: 'Drinks', locationId: 'qc', unit: 'bottles',  minLevel: 12   },

	// ── Makati Branch Stock ──────────────────────────────────────────────────
	{ menuItemId: 'meat-samgyup',    name: 'Samgyupsal (Pork Belly)',    category: 'Meats',  locationId: 'mkti', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'meat-chadol',     name: 'Chadolbaegi (Beef Brisket)', category: 'Meats',  locationId: 'mkti', unit: 'g',        minLevel: 2000 },
	{ menuItemId: 'drink-soju',      name: 'Soju (Original)',            category: 'Drinks', locationId: 'mkti', unit: 'bottles',  minLevel: 12   },

	// ── Central Warehouse Stock ──────────────────────────────────────────────
	{ menuItemId: 'meat-samgyup',    name: 'Samgyupsal (Bulk)',          category: 'Meats',  locationId: 'wh-qc', unit: 'g',        minLevel: 10000 },
	{ menuItemId: 'meat-chadol',     name: 'Chadolbaegi (Bulk)',         category: 'Meats',  locationId: 'wh-qc', unit: 'g',        minLevel: 10000 },
	{ menuItemId: 'meat-galbi',      name: 'Galbi (Bulk)',               category: 'Meats',  locationId: 'wh-qc', unit: 'g',        minLevel: 5000  },
	{ menuItemId: 'side-noodles',    name: 'Dangmyeon Bulk',             category: 'Sides',  locationId: 'wh-qc', unit: 'portions', minLevel: 50    },
];

export const WASTE_REASONS = ['Dropped / Spilled', 'Expired', 'Unusable (damaged)', 'Overcooked', 'Trimming (bone/fat)', 'Other'] as const;

// ─── Reactive State ───────────────────────────────────────────────────────────

export const stockItems = $state<StockItem[]>(
	STOCK_ITEMS_LIST.map((s, i) => ({
		id: `si-${i}`,
		menuItemId: s.menuItemId,
		name: s.name,
		category: s.category,
		locationId: s.locationId,
		openingStock: getOpeningStock(s.menuItemId, s.locationId),
		unit: s.unit,
		minLevel: s.minLevel,
	}))
);

export const deliveries = $state<Delivery[]>([
	{ id: 'd1', stockItemId: 'si-0', itemName: 'Samgyupsal (Pork Belly)', qty: 5000, unit: 'g',        supplier: 'Metro Meat Co.',   notes: '',                    receivedAt: '8:15 AM', usedQty: 0, depleted: false, batchNo: 'B-241', expiryDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0] },
	{ id: 'd2', stockItemId: 'si-9', itemName: 'Soju (Original)',         qty: 6,    unit: 'bottles',   supplier: 'SM Trading',       notes: '',                    receivedAt: '8:30 AM', usedQty: 0, depleted: false, batchNo: 'B-242' },
	{ id: 'd3', stockItemId: 'si-4', itemName: 'Kimchi',                  qty: 10,   unit: 'portions',  supplier: 'Korean Foods PH',  notes: 'Checked freshness',   receivedAt: '9:00 AM', usedQty: 5, depleted: false, batchNo: 'B-243', expiryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] },
]);

export const wasteEntries = $state<WasteEntry[]>([
	{ id: 'w1', stockItemId: 'si-2', itemName: 'Galbi (Short Ribs)',  qty: 150, unit: 'g',       reason: 'Trimming (bone/fat)', loggedBy: 'Maria S.', loggedAt: '11:20 AM' },
	{ id: 'w2', stockItemId: 'si-8', itemName: 'Bibimbap',            qty: 1,   unit: 'bowls',   reason: 'Overcooked',          loggedBy: 'Pedro C.', loggedAt: '12:45 PM' },
	{ id: 'w3', stockItemId: 'si-9', itemName: 'Soju (Original)',     qty: 1,   unit: 'bottles', reason: 'Unusable (damaged)',   loggedBy: 'Maria S.', loggedAt: '2:10 PM' },
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

export function receiveDelivery(stockItemId: string, itemName: string, qty: number, unit: string, supplier: string, notes: string = '', batchNo?: string, expiryDate?: string) {
	deliveries.unshift({
		id: nanoid(),
		stockItemId,
		itemName,
		qty,
		unit,
		supplier,
		notes,
		receivedAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
		batchNo,
		expiryDate,
		usedQty: 0,
		depleted: false
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
	log.wasteLogged(itemName, qty, unit, reason);
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

/** Set stock to an absolute value by computing the delta and calling adjustStock */
export function setStock(
	stockItemId: string,
	itemName: string,
	targetQty: number,
	unit: string,
	reason: string,
	meatAnimal?: MeatAnimal,
	meatCut?: MeatCutType,
	loggedBy: string = 'Staff'
) {
	const current = getCurrentStock(stockItemId);
	const delta = targetQty - current;
	if (delta === 0) return;
	const type = delta > 0 ? 'add' : 'deduct';
	adjustStock(stockItemId, itemName, type, Math.abs(delta), unit, reason || 'Manual stock set', meatAnimal, meatCut, loggedBy);
}

/** Called by POS when items are charged to a table */
export function deductFromStock(menuItemId: string, qty: number, tableId: string, orderId: string, isTracked: boolean = false) {
	if (!isTracked) return;
	const item = stockItems.find(s => s.menuItemId === menuItemId);
	if (!item) return; // item not tracked in stock (e.g. packages themselves)

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
	const item = stockItems.find(s => s.menuItemId === menuItemId);
	if (!item) return; // item not tracked in stock

	// Find and remove the deduction for this order item
	const deductionIndex = deductions.findIndex(d => 
		d.stockItemId === item.id && d.orderId === orderId && d.qty === qty
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
		undefined,
		undefined,
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
export function transferStock(stockItemMenuItemId: string, qty: number, fromLocationId: string, toLocationId: string, loggedBy: string = 'Staff') {
	const fromItem = stockItems.find(s => s.menuItemId === stockItemMenuItemId && s.locationId === fromLocationId);
	const toItem = stockItems.find(s => s.menuItemId === stockItemMenuItemId && s.locationId === toLocationId);
	
	if (!fromItem || !toItem) return false; // Stock link must exist in both locations
	
	const currentFrom = getCurrentStock(fromItem.id);
	if (currentFrom < qty) return false; // Not enough stock to transfer

	adjustStock(fromItem.id, fromItem.name, 'deduct', qty, fromItem.unit, `Transfer to ${toLocationId}`, undefined, undefined, loggedBy);
	adjustStock(toItem.id, toItem.name, 'add', qty, toItem.unit, `Transfer from ${fromLocationId}`, undefined, undefined, loggedBy);
	return true;
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

function getOpeningStock(menuItemId: string, locationId: string): number {
	if (locationId === 'wh-qc') return 50000; // Large stock for warehouse
	const map: Record<string, number> = {
		'meat-samgyup': 4200, 'meat-chadol': 3000, 'meat-galbi': 2000, 'meat-beef': 3000,
		'side-kimchi': 20, 'side-japchae': 10, 'side-rice': 30, 'side-noodles': 18, 'side-seaweed': 24,
		'dish-jjigae': 12, 'dish-bibim': 5,
		'drink-soju': 24, 'drink-beer': 18, 'drink-tea': 8, 'drink-makgeolli': 12, 'drink-cider': 24,
	};
	return map[menuItemId] ?? 0;
}

function getMorningCount(menuItemId: string): number | null {
	const map: Record<string, number> = {
		'meat-samgyup': 4180, 'meat-chadol': 2950, 'meat-galbi': 1920, 'meat-beef': 3000,
		'side-kimchi': 20, 'side-japchae': 10, 'side-rice': 30, 'side-noodles': 18, 'side-seaweed': 24,
		'dish-jjigae': 12, 'dish-bibim': 5,
		'drink-soju': 30, 'drink-beer': 18, 'drink-tea': 8, 'drink-makgeolli': 12, 'drink-cider': 24,
	};
	return map[menuItemId] ?? null;
}

function getAfternoonCount(menuItemId: string): number | null {
	const map: Record<string, number> = {
		'meat-samgyup': 2100, 'meat-chadol': 1800, 'meat-galbi': 900, 'meat-beef': 2600,
		'side-kimchi': 18, 'side-japchae': 6, 'side-rice': 25, 'side-noodles': 14, 'side-seaweed': 20,
		'dish-jjigae': 10, 'dish-bibim': 3,
		'drink-soju': 24, 'drink-beer': 18, 'drink-tea': 8, 'drink-makgeolli': 9, 'drink-cider': 18,
	};
	return map[menuItemId] ?? null;
}
