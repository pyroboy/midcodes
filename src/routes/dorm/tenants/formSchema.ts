import { z } from 'zod';

export const tenantStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'PENDING',
  'BLACKLISTED'
]);

export const tenantSchema = z.object({
  id: z.number().optional(),
  property_id: z.number(),
  room_id: z.number(),
  user_id: z.string().uuid(), 
  tenant_status: tenantStatusEnum,
  contract_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  contract_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  monthly_rate: z.number().min(0, 'Monthly rate must be 0 or greater'),
  security_deposit: z.number().min(0, 'Security deposit must be 0 or greater'),
  emergency_contact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
    address: z.string().optional()
  }).optional().nullable(),
  notes: z.string().optional().nullable(),
  created_by: z.string().uuid() 
});

export type TenantSchema = typeof tenantSchema;
