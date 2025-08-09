import { fail, error, json } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { leaseSchema, deleteLeaseSchema, leaseSchemaWithValidation } from './formSchema';
import { securityDepositSchema } from './securityDepositSchema';
import type { Actions, PageServerLoad } from './$types';
import type { PostgrestError } from '@supabase/postgrest-js';
import { createPaymentSchedules } from './utils';
import { mapLeaseData, getLeaseData } from '$lib/utils/lease';
import type { LeaseResponse, Billing } from '$lib/types/lease';

interface PaymentAllocation {
	billingId: number;
	amount: number;
}

interface PaymentDetails {
	amount: number;
	method: 'CASH' | 'GCASH' | 'BANK_TRANSFER' | 'SECURITY_DEPOSIT';
	reference_number: string | null;
	paid_by: string;
	paid_at: string;
	notes: string | null;
	billing_ids: number[];
}

async function loadLeasesData(locals: any) {
	const { supabase } = locals;

	const { data: leasesData, error: fetchError } = await supabase
		.from('leases')
		.select(
			`
			*,
			rental_unit:rental_unit_id (*, floor:floors (*), property:properties (*)),
			lease_tenants:lease_tenants!lease_id (tenant:tenants (name, email, contact_number, profile_picture_url, deleted_at)),
			billings!billings_lease_id_fkey (
				id,
				type,
				amount,
				paid_amount,
				balance,
				status,
				due_date,
				billing_date,
				penalty_amount,
				notes
			)
		`
		)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (fetchError) {
		console.error('Error fetching leases:', fetchError);
		throw new Error('Failed to load leases');
	}

	// Fetch payment allocations and calculate penalties for all billings
	const allBillingIds = leasesData
		.flatMap((lease: any) => lease.billings.map((b: Billing) => b.id))
		.filter(Boolean);

	if (allBillingIds.length > 0) {
		const [allocationsResponse, ...penaltyResponses] = await Promise.all([
			supabase
				.from('payment_allocations')
				.select('*, payment:payments(*)')
				.in('billing_id', allBillingIds),
			...allBillingIds.map((id: any) => supabase.rpc('calculate_penalty', { p_billing_id: id }))
		]);

		const { data: allocationsData, error: allocationsError } = allocationsResponse;
		if (allocationsError) {
			console.error('Error fetching payment allocations:', allocationsError);
		}

		const allocationsMap = new Map<number, any[]>();
		if (allocationsData) {
			for (const allocation of allocationsData) {
				// Skip allocations from reverted payments
				if (allocation.payment && allocation.payment.reverted_at) {
					continue;
				}
				if (!allocationsMap.has(allocation.billing_id)) {
					allocationsMap.set(allocation.billing_id, []);
				}
				allocationsMap.get(allocation.billing_id)?.push(allocation);
			}
		}

		const penaltiesMap = new Map<number, number>();
		penaltyResponses.forEach((res, index) => {
			if (res.error) {
				console.error(`Error calculating penalty for billing ${allBillingIds[index]}:`, res.error);
			} else if (res.data > 0) {
				penaltiesMap.set(allBillingIds[index], res.data);
			}
		});

		// Attach allocations and penalties to each billing
		for (const lease of leasesData) {
			for (const billing of lease.billings) {
				billing.allocations = allocationsMap.get(billing.id) || [];
				billing.penalty = penaltiesMap.get(billing.id) || 0;
				if (billing.penalty > 0 && billing.status === 'PENDING') {
					billing.status = 'PENALIZED';
				}
			}
		}
	}

	const floors = await supabase.from('floors').select('*');
	const floorsMap = new Map<number, any>((floors.data || []).map((f: any) => [f.id, f]));

	// Filter out soft-deleted tenants from embedded lease_tenants before mapping
	for (const lease of leasesData) {
		if (Array.isArray(lease.lease_tenants)) {
			lease.lease_tenants = lease.lease_tenants.filter((lt: any) => !lt?.tenant?.deleted_at);
		}
	}

	return leasesData.map((lease: any) => mapLeaseData(lease, floorsMap));
}

async function loadTenantsData(locals: any) {
	const { supabase } = locals;
	const { data, error } = await supabase
		.from('tenants')
    .select('id, name, email, contact_number, profile_picture_url')
    .is('deleted_at', null)
    .order('name');

	if (error) {
		console.error('Error fetching tenants:', error);
		return [];
	}

	return data || [];
}

async function loadRentalUnitsData(locals: any) {
	const { supabase } = locals;
	const { data, error } = await supabase
		.from('rental_unit')
		.select(`*, property:properties!rental_unit_property_id_fkey(id, name)`);

	if (error) {
		console.error('Error fetching rental units:', error);
		return [];
	}

	return data || [];
}

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase }, depends }) => {
	const { user } = await safeGetSession();
	if (!user) throw error(401, 'Unauthorized');

	// Set up dependencies for invalidation
	depends('app:leases');
	depends('app:tenants');
	depends('app:rental-units');

	try {
		const form = await superValidate(zod(leaseSchema));
		const deleteForm = await superValidate(zod(deleteLeaseSchema));

		// Return minimal data for instant navigation
		return {
			form,
			deleteForm,
			// Start with empty arrays for instant rendering
			leases: [],
			tenants: [],
			rental_units: [],
			// Flag to indicate lazy loading
			lazy: true,
			// Return promises that resolve with the actual data
			leasesPromise: loadLeasesData({ supabase }),
			tenantsPromise: loadTenantsData({ supabase }),
			rentalUnitsPromise: loadRentalUnitsData({ supabase })
		};
	} catch (err) {
		console.error('Error in load function:', err);
		throw error(500, 'Internal server error');
	}
};

export const actions: Actions = {
	create: async ({ request, locals: { supabase, safeGetSession } }) => {
		console.log('🚀 Creating lease');
		const form = await superValidate(request, zod(leaseSchemaWithValidation));

		if (!form.valid) {
			console.error('L-1003 - ❌ Form validation failed:', form.errors);
			return fail(400, { form });
		}

		const { user } = await safeGetSession();
		if (!user) return fail(403, { form, message: ['Unauthorized'] });

		try {
			// Calculate end_date if not provided
			let endDate = form.data.end_date;
			if (!endDate && form.data.start_date && form.data.terms_month > 0) {
				const start = new Date(form.data.start_date);
				const end = new Date(start);
				end.setMonth(end.getMonth() + form.data.terms_month);
				endDate = end.toISOString().split('T')[0];
			}

			// Extract tenant IDs and prepare lease data
			const { tenantIds, ...leaseData } = form.data;

			// tenantIds is already transformed to an array by the schema
			const tenantIdsArray = tenantIds;

			const leaseName = leaseData.name || `Unit ${leaseData.rental_unit_id}`;

			// Start a transaction
			const { data: lease, error: leaseError } = await supabase
				.from('leases')
				.insert({
					rental_unit_id: leaseData.rental_unit_id,
					name: leaseName,
					start_date: leaseData.start_date,
					end_date: endDate,
					// Set rent amount from form data
					rent_amount: leaseData.rent_amount || 0,
					security_deposit: 0, // Default value since you don't use this field
					notes: leaseData.notes || null,
					created_by: user.id,
					terms_month: leaseData.terms_month,
					status: leaseData.status,
					created_at: new Date().toISOString()
				})
				.select()
				.single();

			if (leaseError) throw leaseError;

			// Create lease-tenant relationships
			const leaseTenants = tenantIdsArray.map((tenant_id: number) => ({
				lease_id: lease.id,
				tenant_id
			}));

			const { error: relationError } = await supabase.from('lease_tenants').insert(leaseTenants);

			if (relationError) {
				// Rollback lease creation if tenant relationship fails
				await supabase.from('leases').delete().eq('id', lease.id);
				throw relationError;
			}

			// Fetch the newly created lease with all relationships
			const { data: newLease, error: fetchError } = await supabase
				.from('leases')
				.select(
					`
				*,
				rental_unit:rental_unit_id ( *, floor:floors (*), property:properties (*) ),
				lease_tenants:lease_tenants!lease_id ( tenants ( name, email, contact_number ) ),
				billings!billings_lease_id_fkey ( * )
			`
				)
				.eq('id', lease.id)
				.single();

			if (fetchError) {
				console.error('Error fetching new lease data:', fetchError);
				throw new Error(fetchError.message);
			}

			const floors = await supabase.from('floors').select('*');
			const floorsMap = new Map((floors.data || []).map((f) => [f.id, f]));
			const mappedLease = mapLeaseData(newLease, floorsMap);

			return {
				form,
				lease: mappedLease
			};
		} catch (error) {
			console.error('Lease creation failed:', error);
			return fail(500, {
				message: 'Failed to create lease'
			});
		}
	},

	updateLease: async ({ request, locals: { supabase, safeGetSession } }) => {
		console.log('🔄 Updating lease via form action');
		const formData = await request.formData();

		const { user } = await safeGetSession();
		if (!user) return fail(403, { message: ['Unauthorized'] });

		try {
			// Extract form data
			const id = Number(formData.get('id'));
			const name = formData.get('name') as string;
			const start_date = formData.get('start_date') as string;
			const end_date = formData.get('end_date') as string;
			const terms_month = Number(formData.get('terms_month'));
			const status = formData.get('status') as any;
			const notes = formData.get('notes') as string;
			const rental_unit_id = Number(formData.get('rental_unit_id'));
			const rent_amount = Number(formData.get('rent_amount')) || 0;
			const tenantIds = formData.get('tenantIds') as string;

			if (!id || id <= 0) {
				return fail(400, { message: ['Valid lease ID is required'] });
			}

			// Get existing lease to preserve required fields
			const { data: existingLease, error: fetchError } = await supabase
				.from('leases')
				.select('*')
				.eq('id', id)
				.single();

			if (fetchError || !existingLease) {
				return fail(404, { message: ['Lease not found'] });
			}

			// Calculate end_date if not provided
			let calculatedEndDate = end_date;
			if (!calculatedEndDate && start_date && terms_month > 0) {
				const start = new Date(start_date);
				const end = new Date(start);
				end.setMonth(end.getMonth() + terms_month);
				calculatedEndDate = end.toISOString().split('T')[0];
			}

			// Update the lease
			const { data: updatedLease, error: leaseError } = await supabase
				.from('leases')
				.update({
					name: name.trim(),
					start_date,
					end_date: calculatedEndDate,
					terms_month,
					status,
					notes: notes?.trim() || null,
					rental_unit_id,
					// Update rent amount from form data
					rent_amount: rent_amount,
					security_deposit: existingLease.security_deposit,
					balance: existingLease.balance,
					updated_at: new Date().toISOString()
				})
				.eq('id', id)
				.select('*')
				.single();

			if (leaseError) {
				console.error('Supabase error updating lease:', leaseError);
				return fail(500, { message: ['Database error'] });
			}

			// Update tenant relationships
			if (tenantIds) {
				const tenantIdsArray = JSON.parse(tenantIds);

				if (tenantIdsArray && tenantIdsArray.length > 0) {
					// Delete existing relationships
					await supabase.from('lease_tenants').delete().eq('lease_id', id);

					// Create new relationships
					const leaseTenants = tenantIdsArray.map((tenant_id: number) => ({
						lease_id: id,
						tenant_id
					}));

					const { error: relationError } = await supabase
						.from('lease_tenants')
						.insert(leaseTenants);

					if (relationError) {
						console.error('Error creating tenant relationships:', relationError);
						return fail(500, { message: ['Failed to update tenant relationships'] });
					}
				}
			}

			return { success: true, lease: updatedLease };
		} catch (error) {
			console.error('Lease update failed:', error);
			return fail(500, { message: ['Failed to update lease'] });
		}
	},

	delete: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
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
			// Soft delete the lease (preserves all payment data)
			const { error: deleteError } = await supabase.rpc('soft_delete_lease', {
				p_lease_id: leaseId,
				p_deleted_by: user.id,
				p_reason: reason
			});

			if (deleteError) {
				console.error('Error soft deleting lease:', deleteError);
				throw new Error(deleteError.message);
			}

			return { success: true, deletedLeaseId: leaseId };
		} catch (error) {
			console.error('Soft delete failed:', error);
			return fail(500, {
				error: 'Failed to archive lease'
			});
		}
	},

	submitPayment: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const paymentDetailsJSON = formData.get('paymentDetails');

			if (!paymentDetailsJSON) {
				return fail(400, { error: 'Missing payment details' });
			}

			const paymentDetails: PaymentDetails = JSON.parse(paymentDetailsJSON as string);

			let data, rpcError;

			// Use different RPC function based on payment method
			if (paymentDetails.method === 'SECURITY_DEPOSIT') {
				const result = await supabase.rpc('create_security_deposit_payment', {
					p_amount: paymentDetails.amount,
					p_billing_ids: paymentDetails.billing_ids,
					p_paid_by: paymentDetails.paid_by,
					p_paid_at: paymentDetails.paid_at,
					p_reference_number: paymentDetails.reference_number,
					p_notes: paymentDetails.notes,
					p_created_by: user.id
				});
				data = result.data;
				rpcError = result.error;
			} else {
				const result = await supabase.rpc('create_payment', {
					p_amount: paymentDetails.amount,
					p_method: paymentDetails.method as any,
					p_billing_ids: paymentDetails.billing_ids,
					p_paid_by: paymentDetails.paid_by,
					p_paid_at: paymentDetails.paid_at,
					p_reference_number: paymentDetails.reference_number,
					p_notes: paymentDetails.notes,
					p_created_by: user.id
				});
				data = result.data;
				rpcError = result.error;
			}

			if (rpcError) {
				console.error('Error creating payment via RPC:', rpcError);
				return fail(500, { error: `Payment processing failed: ${rpcError.message}` });
			}

			return { success: true, payment: data };
		} catch (e) {
			const err = e as Error;
			console.error('Error processing payment submission:', err);
			if (err.message.includes('invalid input syntax for type json')) {
				return fail(400, { error: 'Invalid payment details format.' });
			}
			return fail(500, { error: `An unexpected error occurred: ${err.message}` });
		}
	},

	updateName: async ({ request, locals: { supabase } }) => {
		const data = await request.formData();
		const id = data.get('id');
		const name = data.get('name');

		if (!id || !name) {
			return {
				success: false,
				message: 'Missing required fields'
			};
		}

		const { error } = await supabase.from('leases').update({ name }).eq('id', id);

		if (error) {
			return {
				success: false,
				message: error.message
			};
		}

		return { success: true };
	},

	manageRentBillings: async ({ request, locals: { supabase, safeGetSession } }) => {
		type MonthlyRent = {
			month: number;
			isActive: boolean;
			amount: number;
			dueDate: string;
		};
		const { user } = await safeGetSession();
		if (!user) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const leaseId = formData.get('leaseId');
		const year = formData.get('year');
		const monthlyRentsRaw = formData.get('monthlyRents');

		if (!leaseId || !year || !monthlyRentsRaw) {
			return fail(400, { message: 'Missing required fields' });
		}

		const monthlyRents = JSON.parse(monthlyRentsRaw as string);

		console.log(
			'📥 Received monthly rents data:',
			monthlyRents.map((r: any) => ({
				month: r.month,
				isActive: r.isActive,
				amount: r.amount,
				dueDate: r.dueDate
			}))
		);

		try {
			// 1. Fetch existing rent billings for the year
			const { data: existingBillings, error: fetchError } = await supabase
				.from('billings')
				.select('*')
				.eq('lease_id', leaseId)
				.eq('type', 'RENT')
				.gte('billing_date', `${year}-01-01`)
				.lte('billing_date', `${year}-12-31`);

			if (fetchError) throw new Error(`Failed to fetch existing billings: ${fetchError.message}`);

			const existingBillingsMap = new Map(
				existingBillings.map((b) => [new Date(b.billing_date).getUTCMonth() + 1, b])
			);

			const operations = monthlyRents.map(async (rent: MonthlyRent) => {
				const existingBilling = existingBillingsMap.get(rent.month);

				// Use the actual due date provided by the user (no timezone conversion)
				const normalizedDueDate = rent.dueDate; // Use the date string directly

				console.log(`📅 Month ${rent.month}: Due date: ${rent.dueDate}`);

				// Case 1: Create new billing
				if (rent.isActive && !existingBilling) {
					return supabase.from('billings').insert({
						lease_id: leaseId,
						type: 'RENT',
						amount: rent.amount,
						paid_amount: 0,
						balance: rent.amount,
						status: 'PENDING',
						due_date: normalizedDueDate,
						billing_date: `${year}-${String(rent.month).padStart(2, '0')}-01`,
						notes: 'Monthly Rent'
					});
				}

				// Case 2: Update existing billing
				if (rent.isActive && existingBilling) {
					if (
						existingBilling.amount !== rent.amount ||
						existingBilling.due_date !== normalizedDueDate
					) {
						const newBalance = existingBilling.balance - existingBilling.amount + rent.amount;
						return supabase
							.from('billings')
							.update({
								amount: rent.amount,
								due_date: normalizedDueDate,
								balance: newBalance
							})
							.eq('id', existingBilling.id);
					}
				}

				// Case 3: Delete existing billing
				if (!rent.isActive && existingBilling) {
					if (existingBilling.paid_amount > 0) {
						throw new Error(`Cannot delete billing for month ${rent.month} as it has payments.`);
					}
					return supabase.from('billings').delete().eq('id', existingBilling.id);
				}

				return Promise.resolve({ error: null }); // No operation needed
			});

			const results = await Promise.all(operations);
			const errors = results.filter((r) => r.error).map((r) => r.error);

			if (errors.length > 0) {
				throw new Error(`Some operations failed: ${errors.map((e) => e.message).join(', ')}`);
			}

			return { success: true, message: 'Rent billings updated successfully.' };
		} catch (error) {
			return fail(500, {
				message: error instanceof Error ? error.message : 'An unexpected error occurred.'
			});
		}
	},

	updateStatus: async ({ request, locals: { supabase } }) => {
		console.log('🔄 Updating lease status');
		const formData = await request.formData();
		const id = formData.get('id');
		const status = formData.get('status');

		console.log('Update details:', { id, status });

		if (!id || !status) {
			return {
				success: false,
				message: 'Missing required fields'
			};
		}

		try {
			const { error: updateError } = await supabase.from('leases').update({ status }).eq('id', id);

			if (updateError) {
				console.error('Error updating lease status:', updateError);
				return fail(500, { message: updateError.message });
			}

			return {
				success: true,
				status: 200,
				data: { id, status }
			};
		} catch (error) {
			console.error('Error updating lease status:', error);
			return {
				success: false,
				status: 500,
				message: error instanceof Error ? error.message : 'Failed to update lease status'
			};
		}
	},

	manageSecurityDepositBillings: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { user } = await safeGetSession();
		if (!user) throw error(401, 'Unauthorized');

		// Validate form data using Superforms
		const form = await superValidate(request, zod(securityDepositSchema));

		if (!form.valid) {
			console.error('❌ Form validation failed:', form.errors);
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
				const { error: insertError } = await supabase.from('billings').insert({
					lease_id: leaseId,
					type: type as 'SECURITY_DEPOSIT',
					amount: amount,
					paid_amount: 0,
					balance: amount,
					status: 'PENDING',
					due_date: dueDate,
					billing_date: billingDate,
					notes: notes,
					penalty_amount: 0
				});

				if (insertError) {
					console.error('❌ Error creating security deposit billing:', insertError);
					return fail(500, { form, message: 'Failed to create security deposit billing' });
				}

				return { form, success: true, message: 'Security deposit billing created successfully' };
			} else if (action === 'update') {
				if (!billingId) {
					return fail(400, { form, message: 'Billing ID is required for update' });
				}

				const { error: updateError } = await supabase
					.from('billings')
					.update({
						amount: amount,
						balance: amount, // Reset balance when amount changes
						due_date: dueDate,
						billing_date: billingDate,
						notes: notes
					})
					.eq('id', billingId);

				if (updateError) {
					console.error('Error updating security deposit billing:', updateError);
					return fail(500, { form, message: 'Failed to update security deposit billing' });
				}

				return { form, success: true, message: 'Security deposit billing updated successfully' };
			} else if (action === 'delete') {
				if (!billingId) {
					return fail(400, { form, message: 'Billing ID is required for delete' });
				}

				// First, delete any payment allocations that reference this billing
				const { error: deleteAllocationsError } = await supabase
					.from('payment_allocations')
					.delete()
					.eq('billing_id', billingId);

				if (deleteAllocationsError) {
					console.error('Error deleting payment allocations:', deleteAllocationsError);
					return fail(500, { form, message: 'Failed to delete associated payment allocations' });
				}

				// Then delete the billing record
				const { error: deleteError } = await supabase.from('billings').delete().eq('id', billingId);

				if (deleteError) {
					console.error('Error deleting security deposit billing:', deleteError);
					return fail(500, { form, message: 'Failed to delete security deposit billing' });
				}

				return { form, success: true, message: 'Security deposit billing deleted successfully' };
			} else {
				return fail(400, { form, message: 'Invalid action' });
			}
		} catch (error) {
			console.error('Error managing security deposit billings:', error);
			return fail(500, { form, message: 'Failed to manage security deposit billings' });
		}
	}
};
