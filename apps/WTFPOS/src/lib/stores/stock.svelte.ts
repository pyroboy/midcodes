/**
 * Stock Management Store — Svelte 5 Runes
 * Reactive inventory connected to POS deductions, deliveries, and waste.
 */
import { nanoid } from 'nanoid';
import { log, writeLog } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';
import { createRxStore } from '$lib/stores/sync.svelte';
import { browser } from '$app/environment';
import { getDb } from '$lib/db';
import { STOCK_ITEMS_LIST, getProteinType, type StockCategory, type MeatProtein } from '$lib/stores/stock.constants';

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
	updatedAt: string;
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
	photo?: string;
	updatedAt: string;
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
	updatedAt: string;
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
	updatedAt: string;
}

export interface Deduction {
	id: string;
	stockItemId: string;
	qty: number;
	tableId: string;
	orderId: string;
	timestamp: string;
	updatedAt: string;
}

export interface StockCount {
	stockItemId: string;
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

// ─── Initial Mock Data ────────────────────────────────────────────────────────
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

export const INITIAL_DELIVERIES: Delivery[] = [
	{ id: 'd1', stockItemId: getSiId('meat-pork-bone-in', 'qc'), itemName: 'Pork Bone-In',            qty: 5000, unit: 'g',        supplier: 'Metro Meat Co.',   notes: '',                    receivedAt: new Date().toISOString(), usedQty: 0, depleted: false, batchNo: 'B-241', expiryDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], updatedAt: new Date().toISOString() },
	{ id: 'd2', stockItemId: getSiId('drink-soju', 'qc'), itemName: 'Soju (Original)',         qty: 6,    unit: 'bottles',   supplier: 'SM Trading',       notes: '',                    receivedAt: new Date(Date.now() - 3600000).toISOString(), usedQty: 0, depleted: false, batchNo: 'B-242', updatedAt: new Date().toISOString() },
	{ id: 'd3', stockItemId: getSiId('side-kimchi', 'qc'), itemName: 'Kimchi',                  qty: 10,   unit: 'portions',  supplier: 'Korean Foods PH',  notes: 'Checked freshness',   receivedAt: new Date(Date.now() - 7200000).toISOString(), usedQty: 5, depleted: false, batchNo: 'B-243', expiryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], updatedAt: new Date().toISOString() },
];

export const INITIAL_WASTE_ENTRIES: WasteEntry[] = [
	{ id: 'w1', stockItemId: getSiId('meat-pork-bones', 'qc'),  itemName: 'Pork Bones',            qty: 150, unit: 'g',        reason: 'Trimming (bone/fat)', loggedBy: 'Maria S.', loggedAt: new Date(Date.now() - 14400000).toISOString(), updatedAt: new Date().toISOString() },
	{ id: 'w2', stockItemId: getSiId('side-rice', 'qc'), itemName: 'Steamed Rice',          qty: 2,   unit: 'portions', reason: 'Overcooked',          loggedBy: 'Pedro C.', loggedAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString() },
	{ id: 'w3', stockItemId: getSiId('drink-soju', 'qc'), itemName: 'Soju (Original)',       qty: 1,   unit: 'bottles',  reason: 'Unusable (damaged)',  loggedBy: 'Maria S.', loggedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const INITIAL_DEDUCTIONS: Deduction[] = [];

export const INITIAL_STOCK_COUNTS: StockCount[] = INITIAL_STOCK_ITEMS.map(s => ({
	stockItemId: s.id,
	counted: {
		am10: getMorningCount(s.menuItemId),
		pm4: getAfternoonCount(s.menuItemId),
		pm10: null,
	},
	updatedAt: new Date().toISOString(),
}));

export const INITIAL_ADJUSTMENTS: StockAdjustment[] = [];

// ─── Reactive State (RxDB Stores) ─────────────────────────────────────────────

export const stockItems = createRxStore<StockItem>('stock_items', db => db.stock_items.find());
export const deliveries = createRxStore<Delivery>('deliveries', db => db.deliveries.find());
export const wasteEntries = createRxStore<WasteEntry>('waste', db => db.waste.find());
export const deductions = createRxStore<Deduction>('deductions', db => db.deductions.find());
export const stockCounts = createRxStore<StockCount>('stock_counts', db => db.stock_counts.find());
export const adjustments = createRxStore<StockAdjustment>('adjustments', db => db.adjustments.find());

export const countPeriods = $state<{ id: CountPeriod; label: string; time: string; status: 'done' | 'pending' }[]>([
	{ id: 'am10', label: 'Morning',   time: '10:00 AM', status: 'done' },
	{ id: 'pm4',  label: 'Afternoon', time: '4:00 PM',  status: 'done' },
	{ id: 'pm10', label: 'Evening',   time: '10:00 PM', status: 'pending' },
]);

/** Get the current stock for a stock item, computed reactively */
export function getCurrentStock(stockItemId: string): number {
	const item = stockItems.value.find(s => s.id === stockItemId);
	if (!item) return 0;
	const totalDelivered  = deliveries.value.filter(d => d.stockItemId === stockItemId).reduce((s, d) => s + d.qty, 0);
	const totalWasted     = wasteEntries.value.filter(w => w.stockItemId === stockItemId).reduce((s, w) => s + w.qty, 0);
	const totalDeducted   = deductions.value.filter(d => d.stockItemId === stockItemId).reduce((s, d) => s + d.qty, 0);
	const totalAdjAdded   = adjustments.value.filter(a => a.stockItemId === stockItemId && a.type === 'add').reduce((s, a) => s + a.qty, 0);
	const totalAdjDeducted = adjustments.value.filter(a => a.stockItemId === stockItemId && a.type === 'deduct').reduce((s, a) => s + a.qty, 0);
	return item.openingStock + totalDelivered - totalWasted - totalDeducted + totalAdjAdded - totalAdjDeducted;
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

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function receiveDelivery(stockItemId: string, itemName: string, qty: number, unit: string, supplier: string, notes: string = '', batchNo?: string, expiryDate?: string, photo?: string): Promise<{ success: boolean; error?: string; id?: string }> {
	if (!browser) return { success: false, error: 'Not in browser environment' };
	
	// Validate inputs
	if (!stockItemId || typeof stockItemId !== 'string') return { success: false, error: 'Invalid stock item ID' };
	if (!itemName || itemName.trim() === '') return { success: false, error: 'Item name is required' };
	if (typeof qty !== 'number' || isNaN(qty) || qty <= 0) return { success: false, error: 'Quantity must be a positive number' };
	if (qty > 999999999) return { success: false, error: 'Quantity exceeds maximum allowed' };
	if (!unit || unit.trim() === '') return { success: false, error: 'Unit is required' };
	if (!supplier || supplier.trim() === '') return { success: false, error: 'Supplier is required' };
	
	try {
		const db = await getDb();
		const id = nanoid();
		await db.deliveries.insert({
			id,
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
		const db = await getDb();
		const id = nanoid();
		await db.waste.insert({
			id,
			stockItemId,
			itemName: itemName.trim(),
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
		const db = await getDb();
		const id = nanoid();
		await db.adjustments.insert({
			id,
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
	
	const db = await getDb();
	
	try {
		// Re-check stock inside transaction to prevent race conditions
		const currentStock = getCurrentStock(item.id);
		const deductQty = Math.min(qty, currentStock); // Never deduct more than available
		
		if (deductQty <= 0) {
			console.warn(`[STOCK-DEDUCT] Insufficient stock for ${item.name}: have ${currentStock}, need ${qty}`);
			return;
		}
		
		// Insert deduction record
		await db.deductions.insert({
			id: nanoid(),
			stockItemId: item.id,
			qty: deductQty,
			tableId,
			orderId,
			timestamp: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

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
				const doc = await db.deliveries.findOne(d.id).exec();
				if (doc) {
					await doc.incrementalPatch({
						usedQty: newUsedQty,
						depleted: newUsedQty >= d.qty,
						updatedAt: new Date().toISOString(),
					});
				}
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
	const db = await getDb();
	const locId = locationId ?? session.locationId ?? 'qc';
	const item = stockItems.value.find(s => s.menuItemId === menuItemId && s.locationId === locId);
	if (!item) return;

	// 1. Find all deduction records for this order
	const matchingDeductions = deductions.value.filter(d => 
		d.stockItemId === item.id && d.orderId === orderId
	);
	if (matchingDeductions.length === 0) return;

	const totalRestoreQty = matchingDeductions.reduce((sum, d) => sum + d.qty, 0);

	// 2. Roll back FIFO usedQty in deliveries (Newest First)
	let remainingToRestore = totalRestoreQty;
	const itemDeliveries = [...deliveries.value]
		.filter(d => d.stockItemId === item.id && (d.usedQty || 0) > 0)
		.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

	for (const d of itemDeliveries) {
		const used = d.usedQty || 0;
		const restoreNow = Math.min(used, remainingToRestore);
		const newUsedQty = used - restoreNow;
		
		const dDoc = await db.deliveries.findOne(d.id).exec();
		if (dDoc) await dDoc.incrementalPatch({ usedQty: newUsedQty, depleted: false, updatedAt: new Date().toISOString() });

		remainingToRestore -= restoreNow;
		if (remainingToRestore <= 0) break;
	}

	// 3. Remove the deduction records
	for (const d of matchingDeductions) {
		await db.deductions.findOne(d.id).remove();
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
	const db = await getDb();
	const doc = await db.stock_counts.findOne({ selector: { stockItemId } }).exec();
	if (doc) {
		await doc.incrementalPatch({
			counted: { ...doc.counted, [period]: value },
			updatedAt: new Date().toISOString(),
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

export async function updateStockItem(id: string, updates: Partial<StockItem>) {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.stock_items.findOne(id).exec();
	if (doc) await doc.incrementalPatch({ ...updates, updatedAt: new Date().toISOString() });
}
