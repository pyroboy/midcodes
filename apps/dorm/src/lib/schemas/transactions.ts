import { z } from 'zod';

export const transactionTypeEnum = {
	enum: {
		CASH: 'CASH',
		BANK: 'BANK',
		GCASH: 'GCASH',
		SECURITY_DEPOSIT: 'SECURITY_DEPOSIT',
		OTHER: 'OTHER'
	}
} as const;

export const transactionSchema = z.object({
	transaction_date: z.coerce.date(),
	transaction_type: z.enum(Object.values(transactionTypeEnum.enum) as [string, ...string[]]),
	total_charges: z.coerce.number().min(0),
	amount_paid: z.coerce.number().min(0),
	change_amount: z.coerce.number().min(0),
	paid_by: z.string().optional(),
	notes: z.string().optional(),
	org_id: z.string().uuid()
});

export const accountSchema = z.object({
	id: z.number(),
	lease_id: z.number(),
	type: z.string(),
	amount: z.number(),
	balance: z.number().nullable(),
	date_issued: z.string(),
	due_date: z.string().nullable()
});

export const formSchema = transactionSchema.extend({
	selected_accounts: z.array(accountSchema)
});
