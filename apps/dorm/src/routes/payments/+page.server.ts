import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { paymentSchema, type UserRole } from './formSchema';
import { transactionSchema } from '../transactions/schema';
import { supabase } from '$lib/supabaseClient';
import { cache, CACHE_TTL, cacheKeys } from '$lib/services/cache';
import {
	calculatePenalty,
	getPenaltyConfig,
	createPenaltyBilling,
	updateBillingStatus,
	determinePaymentStatus,
	getUTCTimestamp,
	logAuditEvent
} from './utils';

// Separate async function for loading payments data with caching
async function loadPaymentsData(locals: any) {
	const session = await locals.safeGetSession();
	if (!session) {
		return { payments: [], billings: [], userRole: 'user', isAdminLevel: false, isAccountant: false, isUtility: false, isFrontdesk: false, isResident: false };
	}

	// Check cache first
	const cacheKey = cacheKeys.payments();
	const cached = cache.get<any>(cacheKey);
	if (cached) {
		console.log('🎯 CACHE HIT: Returning cached payments data');
		return cached;
	}

	console.log('💾 CACHE MISS: Fetching payments from database');

	const [{ data: userRole }, { data: payments }, { data: unpaidBillings }, { data: allBillings }] = await Promise.all([
		supabase.from('profiles').select('role').eq('id', session.user.id).single(),

		supabase
			.from('payments')
			.select('*')
			.order('paid_at', { ascending: false }),

		// Billings for payment creation (only unpaid ones)
		supabase
			.from('billings')
			.select(
				`
        id,
        type,
        utility_type,
        amount,
        paid_amount,
        balance,
        status,
        due_date,
        lease:leases(
          id,
          name,
          rental_unit:rental_unit(
            id,
            rental_unit_number,
            floor:floors(
              floor_number,
              wing,
              property:properties(
                name
              )
            )
          )
        )
      `
			)
			.in('status', ['PENDING', 'PARTIAL', 'OVERDUE'])
			.order('due_date'),

		// All billings for payment display (including paid ones)
		supabase
			.from('billings')
			.select(
				`
        id,
        type,
        utility_type,
        amount,
        paid_amount,
        balance,
        status,
        due_date,
        lease:leases(
          id,
          name,
          rental_unit:rental_unit(
            id,
            rental_unit_number,
            floor:floors(
              floor_number,
              wing,
              property:properties(
                name
              )
            )
          )
        )
      `
			)
			.order('due_date')
	]);

	// OPTIMIZATION: Create billing lookup map for O(1) access instead of O(n) find
	const billingsMap = new Map<number, any>();
	if (allBillings) {
		for (const billing of allBillings) {
			billingsMap.set(billing.id, billing);
		}
	}

	// Manually join payment data with billing/lease information
	const enrichedPayments = payments?.map((payment) => {
		// Use map lookup instead of array.find for better performance
		const primaryBilling = payment.billing_ids && payment.billing_ids.length > 0
			? billingsMap.get(payment.billing_ids[0])
			: null;

		return {
			...payment,
			billing: primaryBilling
		};
	}) || [];

	const isAdminLevel = ['super_admin', 'property_admin'].includes(userRole?.role || '');
	const isAccountant = userRole?.role === 'property_accountant';
	const isUtility = userRole?.role === 'property_utility';
	const isFrontdesk = userRole?.role === 'property_frontdesk';
	const isResident = userRole?.role === 'property_resident';

	const result = {
		payments: enrichedPayments,
		billings: unpaidBillings,
		userRole: userRole?.role || 'user',
		isAdminLevel,
		isAccountant,
		isUtility,
		isFrontdesk,
		isResident
	};

	// Cache the result
	cache.set(cacheKey, result, CACHE_TTL.SHORT);
	console.log('✅ Cached payments data');

	return result;
}

export const load = async ({ locals, depends }) => {
	// Set up cache invalidation dependency
	depends('app:payments');

	const session = await locals.safeGetSession();
	if (!session) {
		return fail(401, { message: 'Unauthorized' });
	}

	const form = await superValidate(zod(paymentSchema));
	const transactionForm = await superValidate(zod(transactionSchema));

	// Return minimal data for instant navigation with lazy loading
	return {
		form,
		transactionForm,
		payments: [],
		billings: [],
		userRole: 'user',
		isAdminLevel: false,
		isAccountant: false,
		isUtility: false,
		isFrontdesk: false,
		isResident: false,
		lazy: true,
		paymentsPromise: loadPaymentsData(locals)
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const session = await locals.safeGetSession();
		if (!session) {
			return fail(401, {
				form: null,
				error: 'You must be logged in to create payments'
			});
		}

		const form = await superValidate(request, zod(paymentSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Invalid form data. Please check your input.'
			});
		}

		// Get billing details first
		const { data: billing, error: billingError } = await supabase
			.from('billings')
			.select(
				'*, lease:leases(name, rental_unit:rental_unit(rental_unit_number, floor:floors(floor_number, wing)))'
			)
			.eq('id', form.data.billing_id)
			.single();

		if (billingError || !billing) {
			console.error('Failed to fetch billing:', billingError);
			return fail(404, {
				form,
				error: `Billing #${form.data.billing_id} not found or has been deleted`
			});
		}

		const { data: userRole } = await supabase
			.from('profiles')
			.select('role, name')
			.eq('id', session.user.id)
			.single();

		const canCreate = [
			'super_admin',
			'property_admin',
			'property_accountant',
			'property_frontdesk'
		] as UserRole[];
		if (!canCreate.includes(userRole?.role as UserRole)) {
			await logAuditEvent(supabase, {
				action: 'payment_create_denied',
				user_id: session.user.id,
				user_role: userRole?.role,
				details: {
					billing_id: billing.id,
					amount: form.data.amount,
					method: form.data.method
				}
			});
			return fail(403, {
				form,
				error: 'You do not have permission to create payments'
			});
		}

		if (!['PENDING', 'PARTIAL', 'OVERDUE'].includes(billing.status)) {
			await logAuditEvent(supabase, {
				action: 'payment_create_invalid_status',
				user_id: session.user.id,
				user_role: userRole?.role,
				details: {
					billing_id: billing.id,
					billing_status: billing.status,
					amount: form.data.amount
				}
			});
			return fail(400, {
				form,
				error: `Cannot process payment for billing in ${billing.status} status. Only PENDING, PARTIAL, or OVERDUE billings can receive payments.`
			});
		}

		if (form.data.amount > billing.balance) {
			await logAuditEvent(supabase, {
				action: 'payment_create_amount_exceeded',
				user_id: session.user.id,
				user_role: userRole?.role,
				details: {
					billing_id: billing.id,
					attempted_amount: form.data.amount,
					billing_balance: billing.balance
				}
			});
			return fail(400, {
				form,
				error: `Payment amount (${form.data.amount}) exceeds billing balance (${billing.balance}). Please enter an amount less than or equal to the balance.`
			});
		}

		// Check for late payment and calculate penalty
		const penaltyConfig = await getPenaltyConfig(supabase, billing.type);
		let penaltyAmount = 0;

		if (penaltyConfig && new Date(form.data.paid_at) > new Date(billing.due_date)) {
			penaltyAmount = await calculatePenalty(billing, penaltyConfig, new Date(form.data.paid_at));
		}

		let createdPayment;
		try {
			const timestamp = getUTCTimestamp();
			const { data, error: paymentError } = await supabase
				.from('payments')
				.insert({
					...form.data,
					created_by: session.user.id,
					updated_by: session.user.id,
					created_at: timestamp,
					updated_at: timestamp
				})
				.select(
					`
          *,
          billing:billings!inner(
            id,
            type,
            utility_type,
            lease:leases(
              name,
              rental_unit:rental_unit(
                rental_unit_number,
                floor:floors(
                  floor_number,
                  wing
                )
              )
            )
          )
        `
				)
				.single();

			if (paymentError) {
				console.error('Failed to create payment:', paymentError);
				await logAuditEvent(supabase, {
					action: 'payment_create_failed',
					user_id: session.user.id,
					user_role: userRole?.role,
					details: {
						billing_id: billing.id,
						error: paymentError.message,
						amount: form.data.amount
					}
				});
				throw new Error('Failed to create payment record');
			}

			createdPayment = data;

			// Log successful payment creation
			await logAuditEvent(supabase, {
				action: 'payment_created',
				user_id: session.user.id,
				user_role: userRole?.role,
				details: {
					payment_id: createdPayment.id,
					billing_id: billing.id,
					amount: form.data.amount,
					method: form.data.method,
					location: `${billing.lease.rental_unit.floor.wing} - Floor ${billing.lease.rental_unit.floor.floor_number} - Rental_unit ${billing.lease.rental_unit.rental_unit_number}`
				}
			});

			// Update billing status
			await updateBillingStatus(supabase, billing, billing.paid_amount + form.data.amount);

			// Create penalty billing if needed
			if (penaltyAmount > 0) {
				await createPenaltyBilling(supabase, billing, penaltyAmount);
			}

			// Invalidate cache
			cache.delete(cacheKeys.payments());
			console.log('🗑️ Invalidated payments cache');

			return {
				form,
				success: true,
				message: `Payment of ${form.data.amount} successfully processed for ${billing.lease.name}`
			};
		} catch (error) {
			console.error('Transaction failed:', error);

			// Attempt to rollback payment if it was created
			try {
				if (createdPayment?.id) {
					await supabase.from('payments').delete().eq('id', createdPayment.id);
				}
			} catch (rollbackError) {
				console.error('Failed to rollback payment:', rollbackError);
			}

			return fail(500, {
				form,
				error:
					'Failed to process payment. Please try again or contact support if the issue persists.'
			});
		}
	},

	update: async ({ request, locals }) => {
		const session = await locals.safeGetSession();
		if (!session) {
			return fail(401, {
				form: null,
				error: 'You must be logged in to update payments'
			});
		}

		const form = await superValidate(request, zod(paymentSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Invalid form data. Please check your input.'
			});
		}

		const { data: userRole } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', session.user.id)
			.single();

		const canUpdate = ['super_admin', 'property_admin', 'property_accountant'] as UserRole[];
		if (!canUpdate.includes(userRole?.role as UserRole)) {
			return fail(403, {
				form,
				error: 'You do not have permission to update payments'
			});
		}

		// Get existing payment
		const { data: existingPayment, error: existingError } = await supabase
			.from('payments')
			.select('*')
			.eq('id', form.data.id)
			.single();

		if (existingError || !existingPayment) {
			console.error('Failed to fetch existing payment:', existingError);
			return fail(404, {
				form,
				error: 'Payment not found or has been deleted'
			});
		}

		// Update payment with tracking fields
		const { error: updateError } = await supabase
			.from('payments')
			.update({
				...form.data,
				updated_by: session.user.id,
				updated_at: getUTCTimestamp()
			})
			.eq('id', form.data.id);

		if (updateError) {
			console.error('Failed to update payment:', updateError);
			return fail(500, {
				form,
				error: 'Failed to update payment record'
			});
		}

		// Invalidate cache
		cache.delete(cacheKeys.payments());
		console.log('🗑️ Invalidated payments cache');

		return { form };
		},

		revert: async ({ request, locals }) => {
			const session = await locals.safeGetSession();
			if (!session) {
				return fail(401, {
					form: null,
					error: 'You must be logged in to revert payments'
				});
			}

			const formData = await request.formData();
			const paymentIdRaw = formData.get('payment_id');
			const reason = (formData.get('reason') as string) || null;

			if (!paymentIdRaw) {
				return fail(400, { error: 'payment_id is required' });
			}

			const paymentId = Number(paymentIdRaw);
			if (!Number.isFinite(paymentId) || paymentId <= 0) {
				return fail(400, { error: 'Invalid payment_id' });
			}

			// Authorization: mirror update permissions
			const { data: userRole } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', session.user.id)
				.single();

			const canRevert = ['super_admin', 'property_admin', 'property_accountant'] as UserRole[];
			if (!canRevert.includes(userRole?.role as UserRole)) {
				return fail(403, { error: 'You do not have permission to revert payments' });
			}

			// Ensure payment exists and not already reverted
			const { data: payment, error: fetchError } = await supabase
				.from('payments')
				.select('id, reverted_at')
				.eq('id', paymentId)
				.single();

			if (fetchError || !payment) {
				return fail(404, { error: 'Payment not found' });
			}

			if (payment.reverted_at) {
				return fail(400, { error: 'Payment is already reverted' });
			}

			// Call DB function to revert
			const { data: revertResult, error: revertError } = await supabase.rpc('revert_payment', {
				p_payment_id: paymentId,
				p_reason: reason,
				p_performed_by: session.user.id
			});

			if (revertError) {
				console.error('Failed to revert payment:', revertError);
				return fail(500, { error: 'Failed to revert payment' });
			}

			// Invalidate cache
			cache.delete(cacheKeys.payments());
			console.log('🗑️ Invalidated payments cache');

			return { success: true, result: revertResult };
		},

	// Action to handle payment updates via TransactionFormModal
	upsert: async ({ request, locals }) => {
		console.log('🔄 SERVER ACTION: Upsert action called');
		
		const session = await locals.safeGetSession();
		if (!session) {
			console.error('❌ SERVER ACTION: No session found');
			return fail(401, {
				form: null,
				error: 'You must be logged in to update payments'
			});
		}

		console.log('📋 SERVER ACTION: Validating form data...');
		const form = await superValidate(request, zod(transactionSchema));
		console.log('📋 SERVER ACTION: Form validation result:', { valid: form.valid, data: form.data, errors: form.errors });
		
		if (!form.valid) {
			console.error('❌ SERVER ACTION: Form validation failed:', form.errors);
			return fail(400, {
				form,
				error: 'Invalid form data. Please check your input.'
			});
		}

		const { data: userRole } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', session.user.id)
			.single();

		const canUpdate = ['super_admin', 'property_admin', 'property_accountant'] as UserRole[];
		if (!canUpdate.includes(userRole?.role as UserRole)) {
			return fail(403, {
				form,
				error: 'You do not have permission to update payments'
			});
		}

		// Convert transaction data back to payment format
		const paymentData = {
			id: form.data.id,
			billing_ids: form.data.billing_ids || [], // Preserve all billing IDs
			amount: form.data.amount,
			method: mapTransactionMethodToPayment(form.data.method),
			reference_number: form.data.reference_number,
			paid_by: form.data.paid_by,
			paid_at: form.data.paid_at,
			notes: form.data.notes,
			receipt_url: form.data.receipt_url
		};
		
		console.log('🔄 SERVER ACTION: Converted payment data for update:', paymentData);

		// Update payment with tracking fields
		const updatePayload = {
			...paymentData,
			updated_by: session.user.id,
			updated_at: getUTCTimestamp()
		};
		
		console.log('📤 DATABASE UPDATE: Updating payment with payload:', updatePayload);
		
		const { data: updateResult, error: updateError } = await supabase
			.from('payments')
			.update(updatePayload)
			.eq('id', form.data.id)
			.select('*'); // Return the updated record

		if (updateError) {
			console.error('❌ DATABASE UPDATE: Failed to update payment:', updateError);
			return fail(500, {
				form,
				error: 'Failed to update payment record'
			});
		}

		console.log('✅ DATABASE UPDATE: Payment updated successfully:', updateResult);

		// Invalidate cache
		cache.delete(cacheKeys.payments());
		console.log('🗑️ Invalidated payments cache');

		return { form };
	}
};

// Helper function to map transaction methods back to payment methods
function mapTransactionMethodToPayment(transactionMethod: string): string {
	const methodMap: Record<string, string> = {
		'BANK': 'BANK',
		'GCASH': 'GCASH',
		'CASH': 'CASH',
		'SECURITY_DEPOSIT': 'SECURITY_DEPOSIT',
		'OTHER': 'OTHER'
	};
	return methodMap[transactionMethod] || 'OTHER';
}
