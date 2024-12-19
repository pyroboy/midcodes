import { z } from 'zod';

export const paymentMethodEnum = z.enum(['CASH', 'BANK', 'GCASH', 'OTHER']);
export const billingTypeEnum = z.enum(['RENT', 'UTILITY', 'PENALTY', 'MAINTENANCE', 'SERVICE']);

export const transactionSchema = z.object({
  id: z.number(),
  billing_id: z.number(),
  amount: z.number(),
  method: paymentMethodEnum,
  reference_number: z.string().optional().nullable(),
  paid_by: z.string(),
  paid_at: z.string(),
  notes: z.string().optional().nullable(),
  created_at: z.string(),
  billing: z.object({
    type: billingTypeEnum,
    utility_type: z.enum(['ELECTRICITY', 'WATER', 'INTERNET']).optional().nullable(),
    lease: z.object({
      tenant: z.object({
        name: z.string(),
        email: z.string().optional().nullable(),
      }).optional().nullable(),
    }).optional().nullable(),
  }).optional().nullable(),
});

export type Transaction = z.infer<typeof transactionSchema>;
