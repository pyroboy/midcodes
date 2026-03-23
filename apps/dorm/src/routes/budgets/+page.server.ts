import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { budgetSchema } from './schema';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { budgets } from '$lib/server/schema';
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
		const form = await superValidate(rawFormData, zod(budgetSchema));

		if (!form.valid) {
			console.error('Form validation error:', form.errors);
			return fail(400, { form });
		}

		try {
			const { id, ...budgetData } = form.data;

			const validatedBudgetItems = Array.isArray(budgetData.budget_items)
				? budgetData.budget_items.map((item) => ({
						...item,
						cost: typeof item.cost === 'number' && !isNaN(item.cost) ? item.cost : 0,
						quantity: typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1
					}))
				: [];

			const formattedData = {
				...budgetData,
				planned_amount:
					typeof budgetData.planned_amount === 'number' && !isNaN(budgetData.planned_amount)
						? budgetData.planned_amount
						: 0,
				pending_amount:
					typeof budgetData.pending_amount === 'number' && !isNaN(budgetData.pending_amount)
						? budgetData.pending_amount
						: 0,
				actual_amount:
					typeof budgetData.actual_amount === 'number' && !isNaN(budgetData.actual_amount)
						? budgetData.actual_amount
						: 0,
				budget_items: JSON.stringify(validatedBudgetItems)
			};

			if (id) {
				const lockResult = await optimisticLockUpdate(
					db, budgets, budgets.id, id, budgets.updatedAt, lockTs,
					{
						propertyId: formattedData.property_id,
						projectName: formattedData.project_name,
						projectDescription: formattedData.project_description,
						projectCategory: formattedData.project_category,
						plannedAmount: String(formattedData.planned_amount),
						pendingAmount: String(formattedData.pending_amount),
						actualAmount: String(formattedData.actual_amount),
						budgetItems: formattedData.budget_items,
						status: formattedData.status,
						startDate: formattedData.start_date ? new Date(formattedData.start_date) : null,
						endDate: formattedData.end_date ? new Date(formattedData.end_date) : null,
						updatedAt: new Date()
					}
				);
				if (lockResult.conflict) {
					return fail(409, { form, conflict: true, message: lockResult.message });
				}

				return { form, success: true, operation: 'update', budget: lockResult.rows?.[0] };
			} else {
				const result = await db
					.insert(budgets)
					.values({
						id: Date.now(),
						propertyId: formattedData.property_id,
						projectName: formattedData.project_name,
						projectDescription: formattedData.project_description,
						projectCategory: formattedData.project_category,
						plannedAmount: String(formattedData.planned_amount),
						pendingAmount: String(formattedData.pending_amount || 0),
						actualAmount: String(formattedData.actual_amount || 0),
						budgetItems: formattedData.budget_items,
						status: formattedData.status,
						startDate: formattedData.start_date ? new Date(formattedData.start_date) : null,
						endDate: formattedData.end_date ? new Date(formattedData.end_date) : null,
						createdBy: user.id,
						createdAt: new Date(),
						updatedAt: new Date()
					})
					.returning();

				return { form, success: true, operation: 'create', budget: result?.[0] };
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
				console.error('Error: Budget ID is required but was not provided');
				return fail(400, { message: 'Budget ID is required' });
			}

			console.log('Attempting to delete budget with ID:', id);
			const result = await db
				.update(budgets)
				.set({ deletedAt: new Date(), updatedAt: new Date() })
				.where(eq(budgets.id, Number(id)))
				.returning();

			console.log('Delete result:', { data: result });

			return { success: true };
		} catch (err) {
			console.error('Error processing delete request:', err);
			return fail(500, { message: 'An error occurred while processing the delete request' });
		}
	}
};
