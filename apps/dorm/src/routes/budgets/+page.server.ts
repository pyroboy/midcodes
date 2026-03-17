import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { budgetSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { budgets, properties } from '$lib/server/schema';
import { eq, desc, asc } from 'drizzle-orm';

// Use Node runtime; avoid ISR on authed routes to prevent cache/redirect issues
export const config = { runtime: 'nodejs20.x' };

export const load: PageServerLoad = async ({ locals }) => {
	const { user, session } = locals;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Fetch budgets and properties in parallel
		const [budgetsRaw, propertiesData] = await Promise.all([
			db
				.select({
					id: budgets.id,
					propertyId: budgets.propertyId,
					projectName: budgets.projectName,
					projectDescription: budgets.projectDescription,
					projectCategory: budgets.projectCategory,
					plannedAmount: budgets.plannedAmount,
					pendingAmount: budgets.pendingAmount,
					actualAmount: budgets.actualAmount,
					budgetItems: budgets.budgetItems,
					status: budgets.status,
					startDate: budgets.startDate,
					endDate: budgets.endDate,
					createdBy: budgets.createdBy,
					createdAt: budgets.createdAt,
					updatedAt: budgets.updatedAt,
					propertyName: properties.name,
					propertyDbId: properties.id
				})
				.from(budgets)
				.leftJoin(properties, eq(budgets.propertyId, properties.id))
				.orderBy(desc(budgets.createdAt)),

			db
				.select({ id: properties.id, name: properties.name })
				.from(properties)
				.orderBy(asc(properties.name))
		]);

		let activeProperties = propertiesData || [];

		// Process budget data to include additional stats
		const processedBudgets =
			budgetsRaw?.map((budget) => {
				let budgetItems;
				try {
					if (typeof budget.budgetItems === 'string') {
						budgetItems = JSON.parse(budget.budgetItems);
					}
					budgetItems = Array.isArray(budget.budgetItems)
						? budget.budgetItems
						: Array.isArray(budgetItems)
							? budgetItems
							: [];
				} catch (e) {
					console.error('Error parsing budget_items:', e);
					budgetItems = [];
				}

				const allocatedAmount = budgetItems.reduce((total: number, item: any) => {
					const cost = typeof item.cost === 'number' && !isNaN(item.cost) ? item.cost : 0;
					const quantity =
						typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
					return total + cost * quantity;
				}, 0);

				const plannedAmount =
					typeof budget.plannedAmount === 'number' && !isNaN(budget.plannedAmount)
						? budget.plannedAmount
						: 0;

				return {
					...budget,
					property: budget.propertyDbId ? { id: budget.propertyDbId, name: budget.propertyName } : null,
					planned_amount: plannedAmount,
					allocatedAmount,
					remainingAmount: plannedAmount - allocatedAmount,
					isExpanded: false,
					budget_items: budgetItems.map((item: any) => ({
						id: item.id || null,
						name: item.name || '',
						type: item.type || 'OTHER',
						cost: typeof item.cost === 'number' && !isNaN(item.cost) ? item.cost : 0,
						quantity: typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0
					})),
					start_date: budget.startDate
						? new Date(budget.startDate).toLocaleDateString('en-US', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit'
							})
						: null,
					end_date: budget.endDate
						? new Date(budget.endDate).toLocaleDateString('en-US', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit'
							})
						: null
				};
			}) || [];

		// If no properties found, try without filter
		if (activeProperties.length === 0) {
			console.log('No properties found, trying without any filter');
			activeProperties = await db
				.select({ id: properties.id, name: properties.name })
				.from(properties)
				.orderBy(asc(properties.name));
		}

		// Calculate statistics
		const statistics = processedBudgets.reduce(
			(stats: any, budget) => {
				const plannedAmount =
					typeof budget.planned_amount === 'number' && !isNaN(budget.planned_amount)
						? budget.planned_amount
						: 0;
				const allocatedBudget =
					typeof budget.allocatedAmount === 'number' && !isNaN(budget.allocatedAmount)
						? budget.allocatedAmount
						: 0;

				stats.totalPlannedBudget += plannedAmount;
				stats.totalAllocatedBudget += allocatedBudget;

				if (budget.status === 'COMPLETED') stats.completedProjects += 1;
				else if (budget.status === 'ONGOING') stats.ongoingProjects += 1;

				return stats;
			},
			{
				totalPlannedBudget: 0,
				totalAllocatedBudget: 0,
				totalRemainingBudget: 0,
				completedProjects: 0,
				ongoingProjects: 0
			}
		);

		statistics.totalRemainingBudget =
			statistics.totalPlannedBudget - statistics.totalAllocatedBudget;

		const form = await superValidate(zod(budgetSchema));

		return {
			form,
			budgets: processedBudgets,
			properties: activeProperties,
			statistics,
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

		const form = await superValidate(request, zod(budgetSchema));

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
				const result = await db
					.update(budgets)
					.set({
						propertyId: formattedData.property_id,
						projectName: formattedData.project_name,
						projectDescription: formattedData.project_description,
						projectCategory: formattedData.project_category,
						plannedAmount: formattedData.planned_amount,
						pendingAmount: formattedData.pending_amount,
						actualAmount: formattedData.actual_amount,
						budgetItems: formattedData.budget_items,
						status: formattedData.status,
						startDate: formattedData.start_date,
						endDate: formattedData.end_date,
						updatedAt: new Date()
					})
					.where(eq(budgets.id, id))
					.returning();

				return { form, success: true, operation: 'update', budget: result?.[0] };
			} else {
				const result = await db
					.insert(budgets)
					.values({
						propertyId: formattedData.property_id,
						projectName: formattedData.project_name,
						projectDescription: formattedData.project_description,
						projectCategory: formattedData.project_category,
						plannedAmount: formattedData.planned_amount,
						pendingAmount: formattedData.pending_amount || 0,
						actualAmount: formattedData.actual_amount || 0,
						budgetItems: formattedData.budget_items,
						status: formattedData.status,
						startDate: formattedData.start_date,
						endDate: formattedData.end_date,
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
				.delete(budgets)
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
