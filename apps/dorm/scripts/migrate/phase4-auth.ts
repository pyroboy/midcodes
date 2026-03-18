/**
 * Phase 4: Auth & RBAC Migration
 *
 * Handles the most complex part: migrating Supabase auth.users → Better Auth
 * and remapping all UUID foreign key references across previously migrated tables.
 *
 * Key challenge: Supabase auth.users has UUID PKs, Better Auth user table has text PKs.
 * Solution: Generate new UUIDs as text strings — same value fits both user.id (text)
 * and profiles.id (uuid).
 */

import { randomUUID } from 'node:crypto';
import {
	getSupabaseClient,
	getNeonDb,
	closeSupabase,
	countRows,
	countNeonRows,
	loadIdMapping,
	saveIdMapping,
	log,
	logSuccess,
	logError,
	schema,
	type IdMapping
} from './_shared.js';
import { sql } from 'drizzle-orm';

// Tables + columns that reference auth user IDs (to be remapped)
const AUTH_FK_COLUMNS = [
	{ table: 'tenants', columns: ['auth_id', 'created_by'] },
	{ table: 'leases', columns: ['created_by', 'deleted_by'] },
	{ table: 'payments', columns: ['created_by', 'updated_by', 'reverted_by'] },
	{ table: 'expenses', columns: ['created_by'] },
	{ table: 'budgets', columns: ['created_by'] }
];

export async function runPhase4() {
	log('phase4', '═══ Phase 4: Auth & RBAC Migration ═══');

	const supa = await getSupabaseClient();
	const neon = getNeonDb();

	// ── 1. Read Supabase auth.users ───────────────────────────────
	log('phase4', 'Reading Supabase auth.users...');
	const { rows: authUsers } = await supa.query(`
		SELECT id, email, encrypted_password, raw_user_meta_data,
		       created_at, email_confirmed_at, updated_at
		FROM auth.users
		ORDER BY created_at
	`);
	log('phase4', `Found ${authUsers.length} auth users`);

	// ── 2. Build ID mapping (oldUUID → newUUID) ──────────────────
	// Load existing mapping if re-running
	const mapping: IdMapping = loadIdMapping();
	let newMappings = 0;

	for (const u of authUsers) {
		if (!mapping[u.id]) {
			mapping[u.id] = randomUUID();
			newMappings++;
		}
	}

	log('phase4', `ID mapping: ${newMappings} new, ${Object.keys(mapping).length} total`);

	// ── 3. Insert into Better Auth `user` table ──────────────────
	log('phase4', 'Inserting into Better Auth user table...');

	for (const u of authUsers) {
		const newId = mapping[u.id];
		const meta = u.raw_user_meta_data || {};
		const name = meta.full_name || meta.name || u.email?.split('@')[0] || 'Unknown';

		try {
			await neon.insert(schema.user).values({
				id: newId,
				name,
				email: u.email,
				emailVerified: !!u.email_confirmed_at,
				image: meta.avatar_url || null,
				role: meta.role || null,
				createdAt: u.created_at,
				updatedAt: u.updated_at || u.created_at
			});
		} catch (e: any) {
			if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
				log('phase4', `  Skipping duplicate user: ${u.email}`);
			} else {
				throw e;
			}
		}
	}
	logSuccess('phase4', `Better Auth users inserted: ${authUsers.length}`);

	// ── 4. Insert into `account` table ───────────────────────────
	log('phase4', 'Inserting into account table (credential provider)...');

	for (const u of authUsers) {
		const newId = mapping[u.id];

		try {
			await neon.insert(schema.account).values({
				id: randomUUID(),
				accountId: newId,
				providerId: 'credential',
				userId: newId,
				password: u.encrypted_password, // Both use bcrypt — direct copy
				createdAt: u.created_at,
				updatedAt: u.updated_at || u.created_at
			});
		} catch (e: any) {
			if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
				log('phase4', `  Skipping duplicate account for: ${u.email}`);
			} else {
				throw e;
			}
		}
	}
	logSuccess('phase4', 'Accounts inserted');

	// ── 5. Migrate profiles ──────────────────────────────────────
	log('phase4', 'Migrating profiles...');
	const { rows: profiles } = await supa.query('SELECT * FROM profiles ORDER BY created_at');

	for (const p of profiles) {
		const newId = mapping[p.id];
		if (!newId) {
			logError('phase4', `  Profile ${p.id} (${p.email}) has no auth mapping — skipping`);
			continue;
		}

		try {
			await neon.insert(schema.profiles).values({
				id: newId, // uuid column, new UUID value
				email: p.email,
				role: p.role,
				orgId: p.org_id,
				context: p.context,
				createdAt: p.created_at,
				updatedAt: p.updated_at
			});
		} catch (e: any) {
			if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
				log('phase4', `  Skipping duplicate profile: ${p.email}`);
			} else {
				throw e;
			}
		}
	}
	logSuccess('phase4', `profiles: ${profiles.length} rows`);

	// ── 6. Role permissions (direct copy, no auth refs) ──────────
	log('phase4', 'Migrating role_permissions...');
	const { rows: rolePerms } = await supa.query('SELECT * FROM role_permissions ORDER BY id');

	if (rolePerms.length > 0) {
		for (const rp of rolePerms) {
			try {
				await neon.insert(schema.rolePermissions).values({
					id: rp.id,
					role: rp.role,
					permission: rp.permission
				});
			} catch (e: any) {
				if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
					continue;
				}
				throw e;
			}
		}
	}
	logSuccess('phase4', `role_permissions: ${rolePerms.length} rows`);

	// ── 7. User roles (remap userId) ─────────────────────────────
	log('phase4', 'Migrating user_roles...');
	const { rows: userRoles } = await supa.query('SELECT * FROM user_roles ORDER BY id');

	for (const ur of userRoles) {
		const newUserId = mapping[ur.user_id];
		if (!newUserId) {
			logError('phase4', `  user_roles: unmapped userId ${ur.user_id} — skipping`);
			continue;
		}

		try {
			await neon.insert(schema.userRoles).values({
				id: ur.id,
				userId: newUserId,
				role: ur.role
			});
		} catch (e: any) {
			if (e.message?.includes('duplicate') || e.message?.includes('unique')) {
				continue;
			}
			throw e;
		}
	}
	logSuccess('phase4', `user_roles: ${userRoles.length} rows`);

	// ── 8. Remap all auth FK columns in migrated tables ──────────
	log('phase4', '\n── Remapping auth foreign keys ──');

	let totalRemapped = 0;
	let totalNulled = 0;

	for (const { table, columns } of AUTH_FK_COLUMNS) {
		for (const col of columns) {
			// Get all distinct non-null values in this column
			const distinctRes = await neon.execute(
				sql`SELECT DISTINCT ${sql.identifier(col)}::text AS val FROM ${sql.identifier(table)} WHERE ${sql.identifier(col)} IS NOT NULL`
			) as any;

			const values = (distinctRes.rows ?? distinctRes) as { val: string }[];

			for (const { val: oldId } of values) {
				const newId = mapping[oldId];
				if (newId) {
					await neon.execute(
						sql`UPDATE ${sql.identifier(table)} SET ${sql.identifier(col)} = ${newId} WHERE ${sql.identifier(col)}::text = ${oldId}`
					);
					totalRemapped++;
				} else {
					logError('phase4', `  ${table}.${col}: unmapped UUID ${oldId} → SET NULL`);
					await neon.execute(
						sql`UPDATE ${sql.identifier(table)} SET ${sql.identifier(col)} = NULL WHERE ${sql.identifier(col)}::text = ${oldId}`
					);
					totalNulled++;
				}
			}
			log('phase4', `  ${table}.${col} done`);
		}
	}

	log('phase4', `Remapped: ${totalRemapped} values, nulled: ${totalNulled} unmapped`);

	// ── 9. Save mapping ──────────────────────────────────────────
	saveIdMapping(mapping);

	// ── Verify ────────────────────────────────────────────────────
	log('phase4', '\n── Verification ──');

	const srcAuthCount = await countRows(supa, 'users', 'auth');
	const dstUserCount = await countNeonRows(neon, 'user');
	log('phase4', `  auth.users→user: src=${srcAuthCount} dst=${dstUserCount} ${srcAuthCount === dstUserCount ? '✅' : '❌'}`);

	for (const table of ['profiles', 'role_permissions', 'user_roles']) {
		const srcCount = await countRows(supa, table);
		const dstCount = await countNeonRows(neon, table);
		log('phase4', `  ${table.padEnd(20)} src=${srcCount} dst=${dstCount} ${srcCount === dstCount ? '✅' : '❌'}`);
	}

	await closeSupabase();
	logSuccess('phase4', 'Phase 4 complete. Test login with a known account to verify passwords.');
}
