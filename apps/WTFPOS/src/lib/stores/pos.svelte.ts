/**
 * POS Global State — Svelte 5 Runes
 * State is mutated directly (fine in .svelte.ts with $state)
 */
import type { Table, Order, MenuItem, KdsTicket, TableZone, TableStatus, TakeoutStatus, SplitType, SubBill, PaymentMethod } from '$lib/types';
import { nanoid } from 'nanoid';
import { deductFromStock, restoreStock } from '$lib/stores/stock.svelte';
import { log } from '$lib/stores/audit.svelte';
import { session, isWarehouseSession } from '$lib/stores/session.svelte';
import { createRxStore } from '$lib/stores/sync.svelte';
import { getDb } from '$lib/db';
import { browser } from '$app/environment';

const SESSION_SECONDS = 90 * 60;

// ─── Mock Table Layout — matching POS DESIGN.pen floor zones ─────────────────

const FLOOR_POSITIONS = [
	{ x: 40,  y: 50  }, { x: 200, y: 35  }, { x: 360, y: 52  }, { x: 520, y: 38  },
	{ x: 45,  y: 205 }, { x: 205, y: 195 }, { x: 368, y: 212 }, { x: 528, y: 198 },
	{ x: 60,  y: 355 }, { x: 215, y: 345 }, { x: 375, y: 360 }, { x: 535, y: 348 },
];

function makeTables(): Table[] {
	// Helper to generate tables for a specific location
	const gen = (locationId: string, prefix: string) => [
		// Main Dining
		...Array.from({ length: 8 }, (_, i) => ({
			id: `${prefix}-T${i + 1}`, locationId, number: i + 1, label: `T${i + 1}`, zone: 'main' as TableZone, capacity: i < 6 ? 4 : 2, 
			x: FLOOR_POSITIONS[i]?.x ?? (i % 4) * 155 + 40,
			y: FLOOR_POSITIONS[i]?.y ?? Math.floor(i / 4) * 155 + 40,
			width: 92, height: 92,
			status: 'available' as const, sessionStartedAt: null, elapsedSeconds: null, currentOrderId: null, billTotal: null
		}))
	];
	return [...gen('qc', 'QC'), ...gen('mkti', 'MK')];
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export const INITIAL_MENU_ITEMS: MenuItem[] = [
	{ id: 'pkg-pork',    name: '🐷 Unli Pork',         category: 'packages', price: 499,  isWeightBased: false, available: true, desc: 'All-you-can-eat pork grill',    perks: '4 sides, 200g initial meats', meats: ['meat-samgyup', 'meat-chadol', 'meat-pork-sliced'], autoSides: ['side-kimchi', 'side-rice'] },
	{ id: 'pkg-beef',    name: '🐄 Unli Beef',         category: 'packages', price: 699,  isWeightBased: false, available: true, desc: 'All-you-can-eat beef grill',    perks: '5 sides, 250g initial meats', meats: ['meat-galbi', 'meat-beef', 'meat-beef-sliced'], autoSides: ['side-kimchi', 'side-rice'] },
	{ id: 'pkg-combo',   name: '🔥 Unli Pork & Beef',  category: 'packages', price: 899,  isWeightBased: false, available: true, desc: 'Premium pork + beef combo',    perks: '6 sides, 300g initial meats', meats: ['meat-samgyup', 'meat-chadol', 'meat-pork-sliced', 'meat-galbi', 'meat-beef', 'meat-beef-sliced'], autoSides: ['side-kimchi', 'side-rice'] },
	{ id: 'meat-samgyup',     name: 'Samgyupsal',          category: 'meats', protein: 'pork', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 0.65 },
	{ id: 'meat-chadol',      name: 'Chadolbaegi',         category: 'meats', protein: 'pork', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 0.75 },
	{ id: 'meat-pork-sliced', name: 'Pork Sliced',         category: 'meats', protein: 'pork', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 0.70 },
	{ id: 'meat-galbi',       name: 'Galbi',               category: 'meats', protein: 'beef', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 0.90 },
	{ id: 'meat-beef',        name: 'US Beef Belly',       category: 'meats', protein: 'beef', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 1.20 },
	{ id: 'meat-beef-sliced', name: 'Beef Sliced',         category: 'meats', protein: 'beef', price: 0,    isWeightBased: true,  available: true, trackInventory: true, pricePerGram: 1.10 },
	{ id: 'side-kimchi', name: 'Kimchi',                category: 'sides',    price: 0,    isWeightBased: false, available: true, isFree: true },
	{ id: 'side-japchae',name: 'Japchae',               category: 'sides',    price: 120,  isWeightBased: false, available: true },
	{ id: 'side-rice',   name: 'Steamed Rice',          category: 'sides',    price: 35,   isWeightBased: false, available: true },
	{ id: 'dish-jjigae', name: 'Doenjang Jjigae',       category: 'dishes',   price: 120,  isWeightBased: false, available: true },
	{ id: 'dish-bibim',  name: 'Bibimbap',              category: 'dishes',   price: 150,  isWeightBased: false, available: true },
	{ id: 'drink-soju',  name: 'Soju (Original)',       category: 'drinks',   price: 95,   isWeightBased: false, available: true },
	{ id: 'drink-beer',  name: 'San Miguel Beer',       category: 'drinks',   price: 75,   isWeightBased: false, available: true },
	{ id: 'drink-tea',   name: 'Iced Tea',              category: 'drinks',   price: 65,   isWeightBased: false, available: true },
	{ id: 'ret-123456',  name: 'Bottled Water',         category: 'drinks',   price: 40,   isWeightBased: false, available: true, isRetail: true }
];

const _menuItems = createRxStore<MenuItem>('menu_items', db => db.menu_items.find());

export const menuItems = {
	get value(): MenuItem[] {
		return _menuItems.value;
	}
};

// ─── Menu CRUD (owner/admin only) ────────────────────────────────────────────

export async function addMenuItem(item: Omit<MenuItem, 'id'>): Promise<string> {
	if (!browser) return '';
	const id = `menu-${nanoid(8)}`;
	const db = await getDb();
	await db.menu_items.insert({ ...item, id });
	log.menuItemCreated(item.name, item.category);
	return id;
}

export async function updateMenuItem(id: string, updates: Partial<Omit<MenuItem, 'id'>>): Promise<void> {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.menu_items.findOne(id).exec();
	if (!doc) return;
	const oldName = doc.name;
	await doc.patch(updates);
	log.menuItemUpdated(oldName, Object.keys(updates).join(', '));
}

export async function deleteMenuItem(id: string): Promise<void> {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.menu_items.findOne(id).exec();
	if (!doc) return;
	const name = doc.name;
	await doc.remove();
	log.menuItemDeleted(name);
}

export async function toggleMenuItemAvailability(id: string): Promise<void> {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.menu_items.findOne(id).exec();
	if (!doc) return;
	const newAvailable = !doc.available;
	await doc.patch({ available: newAvailable });
	log.menuItemToggled(doc.name, newAvailable);
}

// ─── Reactive State ───────────────────────────────────────────────────────────

export const tables = $state<Table[]>(makeTables());
export const orders = $state<Order[]>([]);
export const kdsTickets = $state<KdsTicket[]>([]);

// KDS ticket history — bumped tickets stored for recall
export interface KdsHistoryEntry extends KdsTicket {
	bumpedAt: string;
	bumpedBy: string;
}
export const kdsTicketHistory = $state<KdsHistoryEntry[]>([]);

// ─── Table Actions ────────────────────────────────────────────────────────────

export function openTable(tableId: string, pax: number = 4, packageName?: string): string {
	// Warehouse locations have no tables — guard against accidental calls
	if (isWarehouseSession()) return '';
	const table = tables.find((t) => t.id === tableId);
	if (!table || table.status !== 'available') return table?.currentOrderId ?? '';
	const orderId = nanoid();
	table.status = 'occupied';
	table.sessionStartedAt = new Date().toISOString();
	table.elapsedSeconds = 0;
	table.currentOrderId = orderId;
	table.billTotal = 0;
	orders.push({ id: orderId, locationId: table.locationId, orderType: 'dine-in', tableId, tableNumber: table.number, packageName: packageName ?? null, packageId: null, pax, items: [], status: 'open', discountType: 'none', subtotal: 0, discountAmount: 0, vatAmount: 0, total: 0, payments: [], createdAt: new Date().toISOString(), closedAt: null, billPrinted: false, notes: '' });
	log.tableOpened(table.label, packageName ?? null, pax);
	return orderId;
}

export function createTakeoutOrder(customerName: string = 'Walk-in'): string {
	const orderId = nanoid();
	orders.push({
		id: orderId,
		locationId: (session.locationId === 'all' || session.locationId === 'wh-qc') ? 'qc' : session.locationId,
		orderType: 'takeout',
		customerName,
		tableId: null,
		tableNumber: null,
		packageName: null,
		packageId: null,
		pax: 1,
		items: [],
		status: 'open',
		discountType: 'none',
		subtotal: 0, discountAmount: 0, vatAmount: 0, total: 0,
		payments: [],
		createdAt: new Date().toISOString(),
		closedAt: null,
		billPrinted: false,
		notes: '',
		takeoutStatus: 'new',
	});
	log.tableOpened(`Takeout (${customerName})`, null, 1);
	return orderId;
}

export function closeTable(tableId: string) {
	const table = tables.find((t) => t.id === tableId);
	if (!table) return;
	// Audit logging is handled by the caller (confirmCheckout) which has payment context
	table.status = 'available';
	table.sessionStartedAt = null;
	table.elapsedSeconds = null;
	table.currentOrderId = null;
	table.billTotal = null;
}

export function printBill(orderId: string) {
	const order = orders.find(o => o.id === orderId);
	if (!order) return;
	order.billPrinted = true;
	if (order.tableId) {
		const t = tables.find(t => t.id === order.tableId);
		if (t) {
			t.status = 'billing';
		}
	}
}

export function setTableMaintenance(tableId: string, isMaintenance: boolean) {
	const table = tables.find(t => t.id === tableId);
	if (!table) return;
	if (isMaintenance && table.status !== 'available') return; // Can only mark empty tables
	table.status = isMaintenance ? 'maintenance' : 'available';
	log.tableMaintenanceToggled(table.label, isMaintenance);
}

export function tickTimers() {
	for (const table of tables) {
		if (table.status === 'available' || table.status === 'maintenance' || table.elapsedSeconds === null) continue;
		table.elapsedSeconds += 1;

		// Only update status based on timer if not in billing or critical locked states
		// billing = waiting for payment, should not revert to occupied/warning
		const lockedStatuses: TableStatus[] = ['billing', 'maintenance'];
		if (!lockedStatuses.includes(table.status)) {
			const oldStatus = table.status;
			if (table.elapsedSeconds >= SESSION_SECONDS - (5 * 60)) table.status = 'critical';
			else if (table.elapsedSeconds >= SESSION_SECONDS - (15 * 60)) table.status = 'warning';
			else table.status = 'occupied';
			if (oldStatus !== table.status) {
				console.log(`[TIMER] Table ${table.label}: ${oldStatus} -> ${table.status} (${table.elapsedSeconds}s elapsed)`);
			}
		}
	}
}

export function updateTableLayout(tableUpdates: Pick<Table, 'id' | 'x' | 'y' | 'width' | 'height'>[]) {
	for (const update of tableUpdates) {
		const t = tables.find(t => t.id === update.id);
		if (t) {
			t.x = update.x;
			t.y = update.y;
			if (update.width !== undefined) t.width = update.width;
			if (update.height !== undefined) t.height = update.height;
		}
	}
}

export function addTable(locationId: string, label: string, capacity: number, x: number, y: number) {
	const number = tables.filter(t => t.locationId === locationId).length + 1;
	const id = `${locationId === 'qc' ? 'QC' : 'MK'}-T${number}-${nanoid(4)}`;
	tables.push({
		id, locationId, number, label, zone: 'main', capacity,
		x, y, width: 92, height: 92,
		status: 'available', sessionStartedAt: null, elapsedSeconds: null, currentOrderId: null, billTotal: null
	});
}

export function deleteTable(tableId: string) {
	const index = tables.findIndex(t => t.id === tableId);
	if (index !== -1) {
		tables.splice(index, 1);
	}
}

// ─── Pending Payment Hold ────────────────────────────────────────────────────

export function holdPayment(orderId: string, method: 'gcash' | 'maya') {
	const order = orders.find(o => o.id === orderId);
	if (!order || order.status !== 'open') return;
	order.status = 'pending_payment';
	order.pendingPaymentMethod = method;
	const label = order.tableId
		? (tables.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.paymentHeld(label);
}

export function confirmHeldPayment(orderId: string) {
	const order = orders.find(o => o.id === orderId);
	if (!order || order.status !== 'pending_payment') return;
	const method = order.pendingPaymentMethod ?? 'gcash';
	order.payments.push({ method, amount: order.total });
	order.status = 'paid';
	order.closedAt = new Date().toISOString();
	order.closedBy = session.userName || 'Staff';
	const label = order.tableId
		? (tables.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	// Capture duration before closeTable() clears it (Fix 3)
	const capturedElapsed = order.tableId
		? (tables.find(t => t.id === order.tableId)?.elapsedSeconds ?? null)
		: null;
	if (order.tableId) closeTable(order.tableId);
	log.paymentConfirmed(label, order.total, method === 'gcash' ? 'GCash' : 'Maya');
	log.tableClosed(label, order.total, method === 'gcash' ? 'GCash' : 'Maya', capturedElapsed ?? undefined);
}

export function cancelHeldPayment(orderId: string) {
	const order = orders.find(o => o.id === orderId);
	if (!order || order.status !== 'pending_payment') return;
	order.status = 'open';
	order.pendingPaymentMethod = undefined;
	const label = order.tableId
		? (tables.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.paymentCancelled(label);
}

// ─── Order Actions ────────────────────────────────────────────────────────────

export function getOrder(orderId: string) { return orders.find((o) => o.id === orderId); }

export function addItemToOrder(orderId: string, item: MenuItem, qty: number, weight?: number, forceFree: boolean = false, notes?: string) {
	const order = orders.find((o) => o.id === orderId);
	if (!order) return;

	if (item.category === 'packages') {
		order.packageId = item.id;
		order.packageName = item.name;
	}

	const isFree = item.category === 'meats' || item.isFree || forceFree;
	const unitPrice = isFree ? 0 : (item.category === 'packages' ? item.price * order.pax : (item.isWeightBased ? Math.round((weight ?? 0) * (item.pricePerGram ?? 0)) : item.price));
	const tag: 'PKG' | 'FREE' | null = isFree ? 'FREE' : (item.category === 'packages' ? 'PKG' : null);

	const newItem = { id: nanoid(), menuItemId: item.id, menuItemName: item.name, quantity: qty, unitPrice, weight: weight ?? null, status: 'pending' as const, sentAt: null, tag, notes };
	order.items.push(newItem);
	recalcOrder(order);
	const table = tables.find((t) => t.id === order.tableId);
	if (table) table.billTotal = order.total;

	// Auto-deduct from stock
	const deductQty = item.isWeightBased ? (weight ?? 0) : qty;
	if (deductQty > 0) deductFromStock(item.id, deductQty, order.tableId ?? 'takeout', order.id, item.trackInventory ?? false);

	// Audit log
	const tableLabel = order.tableId ? (tables.find(t => t.id === order.tableId)?.label ?? order.tableId) : 'Takeout';
	log.itemCharged(item.name, tableLabel, weight ?? null, qty);
	const ticket = kdsTickets.find((t) => t.orderId === orderId);
	const kdsItem = { id: newItem.id, menuItemName: item.name, quantity: qty, status: 'pending' as const, weight, category: item.category, notes };
	if (ticket) ticket.items.push(kdsItem);
	else kdsTickets.push({ orderId, tableNumber: order.tableNumber, customerName: order.customerName, items: [kdsItem], createdAt: new Date().toISOString() });
}

export function recalcOrder(order: Order) {
	const sub  = order.items.filter((i) => i.status !== 'cancelled' && i.tag !== 'FREE').reduce((s, i) => s + i.unitPrice * i.quantity, 0);
	let disc = 0;
	if (order.discountType === 'senior' || order.discountType === 'pwd') {
		const qualifyingPax = order.discountPax ?? order.pax;
		const totalPax = order.pax > 0 ? order.pax : 1;
		disc = Math.round(sub * (qualifyingPax / totalPax) * 0.2);
		console.log(`[RECALC] SC/PWD discount: qualifyingPax=${qualifyingPax}, totalPax=${totalPax}, disc=${disc}`);
	}
	else if (order.discountType === 'comp' || order.discountType === 'service_recovery' || order.discountType === 'promo') {
		disc = sub;
		console.log(`[RECALC] Full write-off discount: ${disc}`);
	}

	const net  = sub - disc;
	// PH law (RA 9994 / RA 7277): SC/PWD discount is applied on the VAT-exclusive price;
	// the 12% VAT on the discounted amount is also removed (customer pays zero VAT).
	// For normal orders, prices are VAT-inclusive — extract VAT from the total.
	const vat  = order.discountType !== 'none' && order.discountType !== 'promo' && order.discountType !== 'comp' && order.discountType !== 'service_recovery'
		? 0                                        // SC/PWD: VAT-exempt
		: Math.round(net - net / 1.12);            // Normal/Promos/Comp: VAT already embedded in price

	order.subtotal = sub; order.discountAmount = disc; order.vatAmount = vat; order.total = net;
	console.log(`[RECALC] subtotal=${sub}, discount=${disc}, vat=${vat}, total=${net}`);
}

export function voidOrder(orderId: string, reason?: 'mistake' | 'walkout' | 'write_off') {
	console.log(`[VOID-ORDER] Starting void for order=${orderId.slice(-6)}, reason=${reason}`);
	const order = orders.find(o => o.id === orderId);
	if (!order || order.status === 'paid' || order.status === 'cancelled') {
		console.warn(`[VOID-ORDER] ABORTED: Order not found or already closed (status=${order?.status})`);
		return;
	}
	
	// BUG: Stock is NOT being restored here!
	console.log(`[VOID-ORDER] Order has ${order.items.length} items, checking stock restoration needs...`);
	for (const item of order.items) {
		if (item.status !== 'cancelled') {
			console.log(`[VOID-ORDER] Item ${item.menuItemName} (qty=${item.quantity}, weight=${item.weight}) needs stock restoration`);
			const restoreQty = item.weight ?? item.quantity;
			if (restoreQty > 0) {
				restoreStock(item.menuItemId, restoreQty, order.tableId ?? 'takeout', order.id);
			}
			item.status = 'cancelled';
		}
	}
	
	order.status = 'cancelled';
	if (reason) order.cancelReason = reason;
	order.closedAt = new Date().toISOString();
	// Reset takeout status when voided
	if (order.orderType === 'takeout') {
		order.takeoutStatus = 'new';
	}
	// Capture elapsed seconds before closeTable() clears it (Fix 3)
	let capturedElapsed: number | null = null;
	if (order.tableId) {
		const table = tables.find(t => t.id === order.tableId);
		if (table) {
			capturedElapsed = table.elapsedSeconds;
			table.status = 'available';
			table.sessionStartedAt = null;
			table.elapsedSeconds = null;
			table.currentOrderId = null;
			table.billTotal = null;
		}
	}
	const label = order.tableId
		? (tables.find(t => t.id === order.tableId)?.label ?? order.tableId)
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	// Zero-value cancellation: no chargeable items were ever added (Fix 4)
	const isZeroValue = order.subtotal === 0;
	if (isZeroValue) {
		log.zeroValueCancellation(label, reason, capturedElapsed ?? undefined);
	} else {
		log.tableClosed(label, 0, `VOID (${reason ?? 'unknown'})`, capturedElapsed ?? undefined);
	}
}

export function markItemServed(orderId: string, itemId: string) {
	const t = kdsTickets.find((t) => t.orderId === orderId);
	if (t) {
		const i = t.items.find((i) => i.id === itemId);
		if (i) { i.status = 'served'; log.itemServed(i.menuItemName, t.tableNumber); }
		// Auto-archive to history when all items in the ticket are served/cancelled
		const active = t.items.filter(it => it.status !== 'cancelled');
		if (active.length > 0 && active.every(it => it.status === 'served')) {
			kdsTicketHistory.unshift({
				...structuredClone(t),
				bumpedAt: new Date().toISOString(),
				bumpedBy: session.userName || 'Staff',
			});
		}
	}
	const o = orders.find((o) => o.id === orderId);
	if (o) {
		const i = o.items.find((i) => i.id === itemId);
		if (i) i.status = 'served';
		// Auto-advance takeout to 'ready' when all items served
		if (o.orderType === 'takeout' && o.takeoutStatus === 'preparing') {
			const active = o.items.filter(it => it.status !== 'cancelled');
			if (active.length > 0 && active.every(it => it.status === 'served')) {
				o.takeoutStatus = 'ready';
				log.takeoutAdvanced(o.customerName ?? 'Walk-in', 'ready');
			}
		}
	}
}

/**
 * Reject an order item from KDS (kitchen refusal) - marks item as cancelled
 * and recalculates the order total
 */
export function rejectOrderItem(orderId: string, itemId: string): boolean {
	const order = orders.find(o => o.id === orderId);
	if (!order) return false;
	
	const item = order.items.find(i => i.id === itemId);
	if (!item || item.status === 'cancelled') return false;
	
	// Mark as cancelled
	item.status = 'cancelled';
	
	// Sync with KDS and restore stock
	const ticket = kdsTickets.find(t => t.orderId === orderId);
	if (ticket) {
		const kdsItem = ticket.items.find(i => i.id === itemId);
		if (kdsItem) kdsItem.status = 'cancelled';
	}
	const restoreQty = item.weight ?? item.quantity;
	if (restoreQty > 0) {
		restoreStock(item.menuItemId, restoreQty, order.tableId ?? 'takeout', order.id);
	}
	
	// Recalculate order totals
	recalcOrder(order);
	
	// Update table bill total
	const table = tables.find(t => t.id === order.tableId);
	if (table) {
		table.billTotal = order.total;
	}
	
	return true;
}

export function recallTicket(orderId: string) {
	const histIdx = kdsTicketHistory.findIndex(h => h.orderId === orderId);
	if (histIdx === -1) return;
	const entry = kdsTicketHistory[histIdx];
	// Restore items to 'pending' in the KDS ticket
	const ticket = kdsTickets.find(t => t.orderId === orderId);
	if (ticket) {
		for (const item of ticket.items) {
			if (item.status === 'served') item.status = 'pending';
		}
	}
	// Also restore in the actual order
	const order = orders.find(o => o.id === orderId);
	if (order) {
		for (const item of order.items) {
			if (item.status === 'served') item.status = 'pending';
		}
	}
	kdsTicketHistory.splice(histIdx, 1);
	log.kdsTicketRecalled(entry.tableNumber);
}

export function recallLastTicket() {
	if (kdsTicketHistory.length === 0) return;
	recallTicket(kdsTicketHistory[0].orderId);
}

// ─── Pax Change (Late Joiner) ────────────────────────────────────────────────

export function changePax(orderId: string, newPax: number) {
	const order = orders.find(o => o.id === orderId);
	if (!order || order.status !== 'open' || newPax < 1) return;
	const oldPax = order.pax;
	if (newPax === oldPax) return;
	if (!order.originalPax) order.originalPax = oldPax;
	order.pax = newPax;

	// If order has a package, update the PKG line item quantity (price is per-pax)
	if (order.packageId) {
		const pkgItem = order.items.find(i => i.menuItemId === order.packageId && i.tag === 'PKG');
		if (pkgItem) {
			pkgItem.quantity = newPax;
		}
		recalcOrder(order);
		const table = tables.find(t => t.id === order.tableId);
		if (table) table.billTotal = order.total;
	}

	const tableLabel = order.tableId
		? (tables.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.paxChanged(tableLabel, oldPax, newPax);
}

// ─── Leftover Penalty ────────────────────────────────────────────────────────

export function applyLeftoverPenalty(orderId: string, weightGrams: number, ratePerHundredGrams: number = 50) {
	const order = orders.find(o => o.id === orderId);
	if (!order || weightGrams <= 0) return;
	const penalty = Math.ceil(weightGrams / 100) * ratePerHundredGrams;
	order.leftoverPenaltyAmount = penalty;
	order.items.push({
		id: nanoid(), menuItemId: 'penalty-leftover', menuItemName: 'Leftover Penalty',
		quantity: 1, unitPrice: penalty, weight: weightGrams, status: 'served', sentAt: null, tag: null,
		notes: `${weightGrams}g leftover @ ₱${ratePerHundredGrams}/100g`
	});
	recalcOrder(order);
	const table = tables.find(t => t.id === order.tableId);
	if (table) table.billTotal = order.total;
	const label = order.tableId
		? (tables.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.leftoverPenaltyApplied(label, weightGrams, penalty);
}

export function waiveLeftoverPenalty(orderId: string) {
	const order = orders.find(o => o.id === orderId);
	if (!order) return;
	const idx = order.items.findIndex(i => i.menuItemId === 'penalty-leftover');
	if (idx !== -1) order.items.splice(idx, 1);
	order.leftoverPenaltyAmount = undefined;
	recalcOrder(order);
	const table = tables.find(t => t.id === order.tableId);
	if (table) table.billTotal = order.total;
	const label = order.tableId
		? (tables.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.leftoverPenaltyWaived(label);
}

// ─── Takeout Lifecycle ───────────────────────────────────────────────────────

export function advanceTakeoutStatus(orderId: string): void {
	const order = orders.find(o => o.id === orderId);
	if (!order || order.orderType !== 'takeout') return;
	const progression: Record<TakeoutStatus, TakeoutStatus | null> = {
		'new': 'preparing',
		'preparing': 'ready',
		'ready': 'picked_up',
		'picked_up': null
	};
	const current = order.takeoutStatus ?? 'new';
	const next = progression[current];
	if (next) {
		order.takeoutStatus = next;
		log.takeoutAdvanced(order.customerName ?? 'Walk-in', next);
	}
}

export function setTakeoutStatus(orderId: string, status: TakeoutStatus): void {
	const order = orders.find(o => o.id === orderId);
	if (!order || order.orderType !== 'takeout') return;
	order.takeoutStatus = status;
	log.takeoutAdvanced(order.customerName ?? 'Walk-in', status);
}

// ─── Table Transfer ──────────────────────────────────────────────────────────

export function transferTable(fromTableId: string, toTableId: string): boolean {
	const fromTable = tables.find(t => t.id === fromTableId);
	const toTable = tables.find(t => t.id === toTableId);
	if (!fromTable || !toTable) return false;
	if (toTable.status !== 'available') return false;
	if (!fromTable.currentOrderId) return false;
	if (fromTable.locationId !== toTable.locationId) return false;

	const order = orders.find(o => o.id === fromTable.currentOrderId);
	if (!order) return false;

	// Transfer table state
	toTable.status = fromTable.status;
	toTable.sessionStartedAt = fromTable.sessionStartedAt;
	toTable.elapsedSeconds = fromTable.elapsedSeconds;
	toTable.currentOrderId = fromTable.currentOrderId;
	toTable.billTotal = fromTable.billTotal;

	// Update order reference
	order.tableId = toTable.id;
	order.tableNumber = toTable.number;

	// Update KDS ticket
	const ticket = kdsTickets.find(t => t.orderId === order.id);
	if (ticket) ticket.tableNumber = toTable.number;

	// Reset source table
	fromTable.status = 'available';
	fromTable.sessionStartedAt = null;
	fromTable.elapsedSeconds = null;
	fromTable.currentOrderId = null;
	fromTable.billTotal = null;

	log.tableTransferred(fromTable.label, toTable.label);
	return true;
}

// ─── Table Merge ─────────────────────────────────────────────────────────────

export function mergeTables(primaryTableId: string, secondaryTableId: string): {
	success: boolean;
	error?: string;
	primaryOrderId?: string;
} {
	const primaryTable = tables.find(t => t.id === primaryTableId);
	const secondaryTable = tables.find(t => t.id === secondaryTableId);

	if (!primaryTable || !secondaryTable) {
		return { success: false, error: 'One or both tables not found' };
	}

	if (primaryTable.locationId !== secondaryTable.locationId) {
		return { success: false, error: 'Tables must be in the same location' };
	}

	if (!primaryTable.currentOrderId || !secondaryTable.currentOrderId) {
		return { success: false, error: 'Both tables must have active orders' };
	}

	const primaryOrder = orders.find(o => o.id === primaryTable.currentOrderId);
	const secondaryOrder = orders.find(o => o.id === secondaryTable.currentOrderId);

	if (!primaryOrder || !secondaryOrder) {
		return { success: false, error: 'Could not find orders for both tables' };
	}

	if (primaryOrder.status !== 'open' || secondaryOrder.status !== 'open') {
		return { success: false, error: 'Both orders must be open' };
	}

	// Handle different packages - keep the primary table's package
	// Add a note about the package difference if they differ
	if (secondaryOrder.packageId && secondaryOrder.packageId !== primaryOrder.packageId) {
		// Add package items from secondary order as individual items
		// They will be marked as 'FREE' if they were meats
		const secondaryPkgItems = secondaryOrder.items.filter(i => 
			i.tag === 'PKG' || (i.tag === 'FREE' && secondaryOrder.packageId && 
			menuItems.value.find(m => m.id === secondaryOrder.packageId)?.meats?.includes(i.menuItemId))
		);
		
		for (const item of secondaryPkgItems) {
			const menuItem = menuItems.value.find(m => m.id === item.menuItemId);
			if (menuItem) {
				// Add as individual item (not part of primary package)
				primaryOrder.items.push({
					...item,
					id: nanoid(), // New ID for the merged item
					tag: null, // Not part of primary package
					unitPrice: menuItem.price, // Charge at menu price
					notes: item.notes ? `${item.notes} (from ${secondaryTable.label})` : `Added from ${secondaryTable.label}`
				});
			}
		}
	}

	// Merge all non-package items from secondary order
	const secondaryItems = secondaryOrder.items.filter(i => 
		i.tag !== 'PKG' && !(i.tag === 'FREE' && secondaryOrder.packageId)
	);

	for (const item of secondaryItems) {
		primaryOrder.items.push({
			...item,
			id: nanoid(), // New ID for the merged item
			notes: item.notes ? `${item.notes} (from ${secondaryTable.label})` : `Added from ${secondaryTable.label}`
			});
	}

	// Update pax (add secondary table's pax)
	const combinedPax = primaryOrder.pax + secondaryOrder.pax;
	primaryOrder.pax = combinedPax;

	// If primary has package, update package quantity
	if (primaryOrder.packageId) {
		const pkgItem = primaryOrder.items.find(i => 
			i.menuItemId === primaryOrder.packageId && i.tag === 'PKG'
		);
		if (pkgItem) {
			pkgItem.quantity = combinedPax;
		}
	}

	// Recalculate totals
	recalcOrder(primaryOrder);
	primaryTable.billTotal = primaryOrder.total;

	// Merge KDS tickets
	const primaryTicket = kdsTickets.find(t => t.orderId === primaryOrder.id);
	const secondaryTicket = kdsTickets.find(t => t.orderId === secondaryOrder.id);

	if (primaryTicket && secondaryTicket) {
		// Add non-cancelled items from secondary ticket
		const itemsToMerge = secondaryTicket.items.filter(i => i.status !== 'cancelled');
		primaryTicket.items.push(...itemsToMerge.map(i => ({ ...i, id: nanoid() })));
		
		// Remove secondary ticket
		const secondaryTicketIndex = kdsTickets.findIndex(t => t.orderId === secondaryOrder.id);
		if (secondaryTicketIndex !== -1) {
			kdsTickets.splice(secondaryTicketIndex, 1);
		}
	}

	// Close secondary order (mark as cancelled with merge reason)
	secondaryOrder.status = 'cancelled';
	secondaryOrder.closedAt = new Date().toISOString();
	secondaryOrder.notes = `Merged into ${primaryTable.label}`;
	
	// Reset secondary table
	secondaryTable.status = 'available';
	secondaryTable.sessionStartedAt = null;
	secondaryTable.elapsedSeconds = null;
	secondaryTable.currentOrderId = null;
	secondaryTable.billTotal = null;

	log.tableClosed(secondaryTable.label, 0, `MERGED into ${primaryTable.label}`);

	return { success: true, primaryOrderId: primaryOrder.id };
}

// ─── Package Change ──────────────────────────────────────────────────────────

export function changePackage(orderId: string, newPackageId: string): {
	success: boolean;
	priceDiff: number;
	direction: 'upgrade' | 'downgrade' | 'same';
} {
	const order = orders.find(o => o.id === orderId);
	if (!order || !order.packageId) return { success: false, priceDiff: 0, direction: 'same' };

	const oldPkg = menuItems.value.find(m => m.id === order.packageId);
	const newPkg = menuItems.value.find(m => m.id === newPackageId);
	if (!oldPkg || !newPkg || newPkg.category !== 'packages') return { success: false, priceDiff: 0, direction: 'same' };

	const oldPriceTotal = oldPkg.price * order.pax;
	const newPriceTotal = newPkg.price * order.pax;
	const priceDiff = newPriceTotal - oldPriceTotal;
	const direction = priceDiff > 0 ? 'upgrade' as const : priceDiff < 0 ? 'downgrade' as const : 'same' as const;

	// Update the package line item in the order
	const pkgItem = order.items.find(i => i.menuItemId === order.packageId && i.tag === 'PKG');
	if (pkgItem) {
		pkgItem.menuItemId = newPkg.id;
		pkgItem.menuItemName = newPkg.name;
		pkgItem.unitPrice = newPkg.price;
	}

	// Update order metadata
	order.packageId = newPkg.id;
	order.packageName = newPkg.name;

	// Recalculate totals
	recalcOrder(order);
	const table = tables.find(t => t.id === order.tableId);
	if (table) table.billTotal = order.total;

	log.packageChanged(
		table?.label ?? 'Takeout',
		oldPkg.name,
		newPkg.name,
		direction,
		Math.abs(priceDiff)
	);

	return { success: true, priceDiff, direction };
}

// ─── Split Bill ──────────────────────────────────────────────────────────────

export function initEqualSplit(orderId: string, splitCount: number): void {
	console.log(`[SPLIT-BILL] initEqualSplit called: orderId=${orderId.slice(-6)}, splitCount=${splitCount}`);
	const order = orders.find(o => o.id === orderId);
	if (!order || order.total <= 0 || splitCount <= 0 || splitCount > 100 || order.total < splitCount) {
		console.warn(`[SPLIT-BILL] ABORTED: order=${!!order}, total=${order?.total}, splitCount=${splitCount}`);
		return;
	}
	// BUG: Division could have remainder issues with certain totals
	if (order.total < splitCount) {
		console.warn(`[SPLIT-BILL] WARNING: Total (${order.total}) < splitCount (${splitCount})`);
	}

	order.splitType = 'equal';
	const perPerson = Math.floor(order.total / splitCount);
	console.log(`[SPLIT-BILL] perPerson=${perPerson}, remainder will be on last guest`);
	const remainder = order.total - perPerson * (splitCount - 1);

	order.subBills = Array.from({ length: splitCount }, (_, i) => ({
		id: nanoid(),
		label: `Guest ${i + 1}`,
		itemIds: [],
		subtotal: i === splitCount - 1 ? remainder : perPerson,
		discountAmount: 0,
		vatAmount: 0,
		total: i === splitCount - 1 ? remainder : perPerson,
		payment: null,
		paidAt: null
	}));

	const tableLabel = order.tableId ? (tables.find(t => t.id === order.tableId)?.label ?? '') : `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.splitInitiated(tableLabel, 'equal', splitCount);
}

export function initItemSplit(orderId: string, splitCount: number): void {
	const order = orders.find(o => o.id === orderId);
	if (!order) return;

	order.splitType = 'by-item';
	order.subBills = Array.from({ length: splitCount }, (_, i) => ({
		id: nanoid(),
		label: `Guest ${i + 1}`,
		itemIds: [],
		subtotal: 0, discountAmount: 0, vatAmount: 0, total: 0,
		payment: null, paidAt: null
	}));

	const tableLabel = order.tableId ? (tables.find(t => t.id === order.tableId)?.label ?? '') : `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.splitInitiated(tableLabel, 'by-item', splitCount);
}

export function assignItemToSubBill(orderId: string, itemId: string, subBillId: string): void {
	const order = orders.find(o => o.id === orderId);
	if (!order || !order.subBills) return;

	// Remove from any existing sub-bill
	for (const sb of order.subBills) {
		sb.itemIds = sb.itemIds.filter(id => id !== itemId);
	}

	// Add to target sub-bill
	const target = order.subBills.find(sb => sb.id === subBillId);
	if (target) {
		target.itemIds.push(itemId);
	}

	recalcSubBills(order);
}

export function recalcSubBills(order: Order): void {
	if (!order.subBills || order.splitType !== 'by-item') return;
	for (const sb of order.subBills) {
		const items = order.items.filter(i => sb.itemIds.includes(i.id) && i.status !== 'cancelled' && i.tag !== 'FREE');
		sb.subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
		if ((order.discountType === 'senior' || order.discountType === 'pwd') && order.subtotal > 0) {
			const qualifyingPax = order.discountPax ?? order.pax;
			const totalPax = order.pax > 0 ? order.pax : 1;
			sb.discountAmount = Math.round(sb.subtotal * (qualifyingPax / totalPax) * 0.2);
			sb.vatAmount = 0; // SC/PWD: VAT-exempt on qualifying portion
		} else if ((order.discountType === 'comp' || order.discountType === 'service_recovery' || order.discountType === 'promo') && order.subtotal > 0) {
			sb.discountAmount = sb.subtotal; // full write-off
			sb.vatAmount = 0;
		} else {
			sb.discountAmount = 0;
			sb.vatAmount = Math.round(sb.subtotal - sb.subtotal / 1.12);
		}
		sb.total = sb.subtotal - sb.discountAmount;
	}
}

export function paySubBill(orderId: string, subBillId: string, method: PaymentMethod, amount: number): void {
	const order = orders.find(o => o.id === orderId);
	if (!order || !order.subBills) return;

	const sb = order.subBills.find(s => s.id === subBillId);
	if (!sb) return;

	sb.payment = { method, amount };
	sb.paidAt = new Date().toISOString();

	const tableLabel = order.tableId ? (tables.find(t => t.id === order.tableId)?.label ?? '') : `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.subBillPaid(sb.label, tableLabel, sb.total, method);

	// Check if all sub-bills are paid
	const allPaid = order.subBills.every(s => s.payment !== null);
	if (allPaid) {
		for (const sub of order.subBills) {
			if (sub.payment) order.payments.push(sub.payment);
		}
		order.status = 'paid';
		order.closedAt = new Date().toISOString();
		// Capture duration before closeTable() clears it (Fix 3)
		const capturedElapsed = order.tableId
			? (tables.find(t => t.id === order.tableId)?.elapsedSeconds ?? null)
			: null;
		if (order.tableId) closeTable(order.tableId);
		log.tableClosed(tableLabel, order.total, 'Split', capturedElapsed ?? undefined);
	}
}

export function cancelSplit(orderId: string): void {
	const order = orders.find(o => o.id === orderId);
	if (!order) return;
	if (order.subBills?.some(sb => sb.payment !== null)) return;
	const tableLabel = order.tableId ? (tables.find(t => t.id === order.tableId)?.label ?? '') : `Takeout (${order.customerName ?? 'Walk-in'})`;
	order.splitType = undefined;
	order.subBills = undefined;
	log.splitCancelled(tableLabel);
}
