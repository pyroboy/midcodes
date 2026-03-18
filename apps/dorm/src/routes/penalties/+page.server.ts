import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { updatePenaltySchema } from './formSchema';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { billings } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) throw error(401, 'Unauthorized');
	return {
		form: await superValidate(zod(updatePenaltySchema))
	};
};

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
					penaltyAmount: String(penalty_amount),
					status: 'PENALIZED',
					notes: notes || currentBilling.notes,
					balance: String(Number(currentBilling.balance) - Number(currentBilling.penaltyAmount || 0) + penalty_amount),
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
