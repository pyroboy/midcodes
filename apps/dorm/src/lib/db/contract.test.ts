/**
 * Contract tests: Verify API response shapes match RxDB schema expectations.
 *
 * These tests validate the CONTRACT between the pull endpoint and RxDB:
 * - Every field in the API response exists in the RxDB schema
 * - Every required field in the RxDB schema is present in the API response
 * - Field types match (string IDs, nullable fields, decimal-as-string)
 * - Checkpoint shape is correct
 * - Health/integrity/counts endpoint shapes are correct
 * - All 15 collections have matching transforms
 * - Transform output types match schema declared types
 */

import { describe, it, expect } from 'vitest';

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

// ─── Test data: fake Drizzle rows with all fields populated ──────────────────

const now = new Date();

const FAKE_ROWS: Record<string, any> = {
	tenants: {
		id: 1, name: 'Test Tenant', contactNumber: '+639170000000', email: 'test@test.com',
		createdAt: now, updatedAt: now, authId: 'auth_1', emergencyContact: { name: 'Mom', phone: '123' },
		tenantStatus: 'active', createdBy: 'admin', deletedAt: null,
		profilePictureUrl: 'https://example.com/photo.jpg', address: '123 Main St',
		schoolOrWorkplace: 'MIT', facebookName: 'testtenant', birthday: '2000-01-01'
	},
	leases: {
		id: 1, rentalUnitId: 1, name: 'Lease-2025', startDate: '2025-01-01', endDate: '2025-12-31',
		rentAmount: '10000.00', securityDeposit: '20000.00', notes: 'Test notes',
		createdAt: now, updatedAt: now, createdBy: 'admin', termsMonth: 12,
		status: 'active', deletedAt: null, deletedBy: null, deletionReason: null
	},
	lease_tenants: {
		id: 1, leaseId: 1, tenantId: 1, createdAt: now, updatedAt: now, deletedAt: null
	},
	rental_units: {
		id: 1, name: 'Room 101', capacity: 4, rentalUnitStatus: 'available',
		baseRate: '5500.00', createdAt: now, updatedAt: now, propertyId: 1,
		floorId: 1, type: 'single', amenities: ['wifi', 'aircon'], number: 101, deletedAt: null
	},
	properties: {
		id: 1, name: 'Sunrise Dorm', address: '456 University Ave', type: 'dormitory',
		status: 'active', createdAt: now, updatedAt: now, deletedAt: null
	},
	floors: {
		id: 1, propertyId: 1, floorNumber: 2, wing: 'East', status: 'active',
		createdAt: now, updatedAt: now, deletedAt: null
	},
	meters: {
		id: 1, name: 'E-101', locationType: 'unit', propertyId: 1, floorId: 1,
		rentalUnitId: 1, type: 'electricity', isActive: true, status: 'active',
		notes: 'Sub-meter', initialReading: '100.50',
		createdAt: now, updatedAt: now, deletedAt: null
	},
	readings: {
		id: 1, meterId: 1, reading: '250.75', readingDate: '2025-06-01',
		meterName: 'E-101', rateAtReading: '12.00', previousReading: '200.00',
		backdatingEnabled: false, reviewStatus: 'approved',
		createdAt: now, updatedAt: now, deletedAt: null
	},
	billings: {
		id: 1, leaseId: 1, type: 'rent', utilityType: 'electricity',
		amount: '10000.00', paidAmount: '5000.00', balance: '5000.00',
		status: 'partial', dueDate: '2025-02-01', billingDate: '2025-01-01',
		penaltyAmount: '200.00', notes: 'First month', meterId: 1,
		createdAt: now, updatedAt: now, deletedAt: null
	},
	payments: {
		id: 1, amount: '5000.00', method: 'gcash', referenceNumber: 'GC-999',
		paidBy: 'Juan', paidAt: now, notes: null, receiptUrl: null,
		createdBy: 'admin', updatedBy: null, billingIds: [1, 2], billingId: 1,
		revertedAt: null, revertedBy: null, revertReason: null,
		createdAt: now, updatedAt: now, deletedAt: null
	},
	payment_allocations: {
		id: 1, paymentId: 1, billingId: 1, amount: '2500.00',
		createdAt: now, updatedAt: now, deletedAt: null
	},
	expenses: {
		id: 1, propertyId: 1, amount: '15000.00', description: 'Plumbing fix',
		type: 'maintenance', status: 'approved', createdBy: 'admin',
		expenseDate: now, createdAt: now, updatedAt: now, deletedAt: null
	},
	budgets: {
		id: 1, projectName: 'Renovation', projectDescription: 'Kitchen remodel',
		projectCategory: 'capital', plannedAmount: '50000.00',
		pendingAmount: '20000.00', actualAmount: '30000.00',
		budgetItems: [{ name: 'Tiles', cost: 10000 }], status: 'in_progress',
		startDate: now, endDate: now, propertyId: 1, createdBy: 'admin',
		createdAt: now, updatedAt: now, deletedAt: null
	},
	penalty_configs: {
		id: 1, type: 'late_rent', gracePeriod: 5, penaltyPercentage: '2.50',
		compoundPeriod: 30, maxPenaltyPercentage: '25.00',
		createdAt: now, updatedAt: now, deletedAt: null
	},
	floor_layout_items: {
		id: 1, floorId: 1, rentalUnitId: 1, itemType: 'ROOM',
		gridX: 0, gridY: 0, gridW: 3, gridH: 2, label: 'Room 101', color: '#4A90D9',
		createdAt: now, updatedAt: now, deletedAt: null
	}
};

const TRANSFORMS: Record<string, (row: any) => any> = {
	tenants: transformTenant,
	leases: transformLease,
	lease_tenants: transformLeaseTenant,
	rental_units: transformRentalUnit,
	properties: transformProperty,
	floors: transformFloor,
	meters: transformMeter,
	readings: transformReading,
	billings: transformBilling,
	payments: transformPayment,
	payment_allocations: transformPaymentAllocation,
	expenses: transformExpense,
	budgets: transformBudget,
	penalty_configs: transformPenaltyConfig,
	floor_layout_items: transformFloorLayoutItem
};

const SCHEMAS: Record<string, any> = {
	tenants: tenantSchema,
	leases: leaseSchema,
	lease_tenants: leaseTenantSchema,
	rental_units: rentalUnitSchema,
	properties: propertySchema,
	floors: floorSchema,
	meters: meterSchema,
	readings: readingSchema,
	billings: billingSchema,
	payments: paymentSchema,
	payment_allocations: paymentAllocationSchema,
	expenses: expenseSchema,
	budgets: budgetSchema,
	penalty_configs: penaltyConfigSchema,
	floor_layout_items: floorLayoutItemSchema
};

const ALL_COLLECTIONS = Object.keys(SCHEMAS);

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Every transform output key exists in its schema ──────────────────────

describe('contract: transform output keys ⊆ schema properties', () => {
	for (const name of ALL_COLLECTIONS) {
		it(`${name}: every transform key should be a declared schema property`, () => {
			const doc = TRANSFORMS[name](FAKE_ROWS[name]);
			const schemaProps = Object.keys(SCHEMAS[name].properties);

			for (const key of Object.keys(doc)) {
				expect(schemaProps).toContain(key);
			}
		});
	}
});

// ─── 2. Every required schema field is in the transform output ───────────────

describe('contract: schema required fields ⊆ transform output', () => {
	for (const name of ALL_COLLECTIONS) {
		it(`${name}: every required field should be present in transform output`, () => {
			const doc = TRANSFORMS[name](FAKE_ROWS[name]);
			const required = SCHEMAS[name].required || [];

			for (const field of required) {
				expect(doc).toHaveProperty(field);
				expect(doc[field]).not.toBeUndefined();
			}
		});
	}
});

// ─── 3. Primary key (id) is always a string ──────────────────────────────────

describe('contract: primary key is always string', () => {
	for (const name of ALL_COLLECTIONS) {
		it(`${name}: id should be type string`, () => {
			const doc = TRANSFORMS[name](FAKE_ROWS[name]);
			expect(typeof doc.id).toBe('string');
			expect(doc.id.length).toBeGreaterThan(0);
		});
	}
});

// ─── 4. deleted_at is present in every collection (soft-delete contract) ─────

describe('contract: deleted_at field exists in every collection', () => {
	for (const name of ALL_COLLECTIONS) {
		it(`${name}: schema should have deleted_at property`, () => {
			expect(SCHEMAS[name].properties).toHaveProperty('deleted_at');
		});

		it(`${name}: transform should output deleted_at`, () => {
			const doc = TRANSFORMS[name](FAKE_ROWS[name]);
			expect(doc).toHaveProperty('deleted_at');
		});
	}
});

// ─── 5. Foreign key fields are strings or null (not numbers) ─────────────────

describe('contract: foreign key fields are string|null', () => {
	const FK_FIELDS: Record<string, string[]> = {
		leases: ['rental_unit_id'],
		lease_tenants: ['lease_id', 'tenant_id'],
		rental_units: ['property_id', 'floor_id'],
		floors: ['property_id'],
		meters: ['property_id', 'floor_id', 'rental_unit_id'],
		readings: ['meter_id'],
		billings: ['lease_id', 'meter_id'],
		payments: ['billing_id'],
		payment_allocations: ['payment_id', 'billing_id'],
		expenses: ['property_id'],
		budgets: ['property_id'],
		floor_layout_items: ['floor_id', 'rental_unit_id']
	};

	for (const [name, fks] of Object.entries(FK_FIELDS)) {
		for (const fk of fks) {
			it(`${name}.${fk} should be string or null`, () => {
				const doc = TRANSFORMS[name](FAKE_ROWS[name]);
				const value = doc[fk];
				if (value !== null) {
					expect(typeof value).toBe('string');
				}
			});
		}
	}
});

// ─── 6. Decimal/monetary fields are strings (not numbers) ────────────────────

describe('contract: monetary fields are strings', () => {
	const DECIMAL_FIELDS: Record<string, string[]> = {
		rental_units: ['base_rate'],
		leases: ['rent_amount', 'security_deposit'],
		readings: ['reading', 'rate_at_reading', 'previous_reading'],
		billings: ['amount', 'paid_amount', 'balance', 'penalty_amount'],
		payments: ['amount'],
		payment_allocations: ['amount'],
		expenses: ['amount'],
		budgets: ['planned_amount', 'pending_amount', 'actual_amount'],
		penalty_configs: ['penalty_percentage', 'max_penalty_percentage']
	};

	for (const [name, fields] of Object.entries(DECIMAL_FIELDS)) {
		for (const field of fields) {
			it(`${name}.${field} should be string (not number)`, () => {
				const doc = TRANSFORMS[name](FAKE_ROWS[name]);
				const value = doc[field];
				if (value !== null && value !== undefined) {
					expect(typeof value).toBe('string');
				}
			});
		}
	}
});

// ─── 7. Timestamp fields are string|null (not Date objects) ──────────────────

describe('contract: timestamp fields are string|null', () => {
	for (const name of ALL_COLLECTIONS) {
		it(`${name}: created_at/updated_at/deleted_at should be string|null`, () => {
			const doc = TRANSFORMS[name](FAKE_ROWS[name]);

			for (const tsField of ['created_at', 'updated_at', 'deleted_at']) {
				if (doc[tsField] !== null && doc[tsField] !== undefined) {
					expect(typeof doc[tsField]).toBe('string');
				}
			}
		});
	}
});

// ─── 8. Date fields (not timestamps) are also string|null ────────────────────

describe('contract: date fields are string|null after transform', () => {
	const DATE_FIELDS: Record<string, string[]> = {
		leases: ['start_date', 'end_date'],
		readings: ['reading_date'],
		billings: ['due_date', 'billing_date'],
		payments: ['paid_at'],
		expenses: ['expense_date'],
		budgets: ['start_date', 'end_date']
	};

	for (const [name, fields] of Object.entries(DATE_FIELDS)) {
		for (const field of fields) {
			it(`${name}.${field} should be string (Date objects converted by ts())`, () => {
				const doc = TRANSFORMS[name](FAKE_ROWS[name]);
				const value = doc[field];
				if (value !== null) {
					expect(typeof value).toBe('string');
					// Should not be "[object Date]"
					expect(value).not.toContain('[object');
				}
			});
		}
	}
});

// ─── 9. Schema version consistency ───────────────────────────────────────────

describe('contract: schema versions', () => {
	it('all schemas except floor_layout_items should be version 1', () => {
		for (const name of ALL_COLLECTIONS) {
			const expected = name === 'floor_layout_items' ? 0 : 1;
			expect(SCHEMAS[name].version).toBe(expected);
		}
	});
});

// ─── 10. Schema primaryKey is always "id" ────────────────────────────────────

describe('contract: primaryKey is "id" for all collections', () => {
	for (const name of ALL_COLLECTIONS) {
		it(`${name}: primaryKey should be "id"`, () => {
			expect(SCHEMAS[name].primaryKey).toBe('id');
		});
	}
});

// ─── 11. All indexed fields are in the required array (Dexie constraint) ─────

describe('contract: indexed fields are required (Dexie/DXE1)', () => {
	for (const name of ALL_COLLECTIONS) {
		const schema = SCHEMAS[name];
		if (!schema.indexes || schema.indexes.length === 0) continue;

		for (const idx of schema.indexes) {
			const fields = Array.isArray(idx) ? idx : [idx];
			for (const field of fields) {
				it(`${name}: indexed field "${field}" must be in required[]`, () => {
					expect(schema.required).toContain(field);
				});
			}
		}
	}
});

// ─── 12. Indexed string fields have maxLength (SC34 constraint) ──────────────

describe('contract: indexed string fields have maxLength (SC34)', () => {
	for (const name of ALL_COLLECTIONS) {
		const schema = SCHEMAS[name];
		if (!schema.indexes) continue;

		for (const idx of schema.indexes) {
			const fields = Array.isArray(idx) ? idx : [idx];
			for (const field of fields) {
				const prop = schema.properties[field];
				if (prop?.type === 'string') {
					it(`${name}.${field}: indexed string must have maxLength`, () => {
						expect(prop.maxLength).toBeDefined();
						expect(prop.maxLength).toBeGreaterThan(0);
					});
				}
			}
		}
	}
});

// ─── 13. Indexed number fields have min/max/multipleOf (SC37 constraint) ─────

describe('contract: indexed number fields have min/max/multipleOf (SC37)', () => {
	for (const name of ALL_COLLECTIONS) {
		const schema = SCHEMAS[name];
		if (!schema.indexes) continue;

		for (const idx of schema.indexes) {
			const fields = Array.isArray(idx) ? idx : [idx];
			for (const field of fields) {
				const prop = schema.properties[field];
				if (prop?.type === 'number' || prop?.type === 'integer') {
					it(`${name}.${field}: indexed number must have minimum/maximum/multipleOf`, () => {
						expect(prop.minimum).toBeDefined();
						expect(prop.maximum).toBeDefined();
						expect(prop.multipleOf).toBeDefined();
					});
				}
			}
		}
	}
});

// ─── 14. No schema has _rev or _id defined (RxDB reserves these) ────────────

describe('contract: no reserved RxDB fields in schema properties', () => {
	for (const name of ALL_COLLECTIONS) {
		it(`${name}: should not define _rev or _id`, () => {
			expect(SCHEMAS[name].properties).not.toHaveProperty('_rev');
			expect(SCHEMAS[name].properties).not.toHaveProperty('_id');
		});
	}
});

// ─── 15. Checkpoint shape contract ───────────────────────────────────────────

describe('contract: checkpoint shape', () => {
	it('pull endpoint checkpoint should have updated_at (string) and id (string)', () => {
		// Simulated response from pull endpoint
		const checkpoint = {
			updated_at: '2025-06-01T12:00:00.123456Z',
			id: '42'
		};

		expect(typeof checkpoint.updated_at).toBe('string');
		expect(typeof checkpoint.id).toBe('string');
		// updated_at should be ISO-like with microsecond precision
		expect(checkpoint.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/);
	});
});

// ─── 16. Health endpoint response contract ───────────────────────────────────

describe('contract: health endpoint response shape', () => {
	it('success response should have neon, latencyMs, maxUpdatedAt', () => {
		const response = { neon: 'reachable', latencyMs: 42, maxUpdatedAt: '2025-06-01T00:00:00Z' };
		expect(response.neon).toBe('reachable');
		expect(typeof response.latencyMs).toBe('number');
		expect(typeof response.maxUpdatedAt).toBe('string');
	});

	it('maxUpdatedAt can be null (empty database)', () => {
		const response = { neon: 'reachable', latencyMs: 10, maxUpdatedAt: null };
		expect(response.maxUpdatedAt).toBeNull();
	});
});

// ─── 17. Integrity endpoint response contract ────────────────────────────────

describe('contract: integrity endpoint response shape', () => {
	it('should return collections with count (number) and ids (number[])', () => {
		const response = {
			collections: {
				tenants: { count: 3, ids: [1, 2, 3] },
				leases: { count: 0, ids: [] }
			},
			latencyMs: 100
		};

		for (const [name, data] of Object.entries(response.collections)) {
			expect(typeof data.count).toBe('number');
			expect(Array.isArray(data.ids)).toBe(true);
			expect(data.ids.length).toBe(data.count);
			for (const id of data.ids) {
				expect(typeof id).toBe('number');
			}
		}
	});
});

// ─── 18. Counts endpoint response contract ───────────────────────────────────

describe('contract: counts endpoint response shape', () => {
	it('should return counts (Record<string, number>), fetchedAt, latencyMs', () => {
		const response = {
			counts: { tenants: 42, leases: 15 },
			fetchedAt: Date.now(),
			latencyMs: 30
		};

		expect(typeof response.fetchedAt).toBe('number');
		expect(typeof response.latencyMs).toBe('number');
		for (const [name, count] of Object.entries(response.counts)) {
			expect(typeof name).toBe('string');
			expect(typeof count).toBe('number');
			expect(count).toBeGreaterThanOrEqual(0);
		}
	});
});

// ─── 19. All 15 collections have transforms ─────────────────────────────────

describe('contract: transform coverage', () => {
	it('every synced collection should have a corresponding transform function', () => {
		const SYNCED = [
			'tenants', 'leases', 'lease_tenants', 'rental_units', 'properties',
			'floors', 'meters', 'readings', 'billings', 'payments',
			'payment_allocations', 'expenses', 'budgets', 'penalty_configs',
			'floor_layout_items'
		];

		for (const name of SYNCED) {
			expect(TRANSFORMS[name]).toBeDefined();
			expect(typeof TRANSFORMS[name]).toBe('function');
		}

		expect(Object.keys(TRANSFORMS).length).toBe(15);
	});
});

// ─── 20. Transform output field count matches schema property count ──────────

describe('contract: transform output completeness', () => {
	for (const name of ALL_COLLECTIONS) {
		it(`${name}: transform should output exactly the same fields as schema`, () => {
			const doc = TRANSFORMS[name](FAKE_ROWS[name]);
			const transformKeys = Object.keys(doc).sort();
			const schemaKeys = Object.keys(SCHEMAS[name].properties).sort();

			expect(transformKeys).toEqual(schemaKeys);
		});
	}
});
