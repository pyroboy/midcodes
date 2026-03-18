/**
 * Phase 0: Pre-flight checks (read-only)
 *
 * Verifies connectivity to both databases, inventories source data,
 * and checks that Neon target tables are empty.
 */

import {
	getSupabaseClient,
	getNeonDb,
	countRows,
	countNeonRows,
	closeSupabase,
	log,
	logSuccess,
	logError
} from './_shared.js';

// Tables we expect to migrate (public schema)
const DORM_TABLES = [
	'organizations',
	'properties',
	'floors',
	'rental_unit',
	'tenants',
	'leases',
	'lease_tenants',
	'penalty_configs',
	'meters',
	'readings',
	'billings',
	'payments',
	'payment_allocations',
	'expenses',
	'budgets',
	'maintenance',
	'profiles',
	'role_permissions',
	'user_roles'
];

export async function runPhase0() {
	log('phase0', '═══ Phase 0: Pre-flight Checks ═══');

	// 1. Connect to Supabase
	log('phase0', 'Connecting to Supabase...');
	const supa = await getSupabaseClient();
	logSuccess('phase0', 'Supabase connected');

	// 2. Connect to Neon
	log('phase0', 'Connecting to Neon...');
	const neon = getNeonDb();
	// Quick connectivity test
	const { sql } = await import('drizzle-orm');
	await neon.execute(sql`SELECT 1`);
	logSuccess('phase0', 'Neon connected');

	// 3. Inventory Supabase public tables
	log('phase0', '\n── Supabase Source Data ──');
	const supabaseCounts: Record<string, number> = {};

	for (const table of DORM_TABLES) {
		try {
			const count = await countRows(supa, table);
			supabaseCounts[table] = count;
			log('phase0', `  ${table.padEnd(25)} ${String(count).padStart(6)} rows`);
		} catch {
			log('phase0', `  ${table.padEnd(25)}  (not found)`);
		}
	}

	// 4. Count auth.users
	try {
		const authCount = await countRows(supa, 'users', 'auth');
		log('phase0', `  ${'auth.users'.padEnd(25)} ${String(authCount).padStart(6)} rows`);
	} catch (e: any) {
		logError('phase0', `Cannot read auth.users: ${e.message}`);
		log('phase0', '  Hint: Your connection string needs the "postgres" role (not "anon")');
	}

	// 5. List storage objects
	try {
		const storageRes = await supa.query(`
			SELECT bucket_id, COUNT(*)::int AS count
			FROM storage.objects
			GROUP BY bucket_id
			ORDER BY bucket_id
		`);
		log('phase0', '\n── Supabase Storage ──');
		for (const row of storageRes.rows) {
			log('phase0', `  bucket: ${row.bucket_id.padEnd(20)} ${String(row.count).padStart(6)} files`);
		}
	} catch (e: any) {
		log('phase0', `  Storage: ${e.message}`);
	}

	// 6. Check Neon target tables
	log('phase0', '\n── Neon Target State ──');
	let nonEmpty = 0;

	for (const table of DORM_TABLES) {
		try {
			const count = await countNeonRows(neon, table);
			const status = count > 0 ? '⚠️  NOT EMPTY' : '✓ empty';
			if (count > 0) nonEmpty++;
			log('phase0', `  ${table.padEnd(25)} ${String(count).padStart(6)} rows  ${status}`);
		} catch {
			log('phase0', `  ${table.padEnd(25)}  (table missing — run drizzle-kit push)`);
		}
	}

	// Also check Better Auth tables
	for (const table of ['user', 'account', 'session', 'verification']) {
		try {
			const count = await countNeonRows(neon, table);
			const status = count > 0 ? '⚠️  NOT EMPTY' : '✓ empty';
			if (count > 0) nonEmpty++;
			log('phase0', `  ${table.padEnd(25)} ${String(count).padStart(6)} rows  ${status}`);
		} catch {
			log('phase0', `  ${table.padEnd(25)}  (table missing)`);
		}
	}

	// 7. Summary
	log('phase0', '\n── Summary ──');
	const totalRows = Object.values(supabaseCounts).reduce((a, b) => a + b, 0);
	log('phase0', `Total source rows to migrate: ${totalRows}`);

	if (nonEmpty > 0) {
		logError('phase0', `${nonEmpty} Neon tables are NOT empty. Data will be appended (may cause conflicts).`);
		log('phase0', 'Consider truncating Neon tables or using Neon branching before proceeding.');
	} else {
		logSuccess('phase0', 'All Neon target tables are empty. Ready to migrate.');
	}

	await closeSupabase();
	logSuccess('phase0', 'Phase 0 complete.');
}
