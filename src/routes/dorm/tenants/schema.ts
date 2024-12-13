import { z } from 'zod';

export const tenantSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, 'Name is required'),
    contact_number: z.string().optional(),
    email: z.string().email().optional().nullable(),
});

export const leaseTenantSchema = z.object({
    lease_id: z.number().int().positive(),
    tenant_id: z.number().int().positive(),
});

export type Tenant = z.infer<typeof tenantSchema>;
export type LeaseTenant = z.infer<typeof leaseTenantSchema>;
