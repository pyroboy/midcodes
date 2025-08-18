import { z } from 'zod';

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
	totalUsers: z.number(),
	totalTemplates: z.number()
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

// TypeScript types
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
