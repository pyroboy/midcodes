/**
 * POS KDS — Kitchen Display System state and ticket management.
 */
import type { KdsTicket, KdsHistoryEntry } from '$lib/types';
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';
import { createRxStore } from '$lib/stores/sync.svelte';
import { getDb } from '$lib/db';

const _kdsTickets = createRxStore<KdsTicket>('kds_tickets', db => db.kds_tickets.find());
const _kdsHistory = createRxStore<KdsHistoryEntry>('kds_history', db => db.kds_history.find({
	sort: [{ bumpedAt: 'desc' }]
}));

export const kdsTickets = {
	get value() { return _kdsTickets.value; },
	get initialized() { return _kdsTickets.initialized; }
};

export const kdsTicketHistory = {
	get value() { return _kdsHistory.value; },
	get initialized() { return _kdsHistory.initialized; }
};

// ─── KDS Actions ─────────────────────────────────────────────────────────────

export async function recallTicket(orderId: string) {
	const db = await getDb();
	const historyDoc = await db.kds_history.findOne({ selector: { orderId } }).exec();
	if (!historyDoc) return;

	const entry = historyDoc.toJSON();
	const restoredItems = entry.items.map((i: any) => i.status === 'served' ? { ...i, status: 'pending' } : i);

	const existingTicket = await db.kds_tickets.findOne({ selector: { orderId } }).exec();
	if (existingTicket) {
		console.warn(`[RECALL] Ticket for order ${orderId} already exists in active tickets`);
		return;
	}

	await db.kds_tickets.insert({
		id: nanoid(),
		orderId: entry.orderId,
		tableNumber: entry.tableNumber,
		customerName: entry.customerName,
		items: restoredItems,
		createdAt: entry.createdAt,
		updatedAt: new Date().toISOString()
	});

	await historyDoc.remove();

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
