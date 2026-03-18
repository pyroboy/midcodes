/**
 * Phase 1: Core Property Data
 *
 * Migrates: organizations → properties → floors → rental_unit
 * Preserves original IDs. Resets serial sequences after insert.
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
	logError,
	schema
} from './_shared.js';

export async function runPhase1() {
	log('phase1', '═══ Phase 1: Core Property Data ═══');

	const supa = await getSupabaseClient();
	const neon = getNeonDb();

	// ── 1. Organizations ──────────────────────────────────────────
	log('phase1', 'Migrating organizations...');
	const { rows: orgs } = await supa.query('SELECT * FROM organizations ORDER BY created_at');

	if (orgs.length > 0) {
		await neon.insert(schema.organizations).values(
			orgs.map((r: any) => ({
				id: r.id,
				name: r.name,
				createdAt: r.created_at,
				updatedAt: r.updated_at
			}))
		);
	}
	logSuccess('phase1', `organizations: ${orgs.length} rows`);

	// ── 2. Properties ─────────────────────────────────────────────
	log('phase1', 'Migrating properties...');
	const { rows: props } = await supa.query('SELECT * FROM properties ORDER BY id');

	if (props.length > 0) {
		await neon.insert(schema.properties).values(
			props.map((r: any) => ({
				id: r.id,
				name: r.name,
				address: r.address,
				type: r.type,
				status: r.status,
				createdAt: r.created_at,
				updatedAt: r.updated_at
			}))
		);
		await resetSequence(neon, 'properties');
	}
	logSuccess('phase1', `properties: ${props.length} rows`);

	// ── 3. Floors ─────────────────────────────────────────────────
	log('phase1', 'Migrating floors...');
	const { rows: flrs } = await supa.query('SELECT * FROM floors ORDER BY id');

	if (flrs.length > 0) {
		await neon.insert(schema.floors).values(
			flrs.map((r: any) => ({
				id: r.id,
				propertyId: r.property_id,
				floorNumber: r.floor_number,
				wing: r.wing,
				status: r.status,
				createdAt: r.created_at,
				updatedAt: r.updated_at
			}))
		);
		await resetSequence(neon, 'floors');
	}
	logSuccess('phase1', `floors: ${flrs.length} rows`);

	// ── 4. Rental Units ───────────────────────────────────────────
	log('phase1', 'Migrating rental_unit...');
	const { rows: units } = await supa.query('SELECT * FROM rental_unit ORDER BY id');

	if (units.length > 0) {
		await neon.insert(schema.rentalUnit).values(
			units.map((r: any) => ({
				id: r.id,
				name: r.name,
				capacity: r.capacity,
				rentalUnitStatus: r.rental_unit_status,
				baseRate: r.base_rate,
				createdAt: r.created_at,
				updatedAt: r.updated_at,
				propertyId: r.property_id,
				floorId: r.floor_id,
				type: r.type,
				amenities: r.amenities,
				number: r.number
			}))
		);
		await resetSequence(neon, 'rental_unit');
	}
	logSuccess('phase1', `rental_unit: ${units.length} rows`);

	// ── Verify ────────────────────────────────────────────────────
	log('phase1', '\n── Verification ──');
	for (const table of ['organizations', 'properties', 'floors', 'rental_unit']) {
		const srcCount = await countRows(supa, table);
		const dstCount = await countNeonRows(neon, table);
		const match = srcCount === dstCount ? '✅' : '❌ MISMATCH';
		log('phase1', `  ${table.padEnd(20)} src=${srcCount} dst=${dstCount} ${match}`);
	}

	await closeSupabase();
	logSuccess('phase1', 'Phase 1 complete.');
}
