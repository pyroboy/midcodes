/**
 * POS KDS — Kitchen Display System state and ticket management.
 */
import type { KdsTicket, KdsTicketItem } from '$lib/types';
import { log } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';
import { createStore } from '$lib/stores/create-store.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { needsRxDb } from '$lib/stores/data-mode.svelte';
import { getDb } from '$lib/db';

const _kdsActive = createStore<KdsTicket>('kds_tickets', db => db.kds_tickets.find({
	selector: { bumpedAt: null }
}));
const _kdsHistory = createStore<KdsTicket>('kds_tickets_history', db => db.kds_tickets.find({
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
	let historyEntry: KdsTicket | undefined;
	let alreadyActive = false;

	if (needsRxDb()) {
		const db = await getDb();
		const historyDoc = await db.kds_tickets.findOne({ selector: { orderId, bumpedAt: { $ne: null } } }).exec();
		if (!historyDoc) return;
		historyEntry = historyDoc.toJSON() as KdsTicket;
		const existingTicket = await db.kds_tickets.findOne({ selector: { orderId, bumpedAt: null } }).exec();
		alreadyActive = !!existingTicket;
	} else {
		historyEntry = kdsTicketHistory.value.find(t => t.orderId === orderId && t.bumpedAt);
		if (!historyEntry) return;
		alreadyActive = kdsTickets.value.some(t => t.orderId === orderId);
	}

	const entry = historyEntry;
	const restoredItems = entry.items.map((i: KdsTicketItem) => i.status === 'served' ? { ...i, status: 'pending' as const } : i);

	if (alreadyActive) {
		console.warn(`[RECALL] Ticket for order ${orderId} already exists in active tickets`);
		return;
	}

	// Convert history ticket back to active by clearing bumped fields
	const kdsCol = getWritableCollection('kds_tickets');
	await kdsCol.incrementalPatch(entry.id, {
		items: restoredItems,
		bumpedAt: null,
		bumpedBy: null,
		updatedAt: new Date().toISOString()
	});

	const ordersCol = getWritableCollection('orders');
	const orderDoc = await ordersCol.findOne(orderId).exec();
	if (orderDoc) {
		await ordersCol.incrementalModify(orderId, (doc: any) => {
			doc.items = doc.items.map((i: KdsTicketItem) => i.status === 'served' ? { ...i, status: 'pending' as const } : i);
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	log.kdsTicketRecalled(entry.tableNumber);
}

export async function recallLastTicket() {
	const first = kdsTicketHistory.value[0];
	if (!first) return;
	await recallTicket(first.orderId);
}
