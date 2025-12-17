import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { auth } from '$lib/server/auth';
import { eq, desc, and, count, inArray, ne, gte, lt, sql } from 'drizzle-orm';

// Import schemas following AZPOS pattern
import {
	addUserSchema,
	updateUserRoleSchema,
	deleteUserSchema,
	userRoleSchema,
	adminDashboardDataSchema,
	usersDataSchema,
	adminActionResultSchema,
	rolesDataSchema,
	type AddUser,
	type UpdateUserRole,
	type DeleteUser,
	type AdminDashboardData,
	type UsersData,
	type AdminActionResult,
	type RolesData,
	type Role,
	type RolePermission
} from '$lib/types/admin.schema';

// Helper function to check admin permissions
// IMPORTANT: Check original role FIRST (for admins emulating non-admin roles)
async function requireAdminPermissions() {
	const { locals } = getRequestEvent();
	const { user, effectiveRoles, roleEmulation, org_id } = locals;

	const allowedRoles = ['super_admin', 'org_admin', 'id_gen_admin'];

	// Check original role first (if emulating, the admin should still have access)
	const originalRole = roleEmulation?.originalRole;
	const originalIsAdmin = originalRole && allowedRoles.includes(originalRole);

	// Then check effective roles
	const hasEffectiveRole = effectiveRoles?.some((r) => allowedRoles.includes(r));

	if (!originalIsAdmin && !hasEffectiveRole) {
		throw error(403, 'Access denied. Admin privileges required.');
	}

	// Use original role if admin, otherwise use effective role
	const userRole = originalIsAdmin ? originalRole : effectiveRoles?.[0];
	return { user: { ...user, role: userRole } as any, org_id };
}

// Helper function to check specific admin permissions for user management
async function requireUserManagementPermissions() {
	const { locals } = getRequestEvent();
	const { user, effectiveRoles, roleEmulation, org_id } = locals;

	const allowedRoles = ['super_admin', 'org_admin'];

	// Check original role first
	const originalRole = roleEmulation?.originalRole;
	const originalIsAdmin = originalRole && allowedRoles.includes(originalRole);

	// Then check effective roles
	const hasEffectiveRole = effectiveRoles?.some((r) => allowedRoles.includes(r));

	if (!originalIsAdmin && !hasEffectiveRole) {
		throw error(403, 'Insufficient permissions for user management.');
	}

	const userRole = originalIsAdmin ? originalRole : effectiveRoles?.[0];
	return { user: { ...user, role: userRole } as any, org_id };
}

// Helper function to check super admin permissions
async function requireSuperAdminPermissions() {
	const { locals } = getRequestEvent();
	const { user, effectiveRoles, roleEmulation, org_id } = locals;

	// Check original role first
	const originalIsSuperAdmin = roleEmulation?.originalRole === 'super_admin';

	// Then check effective roles
	const hasEffectiveRole = effectiveRoles?.includes('super_admin');

	if (!originalIsSuperAdmin && !hasEffectiveRole) {
		throw error(403, 'Super admin privileges required.');
	}

	return { user: { ...user, role: 'super_admin' } as any, org_id };
}

// Query functions
export const getAdminDashboardData = query(async (): Promise<AdminDashboardData> => {
	const { org_id } = await requireAdminPermissions();

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	try {
		// Date ranges
		const now = new Date();
		const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		// Get organization stats using Drizzle
		const [
			totalCardsResult,
			cardsTodayResult,
			usersData,
			templatesData,
			recentCardsData,
			creditStats,
			creditTransactions,
			paidInvoices,
			totalTemplateAssetsResult,
			publishedTemplateAssetsResult,
			totalOrgsResult
		] = await Promise.all([
			// Total cards count
			db.select({ count: count() }).from(schema.idcards).where(eq(schema.idcards.orgId, org_id)),

			// Cards generated today
			db.select({ count: count() })
				.from(schema.idcards)
				.where(
					and(
						eq(schema.idcards.orgId, org_id),
						gte(schema.idcards.createdAt, startOfToday)
					)
				),

			// All users in organization
			db.select({
					id: schema.profiles.id,
					email: schema.profiles.email,
					role: schema.profiles.role,
					created_at: schema.profiles.createdAt,
					updated_at: schema.profiles.updatedAt
				})
				.from(schema.profiles)
				.where(eq(schema.profiles.orgId, org_id))
				.orderBy(desc(schema.profiles.createdAt)),

			// All templates in organization
			db.select({
					id: schema.templates.id,
					name: schema.templates.name,
					created_at: schema.templates.createdAt,
					user_id: schema.templates.userId
				})
				.from(schema.templates)
				.where(eq(schema.templates.orgId, org_id))
				.orderBy(desc(schema.templates.createdAt)),

			// Recent card generations
			db.select({
					id: schema.idcards.id,
					template_id: schema.idcards.templateId,
					created_at: schema.idcards.createdAt,
					data: schema.idcards.data
				})
				.from(schema.idcards)
				.where(eq(schema.idcards.orgId, org_id))
				.orderBy(desc(schema.idcards.createdAt))
				.limit(10),

			// Credit stats
			db.select({ credits_balance: schema.profiles.creditsBalance })
				.from(schema.profiles)
				.where(eq(schema.profiles.orgId, org_id)),

			// Today's credit usage
			db.select({ amount: schema.creditTransactions.amount })
				.from(schema.creditTransactions)
				.where(
					and(
						eq(schema.creditTransactions.orgId, org_id),
						lt(schema.creditTransactions.amount, 0),
						gte(schema.creditTransactions.createdAt, startOfToday)
					)
				),

			// Revenue
			db.select({ total_amount: schema.paymentRecords.amountPhp }) // Corrected to paymentRecords
				.from(schema.paymentRecords)
				.where(
					and(
						eq(schema.paymentRecords.status, 'paid')
						// Assuming paymentRecords don't have orgId for now or should be filtered by user profiles
					)
				),

			// Total template assets
			db.select({ count: count() }).from(schema.templateAssets),

			// Published template assets
			db.select({ count: count() })
				.from(schema.templateAssets)
				.where(eq(schema.templateAssets.isPublished, true)),

			// Total organizations
			db.select({ count: count() }).from(schema.organizations)
		]);

		const totalCards = totalCardsResult[0]?.count || 0;
		const cardsToday = cardsTodayResult[0]?.count || 0;
		const totalTemplateAssets = totalTemplateAssetsResult[0]?.count || 0;
		const publishedTemplateAssets = publishedTemplateAssetsResult[0]?.count || 0;
		const totalOrgs = totalOrgsResult[0]?.count || 0;

		// Calculate stats
		const totalCredits = creditStats.reduce((sum, p) => sum + (p.credits_balance || 0), 0) || 0;
		const creditsUsedToday = Math.abs(
			creditTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
		);
		const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
		const paidInvoicesCount = paidInvoices.length || 0;

		// Calculate new cards this month
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const newCardsThisMonth = recentCardsData.filter(card => card.created_at && card.created_at >= startOfMonth).length || 0;

		// Create recent activity
		const recentActivity = recentCardsData.map((card) => ({
			id: card.id,
			type: 'card_generated' as const,
			description: `ID card generated for ${(card.data as any)?.name || (card.data as any)?.full_name || 'Unknown'}`,
			created_at: card.created_at?.toISOString() || ''
		})).slice(0, 5);

		// Add user registration activities
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		const recentUsers = usersData
			.filter((u) => u.created_at && u.created_at >= sevenDaysAgo)
			.map((u) => ({
				id: `user_${u.id}`,
				type: 'user_added' as const,
				description: `New user registered: ${u.email}`,
				created_at: u.created_at?.toISOString() || ''
			}));

		// Combine and sort activities
		const allActivities = [...recentActivity, ...recentUsers]
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			.slice(0, 10);

		return {
			stats: {
				totalCards,
				newCardsThisMonth,
				newCardsToday: cardsToday,
				totalUsers: usersData.length,
				totalTemplates: templatesData.length,
				totalCredits,
				creditsUsedToday,
				totalRevenue,
				paidInvoicesCount,
				totalTemplateAssets,
				publishedTemplateAssets,
				totalOrgs
			},
			users: usersData.map(u => ({
                id: u.id,
                email: u.email || '',
                role: u.role || 'user',
                created_at: u.created_at?.toISOString() || '',
                updated_at: u.updated_at?.toISOString() || ''
            })),
			templates: templatesData.map(t => ({
                id: t.id,
                name: t.name,
                created_at: t.created_at?.toISOString() || '',
                user_id: t.user_id || ''
            })),
			recentActivity: allActivities,
			errors: {
				users: null,
				templates: null,
				recentCards: null
			}
		};
	} catch (err) {
		console.error('Error loading admin dashboard data:', err);
		throw error(500, 'Failed to load dashboard data');
	}
});

export const getUsersData = query(async (): Promise<UsersData> => {
	const { user, org_id } = await requireAdminPermissions();

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	try {
		// Get all users in the organization using Drizzle
		const users = await db.select({
				id: schema.profiles.id,
				email: schema.profiles.email,
				role: schema.profiles.role,
				created_at: schema.profiles.createdAt,
				updated_at: schema.profiles.updatedAt
			})
			.from(schema.profiles)
			.where(eq(schema.profiles.orgId, org_id))
			.orderBy(desc(schema.profiles.createdAt));

		return {
			users: users.map(u => ({
				id: u.id,
				email: u.email || '',
				role: u.role || 'user',
				created_at: u.created_at?.toISOString() || '',
				updated_at: u.updated_at?.toISOString() || ''
			})),
			currentUserId: user?.id,
			currentUserRole: user?.role
		};
	} catch (err) {
		console.error('Error loading user management data:', err);
		throw error(500, 'Failed to load user management data');
	}
});

// Command functions
export const addUser = command('unchecked', async ({ email, role }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();

	try {
		// Validate role
		const validRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
		if (!validRoles.includes(role)) {
			throw error(400, 'Invalid role specified');
		}

		// Check if user already exists in profiles
		const [existingUser] = await db.select({ id: schema.profiles.id })
			.from(schema.profiles)
			.where(and(eq(schema.profiles.email, email), eq(schema.profiles.orgId, org_id!)))
			.limit(1);

		if (existingUser) {
			throw error(400, 'User with this email already exists in your organization');
		}

		// Create user via Better Auth Admin API
		const result = await auth.api.createUser({
			headers: getRequestEvent().request.headers,
			body: {
				email,
				password: Math.random().toString(36).slice(-12),
				name: email.split('@')[0],
				role, // Better Auth Admin plugin role
				data: {
					org_id: org_id,
					invited_by: user.id
				}
			}
		});

		if (!result) {
			throw error(500, 'Failed to create user via Better Auth');
		}

		// Note: The database hook in auth.ts handles profile creation automatically
		// but it won't have the org_id and role. We need to update it.
		await db.update(schema.profiles)
			.set({
				orgId: org_id,
				role: role
			})
			.where(eq(schema.profiles.id, result.user.id));

		// Refresh the users query
		await getUsersData().refresh();

		return {
			success: true,
			message: `User ${email} added successfully.`
		};
	} catch (err) {
		console.error('Error in addUser command:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

export const updateUserRole = command('unchecked', async ({ userId, role }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();

	if (!org_id) {
		throw error(500, 'Organization context missing');
	}

	try {
		// Validate the new role
		const validRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
		if (!validRoles.includes(role)) {
			throw error(400, 'Invalid role specified');
		}

		// Prevent self role changes to lower privilege (safety check)
		if (userId === user.id && user.role === 'super_admin' && role !== 'super_admin') {
			throw error(400, 'Cannot downgrade your own super admin role');
		}

		// Get current user to check permissions
		const [targetUser] = await db.select({ role: schema.profiles.role })
			.from(schema.profiles)
			.where(and(eq(schema.profiles.id, userId), eq(schema.profiles.orgId, org_id)))
			.limit(1);

		if (!targetUser) {
			throw error(500, 'Failed to find user');
		}

		// Only super_admin can modify super_admin roles
		if (targetUser.role === 'super_admin' && user.role !== 'super_admin') {
			throw error(403, 'Only super administrators can modify super admin roles');
		}

		// Only super_admin can create super_admin roles
		if (role === 'super_admin' && user.role !== 'super_admin') {
			throw error(403, 'Only super administrators can assign super admin roles');
		}

		// Update user role in profiles
		await db.update(schema.profiles)
			.set({
				role: role,
				updatedAt: new Date()
			})
			.where(and(eq(schema.profiles.id, userId), eq(schema.profiles.orgId, org_id)));

		// Also update Better Auth user role via Admin API
		await auth.api.setRole({
			headers: getRequestEvent().request.headers,
			body: {
				userId,
				role
			}
		});

		// Refresh the users query
		await getUsersData().refresh();

		return {
			success: true,
			message: 'User role updated successfully'
		};
	} catch (err) {
		console.error('Error in updateUserRole command:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

export const deleteUser = command('unchecked', async ({ userId }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();

	if (!org_id) {
		throw error(500, 'Organization context missing');
	}

	try {
		// Prevent self-deletion
		if (userId === user.id) {
			throw error(400, 'Cannot delete your own account');
		}

		// Get target user details
		const [targetUser] = await db.select({ role: schema.profiles.role, email: schema.profiles.email })
			.from(schema.profiles)
			.where(and(eq(schema.profiles.id, userId), eq(schema.profiles.orgId, org_id)))
			.limit(1);

		if (!targetUser) {
			throw error(500, 'Failed to find user');
		}

		// Check if this is the last admin
		if (['super_admin', 'org_admin'].includes(targetUser.role as string)) {
			const [{ count: adminCount }] = await db.select({ count: count() })
				.from(schema.profiles)
				.where(
					and(
						eq(schema.profiles.orgId, org_id),
						inArray(schema.profiles.role, ['super_admin', 'org_admin']),
						ne(schema.profiles.id, userId)
					)
				);

			if ((Number(adminCount) || 0) === 0) {
				throw error(400, 'Cannot delete the last administrator in the organization');
			}
		}

		// Delete from Better Auth via Admin API (which should trigger cascade to profiles if linked)
		// Better Auth admin plugin supports removing user
		await auth.api.removeUser({
			headers: getRequestEvent().request.headers,
			body: {
				userId
			}
		});

		// Ensure profile is deleted even if cascade fails
		await db.delete(schema.profiles)
			.where(and(eq(schema.profiles.id, userId), eq(schema.profiles.orgId, org_id)));

		// Refresh the users query
		await getUsersData().refresh();

		return {
			success: true,
			message: `User ${targetUser.email} deleted successfully`
		};
	} catch (err) {
		console.error('Error in deleteUser command:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

// ============================================================
// ROLES & PERMISSIONS QUERIES
// ============================================================

export const getRolesData = query(async (): Promise<RolesData> => {
	const { user } = await requireAdminPermissions();

	try {
		// Get all roles (system + org-specific) using Drizzle
		const roles = await db.select()
			.from(schema.roles)
			.orderBy(desc(schema.roles.isSystem), schema.roles.name);

		// Get all role permissions
		const permissions = await db.select()
			.from(schema.rolePermissions)
			.orderBy(schema.rolePermissions.role, schema.rolePermissions.permission);

		// Get available permissions
		const availablePermissions = [
			'templates.create',
			'templates.read',
			'templates.update',
			'templates.delete',
			'template_assets.create',
			'template_assets.read',
			'template_assets.update',
			'template_assets.delete',
			'idcards.create',
			'idcards.read',
			'idcards.update',
			'idcards.delete',
			'invoices.create',
			'invoices.read',
			'invoices.update',
			'invoices.delete',
			'credits.create',
			'credits.read',
			'credits.update',
			'credits.delete',
			'users.create',
			'users.read',
			'users.update',
			'users.delete',
			'organizations.create',
			'organizations.read',
			'organizations.update',
			'organizations.delete',
			'profiles.read',
			'profiles.update',
			'analytics.read'
		];

		return {
			roles: roles.map((r: any) => ({
				...r,
				created_at: r.createdAt?.toISOString() || new Date().toISOString(),
				updated_at: r.updatedAt?.toISOString() || null
			})),
			permissions: permissions.map((p: any) => ({
				id: p.id,
				role: p.role,
				permission: p.permission,
				role_id: null // Legacy support
			})),
			availablePermissions,
			currentUserRole: user?.role
		};
	} catch (err) {
		console.error('Error loading roles data:', err);
		throw error(500, 'Failed to load roles data');
	}
});

// ============================================================
// ROLES & PERMISSIONS COMMANDS
// ============================================================

export const createRole = command('unchecked', async ({ name, display_name, description }: any) => {
	const { org_id } = await requireSuperAdminPermissions();

	try {
		// Check if role name already exists
		const [existing] = await db.select({ id: schema.roles.id })
			.from(schema.roles)
			.where(eq(schema.roles.name, name))
			.limit(1);

		if (existing) {
			throw error(400, 'A role with this name already exists');
		}

		// Create the role
		const [newRole] = await db.insert(schema.roles)
			.values({
				name,
				displayName: display_name,
				description: description || null,
				isSystem: false,
				orgId: org_id
			})
			.returning();

		await getRolesData().refresh();

		return {
			success: true,
			message: `Role "${display_name}" created successfully`,
			role: newRole
		};
	} catch (err) {
		console.error('Error in createRole command:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

export const updateRole = command(
	'unchecked',
	async ({ roleId, display_name, description }: any) => {
		await requireSuperAdminPermissions();

		try {
			// Check if role exists and is not a system role
			const [existingRole] = await db.select()
				.from(schema.roles)
				.where(eq(schema.roles.id, roleId))
				.limit(1);

			if (!existingRole) {
				throw error(404, 'Role not found');
			}

			if (existingRole.isSystem) {
				throw error(403, 'Cannot modify system roles');
			}

			// Update the role
			await db.update(schema.roles)
				.set({
					displayName: display_name,
					description: description || null,
					updatedAt: new Date()
				})
				.where(eq(schema.roles.id, roleId));

			await getRolesData().refresh();

			return {
				success: true,
				message: 'Role updated successfully'
			};
		} catch (err) {
			console.error('Error in updateRole command:', err);
			if (err instanceof Error && 'status' in err) throw err;
			throw error(500, 'An unexpected error occurred');
		}
	}
);

export const deleteRole = command('unchecked', async ({ roleId }: any) => {
	await requireSuperAdminPermissions();

	try {
		// Check if role exists and is not a system role
		const [existingRole] = await db.select()
			.from(schema.roles)
			.where(eq(schema.roles.id, roleId))
			.limit(1);

		if (!existingRole) {
			throw error(404, 'Role not found');
		}

		if (existingRole.isSystem) {
			throw error(403, 'Cannot delete system roles');
		}

		// Delete the role
		await db.delete(schema.roles).where(eq(schema.roles.id, roleId));

		await getRolesData().refresh();

		return {
			success: true,
			message: 'Role deleted successfully'
		};
	} catch (err) {
		console.error('Error in deleteRole command:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

export const assignPermission = command('unchecked', async ({ role, permission }: any) => {
	await requireSuperAdminPermissions();

	try {
		// Check if permission already exists
		const [existing] = await db.select({ id: schema.rolePermissions.id })
			.from(schema.rolePermissions)
			.where(and(eq(schema.rolePermissions.role, role), eq(schema.rolePermissions.permission, permission)))
			.limit(1);

		if (existing) {
			return {
				success: true,
				message: 'Permission already assigned'
			};
		}

		// Insert the permission
		await db.insert(schema.rolePermissions).values({
			role,
			permission
		});

		await getRolesData().refresh();

		return {
			success: true,
			message: `Permission "${permission}" assigned to "${role}"`
		};
	} catch (err) {
		console.error('Error in assignPermission command:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

export const revokePermission = command('unchecked', async ({ role, permission }: any) => {
	await requireSuperAdminPermissions();

	try {
		await db.delete(schema.rolePermissions)
			.where(and(eq(schema.rolePermissions.role, role), eq(schema.rolePermissions.permission, permission)));

		await getRolesData().refresh();

		return {
			success: true,
			message: `Permission "${permission}" revoked from "${role}"`
		};
	} catch (err) {
		console.error('Error in revokePermission command:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

export const bulkAssignPermissions = command(
	'unchecked',
	async ({ role, permissions }: any) => {
		await requireSuperAdminPermissions();

		try {
			// First, delete all existing permissions for this role
			await db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.role, role));

			// Insert new permissions
			if (permissions && permissions.length > 0) {
				const insertData = permissions.map((permission: any) => ({
					role,
					permission
				}));

				await db.insert(schema.rolePermissions).values(insertData);
			}

			await getRolesData().refresh();

			return {
				success: true,
				message: `${permissions.length} permissions assigned to "${role}"`
			};
		} catch (err) {
			console.error('Error in bulkAssignPermissions command:', err);
			if (err instanceof Error && 'status' in err) throw err;
			throw error(500, 'An unexpected error occurred');
		}
	}
);

// ============================================================
// ORGANIZATION MANAGEMENT QUERIES & COMMANDS
// ============================================================

export const getOrganizationDetails = query(async () => {
	const { org_id } = await requireAdminPermissions();

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	try {
		const [
			organization,
			members,
			[totalCardsResult],
			[totalTemplatesResult],
			orgSettings
		] = await Promise.all([
			db.query.organizations.findFirst({ where: eq(schema.organizations.id, org_id) }),
			db.select({
					id: schema.profiles.id,
					email: schema.profiles.email,
					role: schema.profiles.role,
					created_at: schema.profiles.createdAt,
					credits_balance: schema.profiles.creditsBalance,
					card_generation_count: schema.profiles.cardGenerationCount
				})
				.from(schema.profiles)
				.where(eq(schema.profiles.orgId, org_id))
				.orderBy(desc(schema.profiles.createdAt)),
			db.select({ count: count() }).from(schema.idcards).where(eq(schema.idcards.orgId, org_id)),
			db.select({ count: count() }).from(schema.templates).where(eq(schema.templates.orgId, org_id)),
			db.query.orgSettings.findFirst({ where: eq(schema.orgSettings.orgId, org_id) })
		]);

		if (!organization) {
			throw error(500, 'Failed to fetch organization');
		}

		return {
			organization: {
                ...organization,
                created_at: organization.createdAt?.toISOString() || null,
                updated_at: organization.updatedAt?.toISOString() || null
            },
			members: members.map((m: any) => ({
				...m,
				created_at: m.created_at?.toISOString() || null
			})),
			stats: {
				totalCards: totalCardsResult?.count || 0,
				totalTemplates: totalTemplatesResult?.count || 0,
				totalMembers: members.length
			},
			orgSettings: orgSettings ? {
                ...orgSettings,
                updated_at: orgSettings.updatedAt?.toISOString() || null
            } : null
		};
	} catch (err) {
		console.error('Error loading organization details:', err);
		throw error(500, 'Failed to load organization details');
	}
});

export const getAllOrganizations = query(async () => {
	await requireSuperAdminPermissions();

	try {
		const organizations = await db.select({
				id: schema.organizations.id,
				name: schema.organizations.name,
				created_at: schema.organizations.createdAt
			})
			.from(schema.organizations)
			.orderBy(schema.organizations.name);

		return { 
            organizations: organizations.map(o => ({
                ...o,
                created_at: o.created_at?.toISOString() || null
            })) 
        };
	} catch (err) {
		console.error('Error loading organizations:', err);
		throw error(500, 'Failed to load organizations');
	}
});

export const updateOrganizationName = command('unchecked', async ({ orgId, name }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();

	const isSuperAdmin = user.role === 'super_admin';
	const targetOrgId = isSuperAdmin ? orgId : org_id;

	if (!isSuperAdmin && orgId !== org_id) {
		throw error(403, 'Cannot update other organizations');
	}

	try {
		await db.update(schema.organizations)
			.set({
				name: name.trim(),
				updatedAt: new Date()
			})
			.where(eq(schema.organizations.id, targetOrgId));

		await getOrganizationDetails().refresh();

		return {
			success: true,
			message: 'Organization name updated successfully'
		};
	} catch (err) {
		console.error('Error in updateOrganizationName:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

export const updateOrganizationMember = command('unchecked', async ({ memberId, role }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();

	if (!org_id) {
		throw error(500, 'Organization context missing');
	}

	try {
		const [member] = await db.select({ id: schema.profiles.id, role: schema.profiles.role })
			.from(schema.profiles)
			.where(and(eq(schema.profiles.id, memberId), eq(schema.profiles.orgId, org_id)))
			.limit(1);

		if (!member) {
			throw error(404, 'Member not found in organization');
		}

		if (memberId === user.id && ['org_admin', 'super_admin'].includes(user.role)) {
			const isNewRoleAdmin = ['org_admin', 'super_admin'].includes(role);
			if (!isNewRoleAdmin) {
				throw error(400, 'Cannot demote yourself from admin role');
			}
		}

		await db.update(schema.profiles)
			.set({
				role: role,
				updatedAt: new Date()
			})
			.where(and(eq(schema.profiles.id, memberId), eq(schema.profiles.orgId, org_id)));

		await getOrganizationDetails().refresh();

		return {
			success: true,
			message: 'Member role updated successfully'
		};
	} catch (err) {
		console.error('Error in updateOrganizationMember:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

export const removeOrganizationMember = command('unchecked', async ({ memberId }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();

	if (!org_id) {
		throw error(500, 'Organization context missing');
	}

	try {
		if (memberId === user.id) {
			throw error(400, 'Cannot remove yourself from the organization');
		}

		const [member] = await db.select({ id: schema.profiles.id, email: schema.profiles.email, role: schema.profiles.role })
			.from(schema.profiles)
			.where(and(eq(schema.profiles.id, memberId), eq(schema.profiles.orgId, org_id)))
			.limit(1);

		if (!member) {
			throw error(404, 'Member not found in organization');
		}

		if (['super_admin', 'org_admin'].includes(member.role as string)) {
			const [{ count: adminCount }] = await db.select({ count: count() })
				.from(schema.profiles)
				.where(
					and(
						eq(schema.profiles.orgId, org_id),
						inArray(schema.profiles.role, ['super_admin', 'org_admin']),
						ne(schema.profiles.id, memberId)
					)
				);

			if ((Number(adminCount) || 0) === 0) {
				throw error(400, 'Cannot delete the last administrator');
			}
		}

		await db.update(schema.profiles)
			.set({
				orgId: null,
				updatedAt: new Date()
			})
			.where(and(eq(schema.profiles.id, memberId), eq(schema.profiles.orgId, org_id)));

		await getOrganizationDetails().refresh();

		return {
			success: true,
			message: `Member ${member.email} removed from organization`
		};
	} catch (err) {
		console.error('Error in removeOrganizationMember:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

export const updateOrganizationSettings = command('unchecked', async ({ paymentsEnabled, paymentsBypass }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();

	if (!org_id) {
		throw error(500, 'Organization context missing');
	}

	try {
		const updateData: any = {
			updatedAt: new Date(),
			updatedBy: user.id
		};

		if (paymentsEnabled !== undefined) updateData.paymentsEnabled = paymentsEnabled;
		if (paymentsBypass !== undefined) {
			if (user.role !== 'super_admin') {
				throw error(403, 'Only super administrators can modify payment bypass settings');
			}
			updateData.paymentsBypass = paymentsBypass;
		}

		await db.insert(schema.orgSettings)
			.values({
				orgId: org_id,
				...updateData
			})
			.onConflictDoUpdate({
				target: schema.orgSettings.orgId,
				set: updateData
			});

		await getOrganizationDetails().refresh();

		return {
			success: true,
			message: 'Organization settings updated successfully'
		};
	} catch (err) {
		console.error('Error in updateOrganizationSettings:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});
