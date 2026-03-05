/**
 * Kitchen Alert Store — Svelte 5 Runes
 * Broadcast alerts for kitchen refusals visible on POS screens.
 */
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';
import { rejectOrderItem, orders, kdsTickets } from '$lib/stores/pos.svelte';
import { restoreStock } from '$lib/stores/stock.svelte';

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

export const alerts = $state<KitchenAlert[]>([]);

export function getUnacknowledgedAlerts() {
	return alerts.filter(a => !a.acknowledgedBy);
}

export function getPendingRejectionsForTable(tableId: string | null): KitchenAlert[] {
	if (!tableId) return [];
	const order = orders.value.find((o: any) => o.tableId === tableId && o.status === 'open');
	if (!order) return [];
	return alerts.filter(a => a.orderId === order.id && !a.acknowledgedBy);
}

/**
 * Refuse an item from the KDS - this handles two-way communication:
 * 1. Creates an alert visible on POS
 * 2. Updates the order item status to 'cancelled' 
 * 3. Updates the KDS ticket item status to 'cancelled'
 * 4. Restores the stock for the rejected item
 */
export function refuseItem(orderId: string, tableNumber: number | null, itemName: string, reason: string) {
	// Find the order and item
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;
	
	const orderItem = order.items.find(i => i.menuItemName === itemName && i.status !== 'cancelled');
	if (!orderItem) return;
	
	// Create alert
	const alert: KitchenAlert = {
		id: nanoid(),
		orderId,
		tableNumber,
		itemName,
		reason,
		createdAt: new Date().toISOString(),
		itemId: orderItem.id,
		restoredStock: false,
	};
	alerts.unshift(alert);
	
	// Update order item status to cancelled
	rejectOrderItem(orderId, orderItem.id);
	
	// Update KDS ticket item status
	const ticket = kdsTickets.value.find(t => t.orderId === orderId);
	if (ticket) {
		const kdsItem = ticket.items.find(i => i.id === orderItem.id);
		if (kdsItem) {
			kdsItem.status = 'cancelled';
		}
	}
	
	// Restore stock for the rejected item
	const menuItem = orderItem.menuItemId;
	const qty = orderItem.weight ?? orderItem.quantity;
	restoreStock(menuItem, qty, tableNumber?.toString() ?? 'takeout', orderId);
	alert.restoredStock = true;
	
	log.kitchenRefusal(itemName, tableNumber, reason);
}

export function acknowledgeAlert(alertId: string) {
	const alert = alerts.find(a => a.id === alertId);
	if (alert) {
		alert.acknowledgedBy = session.userName || 'Staff';
		alert.acknowledgedAt = new Date().toISOString();
	}
}

/**
 * Acknowledge all pending rejections for a specific table
 */
export function acknowledgeAllForTable(tableId: string | null) {
	if (!tableId) return;
	const order = orders.value.find(o => o.tableId === tableId && o.status === 'open');
	if (!order) return;
	
	const pendingAlerts = alerts.filter(a => a.orderId === order.id && !a.acknowledgedBy);
	for (const alert of pendingAlerts) {
		alert.acknowledgedBy = session.userName || 'Staff';
		alert.acknowledgedAt = new Date().toISOString();
	}
}
