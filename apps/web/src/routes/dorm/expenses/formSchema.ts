import { z } from 'zod';

// Property type
// Property schema
export const propertySchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  province: z.string(),
  postal_code: z.string(),
  country: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
  updated_by: z.string().uuid().optional(),
  is_active: z.boolean().default(true)
});

export type Property = z.infer<typeof propertySchema>;

// Expense schema matching your actual enum values
// Add these enum exports
// In formSchema.ts
export const expenseTypeEnum = z.enum(['MAINTENANCE', 'UTILITIES', 'SUPPLIES', 'SALARY', 'OTHERS']);
export const expenseStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export type ExpenseType = z.infer<typeof expenseTypeEnum>;
export type ExpenseStatus = z.infer<typeof expenseStatusEnum>;

export const expenseSchema = z.object({
    id: z.number().optional(),
    property_id: z.number(),
    expense_date: z.string(),
    expense_type: expenseTypeEnum,
    expense_status: expenseStatusEnum.default('PENDING'),
    amount: z.number().positive(),
    description: z.string(),
    receipt_url: z.string().optional(),
    notes: z.string().optional(),
    created_by: z.string().uuid().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional()
});

export type ExpenseSchema = z.infer<typeof expenseSchema>;

// Default values for new expense
export const defaultExpense: Partial<ExpenseSchema> = {
    expense_status: 'PENDING',
    expense_date: new Date().toISOString().split('T')[0]
};