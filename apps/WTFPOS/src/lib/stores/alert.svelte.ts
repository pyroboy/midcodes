/**
 * Kitchen Alert Store — derived from order items.
 * Alerts are now virtual: any order item with status === 'cancelled' && cancelReason
 * is surfaced as a KitchenAlert. Acknowledgment is written back to the order item.
 */
import { session } from '$lib/stores/session.svelte';
import { rejectOrderItem, orders } from '$lib/stores/pos.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { browser } from '$app/environment';
import type { Order } from '$lib/types';

export interface KitchenAlert {
	id: string;
	orderId: string;
	tableNumber: number | null;
	itemName: string;
	reason: string;
	createdAt: string;
	acknowledgedBy?: string;
	acknowledgedAt?: string;
	itemId?: string;
	restoredStock?: boolean;
}

/** Derive alerts from open/pending_payment orders with cancelled items that have a cancelReason. */
function deriveAlerts(orderList: Order[]): KitchenAlert[] {
	const result: KitchenAlert[] = [];
	for (const order of orderList) {
		if (order.status === 'paid' || order.status === 'cancelled') continue;
		for (const item of order.items) {
			if (item.status === 'cancelled' && item.cancelReason) {
				result.push({
					id: `${order.id}:${item.id}`,
					orderId: order.id,
					tableNumber: order.tableNumber,
					itemName: item.menuItemName,
					reason: item.cancelReason,
					createdAt: item.cancelledAt ?? order.updatedAt,
					acknowledgedBy: item.acknowledgedBy,
					acknowledgedAt: item.acknowledgedAt,
					itemId: item.id,
					restoredStock: true, // stock is always restored in rejectOrderItem
				});
			}
		}
	}
	// Sort newest first
	result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	return result;
}

// Memoize: only recompute when orders.value reference changes (not on every access)
let _cachedOrdersRef: Order[] = [];
let _cachedAlerts: KitchenAlert[] = [];

export const alerts = {
	get value() {
		const currentOrders = orders.value;
		if (currentOrders !== _cachedOrdersRef) {
			_cachedOrdersRef = currentOrders;
			_cachedAlerts = deriveAlerts(currentOrders);
		}
		return _cachedAlerts;
	},
	get initialized() { return orders.initialized; }
};

export function getUnacknowledgedAlerts() {
	return alerts.value.filter(a => !a.acknowledgedBy);
}

export function getPendingRejectionsForTable(tableId: string | null): KitchenAlert[] {
	if (!tableId) return [];
	const order = orders.value.find((o: any) => o.tableId === tableId && o.status === 'open');
	if (!order) return [];
	return alerts.value.filter(a => a.orderId === order.id && !a.acknowledgedBy);
}

/**
 * Refuse an item from the KDS - this handles two-way communication:
 * 1. Updates the order item status to 'cancelled' with cancelReason + cancelledAt
 * 2. Updates the KDS ticket item status to 'cancelled'
 * 3. Restores the stock for the rejected item
 * Alert is derived automatically from the cancelled item.
 */
export async function refuseItem(orderId: string, tableNumber: number | null, itemName: string, reason: string) {
	if (!browser) return;

	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;

	const orderItem = order.items.find(i => i.menuItemName === itemName && i.status !== 'cancelled');
	if (!orderItem) return;

	// rejectOrderItem now embeds cancelReason + cancelledAt on the item
	await rejectOrderItem(orderId, orderItem.id, reason);
}

export async function acknowledgeAlert(alertId: string) {
	if (!browser) return;
	// alertId format: "orderId:itemId"
	const [orderId, itemId] = alertId.split(':');
	if (!orderId || !itemId) return;

	const col = getWritableCollection('orders');
	const now = new Date().toISOString();
	const user = session.userName || 'Staff';

	await col.incrementalModify(orderId, (doc: Order) => {
		doc.items = doc.items.map(i =>
			i.id === itemId ? { ...i, acknowledgedBy: user, acknowledgedAt: now } : i
		);
		doc.updatedAt = now;
		return doc;
	});
}

/**
 * Acknowledge all pending rejections for a specific table
 */
export async function acknowledgeAllForTable(tableId: string | null) {
	if (!browser || !tableId) return;
	const order = orders.value.find(o => o.tableId === tableId && o.status === 'open');
	if (!order) return;

	const pendingItems = order.items.filter(i =>
		i.status === 'cancelled' && i.cancelReason && !i.acknowledgedBy
	);
	if (pendingItems.length === 0) return;

	const col = getWritableCollection('orders');
	const now = new Date().toISOString();
	const user = session.userName || 'Staff';
	const pendingIds = new Set(pendingItems.map(i => i.id));

	await col.incrementalModify(order.id, (doc: Order) => {
		doc.items = doc.items.map(i =>
			pendingIds.has(i.id) ? { ...i, acknowledgedBy: user, acknowledgedAt: now } : i
		);
		doc.updatedAt = now;
		return doc;
	});
}
