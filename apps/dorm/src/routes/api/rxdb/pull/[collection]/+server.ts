import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import {
	tenants,
	leases,
	leaseTenants,
	rentalUnit,
	properties,
	floors,
	meters,
	readings,
	billings,
	payments,
	paymentAllocations,
	expenses,
	budgets,
	penaltyConfigs
} from '$lib/server/schema';
import {
	transformTenant,
	transformLease,
	transformLeaseTenant,
	transformRentalUnit,
	transformProperty,
	transformFloor,
	transformMeter,
	transformReading,
	transformBilling,
	transformPayment,
	transformPaymentAllocation,
	transformExpense,
	transformBudget,
	transformPenaltyConfig
} from '$lib/server/transforms';
import { and, or, gt, eq, asc, sql } from 'drizzle-orm';

// Allowlist of collections + their Drizzle table + transform function
const COLLECTIONS: Record<
	string,
	{ table: any; transform: (row: any) => any; updatedAtCol: any; idCol: any }
> = {
	tenants: {
		table: tenants,
		transform: transformTenant,
		updatedAtCol: tenants.updatedAt,
		idCol: tenants.id
	},
	leases: {
		table: leases,
		transform: transformLease,
		updatedAtCol: leases.updatedAt,
		idCol: leases.id
	},
	lease_tenants: {
		table: leaseTenants,
		transform: transformLeaseTenant,
		updatedAtCol: leaseTenants.updatedAt,
		idCol: leaseTenants.id
	},
	rental_units: {
		table: rentalUnit,
		transform: transformRentalUnit,
		updatedAtCol: rentalUnit.updatedAt,
		idCol: rentalUnit.id
	},
	properties: {
		table: properties,
		transform: transformProperty,
		updatedAtCol: properties.updatedAt,
		idCol: properties.id
	},
	floors: {
		table: floors,
		transform: transformFloor,
		updatedAtCol: floors.updatedAt,
		idCol: floors.id
	},
	meters: {
		table: meters,
		transform: transformMeter,
		updatedAtCol: meters.updatedAt,
		idCol: meters.id
	},
	readings: {
		table: readings,
		transform: transformReading,
		updatedAtCol: readings.updatedAt,
		idCol: readings.id
	},
	billings: {
		table: billings,
		transform: transformBilling,
		updatedAtCol: billings.updatedAt,
		idCol: billings.id
	},
	payments: {
		table: payments,
		transform: transformPayment,
		updatedAtCol: payments.updatedAt,
		idCol: payments.id
	},
	payment_allocations: {
		table: paymentAllocations,
		transform: transformPaymentAllocation,
		updatedAtCol: paymentAllocations.updatedAt,
		idCol: paymentAllocations.id
	},
	expenses: {
		table: expenses,
		transform: transformExpense,
		updatedAtCol: expenses.updatedAt,
		idCol: expenses.id
	},
	budgets: {
		table: budgets,
		transform: transformBudget,
		updatedAtCol: budgets.updatedAt,
		idCol: budgets.id
	},
	penalty_configs: {
		table: penaltyConfigs,
		transform: transformPenaltyConfig,
		updatedAtCol: penaltyConfigs.updatedAt,
		idCol: penaltyConfigs.id
	}
};

export const GET: RequestHandler = async ({ params, url, locals }) => {
	// Auth check
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const collectionName = params.collection;
	const config = COLLECTIONS[collectionName];
	if (!config) {
		throw error(400, `Unknown collection: ${collectionName}`);
	}

	// Parse checkpoint params
	const updatedAt = url.searchParams.get('updatedAt') || '1970-01-01T00:00:00Z';
	const id = parseInt(url.searchParams.get('id') || '0', 10);
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 500);

	const { table, transform, updatedAtCol, idCol } = config;

	// Checkpoint-based query: rows newer than checkpoint, or same timestamp but higher ID
	const rows = await db
		.select()
		.from(table)
		.where(
			or(
				gt(updatedAtCol, new Date(updatedAt)),
				and(eq(updatedAtCol, new Date(updatedAt)), gt(idCol, id))
			)
		)
		.orderBy(asc(updatedAtCol), asc(idCol))
		.limit(limit);

	const documents = rows.map(transform);

	// Build new checkpoint from last row (Drizzle returns camelCase JS property names)
	const lastRow = rows[rows.length - 1] as any;
	let checkpoint: { updated_at: string; id: string };
	if (lastRow) {
		const rawUpdatedAt = lastRow.updatedAt;
		checkpoint = {
			updated_at: rawUpdatedAt instanceof Date ? rawUpdatedAt.toISOString() : String(rawUpdatedAt ?? updatedAt),
			id: String(lastRow.id ?? id)
		};
	} else {
		checkpoint = { updated_at: updatedAt, id: String(id) };
	}

	return json({ documents, checkpoint });
};
