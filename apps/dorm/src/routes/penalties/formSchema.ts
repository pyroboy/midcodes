import { z } from "zod";

export const paymentStatusEnum = z.enum([
  'PENDING',
  'PARTIAL',
  'PAID',
  'OVERDUE'
]);

export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export const billingTypeEnum = z.enum([
  'RENT',
  'UTILITY',
  'MISC',
  'PENALTY'
]);

export type BillingType = z.infer<typeof billingTypeEnum>;

export const utilityTypeEnum = z.enum([
  'ELECTRICITY',
  'WATER',
  'INTERNET',
  'GAS',
  'OTHER'
]).nullable();

export type UtilityType = z.infer<typeof utilityTypeEnum>;

export const penaltyBillingSchema = z.object({
  id: z.number({
    required_error: 'Billing ID is required',
    invalid_type_error: 'Invalid billing ID'
  }).positive('Invalid billing ID'),
  lease_id: z.number({
    required_error: 'Lease ID is required',
    invalid_type_error: 'Invalid lease ID'
  }).positive('Invalid lease ID'),
  type: billingTypeEnum,
  utility_type: utilityTypeEnum,
  amount: z.number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number'
  }).min(0, 'Amount must be non-negative'),
  paid_amount: z.number().default(0),
  balance: z.number().min(0, 'Balance must be non-negative'),
  status: paymentStatusEnum,
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }),
  billing_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }),
  penalty_amount: z.number().min(0, 'Penalty amount must be non-negative').default(0),
  notes: z.string().max(1000).nullable().optional()
});

export type PenaltyBillingSchema = typeof penaltyBillingSchema;

export const updatePenaltySchema = z.object({
  id: z.number({
    required_error: 'Billing ID is required',
    invalid_type_error: 'Invalid billing ID'
  }).positive('Invalid billing ID'),
  penalty_amount: z.number({
    required_error: 'Penalty amount is required',
    invalid_type_error: 'Penalty amount must be a number'
  }).min(0, 'Penalty amount must be non-negative'),
  notes: z.string().max(1000).nullable().optional()
});

export type UpdatePenaltySchema = typeof updatePenaltySchema;
