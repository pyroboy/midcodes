import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

export async function optimisticUpsertBudget(data: {
	id: number;
	project_name: string;
	project_description?: string | null;
	project_category?: string | null;
	planned_amount: string;
	pending_amount?: string | null;
	actual_amount?: string | null;
	budget_items?: any[] | null;
	status?: string | null;
	start_date?: string | null;
	end_date?: string | null;
	property_id: number;
	created_by?: string | null;
}): Promise<(() => Promise<void>) | null> {
	console.log(`[Optimistic] budget #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: budget #${data.id} → writing to RxDB...`, 'info');
	let snapshot: Record<string, any> | null = null;
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.budgets.findOne(sid).exec();
		snapshot = existing ? existing.toJSON(true) : null;
		await db.budgets.upsert({
			id: sid,
			project_name: data.project_name,
			project_description: data.project_description ?? null,
			project_category: data.project_category ?? null,
			planned_amount: String(data.planned_amount),
			pending_amount: data.pending_amount != null ? String(data.pending_amount) : null,
			actual_amount: data.actual_amount != null ? String(data.actual_amount) : null,
			budget_items: data.budget_items ?? null,
			status: data.status ?? null,
			start_date: data.start_date ?? null,
			end_date: data.end_date ?? null,
			property_id: String(data.property_id),
			created_by: data.created_by ?? existing?.created_by ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null
		});
		console.log(`[Optimistic] budget #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: budget #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Budget upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: budget #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
		bgResync('budgets');
		return null;
	}
	bgResync('budgets');
	const capturedSnapshot = snapshot;
	const sid = String(data.id);
	return async () => {
		try {
			const db = await getDb();
			if (capturedSnapshot) {
				await db.budgets.upsert(capturedSnapshot);
			} else {
				const doc = await db.budgets.findOne(sid).exec();
				if (doc) await doc.incrementalPatch({ deleted_at: new Date().toISOString() });
			}
			syncStatus.addLog(`Optimistic: budget #${data.id} rolled back`, 'warn');
		} catch (err) {
			console.warn('[Optimistic] Budget rollback failed:', err);
		}
	};
}

export async function optimisticDeleteBudget(budgetId: number | string) {
	const sid = String(budgetId);
	if (!sid || sid === 'undefined' || sid === 'null' || sid === 'NaN') {
		console.warn(`[Optimistic] Budget delete skipped — invalid id: ${budgetId}`);
		syncStatus.addLog(`Optimistic: budget delete skipped — invalid id: ${budgetId}`, 'warn');
		return;
	}
	console.log(`[Optimistic] budget #${sid} → soft-deleting in RxDB...`);
	syncStatus.addLog(`Optimistic: budget #${sid} → soft-deleting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.budgets.findOne(sid).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] budget #${sid} soft-deleted ✓`);
		syncStatus.addLog(`Optimistic: budget #${sid} soft-deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Budget delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: budget #${sid} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('budgets');
}
