/**
 * Stock Management Store — Svelte 5 Runes
 * Reactive inventory connected to POS deductions, deliveries, and waste.
 */
import { nanoid } from 'nanoid';
import { log, writeLog } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';
import { createStore } from '$lib/stores/create-store.svelte';
import { browser } from '$app/environment';
import { getWritableCollection } from '$lib/db/write-proxy';
import { STOCK_ITEMS_LIST, getProteinType, DEFAULT_MEAT_EDGES, type StockCategory, type MeatProtein } from '$lib/stores/stock.constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StockStatus   = 'ok' | 'low' | 'critical';
export type CountPeriod   = 'am10' | 'pm4' | 'pm10';

// Re-exported from constants for backward-compatible imports
export type { StockCategory, MeatProtein };
export { STOCK_ITEMS_LIST };

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
	image?: string;
	updatedAt: string;
}

export interface Delivery {
	id: string;
	locationId: string;
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
	photo?: string;
	updatedAt: string;
}

export interface StockEvent {
	id: string;
	locationId: string;
	stockItemId: string;
	itemName: string;
	type: 'waste' | 'add' | 'deduct';
	qty: number;
	unit: string;
	reason: string;
	loggedBy: string;
	loggedAt: string;
	updatedAt: string;
}

/** @deprecated Use StockEvent with type === 'waste' */
export type WasteEntry = StockEvent & { type: 'waste' };
/** @deprecated Use StockEvent with type === 'add' | 'deduct' */
export type StockAdjustment = StockEvent & { type: 'add' | 'deduct' };

export interface Deduction {
	id: string;
	locationId: string;
	stockItemId: string;
	qty: number;
	tableId: string;
	orderId: string;
	timestamp: string;
	updatedAt: string;
}

export interface StockCount {
	stockItemId: string;
	locationId: string;
	/** Business date (YYYY-MM-DD) — null for legacy docs migrated before date tracking */
	date: string | null;
	counted: Record<CountPeriod, number | null>;
	updatedAt: string;
}


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

export { getProteinType };

// ─── Yield Overrides (manager-editable conversion %) ─────────────────────────

function loadYieldOverrides(): Record<string, number> {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem('wtfpos_yield_overrides');
		return raw ? JSON.parse(raw) : {};
	} catch { return {}; }
}

export const yieldOverrides: Record<string, number> = $state(loadYieldOverrides());

export function getYieldPct(from: string, to: string): number {
	const key = `${from}->${to}`;
	if (key in yieldOverrides) return yieldOverrides[key];
	const edge = DEFAULT_MEAT_EDGES.find(e => e.from === from && e.to === to);
	return edge?.defaultYieldPct ?? 0;
}

export function setYieldPct(from: string, to: string, pct: number) {
	const key = `${from}->${to}`;
	yieldOverrides[key] = pct;
	if (browser) {
		localStorage.setItem('wtfpos_yield_overrides', JSON.stringify(yieldOverrides));
	}
}

// ─── Initial Mock Data ────────────────────────────────────────────────────────
const STOCK_IMAGE_COLORS: Record<StockCategory, { bg: string; fg: string }> = {
	Meats:  { bg: 'DC2626', fg: 'FFFFFF' },
	Sides:  { bg: '10B981', fg: 'FFFFFF' },
	Dishes: { bg: 'F59E0B', fg: 'FFFFFF' },
	Drinks: { bg: '3B82F6', fg: 'FFFFFF' },
	Pantry: { bg: 'D97706', fg: 'FFFFFF' },
};

function stockPlaceholderImage(name: string, category: StockCategory): string {
	const { bg, fg } = STOCK_IMAGE_COLORS[category];
	const label = name.replace(/\s*\(.*?\)\s*/g, '').trim().substring(0, 18);
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#${bg}"/><text x="100" y="108" font-family="Inter,sans-serif" font-size="14" font-weight="600" fill="#${fg}" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const INITIAL_STOCK_ITEMS: StockItem[] = STOCK_ITEMS_LIST.map((s, i) => ({
	id: `si-${i}`,
	menuItemId: s.menuItemId,
	name: s.name,
	category: s.category,
	proteinType: s.proteinType || getProteinType(s.menuItemId),
	locationId: s.locationId,
	openingStock: getOpeningStock(s.menuItemId, s.locationId),
	unit: s.unit,
	minLevel: s.minLevel,
	image: stockPlaceholderImage(s.name, s.category),
	updatedAt: new Date().toISOString(),
}));

function getSiId(menuItemId: string, locationId: string): string {
	const index = STOCK_ITEMS_LIST.findIndex(s => s.menuItemId === menuItemId && s.locationId === locationId);
	if (index === -1) {
		console.warn(`[STOCK] Stock item not found for menuItemId=${menuItemId}, locationId=${locationId}`);
		// Return a unique fallback ID to prevent collisions
		return `si-missing-${menuItemId}-${locationId}`;
	}
	return `si-${index}`;
}

// Helper for relative timestamps
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
const now = new Date().toISOString();

export const INITIAL_DELIVERIES: Delivery[] = [
	// Original supplier deliveries
	{ id: 'd1', locationId: 'tag', stockItemId: getSiId('meat-pork-bone-in', 'tag'), itemName: 'Pork Bone-In',            qty: 5000, unit: 'g',        supplier: 'Metro Meat Co.',   notes: '',                    receivedAt: now, usedQty: 0, depleted: false, batchNo: 'B-241', expiryDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], updatedAt: now },
	{ id: 'd2', locationId: 'tag', stockItemId: getSiId('drink-soju', 'tag'), itemName: 'Soju (Original)',         qty: 6,    unit: 'bottles',   supplier: 'SM Trading',       notes: '',                    receivedAt: hoursAgo(1), usedQty: 0, depleted: false, batchNo: 'B-242', updatedAt: now },
	{ id: 'd3', locationId: 'tag', stockItemId: getSiId('side-kimchi', 'tag'), itemName: 'Kimchi',                  qty: 10,   unit: 'portions',  supplier: 'Korean Foods PH',  notes: 'Checked freshness',   receivedAt: hoursAgo(2), usedQty: 5, depleted: false, batchNo: 'B-243', expiryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], updatedAt: now },

	// ── Transfers: Warehouse → Tagbilaran (today, morning dispatch) ────────────────────
	{ id: 'trf-tag-1', locationId: 'tag', stockItemId: getSiId('meat-pork-bone-in', 'tag'),   itemName: 'Pork Bone-In',   qty: 8000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(6), usedQty: 3200, depleted: false, batchNo: 'TRF-A1TAG', updatedAt: now },
	{ id: 'trf-tag-2', locationId: 'tag', stockItemId: getSiId('meat-pork-bone-out', 'tag'),  itemName: 'Pork Bone-Out',  qty: 6000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(6), usedQty: 2400, depleted: false, batchNo: 'TRF-A2TAG', updatedAt: now },
	{ id: 'trf-tag-3', locationId: 'tag', stockItemId: getSiId('meat-beef-bone-in', 'tag'),   itemName: 'Beef Bone-In',   qty: 5000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(6), usedQty: 1800, depleted: false, batchNo: 'TRF-A3TAG', updatedAt: now },
	{ id: 'trf-tag-4', locationId: 'tag', stockItemId: getSiId('meat-beef-sliced', 'tag'),    itemName: 'Sliced Beef',     qty: 4000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(6), usedQty: 1500, depleted: false, batchNo: 'TRF-A4TAG', updatedAt: now },
	{ id: 'trf-tag-5', locationId: 'tag', stockItemId: getSiId('meat-chicken-wing', 'tag'),   itemName: 'Chicken Wing',    qty: 3000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(6), usedQty: 1200, depleted: false, batchNo: 'TRF-A5TAG', updatedAt: now },
	{ id: 'trf-tag-6', locationId: 'tag', stockItemId: getSiId('meat-chicken-leg', 'tag'),    itemName: 'Chicken Leg',     qty: 3000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(6), usedQty: 900,  depleted: false, batchNo: 'TRF-A6TAG', updatedAt: now },

	// ── Transfers: Warehouse → Panglao (today, morning dispatch) ────────────────
	{ id: 'trf-mk-1', locationId: 'pgl', stockItemId: getSiId('meat-pork-bone-in', 'pgl'),  itemName: 'Pork Bone-In',   qty: 7000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(5), usedQty: 2800, depleted: false, batchNo: 'TRF-B1MK', updatedAt: now },
	{ id: 'trf-mk-2', locationId: 'pgl', stockItemId: getSiId('meat-pork-sliced', 'pgl'),   itemName: 'Sliced Pork',     qty: 5000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(5), usedQty: 2000, depleted: false, batchNo: 'TRF-B2MK', updatedAt: now },
	{ id: 'trf-mk-3', locationId: 'pgl', stockItemId: getSiId('meat-beef-bone-in', 'pgl'),  itemName: 'Beef Bone-In',   qty: 4000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(5), usedQty: 1600, depleted: false, batchNo: 'TRF-B3MK', updatedAt: now },
	{ id: 'trf-mk-4', locationId: 'pgl', stockItemId: getSiId('meat-beef-bone-out', 'pgl'), itemName: 'Beef Bone-Out',  qty: 3500, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(5), usedQty: 1200, depleted: false, batchNo: 'TRF-B4MK', updatedAt: now },
	{ id: 'trf-mk-5', locationId: 'pgl', stockItemId: getSiId('meat-chicken-wing', 'pgl'),  itemName: 'Chicken Wing',    qty: 2500, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Morning dispatch',  receivedAt: hoursAgo(5), usedQty: 1000, depleted: false, batchNo: 'TRF-B5MK', updatedAt: now },

	// ── Transfers: Warehouse → Tagbilaran (yesterday, afternoon restock) ───────────────
	{ id: 'trf-tag-y1', locationId: 'tag', stockItemId: getSiId('meat-pork-sliced', 'tag'),   itemName: 'Sliced Pork',     qty: 4500, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Afternoon restock', receivedAt: hoursAgo(28), usedQty: 4500, depleted: true,  batchNo: 'TRF-Y1TAG', updatedAt: now },
	{ id: 'trf-tag-y2', locationId: 'tag', stockItemId: getSiId('meat-beef-bone-out', 'tag'), itemName: 'Beef Bone-Out',  qty: 3000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Afternoon restock', receivedAt: hoursAgo(28), usedQty: 3000, depleted: true,  batchNo: 'TRF-Y2TAG', updatedAt: now },
	{ id: 'trf-tag-y3', locationId: 'tag', stockItemId: getSiId('meat-chicken-leg', 'tag'),   itemName: 'Chicken Leg',     qty: 2000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Afternoon restock', receivedAt: hoursAgo(28), usedQty: 2000, depleted: true,  batchNo: 'TRF-Y3TAG', updatedAt: now },

	// ── Transfers: Warehouse → Panglao (yesterday) ──────────────────────────────
	{ id: 'trf-mk-y1', locationId: 'pgl', stockItemId: getSiId('meat-pork-bone-out', 'pgl'), itemName: 'Pork Bone-Out', qty: 5500, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Daily dispatch',    receivedAt: hoursAgo(26), usedQty: 5500, depleted: true,  batchNo: 'TRF-Y1MK', updatedAt: now },
	{ id: 'trf-mk-y2', locationId: 'pgl', stockItemId: getSiId('meat-beef-sliced', 'pgl'),  itemName: 'Sliced Beef',     qty: 3000, unit: 'g', supplier: 'Transfer from wh-tag', notes: 'Daily dispatch',    receivedAt: hoursAgo(26), usedQty: 3000, depleted: true,  batchNo: 'TRF-Y2MK', updatedAt: now },
];

export const INITIAL_STOCK_EVENTS: StockEvent[] = [
	{ id: 'w1', locationId: 'tag', type: 'waste' as const, stockItemId: getSiId('meat-pork-bones', 'tag'),  itemName: 'Pork Bones',            qty: 150, unit: 'g',        reason: 'Trimming (bone/fat)', loggedBy: 'Maria S.', loggedAt: new Date(Date.now() - 14400000).toISOString(), updatedAt: new Date().toISOString() },
	{ id: 'w2', locationId: 'tag', type: 'waste' as const, stockItemId: getSiId('side-rice', 'tag'), itemName: 'Steamed Rice',          qty: 2,   unit: 'portions', reason: 'Overcooked',          loggedBy: 'Pedro C.', loggedAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString() },
	{ id: 'w3', locationId: 'tag', type: 'waste' as const, stockItemId: getSiId('drink-soju', 'tag'), itemName: 'Soju (Original)',       qty: 1,   unit: 'bottles',  reason: 'Unusable (damaged)',  loggedBy: 'Maria S.', loggedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const INITIAL_DEDUCTIONS: Deduction[] = [];

export const INITIAL_STOCK_COUNTS: StockCount[] = INITIAL_STOCK_ITEMS.map(s => ({
	stockItemId: s.id,
	locationId: s.locationId,
	date: new Date().toISOString().slice(0, 10),
	counted: {
		am10: getMorningCount(s.menuItemId, s.locationId),
		pm4: getAfternoonCount(s.menuItemId, s.locationId),
		pm10: null,
	},
	updatedAt: new Date().toISOString(),
}));

export const INITIAL_ADJUSTMENT_EVENTS: StockEvent[] = [
	// ── Warehouse deductions for today's Tagbilaran transfers ──────────────────────────
	{ id: 'adj-trf-tag-1', locationId: 'wh-tag', stockItemId: getSiId('meat-pork-bone-in', 'wh-tag'),  itemName: 'Pork Bone-In (Bulk)',  type: 'deduct', qty: 8000, unit: 'g', reason: 'Transfer to tag — Morning dispatch',  loggedBy: 'Noel R.', loggedAt: hoursAgo(6), updatedAt: now },
	{ id: 'adj-trf-tag-2', locationId: 'wh-tag', stockItemId: getSiId('meat-pork-bone-out', 'wh-tag'), itemName: 'Pork Bone-Out (Bulk)', type: 'deduct', qty: 6000, unit: 'g', reason: 'Transfer to tag — Morning dispatch',  loggedBy: 'Noel R.', loggedAt: hoursAgo(6), updatedAt: now },
	{ id: 'adj-trf-tag-3', locationId: 'wh-tag', stockItemId: getSiId('meat-beef-bone-in', 'wh-tag'),  itemName: 'Beef Bone-In (Bulk)',  type: 'deduct', qty: 5000, unit: 'g', reason: 'Transfer to tag — Morning dispatch',  loggedBy: 'Noel R.', loggedAt: hoursAgo(6), updatedAt: now },
	{ id: 'adj-trf-tag-4', locationId: 'wh-tag', stockItemId: getSiId('meat-beef-sliced', 'wh-tag'),   itemName: 'Sliced Beef (Bulk)',    type: 'deduct', qty: 4000, unit: 'g', reason: 'Transfer to tag — Morning dispatch',  loggedBy: 'Noel R.', loggedAt: hoursAgo(6), updatedAt: now },
	{ id: 'adj-trf-tag-5', locationId: 'wh-tag', stockItemId: getSiId('meat-chicken-wing', 'wh-tag'),  itemName: 'Chicken Wing (Bulk)',   type: 'deduct', qty: 3000, unit: 'g', reason: 'Transfer to tag — Morning dispatch',  loggedBy: 'Noel R.', loggedAt: hoursAgo(6), updatedAt: now },
	{ id: 'adj-trf-tag-6', locationId: 'wh-tag', stockItemId: getSiId('meat-chicken-leg', 'wh-tag'),   itemName: 'Chicken Leg (Bulk)',    type: 'deduct', qty: 3000, unit: 'g', reason: 'Transfer to tag — Morning dispatch',  loggedBy: 'Noel R.', loggedAt: hoursAgo(6), updatedAt: now },

	// ── Warehouse deductions for today's Panglao transfers ──────────────────────
	{ id: 'adj-trf-mk-1', locationId: 'wh-tag', stockItemId: getSiId('meat-pork-bone-in', 'wh-tag'),  itemName: 'Pork Bone-In (Bulk)',  type: 'deduct', qty: 7000, unit: 'g', reason: 'Transfer to pgl — Morning dispatch', loggedBy: 'Noel R.', loggedAt: hoursAgo(5), updatedAt: now },
	{ id: 'adj-trf-mk-2', locationId: 'wh-tag', stockItemId: getSiId('meat-pork-sliced', 'wh-tag'),   itemName: 'Sliced Pork (Bulk)',    type: 'deduct', qty: 5000, unit: 'g', reason: 'Transfer to pgl — Morning dispatch', loggedBy: 'Noel R.', loggedAt: hoursAgo(5), updatedAt: now },
	{ id: 'adj-trf-mk-3', locationId: 'wh-tag', stockItemId: getSiId('meat-beef-bone-in', 'wh-tag'),  itemName: 'Beef Bone-In (Bulk)',  type: 'deduct', qty: 4000, unit: 'g', reason: 'Transfer to pgl — Morning dispatch', loggedBy: 'Noel R.', loggedAt: hoursAgo(5), updatedAt: now },
	{ id: 'adj-trf-mk-4', locationId: 'wh-tag', stockItemId: getSiId('meat-beef-bone-out', 'wh-tag'), itemName: 'Beef Bone-Out (Bulk)', type: 'deduct', qty: 3500, unit: 'g', reason: 'Transfer to pgl — Morning dispatch', loggedBy: 'Noel R.', loggedAt: hoursAgo(5), updatedAt: now },
	{ id: 'adj-trf-mk-5', locationId: 'wh-tag', stockItemId: getSiId('meat-chicken-wing', 'wh-tag'),  itemName: 'Chicken Wing (Bulk)',   type: 'deduct', qty: 2500, unit: 'g', reason: 'Transfer to pgl — Morning dispatch', loggedBy: 'Noel R.', loggedAt: hoursAgo(5), updatedAt: now },

	// ── Warehouse deductions for yesterday's Tagbilaran transfers ──────────────────────
	{ id: 'adj-trf-tag-y1', locationId: 'wh-tag', stockItemId: getSiId('meat-pork-sliced', 'wh-tag'),   itemName: 'Sliced Pork (Bulk)',    type: 'deduct', qty: 4500, unit: 'g', reason: 'Transfer to tag — Afternoon restock', loggedBy: 'Noel R.', loggedAt: hoursAgo(28), updatedAt: now },
	{ id: 'adj-trf-tag-y2', locationId: 'wh-tag', stockItemId: getSiId('meat-beef-bone-out', 'wh-tag'), itemName: 'Beef Bone-Out (Bulk)', type: 'deduct', qty: 3000, unit: 'g', reason: 'Transfer to tag — Afternoon restock', loggedBy: 'Noel R.', loggedAt: hoursAgo(28), updatedAt: now },
	{ id: 'adj-trf-tag-y3', locationId: 'wh-tag', stockItemId: getSiId('meat-chicken-leg', 'wh-tag'),   itemName: 'Chicken Leg (Bulk)',    type: 'deduct', qty: 2000, unit: 'g', reason: 'Transfer to tag — Afternoon restock', loggedBy: 'Noel R.', loggedAt: hoursAgo(28), updatedAt: now },

	// ── Warehouse deductions for yesterday's Panglao transfers ──────────────────
	{ id: 'adj-trf-mk-y1', locationId: 'wh-tag', stockItemId: getSiId('meat-pork-bone-out', 'wh-tag'), itemName: 'Pork Bone-Out (Bulk)', type: 'deduct', qty: 5500, unit: 'g', reason: 'Transfer to pgl — Daily dispatch',  loggedBy: 'Noel R.', loggedAt: hoursAgo(26), updatedAt: now },
	{ id: 'adj-trf-mk-y2', locationId: 'wh-tag', stockItemId: getSiId('meat-beef-sliced', 'wh-tag'),   itemName: 'Sliced Beef (Bulk)',    type: 'deduct', qty: 3000, unit: 'g', reason: 'Transfer to pgl — Daily dispatch',  loggedBy: 'Noel R.', loggedAt: hoursAgo(26), updatedAt: now },
];

// ─── Reactive State (RxDB Stores) ─────────────────────────────────────────────

export const stockItems = createStore<StockItem>('stock_items', db => db.stock_items.find(), { filter: { locationId: undefined } });
export const deliveries = createStore<Delivery>('deliveries', db => db.deliveries.find(), { filter: { locationId: undefined } });
const _stockEvents = createStore<StockEvent>('stock_events', db => db.stock_events.find());

/** All stock events (waste, manual add, manual deduct) */
export const stockEvents = {
	get value() { return _stockEvents.value; },
	get initialized() { return _stockEvents.initialized; }
};
/** Filtered view: waste events only */
export const wasteEntries = {
	get value() { return _stockEvents.value.filter(e => e.type === 'waste') as WasteEntry[]; },
	get initialized() { return _stockEvents.initialized; }
};
/** Filtered view: manual add/deduct adjustments only */
export const adjustments = {
	get value() { return _stockEvents.value.filter(e => e.type === 'add' || e.type === 'deduct') as StockAdjustment[]; },
	get initialized() { return _stockEvents.initialized; }
};
export const deductions = createStore<Deduction>('deductions', db => db.deductions.find());
export const stockCounts = createStore<StockCount>('stock_counts', db => db.stock_counts.find(), { primaryKey: 'stockItemId' });

export const countPeriods = $state<{ id: CountPeriod; label: string; time: string; status: 'done' | 'pending' }[]>([
	{ id: 'am10', label: 'Morning',   time: '10:00 AM', status: 'done' },
	{ id: 'pm4',  label: 'Afternoon', time: '4:00 PM',  status: 'done' },
	{ id: 'pm10', label: 'Evening',   time: '10:00 PM', status: 'pending' },
]);

// ─── Memoized stock cache ─────────────────────────────────────────────────────
// Pre-computes ALL stock levels in a single O(N) pass when underlying stores change.
// Components call getCurrentStock(id) which is now O(1) lookup instead of O(N) per call.
const _stockCache = $derived.by(() => {
	// Build opening stock map
	const cache = new Map<string, number>();
	for (const item of stockItems.value) {
		cache.set(item.id, item.openingStock);
	}
	// Add deliveries
	for (const d of deliveries.value) {
		const prev = cache.get(d.stockItemId);
		if (prev !== undefined) cache.set(d.stockItemId, prev + d.qty);
	}
	// Subtract deductions
	for (const d of deductions.value) {
		const prev = cache.get(d.stockItemId);
		if (prev !== undefined) cache.set(d.stockItemId, prev - d.qty);
	}
	// Apply stock events (waste/deduct subtract, add adds)
	for (const e of stockEvents.value) {
		const prev = cache.get(e.stockItemId);
		if (prev === undefined) continue;
		if (e.type === 'add') cache.set(e.stockItemId, prev + e.qty);
		else cache.set(e.stockItemId, prev - e.qty); // waste or deduct
	}
	return cache;
});

/** Get the current stock for a stock item — O(1) lookup from memoized cache */
export function getCurrentStock(stockItemId: string): number {
	return _stockCache.get(stockItemId) ?? 0;
}

export function getStockStatus(stockItemId: string): StockStatus {
	const item = stockItems.value.find(s => s.id === stockItemId);
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
	const count = stockCounts.value.find(c => c.stockItemId === stockItemId);
	if (!count) return null;
	const counted = count.counted[period];
	if (counted === null) return null;
	const expected = getExpectedStock(stockItemId);
	return expected - counted; // positive = missing
}

/** Variance report periods — broader than count-time slots */
export type VariancePeriod = 'today' | 'week' | 'month';

/** Get the date bounds for a variance period */
function getVarianceBounds(period: VariancePeriod): { start: Date; end: Date } {
	const now = new Date();
	const end = now;
	const start = new Date(now);
	if (period === 'today') {
		start.setHours(0, 0, 0, 0);
	} else if (period === 'week') {
		start.setDate(start.getDate() - 7);
		start.setHours(0, 0, 0, 0);
	} else {
		start.setDate(start.getDate() - 30);
		start.setHours(0, 0, 0, 0);
	}
	return { start, end };
}

/** Compute variance for a stock item over a time period.
 *  Uses opening stock + period deliveries - period deductions - period waste as "expected",
 *  then compares against the latest physical count. */
export function getPeriodVariance(stockItemId: string, period: VariancePeriod): {
	delivered: number;
	sold: number;
	waste: number;
	expected: number;
	counted: number | null;
	drift: number | null;
	driftPct: number | null;
} {
	const item = stockItems.value.find(s => s.id === stockItemId);
	if (!item) return { delivered: 0, sold: 0, waste: 0, expected: 0, counted: null, drift: null, driftPct: null };

	const { start, end } = getVarianceBounds(period);
	const inRange = (iso: string) => { const d = new Date(iso); return d >= start && d <= end; };

	const delivered = deliveries.value
		.filter(d => d.stockItemId === stockItemId && inRange(d.receivedAt))
		.reduce((s, d) => s + d.qty, 0);

	const sold = deductions.value
		.filter(d => d.stockItemId === stockItemId && inRange(d.timestamp))
		.reduce((s, d) => s + d.qty, 0);

	const waste = stockEvents.value
		.filter(e => e.stockItemId === stockItemId && e.type === 'waste' && inRange(e.loggedAt))
		.reduce((s, e) => s + e.qty, 0);

	const expected = item.openingStock + delivered - sold - waste;

	// Latest physical count — use pm4 if available, else am10
	const countDoc = stockCounts.value.find(c => c.stockItemId === stockItemId);
	const counted = countDoc?.counted.pm4 ?? countDoc?.counted.am10 ?? null;

	const drift = counted !== null ? expected - counted : null;
	const base = item.openingStock + delivered;
	const driftPct = drift !== null && base > 0 ? (drift / base) * 100 : null;

	return { delivered, sold, waste, expected, counted, drift, driftPct };
}

/** Compute comparison data for stock variance KPIs vs previous period.
 *  Returns shortage count and worst drift for current vs previous period. */
export function stockVarianceComparison(period: VariancePeriod): {
	shortageCount: { current: number; previous: number; changePct: number | null };
	worstDrift: { current: number; previous: number; changePct: number | null };
} | null {
	if (period === 'month') return null; // no previous month bounds easily available

	const prevPeriodMap: Record<VariancePeriod, VariancePeriod | null> = {
		today: 'today',
		week: 'week',
		month: null,
	};
	if (!prevPeriodMap[period]) return null;

	// Current period — reuse getPeriodVariance
	const locItems = session.locationId === 'all'
		? stockItems.value.filter(s => s.locationId !== 'wh-tag')
		: stockItems.value.filter(s => s.locationId === session.locationId);

	const currentRows = locItems.map(item => getPeriodVariance(item.id, period));
	const currWithDrift = currentRows.filter(r => r.drift !== null);
	const currShortage = currWithDrift.filter(r => (r.drift ?? 0) > 0).length;
	const currWorstDrift = currWithDrift.length > 0
		? Math.max(...currWithDrift.map(r => Math.abs(r.driftPct ?? 0)))
		: 0;

	// Previous period — shift bounds backward
	const { start: currStart } = getVarianceBounds(period);
	const duration = Date.now() - currStart.getTime();
	const prevEnd = new Date(currStart);
	const prevStart = new Date(currStart.getTime() - duration);

	const inPrevRange = (iso: string) => { const d = new Date(iso); return d >= prevStart && d < prevEnd; };

	// Compute previous-period variance for each item (simplified — uses same counted values since counts don't have period history)
	let prevShortage = 0;
	let prevWorstDrift = 0;

	for (const item of locItems) {
		const delivered = deliveries.value
			.filter(d => d.stockItemId === item.id && inPrevRange(d.receivedAt))
			.reduce((s, d) => s + d.qty, 0);
		const sold = deductions.value
			.filter(d => d.stockItemId === item.id && inPrevRange(d.timestamp))
			.reduce((s, d) => s + d.qty, 0);
		const waste = stockEvents.value
			.filter(e => e.stockItemId === item.id && e.type === 'waste' && inPrevRange(e.loggedAt))
			.reduce((s, e) => s + e.qty, 0);
		const expected = item.openingStock + delivered - sold - waste;
		const countDoc = stockCounts.value.find(c => c.stockItemId === item.id);
		const counted = countDoc?.counted.pm4 ?? countDoc?.counted.am10 ?? null;
		if (counted === null) continue;
		const drift = expected - counted;
		const base = item.openingStock + delivered;
		const driftPct = base > 0 ? (drift / base) * 100 : null;
		if (drift > 0) prevShortage++;
		if (driftPct !== null) prevWorstDrift = Math.max(prevWorstDrift, Math.abs(driftPct));
	}

	const shortChangePct = prevShortage > 0 ? ((currShortage - prevShortage) / prevShortage) * 100 : null;
	const driftChangePct = prevWorstDrift > 0 ? ((currWorstDrift - prevWorstDrift) / prevWorstDrift) * 100 : null;

	return {
		shortageCount: { current: currShortage, previous: prevShortage, changePct: shortChangePct },
		worstDrift: { current: currWorstDrift, previous: prevWorstDrift, changePct: driftChangePct },
	};
}

export function getSpoilageAlerts() {
	const now = new Date();
	const alerts = [];
	
	for (const delivery of deliveries.value) {
		if (delivery.depleted || !delivery.expiryDate) continue;
		
		const expiry = new Date(delivery.expiryDate);
		const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		
		// Alert if expired (daysLeft < 0) or expiring in next 3 days
		if (daysLeft <= 3) {
			alerts.push({
				...delivery,
				daysLeft
			});
		}
	}
	
	return alerts;
}

/** Get the last meaningful stock event for an item (delivery, deduction, or waste).
 *  Returns { type, timestamp } or null if no events exist. */
export function getLastStockEvent(stockItemId: string): { type: 'delivery' | 'deduction' | 'waste'; timestamp: string } | null {
	let latest: { type: 'delivery' | 'deduction' | 'waste'; timestamp: string } | null = null;

	for (const d of deliveries.value) {
		if (d.stockItemId === stockItemId && d.receivedAt) {
			if (!latest || d.receivedAt > latest.timestamp) latest = { type: 'delivery', timestamp: d.receivedAt };
		}
	}
	for (const d of deductions.value) {
		if (d.stockItemId === stockItemId && d.timestamp) {
			if (!latest || d.timestamp > latest.timestamp) latest = { type: 'deduction', timestamp: d.timestamp };
		}
	}
	for (const w of wasteEntries.value) {
		if (w.stockItemId === stockItemId && w.loggedAt) {
			if (!latest || w.loggedAt > latest.timestamp) latest = { type: 'waste', timestamp: w.loggedAt };
		}
	}
	return latest;
}

/** Get items approaching low threshold (within 20% above minLevel) but still "ok" status. */
export function getApproachingLowItems(): (StockItem & { currentStock: number; status: StockStatus; pctAboveMin: number })[] {
	return stockItems.value
		.filter(s => session.locationId === 'all' || s.locationId === session.locationId)
		.map(s => {
			const currentStock = getCurrentStock(s.id);
			const status = getStockStatus(s.id);
			const pctAboveMin = s.minLevel > 0 ? ((currentStock - s.minLevel) / s.minLevel) * 100 : 999;
			return { ...s, currentStock, status, pctAboveMin };
		})
		.filter(s => s.status === 'ok' && s.pctAboveMin <= 20 && s.pctAboveMin >= 0)
		.sort((a, b) => a.pctAboveMin - b.pctAboveMin);
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function receiveDelivery(stockItemId: string, itemName: string, qty: number, unit: string, supplier: string, notes: string = '', batchNo?: string, expiryDate?: string, photo?: string, unitCost?: number): Promise<{ success: boolean; error?: string; id?: string }> {
	if (!browser) return { success: false, error: 'Not in browser environment' };
	
	// Validate inputs
	if (!stockItemId || typeof stockItemId !== 'string') return { success: false, error: 'Invalid stock item ID' };
	if (!itemName || itemName.trim() === '') return { success: false, error: 'Item name is required' };
	if (typeof qty !== 'number' || isNaN(qty) || qty <= 0) return { success: false, error: 'Quantity must be a positive number' };
	if (qty > 999999999) return { success: false, error: 'Quantity exceeds maximum allowed' };
	if (!unit || unit.trim() === '') return { success: false, error: 'Unit is required' };
	if (!supplier || supplier.trim() === '') return { success: false, error: 'Supplier is required' };
	
	try {
		const col = getWritableCollection('deliveries');
		const id = nanoid();
		await col.insert({
			id,
			locationId: session.locationId,
			stockItemId,
			itemName: itemName.trim(),
			qty,
			unit: unit.trim(),
			supplier: supplier.trim(),
			notes: notes.trim(),
			receivedAt: new Date().toISOString(),
			batchNo,
			expiryDate,
			usedQty: 0,
			depleted: false,
			...(photo && { photo }),
			...(unitCost != null && unitCost > 0 && { unitCost }),
			updatedAt: new Date().toISOString(),
		});
		log.deliveryReceived(itemName, qty, unit, supplier);
		return { success: true, id };
	} catch (err) {
		console.error('[STOCK] Failed to receive delivery:', err);
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' };
	}
}

export async function logWaste(stockItemId: string, itemName: string, qty: number, unit: string, reason: string, loggedBy?: string): Promise<{ success: boolean; error?: string; id?: string }> {
	if (!browser) return { success: false, error: 'Not in browser environment' };
	
	// Validate inputs
	if (!stockItemId || typeof stockItemId !== 'string') return { success: false, error: 'Invalid stock item ID' };
	if (!itemName || itemName.trim() === '') return { success: false, error: 'Item name is required' };
	if (typeof qty !== 'number' || isNaN(qty) || qty <= 0) return { success: false, error: 'Quantity must be a positive number' };
	if (!unit || unit.trim() === '') return { success: false, error: 'Unit is required' };
	if (!reason || reason.trim() === '') return { success: false, error: 'Reason is required' };
	
	const logger = loggedBy ?? session.userName ?? 'Staff';
	
	try {
		const col = getWritableCollection('stock_events');
		const id = nanoid();
		await col.insert({
			id,
			locationId: session.locationId,
			stockItemId,
			itemName: itemName.trim(),
			type: 'waste' as const,
			qty,
			unit: unit.trim(),
			reason: reason.trim(),
			loggedBy: logger,
			loggedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		log.wasteLogged(itemName, qty, unit, reason);
		return { success: true, id };
	} catch (err) {
		console.error('[STOCK] Failed to log waste:', err);
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' };
	}
}

export async function adjustStock(
	stockItemId: string,
	itemName: string,
	type: 'add' | 'deduct',
	qty: number,
	unit: string,
	reason: string,
	loggedBy?: string
): Promise<{ success: boolean; error?: string; id?: string }> {
	if (!browser) return { success: false, error: 'Not in browser environment' };
	
	// Validate inputs
	if (!stockItemId || typeof stockItemId !== 'string') return { success: false, error: 'Invalid stock item ID' };
	if (!itemName || itemName.trim() === '') return { success: false, error: 'Item name is required' };
	if (type !== 'add' && type !== 'deduct') return { success: false, error: 'Type must be add or deduct' };
	if (typeof qty !== 'number' || isNaN(qty) || qty <= 0) return { success: false, error: 'Quantity must be a positive number' };
	if (!unit || unit.trim() === '') return { success: false, error: 'Unit is required' };
	if (!reason || reason.trim() === '') return { success: false, error: 'Reason is required' };
	
	const logger = loggedBy ?? session.userName ?? 'Staff';
	
	try {
		const col = getWritableCollection('stock_events');
		const id = nanoid();
		await col.insert({
			id,
			locationId: session.locationId,
			stockItemId,
			itemName: itemName.trim(),
			type,
			qty,
			unit: unit.trim(),
			reason: reason.trim(),
			loggedBy: logger,
			loggedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		writeLog('stock', `Stock ${type === 'add' ? 'added' : 'deducted'}: ${qty}${unit} ${itemName} — ${reason} (by ${logger})`);
		return { success: true, id };
	} catch (err) {
		console.error('[STOCK] Failed to adjust stock:', err);
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error occurred' };
	}
}

/** Set stock to an absolute value by computing the delta and calling adjustStock */
export async function setStock(
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
	await adjustStock(stockItemId, itemName, type, Math.abs(delta), unit, reason || 'Manual stock set', loggedBy);
}

/** Called by POS when items are charged to a table */
export async function deductFromStock(menuItemId: string, qty: number, tableId: string, orderId: string, isTracked: boolean = false, locationId?: string) {
	if (!browser) return;
	if (!isTracked) return;
	if (qty <= 0) return;
	
	const locId = locationId ?? session.locationId ?? '';
	const item = stockItems.value.find(s => s.menuItemId === menuItemId && s.locationId === locId);
	if (!item) return; // item not tracked in stock (e.g. packages themselves)
	
	const deductionsCol = getWritableCollection('deductions');
	const deliveriesCol = getWritableCollection('deliveries');

	try {
		// Re-check stock inside transaction to prevent race conditions
		const currentStock = getCurrentStock(item.id);
		const deductQty = Math.min(qty, currentStock); // Never deduct more than available

		if (deductQty <= 0) {
			console.warn(`[STOCK-DEDUCT] Insufficient stock for ${item.name}: have ${currentStock}, need ${qty}`);
			return;
		}

		// Insert deduction record
		await deductionsCol.insert({
			id: nanoid(),
			locationId: locId,
			stockItemId: item.id,
			qty: deductQty,
			tableId,
			orderId,
			timestamp: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		// ── Stock negativity detection (non-blocking) ──
		// Re-read stock after the deduction write to catch race conditions
		const postDeductionStock = getCurrentStock(item.id);
		if (postDeductionStock < 0) {
			import('$lib/stores/guard.svelte').then(({ recordGuardEvent }) => {
				recordGuardEvent({
					type: 'stock-negative',
					layer: 'client',
					tableId,
					reason: `Stock for ${item.name} went negative: ${postDeductionStock}${item.unit} after deduction of ${deductQty}${item.unit}`,
				});
			}).catch(() => { /* guard not available */ });
		}

		// Process FIFO queue for batches
		let remainingToDeduct = deductQty;
		// Oldest deliveries first (assuming array is prepended via unshift, so reverse or findLast-ish)
		// We'll iterate from the end (oldest) to start (newest)
		for (let i = deliveries.value.length - 1; i >= 0; i--) {
			const d = deliveries.value[i];
			if (d.stockItemId !== item.id || d.depleted) continue;

			const dUsed = d.usedQty || 0;
			const availableInBatch = d.qty - dUsed;

			if (availableInBatch > 0) {
				const deductNow = Math.min(availableInBatch, remainingToDeduct);
				const newUsedQty = dUsed + deductNow;
				await deliveriesCol.incrementalPatch(d.id, {
					usedQty: newUsedQty,
					depleted: newUsedQty >= d.qty,
					updatedAt: new Date().toISOString(),
				});
				remainingToDeduct -= deductNow;
				if (remainingToDeduct <= 0) break;
			}
		}
	} catch (err) {
		console.error(`[STOCK-DEDUCT] Error deducting stock for ${menuItemId}:`, err);
		throw err; // Re-throw so caller can handle
	}
}

/**
 * Restore stock when an item is rejected/cancelled from KDS
 * Rolls back FIFO usage in deliveries and removes the deduction record.
 */
export async function restoreStock(menuItemId: string, qty: number, orderId: string, locationId?: string) {
	if (!browser) return;
	const locId = locationId ?? session.locationId ?? 'tag';
	const item = stockItems.value.find(s => s.menuItemId === menuItemId && s.locationId === locId);
	if (!item) return;

	// 1. Find all deduction records for this order
	const matchingDeductions = deductions.value.filter(d =>
		d.stockItemId === item.id && d.orderId === orderId
	);
	if (matchingDeductions.length === 0) return;

	const totalRestoreQty = matchingDeductions.reduce((sum, d) => sum + d.qty, 0);

	const deliveriesCol = getWritableCollection('deliveries');

	// 2. Roll back FIFO usedQty in deliveries (Newest First)
	let remainingToRestore = totalRestoreQty;
	const itemDeliveries = [...deliveries.value]
		.filter(d => d.stockItemId === item.id && (d.usedQty || 0) > 0)
		.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

	for (const d of itemDeliveries) {
		const used = d.usedQty || 0;
		const restoreNow = Math.min(used, remainingToRestore);
		const newUsedQty = used - restoreNow;

		await deliveriesCol.incrementalPatch(d.id, { usedQty: newUsedQty, depleted: false, updatedAt: new Date().toISOString() });

		remainingToRestore -= restoreNow;
		if (remainingToRestore <= 0) break;
	}

	// 3. Remove the deduction records
	const deductionsCol = getWritableCollection('deductions');
	for (const d of matchingDeductions) {
		await deductionsCol.remove(d.id);
	}
	log.stockRestored(item.name, totalRestoreQty, item.unit, orderId);
}

/** Tier 3: Transfer stock between branches/warehouses */
export async function transferStock(stockItemMenuItemId: string, qty: number, fromLocationId: string, toLocationId: string, loggedBy?: string, notes?: string) {
	const fromItem = stockItems.value.find(s => s.menuItemId === stockItemMenuItemId && s.locationId === fromLocationId);
	const toItem = stockItems.value.find(s => s.menuItemId === stockItemMenuItemId && s.locationId === toLocationId);

	if (!fromItem || !toItem) return false;

	const currentFrom = getCurrentStock(fromItem.id);
	if (currentFrom < qty) return false;

	const logger = loggedBy ?? session.userName ?? 'Staff';
	const noteSuffix = notes ? ` — ${notes}` : '';
	
	// Create a deduction record in the source (this will also trigger FIFO batch usage if we use deductFromStock)
	// But deductFromStock is tied to orders. Let's just use adjustStock for simplicity but with a special reason.
	await adjustStock(fromItem.id, fromItem.name, 'deduct', qty, fromItem.unit, `Transfer to ${toLocationId}${noteSuffix}`, logger);

	// Create a NEW delivery in the destination to represent the incoming transfer as a fresh batch
	await receiveDelivery(
		toItem.id, 
		toItem.name, 
		qty, 
		toItem.unit, 
		`Transfer from ${fromLocationId}`, 
		notes, 
		`TRF-${nanoid(4).toUpperCase()}`
	);

	log.stockTransferred(fromItem.name, qty, fromItem.unit, fromLocationId, toLocationId);
	return true;
}

export async function submitCount(stockItemId: string, period: CountPeriod, value: number) {
	if (!browser) return;
	const col = getWritableCollection('stock_counts');
	const now = new Date();
	const businessDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
	const doc = await col.findOne(stockItemId).exec();
	if (doc) {
		await col.incrementalPatch(stockItemId, {
			counted: { ...doc.counted, [period]: value },
			locationId: session.locationId || doc.locationId || '',
			date: businessDate,
			updatedAt: now.toISOString(),
		});
	}
}

/** Mark a count period as done (called by Submit Count button) */
export function markPeriodDone(period: CountPeriod) {
	const p = countPeriods.find(cp => cp.id === period);
	if (p) {
		p.status = 'done';
		const periodLabels: Record<CountPeriod, string> = { am10: 'Morning', pm4: 'Afternoon', pm10: 'Evening' };
		log.countSubmitted(periodLabels[period]);
	}
}

// ─── Seed Helpers ─────────────────────────────────────────────────────────────

function getOpeningStock(menuItemId: string, locationId: string): number {
	if (locationId === 'wh-tag') return 50000; // Large stock for warehouse
	const item = STOCK_ITEMS_LIST.find(s => s.menuItemId === menuItemId && s.locationId === locationId);
	return item ? Math.round(item.minLevel * 1.5) : 0;
}

function getMorningCount(menuItemId: string, locationId: string): number | null {
	if (locationId === 'wh-tag') return null; // warehouse doesn't do physical counts
	const item = STOCK_ITEMS_LIST.find(s => s.menuItemId === menuItemId && s.locationId === locationId);
	if (!item) return null;
	// Simulate realistic variance: counted is ±3-12% off from expected
	const jitter = 1 + (hashCode(menuItemId + locationId + 'am') % 20 - 10) / 100; // -10% to +10%
	return Math.round(item.minLevel * 1.45 * jitter);
}

function getAfternoonCount(menuItemId: string, locationId: string): number | null {
	if (locationId === 'wh-tag') return null;
	const item = STOCK_ITEMS_LIST.find(s => s.menuItemId === menuItemId && s.locationId === locationId);
	if (!item) return null;
	// Afternoon counts typically show more shrinkage (busy lunch/dinner service)
	const jitter = 1 + (hashCode(menuItemId + locationId + 'pm') % 25 - 15) / 100; // -15% to +10%
	return Math.round(item.minLevel * 0.8 * jitter);
}

/** Deterministic hash for reproducible seed jitter */
function hashCode(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
	return Math.abs(h);
}

export async function updateStockItem(id: string, updates: Partial<StockItem>) {
	if (!browser) return;
	const col = getWritableCollection('stock_items');
	await col.incrementalPatch(id, { ...updates, updatedAt: new Date().toISOString() });
}
