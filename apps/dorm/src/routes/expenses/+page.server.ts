import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { expenseSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';
import {
	requireAuth,
	executeQuery,
	executeInsert,
	executeUpdate,
	executeDelete,
	handleValidationError,
	logAuditEvent
} from '$lib/utils/errorHandlers';
import {
	createInternalError,
	throwError,
	failWithError
} from '$lib/utils/errors';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const session = await safeGetSession();

	// Ensure user is authenticated
	requireAuth(session, { action: 'load_expenses' });

	try {
		// Fetch expenses and properties in parallel using consistent error handling
		const [expensesData, propertiesData] = await Promise.all([
			executeQuery(
				supabase
					.from('expenses')
					.select(
						`
          *,
          property:properties(id, name)
        `
					)
					.order('expense_date', { ascending: false }),
				{
					resourceType: 'expense',
					errorMessage: 'Failed to load expenses',
					context: { userId: session.user.id, action: 'load_expenses' }
				}
			),

			executeQuery(
				supabase
					.from('properties')
					.select('id, name')
					.eq('status', 'ACTIVE')
					.order('name'),
				{
					resourceType: 'property',
					errorMessage: 'Failed to load properties',
					context: { userId: session.user.id, action: 'load_properties' }
				}
			)
		]);

		// Format dates for expenses
		const expenses =
			expensesData?.map((expense: any) => ({
				...expense,
				expense_date: new Date(expense.expense_date).toLocaleDateString('en-US', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				})
			})) || [];

		console.log(
			`✅ Loaded ${expenses.length} expenses and ${propertiesData?.length || 0} properties`
		);

		// Create form for superForm
		const form = await superValidate(zod(expenseSchema));

		return {
			form,
			expenses,
			properties: propertiesData || [],
			user: session.user
		};
	} catch (err) {
		// Re-throw if it's already an AppError, otherwise wrap it
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throwError(
			createInternalError('Failed to load expenses data', err, {
				userId: session.user.id,
				action: 'load_expenses'
			})
		);
	}
};

export const actions: Actions = {
	upsert: async ({ request, locals: { supabase, safeGetSession } }) => {
		const session = await safeGetSession();

		// Ensure user is authenticated
		requireAuth(session, { action: 'upsert_expense' });

		const form = await superValidate(request, zod(expenseSchema));

		if (!form.valid) {
			return handleValidationError(
				form,
				'Please check the form for errors',
				undefined,
				{ userId: session.user.id, action: 'upsert_expense' }
			);
		}

		try {
			const { id, ...expenseData } = form.data;

			const context = {
				userId: session.user.id,
				resourceType: 'expense',
				resourceId: id,
				action: id ? 'update' : 'create'
			};

			let result;

			if (id) {
				// Update existing expense
				result = await executeUpdate(
					supabase,
					'expenses',
					id,
					{
						property_id: expenseData.property_id,
						amount: expenseData.amount,
						description: expenseData.description,
						type: expenseData.type,
						status: expenseData.expense_status,
						expense_date: expenseData.expense_date
					},
					{
						resourceType: 'expense',
						errorMessage: 'Failed to update expense',
						context
					}
				);

				console.log('✅ Updated expense:', id);

				// Log audit event
				await logAuditEvent(supabase, {
					action: 'expense_updated',
					user_id: session.user.id,
					details: { expense_id: id, ...expenseData }
				});

				return { form, success: true, operation: 'update', expense: result };
			} else {
				// Create new expense
				result = await executeInsert(
					supabase,
					'expenses',
					{
						property_id: expenseData.property_id,
						amount: expenseData.amount,
						description: expenseData.description,
						type: expenseData.type,
						status: expenseData.expense_status,
						expense_date: expenseData.expense_date,
						created_by: session.user.id
					},
					{
						resourceType: 'expense',
						errorMessage: 'Failed to create expense',
						context
					}
				);

				console.log('✅ Created expense:', result);

				// Log audit event
				await logAuditEvent(supabase, {
					action: 'expense_created',
					user_id: session.user.id,
					details: expenseData
				});

				return { form, success: true, operation: 'create', expense: result };
			}
		} catch (err) {
			// If it's already an AppError, convert it to a fail response
			if (err && typeof err === 'object' && 'code' in err) {
				return failWithError(err as any, form);
			}
			// Otherwise, create an internal error
			return failWithError(
				createInternalError('An unexpected error occurred', err, {
					userId: session.user.id,
					action: 'upsert_expense'
				}),
				form
			);
		}
	},

	delete: async ({ request, locals: { supabase, safeGetSession } }) => {
		const session = await safeGetSession();

		// Ensure user is authenticated
		requireAuth(session, { action: 'delete_expense' });

		try {
			const formData = await request.formData();
			const id = formData.get('id');

			if (!id || typeof id !== 'string') {
				return failWithError(
					{
						code: 'VALIDATION_ERROR' as any,
						message: 'Expense ID is required',
						status: 400
					},
					undefined
				);
			}

			// Delete the expense
			await executeDelete(supabase, 'expenses', id, {
				resourceType: 'expense',
				errorMessage: 'Failed to delete expense',
				context: {
					userId: session.user.id,
					resourceId: id,
					action: 'delete_expense'
				}
			});

			console.log('✅ Deleted expense:', id);

			// Log audit event
			await logAuditEvent(supabase, {
				action: 'expense_deleted',
				user_id: session.user.id,
				details: { expense_id: id }
			});

			return { success: true };
		} catch (err) {
			// If it's already an AppError, convert it to a fail response
			if (err && typeof err === 'object' && 'code' in err) {
				return failWithError(err as any);
			}
			// Otherwise, create an internal error
			return failWithError(
				createInternalError('Failed to delete expense', err, {
					userId: session.user.id,
					action: 'delete_expense'
				})
			);
		}
	}
};
