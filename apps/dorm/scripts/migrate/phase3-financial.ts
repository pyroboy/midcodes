/**
 * Phase 3: Financial Data
 *
 * Migrates in FK order:
 *   penalty_configs → meters → readings → billings →
 *   payments → payment_allocations → expenses → budgets → maintenance
 *
 * created_by / updated_by / reverted_by UUIDs are copied as-is (Phase 4 remaps).
 * receipt_url is copied as-is (Phase 5 rewrites).
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
import { sql } from 'drizzle-orm';

const TABLES = [
	'penalty_configs',
	'meters',
	'readings',
	'billings',
	'payments',
	'payment_allocations',
	'expenses',
	'budgets',
	'maintenance'
];

export async function runPhase3() {
	log('phase3', '═══ Phase 3: Financial Data ═══');

	const supa = await getSupabaseClient();
	const neon = getNeonDb();

	// ── 1. Penalty Configs ────────────────────────────────────────
	log('phase3', 'Migrating penalty_configs...');
	const { rows: penalties } = await supa.query('SELECT * FROM penalty_configs ORDER BY id');

	if (penalties.length > 0) {
		await neon.insert(schema.penaltyConfigs).values(
			penalties.map((r: any) => ({
				id: r.id,
				type: r.type,
				gracePeriod: r.grace_period,
				penaltyPercentage: r.penalty_percentage,
				compoundPeriod: r.compound_period,
				maxPenaltyPercentage: r.max_penalty_percentage,
				createdAt: r.created_at,
				updatedAt: r.updated_at
			}))
		);
		await resetSequence(neon, 'penalty_configs');
	}
	logSuccess('phase3', `penalty_configs: ${penalties.length} rows`);

	// ── 2. Meters ─────────────────────────────────────────────────
	log('phase3', 'Migrating meters...');
	const { rows: meters } = await supa.query('SELECT * FROM meters ORDER BY id');

	if (meters.length > 0) {
		await neon.insert(schema.meters).values(
			meters.map((r: any) => ({
				id: r.id,
				name: r.name,
				locationType: r.location_type,
				propertyId: r.property_id,
				floorId: r.floor_id,
				rentalUnitId: r.rental_unit_id,
				type: r.type,
				isActive: r.is_active,
				status: r.status,
				notes: r.notes,
				createdAt: r.created_at,
				initialReading: r.initial_reading
			}))
		);
		await resetSequence(neon, 'meters');
	}
	logSuccess('phase3', `meters: ${meters.length} rows`);

	// ── 3. Readings ───────────────────────────────────────────────
	log('phase3', 'Migrating readings...');
	const { rows: readings } = await supa.query('SELECT * FROM readings ORDER BY id');

	if (readings.length > 0) {
		await neon.insert(schema.readings).values(
			readings.map((r: any) => ({
				id: r.id,
				meterId: r.meter_id,
				reading: r.reading,
				readingDate: r.reading_date,
				createdAt: r.created_at,
				meterName: r.meter_name,
				rateAtReading: r.rate_at_reading,
				previousReading: r.previous_reading,
				backdatingEnabled: r.backdating_enabled,
				reviewStatus: r.review_status
			}))
		);
		await resetSequence(neon, 'readings');
	}
	logSuccess('phase3', `readings: ${readings.length} rows`);

	// ── 4. Billings ───────────────────────────────────────────────
	log('phase3', 'Migrating billings...');
	const { rows: billings } = await supa.query('SELECT * FROM billings ORDER BY id');

	if (billings.length > 0) {
		await neon.insert(schema.billings).values(
			billings.map((r: any) => ({
				id: r.id,
				leaseId: r.lease_id,
				type: r.type,
				utilityType: r.utility_type,
				amount: r.amount,
				paidAmount: r.paid_amount,
				balance: r.balance,
				status: r.status,
				dueDate: r.due_date,
				billingDate: r.billing_date,
				penaltyAmount: r.penalty_amount,
				notes: r.notes,
				createdAt: r.created_at,
				updatedAt: r.updated_at,
				meterId: r.meter_id
			}))
		);
		await resetSequence(neon, 'billings');
	}
	logSuccess('phase3', `billings: ${billings.length} rows`);

	// ── 5. Payments ───────────────────────────────────────────────
	log('phase3', 'Migrating payments...');
	const { rows: payments } = await supa.query('SELECT * FROM payments ORDER BY id');

	if (payments.length > 0) {
		await neon.insert(schema.payments).values(
			payments.map((r: any) => ({
				id: r.id,
				amount: r.amount,
				method: r.method,
				referenceNumber: r.reference_number,
				paidBy: r.paid_by,
				paidAt: r.paid_at,
				notes: r.notes,
				createdAt: r.created_at,
				receiptUrl: r.receipt_url,
				createdBy: r.created_by,
				updatedBy: r.updated_by,
				updatedAt: r.updated_at,
				billingIds: r.billing_ids,
				billingId: r.billing_id,
				revertedAt: r.reverted_at,
				revertedBy: r.reverted_by,
				revertReason: r.revert_reason
			}))
		);
		await resetSequence(neon, 'payments');
	}
	logSuccess('phase3', `payments: ${payments.length} rows`);

	// ── 6. Payment Allocations ────────────────────────────────────
	log('phase3', 'Migrating payment_allocations...');
	const { rows: allocs } = await supa.query('SELECT * FROM payment_allocations ORDER BY id');

	if (allocs.length > 0) {
		await neon.insert(schema.paymentAllocations).values(
			allocs.map((r: any) => ({
				id: r.id,
				paymentId: r.payment_id,
				billingId: r.billing_id,
				amount: r.amount,
				createdAt: r.created_at
			}))
		);
		await resetSequence(neon, 'payment_allocations');
	}
	logSuccess('phase3', `payment_allocations: ${allocs.length} rows`);

	// ── 7. Expenses ───────────────────────────────────────────────
	log('phase3', 'Migrating expenses...');
	const { rows: expenses } = await supa.query('SELECT * FROM expenses ORDER BY id');

	if (expenses.length > 0) {
		await neon.insert(schema.expenses).values(
			expenses.map((r: any) => ({
				id: r.id,
				propertyId: r.property_id,
				amount: r.amount,
				description: r.description,
				type: r.type,
				status: r.status,
				createdBy: r.created_by,
				createdAt: r.created_at,
				expenseDate: r.expense_date
			}))
		);
		await resetSequence(neon, 'expenses');
	}
	logSuccess('phase3', `expenses: ${expenses.length} rows`);

	// ── 8. Budgets ────────────────────────────────────────────────
	log('phase3', 'Migrating budgets...');
	const { rows: budgets } = await supa.query('SELECT * FROM budgets ORDER BY id');

	if (budgets.length > 0) {
		await neon.insert(schema.budgets).values(
			budgets.map((r: any) => ({
				id: r.id,
				projectName: r.project_name,
				projectDescription: r.project_description,
				projectCategory: r.project_category,
				plannedAmount: r.planned_amount,
				pendingAmount: r.pending_amount,
				actualAmount: r.actual_amount,
				budgetItems: r.budget_items,
				status: r.status,
				startDate: r.start_date,
				endDate: r.end_date,
				propertyId: r.property_id,
				createdBy: r.created_by,
				createdAt: r.created_at,
				updatedAt: r.updated_at
			}))
		);
		// budgets has bigint PK — reset its sequence
		await resetSequence(neon, 'budgets');
	}
	logSuccess('phase3', `budgets: ${budgets.length} rows`);

	// ── 9. Maintenance ────────────────────────────────────────────
	log('phase3', 'Migrating maintenance...');
	const { rows: maint } = await supa.query('SELECT * FROM maintenance ORDER BY id');

	if (maint.length > 0) {
		await neon.insert(schema.maintenance).values(
			maint.map((r: any) => ({
				id: r.id,
				locationId: r.location_id,
				title: r.title,
				description: r.description,
				status: r.status,
				completedAt: r.completed_at,
				createdAt: r.created_at,
				updatedAt: r.updated_at
			}))
		);
		await resetSequence(neon, 'maintenance');
	}
	logSuccess('phase3', `maintenance: ${maint.length} rows`);

	// ── Verify ────────────────────────────────────────────────────
	log('phase3', '\n── Verification ──');
	for (const table of TABLES) {
		const srcCount = await countRows(supa, table);
		const dstCount = await countNeonRows(neon, table);
		const match = srcCount === dstCount ? '✅' : '❌ MISMATCH';
		log('phase3', `  ${table.padEnd(25)} src=${srcCount} dst=${dstCount} ${match}`);
	}

	// Financial integrity check
	log('phase3', '\n── Financial Integrity ──');
	const srcBillingSum = await supa.query('SELECT COALESCE(SUM(amount::numeric), 0) AS total FROM billings');
	const dstBillingSum = await neon.execute(sql`SELECT COALESCE(SUM(amount::numeric), 0) AS total FROM billings`);
	const srcTotal = parseFloat(srcBillingSum.rows[0].total);
	const dstTotal = parseFloat((dstBillingSum as any).rows?.[0]?.total ?? (dstBillingSum as any)[0]?.total ?? '0');
	const billingsMatch = Math.abs(srcTotal - dstTotal) < 0.01 ? '✅' : '❌ MISMATCH';
	log('phase3', `  billings SUM(amount): src=${srcTotal} dst=${dstTotal} ${billingsMatch}`);

	await closeSupabase();
	logSuccess('phase3', 'Phase 3 complete.');
}
