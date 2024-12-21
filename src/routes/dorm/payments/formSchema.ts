import { z } from 'zod';

export const paymentMethodEnum = z.enum([
  'CASH',
  'BANK',
  'GCASH',
  'OTHER'
] as const);

export const paymentStatusEnum = z.enum([
  'PENDING',
  'PARTIAL',
  'PAID',
  'OVERDUE'
] as const);

export const billingTypeEnum = z.enum([
  'RENT',
  'UTILITY',
  'PENALTY',
  'MAINTENANCE',
  'SERVICE'
] as const);

export const utilityTypeEnum = z.enum([
  'ELECTRICITY',
  'WATER',
  'INTERNET'
] as const);

export const userRoleEnum = z.enum([
  'super_admin',
  'org_admin',
  'user',
  'event_admin',
  'event_qr_checker',
  'property_admin',
  'property_manager',
  'property_accountant',
  'property_maintenance',
  'property_utility',
  'property_frontdesk',
  'property_tenant',
  'property_guest',
  'id_gen_admin',
  'id_gen_user'
]);

export const paymentSchema = z.object({
  id: z.number().optional(),
  billing_id: z.number(),
  amount: z.number()
    .min(0, 'Amount must be 0 or greater')
    .transform(val => Number(val.toFixed(2))),
  method: paymentMethodEnum,
  reference_number: z.string().optional().nullable(),
  receipt_url: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  paid_by: z.string().min(1, 'Paid by is required'),
  paid_at: z.string().datetime({ message: 'Must be a valid UTC datetime' }),
  notes: z.string().optional().nullable(),
  created_by: z.string().uuid().optional(),
  updated_by: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export type PaymentSchema = z.infer<typeof paymentSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;
export type BillingType = z.infer<typeof billingTypeEnum>;
export type UtilityType = z.infer<typeof utilityTypeEnum>;
export type UserRole = z.infer<typeof userRoleEnum>;
