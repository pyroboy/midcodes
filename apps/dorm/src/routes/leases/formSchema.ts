import { z } from "zod";

export const leaseStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'TERMINATED',
  'EXPIRED'
]);

export const deleteLeaseSchema = z.object({
  id: z.number({
    required_error: 'Lease ID is required',
    invalid_type_error: 'Invalid lease ID'
  }).positive('Invalid lease ID')
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
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format' })
    .optional(),
  terms_month: z.coerce.number().int().min(0).max(60), // Allow 0 for no end date
  prorated_first_month: z.boolean().default(false),
  prorated_amount: z.number().nullable().optional(),
  notes: z.string().max(1000).optional().nullable(),
  balance: z.coerce.number().optional(),
  unit_type: z.enum(['BEDSPACER', 'PRIVATE_ROOM'])
});

// Updated validation to match frontend logic
export const leaseSchemaWithValidation = leaseSchema.refine(
  (data) => {
    if (data.end_date && data.start_date && data.terms_month > 0) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const calculatedEnd = new Date(start);
      calculatedEnd.setMonth(calculatedEnd.getMonth() + data.terms_month);
      
      // Allow end_date to be within 1 day of calculated date (for month boundary issues)
      const diffDays = Math.abs((end.getTime() - calculatedEnd.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 1;
    }
    return true;
  },
  {
    message: "End date should match the calculated date based on terms",
    path: ["end_date"]
  }
);

export type FormSchema = typeof leaseSchema;

