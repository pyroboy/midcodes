import { z } from 'zod';

export const securityDepositSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  lease_id: z.coerce.number().int().positive('Lease ID must be a positive number'),
  billing_id: z.coerce.number().int().positive().optional(),
  type: z.literal('SECURITY_DEPOSIT'),
  amount: z.coerce.number().positive('Amount must be positive'),
  due_date: z.string().min(1, 'Due date is required'),
  billing_date: z.string().min(1, 'Billing date is required'),
  notes: z.string().optional()
});

export type SecurityDepositForm = z.infer<typeof securityDepositSchema>; 