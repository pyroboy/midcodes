import { z } from 'zod';

// Enum for tenant status matching the PostgreSQL enum
export const TenantStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'BLACKLISTED']);

export interface EmergencyContact {
	name?: string;
	relationship?: string;
	phone?: string;
	email: string | null;
	address?: string;
}

export const defaultEmergencyContact: EmergencyContact = {
	name: '',
	relationship: '',
	phone: '',
	email: '',
	address: ''
};

// Emergency contact schema - Fixed validation
export const emergencyContactSchema = z
	.object({
		name: z.string().optional(),
		relationship: z.string().optional(),
		phone: z.string().optional(),
		email: z
			.string()
			.optional()
			.nullable()
			.refine((val) => !val || val.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
				message: 'Invalid email format'
			})
			.transform((val) => (val === '' ? null : val)), // Transform empty string to null
		address: z.string().optional()
	})
	.nullable()
	.optional();

// Base tenant type definition
export interface BaseTenant {
	id: number;
	name: string;
	contact_number: string | null;
	email: string | null;
  address?: string | null;
	tenant_status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED';
	auth_id: string | null;
	updated_at: string | null;
	created_by: string | null;
	emergency_contact: EmergencyContact | null;
	profile_picture_url?: string | null;
  // Additional optional fields
  school_or_workplace?: string | null;
  facebook_name?: string | null;
  /** Stored as ISO date string (YYYY-MM-DD) */
  birthday?: string | null;
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
	name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
	contact_number: z.string().nullable().optional(),
	email: z
		.string()
		.max(255, 'Email must be less than 255 characters')
		.refine((val) => !val || val.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
			message: 'Invalid email address'
		})
		.nullable()
		.optional(),
	tenant_status: TenantStatusEnum.default('PENDING'),
	auth_id: z.string().uuid('Invalid UUID format').nullable().optional(),
	created_by: z.string().uuid('Invalid UUID format').nullable().optional(),
	emergency_contact: emergencyContactSchema,
	profile_picture_url: z
		.string()
		.nullable()
		.optional()
		.refine((val) => !val || val.trim() === '' || /^https?:\/\/.+/.test(val), {
			message: 'Invalid URL format'
		})
})
.extend({
  address: z
    .string()
    .max(500, 'Must be less than 500 characters')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v?.trim() ?? null)),
  school_or_workplace: z
    .string()
    .max(255, 'Must be less than 255 characters')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v?.trim() ?? null)),
  facebook_name: z
    .string()
    .max(255, 'Must be less than 255 characters')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v?.trim() ?? null)),
  birthday: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim() === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: 'Invalid date format' }
    )
    .transform((val) => (val === '' ? null : val))
});

// Schema for updating an existing tenant
export const updateTenantSchema = tenantSchema.partial();

// Schema specifically for the form - includes flat emergency contact fields
export const tenantFormSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
	contact_number: z.string().nullable().optional(),
	email: z
		.string()
		.max(255, 'Email must be less than 255 characters')
		.optional()
		.nullable()
		.refine((val) => !val || val.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
			message: 'Invalid email format'
		})
		.transform((val) => (val === '' ? null : val)), // Transform empty string to null
	tenant_status: TenantStatusEnum.default('PENDING'),
	auth_id: z.string().uuid('Invalid UUID format').nullable().optional(),
	created_by: z.string().uuid('Invalid UUID format').nullable().optional(),
  address: z
    .string()
    .max(500, 'Must be less than 500 characters')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v?.trim() ?? null)),
  // New flat fields
  school_or_workplace: z
    .string()
    .max(255, 'Must be less than 255 characters')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v?.trim() ?? null)),
  facebook_name: z
    .string()
    .max(255, 'Must be less than 255 characters')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v?.trim() ?? null)),
  birthday: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim() === '' || /^\d{4}-\d{2}-\d{2}$/.test(val),
      { message: 'Invalid date format' }
    )
    .transform((val) => (val === '' ? null : val)),
	// Flat emergency contact fields for form handling
	'emergency_contact.name': z.string().optional(),
	'emergency_contact.relationship': z.string().optional(),
	'emergency_contact.phone': z.string().optional(),
	'emergency_contact.email': z
		.string()
		.optional()
		.nullable()
		.refine((val) => !val || val.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
			message: 'Invalid email format'
		})
		.transform((val) => (val === '' ? null : val)),
	'emergency_contact.address': z.string().optional(),
	// Keep the nested object for backward compatibility
	emergency_contact: emergencyContactSchema,
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
	status_change_reason: z
		.string()
		.max(500, 'Reason must be less than 500 characters')
		.nullable()
		.optional(),
	profile_picture_url: z
		.string()
		.nullable()
		.optional()
		.refine((val) => !val || val.trim() === '' || /^https?:\/\/.+/.test(val), {
			message: 'Invalid URL format'
		})
});

// Schema for tenant response (including system-generated fields)
export const tenantResponseSchema = tenantFormSchema
	.extend({
		id: z.number(),
		updated_at: z.string().datetime().nullable().optional()
	})
	.required();

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
export const transformFormToDbInput = (formData: TenantFormData): Omit<CreateTenantInput, 'id'> => {
	// Parse emergency contact from flat fields
	const emergencyContact = parseEmergencyContactFromForm(formData);

	return {
		name: formData.name,
		contact_number: formData.contact_number,
		email: formData.email,
		address: formData.address ?? null,
		emergency_contact: emergencyContact,
		tenant_status: formData.tenant_status || 'PENDING',
		school_or_workplace: formData.school_or_workplace ?? null,
		facebook_name: formData.facebook_name ?? null,
		birthday: formData.birthday ?? null,
		profile_picture_url: formData.profile_picture_url ?? null
	};
};

// Helper function to parse emergency contact from form data
export const parseEmergencyContactFromForm = (
	formData: TenantFormData
): EmergencyContact | null => {
	const name =
		(formData as any)['emergency_contact.name'] || formData.emergency_contact?.name || '';
	const relationship =
		(formData as any)['emergency_contact.relationship'] ||
		formData.emergency_contact?.relationship ||
		'';
	const phone =
		(formData as any)['emergency_contact.phone'] || formData.emergency_contact?.phone || '';
	const email =
		(formData as any)['emergency_contact.email'] || formData.emergency_contact?.email || '';
	const address =
		(formData as any)['emergency_contact.address'] || formData.emergency_contact?.address || '';

	// Only create emergency contact object if at least one field has data
	if (name?.trim() || relationship?.trim() || phone?.trim() || email?.trim() || address?.trim()) {
		return {
			name: name?.trim() || '',
			relationship: relationship?.trim() || '',
			phone: phone?.trim() || '',
			email: email?.trim() || null,
			address: address?.trim() || ''
		};
	}

	return null;
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
	transformFormToDbInput,
	parseEmergencyContactFromForm
} as const;
