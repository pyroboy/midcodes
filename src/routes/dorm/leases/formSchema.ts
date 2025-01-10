import { z } from "zod";

export const leaseStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'TERMINATED',
  'EXPIRED'
]);

export const leaseTypeEnum = z.enum([
  'MONTHLY',
  'QUARTERLY',
  'SEMI_ANNUAL',
  'ANNUAL'
]);

export type LeaseStatus = z.infer<typeof leaseStatusEnum>;
export type LeaseType = z.infer<typeof leaseTypeEnum>;

export const leaseSchema = z.object({
  id: z.coerce.number().optional(),
  tenantIds: z.array(z.number()).min(1, 'At least one tenant must be selected'),
  rental_unit_id: z.coerce.number().min(1, 'A rental unit must be selected'),
  name: z.string().min(1, 'Name is required'),
  status: leaseStatusEnum,
  type: leaseTypeEnum,
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' })
    .refine(val => val.trim() !== '', { message: 'Date is required' }),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' })
    .refine(val => val.trim() !== '', { message: 'Date is required' }),
  terms_month: z.coerce.number().int().min(1).max(60),
  security_deposit: z.coerce.number().min(0),
  rent_amount: z.coerce.number().min(0),
  notes: z.string().max(1000).optional(),
  balance: z.coerce.number().optional().default(0),
});

export type FormSchema = typeof leaseSchema;
