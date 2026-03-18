import { getDb } from '$lib/db';
import { resyncCollection } from '$lib/db/replication';

function bgResync(collection: string) {
	resyncCollection(collection).catch((err) =>
		console.warn(`[Optimistic] Background resync for "${collection}" failed:`, err)
	);
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
	} catch (err) {
		console.warn('[Optimistic] Budget upsert failed, falling back to resync:', err);
	}
	bgResync('budgets');
}

export async function optimisticDeleteBudget(budgetId: number) {
	try {
		const db = await getDb();
		const doc = await db.budgets.findOne(String(budgetId)).exec();
		if (doc) {
			await doc.remove();
		}
	} catch (err) {
		console.warn('[Optimistic] Budget delete failed, falling back to resync:', err);
	}
	bgResync('budgets');
}
