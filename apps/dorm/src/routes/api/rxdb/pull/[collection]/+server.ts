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

	try {
		// Use COALESCE to handle NULL updated_at — treat NULL as epoch so rows are always included
		const coalesced = sql`COALESCE(${updatedAtCol}, '1970-01-01T00:00:00Z'::timestamptz)`;
		// IMPORTANT: Cast the checkpoint as a raw timestamptz string, NOT new Date().
		// PostgreSQL has microsecond precision; JS Date only has millisecond precision.
		// new Date('...123456Z') truncates to '...123Z', making gt() always true → infinite loop.
		const checkpointTs = sql`${updatedAt}::timestamptz`;

		// Select all columns + raw timestamp with full microsecond precision as a string.
		// Drizzle converts timestamps to JS Date (ms precision only), which truncates
		// microseconds and causes infinite re-pull loops when used as checkpoint.
		const rawTsExpr = sql<string>`to_char(COALESCE(${updatedAtCol}, '1970-01-01T00:00:00Z'::timestamptz) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`.as('_raw_updated_at');

		const rows = await db
			.select({ _all: table, _rawUpdatedAt: rawTsExpr })
			.from(table)
			.where(
				or(
					gt(coalesced, checkpointTs),
					and(eq(coalesced, checkpointTs), gt(idCol, id))
				)
			)
			.orderBy(asc(coalesced), asc(idCol))
			.limit(limit);

		const documents = rows.map((r) => transform(r._all));

		// Build new checkpoint from last row using the raw microsecond-precision string.
		const lastRow = rows[rows.length - 1];
		let checkpoint: { updated_at: string; id: string };
		if (lastRow) {
			// _rawUpdatedAt is a full-precision string like "2026-03-18T02:33:18.030456Z"
			// This preserves microseconds so the next pull correctly skips this row.
			checkpoint = {
				updated_at: lastRow._rawUpdatedAt || '1970-01-01T00:00:00.000000Z',
				id: String((lastRow._all as any).id)
			};
		} else {
			checkpoint = { updated_at: updatedAt, id: String(id) };
		}

		return json({ documents, checkpoint });
	} catch (err: any) {
		// Neon driver wraps PG errors — dig into all possible locations
		const detail = err?.cause?.message || err?.sourceError?.message
			|| err?.detail || err?.hint || err?.code || '';
		const fullMsg = err?.message || String(err);
		// Log everything on the server for debugging
		console.error(`[RxDB Pull] ${collectionName} error:`, {
			message: fullMsg?.slice(0, 200),
			code: err?.code,
			detail: err?.detail,
			hint: err?.hint,
			cause: err?.cause?.message,
			sourceError: err?.sourceError?.message,
			name: err?.name,
			keys: Object.keys(err || {})
		});
		return json(
			{
				error: `Pull ${collectionName} failed`,
				detail: detail || fullMsg?.slice(-500) || 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
