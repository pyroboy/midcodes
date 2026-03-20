import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

export async function optimisticUpsertPayment(data: {
	id: number;
	amount: string;
	method: string;
	paid_by: string;
	paid_at: string;
	reference_number?: string | null;
	notes?: string | null;
	receipt_url?: string | null;
	created_by?: string | null;
	updated_by?: string | null;
	billing_ids?: string[] | null;
	billing_id?: string | null;
}): Promise<(() => Promise<void>) | null> {
	console.log(`[Optimistic] payment #${data.id} → writing to RxDB...`);
	syncStatus.addLog(`Optimistic: payment #${data.id} → writing to RxDB...`, 'info');
	let snapshot: Record<string, any> | null = null;
	try {
		const db = await getDb();
		const sid = String(data.id);
		const existing = await db.payments.findOne(sid).exec();
		snapshot = existing ? existing.toJSON(true) : null;
		await db.payments.upsert({
			id: sid,
			amount: data.amount,
			method: data.method,
			paid_by: data.paid_by,
			paid_at: data.paid_at,
			reference_number: data.reference_number ?? null,
			notes: data.notes ?? null,
			receipt_url: data.receipt_url ?? null,
			created_by: data.created_by ?? existing?.created_by ?? null,
			updated_by: data.updated_by ?? null,
			billing_ids: data.billing_ids ?? existing?.billing_ids ?? null,
			billing_id: data.billing_id ?? existing?.billing_id ?? null,
			reverted_at: existing?.reverted_at ?? null,
			reverted_by: existing?.reverted_by ?? null,
			revert_reason: existing?.revert_reason ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString(),
			deleted_at: null
		});
		console.log(`[Optimistic] payment #${data.id} upsert complete ✓`);
		syncStatus.addLog(`Optimistic: payment #${data.id} upserted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Payment upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: payment #${data.id} upsert failed — ${(err as Error)?.message || err}`, 'error');
		bgResync('payments');
		return null;
	}
	bgResync('payments');
	const capturedSnapshot = snapshot;
	const sid = String(data.id);
	return async () => {
		try {
			const db = await getDb();
			if (capturedSnapshot) {
				await db.payments.upsert(capturedSnapshot);
			} else {
				const doc = await db.payments.findOne(sid).exec();
				if (doc) await doc.incrementalPatch({ deleted_at: new Date().toISOString() });
			}
			syncStatus.addLog(`Optimistic: payment #${data.id} rolled back`, 'warn');
		} catch (err) {
			console.warn('[Optimistic] Payment rollback failed:', err);
		}
	};
}

export async function optimisticDeletePayment(paymentId: number | string) {
	const sid = String(paymentId);
	if (!sid || sid === 'undefined' || sid === 'null' || sid === 'NaN') {
		console.warn(`[Optimistic] Payment delete skipped — invalid id: ${paymentId}`);
		syncStatus.addLog(`Optimistic: payment delete skipped — invalid id: ${paymentId}`, 'warn');
		return;
	}
	console.log(`[Optimistic] payment #${sid} → soft-deleting in RxDB...`);
	syncStatus.addLog(`Optimistic: payment #${sid} → soft-deleting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.payments.findOne(sid).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] payment #${sid} soft-deleted ✓`);
		syncStatus.addLog(`Optimistic: payment #${sid} soft-deleted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Payment delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: payment #${sid} delete failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('payments');
}

export async function optimisticRevertPayment(paymentId: number) {
	console.log(`[Optimistic] payment #${paymentId} → reverting in RxDB...`);
	syncStatus.addLog(`Optimistic: payment #${paymentId} → reverting in RxDB...`, 'info');
	try {
		const db = await getDb();
		const doc = await db.payments.findOne(String(paymentId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				reverted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
		}
		console.log(`[Optimistic] payment #${paymentId} revert complete ✓`);
		syncStatus.addLog(`Optimistic: payment #${paymentId} reverted ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Payment revert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: payment #${paymentId} revert failed — ${(err as Error)?.message || err}`, 'error');
	}
	bgResync('payments');
	bgResync('billings');
}
