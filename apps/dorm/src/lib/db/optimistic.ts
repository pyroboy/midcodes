import { getDb } from '$lib/db';
import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

/**
 * Optimistic write helpers for the dorm RxDB cache.
 *
 * Pattern: upsert into RxDB immediately (UI updates in the same frame),
 * then fire a background resync to reconcile with Neon.
 */

/**
 * Optimistically insert or update a tenant in RxDB.
 * Call after the server confirms success.
 */
export async function optimisticUpsertTenant(data: {
	id: number;
	name: string;
	contact_number?: string | null;
	email?: string | null;
	tenant_status: string;
	emergency_contact?: any;
	profile_picture_url?: string | null;
	address?: string | null;
	school_or_workplace?: string | null;
	facebook_name?: string | null;
	birthday?: string | null;
}) {
	try {
		console.log(`[Optimistic] Tenant upsert id=${data.id} → writing to RxDB...`);
		syncStatus.addLog(`Optimistic: tenant "${data.name}" → writing to RxDB...`, 'info');
		const db = await getDb();
		const sid = String(data.id);
		// Check if doc exists to preserve created_at on updates
		const existing = await db.tenants.findOne(sid).exec();
		await db.tenants.upsert({
			id: sid,
			name: data.name,
			contact_number: data.contact_number ?? null,
			email: data.email ?? null,
			tenant_status: data.tenant_status,
			emergency_contact: data.emergency_contact ?? null,
			profile_picture_url: data.profile_picture_url ?? null,
			address: data.address ?? null,
			school_or_workplace: data.school_or_workplace ?? null,
			facebook_name: data.facebook_name ?? null,
			birthday: data.birthday ?? null,
			created_at: existing ? existing.created_at : new Date().toISOString(),
			updated_at: new Date().toISOString(),
			auth_id: existing?.auth_id ?? null,
			created_by: existing?.created_by ?? null,
			deleted_at: null
		});
		console.log(`[Optimistic] Tenant upsert id=${data.id} → RxDB updated ✓`);
		syncStatus.addLog(`Optimistic: tenant "${data.name}" → RxDB updated ✓`, 'success');
	} catch (err) {
		console.warn('[Optimistic] Tenant upsert failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: tenant upsert failed — ${err instanceof Error ? err.message : err}`, 'error');
	}
	bgResync('tenants');
}

/**
 * Optimistically soft-delete a tenant by setting deleted_at.
 * The RxDB query filters on `deleted_at: { $eq: null }`, so the tenant
 * disappears from the list immediately.
 */
export async function optimisticDeleteTenant(tenantId: number) {
	try {
		console.log(`[Optimistic] Tenant delete id=${tenantId} → soft-deleting in RxDB...`);
		syncStatus.addLog(`Optimistic: tenant #${tenantId} → soft-deleting in RxDB...`, 'info');
		const db = await getDb();
		const doc = await db.tenants.findOne(String(tenantId)).exec();
		if (doc) {
			await doc.incrementalPatch({
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			});
			console.log(`[Optimistic] Tenant delete id=${tenantId} → RxDB soft-deleted ✓`);
			syncStatus.addLog(`Optimistic: tenant #${tenantId} → RxDB soft-deleted ✓`, 'success');
		} else {
			console.warn(`[Optimistic] Tenant id=${tenantId} not found in RxDB`);
			syncStatus.addLog(`Optimistic: tenant #${tenantId} not found in RxDB`, 'warn');
		}
	} catch (err) {
		console.warn('[Optimistic] Tenant delete failed, falling back to resync:', err);
		syncStatus.addLog(`Optimistic: tenant delete failed — ${err instanceof Error ? err.message : err}`, 'error');
	}
	bgResync('tenants');
}
