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
  id: z.string().optional(),
  tenantIds: z.array(z.string()).min(1, 'At least one tenant must be selected'),
  locationId: z.string().min(1, 'a Location must be selected'),
  leaseStatus: leaseStatusEnum,
  leaseType: leaseTypeEnum,
  leaseStartDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' })
    .refine(val => val.trim() !== '', { message: 'Date is required' }),
  leaseEndDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' })
    .refine(val => val.trim() !== '', { message: 'Date is required' }),
  leaseTerminateDate: z.string().optional().nullable(),
  leaseTermsMonth: z.number().int().min(1).max(60),
  leaseSecurityDeposit: z.number().min(0).optional(),
  leaseRentRate: z.number().min(0),
  leaseNotes: z.string().max(1000).optional(),
  createdBy: z.string().optional(),
});

export type FormSchema = typeof leaseSchema;
