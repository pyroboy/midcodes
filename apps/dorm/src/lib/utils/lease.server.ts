/**
 * Server-only lease utilities that require DB access.
 * Keep separate from lease.ts which is imported by client components.
 */
import { db } from '$lib/server/db';
import { leases, leaseTenants, tenants, rentalUnit, billings, properties } from '$lib/server/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function getLeaseData() {
	const leasesData = await db
		.select()
		.from(leases)
		.orderBy(desc(leases.createdAt));

	const leaseIds = leasesData.map((l) => l.id);

	const [leaseTenantsData, billingsData, rentalUnitsData] = await Promise.all([
		leaseIds.length > 0
			? db
					.select({
						leaseId: leaseTenants.leaseId,
						tenantId: tenants.id,
						tenantName: tenants.name,
						tenantEmail: tenants.email,
						tenantContactNumber: tenants.contactNumber,
						tenantCreatedAt: tenants.createdAt,
						tenantUpdatedAt: tenants.updatedAt,
						tenantAuthId: tenants.authId
					})
					.from(leaseTenants)
					.leftJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
					.where(inArray(leaseTenants.leaseId, leaseIds))
			: Promise.resolve([]),
		leaseIds.length > 0
			? db
					.select()
					.from(billings)
					.where(inArray(billings.leaseId, leaseIds))
			: Promise.resolve([]),
		db
			.select({
				id: rentalUnit.id,
				name: rentalUnit.name,
				number: rentalUnit.number,
				floorId: rentalUnit.floorId,
				propertyId: properties.id,
				propertyName: properties.name
			})
			.from(rentalUnit)
			.leftJoin(properties, eq(rentalUnit.propertyId, properties.id))
	]);

	const result = leasesData.map((lease) => ({
		...lease,
		lease_tenants: leaseTenantsData
			.filter((lt) => lt.leaseId === lease.id)
			.map((lt) => ({
				tenant: {
					id: lt.tenantId,
					name: lt.tenantName,
					email: lt.tenantEmail,
					contact_number: lt.tenantContactNumber,
					created_at: lt.tenantCreatedAt,
					updated_at: lt.tenantUpdatedAt,
					auth_id: lt.tenantAuthId
				}
			})),
		rental_unit: rentalUnitsData.find((u) => u.id === lease.rentalUnitId)
			? (() => {
					const unit = rentalUnitsData.find((u) => u.id === lease.rentalUnitId)!;
					return {
						id: unit.id,
						name: unit.name,
						number: unit.number,
						floor_id: unit.floorId,
						property: unit.propertyId
							? { id: unit.propertyId, name: unit.propertyName }
							: null
					};
				})()
			: null,
		billings: billingsData.filter((b) => b.leaseId === lease.id)
	}));

	return { leases: result, error: null };
}
