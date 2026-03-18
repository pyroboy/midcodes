import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';

/**
 * Optimistic write helpers for expense documents in RxDB.
 *
 * Pattern: upsert/remove in RxDB immediately (UI updates same frame),
 * then fire a background resync to reconcile with Neon.
 */

/** Background resync — fire and forget, never blocks UI. */
function bgResync(collection: string) {
	resyncCollection(collection).catch((err) =>
		console.warn(`[Optimistic] Background resync for "${collection}" failed:`, err)
	);
}

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
}) {
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.expenses.findOne(sid).exec();
		await db.expenses.upsert({
			id: sid,
			property_id: data.property_id ?? null,
			amount: data.amount,
			description: data.description,
			type: data.type,
			status: data.status,
			expense_date: data.expense_date ?? null,
			created_by: data.created_by ?? existing?.created_by ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString()
		});
	} catch (err) {
		console.warn('[Optimistic] Expense upsert failed, falling back to resync:', err);
	}
	bgResync('expenses');
}

/**
 * Optimistically remove an expense from RxDB.
 * The document is hard-deleted locally; the server action handles the DB delete.
 */
export async function optimisticDeleteExpense(expenseId: number) {
	try {
		const db = await getDb();
		const doc = await db.expenses.findOne(String(expenseId)).exec();
		if (doc) {
			await doc.remove();
		}
	} catch (err) {
		console.warn('[Optimistic] Expense delete failed, falling back to resync:', err);
	}
	bgResync('expenses');
}
