import { z } from 'zod';
import { paymentMethodEnum } from './types';

export const transactionFilterSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'ALL']),
  method: z.enum(['CASH', 'BANK', 'GCASH', 'OTHER']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  searchTerm: z.string().optional()
});

export type TransactionFilterSchema = typeof transactionFilterSchema;
export type TransactionFilterData = z.infer<TransactionFilterSchema>;
