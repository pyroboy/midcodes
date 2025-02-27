import { z } from 'zod';
import { 
  expenseTypeEnum, 
  expenseStatusEnum,
  months
} from './schema';

// Define the expense item schema
export const expenseItemSchema = z.object({
  label: z.string().min(1, "Expense label is required"),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Amount must be a positive number" }
  )
});

export type ExpenseItem = z.infer<typeof expenseItemSchema>;

// Define the monthly expenses schema
export const monthlyExpensesSchema = z.object({
  year: z.string(),
  month: z.string(),
  operationalExpenses: z.array(expenseItemSchema),
  capitalExpenses: z.array(expenseItemSchema)
});

export type MonthlyExpenses = z.infer<typeof monthlyExpensesSchema>;

// Default values
export const defaultMonthlyExpenses: MonthlyExpenses = {
  year: new Date().getFullYear().toString(),
  month: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][new Date().getMonth()],
  operationalExpenses: [{ label: 'Electricity', amount: '' }],
  capitalExpenses: [{ label: 'Repairs', amount: '' }]
};

export type ExpenseType = z.infer<typeof expenseTypeEnum>;

export const expenseMonthlySchema = z.object({
  id: z.number().optional(),
  year: z.string().regex(/^\d{4}$/, { message: 'Year must be 4 digits' }),
  month: z.string().refine(
    (val) => months.includes(val.toLowerCase() as any),
    { message: "Invalid month selection" }
  ),
  description: z.string().min(1, 'Description is required'),
  expense_type: expenseTypeEnum,
  amount: z.number().positive('Amount must be a positive number'),
  property_id: z.number().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_by: z.string().uuid().nullable().optional(),
  expense_status: expenseStatusEnum.default('PENDING')
});

export type ExpenseMonthly = z.infer<typeof expenseMonthlySchema>;
