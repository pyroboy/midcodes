/**
 * Phase 2: Tenants & Leases
 *
 * Migrates: tenants → leases → lease_tenants
 * auth_id / created_by UUIDs are copied as-is (Phase 4 will remap them).
 * profile_picture_url is copied as-is (Phase 5 will rewrite).
 */

import {
	getSupabaseClient,
	getNeonDb,
	closeSupabase,
	resetSequence,
	countRows,
	countNeonRows,
	log,
	logSuccess,
	schema
} from './_shared.js';

export async function runPhase2() {
	log('phase2', '═══ Phase 2: Tenants & Leases ═══');

	const supa = await getSupabaseClient();
	const neon = getNeonDb();

	// ── 1. Tenants ────────────────────────────────────────────────
	log('phase2', 'Migrating tenants...');
	const { rows: tenants } = await supa.query('SELECT * FROM tenants ORDER BY id');

	if (tenants.length > 0) {
		await neon.insert(schema.tenants).values(
			tenants.map((r: any) => ({
				id: r.id,
				name: r.name,
				contactNumber: r.contact_number,
				email: r.email,
				createdAt: r.created_at,
				updatedAt: r.updated_at,
				authId: r.auth_id,
				emergencyContact: r.emergency_contact,
				tenantStatus: r.tenant_status,
				createdBy: r.created_by,
				deletedAt: r.deleted_at,
				profilePictureUrl: r.profile_picture_url
			}))
		);
		await resetSequence(neon, 'tenants');
	}
	logSuccess('phase2', `tenants: ${tenants.length} rows`);

	// ── 2. Leases ─────────────────────────────────────────────────
	log('phase2', 'Migrating leases...');
	const { rows: leases } = await supa.query('SELECT * FROM leases ORDER BY id');

	if (leases.length > 0) {
		await neon.insert(schema.leases).values(
			leases.map((r: any) => ({
				id: r.id,
				rentalUnitId: r.rental_unit_id,
				name: r.name,
				startDate: r.start_date,
				endDate: r.end_date,
				rentAmount: r.rent_amount,
				securityDeposit: r.security_deposit,
				notes: r.notes,
				createdAt: r.created_at,
				updatedAt: r.updated_at,
				createdBy: r.created_by,
				termsMonth: r.terms_month,
				status: r.status,
				deletedAt: r.deleted_at,
				deletedBy: r.deleted_by,
				deletionReason: r.deletion_reason
			}))
		);
		await resetSequence(neon, 'leases');
	}
	logSuccess('phase2', `leases: ${leases.length} rows`);

	// ── 3. Lease Tenants ──────────────────────────────────────────
	log('phase2', 'Migrating lease_tenants...');
	const { rows: leaseTenants } = await supa.query('SELECT * FROM lease_tenants ORDER BY id');

	if (leaseTenants.length > 0) {
		await neon.insert(schema.leaseTenants).values(
			leaseTenants.map((r: any) => ({
				id: r.id,
				leaseId: r.lease_id,
				tenantId: r.tenant_id,
				createdAt: r.created_at
			}))
		);
		await resetSequence(neon, 'lease_tenants');
	}
	logSuccess('phase2', `lease_tenants: ${leaseTenants.length} rows`);

	// ── Verify ────────────────────────────────────────────────────
	log('phase2', '\n── Verification ──');
	for (const table of ['tenants', 'leases', 'lease_tenants']) {
		const srcCount = await countRows(supa, table);
		const dstCount = await countNeonRows(neon, table);
		const match = srcCount === dstCount ? '✅' : '❌ MISMATCH';
		log('phase2', `  ${table.padEnd(20)} src=${srcCount} dst=${dstCount} ${match}`);
	}

	await closeSupabase();
	logSuccess('phase2', 'Phase 2 complete.');
}
