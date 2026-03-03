/**
 * POS Global State — Svelte 5 Runes
 * State is mutated directly (fine in .svelte.ts with $state)
 */
import type { Table, Order, MenuItem, KdsTicket, TableZone } from '$lib/types';
import { nanoid } from 'nanoid';

const SESSION_SECONDS = 90 * 60;

// ─── Mock Table Layout — matching POS DESIGN.pen floor zones ─────────────────

function makeTables(): Table[] {
	return [
		// Main Dining — T1-T8
		...Array.from({ length: 8 }, (_, i) => ({
			id: `T${i + 1}`,
			number: i + 1,
			label: `T${i + 1}`,
			zone: 'main' as TableZone,
			capacity: i < 6 ? 4 : 2,
			status: 'available' as const,
			sessionStartedAt: null,
			remainingSeconds: null,
			currentOrderId: null,
			billTotal: null
		})),
		// VIP / Private
		{
			id: 'VIP1', number: 101, label: 'VIP1', zone: 'vip' as TableZone,
			capacity: 8, status: 'occupied' as const,
			sessionStartedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
			remainingSeconds: 45 * 60, currentOrderId: 'order-vip1', billTotal: 12056
		},
		// Bar
		{ id: 'BAR1', number: 201, label: 'BAR1', zone: 'bar' as TableZone, capacity: 2, status: 'available' as const, sessionStartedAt: null, remainingSeconds: null, currentOrderId: null, billTotal: null },
		{ id: 'BAR2', number: 202, label: 'BAR2', zone: 'bar' as TableZone, capacity: 2, status: 'available' as const, sessionStartedAt: null, remainingSeconds: null, currentOrderId: null, billTotal: null }
	];
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export const MENU_ITEMS: MenuItem[] = [
	{ id: 'pkg-pork',    name: '🐷 Unli Pork',         category: 'packages', price: 499,  isWeightBased: false, available: true, desc: 'All-you-can-eat pork grill',    perks: '4 sides, 200g initial meats' },
	{ id: 'pkg-beef',    name: '🐄 Unli Beef',         category: 'packages', price: 699,  isWeightBased: false, available: true, desc: 'All-you-can-eat beef grill',    perks: '5 sides, 250g initial meats' },
	{ id: 'pkg-combo',   name: '🔥 Unli Pork & Beef',  category: 'packages', price: 899,  isWeightBased: false, available: true, desc: 'Premium pork + beef combo',    perks: '6 sides, 300g initial meats' },
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
export const orders = $state<Order[]>([
	{
		id: 'order-vip1', tableId: 'VIP1', tableNumber: 101, packageName: '🔥 Unli Pork & Beef',
		items: [
			{ id: 'i1', menuItemId: 'meat-samgyup', menuItemName: 'Samgyeopsal', quantity: 1, unitPrice: 0, weight: 200, status: 'served', sentAt: null, tag: 'PKG' },
			{ id: 'i2', menuItemId: 'meat-chadol',  menuItemName: 'Chadolbaegi', quantity: 1, unitPrice: 0, weight: 150, status: 'served', sentAt: null, tag: 'PKG' },
			{ id: 'i3', menuItemId: 'side-kimchi',  menuItemName: 'Kimchi',      quantity: 1, unitPrice: 0, weight: null, status: 'served', sentAt: null, tag: 'FREE' },
			{ id: 'i4', menuItemId: 'side-japchae', menuItemName: 'Japchae',     quantity: 1, unitPrice: 180, weight: null, status: 'served', sentAt: null, tag: null }
		],
		status: 'open', discountType: 'none', subtotal: 12056, discountAmount: 0, vatAmount: 1293, total: 12056,
		payments: [], createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), closedAt: null
	}
]);
export const kdsTickets = $state<KdsTicket[]>([]);

// ─── Table Actions ────────────────────────────────────────────────────────────

export function openTable(tableId: string, packageName?: string): string {
	const table = tables.find((t) => t.id === tableId);
	if (!table || table.status !== 'available') return table?.currentOrderId ?? '';
	const orderId = nanoid();
	table.status = 'occupied';
	table.sessionStartedAt = new Date().toISOString();
	table.remainingSeconds = SESSION_SECONDS;
	table.currentOrderId = orderId;
	table.billTotal = 0;
	orders.push({ id: orderId, tableId, tableNumber: table.number, packageName: packageName ?? null, items: [], status: 'open', discountType: 'none', subtotal: 0, discountAmount: 0, vatAmount: 0, total: 0, payments: [], createdAt: new Date().toISOString(), closedAt: null });
	return orderId;
}

export function closeTable(tableId: string) {
	const table = tables.find((t) => t.id === tableId);
	if (!table) return;
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

export function addItemToOrder(orderId: string, item: MenuItem, qty: number, weight?: number) {
	const order = orders.find((o) => o.id === orderId);
	if (!order) return;
	const unitPrice = item.isWeightBased ? Math.round((weight ?? 0) * (item.pricePerGram ?? 0)) : item.price;
	const tag: 'PKG' | 'FREE' | null = item.isFree ? 'FREE' : item.isWeightBased ? 'PKG' : null;
	const newItem = { id: nanoid(), menuItemId: item.id, menuItemName: item.name, quantity: qty, unitPrice, weight: weight ?? null, status: 'pending' as const, sentAt: null, tag };
	order.items.push(newItem);
	recalcOrder(order);
	const table = tables.find((t) => t.id === order.tableId);
	if (table) table.billTotal = order.total;
	const ticket = kdsTickets.find((t) => t.orderId === orderId);
	const kdsItem = { id: newItem.id, menuItemName: item.name, quantity: qty, status: 'pending' as const, weight, category: item.category };
	if (ticket) ticket.items.push(kdsItem);
	else kdsTickets.push({ orderId, tableNumber: order.tableNumber, items: [kdsItem], createdAt: new Date().toISOString() });
}

export function recalcOrder(order: Order) {
	const sub = order.items.filter((i) => i.status !== 'cancelled' && i.tag !== 'FREE').reduce((s, i) => s + i.unitPrice * i.quantity, 0);
	const disc = order.discountType !== 'none' ? Math.round(sub * 0.2) : 0;
	const vat = order.discountType !== 'none' ? 0 : Math.round((sub - disc) * 0.12);
	order.subtotal = sub; order.discountAmount = disc; order.vatAmount = vat; order.total = sub - disc + vat;
}

export function markItemServed(orderId: string, itemId: string) {
	const t = kdsTickets.find((t) => t.orderId === orderId);
	if (t) { const i = t.items.find((i) => i.id === itemId); if (i) i.status = 'served'; }
	const o = orders.find((o) => o.id === orderId);
	if (o) { const i = o.items.find((i) => i.id === itemId); if (i) i.status = 'served'; }
}
