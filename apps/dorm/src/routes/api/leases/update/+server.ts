import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { leases, leaseTenants } from '$lib/server/schema';
import { and, eq, inArray, isNull, isNotNull } from 'drizzle-orm';

type LeaseStatus = (typeof leases.status.enumValues)[number];

interface UpdateLeaseRequest {
	id: number | string;
	name: string;
	start_date: string;
	end_date?: string;
	terms_month: number;
	status: string;
	unit_type: 'BEDSPACER' | 'PRIVATE_ROOM';
	notes?: string;
	rental_unit_id: number;
	tenantIds: number[];
}

// Test endpoint to verify the route is working
export const GET: RequestHandler = async () => {
	return json({ message: 'Lease update API is working' });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const data = (await request.json()) as UpdateLeaseRequest;
		const { id, tenantIds, ...leaseUpdates } = data;

		// Ensure ID is a number
		const leaseId = Number(id);

		if (!leaseId || leaseId <= 0 || isNaN(leaseId)) {
			return json({ success: false, error: 'Valid lease ID is required' }, { status: 400 });
		}

		// First, get the existing lease to preserve required fields
		const existingResult = await db
			.select()
			.from(leases)
			.where(eq(leases.id, leaseId))
			.limit(1);

		const existingLease = existingResult[0];

		if (!existingLease) {
			console.error('Lease not found');
			return json({ success: false, error: 'Lease not found' }, { status: 404 });
		}

		// Validate required fields
		if (!leaseUpdates.name?.trim()) {
			return json({ success: false, error: 'Lease name is required' }, { status: 400 });
		}

		if (!leaseUpdates.start_date) {
			return json({ success: false, error: 'Start date is required' }, { status: 400 });
		}

		if (leaseUpdates.terms_month < 0 || leaseUpdates.terms_month > 60) {
			return json(
				{ success: false, error: 'Terms must be between 0 and 60 months' },
				{ status: 400 }
			);
		}

		if (leaseUpdates.rental_unit_id <= 0) {
			return json({ success: false, error: 'Valid rental unit must be selected' }, { status: 400 });
		}

		if (!tenantIds || tenantIds.length === 0) {
			return json(
				{ success: false, error: 'At least one tenant must be selected' },
				{ status: 400 }
			);
		}

		// Calculate end_date if not provided
		let calculatedEndDate = leaseUpdates.end_date;
		if (!calculatedEndDate && leaseUpdates.start_date && leaseUpdates.terms_month > 0) {
			const start = new Date(leaseUpdates.start_date);
			const end = new Date(start);
			end.setMonth(end.getMonth() + leaseUpdates.terms_month);
			calculatedEndDate = end.toISOString().split('T')[0];
		}

		// Update the lease
		const updatedResult = await db
			.update(leases)
			.set({
				name: leaseUpdates.name.trim(),
				startDate: leaseUpdates.start_date,
				endDate: calculatedEndDate,
				termsMonth: leaseUpdates.terms_month,
				status: leaseUpdates.status as LeaseStatus,
				notes: leaseUpdates.notes?.trim() || null,
				rentalUnitId: leaseUpdates.rental_unit_id,
				rentAmount: existingLease.rentAmount,
				securityDeposit: existingLease.securityDeposit,
				updatedAt: new Date()
			})
			.where(eq(leases.id, leaseId))
			.returning();

		const updatedLease = updatedResult[0];

		if (!updatedLease) {
			console.error('Failed to update lease');
			return json(
				{ success: false, error: 'Database error: Failed to update lease' },
				{ status: 500 }
			);
		}

		// Update tenant relationships (soft-delete, no physical DELETE)
		if (tenantIds && tenantIds.length > 0) {
			const now = new Date();

			// 1. Fetch all existing lease_tenants rows for this lease (active + soft-deleted)
			const existingRows = await db
				.select()
				.from(leaseTenants)
				.where(eq(leaseTenants.leaseId, leaseId));

			const activeRows = existingRows.filter((r) => r.deletedAt === null);
			const activeTenantIds = new Set(activeRows.map((r) => r.tenantId));
			const incomingSet = new Set(tenantIds);

			// 2. Compute diff
			const toRemove = activeRows
				.filter((r) => !incomingSet.has(r.tenantId))
				.map((r) => r.tenantId);
			const toAdd = tenantIds.filter((tid) => !activeTenantIds.has(tid));

			try {
				// 3. Soft-delete removed tenants
				if (toRemove.length > 0) {
					await db
						.update(leaseTenants)
						.set({ deletedAt: now, updatedAt: now })
						.where(
							and(
								eq(leaseTenants.leaseId, leaseId),
								inArray(leaseTenants.tenantId, toRemove),
								isNull(leaseTenants.deletedAt)
							)
						);
				}

				// 4. For tenants being added, check for previously soft-deleted rows to re-activate
				const softDeletedRows = existingRows.filter(
					(r) => r.deletedAt !== null && incomingSet.has(r.tenantId)
				);
				const softDeletedTenantIds = new Set(softDeletedRows.map((r) => r.tenantId));

				if (softDeletedTenantIds.size > 0) {
					await db
						.update(leaseTenants)
						.set({ deletedAt: null, updatedAt: now })
						.where(
							and(
								eq(leaseTenants.leaseId, leaseId),
								inArray(leaseTenants.tenantId, [...softDeletedTenantIds]),
								isNotNull(leaseTenants.deletedAt)
							)
						);
				}

				// 5. Insert genuinely new tenants (never had a row before)
				const genuinelyNew = toAdd.filter((tid) => !softDeletedTenantIds.has(tid));
				if (genuinelyNew.length > 0) {
					await db.insert(leaseTenants).values(
						genuinelyNew.map((tenantId) => ({
							leaseId,
							tenantId,
							updatedAt: now
						}))
					);
				}
			} catch (relationError: any) {
				console.error('Error updating tenant relationships:', relationError);
				return json(
					{ success: false, error: 'Failed to update tenant relationships' },
					{ status: 500 }
				);
			}
		}

		return json({
			success: true,
			data: updatedLease,
			message: 'Lease updated successfully'
		});
	} catch (err) {
		console.error('Error in API endpoint:', err);
		return json(
			{
				success: false,
				error: err instanceof Error ? err.message : 'An unexpected error occurred'
			},
			{ status: 500 }
		);
	}
};
