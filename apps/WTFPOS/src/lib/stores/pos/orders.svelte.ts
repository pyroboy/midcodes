/**
 * POS Orders — Order state, item management, table operations, and lifecycle.
 * Imports closeTable from tables (no circular dep since tables doesn't import orders).
 */
import type { Order, MenuItem, TakeoutStatus, SubBill, DiscountType } from '$lib/types';
import { nanoid } from 'nanoid';
import { deductFromStock, restoreStock } from '$lib/stores/stock.svelte';
import { log } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';
import { createRxStore } from '$lib/stores/sync.svelte';
import { getDb } from '$lib/db';
import { browser } from '$app/environment';
import { closeTable, tables } from '$lib/stores/pos/tables.svelte';
import { kdsTickets } from '$lib/stores/pos/kds.svelte';
import { calculateOrderTotals } from '$lib/stores/pos/utils';
import { deriveOrderItemProps } from '$lib/stores/pos/item.utils';
import { calculateLeftoverPenalty } from '$lib/stores/pos/payment.utils';

const _orders = createRxStore<Order>('orders', db => db.orders.find());

export const orders = {
	get value() { return _orders.value; },
	get initialized() { return _orders.initialized; }
};

// ─── Takeout ─────────────────────────────────────────────────────────────────

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
		updatedAt: new Date().toISOString(),
		closedAt: null,
		billPrinted: false,
		notes: ''
	});

	log.tableOpened(`Takeout (${customerName})`, null, 1);
	return orderId;
}

// ─── Order Actions ────────────────────────────────────────────────────────────

export function getOrder(orderId: string) { return orders.value.find((o) => o.id === orderId); }

export async function addItemToOrder(orderId: string, item: MenuItem, qty: number, weight?: number, forceFree: boolean = false, notes?: string) {
	const db = await getDb();
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (!orderDoc) return;

	const order = orderDoc.toMutableJSON() as Order;

	const { unitPrice, quantity, tag } = deriveOrderItemProps(item, order.pax, qty, weight, forceFree);

	const newItem = { id: nanoid(), menuItemId: item.id, menuItemName: item.name, quantity, unitPrice, weight: weight ?? null, status: 'pending' as const, sentAt: null, tag, notes: notes ?? '' };

	let totals: ReturnType<typeof calculateOrderTotals>;
	await orderDoc.incrementalModify((doc: Order) => {
		const updatedItems = [...doc.items, newItem];
		totals = calculateOrderTotals({ ...doc, items: updatedItems } as Order);
		doc.packageId = item.category === 'packages' ? item.id : doc.packageId;
		doc.packageName = item.category === 'packages' ? item.name : doc.packageName;
		doc.items = updatedItems;
		Object.assign(doc, totals);
		doc.updatedAt = new Date().toISOString();
		return doc;
	});
	totals = totals!;

	if (order.tableId) {
		const tableDoc = await db.tables.findOne(order.tableId).exec();
		if (tableDoc) await tableDoc.incrementalPatch({ billTotal: totals.total, updatedAt: new Date().toISOString() });
	}

	const deductQty = item.isWeightBased ? (weight ?? 0) : qty;
	if (deductQty > 0) {
		await deductFromStock(item.id, deductQty, order.tableId ?? 'takeout', order.id, item.trackInventory ?? false);
	}

	// KDS Ticket
	const ticket = kdsTickets.value.find((t) => t.orderId === orderId);
	const kdsItem = { id: newItem.id, menuItemName: item.name, quantity: qty, status: 'pending' as const, weight: weight ?? null, category: item.category ?? '', notes: notes ?? '' };

	if (ticket) {
		const tDoc = await db.kds_tickets.findOne(ticket.id).exec();
		if (tDoc) {
			await tDoc.incrementalModify((doc: any) => {
				doc.items = [...doc.items, kdsItem];
				doc.updatedAt = new Date().toISOString();
				return doc;
			});
		}
	} else {
		await db.kds_tickets.insert({
			id: nanoid(),
			orderId,
			tableNumber: order.tableNumber,
			customerName: order.customerName,
			items: [kdsItem],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});
	}

	const tableLabel = order.tableId ? (tables.value.find(t => t.id === order.tableId)?.label ?? order.tableId) : 'Takeout';
	log.itemCharged(item.name, tableLabel, weight ?? null, qty);
}

export async function recalcOrder(
	order: Order,
	overrides?: { discountType?: DiscountType; discountPax?: number; discountIds?: string[] }
) {
	if (!browser) return;
	const db = await getDb();
	const orderDoc = await db.orders.findOne(order.id).exec();
	if (!orderDoc) return;

	let finalTotal = 0;
	await orderDoc.incrementalModify((doc: Order) => {
		doc.items = order.items;
		doc.discountType = overrides?.discountType ?? order.discountType;
		doc.discountPax   = overrides?.discountPax  ?? order.discountPax;
		doc.discountIds   = overrides?.discountIds  ?? order.discountIds;
		const totals = calculateOrderTotals(doc);
		Object.assign(doc, totals);
		finalTotal = totals.total;
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	if (order.tableId) {
		const tableDoc = await db.tables.findOne(order.tableId).exec();
		if (tableDoc) await tableDoc.incrementalPatch({ billTotal: finalTotal, updatedAt: new Date().toISOString() });
	}
}

export async function voidOrder(orderId: string, reason?: 'mistake' | 'walkout' | 'write_off') {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status === 'paid' || order.status === 'cancelled') return;

	const db = await getDb();
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (orderDoc) {
		await orderDoc.incrementalModify((doc: Order) => {
			doc.items = doc.items.map(item => {
				if (item.status !== 'cancelled') {
					const restoreQty = item.weight ?? item.quantity;
					if (restoreQty > 0) restoreStock(item.menuItemId, restoreQty, order.id, doc.locationId);
					return { ...item, status: 'cancelled' as const };
				}
				return item;
			});
			doc.status = 'cancelled';
			doc.cancelReason = reason;
			doc.closedAt = new Date().toISOString();
			if (doc.orderType === 'takeout') doc.takeoutStatus = 'new';
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		const tDoc = await db.kds_tickets.findOne(ticket.id).exec();
		if (tDoc) await tDoc.remove();
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
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (!orderDoc) {
		console.warn(`[markItemServed] Order ${orderId} not found`);
		return;
	}

	let servedItemName = 'Item';
	await orderDoc.incrementalModify((doc: Order) => {
		doc.items = doc.items.map(i => {
			if (i.id === itemId) { servedItemName = i.menuItemName; return { ...i, status: 'served' as const }; }
			return i;
		});
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		const tDoc = await db.kds_tickets.findOne(ticket.id).exec();
		if (tDoc) {
			let allServed = false;
			let snapshotItems: typeof ticket.items = [];
			await tDoc.incrementalModify((doc: any) => {
				doc.items = doc.items.map((i: any) => i.id === itemId ? { ...i, status: 'served' } : i);
				allServed = doc.items.every((i: any) => i.status === 'served' || i.status === 'cancelled');
				snapshotItems = doc.items;
				doc.updatedAt = new Date().toISOString();
				return doc;
			});

			if (allServed) {
				await db.kds_history.insert({
					...structuredClone(ticket),
					items: snapshotItems,
					bumpedAt: new Date().toISOString(),
					bumpedBy: session.userName || 'Kitchen',
					updatedAt: new Date().toISOString()
				});
				await tDoc.remove();

				if (order.orderType === 'takeout' && order.status === 'open') {
					const oDoc = await db.orders.findOne(orderId).exec();
					if (oDoc) await oDoc.incrementalPatch({ takeoutStatus: 'ready', updatedAt: new Date().toISOString() });
					log.takeoutAdvanced(order.customerName ?? 'Walk-in', 'ready');
				}
			}
		}
	}
	log.itemServed(servedItemName, order.tableNumber);
}

export async function rejectOrderItem(orderId: string, itemId: string, reason: string = 'Kitchen Reject') {
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;

	const db = await getDb();
	const item = order.items.find(i => i.id === itemId);
	if (!item || item.status === 'cancelled') return;

	let finalTotal = order.total;
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (orderDoc) {
		await orderDoc.incrementalModify((doc: Order) => {
			doc.items = doc.items.map(i => i.id === itemId ? { ...i, status: 'cancelled' as const } : i);
			const totals = calculateOrderTotals(doc);
			Object.assign(doc, totals);
			finalTotal = totals.total;
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	if (order.tableId) {
		const tableDoc = await db.tables.findOne(order.tableId).exec();
		if (tableDoc) await tableDoc.incrementalPatch({ billTotal: finalTotal, updatedAt: new Date().toISOString() });
	}

	const restoreQty = item.weight ?? item.quantity;
	if (restoreQty > 0) restoreStock(item.menuItemId, restoreQty, order.id, order.locationId);
	log.kitchenRefusal(item.menuItemName, order.tableNumber, reason);
}

// ─── Pax / Penalty ───────────────────────────────────────────────────────────

export async function changePax(orderId: string, newPax: number) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'open') return;

	const MAX_PAX = 50;
	if (newPax < 1 || newPax > MAX_PAX) return;

	const oldPax = order.pax;
	if (newPax === oldPax) return;

	const db = await getDb();
	let finalTotal = 0;
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (orderDoc) {
		await orderDoc.incrementalModify((doc: Order) => {
			if (doc.packageId) {
				doc.items = doc.items.map(i =>
					(i.menuItemId === doc.packageId && i.tag === 'PKG') ? { ...i, quantity: newPax } : i
				);
			}
			doc.originalPax = doc.originalPax || oldPax;
			doc.pax = newPax;
			const totals = calculateOrderTotals(doc);
			Object.assign(doc, totals);
			finalTotal = totals.total;
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	if (order.tableId) {
		const tableDoc = await db.tables.findOne(order.tableId).exec();
		if (tableDoc) await tableDoc.incrementalPatch({ billTotal: finalTotal, updatedAt: new Date().toISOString() });
	}

	const tableLabel = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.paxChanged(tableLabel, oldPax, newPax);
}

export async function applyLeftoverPenalty(orderId: string, weightGrams: number, ratePerHundredGrams: number = 50) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || weightGrams <= 0) return;

	const db = await getDb();
	const penalty = calculateLeftoverPenalty(weightGrams, ratePerHundredGrams);
	const penaltyItem = {
		id: nanoid(), menuItemId: 'penalty-leftover', menuItemName: 'Leftover Penalty',
		quantity: 1, unitPrice: penalty, weight: weightGrams, status: 'served' as const, sentAt: null, tag: null as 'PKG' | 'FREE' | null,
		notes: `${weightGrams}g leftover @ ₱${ratePerHundredGrams}/100g`
	};

	let finalTotal = 0;
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (orderDoc) {
		await orderDoc.incrementalModify((doc: Order) => {
			doc.items = [...doc.items, penaltyItem];
			doc.leftoverPenaltyAmount = penalty;
			const totals = calculateOrderTotals(doc);
			Object.assign(doc, totals);
			finalTotal = totals.total;
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	if (order.tableId) {
		const tableDoc = await db.tables.findOne(order.tableId).exec();
		if (tableDoc) await tableDoc.incrementalPatch({ billTotal: finalTotal, updatedAt: new Date().toISOString() });
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
	let finalTotal = 0;
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (orderDoc) {
		await orderDoc.incrementalModify((doc: Order) => {
			doc.items = doc.items.filter(i => i.menuItemId !== 'penalty-leftover');
			doc.leftoverPenaltyAmount = 0;
			const totals = calculateOrderTotals(doc);
			Object.assign(doc, totals);
			finalTotal = totals.total;
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	if (order.tableId) {
		const tableDoc = await db.tables.findOne(order.tableId).exec();
		if (tableDoc) await tableDoc.incrementalPatch({ billTotal: finalTotal, updatedAt: new Date().toISOString() });
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
		const doc = await db.orders.findOne(orderId).exec();
		if (doc) await doc.incrementalPatch({ takeoutStatus: next, updatedAt: new Date().toISOString() });
		log.takeoutAdvanced(order.customerName ?? 'Walk-in', next);
	}
}

export async function setTakeoutStatus(orderId: string, status: TakeoutStatus): Promise<void> {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.orderType !== 'takeout') return;

	const db = await getDb();
	const doc = await db.orders.findOne(orderId).exec();
	if (doc) {
		await doc.incrementalPatch({ takeoutStatus: status, updatedAt: new Date().toISOString() });
		log.takeoutAdvanced(order.customerName ?? 'Walk-in', status);
	}
}

// ─── Table Transfer & Merge ───────────────────────────────────────────────────

export async function transferTable(fromTableId: string, toTableId: string): Promise<{ success: boolean; error?: string }> {
	const fromTable = tables.value.find(t => t.id === fromTableId);
	const toTable = tables.value.find(t => t.id === toTableId);
	if (!fromTable || !toTable || toTable.status !== 'available' || !fromTable.currentOrderId) return { success: false, error: 'Invalid tables or table not available' };
	if (fromTable.locationId !== toTable.locationId) return { success: false, error: 'Cannot transfer between locations' };

	const db = await getDb();
	const orderId = fromTable.currentOrderId;

	const toTableDoc = await db.tables.findOne(toTableId).exec();
	const fromTableDoc = await db.tables.findOne(fromTableId).exec();
	const orderDoc = await db.orders.findOne(orderId).exec();

	if (!toTableDoc || !fromTableDoc || !orderDoc) {
		return { success: false, error: 'Table or order not found in database' };
	}

	await toTableDoc.incrementalPatch({
		status: fromTable.status,
		sessionStartedAt: fromTable.sessionStartedAt,
		elapsedSeconds: fromTable.elapsedSeconds,
		currentOrderId: orderId,
		billTotal: fromTable.billTotal,
		updatedAt: new Date().toISOString()
	});

	await fromTableDoc.incrementalPatch({
		status: 'available',
		sessionStartedAt: null,
		elapsedSeconds: null,
		currentOrderId: null,
		billTotal: null,
		updatedAt: new Date().toISOString()
	});

	await orderDoc.incrementalPatch({ tableId: toTableId, tableNumber: toTable.number, updatedAt: new Date().toISOString() });

	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		const ticketDoc = await db.kds_tickets.findOne(ticket.id).exec();
		if (ticketDoc) await ticketDoc.incrementalPatch({ tableNumber: toTable.number, updatedAt: new Date().toISOString() });
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
	const secondaryItems = secondaryOrder.items; // snapshot for merge logic
	const secondaryLabel = secondaryTable.label;

	let finalTotal = 0;
	const primaryOrderDoc = await db.orders.findOne(primaryOrder.id).exec();
	if (primaryOrderDoc) {
		await primaryOrderDoc.incrementalModify((doc: Order) => {
			const combinedPax = doc.pax + secondaryOrder.pax;
			let mergedItems = [...doc.items];

			for (const item of secondaryItems) {
				if (item.tag === 'PKG' || (item.tag === 'FREE' && secondaryOrder.packageId)) {
					if (!doc.packageId) {
						mergedItems.push({ ...item, id: nanoid(), notes: item.notes ? `${item.notes} (from ${secondaryLabel})` : `From ${secondaryLabel}` });
					}
				} else {
					mergedItems.push({ ...item, id: nanoid(), notes: item.notes ? `${item.notes} (from ${secondaryLabel})` : `From ${secondaryLabel}` });
				}
			}

			if (doc.packageId) {
				mergedItems = mergedItems.map(i => (i.menuItemId === doc.packageId && i.tag === 'PKG') ? { ...i, quantity: combinedPax } : i);
			}

			doc.items = mergedItems;
			doc.pax = combinedPax;
			doc.packageId = doc.packageId || secondaryOrder.packageId;
			doc.packageName = doc.packageName || secondaryOrder.packageName;
			const totals = calculateOrderTotals(doc);
			Object.assign(doc, totals);
			finalTotal = totals.total;
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	const primaryTableDoc = await db.tables.findOne(primaryTableId).exec();
	if (primaryTableDoc) await primaryTableDoc.incrementalPatch({ billTotal: finalTotal, updatedAt: new Date().toISOString() });

	// Merge KDS tickets
	const primaryTicket = kdsTickets.value.find(t => t.orderId === primaryOrder.id);
	const secondaryTicket = kdsTickets.value.find(t => t.orderId === secondaryOrder.id);
	if (primaryTicket && secondaryTicket) {
		const pDoc = await db.kds_tickets.findOne(primaryTicket.id).exec();
		if (pDoc) {
			const extraItems = secondaryTicket.items.filter(i => i.status !== 'cancelled').map(i => ({ ...i, id: nanoid() }));
			await pDoc.incrementalModify((doc: any) => {
				doc.items = [...doc.items, ...extraItems];
				doc.updatedAt = new Date().toISOString();
				return doc;
			});
		}
		const sDoc = await db.kds_tickets.findOne(secondaryTicket.id).exec();
		if (sDoc) await sDoc.remove();
	}

	const sOrderDoc = await db.orders.findOne(secondaryOrder.id).exec();
	if (sOrderDoc) {
		await sOrderDoc.incrementalPatch({
			status: 'cancelled',
			notes: `Merged into ${primaryTable.label}`,
			closedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});
	}

	await closeTable(secondaryTableId);
	log.tableClosed(secondaryTable.label, 0, `MERGED into ${primaryTable.label}`);
	return { success: true };
}

export async function changePackage(orderId: string, newPackageId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || !order.packageId) return;

	const db = await getDb();
	const newPkg = (await db.menu_items.findOne(newPackageId).exec())?.toJSON();
	if (!newPkg || newPkg.category !== 'packages') return;

	const oldPkgName = order.packageName ?? 'Unknown';
	let finalTotal = 0;
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (orderDoc) {
		await orderDoc.incrementalModify((doc: Order) => {
			doc.items = doc.items.map(i =>
				(i.menuItemId === doc.packageId && i.tag === 'PKG')
					? { ...i, menuItemId: newPkg.id, menuItemName: newPkg.name, unitPrice: newPkg.price }
					: i
			);
			doc.packageId = newPkg.id;
			doc.packageName = newPkg.name;
			const totals = calculateOrderTotals(doc);
			Object.assign(doc, totals);
			finalTotal = totals.total;
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	if (order.tableId) {
		const tableDoc = await db.tables.findOne(order.tableId).exec();
		if (tableDoc) await tableDoc.incrementalPatch({ billTotal: finalTotal, updatedAt: new Date().toISOString() });
	}

	const tableLabel = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	const diff = Math.abs(finalTotal - order.total);
	const direction = finalTotal > order.total ? 'upgrade' : 'downgrade';
	log.packageChanged(tableLabel, oldPkgName, newPkg.name, direction, diff);
}
