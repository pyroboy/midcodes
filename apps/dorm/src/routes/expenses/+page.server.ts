import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { expenseSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { expenses, properties } from '$lib/server/schema';
import { eq, desc, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { user, session } = locals;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Fetch expenses and properties in parallel
		const [expensesData, propertiesData] = await Promise.all([
			db
				.select({
					id: expenses.id,
					propertyId: expenses.propertyId,
					amount: expenses.amount,
					description: expenses.description,
					type: expenses.type,
					status: expenses.status,
					expenseDate: expenses.expenseDate,
					createdBy: expenses.createdBy,
					createdAt: expenses.createdAt,
					propertyName: properties.name,
					propertyDbId: properties.id
				})
				.from(expenses)
				.leftJoin(properties, eq(expenses.propertyId, properties.id))
				.orderBy(desc(expenses.expenseDate)),

			db
				.select({ id: properties.id, name: properties.name })
				.from(properties)
				.orderBy(asc(properties.name))
		]);

		// Format expenses to match original structure
		const formattedExpenses = expensesData.map((expense) => ({
			...expense,
			property: expense.propertyDbId ? { id: expense.propertyDbId, name: expense.propertyName } : null,
			expense_date: new Date(expense.expenseDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			})
		}));

		let activeProperties = propertiesData || [];

		// If no properties found, try without status filter
		if (activeProperties.length === 0) {
			console.log('No properties found, trying without any filter');
			activeProperties = await db
				.select({ id: properties.id, name: properties.name })
				.from(properties)
				.orderBy(asc(properties.name));
		}

		console.log(
			`Loaded ${formattedExpenses.length || 0} expenses and ${activeProperties.length || 0} properties`
		);

		const form = await superValidate(zod(expenseSchema));

		return {
			form,
			expenses: formattedExpenses,
			properties: activeProperties,
			user
		};
	} catch (err) {
		console.error('Error in load function:', err);
		throw error(500, 'Failed to load data');
	}
};

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
						amount: expenseData.amount,
						description: expenseData.description,
						type: expenseData.type,
						status: expenseData.expense_status,
						expenseDate: expenseData.expense_date
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
						amount: expenseData.amount,
						description: expenseData.description,
						type: expenseData.type,
						status: expenseData.expense_status,
						expenseDate: expenseData.expense_date,
						createdBy: user.id
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
