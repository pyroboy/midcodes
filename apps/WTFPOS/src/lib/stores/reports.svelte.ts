/**
 * Reports Store — Svelte 5 Runes
 * All report data derived from live POS orders, stock, and audit log state.
 * Import specific derived values here instead of duplicating per page.
 */
import { orders as allOrders, tables as allTables, menuItems } from '$lib/stores/pos.svelte';
import { stockItems, deliveries, deductions, wasteEntries, stockEvents, getCurrentStock, getStockStatus } from '$lib/stores/stock.svelte';
import { allExpenses } from '$lib/stores/expenses.svelte';
import { PROTEIN_ORDER, type MeatProtein } from '$lib/stores/stock.constants';
import { session } from '$lib/stores/session.svelte';
import { log, auditLog, writeLog } from '$lib/stores/audit.svelte';
import { createStore } from '$lib/stores/create-store.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
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
	const locId = session.locationId;
	// Build lookup maps once — avoids O(N) .find() per deduction
	const stockById = new Map(stockItems.value.map(s => [s.id, s]));
	const menuById = new Map(menuItems.value.map(m => [m.id, m]));

	const weightByItem: Record<string, number> = {};
	for (const ded of deductions.value) {
		const stockItem = stockById.get(ded.stockItemId);
		if (!stockItem) continue;
		if (locId !== 'all' && stockItem.locationId !== locId) continue;
		const menuItem = menuById.get(stockItem.menuItemId);
		if (!menuItem || !menuItem.isWeightBased) continue;
		weightByItem[menuItem.id] = (weightByItem[menuItem.id] ?? 0) + ded.qty;
	}
	return Object.entries(weightByItem)
		.map(([id, weight]) => {
			const item = menuById.get(id)!;
			const revenue = weight * (item.pricePerGram ?? 0);
			return { name: item.name, weightGrams: weight, revenue };
		})
		.sort((a, b) => b.weightGrams - a.weightGrams)
		.map((row, i) => ({ rank: i + 1, ...row }));
}

export function bestSellersAddons() {
	// Build lookup map once — avoids O(N) .find() per order item
	const menuById = new Map(menuItems.value.map(m => [m.id, m]));

	const qtsByItem: Record<string, { name: string; qty: number; revenue: number }> = {};
	for (const order of getOrders().filter(o => o.status === 'paid')) {
		for (const item of order.items) {
			if (item.tag === 'FREE' || item.tag === 'PKG') continue;
			const menuItem = menuById.get(item.menuItemId);
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

export type MeatReportPeriod = 'today' | 'yesterday' | 'week';

export const PERIOD_LABELS: Record<MeatReportPeriod, string> = {
	today: 'Today',
	yesterday: 'Yesterday',
	week: 'This Week',
};

export interface MeatReportRow {
	id: string;
	cut: string;
	locationId: string;
	proteinType: MeatProtein;
	opening: number;
	deliveries: number;
	/** Grams received via inter-location transfer (subset of deliveries) */
	transferIn: number;
	consumed: number;
	closing: number;
	variancePct: number;
	trend: 'ok' | 'high' | 'low';
	wasteAmount: number;
	soldGrams: number;
	soldRevenue: number;
	stockStatus: 'ok' | 'low' | 'critical';
}

export interface MeatReport {
	rows: MeatReportRow[];
	totalMeatSoldGrams: number;
	totalPaxServed: number;
	avgMeatPerHead: number;
	avgPorkPerHead: number;
	avgBeefPerHead: number;
	avgChickenPerHead: number;
	byProtein: Record<string, {
		totalStock: number;
		totalSold: number;
		totalWaste: number;
		pctOfTotal: number;
	}>;
}

export function getDateBounds(period: MeatReportPeriod): { start: Date; end: Date } {
	const now = new Date();
	if (period === 'today') {
		const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const end = new Date(start.getTime() + 86400000);
		return { start, end };
	}
	if (period === 'yesterday') {
		const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const start = new Date(end.getTime() - 86400000);
		return { start, end };
	}
	// week: Mon–Sun
	const day = now.getDay();
	const diff = now.getDate() - day + (day === 0 ? -6 : 1);
	const start = new Date(now.getFullYear(), now.getMonth(), diff);
	const end = new Date(start.getTime() + 7 * 86400000);
	return { start, end };
}

export function isInRange(isoDate: string, start: Date, end: Date): boolean {
	const t = new Date(isoDate).getTime();
	return t >= start.getTime() && t < end.getTime();
}

export function meatReport(period: MeatReportPeriod = 'today'): MeatReport {
	const { start, end } = getDateBounds(period);
	const locId = session.locationId;

	const meatStockItems = stockItems.value.filter(s =>
		s.category === 'Meats' && (locId === 'all' || s.locationId === locId)
	);

	// Period-filtered collections
	const periodDeductions = deductions.value.filter(d => isInRange(d.timestamp, start, end));
	const periodWaste = wasteEntries.value.filter(w => isInRange(w.loggedAt, start, end));
	const periodDeliveries = deliveries.value.filter(d => isInRange(d.receivedAt, start, end));

	// Pax from paid orders in period
	const paidOrders = (locId === 'all' ? allOrders.value : allOrders.value.filter(o => o.locationId === locId))
		.filter(o => o.status === 'paid' && isInRange(o.createdAt, start, end));
	const totalPaxServed = paidOrders.reduce((s, o) => s + (o.pax ?? 0), 0);

	// Price lookup for revenue calc
	const menuItemMap = new Map(menuItems.value.map(m => [m.id, m]));

	const rows: MeatReportRow[] = meatStockItems.map(s => {
		const itemDeliveries = periodDeliveries.filter(d => d.stockItemId === s.id);
		const totalDelivered = itemDeliveries.reduce((t, d) => t + d.qty, 0);
		const transferIn = itemDeliveries.filter(d => d.supplier.startsWith('Transfer from')).reduce((t, d) => t + d.qty, 0);
		const totalConsumed = periodDeductions.filter(d => d.stockItemId === s.id).reduce((t, d) => t + d.qty, 0);
		const wasteAmount = periodWaste.filter(w => w.stockItemId === s.id).reduce((t, w) => t + w.qty, 0);
		const closing = getCurrentStock(s.id);
		const available = s.openingStock + totalDelivered;
		const expectedConsumed = available - closing;
		// Variance: (expected - actual) / expected, capped at ±100%
		const rawVariance = expectedConsumed > 0
			? Math.round(((expectedConsumed - totalConsumed) / expectedConsumed) * 100)
			: (totalConsumed === 0 ? 0 : -100);
		const variancePct = Math.max(-100, Math.min(100, rawVariance));
		const hasActivity = totalConsumed > 0 || wasteAmount > 0;
		const trend: 'ok' | 'high' | 'low' = !hasActivity ? 'ok' : variancePct < -15 ? 'high' : variancePct > 15 ? 'low' : 'ok';

		const menuItem = menuItemMap.get(s.menuItemId);
		const pricePerGram = menuItem?.pricePerGram ?? 0;

		const stockStatus = getStockStatus(s.id);

		return {
			id: s.id,
			cut: s.name,
			locationId: s.locationId,
			proteinType: (s.proteinType ?? 'other') as MeatProtein,
			opening: s.openingStock,
			deliveries: totalDelivered,
			transferIn,
			consumed: totalConsumed,
			closing,
			variancePct,
			trend,
			wasteAmount,
			soldGrams: totalConsumed,
			soldRevenue: totalConsumed * pricePerGram,
			stockStatus,
		};
	});

	const totalMeatSoldGrams = rows.reduce((s, r) => s + r.soldGrams, 0);

	// Per-protein aggregation
	const byProtein: MeatReport['byProtein'] = {};
	for (const p of PROTEIN_ORDER) {
		const pRows = rows.filter(r => r.proteinType === p);
		const totalSold = pRows.reduce((s, r) => s + r.soldGrams, 0);
		byProtein[p] = {
			totalStock: pRows.reduce((s, r) => s + r.closing, 0),
			totalSold,
			totalWaste: pRows.reduce((s, r) => s + r.wasteAmount, 0),
			pctOfTotal: totalMeatSoldGrams > 0 ? Math.round((totalSold / totalMeatSoldGrams) * 100) : 0,
		};
	}

	const avgMeatPerHead = totalPaxServed > 0 ? Math.round(totalMeatSoldGrams / totalPaxServed) : 0;
	const avgPorkPerHead = totalPaxServed > 0 ? Math.round((byProtein['pork']?.totalSold ?? 0) / totalPaxServed) : 0;
	const avgBeefPerHead = totalPaxServed > 0 ? Math.round((byProtein['beef']?.totalSold ?? 0) / totalPaxServed) : 0;
	const avgChickenPerHead = totalPaxServed > 0 ? Math.round((byProtein['chicken']?.totalSold ?? 0) / totalPaxServed) : 0;

	return {
		rows,
		totalMeatSoldGrams,
		totalPaxServed,
		avgMeatPerHead,
		avgPorkPerHead,
		avgBeefPerHead,
		avgChickenPerHead,
		byProtein,
	};
}

/** Comparison data for meat report KPIs vs previous period */
export function meatReportComparison(period: MeatReportPeriod): {
	totalSold: PeriodComparison;
	avgPerHead: PeriodComparison;
	paxServed: PeriodComparison;
} | null {
	// Map MeatReportPeriod to previous-period bounds
	const prevMap: Record<MeatReportPeriod, 'today' | 'week' | null> = {
		today: 'today',      // compares to yesterday
		yesterday: null,     // no comparison for yesterday (would need day-before-yesterday)
		week: 'week',        // compares to previous week
	};
	const prevKey = prevMap[period];
	if (!prevKey) return null;

	const { start: prevStart, end: prevEnd } = getPreviousBounds(prevKey);
	const locId = session.locationId;

	const prevOrders = (locId === 'all' ? allOrders.value : allOrders.value.filter(o => o.locationId === locId))
		.filter(o => o.status === 'paid' && isInRange(o.createdAt, prevStart, prevEnd));
	const prevPax = prevOrders.reduce((s, o) => s + (o.pax ?? 0), 0);

	const prevDeductions = deductions.value.filter(d => isInRange(d.timestamp, prevStart, prevEnd));
	const meatStockIds = new Set(
		stockItems.value.filter(s => s.category === 'Meats' && (locId === 'all' || s.locationId === locId)).map(s => s.id)
	);
	const prevSoldGrams = prevDeductions.filter(d => meatStockIds.has(d.stockItemId)).reduce((s, d) => s + d.qty, 0);
	const prevAvg = prevPax > 0 ? Math.round(prevSoldGrams / prevPax) : 0;

	const curr = meatReport(period);

	return {
		totalSold: comparePeriods(curr.totalMeatSoldGrams, prevSoldGrams),
		avgPerHead: comparePeriods(curr.avgMeatPerHead, prevAvg),
		paxServed: comparePeriods(curr.totalPaxServed, prevPax),
	};
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
	const maya   = os.reduce((s, o) => s + o.payments.filter(p => p.method === 'maya').reduce((t, p) => t + p.amount, 0), 0);
	const card   = os.reduce((s, o) => s + o.payments.filter(p => p.method === 'card').reduce((t, p) => t + p.amount, 0), 0);
	return { date: getToday(), grossSales: gross, discounts: disc, netSales: net, vatAmount: vat, cash, card, gcash, maya };
}

/** Period-aware EOD-style payment breakdown (for x-read period filter) */
export function eodSummaryByPeriod(period: 'today' | 'week' | 'month') {
	const os = getPeriodOrders(period);
	const gross  = os.reduce((s, o) => s + o.subtotal, 0);
	const disc   = os.reduce((s, o) => s + o.discountAmount, 0);
	const net    = os.reduce((s, o) => s + o.total, 0);
	const vat    = os.reduce((s, o) => s + o.vatAmount, 0);
	const cash   = os.reduce((s, o) => s + o.payments.filter(p => p.method === 'cash').reduce((t, p) => t + Math.min(p.amount, o.total), 0), 0);
	const gcash  = os.reduce((s, o) => s + o.payments.filter(p => p.method === 'gcash').reduce((t, p) => t + p.amount, 0), 0);
	const maya   = os.reduce((s, o) => s + o.payments.filter(p => p.method === 'maya').reduce((t, p) => t + p.amount, 0), 0);
	const card   = os.reduce((s, o) => s + o.payments.filter(p => p.method === 'card').reduce((t, p) => t + p.amount, 0), 0);
	const totalPax = os.reduce((s, o) => s + (o.pax ?? 0), 0);
	return { date: getToday(), grossSales: gross, discounts: disc, netSales: net, vatAmount: vat, cash, card, gcash, maya, totalPax };
}

// ─── X-Read Mid-Shift Audit ──────────────────────────────────────────────────

// ─── Unified Readings store (x-read + z-read) ────────────────────────────────

export interface Reading {
	id: string;
	type: 'x-read' | 'z-read';
	locationId: string;
	grossSales: number;
	discounts: number;
	netSales: number;
	vatAmount: number;
	totalPax: number;
	cash: number;
	gcash: number;
	maya: number;
	card: number;
	// x-read fields
	timestamp?: string | null;
	voidCount?: number | null;
	voidAmount?: number | null;
	discountCount?: number | null;
	generatedBy?: string | null;
	// z-read fields
	date?: string | null;
	submittedAt?: string | null;
	submittedBy?: string | null;
	cashExpenses?: number | null;
	openingCash?: number | null;
	closingActual?: number | null;
	cashVariance?: number | null;
	updatedAt: string;
}

/** @deprecated Use Reading with type === 'x-read' */
export type XReadSnapshot = Reading & { type: 'x-read' };
/** @deprecated Use Reading with type === 'z-read' */
export type ZReadSnapshot = Reading & { type: 'z-read' };

const _readings = createStore<Reading>('readings', db => db.readings.find().sort({ updatedAt: 'desc' }), { sort: (a, b) => b.updatedAt.localeCompare(a.updatedAt) });

export const xReadHistory = {
	get value() {
		const loc = session.locationId;
		const xreads = _readings.value.filter(r => r.type === 'x-read');
		if (loc === 'all') return xreads;
		return xreads.filter(r => r.locationId === loc);
	},
	get initialized() { return _readings.initialized; }
};

export async function generateXRead(): Promise<Reading> {
	const summary = eodSummary();
	const voids = getOrders().filter(o => o.status === 'cancelled');
	const discounted = getOrders().filter(o =>
		o.status === 'paid' &&
		(o.discountType !== 'none' || Object.keys(o.discountEntries ?? {}).length > 0)
	);
	const paid = getOrders().filter(o => o.status === 'paid');
	const totalPax = paid.reduce((s, o) => s + (o.pax ?? 0), 0);
	const voidAmount = voids.reduce((s, o) => s + (o.total ?? 0), 0);

	const now = new Date().toISOString();
	const snapshot: Reading = {
		id: nanoid(),
		type: 'x-read' as const,
		locationId: session.locationId === 'all' ? 'tag' : session.locationId,
		timestamp: now,
		updatedAt: now,
		grossSales: summary.grossSales,
		discounts: summary.discounts,
		netSales: summary.netSales,
		vatAmount: summary.vatAmount,
		totalPax,
		cash: summary.cash,
		gcash: summary.gcash,
		maya: summary.maya,
		card: summary.card,
		voidCount: voids.length,
		voidAmount,
		discountCount: discounted.length,
		generatedBy: session.userName || 'Staff',
	};

	const col = getWritableCollection('readings');
	await col.insert(snapshot);
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

export function voidsAndDiscountsSummary(period: 'today' | 'week' | 'all' = 'today') {
	const allOs = getOrders();
	const filterByPeriod = (o: { createdAt: string }) =>
		period === 'all' ? true : inPeriod(o.createdAt, period === 'week' ? 'week' : 'today');

	// ── Voids ──────────────────────────────────────────────
	const voided = allOs.filter(o => o.status === 'cancelled' && filterByPeriod(o));
	const mistake = voided.filter(o => o.cancelReason === 'mistake' || !o.cancelReason).length;
	const walkout = voided.filter(o => o.cancelReason === 'walkout').length;
	const writeOff = voided.filter(o => o.cancelReason === 'write_off').length;
	const voidTotalValue = voided.reduce((s, o) => s + o.subtotal, 0);

	// ── Discounts — allocates per-type correctly for multi-entry orders [07] ──
	const paidWithDiscounts = allOs.filter(o =>
		o.status === 'paid' && filterByPeriod(o) &&
		(o.discountType !== 'none' || Object.keys(o.discountEntries ?? {}).length > 0)
	);

	const typeAccum: Record<string, number> = { senior: 0, pwd: 0, promo: 0, comp: 0, service_recovery: 0 };
	for (const o of paidWithDiscounts) {
		const entries = o.discountEntries as Record<string, { pax?: number } | undefined> ?? {};
		const entryKeys = Object.keys(entries);
		if (entryKeys.length > 1) {
			// Multi-type: allocate by pax ratio to avoid double-counting
			const totalPax = entryKeys.reduce((s: number, k: string) => s + (entries[k]?.pax ?? 0), 0);
			for (const k of entryKeys) {
				if (k in typeAccum) {
					const share = totalPax > 0 ? (entries[k]?.pax ?? 0) / totalPax : 1 / entryKeys.length;
					typeAccum[k] += o.discountAmount * share;
				}
			}
		} else if (entryKeys.length === 1) {
			const k = entryKeys[0];
			if (k in typeAccum) typeAccum[k] += o.discountAmount;
		} else {
			// Legacy: single discountType field
			const t = o.discountType;
			if (t && t in typeAccum) typeAccum[t] += o.discountAmount;
		}
	}

	const discountTotalValue = paidWithDiscounts.reduce((s, o) => s + o.discountAmount, 0);

	// ── Comparison context [02] ──────────────────────────
	const allPaid = allOs.filter(o => o.status === 'paid' && filterByPeriod(o));
	const totalOrders = allPaid.length + voided.length;
	const grossSales = allPaid.reduce((s, o) => s + o.subtotal, 0);
	const voidRate = totalOrders > 0 ? (voided.length / totalOrders) * 100 : 0;
	const discountRate = grossSales > 0 ? (discountTotalValue / grossSales) * 100 : 0;

	let prevVoidCount = 0;
	let prevDiscountValue = 0;
	let prevVoidRate = 0;
	let prevDiscountRate = 0;
	let hasPrev = false;
	if (period !== 'all') {
		const mapped = period === 'week' ? 'week' as const : 'today' as const;
		const { start, end } = getPreviousBounds(mapped);
		const prevOrders = allOs.filter(o => {
			const t = new Date(o.createdAt).getTime();
			return t >= start.getTime() && t < end.getTime();
		});
		const prevVoided = prevOrders.filter(o => o.status === 'cancelled');
		const prevPaid = prevOrders.filter(o => o.status === 'paid');
		prevVoidCount = prevVoided.length;
		const prevTotal = prevPaid.length + prevVoided.length;
		prevVoidRate = prevTotal > 0 ? (prevVoided.length / prevTotal) * 100 : 0;
		const prevDiscounted = prevPaid.filter(o =>
			o.discountType !== 'none' || Object.keys(o.discountEntries ?? {}).length > 0
		);
		prevDiscountValue = prevDiscounted.reduce((s, o) => s + o.discountAmount, 0);
		const prevGross = prevPaid.reduce((s, o) => s + o.subtotal, 0);
		prevDiscountRate = prevGross > 0 ? (prevDiscountValue / prevGross) * 100 : 0;
		hasPrev = true;
	}

	const voidRateChange = hasPrev && prevVoidRate > 0 ? ((voidRate - prevVoidRate) / prevVoidRate) * 100 : null;
	const discountRateChange = hasPrev && prevDiscountRate > 0 ? ((discountRate - prevDiscountRate) / prevDiscountRate) * 100 : null;

	return {
		voids: {
			count: voided.length, value: voidTotalValue, mistake, walkout, writeOff,
			items: [...voided].sort((a, b) => b.subtotal - a.subtotal), // [10] sort by value
		},
		discounts: {
			count: paidWithDiscounts.length,
			value: discountTotalValue,
			breakdown: [
				{ label: 'Senior', amount: Math.round(typeAccum.senior) },
				{ label: 'PWD', amount: Math.round(typeAccum.pwd) },
				{ label: 'Promo', amount: Math.round(typeAccum.promo) },
				{ label: 'Comp', amount: Math.round(typeAccum.comp) },
				{ label: 'Service Recovery', amount: Math.round(typeAccum.service_recovery) },
			].filter(r => r.amount > 0).sort((a, b) => b.amount - a.amount), // [05] hide zero rows
			items: [...paidWithDiscounts].sort((a, b) => b.discountAmount - a.discountAmount), // [10] sort by value
		},
		context: {
			voidRate: Math.round(voidRate * 10) / 10,
			discountRate: Math.round(discountRate * 10) / 10,
			voidRateChange,
			discountRateChange,
			prevVoidCount,
			prevDiscountValue,
			prevLabel: period === 'today' ? 'vs yesterday' : period === 'week' ? 'vs last week' : '',
		}
	};
}

// ─── Transaction Log ─────────────────────────────────────────────────────────

export function transactionLog(period: 'today' | 'week' | 'month' | 'all' = 'today') {
	const allOs = getOrders();
	const filtered = period === 'all'
		? allOs.filter(o => o.status === 'paid' || o.status === 'cancelled')
		: allOs.filter(o =>
			(o.status === 'paid' || o.status === 'cancelled') &&
			inPeriod(o.createdAt, period === 'week' ? 'week' : period === 'month' ? 'month' : 'today')
		);

	const sorted = [...filtered].sort((a, b) =>
		(b.closedAt ?? b.createdAt).localeCompare(a.closedAt ?? a.createdAt)
	);

	const paid = sorted.filter(o => o.status === 'paid');
	const voided = sorted.filter(o => o.status === 'cancelled');
	const voidValue = voided.reduce((s, o) => s + o.subtotal, 0);
	const grossSales = paid.reduce((s, o) => s + o.subtotal, 0);
	const netSales = paid.reduce((s, o) => s + o.total, 0);
	const totalDiscount = paid.reduce((s, o) => s + o.discountAmount, 0);
	const totalPax = paid.reduce((s, o) => s + (o.pax ?? 0), 0);
	const avgTicket = paid.length > 0 ? Math.round(netSales / paid.length) : 0;

	// Payment method breakdown
	const byMethod: Record<string, number> = {};
	for (const o of paid) {
		for (const p of o.payments) {
			byMethod[p.method] = (byMethod[p.method] ?? 0) + Math.min(p.amount, o.total);
		}
	}

	// Previous-period comparison (for today/week/month)
	let prevTxCount = 0;
	let prevAvgTicket = 0;
	let hasPrev = false;
	if (period !== 'all') {
		const mapped = period === 'month' ? 'month' as const : period === 'week' ? 'week' as const : 'today' as const;
		const { start, end } = getPreviousBounds(mapped);
		const prevPaid = allOs.filter(o => {
			if (o.status !== 'paid') return false;
			const t = new Date(o.createdAt).getTime();
			return t >= start.getTime() && t < end.getTime();
		});
		prevTxCount = prevPaid.length;
		const prevNet = prevPaid.reduce((s, o) => s + o.total, 0);
		prevAvgTicket = prevPaid.length > 0 ? Math.round(prevNet / prevPaid.length) : 0;
		hasPrev = true;
	}

	const txCountChange = hasPrev && prevTxCount > 0 ? ((paid.length - prevTxCount) / prevTxCount) * 100 : null;
	const avgTicketChange = hasPrev && prevAvgTicket > 0 ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : null;

	return {
		orders: sorted,
		paidCount: paid.length,
		voidCount: voided.length,
		voidValue,
		grossSales,
		netSales,
		totalDiscount,
		totalPax,
		avgTicket,
		paymentBreakdown: Object.entries(byMethod)
			.map(([method, amount]) => ({ method, amount }))
			.sort((a, b) => b.amount - a.amount),
		context: {
			txCountChange,
			avgTicketChange,
			prevTxCount,
			prevAvgTicket,
			prevLabel: period === 'today' ? 'vs yesterday' : period === 'week' ? 'vs last week' : period === 'month' ? 'vs last month' : '',
		}
	};
}

// ─── Sales by Day / Week ─────────────────────────────────────────────────────

export interface DailySalesRow {
	dateKey: string;   // YYYY-MM-DD for sorting
	date: string;      // Formatted label e.g. "Mar 6"
	grossSales: number;
	discounts: number;
	netSales: number;
	vatAmount: number;
	totalPax: number;
	isToday: boolean;
}

export interface WeeklySalesRow {
	weekKey: string;   // YYYY-MM-DD of that Monday
	weekLabel: string; // "Mar 3–Mar 9"
	grossSales: number;
	discounts: number;
	netSales: number;
	vatAmount: number;
	totalPax: number;
}

function toDateKey(iso: string): string {
	return iso.slice(0, 10);
}

function toWeekKey(iso: string): string {
	const d = new Date(iso);
	const day = d.getUTCDay();
	const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // ISO Monday
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff)).toISOString().slice(0, 10);
}

export function salesByDay(days = 14): DailySalesRow[] {
	const todayKey = new Date().toISOString().slice(0, 10);
	const byDay: Record<string, { gross: number; disc: number; vat: number; pax: number }> = {};

	for (const o of getOrders().filter(o => o.status === 'paid')) {
		const key = toDateKey(o.createdAt);
		if (!byDay[key]) byDay[key] = { gross: 0, disc: 0, vat: 0, pax: 0 };
		byDay[key].gross += o.subtotal;
		byDay[key].disc  += o.discountAmount;
		byDay[key].vat   += o.vatAmount;
		byDay[key].pax   += o.pax ?? 0;
	}

	return Object.entries(byDay)
		.map(([dateKey, d]) => ({
			dateKey,
			date: new Date(dateKey + 'T12:00:00Z').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
			grossSales: d.gross,
			discounts: d.disc,
			netSales: d.gross - d.disc,
			vatAmount: d.vat,
			totalPax: d.pax,
			isToday: dateKey === todayKey,
		}))
		.sort((a, b) => b.dateKey.localeCompare(a.dateKey))
		.slice(0, days);
}

export function salesByWeek(weeks = 8): WeeklySalesRow[] {
	const byWeek: Record<string, { gross: number; disc: number; vat: number; pax: number }> = {};

	for (const o of getOrders().filter(o => o.status === 'paid')) {
		const key = toWeekKey(o.createdAt);
		if (!byWeek[key]) byWeek[key] = { gross: 0, disc: 0, vat: 0, pax: 0 };
		byWeek[key].gross += o.subtotal;
		byWeek[key].disc  += o.discountAmount;
		byWeek[key].vat   += o.vatAmount;
		byWeek[key].pax   += o.pax ?? 0;
	}

	return Object.entries(byWeek)
		.map(([weekKey, d]) => {
			const monday = new Date(weekKey + 'T12:00:00Z');
			const sunday = new Date(monday);
			sunday.setUTCDate(sunday.getUTCDate() + 6);
			const fmt = (dt: Date) => dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
			return {
				weekKey,
				weekLabel: `${fmt(monday)}–${fmt(sunday)}`,
				grossSales: d.gross,
				discounts: d.disc,
				netSales: d.gross - d.disc,
				vatAmount: d.vat,
				totalPax: d.pax,
			};
		})
		.sort((a, b) => b.weekKey.localeCompare(a.weekKey))
		.slice(0, weeks);
}

/**
 * Returns true if an ISO date string falls within the given period.
 * Used by report pages to filter orders and expenses consistently.
 */
export function inPeriod(isoDate: string, period: 'today' | 'week' | 'month'): boolean {
	const now = new Date();
	const d = new Date(isoDate);
	if (period === 'today') return isoDate.slice(0, 10) === now.toISOString().slice(0, 10);
	if (period === 'week') {
		const day = now.getDay();
		const diff = now.getDate() - day + (day === 0 ? -6 : 1);
		const weekStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
		return d >= weekStart;
	}
	return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/** Net sales (total after discounts) for a given period — used by expense reports */
export function netSalesByPeriod(period: 'today' | 'week' | 'month'): number {
	const now = new Date();
	const todayKey = now.toISOString().slice(0, 10);
	const thisWeekKey = toWeekKey(now.toISOString());
	return getOrders()
		.filter(o => {
			if (o.status !== 'paid') return false;
			if (period === 'today') return toDateKey(o.createdAt) === todayKey;
			if (period === 'week')  return toWeekKey(o.createdAt) === thisWeekKey;
			const d = new Date(o.createdAt);
			return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
		})
		.reduce((s, o) => s + o.total, 0);
}

// ─── Z-Read (EOD permanent record) ───────────────────────────────────────────

export const zReadHistory = {
	get value() {
		const loc = session.locationId;
		const zreads = _readings.value.filter(r => r.type === 'z-read');
		if (loc === 'all') return zreads;
		return zreads.filter(r => r.locationId === loc);
	},
	get initialized() { return _readings.initialized; }
};

export async function saveZRead(params: Omit<Reading, 'id' | 'type' | 'updatedAt'>): Promise<Reading> {
	const now = new Date().toISOString();
	const snapshot: Reading = { id: nanoid(), type: 'z-read' as const, updatedAt: now, ...params };
	const col = getWritableCollection('readings');
	await col.insert(snapshot);
	writeLog('admin', 'EOD Z-Read submitted', { meta: { date: params.date ?? '', netSales: params.netSales } });
	return snapshot;
}

// ─── Chart / Comparison helpers ──────────────────────────────────────────────

export interface ChartDataPoint {
	label: string;
	primary: number;
	secondary?: number;
	highlight?: boolean;
}

export interface PeriodComparison {
	current: number;
	previous: number;
	changePct: number | null;
}

/** Compute % change between two periods; returns null when previous is 0 */
export function comparePeriods(current: number, previous: number): PeriodComparison {
	const changePct = previous > 0 ? ((current - previous) / previous) * 100 : null;
	return { current, previous, changePct };
}

/** Previous-period date bounds for today/week/month */
export function getPreviousBounds(period: 'today' | 'week' | 'month'): { start: Date; end: Date } {
	const now = new Date();
	if (period === 'today') {
		const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const start = new Date(end.getTime() - 86400000);
		return { start, end };
	}
	if (period === 'week') {
		const day = now.getDay();
		const diff = now.getDate() - day + (day === 0 ? -6 : 1);
		const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
		const prevEnd = weekStart;
		const prevStart = new Date(weekStart.getTime() - 7 * 86400000);
		return { start: prevStart, end: prevEnd };
	}
	// month: previous calendar month
	const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const prevMonthEnd = new Date(thisMonthStart.getTime() - 1);
	const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1);
	return { start: prevMonthStart, end: thisMonthStart };
}

function getPeriodOrders(period: 'today' | 'week' | 'month') {
	const now = new Date();
	const todayKey = now.toISOString().slice(0, 10);
	const thisWeekKey = toWeekKey(now.toISOString());
	return getOrders().filter(o => {
		if (o.status !== 'paid') return false;
		if (period === 'today') return toDateKey(o.createdAt) === todayKey;
		if (period === 'week')  return toWeekKey(o.createdAt) === thisWeekKey;
		const d = new Date(o.createdAt);
		return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
	});
}

function getBoundsOrders(start: Date, end: Date) {
	return getOrders().filter(o => {
		if (o.status !== 'paid') return false;
		const t = new Date(o.createdAt).getTime();
		return t >= start.getTime() && t < end.getTime();
	});
}

/** KPI cards for sales-summary with vs-previous-period % change */
export function salesSummaryWithComparison(period: 'today' | 'week' | 'month') {
	const curr = getPeriodOrders(period);
	const { start, end } = getPreviousBounds(period);
	const prev = getBoundsOrders(start, end);

	function agg(os: typeof curr) {
		const grossSales = os.reduce((s, o) => s + o.subtotal, 0);
		const discounts  = os.reduce((s, o) => s + o.discountAmount, 0);
		const netSales   = os.reduce((s, o) => s + o.total, 0);
		const totalPax   = os.reduce((s, o) => s + (o.pax ?? 0), 0);
		const avgTicket  = totalPax > 0 ? Math.round(netSales / totalPax) : 0;
		return { grossSales, discounts, netSales, totalPax, avgTicket };
	}

	const c = agg(curr);
	const p = agg(prev);

	return {
		grossSales: comparePeriods(c.grossSales, p.grossSales),
		netSales:   comparePeriods(c.netSales,   p.netSales),
		discounts:  comparePeriods(c.discounts,  p.discounts),
		totalPax:   comparePeriods(c.totalPax,   p.totalPax),
		avgTicket:  comparePeriods(c.avgTicket,  p.avgTicket),
	};
}

/** salesByDay() returns newest-first — reverse for charting */
export function salesByDayForChart(days = 14): ChartDataPoint[] {
	const todayKey = new Date().toISOString().slice(0, 10);
	return salesByDay(days)
		.slice()
		.reverse()
		.map(r => ({
			label: r.isToday ? 'Today' : r.date,
			primary: r.grossSales,
			secondary: r.netSales,
			highlight: r.dateKey === todayKey,
		}));
}

export function salesByWeekForChart(weeks = 8): ChartDataPoint[] {
	return salesByWeek(weeks)
		.slice()
		.reverse()
		.map(r => ({
			label: r.weekLabel.split('–')[0], // show start of week only
			primary: r.grossSales,
			secondary: r.netSales,
		}));
}

/** Period-aware best-sellers for meat cuts */
export function bestSellersMeatPeriod(period?: 'today' | 'week' | 'month'): ReturnType<typeof bestSellersMeat> {
	if (!period) return bestSellersMeat();
	const { start, end } = period === 'today' ? getDateBounds('today') :
	                        period === 'week'  ? getDateBounds('week') :
	                        (() => {
	                        	const now = new Date();
	                        	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	                        	const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	                        	return { start, end };
	                        })();
	const locId = session.locationId;
	const stockById = new Map(stockItems.value.map(s => [s.id, s]));
	const menuById = new Map(menuItems.value.map(m => [m.id, m]));

	const weightByItem: Record<string, number> = {};
	for (const ded of deductions.value.filter(d => isInRange(d.timestamp, start, end))) {
		const stockItem = stockById.get(ded.stockItemId);
		if (!stockItem) continue;
		if (locId !== 'all' && stockItem.locationId !== locId) continue;
		const menuItem = menuById.get(stockItem.menuItemId);
		if (!menuItem || !menuItem.isWeightBased) continue;
		weightByItem[menuItem.id] = (weightByItem[menuItem.id] ?? 0) + ded.qty;
	}
	return Object.entries(weightByItem)
		.map(([id, weight]) => {
			const item = menuById.get(id)!;
			const revenue = weight * (item.pricePerGram ?? 0);
			return { name: item.name, weightGrams: weight, revenue };
		})
		.sort((a, b) => b.weightGrams - a.weightGrams)
		.map((row, i) => ({ rank: i + 1, ...row }));
}

/** Period-aware best-sellers for add-ons */
export function bestSellersAddonsPeriod(period?: 'today' | 'week' | 'month'): ReturnType<typeof bestSellersAddons> {
	if (!period) return bestSellersAddons();
	const menuById = new Map(menuItems.value.map(m => [m.id, m]));

	const now = new Date();
	const todayKey = now.toISOString().slice(0, 10);
	const thisWeekKey = toWeekKey(now.toISOString());
	const qtsByItem: Record<string, { name: string; qty: number; revenue: number }> = {};
	const filtered = getOrders().filter(o => {
		if (o.status !== 'paid') return false;
		if (period === 'today') return toDateKey(o.createdAt) === todayKey;
		if (period === 'week')  return toWeekKey(o.createdAt) === thisWeekKey;
		const d = new Date(o.createdAt);
		return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
	});
	for (const order of filtered) {
		for (const item of order.items) {
			if (item.tag === 'FREE' || item.tag === 'PKG') continue;
			const menuItem = menuById.get(item.menuItemId);
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

export interface TableSalesRow {
	tableId: string;
	label: string;
	zone: string;
	locationId: string;
	sessions: number;
	pax: number;
	grossSales: number;
	discounts: number;
	netSales: number;
}

const BRANCH_PREFIX: Record<string, string> = { tag: 'TAG', pgl: 'PGL' };

/** Table sales filtered by period — includes locationId + branch-prefixed labels in "all" mode */
export function tableSalesByPeriod(period: 'today' | 'week' | 'month'): TableSalesRow[] {
	const now = new Date();
	const todayKey = now.toISOString().slice(0, 10);
	const thisWeekKey = toWeekKey(now.toISOString());
	const isAll = session.locationId === 'all';
	const grouped: Record<string, TableSalesRow> = {};
	const filtered = getOrders().filter(o => {
		if (o.status !== 'paid') return false;
		if (period === 'today') return toDateKey(o.createdAt) === todayKey;
		if (period === 'week')  return toWeekKey(o.createdAt) === thisWeekKey;
		const d = new Date(o.createdAt);
		return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
	});
	for (const order of filtered) {
		// In "all" mode, key by locationId+tableId to separate branches
		const baseKey = order.tableId ?? 'takeout';
		const key = isAll ? `${order.locationId}::${baseKey}` : baseKey;
		const table = order.tableId ? getTables().find(t => t.id === order.tableId) : null;
		if (!grouped[key]) {
			const baseLabel = table?.label ?? (order.orderType === 'takeout' ? 'Takeout' : baseKey);
			const prefix = isAll ? BRANCH_PREFIX[order.locationId] ?? order.locationId.toUpperCase() : '';
			grouped[key] = {
				tableId: key,
				label: prefix ? `${prefix}-${baseLabel}` : baseLabel,
				zone: table?.zone ?? 'takeout',
				locationId: order.locationId,
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

/** Comparison aggregates for table sales KPIs — current vs previous period */
export function tableSalesComparison(period: 'today' | 'week' | 'month') {
	const current = tableSalesByPeriod(period);
	const { start, end } = getPreviousBounds(period);
	const prevOrders = getBoundsOrders(start, end);

	const cSessions = current.reduce((s, r) => s + r.sessions, 0);
	const cPax      = current.reduce((s, r) => s + r.pax, 0);
	const cNet      = current.reduce((s, r) => s + r.netSales, 0);
	const cAvgPax   = cPax > 0 ? Math.round(cNet / cPax) : 0;

	// Aggregate previous period
	const pSessions = prevOrders.length;
	const pPax      = prevOrders.reduce((s, o) => s + (o.pax ?? 0), 0);
	const pNet      = prevOrders.reduce((s, o) => s + o.total, 0);
	const pAvgPax   = pPax > 0 ? Math.round(pNet / pPax) : 0;

	return {
		sessions: comparePeriods(cSessions, pSessions),
		totalPax: comparePeriods(cPax, pPax),
		netSales: comparePeriods(cNet, pNet),
		avgPerPax: comparePeriods(cAvgPax, pAvgPax),
	};
}

/** Horizontal bar chart rows for staff performance */
export function staffPerformanceForChart(period: 'today' | 'week' | 'month'): { label: string; value: number; subLabel: string }[] {
	const now = new Date();
	const todayKey = now.toISOString().slice(0, 10);
	const thisWeekKey = toWeekKey(now.toISOString());
	const byStaff: Record<string, { revenue: number; orders: number }> = {};
	for (const o of getOrders().filter(o => o.status === 'paid' && o.closedBy)) {
		const passes = period === 'today' ? toDateKey(o.createdAt) === todayKey :
		               period === 'week'  ? toWeekKey(o.createdAt) === thisWeekKey :
		               (() => { const d = new Date(o.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })();
		if (!passes) continue;
		const name = o.closedBy!;
		if (!byStaff[name]) byStaff[name] = { revenue: 0, orders: 0 };
		byStaff[name].revenue += o.total;
		byStaff[name].orders++;
	}
	return Object.entries(byStaff)
		.sort((a, b) => b[1].revenue - a[1].revenue)
		.map(([label, d]) => ({
			label,
			value: d.revenue,
			subLabel: `${d.orders} order${d.orders !== 1 ? 's' : ''}`,
		}));
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export const utilitySettings = $state({
	electricityPerKwh: 12,
	gasPerKg: 85,
	waterPerM3: 50,
});

export interface UtilityReading {
	id: string;
	date: string;
	electricity: number;
	gas: number;
	water: number;
	recordedBy: string;
}

// Utility readings are stored as audit log entries (action='admin', description='EOD Utility Reading')
// This avoids a dedicated collection and keeps us under the RxDB OSS 16-collection limit.
export const utilityReadings = {
	get value(): UtilityReading[] {
		return auditLog.value
			.filter(e => e.description === 'EOD Utility Reading' && e.meta)
			.map(e => {
				try {
					const meta = JSON.parse(e.meta!);
					return { id: e.id, date: e.isoTimestamp, electricity: Number(meta.electricity) || 0, gas: Number(meta.gas) || 0, water: Number(meta.water) || 0, recordedBy: e.user };
				} catch { return null; }
			})
			.filter((r): r is UtilityReading => r !== null);
	}
};

export function getPreviousUtilityReading(): UtilityReading | null {
	const readings = utilityReadings.value;
	if (readings.length === 0) return null;
	return readings[0]; // auditLog is sorted desc, so first match is most recent
}

export async function saveUtilityReading(electricity: number, gas: number, water: number = 0) {
	writeLog('admin', 'EOD Utility Reading', { meta: { electricity, gas, water } });
}

// ─── Expense chart helpers ────────────────────────────────────────────────────

/** Daily expense totals for the last N days — oldest first, suitable for bar chart */
export function expensesByDayForChart(days = 14): ChartDataPoint[] {
	const todayKey = new Date().toISOString().slice(0, 10);
	const byDay: Record<string, number> = {};
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		byDay[d.toISOString().slice(0, 10)] = 0;
	}
	const locId = session.locationId;
	for (const e of allExpenses.value) {
		if (locId !== 'all' && e.locationId !== locId) continue;
		const key = e.createdAt.slice(0, 10);
		if (key in byDay) byDay[key] += e.amount;
	}
	return Object.entries(byDay).map(([key, amount]) => ({
		label: new Date(key + 'T12:00:00Z').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
		primary: amount,
		highlight: key === todayKey,
	}));
}

/** Monthly expense totals for the last N months — oldest first, suitable for bar chart.
 *  When trimLeadingZeros is true, strips months with no data from the start. */
export function expensesByMonthForChart(months = 12, trimLeadingZeros = false): ChartDataPoint[] {
	const now = new Date();
	const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	const byMonth: Record<string, number> = {};
	for (let i = months - 1; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		byMonth[key] = 0;
	}
	const locId = session.locationId;
	for (const e of allExpenses.value) {
		if (locId !== 'all' && e.locationId !== locId) continue;
		const key = e.createdAt.slice(0, 7); // YYYY-MM
		if (key in byMonth) byMonth[key] += e.amount;
	}
	let entries = Object.entries(byMonth);
	if (trimLeadingZeros) {
		const firstNonZero = entries.findIndex(([, v]) => v > 0);
		if (firstNonZero > 0) entries = entries.slice(firstNonZero);
	}
	return entries.map(([key, amount]) => ({
		label: new Date(key + '-01T12:00:00Z').toLocaleDateString('en-PH', { month: 'short' }),
		primary: amount,
		highlight: key === thisMonthKey,
	}));
}

/** Expense KPI totals with % change vs the previous period */
export function expenseSummaryWithComparison(period: 'today' | 'week' | 'month') {
	const locId = session.locationId;
	const currTotal = allExpenses.value
		.filter(e => {
			if (locId !== 'all' && e.locationId !== locId) return false;
			return inPeriod(e.createdAt, period);
		})
		.reduce((s, e) => s + e.amount, 0);
	const { start: prevStart, end: prevEnd } = getPreviousBounds(period);
	const prevTotal = allExpenses.value
		.filter(e => {
			if (locId !== 'all' && e.locationId !== locId) return false;
			const t = new Date(e.createdAt).getTime();
			return t >= prevStart.getTime() && t < prevEnd.getTime();
		})
		.reduce((s, e) => s + e.amount, 0);
	const sales = netSalesByPeriod(period);

	// Previous-period sales for comparison [03]
	const prevSales = getOrders()
		.filter(o => {
			if (o.status !== 'paid') return false;
			const t = new Date(o.createdAt).getTime();
			return t >= prevStart.getTime() && t < prevEnd.getTime();
		})
		.reduce((s, o) => s + o.total, 0);

	const currCashFlow = sales - currTotal;
	const prevCashFlow = prevSales - prevTotal;
	const currRatio = sales > 0 ? currTotal / sales : null;
	const prevRatio = prevSales > 0 ? prevTotal / prevSales : null;

	return {
		total: comparePeriods(currTotal, prevTotal),
		sales,
		salesComparison: comparePeriods(sales, prevSales),
		netCashFlow: currCashFlow,
		cashFlowComparison: comparePeriods(currCashFlow, prevCashFlow),
		expenseRatio: currRatio,
		ratioComparison: currRatio !== null && prevRatio !== null
			? { current: currRatio * 100, previous: prevRatio * 100, changePct: prevRatio > 0 ? ((currRatio - prevRatio) / prevRatio) * 100 : null }
			: null,
	};
}
