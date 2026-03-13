/**
 * DB Cleanup — prune stale records from IndexedDB to prevent QuotaExceededError.
 *
 * Collections that grow unboundedly without cleanup:
 *   - orders        (paid/cancelled accumulate forever)
 *   - kds_tickets   (bumped history never trimmed)
 *   - audit_logs    (every action logged, never deleted)
 *   - deductions    (per-item stock deductions, not needed after 30d)
 *   - stock_events  (waste/adjustment events, not needed after 30d)
 *
 * Call pruneOldData() once at app startup (root layout onMount).
 * It runs async in the background — never blocks the UI.
 */

import { browser } from '$app/environment';
import { getDb } from '$lib/db';
import { needsRxDb } from '$lib/stores/data-mode.svelte';

/** Retention windows */
const ORDERS_RETENTION_DAYS      = 30;
const KDS_HISTORY_RETENTION_DAYS = 7;
const AUDIT_LOG_RETENTION_DAYS   = 30;
const STOCK_EVENT_RETENTION_DAYS = 30;
const DEDUCTION_RETENTION_DAYS   = 30;

function daysAgoIso(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d.toISOString();
}

export async function pruneOldData(): Promise<void> {
	if (!browser) return;
	if (!needsRxDb()) return; // No DB to clean on thin clients

	// Thin clients use memory storage — cleanup is pointless (data is ephemeral)
	const isRemoteClient = window.location.hostname !== 'localhost'
		&& window.location.hostname !== '127.0.0.1';
	if (isRemoteClient) return;

	try {
		const db = await getDb();

		const [
			oldOrders,
			oldKdsHistory,
			oldAuditLogs,
			oldStockEvents,
			oldDeductions
		] = await Promise.all([
			// Paid or cancelled orders older than 30 days — never delete open/pending_payment
			db.orders.find({
				selector: {
					status: { $in: ['paid', 'cancelled'] },
					closedAt: { $lt: daysAgoIso(ORDERS_RETENTION_DAYS) }
				}
			}).exec(),

			// KDS history (bumped tickets) older than 7 days
			db.kds_tickets.find({
				selector: {
					bumpedAt: { $ne: null, $lt: daysAgoIso(KDS_HISTORY_RETENTION_DAYS) }
				}
			}).exec(),

			// Audit log entries older than 30 days
			db.audit_logs.find({
				selector: {
					isoTimestamp: { $lt: daysAgoIso(AUDIT_LOG_RETENTION_DAYS) }
				}
			}).exec(),

			// Stock events older than 30 days
			db.stock_events.find({
				selector: {
					updatedAt: { $lt: daysAgoIso(STOCK_EVENT_RETENTION_DAYS) }
				}
			}).exec(),

			// Deductions older than 30 days
			db.deductions.find({
				selector: {
					updatedAt: { $lt: daysAgoIso(DEDUCTION_RETENTION_DAYS) }
				}
			}).exec()
		]);

		const counts = {
			orders:      oldOrders.length,
			kdsHistory:  oldKdsHistory.length,
			auditLogs:   oldAuditLogs.length,
			stockEvents: oldStockEvents.length,
			deductions:  oldDeductions.length
		};

		const total = Object.values(counts).reduce((a, b) => a + b, 0);
		if (total === 0) return;

		// Bulk remove — RxDB remove() marks deleted, Dexie GCs on next compaction
		const allDocs: { remove(): Promise<any> }[] = [
			...oldOrders,
			...oldKdsHistory,
			...oldAuditLogs,
			...oldStockEvents,
			...oldDeductions
		];
		await Promise.all(allDocs.map(d => d.remove()));

		console.info(
			`[DB Cleanup] Pruned ${total} stale records:`,
			counts
		);
	} catch (err) {
		// Cleanup is best-effort — never crash the app over it
		console.warn('[DB Cleanup] Prune failed (non-fatal):', err);
	}
}
