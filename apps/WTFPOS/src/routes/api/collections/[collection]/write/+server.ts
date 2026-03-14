import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore, isValidCollection } from '$lib/server/replication-store';
import { nanoid } from 'nanoid';

const PK_FIELD: Record<string, string> = { stock_counts: 'stockItemId' };

function getPk(collection: string, doc: any): string {
	return doc[PK_FIELD[collection] ?? 'id'];
}

function getAllDocs(store: ReturnType<typeof getCollectionStore>): any[] {
	const { documents } = store!.pull(null, Infinity);
	return documents;
}

function findDocById(store: ReturnType<typeof getCollectionStore>, collection: string, id: string) {
	return getAllDocs(store).find((doc: any) => getPk(collection, doc) === id) ?? null;
}

// ─── Server-side Guard Audit Logger ──────────────────────────────────────────

function writeServerGuardAudit(
	guardType: string,
	guardLayer: string,
	tableId: string,
	locationId: string | undefined,
	existingOrderId: string | null,
	attemptedOrderId: string | null,
) {
	const auditStore = getCollectionStore('audit_logs');
	if (!auditStore) return;

	const now = new Date();
	const label = guardLayer === 'replication' ? 'Sync Guard' : 'Write Guard';
	const shortExisting = existingOrderId ? existingOrderId.slice(0, 8) + '…' : '—';
	const shortAttempted = attemptedOrderId ? attemptedOrderId.slice(0, 8) + '…' : '—';
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
			description: `[${label}] Blocked ${guardType} on table ${tableId} (existing: ${shortExisting}, attempted: ${shortAttempted})`,
			meta: JSON.stringify({ guardType, guardLayer, tableId, existingOrderId, attemptedOrderId }),
			updatedAt: now.toISOString(),
		},
		assumedMasterState: null,
	}]);
}

// ─── Valid Table State Transitions ───────────────────────────────────────────
const VALID_TABLE_TRANSITIONS: Record<string, string[]> = {
	available: ['occupied', 'maintenance'],
	occupied: ['warning', 'critical', 'billing'],
	warning: ['critical', 'billing', 'available'],
	critical: ['billing', 'available'],
	billing: ['available'],
	maintenance: ['available'],
};

// ─── Business Logic Guards ───────────────────────────────────────────────────
// These prevent multi-device race conditions where two thin clients can both
// see a table as "available" and independently create orders for it.
//
// IMPORTANT: The table document is the source of truth for occupancy.
// If a stale "open" order exists but the table doesn't confirm it (e.g. table
// was closed but the order's status update was lost), the order is an orphan.
// We auto-heal orphans instead of falsely blocking new orders.

/**
 * Guard: Reject dine-in order insert if the table already has an open order.
 * Returns the existing order if found (idempotent), or null to proceed.
 *
 * Pre-check: cross-references the tables store to detect orphan orders.
 * If the table's currentOrderId doesn't match the "blocking" order, the order
 * is an orphan from a previous session — auto-cancel it and allow the new order.
 */
function guardDuplicateTableOrder(
	data: any
): { existingOrder: any } | null {
	if (data.orderType !== 'dine-in' || !data.tableId) return null;

	const ordersStore = getCollectionStore('orders');
	if (!ordersStore) return null;

	const allOrders = getAllDocs(ordersStore);
	const existingOrder = allOrders.find(
		(o: any) =>
			o.tableId === data.tableId &&
			o.status === 'open' &&
			!o._deleted &&
			o.id !== data.id // don't match against itself
	);

	if (!existingOrder) return null;

	// ── Pre-check: is this order actually backed by the table? ──
	const tablesStore = getCollectionStore('tables');
	if (tablesStore) {
		const table = getAllDocs(tablesStore).find((t: any) => t.id === data.tableId && !t._deleted);
		if (table) {
			const tableConfirmsOrder = table.currentOrderId === existingOrder.id
				&& table.status !== 'available';

			if (!tableConfirmsOrder) {
				// Orphan order detected — table has moved on but order is still 'open'.
				// Auto-heal: cancel the orphan so it doesn't block future orders.
				const now = new Date().toISOString();
				ordersStore.push([{
					newDocumentState: {
						...existingOrder,
						status: 'cancelled',
						cancelReason: 'orphan-auto-healed',
						notes: `Auto-cancelled: table ${data.tableId} was ${table.status} with currentOrderId=${table.currentOrderId ?? 'null'}, but this order was still open`,
						closedAt: now,
						updatedAt: now,
					},
					assumedMasterState: existingOrder,
				}]);

				console.warn(
					`[Write Guard] Auto-healed orphan order ${existingOrder.id} for table ${data.tableId} — ` +
					`table status: ${table.status}, table.currentOrderId: ${table.currentOrderId ?? 'null'}, ` +
					`orphan order was still 'open'. Allowing new order ${data.id}.`
				);
				writeServerGuardAudit('orphan-auto-healed', 'write-api', data.tableId, data.locationId, existingOrder.id, data.id);
				return null; // ALLOW the new order
			}
		}
	}

	// Table confirms this order is active — real guard
	console.warn(
		`[Write Guard] Blocked duplicate order for table ${data.tableId} — ` +
		`existing order: ${existingOrder.id}, attempted: ${data.id}`
	);
	writeServerGuardAudit('duplicate-order', 'write-api', data.tableId, data.locationId, existingOrder.id, data.id);
	return { existingOrder };
}

/**
 * Guard: Reject table patch to 'occupied' if it's already occupied.
 * Returns the current table doc (idempotent no-op) so the client isn't confused.
 */
function guardDuplicateTableOccupancy(
	collection: string,
	id: string,
	data: any,
	existing: any
): { currentDoc: any } | null {
	if (collection !== 'tables') return null;
	if (data.status !== 'occupied') return null;
	if (existing.status !== 'occupied') return null;

	// Table is already occupied — return current state, don't overwrite
	console.warn(
		`[Write Guard] Blocked duplicate table occupancy for ${id} — ` +
		`already occupied with order ${existing.currentOrderId}`
	);
	writeServerGuardAudit('duplicate-occupancy', 'write-api', id, existing.locationId, existing.currentOrderId, null);
	return { currentDoc: existing };
}

/**
 * Guard: Reject table status change if the transition is not in VALID_TABLE_TRANSITIONS.
 * Returns the current table doc (idempotent no-op) so the client stays consistent.
 */
function guardTableStateTransition(
	collection: string,
	id: string,
	data: any,
	existing: any
): { currentDoc: any } | null {
	if (collection !== 'tables') return null;
	if (!data.status) return null;

	const fromStatus: string = existing.status;
	const toStatus: string = data.status;

	// Same status is a no-op, not an invalid transition
	if (fromStatus === toStatus) return null;

	const allowed = VALID_TABLE_TRANSITIONS[fromStatus];
	if (!allowed || !allowed.includes(toStatus)) {
		console.warn(
			`[Write Guard] Blocked invalid table state transition for ${id} — ` +
			`${fromStatus} → ${toStatus} is not allowed`
		);
		writeServerGuardAudit('invalid-state-transition', 'write-api', id, existing.locationId, existing.currentOrderId ?? null, null);
		return { currentDoc: existing };
	}

	return null;
}

/**
 * Guard: Prevent duplicate active KDS tickets for the same order.
 * When kitchen recalls a bumped ticket while cashier simultaneously creates
 * a new ticket (e.g. for a refill), two active tickets can race into existence.
 * Instead of blocking, we merge incoming items into the existing active ticket.
 */
function guardDuplicateKdsTicket(
	data: any
): { existingTicket: any } | null {
	if (!data.orderId) return null;
	// Only guard new active tickets (bumpedAt should be null/undefined)
	if (data.bumpedAt) return null;

	const kdsStore = getCollectionStore('kds_tickets');
	if (!kdsStore) return null;

	const allTickets = getAllDocs(kdsStore);
	const existingTicket = allTickets.find(
		(t: any) =>
			t.orderId === data.orderId &&
			!t.bumpedAt &&
			!t._deleted &&
			t.id !== data.id
	);

	if (!existingTicket) return null;

	console.warn(
		`[Write Guard] Duplicate active KDS ticket for order ${data.orderId} — ` +
		`existing ticket: ${existingTicket.id}, attempted: ${data.id}. Merging items.`
	);
	writeServerGuardAudit('duplicate-kds-ticket', 'write-api', data.orderId, data.locationId, existingTicket.id, data.id);
	return { existingTicket };
}

/**
 * Guard: Reject table close (status → 'available') if the associated order is still open.
 * Prevents "reverse orphan" where a table gets released but its order remains open/pending.
 * Returns the current table doc to block the close, or null to allow it.
 */
function guardTableCloseWithOpenOrder(
	collection: string,
	id: string,
	data: any,
	existing: any
): { currentDoc: any } | null {
	if (collection !== 'tables') return null;
	if (data.status !== 'available') return null;
	if (existing.status === 'available') return null; // already available, no-op

	// Only check when the table has an order to verify
	const orderIdBeingCleared = existing.currentOrderId;
	if (!orderIdBeingCleared) return null; // no order to check

	// Look up the order in the orders store
	const ordersStore = getCollectionStore('orders');
	if (!ordersStore) return null; // can't verify, allow

	const allOrders = getAllDocs(ordersStore);
	const order = allOrders.find((o: any) => o.id === orderIdBeingCleared && !o._deleted);

	if (!order) return null; // order doesn't exist or was deleted, allow close

	// If the order is still open or pending payment, block the table close
	if (order.status === 'open' || order.status === 'pending_payment') {
		console.warn(
			`[Write Guard] Blocked table close for ${id} — ` +
			`order ${orderIdBeingCleared} is still '${order.status}'`
		);
		writeServerGuardAudit('table-close-with-open-order', 'write-api', id, existing.locationId, orderIdBeingCleared, null);
		return { currentDoc: existing };
	}

	// Order is paid/cancelled — allow the close
	return null;
}

/**
 * Detection (non-blocking): After a deduction insert, check if computed stock
 * for the item has gone negative. Writes an audit log if so.
 */
function detectStockNegativity(deductionData: any) {
	const stockStore = getCollectionStore('stock_items');
	const deductionsStore = getCollectionStore('deductions');
	const deliveriesStore = getCollectionStore('deliveries');
	if (!stockStore || !deductionsStore || !deliveriesStore) return;

	const stockItemId: string = deductionData.stockItemId;
	if (!stockItemId) return;

	const allStockItems = getAllDocs(stockStore);
	const stockItem = allStockItems.find((s: any) => s.id === stockItemId && !s._deleted);
	if (!stockItem) return;

	const openingStock: number = stockItem.openingStock ?? 0;

	// Sum all deliveries for this item
	const allDeliveries = getAllDocs(deliveriesStore);
	const totalDelivered = allDeliveries
		.filter((d: any) => d.stockItemId === stockItemId && !d._deleted)
		.reduce((sum: number, d: any) => sum + (d.qty ?? 0), 0);

	// Sum all deductions for this item (including the one just inserted)
	const allDeductions = getAllDocs(deductionsStore);
	const totalDeducted = allDeductions
		.filter((d: any) => d.stockItemId === stockItemId && !d._deleted)
		.reduce((sum: number, d: any) => sum + (d.qty ?? 0), 0);

	const computedStock = openingStock + totalDelivered - totalDeducted;

	if (computedStock < 0) {
		const unit = stockItem.unit ?? 'g';
		const itemName = stockItem.name ?? stockItemId;
		const tableId = deductionData.tableId ?? 'unknown';

		const auditStore = getCollectionStore('audit_logs');
		if (!auditStore) return;

		const now = new Date();
		auditStore.push([{
			newDocumentState: {
				id: nanoid(),
				locationId: deductionData.locationId || 'unknown',
				isoTimestamp: now.toISOString(),
				timestamp: now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
				user: 'System',
				role: 'system',
				branch: (deductionData.locationId || 'unknown').toUpperCase(),
				action: 'admin',
				description: `[Write Guard] Stock for ${itemName} went negative: ${computedStock}${unit} after deduction of ${deductionData.qty}${unit} (table: ${tableId})`,
				meta: JSON.stringify({
					guardType: 'stock-negative',
					guardLayer: 'write-api',
					stockItemId,
					tableId,
					computedStock,
					deductionQty: deductionData.qty,
				}),
				updatedAt: now.toISOString(),
			},
			assumedMasterState: null,
		}]);

		console.warn(
			`[Write Guard] Stock negativity detected for ${itemName}: ${computedStock}${unit} after deduction of ${deductionData.qty}${unit}`
		);
	}
}

export const POST: RequestHandler = async ({ params, request }) => {
	const { collection } = params;

	if (!isValidCollection(collection)) {
		return json({ error: `Invalid collection: ${collection}` }, { status: 400 });
	}

	const store = getCollectionStore(collection);
	if (!store) {
		return json({ error: `Store not found: ${collection}` }, { status: 404 });
	}

	const body = await request.json();
	const { operation, id, data } = body as {
		operation: string;
		id?: string;
		data?: any;
	};

	switch (operation) {
		case 'insert': {
			if (!data) {
				return json({ error: 'Missing data for insert' }, { status: 400 });
			}
			if (!data.updatedAt) {
				data.updatedAt = new Date().toISOString();
			}

			// Guard: prevent duplicate dine-in orders for the same table
			if (collection === 'orders') {
				const guard = guardDuplicateTableOrder(data);
				if (guard) {
					return json({
						document: guard.existingOrder,
						conflicts: [],
						guarded: true,
						reason: `Table ${data.tableId} already has open order ${guard.existingOrder.id}`
					});
				}
			}

			// Guard: prevent duplicate active KDS tickets — merge items instead
			if (collection === 'kds_tickets') {
				const kdsGuard = guardDuplicateKdsTicket(data);
				if (kdsGuard) {
					const existingItems: any[] = kdsGuard.existingTicket.items || [];
					const incomingItems: any[] = data.items || [];
					// Dedup by item id — only append truly new items
					const existingIds = new Set(existingItems.map((i: any) => i.id));
					const newItems = incomingItems.filter((i: any) => !existingIds.has(i.id));
					const merged = {
						...kdsGuard.existingTicket,
						items: [...existingItems, ...newItems],
						updatedAt: new Date().toISOString()
					};
					const conflicts = store.push([
						{ newDocumentState: merged, assumedMasterState: kdsGuard.existingTicket }
					]);
					return json({
						document: merged,
						conflicts,
						guarded: true,
						merged: true,
						reason: `Merged items into existing active ticket ${kdsGuard.existingTicket.id} for order ${data.orderId}`
					});
				}
			}

			const conflicts = store.push([
				{ newDocumentState: data, assumedMasterState: null }
			]);

			// Post-insert: detect stock negativity for deductions (non-blocking)
			if (collection === 'deductions') {
				detectStockNegativity(data);
			}

			return json({ document: data, conflicts });
		}

		case 'patch': {
			if (!id) {
				return json({ error: 'Missing id for patch' }, { status: 400 });
			}
			const existing = findDocById(store, collection, id);
			if (!existing) {
				return json({ error: `Document not found: ${id}` }, { status: 404 });
			}

			// Guard: prevent patching a table to occupied when it's already occupied
			const tableGuard = guardDuplicateTableOccupancy(collection, id, data, existing);
			if (tableGuard) {
				return json({
					document: tableGuard.currentDoc,
					conflicts: [],
					guarded: true,
					reason: `Table ${id} is already occupied`
				});
			}

			// Guard: prevent invalid table state transitions
			const stateGuard = guardTableStateTransition(collection, id, data, existing);
			if (stateGuard) {
				return json({
					document: stateGuard.currentDoc,
					conflicts: [],
					guarded: true,
					reason: `Invalid table state transition: ${existing.status} → ${data.status}`
				});
			}

			// Guard: prevent table close if associated order is still open/pending
			const closeGuard = guardTableCloseWithOpenOrder(collection, id, data, existing);
			if (closeGuard) {
				return json({
					document: closeGuard.currentDoc,
					conflicts: [],
					guarded: true,
					reason: `Table ${id} cannot close — order ${existing.currentOrderId} is still open`
				});
			}

			const merged = {
				...existing,
				...data,
				updatedAt: new Date().toISOString()
			};
			const conflicts = store.push([
				{ newDocumentState: merged, assumedMasterState: existing }
			]);
			return json({ document: merged, conflicts });
		}

		case 'remove': {
			if (!id) {
				return json({ error: 'Missing id for remove' }, { status: 400 });
			}
			const existing = findDocById(store, collection, id);
			if (!existing) {
				return json({ error: `Document not found: ${id}` }, { status: 404 });
			}
			const deleted = {
				...existing,
				_deleted: true,
				updatedAt: new Date().toISOString()
			};
			const conflicts = store.push([
				{ newDocumentState: deleted, assumedMasterState: existing }
			]);
			return json({ document: deleted, conflicts });
		}

		default:
			return json({ error: `Unknown operation: ${operation}` }, { status: 400 });
	}
};
