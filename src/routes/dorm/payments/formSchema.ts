import { z } from 'zod';

export const paymentTypeEnum = z.enum([
  'RENT',
  'SECURITY_DEPOSIT',
  'UTILITY',
  'PENALTY',
  'MISC'
]);

export const paymentStatusEnum = z.enum([
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'CANCELLED'
]);

export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'GCASH',
  'MAYA',
  'CHECK'
]);

export const paymentSchema = z.object({
  id: z.number().optional(),
  billing_id: z.number(),
  amount: z.number().min(0, 'Amount must be 0 or greater'),
  payment_method: paymentMethodEnum,
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  reference_number: z.string().optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: paymentStatusEnum.default('PENDING'),
  created_by: z.string().uuid()
});

export type PaymentSchema = typeof paymentSchema;
