import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore, recordPush, isResetting } from '$lib/server/replication-store';
import { trackClient, isLoopbackIP, recordClientSync } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';
import { nanoid } from 'nanoid';

// ─── Server-side Guard Audit Logger ──────────────────────────────────────────

function writeReplicationGuardAudit(
	guardType: string,
	tableId: string,
	locationId: string | undefined,
	existingOrderId: string,
	attemptedOrderId: string,
	description: string,
) {
	const auditStore = getCollectionStore('audit_logs');
	if (!auditStore) return;

	const now = new Date();
	const loc = locationId || 'unknown';
	auditStore.push([{
		newDocumentState: {
			id: nanoid(),
			locationId: loc,
			isoTimestamp: now.toISOString(),
			timestamp: now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
			user: 'System',
			role: 'system',
			branch: loc.toUpperCase(),
			action: 'admin',
			description,
			meta: JSON.stringify({
				guardType,
				guardLayer: 'replication',
				tableId,
				existingOrderId,
				attemptedOrderId,
			}),
			updatedAt: now.toISOString(),
		},
		assumedMasterState: null,
	}]);
}

// ─── Valid Table State Transitions ───────────────────────────────────────────
const VALID_TABLE_TRANSITIONS: Record<string, string[]> = {
	available: ['occupied', 'maintenance'],
	occupied: ['warning', 'critical', 'billing', 'available'],
	warning: ['critical', 'billing', 'available'],
	critical: ['billing', 'available'],
	billing: ['available'],
	maintenance: ['available'],
};

// ─── Business Logic Guard: Invalid Table State Transitions ──────────────────
// When a table status change is pushed via replication, validate that the
// transition is allowed. Drop invalid transitions silently.
function filterInvalidTableTransitions(
	changeRows: any[],
	collection: string
): { allowed: any[]; dropped: number } {
	if (collection !== 'tables') return { allowed: changeRows, dropped: 0 };

	const allowed: any[] = [];
	let dropped = 0;

	for (const row of changeRows) {
		const doc = row.newDocumentState;
		const assumed = row.assumedMasterState;

		// Only check updates (not inserts) that include a status change
		if (
			doc &&
			assumed &&
			doc.status &&
			assumed.status &&
			doc.status !== assumed.status
		) {
			const fromStatus: string = assumed.status;
			const toStatus: string = doc.status;
			const validTargets = VALID_TABLE_TRANSITIONS[fromStatus];

			if (!validTargets || !validTargets.includes(toStatus)) {
				const tableId = doc.id || 'unknown';
				log.warn('Sync',
					`[Guard] Dropped invalid table state transition for ${tableId} — ` +
					`${fromStatus} → ${toStatus} is not allowed`
				);
				writeReplicationGuardAudit(
					'invalid-state-transition', tableId, doc.locationId,
					assumed.currentOrderId ?? '—', doc.currentOrderId ?? '—',
					`[Sync Guard] Dropped invalid table state transition for ${tableId} — ${fromStatus} → ${toStatus}`
				);
				dropped++;
				continue;
			}
		}

		allowed.push(row);
	}

	return { allowed, dropped };
}

// ─── Valid Order State Transitions ───────────────────────────────────────────
const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
	open: ['pending_payment', 'paid', 'cancelled'],
	pending_payment: ['paid', 'open', 'cancelled'],
	// paid and cancelled are terminal — no transitions allowed
};

// ─── Business Logic Guard: Invalid Order State Transitions ──────────────────
// When an order status change is pushed via replication, validate that the
// transition is allowed. Drop invalid transitions silently.
function filterInvalidOrderTransitions(
	changeRows: any[],
	collection: string
): { allowed: any[]; dropped: number } {
	if (collection !== 'orders') return { allowed: changeRows, dropped: 0 };

	const allowed: any[] = [];
	let dropped = 0;

	for (const row of changeRows) {
		const doc = row.newDocumentState;
		const assumed = row.assumedMasterState;

		// Only check updates (not inserts) that include a status change
		if (
			doc &&
			assumed &&
			doc.status &&
			assumed.status &&
			doc.status !== assumed.status
		) {
			const fromStatus: string = assumed.status;
			const toStatus: string = doc.status;
			const validTargets = VALID_ORDER_TRANSITIONS[fromStatus];

			if (!validTargets || !validTargets.includes(toStatus)) {
				const orderId = doc.id || 'unknown';
				log.warn('Sync',
					`[Guard] Dropped invalid order state transition for ${orderId} — ` +
					`${fromStatus} → ${toStatus} is not allowed`
				);
				writeReplicationGuardAudit(
					'invalid-order-transition', orderId, doc.locationId,
					assumed.id ?? '—', doc.id ?? '—',
					`[Sync Guard] Dropped invalid order state transition for ${orderId} — ${fromStatus} → ${toStatus}`
				);
				dropped++;
				continue;
			}
		}

		allowed.push(row);
	}

	return { allowed, dropped };
}

// ─── Business Logic Guard: Duplicate Table Orders ────────────────────────────
// When a dine-in order is pushed for a table that already has an open order,
// silently drop the duplicate from the push (don't store it on the server).
// This prevents multi-device race conditions from creating duplicate orders.
//
// IMPORTANT: Cross-references the tables store to detect orphan orders.
// If a stale "open" order exists but the table doesn't confirm it, the order
// is an orphan — auto-cancel it and allow the new order through.
//
// NOTE: We don't return these as RxDB conflicts because the existing order
// has a different document ID — RxDB's conflict protocol is per-document.
function filterDuplicateTableOrders(
	changeRows: any[],
	collection: string
): { allowed: any[]; dropped: number } {
	if (collection !== 'orders') return { allowed: changeRows, dropped: 0 };

	const ordersStore = getCollectionStore('orders');
	if (!ordersStore) return { allowed: changeRows, dropped: 0 };

	const tablesStore = getCollectionStore('tables');

	const allDocs = ordersStore.pull(null, Infinity).documents;
	const allowed: any[] = [];
	let dropped = 0;

	for (const row of changeRows) {
		const doc = row.newDocumentState;
		if (
			doc &&
			doc.orderType === 'dine-in' &&
			doc.tableId &&
			doc.status === 'open' &&
			!doc._deleted &&
			// Only guard new inserts (assumedMasterState is null)
			!row.assumedMasterState
		) {
			const existing = allDocs.find(
				(o: any) =>
					o.tableId === doc.tableId &&
					o.status === 'open' &&
					!o._deleted &&
					o.id !== doc.id
			);
			if (existing) {
				// ── Pre-check: is this order backed by the table? ──
				let isOrphan = false;
				if (tablesStore) {
					const tableDocs = tablesStore.pull(null, Infinity).documents;
					const table = tableDocs.find((t: any) => t.id === doc.tableId && !t._deleted);
					if (table) {
						const tableConfirmsOrder = table.currentOrderId === existing.id
							&& table.status !== 'available';

						if (!tableConfirmsOrder) {
							// Orphan: auto-heal — cancel the stale order
							isOrphan = true;
							const now = new Date().toISOString();
							ordersStore.push([{
								newDocumentState: {
									...existing,
									status: 'cancelled',
									cancelReason: 'orphan-auto-healed',
									notes: `Auto-cancelled: table ${doc.tableId} was ${table.status} with currentOrderId=${table.currentOrderId ?? 'null'}, but this order was still open`,
									closedAt: now,
									updatedAt: now,
								},
								assumedMasterState: existing,
							}]);

							log.warn('Sync',
								`[Guard] Auto-healed orphan order ${existing.id} for table ${doc.tableId} — ` +
								`table.status=${table.status}, table.currentOrderId=${table.currentOrderId ?? 'null'}. ` +
								`Allowing incoming order ${doc.id}.`
							);
							writeReplicationGuardAudit(
								'orphan-auto-healed', doc.tableId, doc.locationId,
								existing.id, doc.id,
								`[Sync Guard] Auto-healed orphan order ${existing.id.slice(0, 8)}… for table ${doc.tableId} — table was ${table.status}, allowing new order ${doc.id.slice(0, 8)}…`
							);
						}
					}
				}

				if (!isOrphan) {
					// Real duplicate — table confirms the existing order is active
					log.warn('Sync', `[Guard] Dropped duplicate order for table ${doc.tableId} — existing: ${existing.id}, attempted: ${doc.id}`);
					dropped++;
					writeReplicationGuardAudit(
						'duplicate-order', doc.tableId, doc.locationId,
						existing.id, doc.id,
						`[Sync Guard] Dropped duplicate order for table ${doc.tableId} — existing: ${existing.id.slice(0, 8)}…, attempted: ${doc.id.slice(0, 8)}…`
					);
					continue;
				}
			}
		}
		allowed.push(row);
	}

	return { allowed, dropped };
}

// ─── Business Logic Guard: Duplicate Active KDS Tickets ─────────────────────
// When a KDS ticket is pushed for an order that already has an active ticket,
// merge the incoming items into the existing ticket instead of creating a duplicate.
// This prevents the race condition where kitchen recalls a bumped ticket while
// cashier simultaneously creates a new ticket for the same order.
function filterDuplicateKdsTickets(
	changeRows: any[],
	collection: string
): { allowed: any[]; dropped: number } {
	if (collection !== 'kds_tickets') return { allowed: changeRows, dropped: 0 };

	const kdsStore = getCollectionStore('kds_tickets');
	if (!kdsStore) return { allowed: changeRows, dropped: 0 };

	const allTickets = kdsStore.pull(null, Infinity).documents;
	const allowed: any[] = [];
	let dropped = 0;

	for (const row of changeRows) {
		const doc = row.newDocumentState;
		if (
			doc &&
			doc.orderId &&
			!doc.bumpedAt &&
			!doc._deleted &&
			// Only guard new inserts (assumedMasterState is null)
			!row.assumedMasterState
		) {
			const existingTicket = allTickets.find(
				(t: any) =>
					t.orderId === doc.orderId &&
					!t.bumpedAt &&
					!t._deleted &&
					t.id !== doc.id
			);
			if (existingTicket) {
				// Merge incoming items into the existing active ticket
				const existingItems: any[] = existingTicket.items || [];
				const incomingItems: any[] = doc.items || [];
				const existingIds = new Set(existingItems.map((i: any) => i.id));
				const newItems = incomingItems.filter((i: any) => !existingIds.has(i.id));

				if (newItems.length > 0) {
					const merged = {
						...existingTicket,
						items: [...existingItems, ...newItems],
						updatedAt: new Date().toISOString()
					};
					kdsStore.push([
						{ newDocumentState: merged, assumedMasterState: existingTicket }
					]);
					log.warn('Sync',
						`[Guard] Merged duplicate KDS ticket for order ${doc.orderId} — ` +
						`existing ticket: ${existingTicket.id}, incoming: ${doc.id}, ` +
						`merged ${newItems.length} new items into existing ticket.`
					);
				} else {
					log.warn('Sync',
						`[Guard] Dropped duplicate KDS ticket for order ${doc.orderId} — ` +
						`existing ticket: ${existingTicket.id}, incoming: ${doc.id}, ` +
						`no new items to merge.`
					);
				}

				writeReplicationGuardAudit(
					'duplicate-kds-ticket', doc.orderId, doc.locationId,
					existingTicket.id, doc.id,
					`[Sync Guard] Merged duplicate KDS ticket for order ${doc.orderId} — existing: ${existingTicket.id.slice(0, 8)}…, attempted: ${doc.id.slice(0, 8)}…`
				);
				dropped++;
				continue;
			}
		}
		allowed.push(row);
	}

	return { allowed, dropped };
}

// ─── Business Logic Guard: Duplicate Active Shifts ──────────────────────────
// When a new open shift is pushed for a location that already has an active shift,
// silently drop the duplicate from the push. Only one shift can be open per location.
function filterDuplicateActiveShifts(
	changeRows: any[],
	collection: string
): { allowed: any[]; dropped: number } {
	if (collection !== 'shifts') return { allowed: changeRows, dropped: 0 };

	const shiftsStore = getCollectionStore('shifts');
	if (!shiftsStore) return { allowed: changeRows, dropped: 0 };

	const allShifts = shiftsStore.pull(null, Infinity).documents;
	const allowed: any[] = [];
	let dropped = 0;

	for (const row of changeRows) {
		const doc = row.newDocumentState;
		if (
			doc &&
			doc.status === 'open' &&
			!doc._deleted &&
			// Only guard new inserts (assumedMasterState is null)
			!row.assumedMasterState
		) {
			const existingShift = allShifts.find(
				(s: any) =>
					s.locationId === doc.locationId &&
					s.status === 'open' &&
					!s._deleted &&
					s.id !== doc.id
			);
			if (existingShift) {
				log.warn('Sync',
					`[Guard] Dropped duplicate active shift for location ${doc.locationId} — ` +
					`existing shift: ${existingShift.id}, attempted: ${doc.id}`
				);
				writeReplicationGuardAudit(
					'duplicate-active-shift', doc.locationId, doc.locationId,
					existingShift.id, doc.id,
					`[Sync Guard] Dropped duplicate active shift for location ${doc.locationId} — existing: ${existingShift.id.slice(0, 8)}…, attempted: ${doc.id.slice(0, 8)}…`
				);
				dropped++;
				continue;
			}
		}
		allowed.push(row);
	}

	return { allowed, dropped };
}

// ─── Business Logic Guard: Duplicate Z-Reads ────────────────────────────────
// Z-Reads are BIR end-of-day permanent closes — exactly one per date per location.
// When a z-read is pushed for a date+location that already has one, drop it.
function filterDuplicateZReads(
	changeRows: any[],
	collection: string
): { allowed: any[]; dropped: number } {
	if (collection !== 'readings') return { allowed: changeRows, dropped: 0 };

	const readingsStore = getCollectionStore('readings');
	if (!readingsStore) return { allowed: changeRows, dropped: 0 };

	const allReadings = readingsStore.pull(null, Infinity).documents;
	const allowed: any[] = [];
	let dropped = 0;

	for (const row of changeRows) {
		const doc = row.newDocumentState;
		if (
			doc &&
			doc.type === 'z-read' &&
			doc.date &&
			doc.locationId &&
			!doc._deleted &&
			// Only guard new inserts (assumedMasterState is null)
			!row.assumedMasterState
		) {
			const existingReading = allReadings.find(
				(r: any) =>
					r.type === 'z-read' &&
					r.date === doc.date &&
					r.locationId === doc.locationId &&
					!r._deleted &&
					r.id !== doc.id
			);
			if (existingReading) {
				log.warn('Sync',
					`[Guard] Dropped duplicate Z-Read for ${doc.date} at ${doc.locationId} — ` +
					`existing: ${existingReading.id}, attempted: ${doc.id}`
				);
				writeReplicationGuardAudit(
					'duplicate-z-read', doc.locationId, doc.locationId,
					existingReading.id, doc.id,
					`[Sync Guard] Dropped duplicate Z-Read for ${doc.date} at ${doc.locationId} — existing: ${existingReading.id.slice(0, 8)}…, attempted: ${doc.id.slice(0, 8)}…`
				);
				dropped++;
				continue;
			}
		}
		allowed.push(row);
	}

	return { allowed, dropped };
}

// ─── Side-Effect Guard: Auto-bump KDS tickets when order closes ─────────────
// When an order transitions to 'paid' or 'cancelled' via replication push,
// find any active KDS tickets for that order and bump them. This is a side-effect
// (doesn't filter rows), so it runs after all filter guards.
function autoBumpKdsOnOrderClose(changeRows: any[], collection: string): void {
	if (collection !== 'orders') return;

	const kdsStore = getCollectionStore('kds_tickets');
	if (!kdsStore) return;

	const closedStatuses = new Set(['paid', 'cancelled']);

	for (const row of changeRows) {
		const doc = row.newDocumentState;
		const assumed = row.assumedMasterState;

		// Only handle transitions INTO a closed state
		if (
			doc && assumed &&
			doc.status && assumed.status &&
			closedStatuses.has(doc.status) &&
			!closedStatuses.has(assumed.status)
		) {
			const orderId = doc.id;
			const allTickets = kdsStore.pull(null, Infinity).documents;
			const activeTickets = allTickets.filter(
				(t: any) => t.orderId === orderId && !t.bumpedAt && !t._deleted
			);

			const now = new Date().toISOString();
			for (const ticket of activeTickets) {
				const servedItems = (ticket.items || []).map((i: any) =>
					i.status === 'pending' || i.status === 'cooking'
						? { ...i, status: 'served' }
						: i
				);
				kdsStore.push([{
					newDocumentState: {
						...ticket,
						items: servedItems,
						bumpedAt: now,
						bumpedBy: 'System (auto-bump)',
						updatedAt: now
					},
					assumedMasterState: ticket
				}]);
			}

			if (activeTickets.length > 0) {
				log.debug('Sync',
					`[Guard] Auto-bumped ${activeTickets.length} KDS ticket(s) for order ${orderId} → ${doc.status}`
				);
			}
		}
	}
}

export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
	const ip = getClientAddress();
	const isServer = isLoopbackIP(ip);

	// During a reset, silently drop pushes from LAN clients — they'll resync after SERVER_READY.
	// BUT: allow pushes from the server (loopback) — after a reset+reload, the server needs to
	// re-push its freshly seeded data to repopulate the in-memory store before broadcasting
	// SERVER_READY. Blocking the server's own pushes creates a deadlock where the store stays
	// empty and the "out of sync" state never resolves.
	if (isResetting() && !isServer) {
		log.debug('Reset', `🚫 Dropped ${params.collection} push from client ${ip} — reset in progress`);
		return json([]);
	}
	// Server pushes during reset are allowed (repopulating store) — logged at trace to avoid 15× spam
	if (isResetting() && isServer) {
		log.trace('Reset', `📤 Server repopulating ${params.collection}`);
	}

	const store = getCollectionStore(params.collection);
	if (!store) throw error(404, `Unknown collection: ${params.collection}`);

	const client = trackClient(ip, request.headers.get('user-agent') || '', `push/${params.collection}`);
	const label = isServer ? '💻 Server' : `📱 ${client.deviceHint}`;

	const changeRows = await request.json();
	if (!Array.isArray(changeRows)) throw error(400, 'Expected array of change rows');

	// Apply business logic guards before pushing
	const orderGuard = filterDuplicateTableOrders(changeRows, params.collection);
	const tableGuard = filterInvalidTableTransitions(orderGuard.allowed, params.collection);
	const kdsGuard = filterDuplicateKdsTickets(tableGuard.allowed, params.collection);
	const orderStateGuard = filterInvalidOrderTransitions(kdsGuard.allowed, params.collection);
	const shiftGuard = filterDuplicateActiveShifts(orderStateGuard.allowed, params.collection);
	const zReadGuard = filterDuplicateZReads(shiftGuard.allowed, params.collection);

	// Side-effect: auto-bump KDS tickets when an order closes (doesn't filter)
	autoBumpKdsOnOrderClose(zReadGuard.allowed, params.collection);

	const allowed = zReadGuard.allowed;
	const dropped = orderGuard.dropped + tableGuard.dropped + kdsGuard.dropped + orderStateGuard.dropped + shiftGuard.dropped + zReadGuard.dropped;

	const conflicts = allowed.length > 0 ? store.push(allowed) : [];

	if (!isServer) recordClientSync(ip);
	const col = params.collection;
	const accepted = changeRows.length - conflicts.length - dropped;

	// Track server store state + log milestones
	if (accepted > 0) recordPush(col, accepted);

	if (conflicts.length > 0 || dropped > 0) {
		log.warn('Sync', `⬆ ${label} pushed ${changeRows.length} docs → ${col} (${conflicts.length} conflicts${dropped > 0 ? `, ${dropped} dropped by guard` : ''}, store=${store.count()})`);
	} else if (isServer && changeRows.length === 1 && (col === 'tables' || col === 'devices')) {
		log.trace('Sync', `⬆ ${label} pushed 1 doc → ${col} (store=${store.count()})`);
	} else {
		log.debug('Sync', `⬆ ${label} pushed ${changeRows.length} docs → ${col} (store=${store.count()})`);
	}

	return json(conflicts);
};
