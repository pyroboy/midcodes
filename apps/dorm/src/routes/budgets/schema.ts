import { z } from 'zod';

// Define budget project category enum
export const budgetCategoryEnum = z.enum([
  'RENOVATION',
  'REPAIRS',
  'MAINTENANCE',
  'FURNITURE',
  'OTHER'
]);

export type BudgetCategory = z.infer<typeof budgetCategoryEnum>;

// Define budget status enum
export const budgetStatusEnum = z.enum([
  'PLANNED',
  'ONGOING',
  'COMPLETED'
]);

export type BudgetStatus = z.infer<typeof budgetStatusEnum>;

// Define the budget item schema
export const budgetItemSchema = z.object({
  id: z.string().optional(), // For client-side tracking
  name: z.string().min(1, "Item name is required"),
  type: z.string().min(1, "Item type is required"),
  cost: z.number().positive("Cost must be a positive number"),
  quantity: z.number().positive("Quantity must be a positive number"),
});

export type BudgetItem = z.infer<typeof budgetItemSchema>;

// Define the budget schema
export const budgetSchema = z.object({
  id: z.number().optional(),
  project_name: z.string().min(1, "Project name is required"),
  project_description: z.string().optional().nullable(),
  project_category: budgetCategoryEnum,
  planned_amount: z.number().nonnegative("Planned amount must be non-negative"),
  pending_amount: z.number().nonnegative("Pending amount must be non-negative").optional().default(0),
  actual_amount: z.number().nonnegative("Actual amount must be non-negative").optional().default(0),
  budget_items: z.array(budgetItemSchema).default([]),
  status: budgetStatusEnum.default('PLANNED'),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  property_id: z.number().positive("Property ID is required"),
  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export type Budget = z.infer<typeof budgetSchema>;

// Delete schema
export const deleteBudgetSchema = z.object({
  id: z.number({
    required_error: 'Budget ID is required',
    invalid_type_error: 'Invalid budget ID'
  }).positive('Invalid budget ID')
});

export type DeleteBudgetSchema = z.infer<typeof deleteBudgetSchema>;

// Default values for a new budget
export const defaultBudget: Partial<Budget> = {
  project_name: '',
  project_description: '',
  project_category: 'RENOVATION',
  planned_amount: 0,
  pending_amount: 0,
  actual_amount: 0,
  budget_items: [],
  status: 'PLANNED',
  start_date: new Date().toISOString(),
  end_date: null
};

// Define budget item types
export const budgetItemTypes = [
  'MATERIALS',
  'LABOR',
  'EQUIPMENT_RENTAL',
  'PERMITS',
  'OTHERS'
] as const;

export type BudgetItemType = typeof budgetItemTypes[number];
