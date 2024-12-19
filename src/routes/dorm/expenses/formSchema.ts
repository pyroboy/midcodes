import { z } from 'zod';

export const expenseTypeEnum = z.enum([
  'MAINTENANCE',
  'REPAIR',
  'UTILITY',
  'SUPPLIES',
  'SALARY',
  'MISC'
]);

export const expenseStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
]);

export const expenseSchema = z.object({
  id: z.number().optional(),
  property_id: z.number(),
  expense_type: expenseTypeEnum,
  expense_status: expenseStatusEnum,
  amount: z.number().min(0, 'Amount must be 0 or greater'),
  description: z.string().min(1, 'Description is required'),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  receipt_url: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  created_by: z.number(),
  approved_by: z.number().optional().nullable()
});

export type ExpenseSchema = typeof expenseSchema;
