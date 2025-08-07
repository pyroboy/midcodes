import type { z } from 'zod';
import type {
	expenseItemSchema,
	monthlyExpensesSchema,
	expenseSchema,
	expenseTypeEnum,
	expenseStatusEnum
} from './schema';
import type { SuperValidated, SuperForm } from 'sveltekit-superforms';

// Export types from schema
export type ExpenseItem = z.infer<typeof expenseItemSchema>;
export type MonthlyExpenses = z.infer<typeof monthlyExpensesSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type ExpenseType = z.infer<typeof expenseTypeEnum>;
export type ExpenseStatus = z.infer<typeof expenseStatusEnum>;

// Additional types for the UI
export interface ExpenseTableRow extends Expense {
	property_name?: string;
	created_by_name?: string;
}

export interface ExpenseFilterOptions {
	property_id?: number;
	expense_type?: ExpenseType;
	expense_status?: ExpenseStatus;
	date_from?: string;
	date_to?: string;
}

// Property interface
export interface Property {
	id: number;
	name: string;
	is_active?: boolean;
	status?: string;
}

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

// User interface
export interface User {
	id: string;
	full_name: string;
	[key: string]: any;
}

// Database table structure based on the SQL definition
export interface ExpenseDB {
	id: number;
	property_id: number | null;
	amount: number;
	description: string;
	type: ExpenseType;
	status: ExpenseStatus;
	created_by: string | null; // UUID
	created_at: string; // timestamp
	expense_date: string | null; // timestamp
}

// Generic form props helper type
export type FormProps<T extends z.ZodTypeAny> = {
	form: z.infer<T>;
	errors: Record<string, string | string[] | undefined>;
	enhance: SuperForm<SuperValidated<z.infer<T>, unknown, z.infer<T>>>['enhance'];
	constraints?: Record<string, unknown>;
	submitting?: boolean;
	editMode?: boolean;
};

// Specific form props types
export type ExpenseFormProps = FormProps<typeof expenseSchema>;
export type MonthlyExpenseFormProps = FormProps<typeof monthlyExpensesSchema>;
