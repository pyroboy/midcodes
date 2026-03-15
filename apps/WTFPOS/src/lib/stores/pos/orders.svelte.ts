/**
 * POS Orders — Order state, item management, table operations, and lifecycle.
 * Imports closeTable from tables (no circular dep since tables doesn't import orders).
 */
import type { Order, MenuItem, TakeoutStatus, SubBill, DiscountType, DiscountEntry, KdsTicket } from '$lib/types';
import { nanoid } from 'nanoid';
import { deductFromStock, restoreStock } from '$lib/stores/stock.svelte';
import { log } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';
import { createStore } from '$lib/stores/create-store.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { browser } from '$app/environment';
import { closeTable, tables } from '$lib/stores/pos/tables.svelte';
import { kdsTickets } from '$lib/stores/pos/kds.svelte';
import { menuItems } from '$lib/stores/pos/menu.svelte';
import { calculateOrderTotals } from '$lib/stores/pos/utils';
import { deriveOrderItemProps } from '$lib/stores/pos/item.utils';
import { calculateLeftoverPenalty } from '$lib/stores/pos/payment.utils';
import { getOrderLabel } from '$lib/stores/pos/label.utils';

export const REFILL_NOTE = 'refill' as const;
export const LEFTOVER_PENALTY_ITEM_ID = 'penalty-leftover' as const;

/** Returns true if the item is still within the 30-second grace period (no PIN needed to remove) */
export function isWithinGracePeriod(addedAt: string | undefined): boolean {
	if (!addedAt) return false;
	return Date.now() - new Date(addedAt).getTime() < 30_000;
}

/** Remove a pending item from an order (must be pending status only).
 *  @param reason  Void reason from manager-gated flow; omit for grace-period removals. */
export async function removeOrderItem(orderId: string, itemId: string, reason?: string): Promise<void> {
	if (!browser) return;
	const col = getWritableCollection('orders');
	const orderDoc = await col.findOne(orderId).exec();
	if (!orderDoc) return;

	const order = (orderDoc.toMutableJSON ? orderDoc.toMutableJSON() : structuredClone(orderDoc)) as Order;
	const item = order.items.find(i => i.id === itemId);
	if (!item || item.status !== 'pending') return;

	let finalTotal = 0;
	await col.incrementalModify(orderId, (doc: Order) => {
		doc.items = doc.items.filter(i => i.id !== itemId);
		const totals = calculateOrderTotals(doc);
		Object.assign(doc, totals);
		finalTotal = totals.total;
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	await updateTableBillTotal(order.tableId, finalTotal);

	// Restore stock for removed item
	const restoreQty = item.weight ?? item.quantity;
	if (restoreQty > 0) await restoreStock(item.menuItemId, restoreQty, order.id, order.locationId);

	// Write audit log entry when a reason is provided (manager-gated void)
	if (reason) {
		const tableLabel = getOrderLabel(order);
		log.itemVoided(item.menuItemName, tableLabel, reason);
	}

	// Remove from KDS ticket
	const kdsCol = getWritableCollection('kds_tickets');
	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		await kdsCol.incrementalModify(ticket.id, (doc: any) => {
			doc.items = doc.items.filter((i: any) => i.id !== itemId);
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}
}

export function getRefillCount(order: Order | null | undefined): number {
	return order?.items.filter(i => i.tag === 'FREE' && i.notes === REFILL_NOTE && i.status !== 'cancelled').length ?? 0;
}

/** Returns how many refill requests have been made for a specific meat cut on this order. */
export function getRefillCountForMeat(order: Order | null | undefined, menuItemId: string): number {
	if (!menuItemId) return 0;
	return order?.items.filter(i =>
		i.menuItemId === menuItemId &&
		i.tag === 'FREE' &&
		i.notes === REFILL_NOTE &&
		i.status !== 'cancelled'
	).length ?? 0;
}

async function updateTableBillTotal(tableId: string | null | undefined, amount: number): Promise<void> {
	if (!tableId) return;
	const col = getWritableCollection('tables');
	await col.incrementalPatch(tableId, { billTotal: amount, updatedAt: new Date().toISOString() });
}

const _orders = createStore<Order>('orders', db => db.orders.find());

export const orders = {
	get value() { return _orders.value; },
	get initialized() { return _orders.initialized; }
};

// ─── Takeout ─────────────────────────────────────────────────────────────────

export async function createTakeoutOrder(customerName: string = 'Walk-in'): Promise<string> {
	if (!browser) return '';
	const orderId = nanoid();
	const col = getWritableCollection('orders');

	await col.insert({
		id: orderId,
		locationId: (session.locationId === 'all' || session.locationId === 'wh-tag') ? 'tag' : session.locationId,
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
	const col = getWritableCollection('orders');
	const orderDoc = await col.findOne(orderId).exec();
	if (!orderDoc) return;

	const order = (orderDoc.toMutableJSON ? orderDoc.toMutableJSON() : structuredClone(orderDoc)) as Order;

	const { unitPrice, quantity, tag } = deriveOrderItemProps(item, order.pax, qty, weight, forceFree);

	const newItem = { id: nanoid(), menuItemId: item.id, menuItemName: item.name, quantity, unitPrice, childUnitPrice: item.category === 'packages' ? (item.childPrice ?? null) : null, weight: weight ?? null, status: 'pending' as const, sentAt: null, tag, notes: notes ?? '', addedAt: new Date().toISOString() };

	let totals!: ReturnType<typeof calculateOrderTotals>;
	await col.incrementalModify(orderId, (doc: Order) => {
		const updatedItems = [...doc.items, newItem];
		totals = calculateOrderTotals({ ...doc, items: updatedItems } as Order);
		doc.packageId = item.category === 'packages' ? item.id : doc.packageId;
		doc.packageName = item.category === 'packages' ? item.name : doc.packageName;
		doc.items = updatedItems;
		Object.assign(doc, totals);
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	const deductQty = item.isWeightBased ? (weight ?? 0) : qty;
	const kdsItem = { id: newItem.id, menuItemName: item.name, quantity: qty, status: 'pending' as const, weight: weight ?? null, category: item.category ?? '', notes: notes ?? '' };
	const ticket = kdsTickets.value.find((t) => t.orderId === orderId);
	const kdsCol = getWritableCollection('kds_tickets');

	await Promise.all([
		updateTableBillTotal(order.tableId, totals.total),
		deductQty > 0 ? deductFromStock(item.id, deductQty, order.tableId ?? 'takeout', order.id, item.trackInventory ?? false) : Promise.resolve(),
		(async () => {
			if (ticket) {
				await kdsCol.incrementalModify(ticket.id, (doc: any) => {
					doc.items = [...doc.items, kdsItem];
					doc.updatedAt = new Date().toISOString();
					return doc;
				});
			} else {
				await kdsCol.insert({
					id: nanoid(),
					orderId,
					locationId: order.locationId,
					tableNumber: order.tableNumber,
					customerName: order.customerName,
					items: [kdsItem],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
			}
		})()
	]);

	const tableLabel = getOrderLabel(order);
	log.itemCharged(item.name, tableLabel, weight ?? null, qty);
}

export async function recalcOrder(
	order: Order,
	overrides?: { discountType?: DiscountType; discountEntries?: Partial<Record<DiscountType, DiscountEntry>> | null; discountPax?: number; discountIds?: string[]; discountIdPhotos?: string[] }
) {
	if (!browser) return;
	const col = getWritableCollection('orders');

	let finalTotal = 0;
	await col.incrementalModify(order.id, (doc: Order) => {
		doc.items = order.items;
		doc.discountType = overrides?.discountType ?? order.discountType;
		if (overrides?.discountEntries !== undefined) doc.discountEntries = overrides.discountEntries ?? undefined;
		doc.discountPax   = overrides?.discountPax  ?? order.discountPax;
		doc.discountIds   = overrides?.discountIds  ?? order.discountIds;
		if (overrides?.discountIdPhotos !== undefined) doc.discountIdPhotos = overrides.discountIdPhotos;
		const totals = calculateOrderTotals(doc);
		Object.assign(doc, totals);
		finalTotal = totals.total;
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	await updateTableBillTotal(order.tableId, finalTotal);
}

export async function voidOrder(orderId: string, reason?: 'mistake' | 'walkout' | 'write_off', closedBy?: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status === 'paid' || order.status === 'cancelled') return;

	// Snapshot items that need stock restoration before modifying
	const itemsToRestore = order.items.filter(i => i.status !== 'cancelled');

	const col = getWritableCollection('orders');
	await col.incrementalModify(orderId, (doc: Order) => {
		doc.items = doc.items.map(item =>
			item.status !== 'cancelled' ? { ...item, status: 'cancelled' as const } : item
		);
		doc.status = 'cancelled';
		doc.cancelReason = reason;
		doc.closedBy = closedBy ?? undefined;
		doc.closedAt = new Date().toISOString();
		if (doc.orderType === 'takeout') doc.takeoutStatus = 'new';
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	// Restore stock in parallel — each item is independent
	await Promise.all(
		itemsToRestore
			.filter(item => (item.weight ?? item.quantity) > 0)
			.map(item => restoreStock(item.menuItemId, item.weight ?? item.quantity, order.id, order.locationId))
	);

	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		await getWritableCollection('kds_tickets').remove(ticket.id);
	}

	let capturedElapsed: number | null = null;
	if (order.tableId) {
		const table = tables.value.find(t => t.id === order.tableId);
		if (table) {
			capturedElapsed = table.elapsedSeconds;
			await closeTable(order.tableId);
		}
	}

	const label = getOrderLabel(order);

	if (order.subtotal === 0) {
		log.zeroValueCancellation(label, reason, capturedElapsed ?? undefined);
	} else {
		log.orderVoided(label, order.total, reason, capturedElapsed ?? undefined);
	}
}

export async function markItemServed(orderId: string, itemId: string) {
	const col = getWritableCollection('orders');

	// Try local store first, fall back to server fetch (thin clients may not have the order locally yet)
	let order = orders.value.find(o => o.id === orderId) as Order | null | undefined;
	if (!order) {
		order = await col.findOne(orderId).exec() as Order | null;
	}

	// Update the order if it still exists (may have been paid/cancelled/cleaned up)
	let servedItemName = 'Item';
	if (order) {
		await col.incrementalModify(orderId, (doc: Order) => {
			doc.items = doc.items.map(i => {
				if (i.id === itemId) { servedItemName = i.menuItemName; return { ...i, status: 'served' as const }; }
				return i;
			});
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	} else {
		console.warn(`[markItemServed] Order ${orderId} not found — updating KDS ticket only`);
	}

	// Always update the KDS ticket (dispatch board needs it cleared even if order is gone)
	const kdsCol = getWritableCollection('kds_tickets');
	const ticket = kdsTickets.value.find(t => t.orderId === orderId && t.items.some(i => i.id === itemId));
	if (ticket) {
		let allServed = false;
		let snapshotItems: typeof ticket.items = [];
		await kdsCol.incrementalModify(ticket.id, (doc: any) => {
			doc.items = doc.items.map((i: any) => i.id === itemId ? { ...i, status: 'served' } : i);
			allServed = doc.items.every((i: any) => i.status === 'served' || i.status === 'cancelled');
			snapshotItems = doc.items;
			doc.updatedAt = new Date().toISOString();
			return doc;
		});

		if (allServed) {
			await kdsCol.incrementalPatch(ticket.id, {
				items: snapshotItems,
				bumpedAt: new Date().toISOString(),
				bumpedBy: session.userName || 'Kitchen',
				updatedAt: new Date().toISOString()
			});

			if (order?.orderType === 'takeout' && order.status === 'open') {
				await col.incrementalPatch(orderId, { takeoutStatus: 'ready', updatedAt: new Date().toISOString() });
				log.takeoutAdvanced(order.customerName ?? 'Walk-in', 'ready');
			}
		}
	}
	log.itemServed(servedItemName, order?.tableNumber ?? null);
}

export async function rejectOrderItem(orderId: string, itemId: string, reason: string = 'Kitchen Reject') {
	const col = getWritableCollection('orders');

	// Try local store first, fall back to server fetch (thin clients may not have the order locally yet)
	let order = orders.value.find(o => o.id === orderId) as Order | null | undefined;
	if (!order) {
		order = await col.findOne(orderId).exec() as Order | null;
		if (!order) {
			console.warn(`[rejectOrderItem] Order ${orderId} not found locally or on server — skipping`);
			return;
		}
	}

	const item = order.items.find(i => i.id === itemId);
	if (!item || item.status === 'cancelled') return;

	let finalTotal = order.total;
	const now = new Date().toISOString();
	await col.incrementalModify(orderId, (doc: Order) => {
		doc.items = doc.items.map(i => i.id === itemId ? { ...i, status: 'cancelled' as const, cancelReason: reason, cancelledAt: now } : i);
		const totals = calculateOrderTotals(doc);
		Object.assign(doc, totals);
		finalTotal = totals.total;
		doc.updatedAt = now;
		return doc;
	});

	await updateTableBillTotal(order.tableId, finalTotal);

	const restoreQty = item.weight ?? item.quantity;
	if (restoreQty > 0) await restoreStock(item.menuItemId, restoreQty, order.id, order.locationId);

	// Also update KDS ticket item to cancelled (same pattern as markItemServed)
	const kdsCol = getWritableCollection('kds_tickets');
	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		await kdsCol.incrementalModify(ticket.id, (doc: any) => {
			doc.items = doc.items.map((i: any) =>
				i.id === itemId ? { ...i, status: 'cancelled' } : i
			);
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

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

	const col = getWritableCollection('orders');
	let finalTotal = 0;
	await col.incrementalModify(orderId, (doc: Order) => {
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

	await updateTableBillTotal(order.tableId, finalTotal);

	const tableLabel = getOrderLabel(order);
	log.paxChanged(tableLabel, oldPax, newPax);
}

export async function applyLeftoverPenalty(orderId: string, weightGrams: number, ratePerHundredGrams: number = 50) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || weightGrams <= 0) return;

	const col = getWritableCollection('orders');
	const penalty = calculateLeftoverPenalty(weightGrams, ratePerHundredGrams);
	const penaltyItem = {
		id: nanoid(), menuItemId: LEFTOVER_PENALTY_ITEM_ID, menuItemName: 'Leftover Penalty',
		quantity: 1, unitPrice: penalty, weight: weightGrams, status: 'served' as const, sentAt: null, tag: null as 'PKG' | 'FREE' | null,
		notes: `${weightGrams}g leftover @ ₱${ratePerHundredGrams}/100g`
	};

	let finalTotal = 0;
	await col.incrementalModify(orderId, (doc: Order) => {
		doc.items = [...doc.items, penaltyItem];
		doc.leftoverPenaltyAmount = penalty;
		const totals = calculateOrderTotals(doc);
		Object.assign(doc, totals);
		finalTotal = totals.total;
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	await updateTableBillTotal(order.tableId, finalTotal);

	const label = getOrderLabel(order);
	log.leftoverPenaltyApplied(label, weightGrams, penalty);
}

export async function waiveLeftoverPenalty(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;

	const col = getWritableCollection('orders');
	let finalTotal = 0;
	await col.incrementalModify(orderId, (doc: Order) => {
		doc.items = doc.items.filter(i => i.menuItemId !== LEFTOVER_PENALTY_ITEM_ID);
		doc.leftoverPenaltyAmount = 0;
		const totals = calculateOrderTotals(doc);
		Object.assign(doc, totals);
		finalTotal = totals.total;
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	await updateTableBillTotal(order.tableId, finalTotal);

	const label = getOrderLabel(order);
	log.leftoverPenaltyWaived(label);
}

// ─── Takeout Lifecycle ───────────────────────────────────────────────────────

export async function advanceTakeoutStatus(orderId: string): Promise<void> {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.orderType !== 'takeout') return;

	const progression: Record<TakeoutStatus, TakeoutStatus | null> = {
		new: 'preparing',
		preparing: 'ready',
		ready: 'picked_up',
		picked_up: null
	};
	const current = order.takeoutStatus ?? 'new';
	const next = progression[current];

	if (next) {
		const col = getWritableCollection('orders');
		await col.incrementalPatch(orderId, { takeoutStatus: next, updatedAt: new Date().toISOString() });
		log.takeoutAdvanced(order.customerName ?? 'Walk-in', next);
	}
}

export async function setTakeoutStatus(orderId: string, status: TakeoutStatus): Promise<void> {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.orderType !== 'takeout') return;

	const col = getWritableCollection('orders');
	await col.incrementalPatch(orderId, { takeoutStatus: status, updatedAt: new Date().toISOString() });
	log.takeoutAdvanced(order.customerName ?? 'Walk-in', status);
}

// ─── Table Transfer & Merge ───────────────────────────────────────────────────

export async function transferTable(fromTableId: string, toTableId: string): Promise<{ success: boolean; error?: string }> {
	// Try server-side atomic transfer first (prevents race conditions across devices)
	try {
		const res = await fetch('/api/pos/transfer', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fromTableId, toTableId })
		});
		const result = await res.json();
		if (result.success) {
			// Trigger resync for affected collections so local RxDB picks up changes
			try {
				const { getActiveReplication } = await import('$lib/db/replication');
				for (const col of ['tables', 'orders', 'kds_tickets']) {
					const rep = getActiveReplication(col);
					if (rep && typeof rep.reSync === 'function') rep.reSync();
				}
			} catch { /* best-effort resync */ }
			log.tableTransferred(result.fromLabel, result.toLabel);
			return { success: true };
		}
		return { success: false, error: result.error };
	} catch {
		// Fallback to client-side multi-write if server is unreachable (offline mode)
	}

	// ── Offline fallback: 4 sequential client-side writes ──
	const fromTable = tables.value.find(t => t.id === fromTableId);
	const toTable = tables.value.find(t => t.id === toTableId);
	if (!fromTable || !toTable || toTable.status !== 'available' || !fromTable.currentOrderId) return { success: false, error: 'Invalid tables or table not available' };
	if (fromTable.locationId !== toTable.locationId) return { success: false, error: 'Cannot transfer between locations' };

	const tablesCol = getWritableCollection('tables');
	const ordersCol = getWritableCollection('orders');
	const kdsCol = getWritableCollection('kds_tickets');
	const orderId = fromTable.currentOrderId;

	// Verify all docs exist before writing
	const toTableDoc = await tablesCol.findOne(toTableId).exec();
	const fromTableDoc = await tablesCol.findOne(fromTableId).exec();
	const orderDoc = await ordersCol.findOne(orderId).exec();

	if (!toTableDoc || !fromTableDoc || !orderDoc) {
		return { success: false, error: 'Table or order not found in database' };
	}

	await tablesCol.incrementalPatch(toTableId, {
		status: fromTable.status,
		sessionStartedAt: fromTable.sessionStartedAt,
		elapsedSeconds: fromTable.elapsedSeconds,
		currentOrderId: orderId,
		billTotal: fromTable.billTotal,
		updatedAt: new Date().toISOString()
	});

	await tablesCol.incrementalPatch(fromTableId, {
		status: 'available',
		sessionStartedAt: null,
		elapsedSeconds: null,
		currentOrderId: null,
		billTotal: null,
		updatedAt: new Date().toISOString()
	});

	await ordersCol.incrementalPatch(orderId, { tableId: toTableId, tableNumber: toTable.number, updatedAt: new Date().toISOString() });

	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		await kdsCol.incrementalPatch(ticket.id, { tableNumber: toTable.number, updatedAt: new Date().toISOString() });
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

	const ordersCol = getWritableCollection('orders');
	const kdsCol = getWritableCollection('kds_tickets');
	const secondaryItems = secondaryOrder.items; // snapshot for merge logic
	const secondaryLabel = secondaryTable.label;

	let finalTotal = 0;
	await ordersCol.incrementalModify(primaryOrder.id, (doc: Order) => {
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

	await updateTableBillTotal(primaryTableId, finalTotal);

	// Merge KDS tickets
	const primaryTicket = kdsTickets.value.find(t => t.orderId === primaryOrder.id);
	const secondaryTicket = kdsTickets.value.find(t => t.orderId === secondaryOrder.id);
	if (primaryTicket && secondaryTicket) {
		const extraItems = secondaryTicket.items.filter(i => i.status !== 'cancelled').map(i => ({ ...i, id: nanoid() }));
		await kdsCol.incrementalModify(primaryTicket.id, (doc: any) => {
			doc.items = [...doc.items, ...extraItems];
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
		await getWritableCollection('kds_tickets').remove(secondaryTicket.id);
	}

	await ordersCol.incrementalPatch(secondaryOrder.id, {
		status: 'cancelled',
		notes: `Merged into ${primaryTable.label}`,
		closedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	});

	await closeTable(secondaryTableId);
	log.tableClosed(secondaryTable.label, 0, `MERGED into ${primaryTable.label}`);
	return { success: true };
}

// ─── Refill Workflow ─────────────────────────────────────────────────────────

/**
 * Adds a meat (or side) item as a refill request with weight: null.
 * Kitchen will weigh and dispatch via dispatchMeatWeight().
 * Does NOT deduct stock — stock deduction happens at dispatch time.
 */
export async function addRefillRequest(orderId: string, menuItem: MenuItem): Promise<void> {
	if (!browser) return;
	const col = getWritableCollection('orders');
	const orderDoc = await col.findOne(orderId).exec();
	if (!orderDoc) return;
	const order = (orderDoc.toMutableJSON ? orderDoc.toMutableJSON() : structuredClone(orderDoc)) as Order;

	const newItem = {
		id: nanoid(),
		menuItemId: menuItem.id,
		menuItemName: menuItem.name,
		quantity: 1,
		unitPrice: 0,
		weight: null,
		status: 'pending' as const,
		sentAt: null,
		tag: 'FREE' as const,
		notes: REFILL_NOTE
	};

	let totals!: ReturnType<typeof calculateOrderTotals>;
	await col.incrementalModify(orderId, (doc: Order) => {
		doc.items = [...doc.items, newItem];
		totals = calculateOrderTotals(doc);
		Object.assign(doc, totals);
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	// KDS item built before parallel writes below
	const kdsItem = {
		id: newItem.id,
		menuItemName: menuItem.name,
		quantity: 1,
		status: 'pending' as const,
		category: menuItem.category,
		notes: REFILL_NOTE
	};

	// In-memory ticket lookup (synchronous) before any async work
	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	const kdsCol = getWritableCollection('kds_tickets');

	// Table update and KDS ticket update are independent — run in parallel
	await Promise.all([
		updateTableBillTotal(order.tableId, totals.total),
		(async () => {
			if (ticket) {
				await kdsCol.incrementalModify(ticket.id, (doc: any) => {
					doc.items = [...doc.items, kdsItem];
					doc.updatedAt = new Date().toISOString();
					return doc;
				});
			} else {
				await kdsCol.insert({
					id: nanoid(),
					orderId,
					locationId: order.locationId,
					tableNumber: order.tableNumber,
					customerName: order.customerName,
					items: [kdsItem],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
			}
		})()
	]);

	const tableLabel = getOrderLabel(order);
	log.itemCharged(menuItem.name, tableLabel, null, 1);
}

/**
 * Sends a service request (extra tong, scissors, utensils, etc.) to the KDS only.
 * Does NOT add to order.items — no billing impact, no receipt entry.
 * Kitchen sees it in the NEEDS section of the ticket and acknowledges it.
 */
export async function addServiceRequest(orderId: string, requestText: string): Promise<void> {
	if (!browser || !requestText.trim()) return;
	const col = getWritableCollection('orders');
	const orderDoc = await col.findOne(orderId).exec();
	if (!orderDoc) return;
	const order = (orderDoc.toMutableJSON ? orderDoc.toMutableJSON() : structuredClone(orderDoc)) as Order;

	const kdsItem = {
		id: nanoid(),
		menuItemName: requestText.trim(),
		quantity: 1,
		status: 'pending' as const,
		category: 'service' as const,
		notes: ''
	};

	const kdsCol = getWritableCollection('kds_tickets');
	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		await kdsCol.incrementalModify(ticket.id, (doc: any) => {
			doc.items = [...doc.items, kdsItem];
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	} else {
		await kdsCol.insert({
			id: nanoid(),
			orderId,
			locationId: order.locationId,
			tableNumber: order.tableNumber,
			customerName: order.customerName,
			items: [kdsItem],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});
	}
}

/**
 * Records the weight of a meat item at the weigh station WITHOUT marking it served.
 * Sets status to 'cooking' (or keeps it if already cooking), records weight, deducts stock,
 * updates KDS ticket with weight. The item stays visible on the dispatch page as "weighed".
 * Serving happens separately via markItemServed() from the dispatch page.
 */
export async function recordMeatWeight(orderId: string, itemId: string, weightGrams: number): Promise<void> {
	if (!browser) return;
	const col = getWritableCollection('orders');
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;
	const item = order.items.find(i => i.id === itemId);
	if (!item) return;

	// Write weight and advance to 'cooking' (weighed but not served)
	await col.incrementalModify(orderId, (doc: Order) => {
		doc.items = doc.items.map(i =>
			i.id === itemId ? { ...i, weight: weightGrams, status: 'cooking' as const } : i
		);
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	if (weightGrams > 0) {
		const mi = menuItems.value.find(m => m.id === item.menuItemId);
		await deductFromStock(item.menuItemId, weightGrams, order.tableId ?? 'takeout', orderId, mi?.trackInventory ?? true);
	}

	// Update KDS ticket item with weight and 'cooking' status — do NOT bump ticket
	const kdsCol = getWritableCollection('kds_tickets');
	const ticket = kdsTickets.value.find(t => t.orderId === orderId && t.items.some(i => i.id === itemId));
	if (ticket) {
		await kdsCol.incrementalModify(ticket.id, (doc: any) => {
			doc.items = doc.items.map((i: any) =>
				i.id === itemId ? { ...i, weight: weightGrams, status: 'cooking' } : i
			);
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	const tableLabel = getOrderLabel(order);
	log.itemCharged(item.menuItemName, tableLabel, weightGrams, 1);
}

/**
 * @deprecated Use recordMeatWeight() + markItemServed() instead.
 * Kept for backward compatibility — records weight and immediately serves.
 */
export async function dispatchMeatWeight(orderId: string, itemId: string, weightGrams: number): Promise<void> {
	await recordMeatWeight(orderId, itemId, weightGrams);
	await markItemServed(orderId, itemId);
}

export async function changePackage(orderId: string, newPackageId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || !order.packageId) return;

	const menuCol = getWritableCollection('menu_items');
	const newPkgDoc = await menuCol.findOne(newPackageId).exec();
	if (!newPkgDoc) return;
	const newPkg = newPkgDoc.toJSON ? newPkgDoc.toJSON() : newPkgDoc;
	if (newPkg.category !== 'packages') return;

	const col = getWritableCollection('orders');
	const oldPkgName = order.packageName ?? 'Unknown';
	let finalTotal = 0;
	await col.incrementalModify(orderId, (doc: Order) => {
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

	await updateTableBillTotal(order.tableId, finalTotal);

	const tableLabel = getOrderLabel(order);
	const diff = Math.abs(finalTotal - order.total);
	const direction = finalTotal > order.total ? 'upgrade' : 'downgrade';
	log.packageChanged(tableLabel, oldPkgName, newPkg.name, direction, diff);
}

/** Merge all items from a takeout order into a dine-in table order, then cancel the takeout. */
export async function mergeTakeoutToTable(
	takeoutOrderId: string,
	tableOrderId: string
): Promise<{ success: boolean; error?: string }> {
	if (!browser) return { success: false, error: 'Not in browser' };

	const takeout = orders.value.find(o => o.id === takeoutOrderId);
	if (!takeout) return { success: false, error: 'Takeout order not found' };
	if (takeout.orderType !== 'takeout') return { success: false, error: 'Source is not a takeout order' };
	if (takeout.status !== 'open') return { success: false, error: 'Takeout order is not open' };

	const tableOrder = orders.value.find(o => o.id === tableOrderId);
	if (!tableOrder) return { success: false, error: 'Table order not found' };
	if (tableOrder.orderType !== 'dine-in') return { success: false, error: 'Target is not a dine-in order' };
	if (tableOrder.status !== 'open') return { success: false, error: 'Table order is not open' };

	const col = getWritableCollection('orders');

	// Copy non-cancelled takeout items into the table order
	const itemsToMerge = takeout.items
		.filter(i => i.status !== 'cancelled')
		.map(i => ({ ...i, id: nanoid(), addedAt: new Date().toISOString() }));

	let newTotal = 0;
	await col.incrementalModify(tableOrderId, (doc: Order) => {
		doc.items = [...doc.items, ...itemsToMerge];
		const totals = calculateOrderTotals(doc);
		Object.assign(doc, totals);
		newTotal = totals.total;
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	// Cancel the takeout order
	await col.incrementalPatch(takeoutOrderId, {
		status: 'cancelled',
		cancelReason: 'walkout',
		notes: `Merged into table order ${tableOrderId}`,
		closedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	});

	await updateTableBillTotal(tableOrder.tableId, newTotal);

	const takeoutLabel = getOrderLabel(takeout);
	const tableLabel = getOrderLabel(tableOrder);
	log.tableTransferred(takeoutLabel, tableLabel);

	return { success: true };
}
