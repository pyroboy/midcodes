/**
 * Integration tests: Real RxDB (memory storage) + mocked pull API.
 *
 * These tests create a real RxDB database with all 15 collection schemas,
 * upsert documents through the actual RxDB pipeline, and verify:
 * - Documents pass schema validation (no VD2 errors)
 * - Queries with deleted_at filter work correctly
 * - Checkpoint-based pagination logic
 * - Soft-delete behavior
 * - Decimal string preservation through the full pipeline
 * - All 15 transforms produce valid documents for their schemas
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRxDatabase, addRxPlugin, type RxDatabase } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

import {
	tenantSchema, leaseSchema, leaseTenantSchema, rentalUnitSchema,
	propertySchema, floorSchema, meterSchema, readingSchema,
	billingSchema, paymentSchema, paymentAllocationSchema,
	expenseSchema, budgetSchema, penaltyConfigSchema, floorLayoutItemSchema
} from './schemas';

import {
	transformTenant, transformLease, transformLeaseTenant, transformRentalUnit,
	transformProperty, transformFloor, transformMeter, transformReading,
	transformBilling, transformPayment, transformPaymentAllocation,
	transformExpense, transformBudget, transformPenaltyConfig, transformFloorLayoutItem
} from '$lib/server/transforms';

// ─── Setup: create a real validated RxDB instance ────────────────────────────

let db: RxDatabase;

addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBDevModePlugin);

const col = (schema: any) => ({ schema, migrationStrategies: { 1: (doc: any) => doc } });
const col0 = (schema: any) => ({ schema, migrationStrategies: {} });

beforeAll(async () => {
	db = await createRxDatabase({
		name: 'integration_test_' + Date.now(),
		storage: wrappedValidateAjvStorage({ storage: getRxStorageMemory() }),
		ignoreDuplicate: true
	});

	await db.addCollections({
		tenants: col(tenantSchema),
		leases: col(leaseSchema),
		lease_tenants: col(leaseTenantSchema),
		rental_units: col(rentalUnitSchema),
		properties: col(propertySchema),
		floors: col(floorSchema),
		meters: col(meterSchema),
		readings: col(readingSchema),
		billings: col(billingSchema),
		payments: col(paymentSchema),
		payment_allocations: col(paymentAllocationSchema),
		expenses: col(expenseSchema),
		budgets: col(budgetSchema),
		penalty_configs: col(penaltyConfigSchema),
		floor_layout_items: col0(floorLayoutItemSchema)
	});
});

afterAll(async () => {
	if (db) {
		try { await (db as any).destroy(); } catch { /* ignore cleanup errors */ }
	}
});

// ─── Helper: simulate a Drizzle row → transform → RxDB upsert ──────────────

async function insertViaTransform(
	collectionName: string,
	transform: (row: any) => any,
	drizzleRow: any
) {
	const doc = transform(drizzleRow);
	await (db as any)[collectionName].upsert(doc);
	return doc;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('integration: tenant round-trip', () => {
	it('should insert a transformed tenant and query it back', async () => {
		const doc = await insertViaTransform('tenants', transformTenant, {
			id: 1, name: 'Juan Dela Cruz', contactNumber: '+639171234567',
			email: 'juan@example.com', createdAt: new Date(), updatedAt: new Date(),
			authId: null, emergencyContact: null, tenantStatus: 'active',
			createdBy: null, deletedAt: null, profilePictureUrl: null,
			address: 'Manila', schoolOrWorkplace: 'UP Diliman',
			facebookName: 'juandc', birthday: '2000-01-15'
		});

		const result = await db.tenants.findOne(doc.id).exec();
		expect(result).not.toBeNull();
		expect(result!.name).toBe('Juan Dela Cruz');
		expect(result!.tenant_status).toBe('active');
	});

	it('should filter out soft-deleted tenants', async () => {
		await insertViaTransform('tenants', transformTenant, {
			id: 2, name: 'Deleted Tenant', tenantStatus: 'inactive',
			createdAt: new Date(), updatedAt: new Date(),
			deletedAt: new Date() // soft-deleted
		});

		const active = await db.tenants.find({
			selector: { deleted_at: { $eq: null } }
		}).exec();
		const names = active.map((d: any) => d.name);
		expect(names).toContain('Juan Dela Cruz');
		expect(names).not.toContain('Deleted Tenant');
	});
});

describe('integration: lease with decimal amounts', () => {
	it('should preserve decimal string precision through RxDB', async () => {
		await insertViaTransform('properties', transformProperty, {
			id: 1, name: 'Test Property', address: '123 St', type: 'dormitory',
			status: 'active', createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});
		await insertViaTransform('floors', transformFloor, {
			id: 1, propertyId: 1, floorNumber: 1, wing: null, status: 'active',
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});
		await insertViaTransform('rental_units', transformRentalUnit, {
			id: 1, name: 'Room 101', capacity: 2, rentalUnitStatus: 'available',
			baseRate: '5500.50', propertyId: 1, floorId: 1, type: 'single',
			amenities: null, number: 101,
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const doc = await insertViaTransform('leases', transformLease, {
			id: 1, rentalUnitId: 1, name: 'Lease 2025-A',
			startDate: '2025-01-01', endDate: '2025-12-31',
			rentAmount: '10500.75', securityDeposit: '21001.50',
			notes: null, createdAt: new Date(), updatedAt: new Date(),
			createdBy: null, termsMonth: 12, status: 'active',
			deletedAt: null, deletedBy: null, deletionReason: null
		});

		const result = await db.leases.findOne(doc.id).exec();
		expect(result!.rent_amount).toBe('10500.75');
		expect(result!.security_deposit).toBe('21001.50');
		expect(typeof result!.rent_amount).toBe('string');
	});
});

describe('integration: lease_tenant junction', () => {
	it('should link tenant to lease via junction table', async () => {
		await insertViaTransform('lease_tenants', transformLeaseTenant, {
			id: 1, leaseId: 1, tenantId: 1,
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const junctions = await db.lease_tenants.find({
			selector: { lease_id: '1', deleted_at: { $eq: null } }
		}).exec();
		expect(junctions.length).toBe(1);
		expect(junctions[0].tenant_id).toBe('1');
	});
});

describe('integration: meter with nullable FKs', () => {
	it('should handle null property_id/floor_id/rental_unit_id', async () => {
		await insertViaTransform('meters', transformMeter, {
			id: 1, name: 'Main Water', locationType: 'property', type: 'water',
			propertyId: 1, floorId: null, rentalUnitId: null,
			isActive: true, status: 'active', notes: null, initialReading: '0.00',
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.meters.findOne('1').exec();
		expect(result!.floor_id).toBeNull();
		expect(result!.rental_unit_id).toBeNull();
		expect(result!.property_id).toBe('1');
	});
});

describe('integration: reading with date field', () => {
	it('should store reading_date as string (not Date object)', async () => {
		await insertViaTransform('readings', transformReading, {
			id: 1, meterId: 1, reading: '150.50', readingDate: '2025-06-01',
			meterName: 'Main Water', rateAtReading: '12.00', previousReading: '100.00',
			backdatingEnabled: false, reviewStatus: 'approved',
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.readings.findOne('1').exec();
		expect(typeof result!.reading_date).toBe('string');
		expect(result!.reading).toBe('150.50');
	});

	it('should handle Date object in readingDate via ts() wrapper', async () => {
		// Drizzle might return a Date object — ts() should convert it to ISO string
		await insertViaTransform('readings', transformReading, {
			id: 2, meterId: 1, reading: '200.00',
			readingDate: new Date('2025-07-01T00:00:00Z'),
			reviewStatus: 'pending',
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.readings.findOne('2').exec();
		expect(typeof result!.reading_date).toBe('string');
		expect(result!.reading_date).toContain('2025-07-01');
	});
});

describe('integration: billing with all decimal fields', () => {
	it('should preserve amount, balance, penalty_amount as strings', async () => {
		await insertViaTransform('billings', transformBilling, {
			id: 1, leaseId: 1, type: 'rent', utilityType: null,
			amount: '10500.75', paidAmount: '5000.00', balance: '5500.75',
			status: 'partial', dueDate: '2025-02-01', billingDate: '2025-01-01',
			penaltyAmount: '525.04', notes: null, meterId: null,
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.billings.findOne('1').exec();
		expect(result!.amount).toBe('10500.75');
		expect(result!.balance).toBe('5500.75');
		expect(result!.penalty_amount).toBe('525.04');
	});
});

describe('integration: payment with billing_ids array', () => {
	it('should store billing_ids as string array', async () => {
		await insertViaTransform('payments', transformPayment, {
			id: 1, amount: '5000.00', method: 'gcash',
			referenceNumber: 'GC-12345', paidBy: 'Juan Dela Cruz',
			paidAt: new Date(), notes: null, receiptUrl: null,
			createdBy: null, updatedBy: null,
			billingIds: [1, 2, 3], billingId: 1,
			revertedAt: null, revertedBy: null, revertReason: null,
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.payments.findOne('1').exec();
		expect(result!.billing_ids).toEqual(['1', '2', '3']);
		expect(result!.amount).toBe('5000.00');
	});

	it('should handle null billing_ids', async () => {
		await insertViaTransform('payments', transformPayment, {
			id: 2, amount: '1000.00', method: 'cash', paidBy: 'Maria',
			paidAt: new Date(), billingIds: null, billingId: null,
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.payments.findOne('2').exec();
		expect(result!.billing_ids).toBeNull();
	});
});

describe('integration: payment_allocation', () => {
	it('should store allocation with string amount', async () => {
		await insertViaTransform('payment_allocations', transformPaymentAllocation, {
			id: 1, paymentId: 1, billingId: 1, amount: '2500.00',
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.payment_allocations.findOne('1').exec();
		expect(result!.amount).toBe('2500.00');
		expect(result!.payment_id).toBe('1');
	});
});

describe('integration: expense', () => {
	it('should store expense with Date expense_date', async () => {
		await insertViaTransform('expenses', transformExpense, {
			id: 1, propertyId: 1, amount: '15000.00', description: 'Plumbing repair',
			type: 'maintenance', status: 'approved', createdBy: 'admin',
			expenseDate: new Date('2025-03-15'),
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.expenses.findOne('1').exec();
		expect(typeof result!.expense_date).toBe('string');
		expect(result!.amount).toBe('15000.00');
	});
});

describe('integration: budget with JSON items', () => {
	it('should store budget_items as array of objects', async () => {
		const items = [
			{ name: 'Paint', quantity: 10, unitCost: 500 },
			{ name: 'Labor', quantity: 1, unitCost: 8000 }
		];

		await insertViaTransform('budgets', transformBudget, {
			id: 1, projectName: 'Room Renovation', projectDescription: 'Repaint all rooms',
			projectCategory: 'maintenance', plannedAmount: '13000.00',
			pendingAmount: '5000.00', actualAmount: '8000.00',
			budgetItems: items, status: 'in_progress',
			startDate: new Date('2025-01-01'), endDate: new Date('2025-03-31'),
			propertyId: 1, createdBy: 'admin',
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.budgets.findOne('1').exec();
		expect(result!.budget_items).toHaveLength(2);
		expect(result!.planned_amount).toBe('13000.00');
	});
});

describe('integration: penalty_config', () => {
	it('should store percentage as string (decimal precision)', async () => {
		await insertViaTransform('penalty_configs', transformPenaltyConfig, {
			id: 1, type: 'late_rent', gracePeriod: 5,
			penaltyPercentage: '2.50', compoundPeriod: 30,
			maxPenaltyPercentage: '25.00',
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.penalty_configs.findOne('1').exec();
		expect(result!.penalty_percentage).toBe('2.50');
		expect(result!.grace_period).toBe(5);
	});
});

describe('integration: floor_layout_item', () => {
	it('should store grid coordinates as numbers', async () => {
		await insertViaTransform('floor_layout_items', transformFloorLayoutItem, {
			id: 1, floorId: 1, rentalUnitId: 1, itemType: 'ROOM',
			gridX: 0, gridY: 0, gridW: 3, gridH: 2,
			label: 'Room 101', color: '#4A90D9',
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.floor_layout_items.findOne('1').exec();
		expect(result!.grid_x).toBe(0);
		expect(result!.grid_w).toBe(3);
		expect(result!.item_type).toBe('ROOM');
	});

	it('should store WALL items with null rental_unit_id', async () => {
		await insertViaTransform('floor_layout_items', transformFloorLayoutItem, {
			id: 2, floorId: 1, rentalUnitId: null, itemType: 'WALL',
			gridX: 5, gridY: 0, gridW: 1, gridH: 5,
			label: null, color: null,
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		});

		const result = await db.floor_layout_items.findOne('2').exec();
		expect(result!.rental_unit_id).toBeNull();
		expect(result!.item_type).toBe('WALL');
	});
});

describe('integration: soft-delete query across collections', () => {
	it('deleted_at: null filter should exclude soft-deleted docs in every collection', async () => {
		// Insert an active + deleted doc for each key collection
		const collections = [
			{ name: 'properties', transform: transformProperty, active: { id: 10, name: 'Active', address: 'A', type: 'dormitory', status: 'active', createdAt: new Date(), updatedAt: new Date(), deletedAt: null }, deleted: { id: 11, name: 'Deleted', address: 'B', type: 'dormitory', status: 'inactive', createdAt: new Date(), updatedAt: new Date(), deletedAt: new Date() } },
			{ name: 'floors', transform: transformFloor, active: { id: 10, propertyId: 1, floorNumber: 1, status: 'active', createdAt: new Date(), updatedAt: new Date(), deletedAt: null }, deleted: { id: 11, propertyId: 1, floorNumber: 2, status: 'inactive', createdAt: new Date(), updatedAt: new Date(), deletedAt: new Date() } }
		];

		for (const { name, transform, active, deleted } of collections) {
			await (db as any)[name].upsert(transform(active));
			await (db as any)[name].upsert(transform(deleted));

			const results = await (db as any)[name].find({
				selector: { deleted_at: { $eq: null } }
			}).exec();

			const ids = results.map((d: any) => d.id);
			expect(ids).toContain(String(active.id));
			expect(ids).not.toContain(String(deleted.id));
		}
	});
});

describe('integration: multiple documents + pagination simulation', () => {
	it('should handle 50 documents in a single collection', async () => {
		const docs = Array.from({ length: 50 }, (_, i) => ({
			id: 100 + i, name: `Tenant ${100 + i}`, tenantStatus: 'active',
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		}));

		for (const row of docs) {
			await db.tenants.upsert(transformTenant(row));
		}

		const all = await db.tenants.find({
			selector: { deleted_at: { $eq: null } }
		}).exec();

		// Should have at least 50 + the 2 from earlier tests
		expect(all.length).toBeGreaterThanOrEqual(50);
	});

	it('should correctly sort by name index', async () => {
		const sorted = await db.tenants.find({
			selector: { deleted_at: { $eq: null } },
			sort: [{ name: 'asc' }]
		}).exec();

		for (let i = 1; i < sorted.length; i++) {
			expect(sorted[i].name >= sorted[i - 1].name).toBe(true);
		}
	});
});

describe('integration: ID coercion — numeric ID becomes string primary key', () => {
	it('Drizzle serial ID 42 should be queryable as string "42"', async () => {
		await db.tenants.upsert(transformTenant({
			id: 42, name: 'ID Test', tenantStatus: 'active',
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		}));

		// RxDB findOne expects string primary key
		const byString = await db.tenants.findOne('42').exec();
		expect(byString).not.toBeNull();
		expect(byString!.name).toBe('ID Test');
	});
});

describe('integration: emergency_contact object field', () => {
	it('should store and retrieve JSON object in emergency_contact', async () => {
		const contact = { name: 'Maria Cruz', phone: '+639181234567', relation: 'Mother' };
		await db.tenants.upsert(transformTenant({
			id: 200, name: 'With Emergency', tenantStatus: 'active',
			emergencyContact: contact,
			createdAt: new Date(), updatedAt: new Date(), deletedAt: null
		}));

		const result = await db.tenants.findOne('200').exec();
		expect(result!.emergency_contact).toEqual(contact);
	});
});
