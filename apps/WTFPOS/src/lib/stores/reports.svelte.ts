/**
 * Reports Store — Svelte 5 Runes
 * All report data derived from live POS orders, stock, and audit log state.
 * Import specific derived values here instead of duplicating per page.
 */
import { orders, MENU_ITEMS, tables } from '$lib/stores/pos.svelte';
import { stockItems, deliveries, wasteEntries, deductions, getCurrentStock } from '$lib/stores/stock.svelte';

const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

export function liveOrders() { return orders; }

export function todayClosedOrders() { return orders.filter(o => o.status === 'paid'); }

export function salesSummary() {
	const allOrders = orders; // includes open (live) for today
	const grossSales   = allOrders.reduce((s, o) => s + o.subtotal, 0);
	const discounts    = allOrders.reduce((s, o) => s + o.discountAmount, 0);
	const netSales     = allOrders.reduce((s, o) => s + o.total, 0);
	const vatAmount    = allOrders.reduce((s, o) => s + o.vatAmount, 0);
	const totalPax     = allOrders.reduce((s, o) => s + (o.pax ?? 0), 0);
	const avgTicket    = totalPax > 0 ? Math.round(netSales / totalPax) : 0;
	return { grossSales, discounts, netSales, vatAmount, totalPax, avgTicket, date: today };
}

export function tableSalesToday() {
	const grouped: Record<string, { tableId: string; label: string; zone: string; sessions: number; pax: number; grossSales: number; discounts: number; netSales: number }> = {};
	for (const order of orders) {
		const table = tables.find(t => t.id === order.tableId);
		if (!grouped[order.tableId]) {
			grouped[order.tableId] = {
				tableId: order.tableId,
				label: table?.label ?? order.tableId,
				zone: table?.zone ?? 'main',
				sessions: 0, pax: 0, grossSales: 0, discounts: 0, netSales: 0,
			};
		}
		grouped[order.tableId].sessions += 1;
		grouped[order.tableId].pax += order.pax ?? 0;
		grouped[order.tableId].grossSales += order.subtotal;
		grouped[order.tableId].discounts += order.discountAmount;
		grouped[order.tableId].netSales += order.total;
	}
	return Object.values(grouped).sort((a, b) => b.netSales - a.netSales);
}

export function bestSellersMeat() {
	const weightByItem: Record<string, number> = {};
	for (const ded of deductions) {
		const stockItem = stockItems.find(s => s.id === ded.stockItemId);
		if (!stockItem) continue;
		const menuItem = MENU_ITEMS.find(m => m.id === stockItem.menuItemId && m.isWeightBased);
		if (!menuItem) continue;
		weightByItem[menuItem.id] = (weightByItem[menuItem.id] ?? 0) + ded.qty;
	}
	return Object.entries(weightByItem)
		.map(([id, weight]) => {
			const item = MENU_ITEMS.find(m => m.id === id)!;
			const revenue = weight * (item.pricePerGram ?? 0);
			return { name: item.name, weightGrams: weight, revenue };
		})
		.sort((a, b) => b.weightGrams - a.weightGrams)
		.map((row, i) => ({ rank: i + 1, ...row }));
}

export function bestSellersAddons() {
	const qtsByItem: Record<string, { name: string; qty: number; revenue: number }> = {};
	for (const order of orders) {
		for (const item of order.items) {
			if (item.tag === 'FREE' || item.tag === 'PKG') continue;
			const menuItem = MENU_ITEMS.find(m => m.id === item.menuItemId);
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
	const meatStockItems = stockItems.filter(s => s.category === 'Meats');
	return meatStockItems.map(s => {
		const totalDelivered = deliveries.filter(d => d.stockItemId === s.id).reduce((t, d) => t + d.qty, 0);
		const totalWasted    = wasteEntries.filter(w => w.stockItemId === s.id).reduce((t, w) => t + w.qty, 0);
		const totalConsumed  = deductions.filter(d => d.stockItemId === s.id).reduce((t, d) => t + d.qty, 0);
		const closing        = getCurrentStock(s.id);
		const available      = s.openingStock + totalDelivered;
		const expectedConsumed = available - closing;
		const variancePct    = available > 0 ? Math.round(((totalConsumed - expectedConsumed) / available) * 100) : 0;
		const trend          = variancePct < -15 ? 'high' : variancePct > 10 ? 'low' : 'ok';
		return {
			cut: s.name,
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
	const gross    = orders.reduce((s, o) => s + o.subtotal, 0);
	const disc     = orders.reduce((s, o) => s + o.discountAmount, 0);
	const net      = orders.reduce((s, o) => s + o.total, 0);
	const vat      = orders.reduce((s, o) => s + o.vatAmount, 0);
	const cash = Math.round(net * 0.53);
	const card = Math.round(net * 0.41);
	const gcash = net - cash - card;
	return { date: today, grossSales: gross, discounts: disc, netSales: net, vatAmount: vat, cash, card, gcash };
}
