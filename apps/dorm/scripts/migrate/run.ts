#!/usr/bin/env tsx
/**
 * CLI runner for Supabase → Neon migration phases.
 *
 * Usage: npx tsx scripts/migrate/run.ts [phase]
 *
 *   0 — Pre-flight checks (read-only)
 *   1 — Core property data
 *   2 — Tenants & leases
 *   3 — Financial data
 *   4 — Auth & RBAC
 *   5 — Images
 *   all — Run phases 0–5 sequentially
 */

import 'dotenv/config';

const phase = process.argv[2];

if (!phase) {
	console.log(`
  Supabase → Neon Data Migration
  ════════════════════════════════

  Usage: npx tsx scripts/migrate/run.ts <phase>

  Phases:
    0   Pre-flight checks (read-only)
    1   Core property data (organizations, properties, floors, rental_unit)
    2   Tenants & leases
    3   Financial data (meters, billings, payments, etc.)
    4   Auth & RBAC (users, profiles, role mappings + FK remapping)
    5   Images (download Supabase Storage → static/uploads/)
    all Run all phases (0–5) sequentially

  Prerequisites:
    - SUPABASE_DB_URL in .env.local (direct Postgres connection string)
    - NEON_DATABASE_URL in .env or .env.local
    - Neon schema pushed via drizzle-kit push
	`);
	process.exit(0);
}

async function run() {
	const start = Date.now();

	try {
		if (phase === '0' || phase === 'all') {
			const { runPhase0 } = await import('./phase0-preflight.js');
			await runPhase0();
		}

		if (phase === '1' || phase === 'all') {
			const { runPhase1 } = await import('./phase1-property.js');
			await runPhase1();
		}

		if (phase === '2' || phase === 'all') {
			const { runPhase2 } = await import('./phase2-tenants.js');
			await runPhase2();
		}

		if (phase === '3' || phase === 'all') {
			const { runPhase3 } = await import('./phase3-financial.js');
			await runPhase3();
		}

		if (phase === '4' || phase === 'all') {
			const { runPhase4 } = await import('./phase4-auth.js');
			await runPhase4();
		}

		if (phase === '5' || phase === 'all') {
			const { runPhase5 } = await import('./phase5-images.js');
			await runPhase5();
		}

		if (!['0', '1', '2', '3', '4', '5', 'all'].includes(phase)) {
			console.error(`Unknown phase: ${phase}. Use 0–5 or "all".`);
			process.exit(1);
		}

		const elapsed = ((Date.now() - start) / 1000).toFixed(1);
		console.log(`\n✅ Migration phase ${phase} completed in ${elapsed}s`);
	} catch (err: any) {
		console.error(`\n❌ Migration failed:`, err.message);
		console.error(err.stack);
		process.exit(1);
	}
}

run();
