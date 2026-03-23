import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { expenseSchema } from './schema';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { expenses } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { extractLockTimestamp, optimisticLockUpdate } from '$lib/server/optimistic-lock';

export const actions: Actions = {
	upsert: async ({ request, locals }) => {
		const { user, session } = locals;
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		const rawFormData = await request.formData();
		const lockTs = extractLockTimestamp(rawFormData);
		const form = await superValidate(rawFormData, zod(expenseSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const { id, ...expenseData } = form.data;

			if (id) {
				// Update with optimistic lock
				const lockResult = await optimisticLockUpdate(
					db, expenses, expenses.id, id, expenses.updatedAt, lockTs,
					{
						propertyId: expenseData.property_id,
						amount: String(expenseData.amount),
						description: expenseData.description,
						type: expenseData.type as 'OPERATIONAL' | 'CAPITAL',
						status: expenseData.expense_status,
						expenseDate: expenseData.expense_date ? new Date(expenseData.expense_date) : null,
						updatedAt: new Date()
					}
				);
				if (lockResult.conflict) {
					return fail(409, { form, conflict: true, message: lockResult.message });
				}

				return { form, success: true, operation: 'update', expense: lockResult.rows?.[0] };
			} else {
				// Create
				const result = await db
					.insert(expenses)
					.values({
						propertyId: expenseData.property_id,
						amount: String(expenseData.amount),
						description: expenseData.description,
						type: expenseData.type as 'OPERATIONAL' | 'CAPITAL',
						status: expenseData.expense_status,
						expenseDate: expenseData.expense_date ? new Date(expenseData.expense_date) : null,
						createdBy: user.id,
						updatedAt: new Date()
					})
					.returning();

					return { form, success: true, operation: 'create', expense: result?.[0] };
			}
		} catch (err) {
			console.error('Error in upsert operation:', err);
			return fail(500, { form, message: 'An unexpected error occurred' });
		}
	},

	delete: async ({ request, locals }) => {
		const { user, session } = locals;
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		try {
			const formData = await request.formData();
			const id = formData.get('id');

			if (!id) {
				return fail(400, { message: 'Expense ID is required' });
			}

			const result = await db
				.update(expenses)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(eq(expenses.id, Number(id)))
				.returning();

			return { success: true };
		} catch (err) {
			console.error('Error processing delete request:', err);
			return fail(500, { message: 'An error occurred while processing the delete request' });
		}
	}
};
