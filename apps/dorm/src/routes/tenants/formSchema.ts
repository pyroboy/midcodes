import { z } from "zod";

// Enum for tenant status matching the PostgreSQL enum
export const TenantStatusEnum = z.enum([
    'ACTIVE',
    'INACTIVE',
    'PENDING',
    'BLACKLISTED'
]);


export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  address: string;
}




export const defaultEmergencyContact: {
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  address: string;
} = {
  name: '',
  relationship: '',
  phone: '',
  email: null, // Now explicitly string | null
  address: ''
};


// Emergency contact schema
export const emergencyContactSchema = z.object({
    name: z.string().min(1, 'Emergency contact name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phone: z.string().min(1, 'Phone number is required'),
    email: z.string().email('Invalid email').nullable(),
    address: z.string().min(1, 'Address is required')
});

// Base tenant type definition
export interface BaseTenant {
  id: number;
  name: string;
  contact_number: string | null;
  email: string | null;
  tenant_status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED';
  auth_id: string | null;
  updated_at: string | null;
  created_by: string | null;
  emergency_contact: EmergencyContact | null;
}

// Lease relationship types
export interface LeaseWithRelations {
  id: string;
  type: 'BEDSPACER' | 'PRIVATEROOM';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'TERMINATED';
  start_date: string;
  end_date: string;
  rent_amount: number;
  security_deposit: number;
  balance: number;
  notes: string | null;
  tenant: {
    id: string;
  };
  location: {
    id: string;
    number: string;
    property: {
      id: string;
      name: string;
    } | null;
  } | null;
}

// Extended tenant type with lease information
export interface TenantWithLease extends BaseTenant {
  lease: LeaseWithRelations | null;
  status?: string;
  start_date?: string;
  end_date?: string;
  outstanding_balance?: number;
}

// Schema for creating a new tenant
export const tenantSchema = z.object({
  id: z.number(),
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  contact_number: z.string()
    .nullable()
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .nullable()
    .optional(),
  tenant_status: TenantStatusEnum
    .default('PENDING'),
  auth_id: z.string()
    .uuid('Invalid UUID format')
    .nullable()
    .optional(),
  created_by: z.string()
    .uuid('Invalid UUID format')
    .nullable()
    .optional(),
  emergency_contact: emergencyContactSchema
    .optional()
    .nullable()
});

// Schema for updating an existing tenant
export const updateTenantSchema = tenantSchema.partial();

// Schema for tenant response (including system-generated fields)
export const tenantResponseSchema = tenantSchema.extend({
    id: z.number(),
    updated_at: z.string().datetime().nullable().optional()
});

// Schema specifically for the form
export const tenantFormSchema = z.object({
  id: z.number(),
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  contact_number: z.string()
    .min(1, 'Contact number is required')
    .nullable()
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .nullable()
    .optional(),
  tenant_status: TenantStatusEnum
    .default('PENDING'),
  auth_id: z.string()
    .uuid('Invalid UUID format')
    .nullable()
    .optional(),
  created_by: z.string()
    .uuid('Invalid UUID format')
    .nullable()
    .optional(),
  emergency_contact: emergencyContactSchema
    .nullable(),
  lease_status: z.string().optional(),
  lease_type: z.string().optional(),
  lease_id: z.number().nullable().optional(),
  location_id: z.number().nullable().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  rent_amount: z.number().optional(),
  security_deposit: z.number().optional(),
  outstanding_balance: z.number().optional(),
  notes: z.string().optional(),
  last_payment_date: z.string().nullable().optional(),
  next_payment_due: z.string().nullable().optional(),
  payment_schedules: z.array(z.any()).optional(),
  status_history: z.array(z.any()).optional(),
  status_change_reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .nullable()
    .optional()
});

// Export type definitions
export type CreateTenantInput = z.infer<typeof tenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type TenantResponse = z.infer<typeof tenantResponseSchema>;
export type TenantFormData = z.infer<typeof tenantFormSchema>;

// Validation helper functions
export const validateTenantForm = (data: unknown) => {
    return tenantFormSchema.safeParse(data);
};

// Transform form data to database input
export const transformFormToDbInput = (formData: TenantFormData): CreateTenantInput => {
    return {
      id: formData.id,
      name: formData.name,
      contact_number: formData.contact_number,
      email: formData.email,
      emergency_contact: formData.emergency_contact || null,
      tenant_status: 'PENDING',
    };
};

// Re-export everything in a single object
export const TenantSchemas = {
    tenantSchema,
    tenantFormSchema,
    updateTenantSchema,
    tenantResponseSchema,
    emergencyContactSchema,
    TenantStatusEnum,
    validateTenantForm,
    transformFormToDbInput
} as const;