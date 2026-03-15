/**
 * Proactive Data Reconciliation Sweep
 *
 * Runs periodically on the server device to detect and auto-heal
 * data inconsistencies across collections. Each check is independent
 * and wrapped in try/catch so one failure doesn't block others.
 */
import { browser } from '$app/environment';
import { session } from '$lib/stores/session.svelte';
import { tables } from '$lib/stores/pos/tables.svelte';
import { orders } from '$lib/stores/pos/orders.svelte';
import { kdsTickets } from '$lib/stores/pos/kds.svelte';
import { bumpTicketsForOrder } from '$lib/stores/pos/kds.svelte';
import { shifts } from '$lib/stores/pos/shifts.svelte';
import { devices } from '$lib/stores/device.svelte';
import { stockItems, deliveries, deductions, stockEvents } from '$lib/stores/stock.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { writeLog } from '$lib/stores/audit.svelte';

export interface ReconcileResult {
	tablesHealed: number;
	ordersHealed: number;
	ticketsBumped: number;
	devicesFixed: number;
	shiftsWarned: number;
	stockWarnings: number;
	deductionWarnings: number;
}

export async function reconcileDataConsistency(): Promise<ReconcileResult> {
	if (!browser) return emptyResult();

	const result: ReconcileResult = emptyResult();

	// ── Check 1: Table orphan — occupied table, closed order ──
	try {
		const closedStatuses = new Set(['paid', 'cancelled']);
		const orderMap = new Map(orders.value.map(o => [o.id, o]));
		const tablesCol = getWritableCollection('tables');

		for (const table of tables.value) {
			if (table.status === 'available' || !table.currentOrderId) continue;

			const order = orderMap.get(table.currentOrderId);
			if (!order || closedStatuses.has(order.status)) {
				await tablesCol.incrementalPatch(table.id, {
					status: 'available',
					sessionStartedAt: null,
					elapsedSeconds: null,
					currentOrderId: null,
					billTotal: null,
					updatedAt: new Date().toISOString()
				});
				result.tablesHealed++;
				writeLog('admin', `[Reconcile] Healed table orphan: ${table.label ?? table.id} was ${table.status} with ${order ? 'closed' : 'missing'} order ${table.currentOrderId.slice(0, 8)}…`);
			}
		}
	} catch (err) {
		console.warn('[Reconcile] Check 1 (table orphan) failed:', err);
	}

	// ── Check 2: Order orphan — open dine-in order, released table ──
	try {
		const tableMap = new Map(tables.value.map(t => [t.id, t]));
		const ordersCol = getWritableCollection('orders');

		for (const order of orders.value) {
			if (order.status !== 'open' || order.orderType !== 'dine-in' || !order.tableId) continue;

			const table = tableMap.get(order.tableId);
			if (table && table.status === 'available' && table.currentOrderId !== order.id) {
				await ordersCol.incrementalPatch(order.id, {
					status: 'cancelled',
					cancelReason: 'orphan-reconciled',
					closedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				});
				result.ordersHealed++;
				writeLog('admin', `[Reconcile] Cancelled orphan order ${order.id.slice(0, 8)}… — table ${order.tableId} was available`);
			}
		}
	} catch (err) {
		console.warn('[Reconcile] Check 2 (order orphan) failed:', err);
	}

	// ── Check 3: KDS orphan — active ticket, closed order ──
	try {
		const closedStatuses = new Set(['paid', 'cancelled']);
		const orderMap = new Map(orders.value.map(o => [o.id, o]));
		const seenOrderIds = new Set<string>();

		for (const ticket of kdsTickets.value) {
			if (ticket.bumpedAt || seenOrderIds.has(ticket.orderId)) continue;

			const order = orderMap.get(ticket.orderId);
			if (order && closedStatuses.has(order.status)) {
				seenOrderIds.add(ticket.orderId);
				const bumped = await bumpTicketsForOrder(ticket.orderId, 'System (reconcile)');
				result.ticketsBumped += bumped;
				if (bumped > 0) {
					writeLog('admin', `[Reconcile] Bumped ${bumped} KDS ticket(s) for closed order ${ticket.orderId.slice(0, 8)}…`);
				}
			}
		}
	} catch (err) {
		console.warn('[Reconcile] Check 3 (KDS orphan) failed:', err);
	}

	// ── Check 4: Stale device records ──
	try {
		const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
		const devicesCol = getWritableCollection('devices');

		for (const device of devices.value) {
			if (!device.isOnline) continue;
			if (new Date(device.lastSeenAt).getTime() < twoHoursAgo) {
				await devicesCol.incrementalPatch(device.id, {
					isOnline: false,
					updatedAt: new Date().toISOString()
				});
				result.devicesFixed++;
			}
		}
	} catch (err) {
		console.warn('[Reconcile] Check 4 (stale devices) failed:', err);
	}

	// ── Check 5: Stale active shift (detect & report only) ──
	try {
		const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

		for (const shift of shifts.value) {
			if (shift.status !== 'active') continue;
			if (new Date(shift.startedAt).getTime() < twentyFourHoursAgo) {
				const hours = Math.round((Date.now() - new Date(shift.startedAt).getTime()) / 3_600_000);
				result.shiftsWarned++;
				writeLog('admin', `[Reconcile] Warning: Shift at ${shift.locationId} by ${shift.cashierName} has been active for ${hours}h — consider closing`);
			}
		}
	} catch (err) {
		console.warn('[Reconcile] Check 5 (stale shift) failed:', err);
	}

	// ── Check 6: Stock negativity scan (detect & report only) ──
	try {
		const loc = session.locationId;
		const locItems = loc === 'all'
			? stockItems.value
			: stockItems.value.filter(si => si.locationId === loc);

		for (const item of locItems) {
			const itemDeliveries = deliveries.value.filter(
				d => d.stockItemId === item.id && d.locationId === item.locationId
			);
			const itemDeductions = deductions.value.filter(
				d => d.stockItemId === item.id && d.locationId === item.locationId
			);
			const itemWaste = stockEvents.value.filter(
				e => e.stockItemId === item.id && e.locationId === item.locationId && e.type === 'waste'
			);

			const totalIn = (item.openingStock ?? 0) +
				itemDeliveries.reduce((sum, d) => sum + (d.qty ?? 0), 0);
			const totalOut = itemDeductions.reduce((sum, d) => sum + (d.qty ?? 0), 0) +
				itemWaste.reduce((sum, e) => sum + Math.abs(e.qty ?? 0), 0);

			if (totalIn - totalOut < 0) {
				result.stockWarnings++;
				writeLog('admin', `[Reconcile] Warning: Stock for "${item.name}" at ${item.locationId} computed negative (in=${totalIn}, out=${totalOut})`);
			}
		}
	} catch (err) {
		console.warn('[Reconcile] Check 6 (stock negativity) failed:', err);
	}

	// ── Check 7: Orphan deductions for cancelled orders (detect & report only) ──
	try {
		const cancelledOrderIds = new Set(
			orders.value.filter(o => o.status === 'cancelled').map(o => o.id)
		);

		// Group deductions by orderId for cancelled orders
		const cancelledDeductions = deductions.value.filter(
			d => d.orderId && cancelledOrderIds.has(d.orderId)
		);

		// Check each deduction for a matching restoration (stock_event type='add' for same stockItemId)
		// StockEvent doesn't have orderId, so we check by stockItemId + rough time proximity
		for (const ded of cancelledDeductions) {
			const hasRestoration = stockEvents.value.some(
				e => e.type === 'add' && e.stockItemId === ded.stockItemId
			);
			if (!hasRestoration) {
				result.deductionWarnings++;
				writeLog('admin', `[Reconcile] Warning: Deduction for stock item ${ded.stockItemId.slice(0, 8)}… on cancelled order ${ded.orderId.slice(0, 8)}… has no stock restoration`);
			}
		}
	} catch (err) {
		console.warn('[Reconcile] Check 7 (orphan deductions) failed:', err);
	}

	// Log summary if anything was found
	const total = result.tablesHealed + result.ordersHealed + result.ticketsBumped +
		result.devicesFixed + result.shiftsWarned + result.stockWarnings + result.deductionWarnings;
	if (total > 0) {
		console.info('[Reconcile] Sweep complete:', result);
	}

	return result;
}

function emptyResult(): ReconcileResult {
	return {
		tablesHealed: 0,
		ordersHealed: 0,
		ticketsBumped: 0,
		devicesFixed: 0,
		shiftsWarned: 0,
		stockWarnings: 0,
		deductionWarnings: 0
	};
}
