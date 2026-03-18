import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { expenseSchema } from './schema';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { expenses } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const actions: Actions = {
	upsert: async ({ request, locals }) => {
		const { user, session } = locals;
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		const form = await superValidate(request, zod(expenseSchema));

		if (!form.valid) {
			console.error('Form validation error:', form.errors);
			return fail(400, { form });
		}

		try {
			const { id, ...expenseData } = form.data;

			if (id) {
				// Update
				const result = await db
					.update(expenses)
					.set({
						propertyId: expenseData.property_id,
						amount: String(expenseData.amount),
						description: expenseData.description,
						type: expenseData.type as 'OPERATIONAL' | 'CAPITAL',
						status: expenseData.expense_status,
						expenseDate: expenseData.expense_date ? new Date(expenseData.expense_date) : null,
					updatedAt: new Date()
					})
					.where(eq(expenses.id, id))
					.returning();

				return { form, success: true, operation: 'update', expense: result?.[0] };
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

				console.log('Creating expense with data:', {
					inputData: expenseData,
					dbData: result,
					type: expenseData.type
				});

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

			console.log('Received delete request with ID:', id);

			if (!id) {
				console.error('Error: Expense ID is required but was not provided');
				return fail(400, { message: 'Expense ID is required' });
			}

			console.log('Attempting to delete expense with ID:', id);
			const result = await db
				.delete(expenses)
				.where(eq(expenses.id, Number(id)))
				.returning();

			console.log('Delete result:', { data: result });

			return { success: true };
		} catch (err) {
			console.error('Error processing delete request:', err);
			return fail(500, { message: 'An error occurred while processing the delete request' });
		}
	}
};
