import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { leaseSchema, deleteLeaseSchema, leaseSchemaWithValidation } from './formSchema';
import { securityDepositSchema } from './securityDepositSchema';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	leases, rentalUnit, floors, properties, leaseTenants, tenants,
	billings, paymentAllocations, payments
} from '$lib/server/schema';
import { eq, and, desc, asc, isNull, inArray, gte, lte, sql, isNotNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) throw error(401, 'Unauthorized');
	const form = await superValidate(zod(leaseSchema));
	const deleteForm = await superValidate(zod(deleteLeaseSchema));
	return { form, deleteForm };
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
					startDate: leaseData.start_date!,
					endDate: endDate!,
					rentAmount: String(leaseData.rent_amount || 0),
					securityDeposit: String(0),
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
					rentAmount: String(rent_amount),
					securityDeposit: existingLease.securityDeposit,
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
						amount: String(rent.amount),
						paidAmount: String(0),
						balance: String(rent.amount),
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
						Number(existingBilling.amount) !== rent.amount ||
						existingBilling.dueDate !== normalizedDueDate
					) {
						const newBalance = Number(existingBilling.balance) - Number(existingBilling.amount) + rent.amount;
						await db
							.update(billings)
							.set({
								amount: String(rent.amount),
								dueDate: normalizedDueDate,
								balance: String(newBalance)
							})
							.where(eq(billings.id, existingBilling.id));
					}
					return;
				}

				// Case 3: Delete existing billing
				if (!rent.isActive && existingBilling) {
					if (Number(existingBilling.paidAmount) > 0) {
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
				.set({ status: status as 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING' | 'ARCHIVED' })
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
					amount: String(amount),
					paidAmount: String(0),
					balance: String(amount),
					status: 'PENDING',
					dueDate,
					billingDate,
					notes,
					penaltyAmount: String(0)
				});

				return { form, success: true, message: 'Security deposit billing created successfully' };
			} else if (action === 'update') {
				if (!billingId) {
					return fail(400, { form, message: 'Billing ID is required for update' });
				}

				await db
					.update(billings)
					.set({
						amount: String(amount),
						balance: String(amount),
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
