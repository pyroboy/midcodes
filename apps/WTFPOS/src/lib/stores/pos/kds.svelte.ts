/**
 * POS KDS — Kitchen Display System state and ticket management.
 */
import type { KdsTicket } from '$lib/types';
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';
import { createRxStore } from '$lib/stores/sync.svelte';
import { getDb } from '$lib/db';

const _kdsActive = createRxStore<KdsTicket>('kds_tickets', db => db.kds_tickets.find({
	selector: { bumpedAt: null }
}));
const _kdsHistory = createRxStore<KdsTicket>('kds_tickets_history', db => db.kds_tickets.find({
	selector: { bumpedAt: { $ne: null } },
	sort: [{ bumpedAt: 'desc' }]
}));

export const kdsTickets = {
	get value() {
		const loc = session.locationId;
		if (loc === 'all') return _kdsActive.value;
		return _kdsActive.value.filter(t => t.locationId === loc);
	},
	get initialized() { return _kdsActive.initialized; }
};

export const kdsTicketHistory = {
	get value() {
		const loc = session.locationId;
		if (loc === 'all') return _kdsHistory.value;
		return _kdsHistory.value.filter(t => t.locationId === loc);
	},
	get initialized() { return _kdsHistory.initialized; }
};

// ─── KDS Actions ─────────────────────────────────────────────────────────────

export async function recallTicket(orderId: string) {
	const db = await getDb();
	const historyDoc = await db.kds_tickets.findOne({ selector: { orderId, bumpedAt: { $ne: null } } }).exec();
	if (!historyDoc) return;

	const entry = historyDoc.toJSON();
	const restoredItems = entry.items.map((i: any) => i.status === 'served' ? { ...i, status: 'pending' } : i);

	const existingTicket = await db.kds_tickets.findOne({ selector: { orderId, bumpedAt: null } }).exec();
	if (existingTicket) {
		console.warn(`[RECALL] Ticket for order ${orderId} already exists in active tickets`);
		return;
	}

	// Convert history ticket back to active by clearing bumped fields
	await historyDoc.incrementalPatch({
		items: restoredItems,
		bumpedAt: null,
		bumpedBy: null,
		updatedAt: new Date().toISOString()
	});

	const orderDoc = await db.orders.findOne(orderId).exec();
	if (orderDoc) {
		await orderDoc.incrementalModify((doc: any) => {
			doc.items = doc.items.map((i: any) => i.status === 'served' ? { ...i, status: 'pending' } : i);
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	log.kdsTicketRecalled(entry.tableNumber);
}

export async function recallLastTicket() {
	if (kdsTicketHistory.value.length === 0) return;
	await recallTicket(kdsTicketHistory.value[0].orderId);
}
