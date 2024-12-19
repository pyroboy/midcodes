import { z } from 'zod';

export const expenseTypeEnum = z.enum(['MAINTENANCE', 'UTILITIES', 'SUPPLIES', 'SALARY', 'OTHERS']);
export const expenseStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const expenseSchema = z.object({
  id: z.number().optional(),
  property_id: z.number({
    required_error: "Property is required"
  }),
  expense_date: z.string({
    required_error: "Date is required"
  }),
  expense_type: expenseTypeEnum,
  expense_status: expenseStatusEnum.default('PENDING'),
  description: z.string({
    required_error: "Description is required"
  }).min(1, "Description is required"),
  amount: z.number({
    required_error: "Amount is required"
  }).min(0, "Amount must be greater than or equal to 0"),
  receipt_url: z.string().optional(),
  created_by: z.string().optional(),
  approved_by: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export type ExpenseSchema = z.infer<typeof expenseSchema>;
