import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { leaseSchema, deleteLeaseSchema, leaseSchemaWithValidation } from './formSchema';
import { securityDepositSchema } from './securityDepositSchema';
import type { Actions, PageServerLoad } from './$types';
import { createPaymentSchedules } from './utils';
import { mapLeaseData, getLeaseData } from '$lib/utils/lease';
import type { LeaseResponse, Billing } from '$lib/types/lease';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';
import { db } from '$lib/server/db';
import {
	leases, rentalUnit, floors, properties, leaseTenants, tenants,
	billings, paymentAllocations, payments
} from '$lib/server/schema';
import { eq, and, desc, asc, isNull, inArray, gte, lte, sql, isNotNull } from 'drizzle-orm';

// Fast core lease data - essential info for initial render with caching
async function loadCoreLeasesData() {
	const cacheKey = cacheKeys.leasesCore();
	const cached = cache.get<any[]>(cacheKey);
	if (cached) {
		console.log('CACHE HIT: Returning cached core leases data');
		return cached;
	}

	console.log('CACHE MISS: Fetching core leases from database');

	// Fetch leases with relationships
	const leasesData = await db
		.select()
		.from(leases)
		.where(isNull(leases.deletedAt))
		.orderBy(desc(leases.createdAt));

	// Fetch rental units, floors, properties
	const rentalUnitsData = await db
		.select()
		.from(rentalUnit);
	const floorsData = await db.select().from(floors);
	const propertiesData = await db.select().from(properties);

	// Fetch lease tenants with tenant info (excluding soft-deleted)
	const leaseTenantsData = await db
		.select({
			leaseId: leaseTenants.leaseId,
			tenantName: tenants.name,
			tenantEmail: tenants.email,
			tenantContactNumber: tenants.contactNumber,
			tenantProfilePictureUrl: tenants.profilePictureUrl,
			tenantDeletedAt: tenants.deletedAt
		})
		.from(leaseTenants)
		.innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id));

	// Fetch billings for all leases
	const billingsData = await db
		.select({
			id: billings.id,
			leaseId: billings.leaseId,
			type: billings.type,
			amount: billings.amount,
			paidAmount: billings.paidAmount,
			balance: billings.balance,
			status: billings.status,
			dueDate: billings.dueDate,
			billingDate: billings.billingDate,
			penaltyAmount: billings.penaltyAmount,
			notes: billings.notes
		})
		.from(billings);

	// Build lookup maps
	const unitsMap = new Map(rentalUnitsData.map((u: any) => [u.id, u]));
	const floorsMap = new Map(floorsData.map((f: any) => [f.id, f]));
	const propertiesMap = new Map(propertiesData.map((p: any) => [p.id, p]));

	// Build lease-tenants map (filter soft-deleted)
	const leaseTenantsMap = new Map<number, any[]>();
	for (const lt of leaseTenantsData) {
		if (lt.tenantDeletedAt) continue; // Skip soft-deleted tenants
		if (!leaseTenantsMap.has(lt.leaseId)) leaseTenantsMap.set(lt.leaseId, []);
		leaseTenantsMap.get(lt.leaseId)!.push({
			tenant: {
				name: lt.tenantName,
				email: lt.tenantEmail,
				contact_number: lt.tenantContactNumber,
				profile_picture_url: lt.tenantProfilePictureUrl
			}
		});
	}

	// Build billings map by lease
	const billingsMap = new Map<number, any[]>();
	for (const b of billingsData) {
		if (!billingsMap.has(b.leaseId)) billingsMap.set(b.leaseId, []);
		billingsMap.get(b.leaseId)!.push({
			id: b.id,
			type: b.type,
			amount: b.amount,
			paid_amount: b.paidAmount,
			balance: b.balance,
			status: b.status,
			due_date: b.dueDate,
			billing_date: b.billingDate,
			penalty_amount: b.penaltyAmount,
			notes: b.notes
		});
	}

	// Build nested lease structures
	const mappedData = leasesData.map((lease: any) => {
		const unit = unitsMap.get(lease.rentalUnitId);
		const floor = unit ? floorsMap.get(unit.floorId) : null;
		const property = unit ? propertiesMap.get(unit.propertyId) : null;

		const leaseObj = {
			...lease,
			rental_unit: unit
				? {
						...unit,
						floor: floor || null,
						property: property || null
					}
				: null,
			lease_tenants: leaseTenantsMap.get(lease.id) || [],
			billings: billingsMap.get(lease.id) || []
		};

		return mapLeaseData(leaseObj, floorsMap);
	});

	cache.set(cacheKey, mappedData, CACHE_TTL.SHORT);
	console.log('Cached core leases data');

	return mappedData;
}

// Heavy financial data - payment allocations and penalties
async function loadLeasesFinancialData(leasesData: any[]) {
	const allBillingIds = leasesData
		.flatMap((lease: any) => lease.billings.map((b: Billing) => b.id))
		.filter(Boolean);

	if (allBillingIds.length === 0) {
		return leasesData;
	}

	// Batch fetch allocations and penalties in parallel
	const [allocationsData, penaltyData] = await Promise.all([
		db
			.select({
				id: paymentAllocations.id,
				billingId: paymentAllocations.billingId,
				paymentId: paymentAllocations.paymentId,
				amount: paymentAllocations.amount
			})
			.from(paymentAllocations)
			.where(inArray(paymentAllocations.billingId, allBillingIds)),

		// For batch penalty calculation, use raw SQL to call the RPC
		db.execute(sql`SELECT * FROM calculate_penalties_batch(${allBillingIds})`)
	]);

	// Fetch payments for allocations to filter reverted ones
	const paymentIds = [...new Set(allocationsData.map((a) => a.paymentId).filter(Boolean))];
	let paymentsMap = new Map<number, any>();
	if (paymentIds.length > 0) {
		const paymentsData = await db
			.select({ id: payments.id, revertedAt: payments.revertedAt })
			.from(payments)
			.where(inArray(payments.id, paymentIds));
		paymentsMap = new Map(paymentsData.map((p) => [p.id, p]));
	}

	const allocationsMap = new Map<number, any[]>();
	for (const allocation of allocationsData) {
		const payment = paymentsMap.get(allocation.paymentId);
		if (payment?.revertedAt) continue;
		if (!allocationsMap.has(allocation.billingId)) {
			allocationsMap.set(allocation.billingId, []);
		}
		allocationsMap.get(allocation.billingId)?.push(allocation);
	}

	// Process batch penalty results
	const penaltiesMap = new Map<number, number>();
	if (penaltyData?.rows) {
		for (const result of penaltyData.rows as any[]) {
			if (result.penalty_amount > 0) {
				penaltiesMap.set(result.billing_id, result.penalty_amount);
			}
		}
	}

	return leasesData.map((lease: any) => {
		const enhancedLease = { ...lease };
		enhancedLease.billings = lease.billings.map((billing: any) => {
			const penalty = penaltiesMap.get(billing.id) || 0;
			return {
				...billing,
				allocations: allocationsMap.get(billing.id) || [],
				penalty: penalty,
				status:
					penalty > 0 && billing.status === 'PENDING' ? 'PENALIZED' : billing.status
			};
		});
		return enhancedLease;
	});
}

async function loadTenantsData() {
	const cacheKey = cacheKeys.tenants();
	const cached = cache.get<any[]>(cacheKey);
	if (cached) {
		console.log('CACHE HIT: Returning cached tenants data (leases route)');
		return cached;
	}

	console.log('CACHE MISS: Fetching tenants from database (leases route)');
	const data = await db
		.select({
			id: tenants.id,
			name: tenants.name,
			email: tenants.email,
			contactNumber: tenants.contactNumber,
			profilePictureUrl: tenants.profilePictureUrl
		})
		.from(tenants)
		.where(isNull(tenants.deletedAt))
		.orderBy(asc(tenants.name));

	// Map to snake_case for compatibility
	const mapped = data.map((t) => ({
		id: t.id,
		name: t.name,
		email: t.email,
		contact_number: t.contactNumber,
		profile_picture_url: t.profilePictureUrl
	}));

	cache.set(cacheKey, mapped, CACHE_TTL.MEDIUM);
	return mapped;
}

async function loadRentalUnitsData() {
	const cacheKey = cacheKeys.rentalUnits();
	const cached = cache.get<any[]>(cacheKey);
	if (cached) {
		console.log('CACHE HIT: Returning cached rental units data (leases route)');
		return cached;
	}

	console.log('CACHE MISS: Fetching rental units from database (leases route)');
	const data = await db
		.select({
			id: rentalUnit.id,
			name: rentalUnit.name,
			number: rentalUnit.number,
			type: rentalUnit.type,
			baseRate: rentalUnit.baseRate,
			propertyId: rentalUnit.propertyId,
			floorId: rentalUnit.floorId,
			propertyName: properties.name,
			propertyDbId: properties.id
		})
		.from(rentalUnit)
		.leftJoin(properties, eq(rentalUnit.propertyId, properties.id));

	const mapped = data.map((u) => ({
		...u,
		property: u.propertyDbId ? { id: u.propertyDbId, name: u.propertyName } : null
	}));

	cache.set(cacheKey, mapped, CACHE_TTL.MEDIUM);
	return mapped;
}

export const load: PageServerLoad = async ({ locals, depends }) => {
	const { user } = locals;
	if (!user) throw error(401, 'Unauthorized');

	depends('app:leases');
	depends('app:tenants');
	depends('app:rental-units');

	try {
		const form = await superValidate(zod(leaseSchema));
		const deleteForm = await superValidate(zod(deleteLeaseSchema));

		async function loadFinancialDataAsync() {
			const coreLeases = await loadCoreLeasesData();
			return await loadLeasesFinancialData(coreLeases);
		}

		return {
			form,
			deleteForm,
			leases: [],
			tenants: [],
			rental_units: [],
			lazy: true,
			coreLeasesPromise: loadCoreLeasesData(),
			tenantsPromise: loadTenantsData(),
			rentalUnitsPromise: loadRentalUnitsData(),
			financialLeasesPromise: loadFinancialDataAsync(),
			cacheStatus: {
				leasesCached: !!cache.get(cacheKeys.leasesCore()),
				tenantsCached: !!cache.get(cacheKeys.tenants()),
				rentalUnitsCached: !!cache.get(cacheKeys.rentalUnits())
			}
		};
	} catch (err) {
		console.error('Error in load function:', err);
		throw error(500, 'Internal server error');
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		console.log('Creating lease');
		const form = await superValidate(request, zod(leaseSchemaWithValidation));

		if (!form.valid) {
			console.error('L-1003 - Form validation failed:', form.errors);
			return fail(400, { form });
		}

		const { user } = locals;
		if (!user) return fail(403, { form, message: ['Unauthorized'] });

		try {
			let endDate = form.data.end_date;
			if (!endDate && form.data.start_date && form.data.terms_month > 0) {
				const start = new Date(form.data.start_date);
				const end = new Date(start);
				end.setMonth(end.getMonth() + form.data.terms_month);
				endDate = end.toISOString().split('T')[0];
			}

			const { tenantIds, ...leaseData } = form.data;
			const tenantIdsArray = tenantIds;
			const leaseName = leaseData.name || `Unit ${leaseData.rental_unit_id}`;

			const leaseResult = await db
				.insert(leases)
				.values({
					rentalUnitId: leaseData.rental_unit_id,
					name: leaseName,
					startDate: leaseData.start_date,
					endDate: endDate,
					rentAmount: leaseData.rent_amount || 0,
					securityDeposit: 0,
					notes: leaseData.notes || null,
					createdBy: user.id,
					termsMonth: leaseData.terms_month,
					status: leaseData.status,
					createdAt: new Date()
				})
				.returning();

			const lease = leaseResult[0];
			if (!lease) throw new Error('Failed to create lease');

			// Create lease-tenant relationships
			const leaseTenantsToInsert = tenantIdsArray.map((tenant_id: number) => ({
				leaseId: lease.id,
				tenantId: tenant_id
			}));

			try {
				await db.insert(leaseTenants).values(leaseTenantsToInsert);
			} catch (relationError) {
				// Rollback lease creation
				await db.delete(leases).where(eq(leases.id, lease.id));
				throw relationError;
			}

			cache.deletePattern(/^leases:/);
			console.log('Invalidated leases cache');

			return { form, lease };
		} catch (err) {
			console.error('Lease creation failed:', err);
			return fail(500, { message: 'Failed to create lease' });
		}
	},

	updateLease: async ({ request, locals }) => {
		console.log('Updating lease via form action');
		const formData = await request.formData();

		const { user } = locals;
		if (!user) return fail(403, { message: ['Unauthorized'] });

		try {
			const id = Number(formData.get('id'));
			const name = formData.get('name') as string;
			const start_date = formData.get('start_date') as string;
			const end_date = formData.get('end_date') as string;
			const terms_month = Number(formData.get('terms_month'));
			const status = formData.get('status') as any;
			const notes = formData.get('notes') as string;
			const rental_unit_id = Number(formData.get('rental_unit_id'));
			const rent_amount = Number(formData.get('rent_amount')) || 0;
			const tenantIdsStr = formData.get('tenantIds') as string;

			if (!id || id <= 0) {
				return fail(400, { message: ['Valid lease ID is required'] });
			}

			// Get existing lease
			const existingResult = await db
				.select()
				.from(leases)
				.where(eq(leases.id, id))
				.limit(1);

			const existingLease = existingResult[0];
			if (!existingLease) {
				return fail(404, { message: ['Lease not found'] });
			}

			let calculatedEndDate = end_date;
			if (!calculatedEndDate && start_date && terms_month > 0) {
				const start = new Date(start_date);
				const end = new Date(start);
				end.setMonth(end.getMonth() + terms_month);
				calculatedEndDate = end.toISOString().split('T')[0];
			}

			const updatedResult = await db
				.update(leases)
				.set({
					name: name.trim(),
					startDate: start_date,
					endDate: calculatedEndDate,
					termsMonth: terms_month,
					status,
					notes: notes?.trim() || null,
					rentalUnitId: rental_unit_id,
					rentAmount: rent_amount,
					securityDeposit: existingLease.securityDeposit,
					balance: existingLease.balance,
					updatedAt: new Date()
				})
				.where(eq(leases.id, id))
				.returning();

			// Update tenant relationships
			if (tenantIdsStr) {
				const tenantIdsArray = JSON.parse(tenantIdsStr);

				if (tenantIdsArray && tenantIdsArray.length > 0) {
					await db.delete(leaseTenants).where(eq(leaseTenants.leaseId, id));

					const newRelationships = tenantIdsArray.map((tenant_id: number) => ({
						leaseId: id,
						tenantId: tenant_id
					}));

					await db.insert(leaseTenants).values(newRelationships);
				}
			}

			cache.deletePattern(/^leases:/);
			console.log('Invalidated leases cache');

			return { success: true, lease: updatedResult[0] };
		} catch (err) {
			console.error('Lease update failed:', err);
			return fail(500, { message: ['Failed to update lease'] });
		}
	},

	delete: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const leaseId = formData.get('id');
		const reason = (formData.get('reason') as string) || 'User initiated deletion';

		if (!leaseId) {
			return fail(400, { error: 'Lease ID is required' });
		}

		try {
			// Soft delete the lease using RPC
			await db.execute(
				sql`SELECT soft_delete_lease(${leaseId}::int, ${user.id}::text, ${reason}::text)`
			);

			cache.deletePattern(/^leases:/);
			console.log('Invalidated leases cache');

			return { success: true, deletedLeaseId: leaseId };
		} catch (err) {
			console.error('Soft delete failed:', err);
			return fail(500, { error: 'Failed to archive lease' });
		}
	},

	submitPayment: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const paymentDetailsJSON = formData.get('paymentDetails');

			if (!paymentDetailsJSON) {
				return fail(400, { error: 'Missing payment details' });
			}

			const paymentDetails = JSON.parse(paymentDetailsJSON as string);

			let result;

			// Use different RPC function based on payment method
			if (paymentDetails.method === 'SECURITY_DEPOSIT') {
				result = await db.execute(
					sql`SELECT create_security_deposit_payment(
						${paymentDetails.amount}::numeric,
						${paymentDetails.billing_ids}::int[],
						${paymentDetails.paid_by}::text,
						${paymentDetails.paid_at}::timestamptz,
						${paymentDetails.reference_number}::text,
						${paymentDetails.notes}::text,
						${user.id}::text
					)`
				);
			} else {
				result = await db.execute(
					sql`SELECT create_payment(
						${paymentDetails.amount}::numeric,
						${paymentDetails.method}::text,
						${paymentDetails.billing_ids}::int[],
						${paymentDetails.paid_by}::text,
						${paymentDetails.paid_at}::timestamptz,
						${paymentDetails.reference_number}::text,
						${paymentDetails.notes}::text,
						${user.id}::text
					)`
				);
			}

			return { success: true, payment: result };
		} catch (e) {
			const err = e as Error;
			console.error('Error processing payment submission:', err);
			if (err.message.includes('invalid input syntax for type json')) {
				return fail(400, { error: 'Invalid payment details format.' });
			}
			return fail(500, { error: `An unexpected error occurred: ${err.message}` });
		}
	},

	updateName: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		const name = data.get('name');

		if (!id || !name) {
			return { success: false, message: 'Missing required fields' };
		}

		try {
			await db
				.update(leases)
				.set({ name: name as string })
				.where(eq(leases.id, Number(id)));
		} catch (err: any) {
			return { success: false, message: err.message };
		}

		return { success: true };
	},

	manageRentBillings: async ({ request, locals }) => {
		type MonthlyRent = {
			month: number;
			isActive: boolean;
			amount: number;
			dueDate: string;
		};
		const { user } = locals;
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const leaseId = formData.get('leaseId');
		const year = formData.get('year');
		const monthlyRentsRaw = formData.get('monthlyRents');

		if (!leaseId || !year || !monthlyRentsRaw) {
			return fail(400, { message: 'Missing required fields' });
		}

		const monthlyRents = JSON.parse(monthlyRentsRaw as string);

		try {
			// Fetch existing rent billings for the year
			const existingBillings = await db
				.select()
				.from(billings)
				.where(
					and(
						eq(billings.leaseId, Number(leaseId)),
						eq(billings.type, 'RENT'),
						gte(billings.billingDate, `${year}-01-01`),
						lte(billings.billingDate, `${year}-12-31`)
					)
				);

			const existingBillingsMap = new Map(
				existingBillings.map((b: any) => [new Date(b.billingDate).getUTCMonth() + 1, b])
			);

			const operations = monthlyRents.map(async (rent: MonthlyRent) => {
				const existingBilling = existingBillingsMap.get(rent.month);
				const normalizedDueDate = rent.dueDate;

				// Case 1: Create new billing
				if (rent.isActive && !existingBilling) {
					await db.insert(billings).values({
						leaseId: Number(leaseId),
						type: 'RENT',
						amount: rent.amount,
						paidAmount: 0,
						balance: rent.amount,
						status: 'PENDING',
						dueDate: normalizedDueDate,
						billingDate: `${year}-${String(rent.month).padStart(2, '0')}-01`,
						notes: 'Monthly Rent'
					});
					return;
				}

				// Case 2: Update existing billing
				if (rent.isActive && existingBilling) {
					if (
						existingBilling.amount !== rent.amount ||
						existingBilling.dueDate !== normalizedDueDate
					) {
						const newBalance = existingBilling.balance - existingBilling.amount + rent.amount;
						await db
							.update(billings)
							.set({
								amount: rent.amount,
								dueDate: normalizedDueDate,
								balance: newBalance
							})
							.where(eq(billings.id, existingBilling.id));
					}
					return;
				}

				// Case 3: Delete existing billing
				if (!rent.isActive && existingBilling) {
					if (existingBilling.paidAmount > 0) {
						throw new Error(`Cannot delete billing for month ${rent.month} as it has payments.`);
					}
					await db.delete(billings).where(eq(billings.id, existingBilling.id));
					return;
				}
			});

			await Promise.all(operations);

			return { success: true, message: 'Rent billings updated successfully.' };
		} catch (err) {
			return fail(500, {
				message: err instanceof Error ? err.message : 'An unexpected error occurred.'
			});
		}
	},

	updateStatus: async ({ request }) => {
		console.log('Updating lease status');
		const formData = await request.formData();
		const id = formData.get('id');
		const status = formData.get('status');

		if (!id || !status) {
			return { success: false, message: 'Missing required fields' };
		}

		try {
			await db
				.update(leases)
				.set({ status: status as string })
				.where(eq(leases.id, Number(id)));

			return { success: true, status: 200, data: { id, status } };
		} catch (err) {
			console.error('Error updating lease status:', err);
			return {
				success: false,
				status: 500,
				message: err instanceof Error ? err.message : 'Failed to update lease status'
			};
		}
	},

	manageSecurityDepositBillings: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) throw error(401, 'Unauthorized');

		const form = await superValidate(request, zod(securityDepositSchema));

		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		try {
			const {
				action,
				lease_id: leaseId,
				billing_id: billingId,
				type,
				amount,
				due_date: dueDate,
				billing_date: billingDate,
				notes
			} = form.data;

			if (action === 'create') {
				await db.insert(billings).values({
					leaseId,
					type: type as 'SECURITY_DEPOSIT',
					amount,
					paidAmount: 0,
					balance: amount,
					status: 'PENDING',
					dueDate,
					billingDate,
					notes,
					penaltyAmount: 0
				});

				return { form, success: true, message: 'Security deposit billing created successfully' };
			} else if (action === 'update') {
				if (!billingId) {
					return fail(400, { form, message: 'Billing ID is required for update' });
				}

				await db
					.update(billings)
					.set({
						amount,
						balance: amount,
						dueDate,
						billingDate,
						notes
					})
					.where(eq(billings.id, billingId));

				return { form, success: true, message: 'Security deposit billing updated successfully' };
			} else if (action === 'delete') {
				if (!billingId) {
					return fail(400, { form, message: 'Billing ID is required for delete' });
				}

				// Delete payment allocations first
				await db
					.delete(paymentAllocations)
					.where(eq(paymentAllocations.billingId, billingId));

				// Then delete the billing
				await db.delete(billings).where(eq(billings.id, billingId));

				return { form, success: true, message: 'Security deposit billing deleted successfully' };
			} else {
				return fail(400, { form, message: 'Invalid action' });
			}
		} catch (err) {
			console.error('Error managing security deposit billings:', err);
			return fail(500, { form, message: 'Failed to manage security deposit billings' });
		}
	}
};
