import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/** Background resync — fire and forget, never blocks UI. */
function bgResync(collection: string) {
	console.log(`[Optimistic] Resync "${collection}" → pulling from Neon...`);
	syncStatus.addLog(`Resync: pulling ${collection} from Neon...`, 'info');
	resyncCollection(collection)
		.then(() => {
			console.log(`[Optimistic] Resync "${collection}" complete ✓`);
			syncStatus.addLog(`Resync: ${collection} reconciled with Neon ✓`, 'success');
		})
		.catch((err) => {
			console.warn(`[Optimistic] Resync "${collection}" failed:`, err);
			syncStatus.addLog(`Resync: ${collection} failed — ${err?.message || err}`, 'error');
		});
}

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
}) {
	console.log(`[Optimistic] budget #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: budget #${data.id} → writing to RxDB...`, 'info');
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.budgets.findOne(sid).exec();
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
			property_id: data.property_id,
			created_by: data.created_by ?? existing?.created_by ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString()
		});
		console.log(`[Optimistic] budget #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: budget #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Budget upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: budget #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('budgets');
}

export async function optimisticDeleteBudget(budgetId: number) {
	console.log(`[Optimistic] budget #${budgetId} → deleting from RxDB...`);
	syncStatus.addLog(`Optimistic: budget #${budgetId} → deleting from RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.budgets.findOne(String(budgetId)).exec();
		if (doc) {
			await doc.remove();
		}
		console.log(`[Optimistic] budget #${budgetId} delete complete ✓`);
		syncStatus.addLog(`Optimistic: budget #${budgetId} deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Budget delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: budget #${budgetId} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('budgets');
}
