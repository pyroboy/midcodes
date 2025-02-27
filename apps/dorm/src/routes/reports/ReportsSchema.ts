import { z } from 'zod';

// Schema for expense data
export const ExpenseSchema = z.object({
  id: z.number(),
  amount: z.number().positive(),
  description: z.string(),
  type: z.enum(['OPERATIONAL', 'CAPITAL', 'MAINTENANCE', 'UTILITIES', 'SUPPLIES', 'SALARY']),
  status: z.string(),
  created_at: z.string().datetime()
});

// Schema for floor data
export const FloorDataSchema = z.object({
  income: z.number().nonnegative(),
  note: z.string()
});

// Schema for floor data map
export const FloorDataMapSchema = z.object({
  secondFloor: FloorDataSchema,
  thirdFloor: FloorDataSchema
});

// Schema for profit sharing
export const ProfitSharingSchema = z.object({
  forty: z.number(),
  sixty: z.number()
});

// Schema for financial totals
export const TotalsSchema = z.object({
  grossIncome: z.number().nonnegative(),
  totalExpenses: z.number().nonnegative(),
  netIncome: z.number()
});

// Schema for the complete monthly data
export const MonthDataSchema = z.object({
  floorData: FloorDataMapSchema,
  expenses: z.array(ExpenseSchema),
  profitSharing: ProfitSharingSchema,
  totals: TotalsSchema
});

// Schema for property
export const PropertySchema = z.object({
  id: z.number(),
  name: z.string()
});

// Schema for selecting a month
export const MonthSchema = z.enum([
  'january', 'february', 'march', 'april',
  'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december'
]);

// Schema for filter parameters
export const FilterParamsSchema = z.object({
  year: z.string().regex(/^\d{4}$/).optional(),
  month: MonthSchema.optional(),
  propertyId: z.string().regex(/^\d+$/).nullable().optional()
});

// Types from the schemas
export type Expense = z.infer<typeof ExpenseSchema>;
export type FloorData = z.infer<typeof FloorDataSchema>;
export type FloorDataMap = z.infer<typeof FloorDataMapSchema>;
export type ProfitSharing = z.infer<typeof ProfitSharingSchema>;
export type Totals = z.infer<typeof TotalsSchema>;
export type MonthData = z.infer<typeof MonthDataSchema>;
export type Property = z.infer<typeof PropertySchema>;
export type Month = z.infer<typeof MonthSchema>;
export type FilterParams = z.infer<typeof FilterParamsSchema>;