import { z } from 'zod';

export const tenantSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required'),
  contact_number: z.string().optional(),
  email: z.string().email('Invalid email address').optional().nullable(),
  auth_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export const leaseTenantSchema = z.object({
  id: z.number().optional(),
  lease_id: z.number().int().positive(),
  tenant_id: z.number().int().positive(),
  created_at: z.string().optional()
});

export type Tenant = z.infer<typeof tenantSchema>;
export type LeaseTenant = z.infer<typeof leaseTenantSchema>;
