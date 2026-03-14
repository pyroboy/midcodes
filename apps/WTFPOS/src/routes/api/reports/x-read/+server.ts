/**
 * Server-side X-Read snapshot generator.
 *
 * Generates a BIR X-Read (mid-shift reading) from the server's in-memory
 * replication store. This guarantees a consistent snapshot — no reactive
 * store race conditions that can occur on the client when a checkout
 * completes during X-Read generation.
 *
 * POST { locationId: string }
 * Returns the generated Reading document as JSON.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore } from '$lib/server/replication-store';
import { nanoid } from 'nanoid';

/** Get today's date string in Asia/Manila timezone as YYYY-MM-DD */
function getManilaToday(): string {
	return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

/** Check if an ISO timestamp falls on today's Manila business day */
function isToday(isoTimestamp: string | null | undefined): boolean {
	if (!isoTimestamp) return false;
	const today = getManilaToday();
	const docDate = new Date(isoTimestamp).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
	return docDate === today;
}

/** Pull all non-deleted documents from a collection store */
function getAllDocs(storeName: string): any[] {
	const store = getCollectionStore(storeName);
	if (!store) return [];
	const { documents } = store.pull(null, Infinity);
	return documents.filter((d: any) => !d._deleted);
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { locationId } = body as { locationId: string };

	if (!locationId) {
		return json({ error: 'Missing locationId' }, { status: 400 });
	}

	// ── Pull all orders and filter to today + location ──
	const allOrders = getAllDocs('orders');
	const locationOrders = locationId === 'all'
		? allOrders
		: allOrders.filter((o: any) => o.locationId === locationId);

	// Paid orders closed today
	const paidToday = locationOrders.filter(
		(o: any) => o.status === 'paid' && isToday(o.closedAt || o.createdAt)
	);

	// Cancelled orders today (for void metrics)
	const cancelledToday = locationOrders.filter(
		(o: any) => o.status === 'cancelled' && isToday(o.closedAt || o.createdAt)
	);

	// ── Compute totals from the consistent snapshot ──
	let grossSales = 0;
	let discounts = 0;
	let netSales = 0;
	let vatAmount = 0;
	let totalPax = 0;
	let cash = 0;
	let gcash = 0;
	let maya = 0;
	let card = 0;
	let discountCount = 0;

	for (const order of paidToday) {
		grossSales += order.subtotal ?? 0;
		discounts += order.discountAmount ?? 0;
		netSales += order.total ?? 0;
		vatAmount += order.vatAmount ?? 0;
		totalPax += order.pax ?? 0;

		// Payment method breakdown
		const payments: { method: string; amount: number }[] = order.payments ?? [];
		for (const p of payments) {
			switch (p.method) {
				case 'cash':
					cash += Math.min(p.amount, order.total ?? 0);
					break;
				case 'gcash':
					gcash += p.amount;
					break;
				case 'maya':
					maya += p.amount;
					break;
				case 'card':
					card += p.amount;
					break;
			}
		}

		// Count discounted orders
		if (
			(order.discountType && order.discountType !== 'none') ||
			(order.discountEntries && Object.keys(order.discountEntries).length > 0)
		) {
			discountCount++;
		}
	}

	const voidCount = cancelledToday.length;
	const voidAmount = cancelledToday.reduce((s: number, o: any) => s + (o.total ?? 0), 0);

	// ── Build the reading document ──
	const now = new Date().toISOString();
	const effectiveLocationId = locationId === 'all' ? 'tag' : locationId;

	const reading = {
		id: nanoid(),
		type: 'x-read' as const,
		locationId: effectiveLocationId,
		timestamp: now,
		updatedAt: now,
		grossSales,
		discounts,
		netSales,
		vatAmount,
		totalPax,
		cash,
		gcash,
		maya,
		card,
		voidCount,
		voidAmount,
		discountCount,
		generatedBy: null as string | null, // Will be set by the client if needed
	};

	// ── Insert into the server readings store ──
	const readingsStore = getCollectionStore('readings');
	if (readingsStore) {
		readingsStore.push([
			{ newDocumentState: reading, assumedMasterState: null }
		]);
	}

	return json(reading);
};
