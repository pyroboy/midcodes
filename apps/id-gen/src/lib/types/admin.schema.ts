import { z } from 'zod';

// ============================================================
// ROLE SCHEMAS
// ============================================================

export const roleSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	display_name: z.string().nullable(),
	description: z.string().nullable(),
	is_system: z.boolean(),
	org_id: z.string().uuid().nullable(),
	created_at: z.string(),
	updated_at: z.string().nullable()
});

export const rolePermissionSchema = z.object({
	id: z.number(),
	role: z.string(),
	permission: z.string(),
	role_id: z.string().uuid().nullable()
});

// Input schemas for roles
export const createRoleSchema = z.object({
	name: z.string().min(1).max(50),
	display_name: z.string().min(1).max(100),
	description: z.string().max(500).optional()
});

export const updateRoleSchema = z.object({
	roleId: z.string().uuid(),
	display_name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional()
});

export const deleteRoleSchema = z.object({
	roleId: z.string().uuid()
});

// Input schemas for permissions
export const assignPermissionSchema = z.object({
	role: z.string(),
	permission: z.string(),
	roleId: z.string().uuid().optional()
});

export const revokePermissionSchema = z.object({
	role: z.string(),
	permission: z.string()
});

export const bulkAssignPermissionsSchema = z.object({
	role: z.string(),
	permissions: z.array(z.string()),
	roleId: z.string().uuid().optional()
});

// Output schemas for roles
export const rolesDataSchema = z.object({
	roles: z.array(roleSchema),
	permissions: z.array(rolePermissionSchema),
	availablePermissions: z.array(z.string()),
	currentUserRole: z.string().optional()
});

// ============================================================
// USER SCHEMAS
// ============================================================

// Extended role enum with new roles
export const extendedUserRoleSchema = z.enum([
	'super_admin',
	'org_admin',
	'id_gen_super_admin',
	'id_gen_org_admin',
	'id_gen_admin',
	'id_gen_user',
	'id_gen_accountant',
	'id_gen_encoder',
	'id_gen_printer',
	'id_gen_viewer',
	'id_gen_template_designer',
	'id_gen_auditor'
]);

// Input schemas
export const addUserSchema = z.object({
	email: z.string().email(),
	role: z.enum(['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user']),
	name: z.string().optional()
});

export const updateUserRoleInputSchema = z.object({
	userId: z.string().uuid(),
	role: z.enum(['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'])
});

export const updateUserRoleSchema = updateUserRoleInputSchema;

export const deleteUserInputSchema = z.object({
	userId: z.string().uuid()
});

export const deleteUserSchema = deleteUserInputSchema;

export const getUsersInputSchema = z.object({
	org_id: z.string().uuid().optional()
});

export const userRoleSchema = z.enum(['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user']);

// Output schemas
export const userOutputSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	role: z.string(),
	created_at: z.string(),
	updated_at: z.string()
});

export const adminStatsOutputSchema = z.object({
	totalCards: z.number(),
	newCardsThisMonth: z.number(),
	newCardsToday: z.number().default(0),
	totalUsers: z.number(),
	totalTemplates: z.number(),
	totalCredits: z.number().default(0),
	creditsUsedToday: z.number().default(0),
	totalRevenue: z.number().default(0),
	paidInvoicesCount: z.number().default(0),
	totalTemplateAssets: z.number().default(0),
	publishedTemplateAssets: z.number().default(0),
	totalOrgs: z.number().default(0)
});

export const adminDashboardOutputSchema = z.object({
	stats: adminStatsOutputSchema,
	users: z.array(userOutputSchema),
	templates: z.array(
		z.object({
			id: z.string().uuid(),
			name: z.string(),
			created_at: z.string(),
			user_id: z.string().uuid()
		})
	),
	recentActivity: z.array(
		z.object({
			id: z.string(),
			type: z.enum(['card_generated', 'user_added']),
			description: z.string(),
			created_at: z.string()
		})
	),
	errors: z.object({
		users: z.string().nullable(),
		templates: z.string().nullable(),
		recentCards: z.string().nullable()
	})
});

// Additional schemas for compatibility
export const adminDashboardDataSchema = adminDashboardOutputSchema;
export const usersDataSchema = z.object({
	users: z.array(userOutputSchema),
	currentUserId: z.string().uuid().optional(),
	currentUserRole: z.string().optional()
});

export const adminActionResultSchema = z.object({
	success: z.boolean(),
	message: z.string().optional()
});

// TypeScript types - Users
export type AddUser = z.infer<typeof addUserSchema>;
export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;
export type DeleteUser = z.infer<typeof deleteUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleInputSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;
export type GetUsersInput = z.infer<typeof getUsersInputSchema>;
export type UserOutput = z.infer<typeof userOutputSchema>;
export type AdminStatsOutput = z.infer<typeof adminStatsOutputSchema>;
export type AdminDashboardOutput = z.infer<typeof adminDashboardOutputSchema>;
export type AdminDashboardData = z.infer<typeof adminDashboardDataSchema>;
export type UsersData = z.infer<typeof usersDataSchema>;
export type AdminActionResult = z.infer<typeof adminActionResultSchema>;

// TypeScript types - Roles & Permissions
export type Role = z.infer<typeof roleSchema>;
export type RolePermission = z.infer<typeof rolePermissionSchema>;
export type CreateRole = z.infer<typeof createRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type DeleteRole = z.infer<typeof deleteRoleSchema>;
export type AssignPermission = z.infer<typeof assignPermissionSchema>;
export type RevokePermission = z.infer<typeof revokePermissionSchema>;
export type BulkAssignPermissions = z.infer<typeof bulkAssignPermissionsSchema>;
export type RolesData = z.infer<typeof rolesDataSchema>;
export type ExtendedUserRole = z.infer<typeof extendedUserRoleSchema>;
