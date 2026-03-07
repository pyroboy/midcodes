/**
 * Reports Store — Svelte 5 Runes
 * All report data derived from live POS orders, stock, and audit log state.
 * Import specific derived values here instead of duplicating per page.
 */
import { orders as allOrders, tables as allTables, menuItems } from '$lib/stores/pos.svelte';
import { stockItems, deliveries, deductions, wasteEntries, getCurrentStock, getStockStatus } from '$lib/stores/stock.svelte';
import { PROTEIN_ORDER, type MeatProtein } from '$lib/stores/stock.constants';
import { session } from '$lib/stores/session.svelte';
import { log, auditLog, writeLog } from '$lib/stores/audit.svelte';
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
		const variancePct = available > 0 ? Math.round(((totalConsumed - expectedConsumed) / available) * 100) : 0;
		const trend = variancePct < -15 ? 'high' : variancePct > 10 ? 'low' : 'ok';

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
			trend: trend as 'ok' | 'high' | 'low',
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

// Utility readings are stored as audit log entries (action='admin', description='EOD Utility Reading')
// This avoids a dedicated collection and keeps us under the RxDB OSS 16-collection limit.
export const utilityReadings = {
	get value(): UtilityReading[] {
		return auditLog.value
			.filter(e => e.description === 'EOD Utility Reading' && e.meta)
			.map(e => {
				try {
					const meta = JSON.parse(e.meta!);
					return { id: e.id, date: e.isoTimestamp, electricity: Number(meta.electricity) || 0, gas: Number(meta.gas) || 0, recordedBy: e.user };
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

export async function saveUtilityReading(electricity: number, gas: number) {
	writeLog('admin', 'EOD Utility Reading', { meta: { electricity, gas } });
}
