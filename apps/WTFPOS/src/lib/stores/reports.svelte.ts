/**
 * Reports Store — Svelte 5 Runes
 * All report data derived from live POS orders, stock, and audit log state.
 * Import specific derived values here instead of duplicating per page.
 */
import { orders as allOrders, tables as allTables, menuItems } from '$lib/stores/pos.svelte';
import { stockItems, deliveries, deductions, getCurrentStock } from '$lib/stores/stock.svelte';
import { session } from '$lib/stores/session.svelte';
import { log } from '$lib/stores/audit.svelte';
import { createRxStore } from '$lib/stores/sync.svelte';
import { getDb } from '$lib/db';
import { nanoid } from 'nanoid';

// Branch-filtered getters
function getOrders() { return session.locationId === 'all' ? allOrders.value : allOrders.value.filter(o => o.locationId === session.locationId); }
function getTables() { return session.locationId === 'all' ? allTables.value : allTables.value.filter(t => t.locationId === session.locationId); }

function getToday() {
	return new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function liveOrders() { return getOrders(); }

export function todayClosedOrders() { return getOrders().filter(o => o.status === 'paid'); }

export function salesSummary() {
	const os = getOrders().filter(o => o.status === 'paid');
	const grossSales   = os.reduce((s, o) => s + o.subtotal, 0);
	const discounts    = os.reduce((s, o) => s + o.discountAmount, 0);
	const netSales     = os.reduce((s, o) => s + o.total, 0);
	const vatAmount    = os.reduce((s, o) => s + o.vatAmount, 0);
	const totalPax     = os.reduce((s, o) => s + (o.pax ?? 0), 0);
	const avgTicket    = totalPax > 0 ? Math.round(netSales / totalPax) : 0;
	return { grossSales, discounts, netSales, vatAmount, totalPax, avgTicket, date: getToday() };
}

export function tableSalesToday() {
	const grouped: Record<string, { tableId: string; label: string; zone: string; sessions: number; pax: number; grossSales: number; discounts: number; netSales: number }> = {};
	for (const order of getOrders().filter(o => o.status === 'paid')) {
		const key = order.tableId ?? 'takeout';
		const table = order.tableId ? getTables().find(t => t.id === order.tableId) : null;
		if (!grouped[key]) {
			grouped[key] = {
				tableId: key,
				label: table?.label ?? (order.orderType === 'takeout' ? 'Takeout' : key),
				zone: table?.zone ?? 'takeout',
				sessions: 0, pax: 0, grossSales: 0, discounts: 0, netSales: 0,
			};
		}
		grouped[key].sessions += 1;
		grouped[key].pax += order.pax ?? 0;
		grouped[key].grossSales += order.subtotal;
		grouped[key].discounts += order.discountAmount;
		grouped[key].netSales += order.total;
	}
	return Object.values(grouped).sort((a, b) => b.netSales - a.netSales);
}

export function bestSellersMeat() {
	const weightByItem: Record<string, number> = {};
	for (const ded of deductions.value) {
		const stockItem = stockItems.value.find(s => s.id === ded.stockItemId);
		if (!stockItem) continue;
		const menuItem = menuItems.value.find(m => m.id === stockItem.menuItemId && m.isWeightBased);
		if (!menuItem) continue;
		weightByItem[menuItem.id] = (weightByItem[menuItem.id] ?? 0) + ded.qty;
	}
	return Object.entries(weightByItem)
		.map(([id, weight]) => {
			const item = menuItems.value.find(m => m.id === id)!;
			const revenue = weight * (item.pricePerGram ?? 0);
			return { name: item.name, weightGrams: weight, revenue };
		})
		.sort((a, b) => b.weightGrams - a.weightGrams)
		.map((row, i) => ({ rank: i + 1, ...row }));
}

export function bestSellersAddons() {
	const qtsByItem: Record<string, { name: string; qty: number; revenue: number }> = {};
	for (const order of getOrders().filter(o => o.status === 'paid')) {
		for (const item of order.items) {
			if (item.tag === 'FREE' || item.tag === 'PKG') continue;
			const menuItem = menuItems.value.find(m => m.id === item.menuItemId);
			if (!menuItem || menuItem.isWeightBased || menuItem.category === 'packages') continue;
			if (!qtsByItem[item.menuItemId]) qtsByItem[item.menuItemId] = { name: item.menuItemName, qty: 0, revenue: 0 };
			qtsByItem[item.menuItemId].qty += item.quantity;
			qtsByItem[item.menuItemId].revenue += item.unitPrice * item.quantity;
		}
	}
	return Object.values(qtsByItem)
		.sort((a, b) => b.qty - a.qty)
		.map((row, i) => ({ rank: i + 1, ...row }));
}

export function meatVarianceToday() {
	const meatStockItems = stockItems.value.filter(s =>
		s.category === 'Meats' &&
		(session.locationId === 'all' || s.locationId === session.locationId)
	);
	return meatStockItems.map(s => {
		const totalDelivered = deliveries.value.filter(d => d.stockItemId === s.id).reduce((t, d) => t + d.qty, 0);
		const totalConsumed  = deductions.value.filter(d => d.stockItemId === s.id).reduce((t, d) => t + d.qty, 0);
		const closing        = getCurrentStock(s.id);
		const available      = s.openingStock + totalDelivered;
		const expectedConsumed = available - closing;
		const variancePct    = available > 0 ? Math.round(((totalConsumed - expectedConsumed) / available) * 100) : 0;
		const trend          = variancePct < -15 ? 'high' : variancePct > 10 ? 'low' : 'ok';
		return {
			id: s.id,
			cut: s.name,
			locationId: s.locationId,
			opening: s.openingStock,
			deliveries: totalDelivered,
			consumed: totalConsumed,
			closing,
			variancePct,
			trend: trend as 'ok' | 'high' | 'low',
		};
	});
}

export function eodSummary() {
	const os = getOrders().filter(o => o.status === 'paid');
	const gross  = os.reduce((s, o) => s + o.subtotal, 0);
	const disc   = os.reduce((s, o) => s + o.discountAmount, 0);
	const net    = os.reduce((s, o) => s + o.total, 0);
	const vat    = os.reduce((s, o) => s + o.vatAmount, 0);
	// Derive payment breakdown from actual order.payments[]
	const cash   = os.reduce((s, o) => s + o.payments.filter(p => p.method === 'cash').reduce((t, p) => t + Math.min(p.amount, o.total), 0), 0);
	const gcash  = os.reduce((s, o) => s + o.payments.filter(p => p.method === 'gcash').reduce((t, p) => t + p.amount, 0), 0);
	const card   = os.reduce((s, o) => s + o.payments.filter(p => p.method === 'card').reduce((t, p) => t + p.amount, 0), 0);
	return { date: getToday(), grossSales: gross, discounts: disc, netSales: net, vatAmount: vat, cash, card, gcash };
}

// ─── X-Read Mid-Shift Audit ──────────────────────────────────────────────────

export interface XReadSnapshot {
	id: string;
	timestamp: string;
	grossSales: number;
	discounts: number;
	netSales: number;
	vatAmount: number;
	totalPax: number;
	cash: number;
	gcash: number;
	card: number;
	voidCount: number;
	discountCount: number;
	generatedBy: string;
}

export const xReadHistory = createRxStore<XReadSnapshot>('x_reads', db => db.x_reads.find().sort({ timestamp: 'desc' }));

export async function generateXRead(): Promise<XReadSnapshot> {
	const summary = eodSummary();
	const voids = getOrders().filter(o => o.status === 'cancelled');
	const discounted = getOrders().filter(o => o.status === 'paid' && o.discountType !== 'none');
	const paid = getOrders().filter(o => o.status === 'paid');
	const totalPax = paid.reduce((s, o) => s + (o.pax ?? 0), 0);

	const snapshot: XReadSnapshot = {
		id: nanoid(),
		timestamp: new Date().toISOString(),
		grossSales: summary.grossSales,
		discounts: summary.discounts,
		netSales: summary.netSales,
		vatAmount: summary.vatAmount,
		totalPax,
		cash: summary.cash,
		gcash: summary.gcash,
		card: summary.card,
		voidCount: voids.length,
		discountCount: discounted.length,
		generatedBy: session.userName || 'Staff',
	};

	const db = await getDb();
	await db.x_reads.insert(snapshot);
	log.xReadGenerated();
	return snapshot;
}

// ─── Staff Performance ───────────────────────────────────────────────────────

export function staffPerformance() {
	const paid = getOrders().filter(o => o.status === 'paid' && o.closedBy);
	const byStaff: Record<string, {
		name: string;
		ordersClosed: number;
		totalRevenue: number;
		avgTicket: number;
		voidCount: number;
		discountCount: number;
	}> = {};

	for (const order of paid) {
		const name = order.closedBy!;
		if (!byStaff[name]) byStaff[name] = { name, ordersClosed: 0, totalRevenue: 0, avgTicket: 0, voidCount: 0, discountCount: 0 };
		byStaff[name].ordersClosed++;
		byStaff[name].totalRevenue += order.total;
		if (order.discountType !== 'none') byStaff[name].discountCount++;
	}

	// Count voids per user from cancelled orders
	const cancelled = getOrders().filter(o => o.status === 'cancelled');
	for (const order of cancelled) {
		// Attribute to closedBy if available, else skip
		const name = order.closedBy;
		if (!name) continue;
		if (!byStaff[name]) byStaff[name] = { name, ordersClosed: 0, totalRevenue: 0, avgTicket: 0, voidCount: 0, discountCount: 0 };
		byStaff[name].voidCount++;
	}

	for (const staff of Object.values(byStaff)) {
		staff.avgTicket = staff.ordersClosed > 0 ? Math.round(staff.totalRevenue / staff.ordersClosed) : 0;
	}

	return Object.values(byStaff).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function voidsAndDiscountsSummary() {
	const allOs = getOrders();
	
	// Voids
	const voided = allOs.filter(o => o.status === 'cancelled');
	const mistake = voided.filter(o => o.cancelReason === 'mistake' || !o.cancelReason).length;
	const walkout = voided.filter(o => o.cancelReason === 'walkout').length;
	const writeOff = voided.filter(o => o.cancelReason === 'write_off').length;
	const voidTotalValue = voided.reduce((s, o) => s + o.subtotal, 0);

	// Discounts
	const paidWithDiscounts = allOs.filter(o => o.status === 'paid' && o.discountType !== 'none');
	const senior = paidWithDiscounts.filter(o => o.discountType === 'senior').reduce((s, o) => s + o.discountAmount, 0);
	const pwd = paidWithDiscounts.filter(o => o.discountType === 'pwd').reduce((s, o) => s + o.discountAmount, 0);
	const promo = paidWithDiscounts.filter(o => o.discountType === 'promo').reduce((s, o) => s + o.discountAmount, 0);
	const comp = paidWithDiscounts.filter(o => o.discountType === 'comp').reduce((s, o) => s + o.discountAmount, 0);
	const serviceRecovery = paidWithDiscounts.filter(o => o.discountType === 'service_recovery').reduce((s, o) => s + o.discountAmount, 0);

	const discountTotalValue = senior + pwd + promo + comp + serviceRecovery;

	return {
		voids: { count: voided.length, value: voidTotalValue, mistake, walkout, writeOff, items: voided },
		discounts: { 
			count: paidWithDiscounts.length, 
			value: discountTotalValue, 
			breakdown: [
				{ label: 'Senior', amount: senior },
				{ label: 'PWD', amount: pwd },
				{ label: 'Promo', amount: promo },
				{ label: 'Comp', amount: comp },
				{ label: 'Service Recovery', amount: serviceRecovery },
			].sort((a, b) => b.amount - a.amount),
			items: paidWithDiscounts
		}
	};
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export const utilitySettings = $state({
	electricityPerKwh: 12,
	gasPerKg: 85
});

export interface UtilityReading {
	id: string;
	date: string;
	electricity: number;
	gas: number;
	recordedBy: string;
}

export const utilityReadings = createRxStore<UtilityReading>('utility_readings', db => db.utility_readings.find().sort({ date: 'desc' }));

export function getPreviousUtilityReading(): UtilityReading | null {
	if (utilityReadings.value.length === 0) return null;
	return utilityReadings.value[0];
}

export async function saveUtilityReading(electricity: number, gas: number) {
	const db = await getDb();
	await db.utility_readings.insert({
		id: nanoid(),
		date: new Date().toISOString(),
		electricity,
		gas,
		recordedBy: session.userName || 'Staff'
	});
}
