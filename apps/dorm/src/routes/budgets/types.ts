import type { z } from 'zod';
import type {
	budgetItemSchema,
	budgetSchema,
	budgetCategoryEnum,
	budgetStatusEnum
} from './schema';
import type { SuperValidated, SuperForm } from 'sveltekit-superforms';

// Export types from schema
export type BudgetItem = z.infer<typeof budgetItemSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type BudgetCategory = z.infer<typeof budgetCategoryEnum>;
export type BudgetStatus = z.infer<typeof budgetStatusEnum>;

// Additional types for the UI
export interface BudgetWithStats extends Budget {
	isExpanded?: boolean;
	allocatedAmount?: number;
	remainingAmount?: number;
	property_name?: string;
	created_by_name?: string;
}

export interface BudgetFilterOptions {
	property_id?: number;
	project_category?: BudgetCategory;
	status?: BudgetStatus;
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

// User interface
export interface User {
	id: string;
	full_name: string;
	[key: string]: any;
}

// Budget statistics interface
export interface BudgetStatistics {
	totalPlannedBudget: number;
	totalAllocatedBudget: number;
	totalRemainingBudget: number;
	completedProjects: number;
	ongoingProjects: number;
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
export type BudgetFormProps = FormProps<typeof budgetSchema>;
