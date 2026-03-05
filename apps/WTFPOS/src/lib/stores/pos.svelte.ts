/**
 * POS Global State — Svelte 5 Runes
 * State is mutated directly (fine in .svelte.ts with $state)
 */
import type { Table, Order, MenuItem, KdsTicket, KdsHistoryEntry, TableZone, TableStatus, TakeoutStatus, SplitType, SubBill, PaymentMethod } from '$lib/types';
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
const _tables = createRxStore<Table>('tables', db => db.tables.find());
const _orders = createRxStore<Order>('orders', db => db.orders.find());
const _kdsTickets = createRxStore<KdsTicket>('kds_tickets', db => db.kds_tickets.find());
const _kdsHistory = createRxStore<KdsHistoryEntry>('kds_history', db => db.kds_history.find({
    sort: [{ bumpedAt: 'desc' }]
}));

// Create proxy objects that work both as arrays and have .value property
function createStoreProxy<T>(store: { value: T[] }): T[] & { value: T[] } {
	return new Proxy(store.value, {
		get(target, prop) {
			if (prop === 'value') return target;
			return (target as any)[prop];
		}
	}) as T[] & { value: T[] };
}

export const tables = createStoreProxy(_tables);
export const orders = createStoreProxy(_orders);
export const kdsTickets = createStoreProxy(_kdsTickets);
export const kdsTicketHistory = createStoreProxy(_kdsHistory);

// ─── Table Actions ────────────────────────────────────────────────────────────

export async function openTable(tableId: string, pax: number = 4, packageName?: string): Promise<string> {
	// Warehouse locations have no tables — guard against accidental calls
	if (isWarehouseSession()) return '';
	const table = tables.value.find((t) => t.id === tableId);
	if (!table || table.status !== 'available') return table?.currentOrderId ?? '';
	
	const db = await getDb();
	const orderId = nanoid();

	// Persist table state
	await db.tables.findOne(tableId).patch({
		status: 'occupied',
		sessionStartedAt: new Date().toISOString(),
		elapsedSeconds: 0,
		currentOrderId: orderId,
		billTotal: 0
	});

	// Persist new order
	await db.orders.insert({ 
		id: orderId, 
		locationId: table.locationId, 
		orderType: 'dine-in', 
		tableId, 
		tableNumber: table.number, 
		packageName: packageName ?? null, 
		packageId: null, 
		pax, 
		items: [], 
		status: 'open', 
		discountType: 'none', 
		subtotal: 0, 
		discountAmount: 0, 
		vatAmount: 0, 
		total: 0, 
		payments: [], 
		createdAt: new Date().toISOString(), 
		closedAt: null, 
		billPrinted: false, 
		notes: '' 
	});

	log.tableOpened(table.label, packageName ?? null, pax);
	return orderId;
}

export async function createTakeoutOrder(customerName: string = 'Walk-in'): Promise<string> {
	if (!browser) return '';
	const orderId = nanoid();
	const db = await getDb();
	
	await db.orders.insert({
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
		takeoutStatus: 'new',
		discountType: 'none',
		subtotal: 0, 
		discountAmount: 0, 
		vatAmount: 0, 
		total: 0,
		payments: [],
		createdAt: new Date().toISOString(),
		closedAt: null,
		billPrinted: false,
		notes: ''
	});
	
	return orderId;
}

export async function closeTable(tableId: string) {
	const db = await getDb();
	const doc = await db.tables.findOne(tableId).exec();
	if (doc) {
		await doc.patch({
			status: 'available',
			sessionStartedAt: null,
			elapsedSeconds: null,
			currentOrderId: null,
			billTotal: null
		});
	}
}

export async function printBill(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;
	
	const db = await getDb();
	await db.orders.findOne(orderId).patch({ billPrinted: true });
	
	if (order.tableId) {
		await db.tables.findOne(order.tableId).patch({ status: 'billing' });
	}
}

export async function setTableMaintenance(tableId: string, isMaintenance: boolean) {
	const table = tables.value.find(t => t.id === tableId);
	if (!table) return;
	if (isMaintenance && table.status !== 'available') return; // Can only mark empty tables
	
	const db = await getDb();
	await db.tables.findOne(tableId).patch({
		status: isMaintenance ? 'maintenance' : 'available'
	});
}

export async function syncElapsedSeconds() {
	if (!browser || session.locationId === 'wh-qc') return;
	const db = await getDb();
	for (const table of tables.value) {
		if (table.status === 'occupied' && table.sessionStartedAt) {
			const start = new Date(table.sessionStartedAt).getTime();
			const now = Date.now();
			const seconds = Math.floor((now - start) / 1000);
			if (seconds !== table.elapsedSeconds) {
				await db.tables.findOne(table.id).patch({ elapsedSeconds: seconds });
			}
		}
	}
}

export function tickTimers() {
	for (const table of tables.value) {
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

export async function updateTableLayout(tableUpdates: Pick<Table, 'id' | 'x' | 'y' | 'width' | 'height'>[]) {
	if (!browser) return;
	const db = await getDb();
	for (const update of tableUpdates) {
		await db.tables.findOne(update.id).patch({
			x: update.x,
			y: update.y,
			width: update.width,
			height: update.height
		});
	}
}

export async function addTable(locationId: string, label: string, capacity: number, x: number, y: number) {
	if (!browser) return;
	const db = await getDb();
	const number = tables.value.filter(t => t.locationId === locationId).length + 1;
	const id = `${locationId === 'qc' ? 'QC' : 'MK'}-T${number}-${nanoid(4)}`;
	await db.tables.insert({
		id, locationId, number, label, zone: 'main', capacity,
		x, y, width: 92, height: 92,
		shape: 'rect',
		status: 'available', sessionStartedAt: null, elapsedSeconds: null, currentOrderId: null, billTotal: null
	});
}

export async function deleteTable(tableId: string) {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.tables.findOne(tableId).exec();
	if (doc && doc.status === 'available') {
		await doc.remove();
	}
}

// ─── Pending Payment Hold ────────────────────────────────────────────────────

export async function holdPayment(orderId: string, method: 'gcash' | 'maya') {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'open') return;

	const db = await getDb();
	await db.orders.findOne(orderId).patch({
		status: 'pending_payment',
		pendingPaymentMethod: method
	});

	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.paymentHeld(label);
}

export async function confirmHeldPayment(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'pending_payment') return;
	
	const db = await getDb();
	const method = order.pendingPaymentMethod ?? 'gcash';
	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;

	// Capture duration before closeTable() clears it
	const capturedElapsed = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.elapsedSeconds ?? null)
		: null;

	await db.orders.findOne(orderId).patch({
		payments: [...order.payments, { method, amount: order.total }],
		status: 'paid',
		closedAt: new Date().toISOString(),
		closedBy: session.userName || 'Staff'
	});

	if (order.tableId) await closeTable(order.tableId);
	
	log.paymentConfirmed(label, order.total, method === 'gcash' ? 'GCash' : 'Maya');
	log.tableClosed(label, order.total, method === 'gcash' ? 'GCash' : 'Maya', capturedElapsed ?? undefined);
}

export async function cancelHeldPayment(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'pending_payment') return;

	const db = await getDb();
	await db.orders.findOne(orderId).patch({
		status: 'open',
		pendingPaymentMethod: undefined
	});

	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.paymentCancelled(label);
}

// ─── Order Actions ────────────────────────────────────────────────────────────

export function getOrder(orderId: string) { return orders.value.find((o) => o.id === orderId); }

export async function addItemToOrder(orderId: string, item: MenuItem, qty: number, weight?: number, forceFree: boolean = false, notes?: string) {
	const order = orders.value.find((o) => o.id === orderId);
	if (!order) return;

	const db = await getDb();
	const isFree = item.category === 'meats' || item.isFree || forceFree;
	const unitPrice = isFree ? 0 : (item.category === 'packages' ? item.price * order.pax : (item.isWeightBased ? Math.round((weight ?? 0) * (item.pricePerGram ?? 0)) : item.price));
	const tag: 'PKG' | 'FREE' | null = isFree ? 'FREE' : (item.category === 'packages' ? 'PKG' : null);

	const newItem = { id: nanoid(), menuItemId: item.id, menuItemName: item.name, quantity: qty, unitPrice, weight: weight ?? null, status: 'pending' as const, sentAt: null, tag, notes };
	
	const updatedItems = [...order.items, newItem];
	const totals = calculateOrderTotals({ ...order, items: updatedItems });

	await db.orders.findOne(orderId).patch({
		packageId: item.category === 'packages' ? item.id : order.packageId,
		packageName: item.category === 'packages' ? item.name : order.packageName,
		items: updatedItems,
		...totals
	});

	if (order.tableId) {
		await db.tables.findOne(order.tableId).patch({ billTotal: totals.total });
	}

	// Auto-deduct from stock
	const deductQty = item.isWeightBased ? (weight ?? 0) : qty;
	if (deductQty > 0) {
		await deductFromStock(item.id, deductQty, order.tableId ?? 'takeout', order.id, item.trackInventory ?? false);
	}

	// KDS Ticket Management
	const ticket = kdsTickets.value.find((t) => t.orderId === orderId);
	const kdsItem = { id: newItem.id, menuItemName: item.name, quantity: qty, status: 'pending' as const, weight, category: item.category, notes };
	
	if (ticket) {
		await db.kds_tickets.findOne(ticket.id).patch({
			items: [...ticket.items, kdsItem]
		});
	} else {
		await db.kds_tickets.insert({
			id: nanoid(),
			orderId,
			tableNumber: order.tableNumber,
			customerName: order.customerName,
			items: [kdsItem],
			createdAt: new Date().toISOString()
		});
	}

	const tableLabel = order.tableId ? (tables.value.find(t => t.id === order.tableId)?.label ?? order.tableId) : 'Takeout';
	log.itemCharged(item.name, tableLabel, weight ?? null, qty);
}

export function calculateOrderTotals(order: Pick<Order, 'items' | 'discountType' | 'discountPax' | 'pax'>): { subtotal: number, discountAmount: number, vatAmount: number, total: number } {
	const sub = order.items.filter((i) => i.status !== 'cancelled' && i.tag !== 'FREE').reduce((s, i) => s + i.unitPrice * i.quantity, 0);
	let disc = 0;
	if (order.discountType === 'senior' || order.discountType === 'pwd') {
		const qualifyingPax = Math.max(0, order.discountPax ?? order.pax);
		const totalPax = Math.max(1, order.pax);
		const validQualifyingPax = Math.min(qualifyingPax, totalPax);
		disc = Math.round(sub * (validQualifyingPax / totalPax) * 0.2);
	}
	else if (order.discountType === 'comp' || order.discountType === 'service_recovery' || order.discountType === 'promo') {
		disc = sub;
	}

	const net = Math.max(0, sub - disc);
	const vat = order.discountType !== 'none' && order.discountType !== 'promo' && order.discountType !== 'comp' && order.discountType !== 'service_recovery'
		? 0
		: Math.round(net - net / 1.12);

	return { subtotal: sub, discountAmount: disc, vatAmount: vat, total: net };
}

export async function recalcOrder(order: Order) {
	const totals = calculateOrderTotals(order);
	const db = await getDb();
	await db.orders.findOne(order.id).patch({
		items: order.items,
		discountType: order.discountType,
		discountPax: order.discountPax,
		discountIds: order.discountIds,
		...totals
	});

	if (order.tableId) {
		await db.tables.findOne(order.tableId).patch({ billTotal: totals.total });
	}
}

export async function voidOrder(orderId: string, reason?: 'mistake' | 'walkout' | 'write_off') {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status === 'paid' || order.status === 'cancelled') return;
	
	const db = await getDb();
	const updatedItems = order.items.map(item => {
		if (item.status !== 'cancelled') {
			const restoreQty = item.weight ?? item.quantity;
			if (restoreQty > 0) {
				restoreStock(item.menuItemId, restoreQty, order.tableId ?? 'takeout', order.id);
			}
			return { ...item, status: 'cancelled' as const };
		}
		return item;
	});

	await db.orders.findOne(orderId).patch({
		status: 'cancelled' as const,
		items: updatedItems,
		cancelReason: reason,
		closedAt: new Date().toISOString(),
		takeoutStatus: order.orderType === 'takeout' ? 'new' : order.takeoutStatus
	});

	// Remove or cancel KDS ticket
	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		await db.kds_tickets.findOne(ticket.id).remove();
	}

	let capturedElapsed: number | null = null;
	if (order.tableId) {
		const table = tables.value.find(t => t.id === order.tableId);
		if (table) {
			capturedElapsed = table.elapsedSeconds;
			await closeTable(order.tableId);
		}
	}

	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? order.tableId)
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	
	if (order.subtotal === 0) {
		log.zeroValueCancellation(label, reason, capturedElapsed ?? undefined);
	} else {
		log.orderVoided(label, order.total, reason, capturedElapsed ?? undefined);
	}
}

export async function markItemServed(orderId: string, itemId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;

	const db = await getDb();
	const updatedItems = order.items.map(i => i.id === itemId ? { ...i, status: 'served' } : i);
	
	await db.orders.findOne(orderId).patch({ items: updatedItems } as any);

	// Update KDS Ticket
	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		const updatedKdsItems = ticket.items.map(i => i.id === itemId ? { ...i, status: 'served' } : i);
		const allServed = updatedKdsItems.every(i => i.status === 'served' || i.status === 'cancelled');
		
		if (allServed) {
			// Persist to KDS history
			await db.kds_history.insert({
				...structuredClone(ticket), // Use structuredClone to ensure deep copy
				items: updatedKdsItems,
				bumpedAt: new Date().toISOString(),
				bumpedBy: session.userName || 'Kitchen'
			});
			// Remove from active tickets
			await db.kds_tickets.findOne(ticket.id).remove();
			
			// If takeout, advance to ready
			if (order.orderType === 'takeout' && order.status === 'open') {
				await db.orders.findOne(orderId).patch({ takeoutStatus: 'ready' });
				log.takeoutAdvanced(order.customerName ?? 'Walk-in', 'ready');
			}
		} else {
			await db.kds_tickets.findOne(ticket.id).patch({ items: updatedKdsItems });
		}
	}
	log.itemServed(updatedItems.find(i => i.id === itemId)?.menuItemName ?? 'Item', order.tableNumber);
}

/**
 * Reject an order item from KDS (kitchen refusal) - marks item as cancelled
 * and recalculates the order total
 */
export async function rejectOrderItem(orderId: string, itemId: string, reason: string = 'Kitchen Reject') {
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;

	const db = await getDb();
	const item = order.items.find(i => i.id === itemId);
	if (!item || item.status === 'cancelled') return;

	const updatedItems = order.items.map(i => i.id === itemId ? { ...i, status: 'cancelled' as const } : i);
	const totals = calculateOrderTotals({ ...order, items: updatedItems });

	await db.orders.findOne(orderId).patch({
		items: updatedItems,
		...totals
	});

	if (order.tableId) {
		await db.tables.findOne(order.tableId).patch({ billTotal: totals.total });
	}

	// Restore stock
	const restoreQty = item.weight ?? item.quantity;
	if (restoreQty > 0) {
		restoreStock(item.menuItemId, restoreQty, order.tableId ?? 'takeout', order.id);
	}
	log.kitchenRefusal(item.menuItemName, order.tableNumber, reason);
}

export async function recallTicket(orderId: string) {
	const db = await getDb();
	const historyDoc = await db.kds_history.findOne({ selector: { orderId } }).exec();
	if (!historyDoc) return;
	
	const entry = historyDoc.toJSON();
	const restoredItems = entry.items.map((i: any) => i.status === 'served' ? { ...i, status: 'pending' } : i);
	
	await db.kds_tickets.insert({
		id: entry.id,
		orderId: entry.orderId,
		tableNumber: entry.tableNumber,
		customerName: entry.customerName,
		items: restoredItems,
		createdAt: entry.createdAt
	});
	
	await historyDoc.remove();
	
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (orderDoc) {
		const order = orderDoc.toJSON();
		const updatedOrderItems = order.items.map((i: any) => i.status === 'served' ? { ...i, status: 'pending' } : i);
		await orderDoc.patch({ items: updatedOrderItems });
	}
	
	log.kdsTicketRecalled(entry.tableNumber);
}

export async function recallLastTicket() {
	if (kdsTicketHistory.value.length === 0) return;
	await recallTicket(kdsTicketHistory.value[0].orderId);
}

// ─── Pax Change (Late Joiner) ────────────────────────────────────────────────

export async function changePax(orderId: string, newPax: number) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'open') return;
	
	const MAX_PAX = 50;
	if (newPax < 1 || newPax > MAX_PAX) return;
	
	const oldPax = order.pax;
	if (newPax === oldPax) return;

	const db = await getDb();
	let updatedItems = [...order.items];
	if (order.packageId) {
		updatedItems = order.items.map(i => 
			(i.menuItemId === order.packageId && i.tag === 'PKG') 
			? { ...i, quantity: newPax } 
			: i
		);
	}

	const totals = calculateOrderTotals({ ...order, pax: newPax, items: updatedItems });

	await db.orders.findOne(orderId).patch({
		pax: newPax,
		originalPax: order.originalPax || oldPax,
		items: updatedItems,
		...totals
	});

	if (order.tableId) {
		await db.tables.findOne(order.tableId).patch({ billTotal: totals.total });
	}

	const tableLabel = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.paxChanged(tableLabel, oldPax, newPax);
}

// ─── Leftover Penalty ────────────────────────────────────────────────────────

export async function applyLeftoverPenalty(orderId: string, weightGrams: number, ratePerHundredGrams: number = 50) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || weightGrams <= 0) return;
	
	const db = await getDb();
	const penalty = Math.ceil(weightGrams / 100) * ratePerHundredGrams;
	
	const penaltyItem = {
		id: nanoid(), menuItemId: 'penalty-leftover', menuItemName: 'Leftover Penalty',
		quantity: 1, unitPrice: penalty, weight: weightGrams, status: 'served' as const, sentAt: null, tag: null as any,
		notes: `${weightGrams}g leftover @ ₱${ratePerHundredGrams}/100g`
	};

	const updatedItems = [...order.items, penaltyItem];
	const totals = calculateOrderTotals({ ...order, items: updatedItems });

	await db.orders.findOne(orderId).patch({
		leftoverPenaltyAmount: penalty,
		items: updatedItems,
		...totals
	});

	if (order.tableId) {
		await db.tables.findOne(order.tableId).patch({ billTotal: totals.total });
	}

	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.leftoverPenaltyApplied(label, weightGrams, penalty);
}

export async function waiveLeftoverPenalty(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;

	const db = await getDb();
	const updatedItems = order.items.filter(i => i.menuItemId !== 'penalty-leftover');
	const totals = calculateOrderTotals({ ...order, items: updatedItems });

	await db.orders.findOne(orderId).patch({
		leftoverPenaltyAmount: 0,
		items: updatedItems,
		...totals
	});

	if (order.tableId) {
		await db.tables.findOne(order.tableId).patch({ billTotal: totals.total });
	}

	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.leftoverPenaltyWaived(label);
}

// ─── Takeout Lifecycle ───────────────────────────────────────────────────────

export async function advanceTakeoutStatus(orderId: string): Promise<void> {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.orderType !== 'takeout') return;
	
	const progression: Record<string, string | null> = {
		'new': 'preparing',
		'preparing': 'ready',
		'ready': 'picked_up',
		'picked_up': null
	};
	const current = order.takeoutStatus ?? 'new';
	const next = progression[current];
	
	if (next) {
		const db = await getDb();
		await db.orders.findOne(orderId).patch({ takeoutStatus: next });
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

export async function transferTable(fromTableId: string, toTableId: string): Promise<{ success: boolean; error?: string }> {
	const fromTable = tables.value.find(t => t.id === fromTableId);
	const toTable = tables.value.find(t => t.id === toTableId);
	if (!fromTable || !toTable || toTable.status !== 'available' || !fromTable.currentOrderId) return { success: false, error: 'Invalid tables or table not available' };
	if (fromTable.locationId !== toTable.locationId) return { success: false, error: 'Cannot transfer between locations' };

	const db = await getDb();
	const orderId = fromTable.currentOrderId;

	// Update table state
	await db.tables.findOne(toTableId).patch({
		status: fromTable.status,
		sessionStartedAt: fromTable.sessionStartedAt,
		elapsedSeconds: fromTable.elapsedSeconds,
		currentOrderId: orderId,
		billTotal: fromTable.billTotal
	});

	await db.tables.findOne(fromTableId).patch({
		status: 'available',
		sessionStartedAt: null,
		elapsedSeconds: null,
		currentOrderId: null,
		billTotal: null
	});

	// Update order reference
	await db.orders.findOne(orderId).patch({
		tableId: toTableId,
		tableNumber: toTable.number
	});

	// Update KDS ticket
	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		await db.kds_tickets.findOne(ticket.id).patch({ tableNumber: toTable.number });
	}

	log.tableTransferred(fromTable.label, toTable.label);
	return { success: true };
}

export async function mergeTables(primaryTableId: string, secondaryTableId: string): Promise<{ success: boolean; error?: string }> {
	const primaryTable = tables.value.find(t => t.id === primaryTableId);
	const secondaryTable = tables.value.find(t => t.id === secondaryTableId);

	if (!primaryTable || !secondaryTable || !primaryTable.currentOrderId || !secondaryTable.currentOrderId) return { success: false, error: 'Invalid tables' };
	if (primaryTable.locationId !== secondaryTable.locationId) return { success: false, error: 'Cannot merge between locations' };

	const primaryOrder = orders.value.find(o => o.id === primaryTable.currentOrderId);
	const secondaryOrder = orders.value.find(o => o.id === secondaryTable.currentOrderId);
	if (!primaryOrder || !secondaryOrder || primaryOrder.status !== 'open' || secondaryOrder.status !== 'open') return { success: false, error: 'One or both orders are not open' };

	const db = await getDb();
	let mergedItems = [...primaryOrder.items];

	// Merge secondary items
	for (const item of secondaryOrder.items) {
		if (item.tag === 'PKG' || (item.tag === 'FREE' && secondaryOrder.packageId)) {
			// Skip secondary package items IF primary has a package
			if (!primaryOrder.packageId) {
				mergedItems.push({ ...item, id: nanoid(), notes: item.notes ? `${item.notes} (from ${secondaryTable.label})` : `From ${secondaryTable.label}` });
			}
		} else {
			mergedItems.push({ ...item, id: nanoid(), notes: item.notes ? `${item.notes} (from ${secondaryTable.label})` : `From ${secondaryTable.label}` });
		}
	}

	const combinedPax = primaryOrder.pax + secondaryOrder.pax;
	if (primaryOrder.packageId) {
		mergedItems = mergedItems.map(i => (i.menuItemId === primaryOrder.packageId && i.tag === 'PKG') ? { ...i, quantity: combinedPax } : i);
	}

	const totals = calculateOrderTotals({ ...primaryOrder, items: mergedItems, pax: combinedPax });

	await db.orders.findOne(primaryOrder.id).patch({
		items: mergedItems,
		pax: combinedPax,
		...totals
	});

	await db.tables.findOne(primaryTableId).patch({ billTotal: totals.total });

	// Merge KDS
	const primaryTicket = kdsTickets.value.find(t => t.orderId === primaryOrder.id);
	const secondaryTicket = kdsTickets.value.find(t => t.orderId === secondaryOrder.id);
	if (primaryTicket && secondaryTicket) {
		await db.kds_tickets.findOne(primaryTicket.id).patch({
			items: [...primaryTicket.items, ...secondaryTicket.items.filter(i => i.status !== 'cancelled').map(i => ({ ...i, id: nanoid() }))]
		});
		await db.kds_tickets.findOne(secondaryTicket.id).remove();
	}

	// Void secondary
	await db.orders.findOne(secondaryOrder.id).patch({
		status: 'cancelled',
		notes: `Merged into ${primaryTable.label}`,
		closedAt: new Date().toISOString()
	});

	await closeTable(secondaryTableId);
	log.tableClosed(secondaryTable.label, 0, `MERGED into ${primaryTable.label}`);
	return { success: true };
}

export async function changePackage(orderId: string, newPackageId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || !order.packageId) return;

	const newPkg = menuItems.value.find(m => m.id === newPackageId);
	if (!newPkg || newPkg.category !== 'packages') return;

	const db = await getDb();
	const updatedItems = order.items.map(i => (i.menuItemId === order.packageId && i.tag === 'PKG') ? { ...i, menuItemId: newPkg.id, menuItemName: newPkg.name, unitPrice: newPkg.price } : i);
	const totals = calculateOrderTotals({ ...order, items: updatedItems });

	await db.orders.findOne(orderId).patch({
		packageId: newPkg.id,
		packageName: newPkg.name,
		items: updatedItems,
		...totals
	});

	if (order.tableId) {
		await db.tables.findOne(order.tableId).patch({ billTotal: totals.total });
	}
}

// ─── Split Bill ──────────────────────────────────────────────────────────────

export async function initEqualSplit(orderId: string, splitCount: number) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.total <= 0 || splitCount <= 0) return;

	const db = await getDb();
	const baseAmount = Math.floor(order.total / splitCount);
	const remainder = order.total % splitCount;

	const subBills = Array.from({ length: splitCount }, (_, i) => {
		const amount = baseAmount + (i < remainder ? 1 : 0);
		return {
			id: nanoid(),
			label: `Guest ${i + 1}`,
			itemIds: [],
			subtotal: amount,
			discountAmount: 0,
			vatAmount: 0,
			total: amount,
			payment: null,
			paidAt: null
		};
	});

	await db.orders.findOne(orderId).patch({ splitType: 'equal', subBills });
}

export async function initItemSplit(orderId: string, splitCount: number) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;

	const db = await getDb();
	const subBills = Array.from({ length: splitCount }, (_, i) => ({
		id: nanoid(),
		label: `Guest ${i + 1}`,
		itemIds: [],
		subtotal: 0, discountAmount: 0, vatAmount: 0, total: 0,
		payment: null, paidAt: null
	}));

	await db.orders.findOne(orderId).patch({ splitType: 'by-item', subBills });
}

export async function assignItemToSubBill(orderId: string, itemId: string, subBillId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || !order.subBills) return;

	const db = await getDb();
	const updatedSubBills = order.subBills.map(sb => {
		let itemIds = sb.itemIds.filter(id => id !== itemId);
		if (sb.id === subBillId) itemIds.push(itemId);
		return { ...sb, itemIds };
	});

	// Recalculate each sub-bill
	for (const sb of updatedSubBills) {
		const items = order.items.filter(i => sb.itemIds.includes(i.id) && i.status !== 'cancelled' && i.tag !== 'FREE');
		sb.subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
		
		const totals = calculateOrderTotals({ items, discountType: order.discountType, discountPax: order.discountPax, pax: order.pax });
		sb.discountAmount = totals.discountAmount;
		sb.vatAmount = totals.vatAmount;
		sb.total = totals.total;
	}

	await db.orders.findOne(orderId).patch({ subBills: updatedSubBills });
}

export async function paySubBill(orderId: string, subBillId: string, method: PaymentMethod, amount: number) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || !order.subBills) return;

	const db = await getDb();
	const updatedSubBills = order.subBills.map(sb => sb.id === subBillId ? { ...sb, payment: { method, amount }, paidAt: new Date().toISOString() } : sb);
	
	const allPaid = updatedSubBills.every(s => s.payment !== null);
	if (allPaid) {
		const payments = [...order.payments, ...updatedSubBills.map(s => s.payment!)];
		await db.orders.findOne(orderId).patch({
			subBills: updatedSubBills,
			payments,
			status: 'paid',
			closedAt: new Date().toISOString(),
			closedBy: session.userName || 'Staff'
		});
		if (order.tableId) await closeTable(order.tableId);
	} else {
		await db.orders.findOne(orderId).patch({ subBills: updatedSubBills });
	}
}

export async function cancelSplit(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.subBills?.some(sb => sb.payment !== null)) return;
	
	const db = await getDb();
	await db.orders.findOne(orderId).patch({ splitType: null as any, subBills: null as any });
}
