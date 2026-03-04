/**
 * Kitchen Alert Store — Svelte 5 Runes
 * Broadcast alerts for kitchen refusals visible on POS screens.
 */
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';

export interface KitchenAlert {
	id: string;
	orderId: string;
	tableNumber: number | null;
	itemName: string;
	reason: string;
	createdAt: string;
	acknowledgedBy?: string;
	acknowledgedAt?: string;
}

export const alerts = $state<KitchenAlert[]>([]);

export const unacknowledgedAlerts = $derived(alerts.filter(a => !a.acknowledgedBy));

export function refuseItem(orderId: string, tableNumber: number | null, itemName: string, reason: string) {
	alerts.unshift({
		id: nanoid(),
		orderId,
		tableNumber,
		itemName,
		reason,
		createdAt: new Date().toISOString(),
	});
	log.kitchenRefusal(itemName, tableNumber, reason);
}

export function acknowledgeAlert(alertId: string) {
	const alert = alerts.find(a => a.id === alertId);
	if (alert) {
		alert.acknowledgedBy = session.userName || 'Staff';
		alert.acknowledgedAt = new Date().toISOString();
	}
}
