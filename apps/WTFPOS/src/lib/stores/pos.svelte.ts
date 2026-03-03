/**
 * POS Global State — Svelte 5 Runes
 * State is mutated directly (fine in .svelte.ts with $state)
 */
import type { Table, Order, MenuItem, KdsTicket, TableZone } from '$lib/types';
import { nanoid } from 'nanoid';
import { deductFromStock } from '$lib/stores/stock.svelte';
import { log } from '$lib/stores/audit.svelte';
import { session, isWarehouseSession } from '$lib/stores/session.svelte';

const SESSION_SECONDS = 90 * 60;

// ─── Mock Table Layout — matching POS DESIGN.pen floor zones ─────────────────

function makeTables(): Table[] {
	// Helper to generate tables for a specific location
	const gen = (locationId: string, prefix: string) => [
		// Main Dining
		...Array.from({ length: 8 }, (_, i) => ({
			id: `${prefix}-T${i + 1}`, locationId, number: i + 1, label: `T${i + 1}`, zone: 'main' as TableZone, capacity: i < 6 ? 4 : 2, status: 'available' as const, sessionStartedAt: null, remainingSeconds: null, currentOrderId: null, billTotal: null
		}))
	];
	return [...gen('qc', 'QC'), ...gen('mkti', 'MK')];
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export const MENU_ITEMS: MenuItem[] = [
	{ id: 'pkg-pork',    name: '🐷 Unli Pork',         category: 'packages', price: 499,  isWeightBased: false, available: true, desc: 'All-you-can-eat pork grill',    perks: '4 sides, 200g initial meats', meats: ['meat-samgyup', 'meat-chadol'], autoSides: ['side-kimchi', 'side-rice'] },
	{ id: 'pkg-beef',    name: '🐄 Unli Beef',         category: 'packages', price: 699,  isWeightBased: false, available: true, desc: 'All-you-can-eat beef grill',    perks: '5 sides, 250g initial meats', meats: ['meat-galbi', 'meat-beef'], autoSides: ['side-kimchi', 'side-rice'] },
	{ id: 'pkg-combo',   name: '🔥 Unli Pork & Beef',  category: 'packages', price: 899,  isWeightBased: false, available: true, desc: 'Premium pork + beef combo',    perks: '6 sides, 300g initial meats', meats: ['meat-samgyup', 'meat-chadol', 'meat-galbi', 'meat-beef'], autoSides: ['side-kimchi', 'side-rice'] },
	{ id: 'meat-samgyup',name: 'Samgyupsal',            category: 'meats',    price: 0,    isWeightBased: true,  available: true, pricePerGram: 0.65 },
	{ id: 'meat-chadol', name: 'Chadolbaegi',           category: 'meats',    price: 0,    isWeightBased: true,  available: true, pricePerGram: 0.75 },
	{ id: 'meat-galbi',  name: 'Galbi',                 category: 'meats',    price: 0,    isWeightBased: true,  available: true, pricePerGram: 0.90 },
	{ id: 'meat-beef',   name: 'US Beef Belly',         category: 'meats',    price: 0,    isWeightBased: true,  available: true, pricePerGram: 1.20 },
	{ id: 'side-kimchi', name: 'Kimchi',                category: 'sides',    price: 0,    isWeightBased: false, available: true, isFree: true },
	{ id: 'side-japchae',name: 'Japchae',               category: 'sides',    price: 120,  isWeightBased: false, available: true },
	{ id: 'side-rice',   name: 'Steamed Rice',          category: 'sides',    price: 35,   isWeightBased: false, available: true },
	{ id: 'dish-jjigae', name: 'Doenjang Jjigae',       category: 'dishes',   price: 120,  isWeightBased: false, available: true },
	{ id: 'dish-bibim',  name: 'Bibimbap',              category: 'dishes',   price: 150,  isWeightBased: false, available: true },
	{ id: 'drink-soju',  name: 'Soju (Original)',       category: 'drinks',   price: 95,   isWeightBased: false, available: true },
	{ id: 'drink-beer',  name: 'San Miguel Beer',       category: 'drinks',   price: 75,   isWeightBased: false, available: true },
	{ id: 'drink-tea',   name: 'Iced Tea',              category: 'drinks',   price: 65,   isWeightBased: false, available: true }
];

// ─── Reactive State ───────────────────────────────────────────────────────────

export const tables = $state<Table[]>(makeTables());
export const orders = $state<Order[]>([]);
export const kdsTickets = $state<KdsTicket[]>([]);

// ─── Table Actions ────────────────────────────────────────────────────────────

export function openTable(tableId: string, pax: number = 4, packageName?: string): string {
	// Warehouse locations have no tables — guard against accidental calls
	if (isWarehouseSession()) return '';
	const table = tables.find((t) => t.id === tableId);
	if (!table || table.status !== 'available') return table?.currentOrderId ?? '';
	const orderId = nanoid();
	table.status = 'occupied';
	table.sessionStartedAt = new Date().toISOString();
	table.remainingSeconds = SESSION_SECONDS;
	table.currentOrderId = orderId;
	table.billTotal = 0;
	orders.push({ id: orderId, locationId: table.locationId, orderType: 'dine-in', tableId, tableNumber: table.number, packageName: packageName ?? null, packageId: null, pax, items: [], status: 'open', discountType: 'none', subtotal: 0, discountAmount: 0, vatAmount: 0, total: 0, payments: [], createdAt: new Date().toISOString(), closedAt: null, notes: '' });
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
		notes: ''
	});
	log.tableOpened(`Takeout (${customerName})`, null, 1);
	return orderId;
}

export function closeTable(tableId: string) {
	const table = tables.find((t) => t.id === tableId);
	if (!table) return;
	const order = table.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : null;
	if (order) log.tableClosed(table.label, order.total);
	table.status = 'available';
	table.sessionStartedAt = null;
	table.remainingSeconds = null;
	table.currentOrderId = null;
	table.billTotal = null;
}

export function tickTimers() {
	for (const table of tables) {
		if (table.status === 'available' || table.remainingSeconds === null) continue;
		table.remainingSeconds = Math.max(0, table.remainingSeconds - 1);
		if (table.remainingSeconds <= 5 * 60) table.status = 'critical';
		else if (table.remainingSeconds <= 15 * 60) table.status = 'warning';
		else table.status = 'occupied';
	}
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
	if (deductQty > 0) deductFromStock(item.id, deductQty, order.tableId ?? 'takeout', order.id);

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
	const disc = order.discountType !== 'none' ? Math.round(sub * 0.2) : 0;
	const net  = sub - disc;
	// PH law (RA 9994 / RA 7277): SC/PWD discount is applied on the VAT-exclusive price;
	// the 12% VAT on the discounted amount is also removed (customer pays zero VAT).
	// For normal orders, prices are VAT-inclusive — extract VAT from the total.
	const vat  = order.discountType !== 'none'
		? 0                                        // SC/PWD: VAT-exempt
		: Math.round(net - net / 1.12);            // Normal: VAT already embedded in price
	order.subtotal = sub; order.discountAmount = disc; order.vatAmount = vat; order.total = net;
}

export function markItemServed(orderId: string, itemId: string) {
	const t = kdsTickets.find((t) => t.orderId === orderId);
	if (t) { const i = t.items.find((i) => i.id === itemId); if (i) { i.status = 'served'; log.itemServed(i.menuItemName, t.tableNumber); } }
	const o = orders.find((o) => o.id === orderId);
	if (o) { const i = o.items.find((i) => i.id === itemId); if (i) i.status = 'served'; }
}
