import { z } from "zod";

export const leaseStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'TERMINATED',
  'EXPIRED'
]);
export const deleteLeaseSchema = z.object({
  id: z.number({
    required_error: 'Floor ID is required',
    invalid_type_error: 'Invalid floor ID'
  }).positive('Invalid floor ID')
});

export type DeleteLeaseSchema = typeof deleteLeaseSchema


export type LeaseStatus = z.infer<typeof leaseStatusEnum>;

export const unitTypeEnum = {
  Values: {
    BEDSPACER: 'BEDSPACER',
    PRIVATE_ROOM: 'PRIVATE_ROOM'
  },
  options: ['BEDSPACER', 'PRIVATE_ROOM'] as const
} as const;

export const leaseSchema = z.object({
  id: z.coerce.number().optional(),
  tenantIds: z.array(z.number()).min(1, 'At least one tenant must be selected'),
  rental_unit_id: z.coerce.number().min(1, 'A rental unit must be selected'),
  name: z.string().optional(),
  status: leaseStatusEnum,
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' }),
  terms_month: z.coerce.number().int().min(1).max(60),
  security_deposit: z.coerce.number().min(0),
  rent_amount: z.coerce.number().min(0),
  prorated_first_month: z.boolean().default(false),
  prorated_amount: z.number().nullable().optional(),
  notes: z.string().max(1000).optional().nullable(),
  balance: z.coerce.number().optional(),
  unit_type: z.enum(['BEDSPACER', 'PRIVATE_ROOM'])
});

export type FormSchema = typeof leaseSchema;
