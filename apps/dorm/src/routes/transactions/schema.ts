import { z } from 'zod';

// Define payment method enum (from the instruction document)
export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CHEQUE',
  'MOBILE_PAYMENT',
  'ONLINE_PAYMENT',
  'SECURITY_DEPOSIT',
  'OTHER'
]);

export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

// Define transaction status
export const transactionStatusEnum = z.enum([
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'CANCELLED'
]);

export type TransactionStatus = z.infer<typeof transactionStatusEnum>;

// Define the main transaction schema based on the payments table structure
export const transactionSchema = z.object({
  id: z.number().optional(),
  amount: z.number().positive("Amount must be positive"),
  method: paymentMethodEnum,
  reference_number: z.string().nullable().optional(),
  paid_by: z.string().min(1, "Paid by is required"),
  paid_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  receipt_url: z.string().nullable().optional(),
  billing_ids: z.array(z.number()).optional(),
  billing_changes: z.any().optional(), // Using any for JSONB type
  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().optional(),
  updated_by: z.string().uuid().nullable().optional(),
  updated_at: z.string().nullable().optional()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Delete schema
export const deleteTransactionSchema = z.object({
  id: z.number({
    required_error: 'Transaction ID is required',
    invalid_type_error: 'Invalid transaction ID'
  }).positive('Invalid transaction ID')
});

export type DeleteTransactionSchema = z.infer<typeof deleteTransactionSchema>;

// Date range filter schema
export const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional()
});

export type DateRange = z.infer<typeof dateRangeSchema>;

// Transaction filter schema
export const transactionFilterSchema = z.object({
  method: paymentMethodEnum.optional(),
  dateRange: dateRangeSchema.optional(),
  searchTerm: z.string().optional()
});

export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
