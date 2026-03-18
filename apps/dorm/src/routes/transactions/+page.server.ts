import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { transactionSchema } from './schema';
import type { Actions } from './$types';
import { cache } from '$lib/services/cache';
import { db } from '$lib/server/db';
import {
	payments, billings,
	paymentAllocations
} from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';

// Manual payment creation function
async function createPaymentManually(transactionData: any, userId: string, form: any) {
	const result = await db
		.insert(payments)
		.values({
			amount: String(transactionData.amount),
			method: transactionData.method,
			referenceNumber: transactionData.reference_number,
			paidBy: transactionData.paid_by,
			paidAt: transactionData.paid_at ? new Date(transactionData.paid_at) : new Date(),
			notes: transactionData.notes,
			receiptUrl: transactionData.receipt_url,
			createdBy: userId,
			billingIds: transactionData.billing_ids || []
		})
		.returning();

	const payment = result[0];

	if (!payment) {
		return fail(500, { form, message: 'Failed to create payment' });
	}

	if (!transactionData.billing_ids || transactionData.billing_ids.length === 0) {
		cache.deletePattern(/^transactions:/);
		return { form, success: true, operation: 'create', transaction: payment };
	}

	// Process billing allocations
	let remainingAmount = transactionData.amount;
	const paymentAllocationsToInsert = [];

	for (const billingId of transactionData.billing_ids) {
		if (remainingAmount <= 0) break;

		const billingResult = await db
			.select()
			.from(billings)
			.where(eq(billings.id, billingId))
			.limit(1);

		const billing = billingResult[0];
		if (!billing) continue;

		const currentBalance = Number(billing.balance) || 0;
		const amountToApply = Math.min(remainingAmount, currentBalance);

		if (amountToApply > 0) {
			await db.insert(paymentAllocations).values({
				paymentId: payment.id,
				billingId: billingId,
				amount: String(amountToApply)
			});

			const newPaidAmount = (Number(billing.paidAmount) || 0) + amountToApply;
			const newBalance = Number(billing.amount) + (Number(billing.penaltyAmount) || 0) - newPaidAmount;
			const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

			await db
				.update(billings)
				.set({
					paidAmount: String(newPaidAmount),
					balance: String(newBalance),
					status: newStatus,
					updatedAt: new Date()
				})
				.where(eq(billings.id, billingId));

			paymentAllocationsToInsert.push({ billing_id: billingId, amount: amountToApply });
			remainingAmount -= amountToApply;
		}
	}

	return {
		form,
		success: true,
		operation: 'create',
		transaction: { ...payment, allocations: paymentAllocationsToInsert }
	};
}

export const actions: Actions = {
	upsert: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		const form = await superValidate(request, zod(transactionSchema));

		if (!form.valid) {
			console.error('Form validation error:', form.errors);
			return fail(400, { form });
		}

		try {
			const { id, ...transactionData } = form.data;

			if (id) {
				// Update existing
				const existingResult = await db
					.select()
					.from(payments)
					.where(eq(payments.id, id))
					.limit(1);

				const existing = existingResult[0];
				if (!existing) {
					return fail(404, { form, message: 'Transaction not found' });
				}

				if (existing.revertedAt) {
					return fail(400, { form, message: 'Cannot update a reverted transaction' });
				}

				// Prevent financial field changes
				const financialFieldsChanged =
					(transactionData.amount != null &&
						Number(transactionData.amount) !== Number(existing.amount)) ||
					(transactionData.billing_ids &&
						JSON.stringify(transactionData.billing_ids) !==
							JSON.stringify(existing.billingIds));

				if (financialFieldsChanged) {
					return fail(400, {
						form,
						message:
							'Amount and billing allocations cannot be modified during edit. Only administrative fields can be updated.'
					});
				}

				const result = await db
					.update(payments)
					.set({
						referenceNumber: transactionData.reference_number,
						paidBy: transactionData.paid_by,
						paidAt: transactionData.paid_at ? new Date(transactionData.paid_at) : undefined,
						notes: transactionData.notes,
						receiptUrl: transactionData.receipt_url,
						updatedBy: user.id,
						updatedAt: new Date()
					})
					.where(eq(payments.id, id))
					.returning();

				cache.deletePattern(/^transactions:/);
				return { form, success: true, operation: 'update', transaction: result?.[0] };
			} else {
				// Create new payment
				return await createPaymentManually(transactionData, user.id, form);
			}
		} catch (err) {
			console.error('Error in upsert operation:', err);
			return fail(500, { form, message: 'An unexpected error occurred' });
		}
	},

	delete: async ({ request, locals }) => {
		const { user } = locals;
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		try {
			const formData = await request.formData();
			const id = formData.get('id');

			if (!id) {
				return fail(400, { message: 'Transaction ID is required' });
			}

			const reason = formData.get('reason') as string | null;
			const paymentId = Number(id);
			if (!Number.isFinite(paymentId)) {
				return fail(400, { message: 'Invalid transaction ID' });
			}

			// Call DB function to revert
			const result = await db.execute(
				sql`SELECT revert_payment(${paymentId}::int, ${reason}::text, ${user.id}::text)`
			);

			return { success: true, result };
		} catch (err) {
			console.error('Error processing delete request:', err);
			return fail(500, { message: 'An error occurred while processing the delete request' });
		}
	}
};
