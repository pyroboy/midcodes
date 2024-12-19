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

export const schema = z.object({
  id: z.number().optional(),
  tenantIds: z.array(z.number()).min(1, 'At least one tenant must be selected'),
  locationId: z.number().min(1, 'a Location must be selected'),
  leaseStatus: leaseStatusEnum,
  leaseType: leaseTypeEnum,
  leaseStartDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' })
    .refine(val => val.trim() !== '', { message: 'Date is required' }),
  leaseEndDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' })
    .refine(val => val.trim() !== '', { message: 'Date is required' }),
  leaseTerminateDate: z.string().optional().nullable(),
  leaseTermsMonth: z.coerce.number().int().min(1).max(60),
  leaseSecurityDeposit: z.coerce.number().min(0).optional(),
  leaseRentRate: z.coerce.number().min(0),
  leaseNotes: z.string().max(1000).optional(),
  createdBy: z.number().optional(),
});

export type FormSchema = typeof schema;
