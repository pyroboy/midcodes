import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { updatePenaltySchema } from './formSchema';
import type { Actions, PageServerLoad } from './$types';
import type { PenaltyBilling } from './types';
import { db } from '$lib/server/db';
import { billings, leases, rentalUnit, floors, properties, leaseTenants, tenants } from '$lib/server/schema';
import { eq, gt, lt, and, or, desc, sql, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, depends }) => {
	const { user } = locals;
	if (!user) throw error(401, 'Unauthorized');

	// Set up dependencies for invalidation
	depends('app:penalties');

	// Return minimal data for instant navigation
	return {
		penaltyBillings: [],
		form: await superValidate(zod(updatePenaltySchema)),
		lazy: true,
		penaltyBillingsPromise: loadPenaltyBillingsData()
	};
};

async function loadPenaltyBillingsData() {
	try {
		const currentDate = new Date();
		const currentIso = currentDate.toISOString();
		const threeDaysFromNow = new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

		const penaltyBillings = await db
			.select()
			.from(billings)
			.where(
				or(
					gt(billings.penaltyAmount, 0),
					and(lt(billings.dueDate, currentIso), gt(billings.balance, 0)),
					and(gt(billings.dueDate, currentIso), lt(billings.dueDate, threeDaysFromNow))
				)
			)
			.orderBy(desc(billings.dueDate));

		const leaseIds = [...new Set(penaltyBillings.map((b: any) => b.leaseId).filter(Boolean))];

		if (leaseIds.length === 0) {
			return penaltyBillings as PenaltyBilling[];
		}

		const leasesData = await db
			.select({
				leaseId: leases.id,
				leaseName: leases.name,
				unitName: rentalUnit.name,
				unitNumber: rentalUnit.number,
				floorNumber: floors.floorNumber,
				floorWing: floors.wing,
				propertyName: properties.name
			})
			.from(leases)
			.leftJoin(rentalUnit, eq(leases.rentalUnitId, rentalUnit.id))
			.leftJoin(floors, eq(rentalUnit.floorId, floors.id))
			.leftJoin(properties, eq(rentalUnit.propertyId, properties.id))
			.where(inArray(leases.id, leaseIds));

		const leaseTenantsData = await db
			.select({
				leaseId: leaseTenants.leaseId,
				tenantId: tenants.id,
				tenantName: tenants.name,
				tenantEmail: tenants.email,
				tenantContactNumber: tenants.contactNumber
			})
			.from(leaseTenants)
			.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
			.where(inArray(leaseTenants.leaseId, leaseIds));

		const leasesMap = new Map(leasesData.map((l) => [l.leaseId, l]));
		const leaseTenantsMap = new Map<number, any[]>();
		for (const lt of leaseTenantsData) {
			if (!leaseTenantsMap.has(lt.leaseId)) leaseTenantsMap.set(lt.leaseId, []);
			leaseTenantsMap.get(lt.leaseId)!.push({
				tenants: {
					id: lt.tenantId,
					name: lt.tenantName,
					email: lt.tenantEmail,
					contact_number: lt.tenantContactNumber
				}
			});
		}

		const enriched = penaltyBillings.map((billing: any) => {
			const leaseData = leasesMap.get(billing.leaseId);
			return {
				...billing,
				lease: leaseData
					? {
							id: billing.leaseId,
							name: leaseData.leaseName,
							rental_unit: {
								name: leaseData.unitName,
								number: leaseData.unitNumber,
								floors: {
									floor_number: leaseData.floorNumber,
									wing: leaseData.floorWing
								},
								properties: {
									name: leaseData.propertyName
								}
							},
							lease_tenants: leaseTenantsMap.get(billing.leaseId) || []
						}
					: null
			};
		});

		return enriched as PenaltyBilling[];
	} catch (err) {
		console.error('Error in loadPenaltyBillingsData:', err);
		throw err;
	}
}

export const actions: Actions = {
	updatePenalty: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const form = await superValidate(request, zod(updatePenaltySchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const { id, penalty_amount, notes } = form.data;

			const currentBillingResult = await db
				.select()
				.from(billings)
				.where(eq(billings.id, id))
				.limit(1);

			const currentBilling = currentBillingResult[0];

			if (!currentBilling) {
				return fail(500, {
					form,
					message: 'Failed to fetch billing record'
				});
			}

			await db
				.update(billings)
				.set({
					penaltyAmount: penalty_amount,
					status: 'PENALIZED',
					notes: notes || currentBilling.notes,
					balance: currentBilling.balance - (currentBilling.penaltyAmount || 0) + penalty_amount,
					updatedAt: new Date()
				})
				.where(eq(billings.id, id));

			return { form };
		} catch (err) {
			console.error('Error in updatePenalty action:', err);
			return fail(500, {
				form,
				message: 'An unexpected error occurred'
			});
		}
	}
};
