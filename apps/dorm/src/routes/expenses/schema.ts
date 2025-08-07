import { z } from 'zod';

// Define expense types
export const expenseTypeEnum = z.enum([
	'OPERATIONAL',
	'CAPITAL',
	'MAINTENANCE',
	'UTILITIES',
	'SUPPLIES',
	'SALARY',
	'OTHERS'
]);

export type ExpenseType = z.infer<typeof expenseTypeEnum>;

// Define expense status
export const expenseStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export type ExpenseStatus = z.infer<typeof expenseStatusEnum>;

// Define the expense item schema for the monthly form
export const expenseItemSchema = z.object({
	label: z.string().min(1, 'Expense label is required'),
	amount: z
		.string()
		.refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
			message: 'Amount must be a positive number'
		})
});

export type ExpenseItem = z.infer<typeof expenseItemSchema>;

// Month options
export const months = [
	'january',
	'february',
	'march',
	'april',
	'may',
	'june',
	'july',
	'august',
	'september',
	'october',
	'november',
	'december'
] as const;

export type Month = (typeof months)[number];

// Define the monthly expenses schema
export const monthlyExpensesSchema = z.object({
	year: z.string(),
	month: z
		.string()
		.refine((val) => months.includes(val as Month), { message: 'Invalid month selection' }),
	items: z.array(expenseItemSchema).min(1, 'At least one expense item is required')
});

export type MonthlyExpenses = z.infer<typeof monthlyExpensesSchema>;

// Define the main expense schema for individual expense entries
export const expenseSchema = z.object({
	id: z.number().optional(),
	property_id: z.number().nullable(),
	amount: z.number().positive('Amount must be positive'),
	description: z.string().min(1, 'Description is required'),
	type: expenseTypeEnum,
	expense_status: expenseStatusEnum.default('PENDING'),
	expense_date: z.string().nullable().optional(),
	created_by: z.string().uuid().nullable().optional(),
	created_at: z.string().optional()
});

export type Expense = z.infer<typeof expenseSchema>;

// Delete schema
export const deleteExpenseSchema = z.object({
	id: z
		.number({
			required_error: 'Expense ID is required',
			invalid_type_error: 'Invalid expense ID'
		})
		.positive('Invalid expense ID')
});

export type DeleteExpenseSchema = z.infer<typeof deleteExpenseSchema>;

// Default values
export const defaultMonthlyExpenses: MonthlyExpenses = {
	year: new Date().getFullYear().toString(),
	month: months[new Date().getMonth()],
	items: [{ label: '', amount: '' }]
};
