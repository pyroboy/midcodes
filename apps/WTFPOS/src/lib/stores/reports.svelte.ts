/**
 * Reports Store — Svelte 5 Runes
 * All report data derived from live POS orders, stock, and audit log state.
 * Import specific derived values here instead of duplicating per page.
 */
import { orders as allOrders, tables as allTables, menuItems } from '$lib/stores/pos.svelte';
import { stockItems, deliveries, deductions, getCurrentStock } from '$lib/stores/stock.svelte';
import { session } from '$lib/stores/session.svelte';

// Branch-filtered getters — $derived can't be exported from modules, so we
// filter inside each exported function call (which runs in a reactive context).
function getOrders() { return session.locationId === 'all' ? allOrders : allOrders.filter(o => o.locationId === session.locationId); }
function getTables() { return session.locationId === 'all' ? allTables : allTables.filter(t => t.locationId === session.locationId); }

const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

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
	return { grossSales, discounts, netSales, vatAmount, totalPax, avgTicket, date: today };
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
	for (const ded of deductions) {
		const stockItem = stockItems.find(s => s.id === ded.stockItemId);
		if (!stockItem) continue;
		const menuItem = menuItems.find(m => m.id === stockItem.menuItemId && m.isWeightBased);
		if (!menuItem) continue;
		weightByItem[menuItem.id] = (weightByItem[menuItem.id] ?? 0) + ded.qty;
	}
	return Object.entries(weightByItem)
		.map(([id, weight]) => {
			const item = menuItems.find(m => m.id === id)!;
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
			const menuItem = menuItems.find(m => m.id === item.menuItemId);
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
	const meatStockItems = stockItems.filter(s =>
		s.category === 'Meats' &&
		(session.locationId === 'all' || s.locationId === session.locationId)
	);
	return meatStockItems.map(s => {
		const totalDelivered = deliveries.filter(d => d.stockItemId === s.id).reduce((t, d) => t + d.qty, 0);
		const totalConsumed  = deductions.filter(d => d.stockItemId === s.id).reduce((t, d) => t + d.qty, 0);
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
	return { date: today, grossSales: gross, discounts: disc, netSales: net, vatAmount: vat, cash, card, gcash };
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
