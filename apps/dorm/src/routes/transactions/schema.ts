import { z } from 'zod';

// Define payment method enum (matching DORMSCHEMA.md database enum)
export const paymentMethodEnum = z.enum([
	'CASH',
	'BANK',
	'GCASH',
	'OTHER',
	'SECURITY_DEPOSIT'
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

// Simplified payment schema for form submission
export const paymentSchema = z.object({
	id: z.number().optional(),
	amount: z.number().positive('Amount must be positive'),
	method: paymentMethodEnum,
	reference_number: z.string().nullable().optional(),
	paid_by: z.string().min(1, 'Paid by is required'),
	paid_at: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
	receipt_url: z.string().url('Must be a valid URL').or(z.literal('')).nullable().optional(),
	billing_ids: z.array(z.number()).default([])
});

// Alias for backward compatibility
export const transactionSchema = paymentSchema;

export type Payment = z.infer<typeof paymentSchema>;
export type Transaction = z.infer<typeof transactionSchema>;

// Delete schema
export const deleteTransactionSchema = z.object({
	id: z
		.number({
			required_error: 'Transaction ID is required',
			invalid_type_error: 'Invalid transaction ID'
		})
		.positive('Invalid transaction ID')
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
