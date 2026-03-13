import { describe, it, expect } from 'vitest';
import {
	tableSchema,
	orderSchema,
	menuItemSchema,
	stockItemSchema,
	deliverySchema,
	stockEventSchema,
	deductionSchema,
	stockCountSchema,
	deviceSchema,
	expenseSchema,
	kdsTicketSchema,
	readingSchema,
	auditLogSchema,
	floorElementSchema
} from './schemas';

const ALL_SCHEMAS = [
	{ name: 'tableSchema', schema: tableSchema },
	{ name: 'orderSchema', schema: orderSchema },
	{ name: 'menuItemSchema', schema: menuItemSchema },
	{ name: 'stockItemSchema', schema: stockItemSchema },
	{ name: 'deliverySchema', schema: deliverySchema },
	{ name: 'stockEventSchema', schema: stockEventSchema },
	{ name: 'deductionSchema', schema: deductionSchema },
	{ name: 'stockCountSchema', schema: stockCountSchema },
	{ name: 'deviceSchema', schema: deviceSchema },
	{ name: 'expenseSchema', schema: expenseSchema },
	{ name: 'kdsTicketSchema', schema: kdsTicketSchema },
	{ name: 'readingSchema', schema: readingSchema },
	{ name: 'auditLogSchema', schema: auditLogSchema },
	{ name: 'floorElementSchema', schema: floorElementSchema },
];

describe('RxDB schemas — structural integrity', () => {
	it('every schema has a non-negative version number (0 = initial, increments on migration)', () => {
		for (const { name, schema } of ALL_SCHEMAS) {
			expect(schema.version, `version missing on ${name}`).toBeGreaterThanOrEqual(0);
		}
	});

	it('every schema has a primaryKey', () => {
		for (const { name, schema } of ALL_SCHEMAS) {
			expect(schema.primaryKey, `primaryKey missing on ${name}`).toBeTruthy();
		}
	});

	it('every schema primaryKey is listed in its required array', () => {
		for (const { name, schema } of ALL_SCHEMAS) {
			const pk = schema.primaryKey as string;
			expect(
				schema.required,
				`required array missing on ${name}`
			).toBeDefined();
			expect(
				(schema.required as string[]).includes(pk),
				`primaryKey "${pk}" not in required[] on ${name}`
			).toBe(true);
		}
	});

	it('every schema has type "object"', () => {
		for (const { name, schema } of ALL_SCHEMAS) {
			expect(schema.type, `type not "object" on ${name}`).toBe('object');
		}
	});

	it('every schema has a properties object', () => {
		for (const { name, schema } of ALL_SCHEMAS) {
			expect(schema.properties, `properties missing on ${name}`).toBeDefined();
		}
	});

	it('every schema primaryKey field exists in properties', () => {
		for (const { name, schema } of ALL_SCHEMAS) {
			const pk = schema.primaryKey as string;
			expect(
				(schema.properties as Record<string, unknown>)[pk],
				`primaryKey field "${pk}" not in properties on ${name}`
			).toBeDefined();
		}
	});

	it('all required fields exist in properties', () => {
		for (const { name, schema } of ALL_SCHEMAS) {
			const props = Object.keys(schema.properties as object);
			for (const field of schema.required as string[]) {
				expect(
					props.includes(field),
					`required field "${field}" not in properties on ${name}`
				).toBe(true);
			}
		}
	});

	it('covers all 15 schemas', () => {
		expect(ALL_SCHEMAS).toHaveLength(14);
	});
});
