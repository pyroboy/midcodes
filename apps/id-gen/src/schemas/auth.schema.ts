import { z } from 'zod';

// User role schema
export const userRoleSchema = z.enum(['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user']);

// Authentication schemas
export const loginSchema = z.object({
	email: z.string().email('Valid email is required'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	remember: z.boolean().optional()
});

export const registerSchema = z.object({
	email: z.string().email('Valid email is required'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	confirm_password: z.string(),
	name: z.string().min(1, 'Name is required').max(100),
	org_name: z.string().min(1, 'Organization name is required').max(100).optional(),
	terms_accepted: z.boolean().refine(val => val === true, 'Terms must be accepted')
}).refine(data => data.password === data.confirm_password, {
	message: "Passwords don't match",
	path: ['confirm_password']
});

export const forgotPasswordSchema = z.object({
	email: z.string().email('Valid email is required')
});

export const resetPasswordSchema = z.object({
	token: z.string().min(1, 'Reset token is required'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	confirm_password: z.string()
}).refine(data => data.password === data.confirm_password, {
	message: "Passwords don't match",
	path: ['confirm_password']
});

// User profile schemas (profiles table)
export const userProfileSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	role: userRoleSchema,
	created_at: z.string().datetime(),
	updated_at: z.string().datetime(),
	org_id: z.string().uuid().nullable(),
	context: z.record(z.string(), z.any()).nullable(),
	credits_balance: z.number().default(0),
	card_generation_count: z.number().default(0),
	template_count: z.number().default(0),
	unlimited_templates: z.boolean().default(false),
	remove_watermarks: z.boolean().default(false)
});

export const userProfileUpdateSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email().optional(),
	role: userRoleSchema.optional(),
	org_id: z.string().uuid().nullable().optional(),
	context: z.record(z.string(), z.any()).optional(),
	credits_balance: z.number().optional(),
	unlimited_templates: z.boolean().optional(),
	remove_watermarks: z.boolean().optional()
});

// User roles assignment schemas (user_roles table)
export const userRoleAssignmentSchema = z.object({
	id: z.number().optional(),
	user_id: z.string().uuid(),
	role: userRoleSchema
});

// Role permissions schemas (role_permissions table)  
export const rolePermissionSchema = z.object({
	id: z.number().optional(),
	role: userRoleSchema,
	permission: z.enum([
		// Template permissions
		'template:create',
		'template:read',
		'template:update',
		'template:delete',
		'template:publish',
		
		// ID Card permissions
		'idcard:create',
		'idcard:read',
		'idcard:update',
		'idcard:delete',
		'idcard:bulk_ops',
		
		// Organization permissions
		'org:read',
		'org:update',
		'org:manage_users',
		'org:manage_settings',
		'org:view_stats',
		
		// Admin permissions
		'admin:manage_all_orgs',
		'admin:impersonate',
		'admin:system_settings',
		'admin:audit_logs',
		
		// Billing permissions
		'billing:view',
		'billing:manage'
	])
});

// Session management schemas
export const sessionSchema = z.object({
	user: userProfileSchema,
	access_token: z.string(),
	refresh_token: z.string(),
	expires_at: z.string().datetime()
});

export const authStateSchema = z.object({
	user: userProfileSchema.nullable(),
	session: sessionSchema.nullable(),
	is_loading: z.boolean(),
	is_authenticated: z.boolean()
});

// Permission check schema
export const permissionCheckSchema = z.object({
	user_id: z.string().uuid(),
	permission: rolePermissionSchema.shape.permission,
	resource_id: z.string().uuid().optional(), // For resource-specific permissions
	org_id: z.string().uuid().optional() // For organization-scoped permissions
});

// User invitation schema
export const userInvitationSchema = z.object({
	email: z.string().email(),
	role: userRoleSchema,
	org_id: z.string().uuid(),
	invited_by: z.string().uuid(),
	expires_at: z.string().datetime().optional(),
	message: z.string().max(500).optional()
});

// User credit management schema
export const creditTransactionSchema = z.object({
	user_id: z.string().uuid(),
	amount: z.number(), // Positive for credits, negative for debits
	type: z.enum(['purchase', 'bonus', 'usage', 'refund', 'adjustment']),
	description: z.string().max(200),
	reference_id: z.string().optional(), // Reference to related entity (e.g., ID card ID)
	created_at: z.string().datetime().optional()
});

// Account settings schemas
export const changePasswordSchema = z.object({
	current_password: z.string().min(8),
	new_password: z.string().min(8),
	confirm_password: z.string()
}).refine(data => data.new_password === data.confirm_password, {
	message: "Passwords don't match",
	path: ['confirm_password']
});

export const updateAccountSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	email: z.string().email().optional(),
	avatar_url: z.string().url().optional(),
	notification_preferences: z.object({
		email_notifications: z.boolean().default(true),
		marketing_emails: z.boolean().default(false),
		security_alerts: z.boolean().default(true)
	}).optional()
});

export const deleteAccountSchema = z.object({
	confirmation: z.literal('DELETE'),
	password: z.string().min(8),
	reason: z.enum(['not_useful', 'too_expensive', 'missing_features', 'other']).optional(),
	feedback: z.string().max(500).optional()
});

// Two-factor authentication schemas
export const enable2FASchema = z.object({
	password: z.string().min(8),
	backup_codes: z.array(z.string()).optional()
});

export const verify2FASchema = z.object({
	code: z.string().length(6, '2FA code must be 6 digits'),
	backup_code: z.string().optional()
});

// Inferred types for export
export type UserRole = z.infer<typeof userRoleSchema>;
export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UserProfileUpdate = z.infer<typeof userProfileUpdateSchema>;
export type UserRoleAssignment = z.infer<typeof userRoleAssignmentSchema>;
export type RolePermission = z.infer<typeof rolePermissionSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type AuthState = z.infer<typeof authStateSchema>;
export type PermissionCheck = z.infer<typeof permissionCheckSchema>;
export type UserInvitation = z.infer<typeof userInvitationSchema>;
export type CreditTransaction = z.infer<typeof creditTransactionSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type UpdateAccount = z.infer<typeof updateAccountSchema>;
export type DeleteAccount = z.infer<typeof deleteAccountSchema>;
export type Enable2FA = z.infer<typeof enable2FASchema>;
export type Verify2FA = z.infer<typeof verify2FASchema>;