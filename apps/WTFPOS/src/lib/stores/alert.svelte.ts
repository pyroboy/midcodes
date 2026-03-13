/**
 * Kitchen Alert Store — RxDB-backed persistent alerts.
 * Broadcast alerts for kitchen refusals visible on POS screens.
 */
import { nanoid } from 'nanoid';
import { session } from '$lib/stores/session.svelte';
import { rejectOrderItem, orders } from '$lib/stores/pos.svelte';
import { createStore } from '$lib/stores/create-store.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { browser } from '$app/environment';

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

const _alerts = createStore<KitchenAlert>('kitchen_alerts', db =>
	db.kitchen_alerts.find({ sort: [{ createdAt: 'desc' }] })
);

export const alerts = {
	get value() { return _alerts.value; },
	get initialized() { return _alerts.initialized; }
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
 * 1. Creates an alert visible on POS
 * 2. Updates the order item status to 'cancelled'
 * 3. Updates the KDS ticket item status to 'cancelled'
 * 4. Restores the stock for the rejected item
 */
export async function refuseItem(orderId: string, tableNumber: number | null, itemName: string, reason: string) {
	if (!browser) return;

	// Find the order and item
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;

	const orderItem = order.items.find(i => i.menuItemName === itemName && i.status !== 'cancelled');
	if (!orderItem) return;

	// Insert alert
	const col = getWritableCollection('kitchen_alerts');
	const alertId = nanoid();
	await col.insert({
		id: alertId,
		orderId,
		tableNumber,
		itemName,
		reason,
		createdAt: new Date().toISOString(),
		itemId: orderItem.id,
		restoredStock: false,
		updatedAt: new Date().toISOString(),
	});

	// Update order item status to cancelled (also restores stock + logs refusal)
	await rejectOrderItem(orderId, orderItem.id, reason);
}

export async function acknowledgeAlert(alertId: string) {
	if (!browser) return;
	const col = getWritableCollection('kitchen_alerts');
	await col.incrementalPatch(alertId, {
		acknowledgedBy: session.userName || 'Staff',
		acknowledgedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});
}

/**
 * Acknowledge all pending rejections for a specific table
 */
export async function acknowledgeAllForTable(tableId: string | null) {
	if (!browser || !tableId) return;
	const order = orders.value.find(o => o.tableId === tableId && o.status === 'open');
	if (!order) return;

	const col = getWritableCollection('kitchen_alerts');
	const pendingAlerts = alerts.value.filter(a => a.orderId === order.id && !a.acknowledgedBy);
	const now = new Date().toISOString();
	const user = session.userName || 'Staff';

	for (const alert of pendingAlerts) {
		await col.incrementalPatch(alert.id, {
			acknowledgedBy: user,
			acknowledgedAt: now,
			updatedAt: now,
		});
	}
}
