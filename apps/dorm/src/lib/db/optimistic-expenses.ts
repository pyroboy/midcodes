import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/**
 * Optimistic write helpers for expense documents in RxDB.
 *
 * Pattern: upsert/remove in RxDB immediately (UI updates same frame),
 * then fire a background resync to reconcile with Neon.
 */

/**
 * Optimistically insert or update an expense in RxDB.
 * Call after the server confirms success.
 */
export async function optimisticUpsertExpense(data: {
	id: number;
	property_id?: number | null;
	amount: string;
	description: string;
	type: string;
	status: string;
	expense_date?: string | null;
	created_by?: string | null;
}): Promise<(() => Promise<void>) | null> {
	console.log(`[Optimistic] expense #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: expense #${data.id} → writing to RxDB...`, 'info');
	let snapshot: Record<string, any> | null = null;
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.expenses.findOne(sid).exec();
		snapshot = existing ? existing.toJSON(true) : null;
		await db.expenses.upsert({
			id: sid,
			property_id: data.property_id != null ? String(data.property_id) : null,
			amount: data.amount,
			description: data.description,
			type: data.type,
			status: data.status,
			expense_date: data.expense_date ?? null,
			created_by: data.created_by ?? existing?.created_by ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null
		});
		console.log(`[Optimistic] expense #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: expense #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Expense upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: expense #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
		bgResync('expenses');
		return null;
	}
	bgResync('expenses');
	const capturedSnapshot = snapshot;
	const sid = String(data.id);
	return async () => {
		try {
			const db = await getDb();
			if (capturedSnapshot) {
				await db.expenses.upsert(capturedSnapshot);
			} else {
				const doc = await db.expenses.findOne(sid).exec();
				if (doc) await doc.incrementalPatch({ deleted_at: new Date().toISOString() });
			}
			syncStatus.addLog(`Optimistic: expense #${data.id} rolled back`, 'warn');
		} catch (err) {
			console.warn('[Optimistic] Expense rollback failed:', err);
		}
	};
}

/**
 * Optimistically soft-delete an expense by setting deleted_at.
 * The RxDB query filters on `deleted_at: { $eq: null }`, so the expense
 * disappears from the list immediately.
 */
export async function optimisticDeleteExpense(expenseId: number | string) {
	const sid = String(expenseId);
	if (!sid || sid === 'undefined' || sid === 'null' || sid === 'NaN') {
		console.warn(`[Optimistic] Expense delete skipped — invalid id: ${expenseId}`);
		syncStatus.addLog(`Optimistic: expense delete skipped — invalid id: ${expenseId}`, 'warn');
		return;
	}
	console.log(`[Optimistic] expense #${sid} → soft-deleting in RxDB...`);
	syncStatus.addLog(`Optimistic: expense #${sid} → soft-deleting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.expenses.findOne(sid).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] expense #${sid} soft-deleted ✓`);
		syncStatus.addLog(`Optimistic: expense #${sid} soft-deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Expense delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: expense #${sid} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('expenses');
}
