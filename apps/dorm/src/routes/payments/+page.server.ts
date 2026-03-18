import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { paymentSchema, type UserRole } from './formSchema';
import { transactionSchema } from '../transactions/schema';
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
import { db } from '$lib/server/db';
import { payments, billings, profiles, leases, rentalUnit, floors, properties, user as userTable } from '$lib/server/schema';
import { eq, desc, asc, inArray, isNull } from 'drizzle-orm';

export const load = async ({ locals }) => {
	const { user, effectiveRoles } = locals;
	if (!user) throw error(401, 'Unauthorized');

	// Role flags derived from cached effectiveRoles (no DB call needed)
	const role = effectiveRoles?.[0] || 'user';

	return {
		userRole: role,
		isAdminLevel: ['super_admin', 'property_admin'].includes(role),
		isAccountant: role === 'property_accountant',
		isUtility: role === 'property_utility',
		isFrontdesk: role === 'property_frontdesk',
		isResident: role === 'property_tenant'
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
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

		// Get billing details
		const billingResult = await db
			.select()
			.from(billings)
			.where(eq(billings.id, form.data.billing_id))
			.limit(1);

		const billing = billingResult[0];
		if (!billing) {
			return fail(404, {
				form,
				error: `Billing #${form.data.billing_id} not found or has been deleted`
			});
		}

		// Get user role
		const userRoleResult = await db
			.select({ role: profiles.role, name: userTable.name })
			.from(profiles)
			.innerJoin(userTable, eq(profiles.id, userTable.id))
			.where(eq(profiles.id, user.id))
			.limit(1);
		const userRole = userRoleResult[0];

		const canCreate = [
			'super_admin',
			'property_admin',
			'property_accountant',
			'property_frontdesk'
		] as UserRole[];
		if (!canCreate.includes(userRole?.role as UserRole)) {
			return fail(403, {
				form,
				error: 'You do not have permission to create payments'
			});
		}

		if (!['PENDING', 'PARTIAL', 'OVERDUE'].includes(billing.status)) {
			return fail(400, {
				form,
				error: `Cannot process payment for billing in ${billing.status} status. Only PENDING, PARTIAL, or OVERDUE billings can receive payments.`
			});
		}

		if (form.data.amount > Number(billing.balance)) {
			return fail(400, {
				form,
				error: `Payment amount (${form.data.amount}) exceeds billing balance (${billing.balance}). Please enter an amount less than or equal to the balance.`
			});
		}

		// Check for late payment and calculate penalty
		const penaltyConfig = await getPenaltyConfig(billing.type);
		let penaltyAmount = 0;

		const billingForCalc = {
			id: billing.id,
			lease_id: billing.leaseId,
			type: billing.type,
			utility_type: billing.utilityType ?? undefined,
			amount: Number(billing.amount),
			paid_amount: Number(billing.paidAmount ?? '0'),
			balance: Number(billing.balance),
			status: billing.status,
			due_date: billing.dueDate,
			billing_date: billing.billingDate,
			penalty_amount: Number(billing.penaltyAmount ?? '0'),
			notes: billing.notes ?? undefined
		};

		if (penaltyConfig && new Date(form.data.paid_at) > new Date(billing.dueDate)) {
			penaltyAmount = await calculatePenalty(billingForCalc, penaltyConfig, new Date(form.data.paid_at));
		}

		let createdPayment;
		try {
			const now = new Date();
			const result = await db
				.insert(payments)
				.values({
					billingId: form.data.billing_id,
					billingIds: [form.data.billing_id],
					amount: String(form.data.amount),
					method: form.data.method,
					referenceNumber: form.data.reference_number,
					paidBy: form.data.paid_by,
					paidAt: new Date(form.data.paid_at),
					notes: form.data.notes,
					receiptUrl: form.data.receipt_url,
					createdBy: user.id,
					updatedBy: user.id,
					createdAt: now,
					updatedAt: now
				})
				.returning();

			createdPayment = result[0];

			// Update billing status
			await updateBillingStatus(billingForCalc, Number(billing.paidAmount ?? '0') + form.data.amount);

			// Create penalty billing if needed
			if (penaltyAmount > 0) {
				await createPenaltyBilling(billingForCalc, penaltyAmount);
			}

			cache.delete(cacheKeys.payments());
			console.log('Invalidated payments cache');

			return {
				form,
				success: true,
				message: `Payment of ${form.data.amount} successfully processed`
			};
		} catch (err) {
			console.error('Transaction failed:', err);

			// Attempt to rollback payment if it was created
			try {
				if (createdPayment?.id) {
					await db.delete(payments).where(eq(payments.id, createdPayment.id));
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
		const { user } = locals;
		if (!user) {
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

		const userRoleResult = await db
			.select({ role: profiles.role })
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);
		const userRole = userRoleResult[0];

		const canUpdate = ['super_admin', 'property_admin', 'property_accountant'] as UserRole[];
		if (!canUpdate.includes(userRole?.role as UserRole)) {
			return fail(403, {
				form,
				error: 'You do not have permission to update payments'
			});
		}

		// Get existing payment
		const existingResult = await db
			.select()
			.from(payments)
			.where(eq(payments.id, form.data.id!))
			.limit(1);

		if (existingResult.length === 0) {
			return fail(404, {
				form,
				error: 'Payment not found or has been deleted'
			});
		}

		try {
			await db
				.update(payments)
				.set({
					amount: String(form.data.amount),
					method: form.data.method,
					referenceNumber: form.data.reference_number,
					paidBy: form.data.paid_by,
					paidAt: new Date(form.data.paid_at),
					notes: form.data.notes,
					receiptUrl: form.data.receipt_url,
					updatedBy: user.id,
					updatedAt: new Date(getUTCTimestamp())
				})
				.where(eq(payments.id, form.data.id!));
		} catch (err) {
			console.error('Failed to update payment:', err);
			return fail(500, {
				form,
				error: 'Failed to update payment record'
			});
		}

		cache.delete(cacheKeys.payments());
		console.log('Invalidated payments cache');

		return { form };
	},

	revert: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
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

		// Authorization
		const userRoleResult = await db
			.select({ role: profiles.role })
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);
		const userRole = userRoleResult[0];

		const canRevert = ['super_admin', 'property_admin', 'property_accountant'] as UserRole[];
		if (!canRevert.includes(userRole?.role as UserRole)) {
			return fail(403, { error: 'You do not have permission to revert payments' });
		}

		// Ensure payment exists and not already reverted
		const paymentResult = await db
			.select({ id: payments.id, revertedAt: payments.revertedAt })
			.from(payments)
			.where(eq(payments.id, paymentId))
			.limit(1);

		const payment = paymentResult[0];
		if (!payment) {
			return fail(404, { error: 'Payment not found' });
		}

		if (payment.revertedAt) {
			return fail(400, { error: 'Payment is already reverted' });
		}

		// Call DB function to revert via raw SQL
		try {
			const revertResult = await db.execute(
				sql`SELECT revert_payment(${paymentId}::int, ${reason}::text, ${user.id}::text)`
			);

			cache.delete(cacheKeys.payments());
			console.log('Invalidated payments cache');

			return { success: true, result: revertResult };
		} catch (err) {
			console.error('Failed to revert payment:', err);
			return fail(500, { error: 'Failed to revert payment' });
		}
	},

	upsert: async ({ request, locals }) => {
		console.log('SERVER ACTION: Upsert action called');

		const { user } = locals;
		if (!user) {
			return fail(401, {
				form: null,
				error: 'You must be logged in to update payments'
			});
		}

		const form = await superValidate(request, zod(transactionSchema));

		if (!form.valid) {
			return fail(400, {
				form,
				error: 'Invalid form data. Please check your input.'
			});
		}

		const userRoleResult = await db
			.select({ role: profiles.role })
			.from(profiles)
			.where(eq(profiles.id, user.id))
			.limit(1);
		const userRole = userRoleResult[0];

		const canUpdate = ['super_admin', 'property_admin', 'property_accountant'] as UserRole[];
		if (!canUpdate.includes(userRole?.role as UserRole)) {
			return fail(403, {
				form,
				error: 'You do not have permission to update payments'
			});
		}

		// Convert transaction data back to payment format
		const paymentData = {
			billingIds: form.data.billing_ids || [],
			amount: String(form.data.amount),
			method: mapTransactionMethodToPayment(form.data.method) as 'CASH' | 'BANK' | 'GCASH' | 'OTHER' | 'SECURITY_DEPOSIT',
			referenceNumber: form.data.reference_number,
			paidBy: form.data.paid_by,
			paidAt: form.data.paid_at ? new Date(form.data.paid_at) : new Date(),
			notes: form.data.notes,
			receiptUrl: form.data.receipt_url
		};

		try {
			await db
				.update(payments)
				.set({
					...paymentData,
					updatedBy: user.id,
					updatedAt: new Date(getUTCTimestamp())
				})
				.where(eq(payments.id, form.data.id!));
		} catch (err) {
			console.error('Failed to update payment:', err);
			return fail(500, {
				form,
				error: 'Failed to update payment record'
			});
		}

		cache.delete(cacheKeys.payments());
		console.log('Invalidated payments cache');

		return { form };
	}
};

// Helper function to map transaction methods back to payment methods
function mapTransactionMethodToPayment(transactionMethod: string): string {
	const methodMap: Record<string, string> = {
		BANK: 'BANK',
		GCASH: 'GCASH',
		CASH: 'CASH',
		SECURITY_DEPOSIT: 'SECURITY_DEPOSIT',
		OTHER: 'OTHER'
	};
	return methodMap[transactionMethod] || 'OTHER';
}

// Need to import sql for the revert RPC call
import { sql } from 'drizzle-orm';
