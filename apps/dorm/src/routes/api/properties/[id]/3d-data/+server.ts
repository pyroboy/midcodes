import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { floors, rentalUnit, leases, leaseTenants, tenants, meters } from '$lib/server/schema';
import { eq, and, inArray } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { user } = locals;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const propertyId = Number(params.id);

	// 1. Fetch Floors
	const floorsData = await db
		.select()
		.from(floors)
		.where(and(eq(floors.propertyId, propertyId), eq(floors.status, 'ACTIVE')))
		.orderBy(floors.floorNumber);

	// 2. Fetch Rental Units
	const unitsData = await db
		.select()
		.from(rentalUnit)
		.where(
			and(
				eq(rentalUnit.propertyId, propertyId),
				inArray(rentalUnit.rentalUnitStatus, ['OCCUPIED', 'VACANT', 'RESERVED'])
			)
		);

	const unitIds = unitsData.map((u) => u.id);

	// 3. Fetch leases for these units
	const leasesData = unitIds.length > 0
		? await db
				.select()
				.from(leases)
				.where(inArray(leases.rentalUnitId, unitIds))
		: [];

	const leaseIds = leasesData.map((l) => l.id);

	// 4. Fetch lease tenants with tenant details
	const leaseTenantsData = leaseIds.length > 0
		? await db
				.select({
					leaseId: leaseTenants.leaseId,
					tenantId: leaseTenants.tenantId,
					tenantName: tenants.name,
					tenantProfilePicture: tenants.profilePictureUrl,
					tenantDeletedAt: tenants.deletedAt
				})
				.from(leaseTenants)
				.leftJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
				.where(inArray(leaseTenants.leaseId, leaseIds))
		: [];

	// 5. Fetch meters for these units
	const metersData = unitIds.length > 0
		? await db
				.select()
				.from(meters)
				.where(inArray(meters.rentalUnitId, unitIds))
		: [];

	// Build nested structure
	const processedUnits = unitsData.map((unit) => {
		const unitLeases = leasesData
			.filter((l) => l.rentalUnitId === unit.id)
			.map((lease) => ({
				...lease,
				lease_tenants: leaseTenantsData
					.filter((lt) => lt.leaseId === lease.id)
					.map((lt) => ({
						tenant: {
							id: lt.tenantId,
							name: lt.tenantName,
							profile_picture_url: lt.tenantProfilePicture,
							deleted_at: lt.tenantDeletedAt
						}
					}))
			}));

		const unitMeters = metersData.filter((m) => m.rentalUnitId === unit.id);

		return {
			...unit,
			leases: unitLeases,
			meters: unitMeters,
			active_leases: unitLeases.filter((l) => l.status === 'ACTIVE')
		};
	});

	return json({
		floors: floorsData,
		rentalUnits: processedUnits
	});
};
