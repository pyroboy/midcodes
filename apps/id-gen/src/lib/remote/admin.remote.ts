import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { PRIVATE_SERVICE_ROLE } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

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
	return { user: { ...user, role: userRole } as typeof user & { role: string }, org_id };
}

// Helper function to check specific admin permissions for user management
// IMPORTANT: Check original role FIRST
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
	return { user: { ...user, role: userRole } as typeof user & { role: string }, org_id };
}

// Helper function to check super admin permissions
// IMPORTANT: Check original role FIRST
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

	return { user: { ...user, role: 'super_admin' } as typeof user & { role: string }, org_id };
}

function getAdminClient() {
	return createClient(PUBLIC_SUPABASE_URL, PRIVATE_SERVICE_ROLE);
}

// Query functions
export const getAdminDashboardData = query(async (): Promise<AdminDashboardData> => {
	const { user, org_id } = await requireAdminPermissions();
	const supabase = getAdminClient();

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	try {
		// Date ranges
		const now = new Date();
		const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

		// Get organization stats
		const [
			{ count: totalCards },
			{ count: cardsToday },
			{ data: usersData, error: usersError },
			{ data: templatesData, error: templatesError },
			{ data: recentCardsData, error: recentCardsError },
			{ data: creditStats, error: creditStatsError }, // Get all profiles to sum credits
			{ data: creditTransactions, error: transactionsError }, // Get today's transactions
			{ data: paidInvoices, error: invoicesError }, // Get paid invoices
			{ count: totalTemplateAssets }, // Total template assets
			{ count: publishedTemplateAssets }, // Published template assets
			{ count: totalOrgs } // Total organizations
		] = await Promise.all([
			// Total cards count
			supabase.from('idcards').select('*', { count: 'exact', head: true }).eq('org_id', org_id),

			// Cards generated today
			supabase
				.from('idcards')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id)
				.gte('created_at', startOfToday),

			// All users in organization
			supabase
				.from('profiles')
				.select('id, email, role, created_at, updated_at')
				.eq('org_id', org_id)
				.order('created_at', { ascending: false }),

			// All templates in organization
			supabase
				.from('templates')
				.select('id, name, created_at, user_id')
				.eq('org_id', org_id)
				.order('created_at', { ascending: false }),

			// Recent card generations
			supabase
				.from('idcards')
				.select('id, template_id, created_at, data')
				.eq('org_id', org_id)
				.order('created_at', { ascending: false })
				.limit(10),

			// Credit stats (sum of all profiles' balances)
			supabase.from('profiles').select('credits_balance').eq('org_id', org_id),

			// Today's credit usage (negative transactions)
			supabase
				.from('credit_transactions')
				.select('amount')
				.eq('org_id', org_id)
				.lt('amount', 0)
				.gte('created_at', startOfToday),

			// Revenue (Paid invoices)
			supabase.from('invoices').select('total_amount').eq('org_id', org_id).eq('status', 'paid'),

			// Total template assets (global, not org-specific)
			supabase.from('template_assets').select('*', { count: 'exact', head: true }),

			// Published template assets
			supabase
				.from('template_assets')
				.select('*', { count: 'exact', head: true })
				.eq('is_published', true),

			// Total organizations
			supabase.from('organizations').select('*', { count: 'exact', head: true })
		]);

		// Handle any errors
		if (usersError) console.error('Error fetching users:', usersError);
		if (templatesError) console.error('Error fetching templates:', templatesError);
		if (recentCardsError) console.error('Error fetching recent cards:', recentCardsError);
		if (creditStatsError) console.error('Error fetching credit stats:', creditStatsError);
		if (transactionsError) console.error('Error fetching transactions:', transactionsError);
		if (invoicesError) console.error('Error fetching invoices:', invoicesError);

		// Cast results to flexible arrays for dashboard computations
		const users = (usersData as any[]) || [];
		const templates = (templatesData as any[]) || [];
		const recentCards = (recentCardsData as any[]) || [];

		// Calculate stats
		const totalCredits =
			(creditStats as any[])?.reduce((sum, p) => sum + (p.credits_balance || 0), 0) || 0;
		const creditsUsedToday = Math.abs(
			(creditTransactions as any[])?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
		);
		const totalRevenue =
			(paidInvoices as any[])?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
		const paidInvoicesCount = (paidInvoices as any[])?.length || 0;

		// Calculate new cards this month
		const thisMonth = new Date();
		thisMonth.setDate(1);
		thisMonth.setHours(0, 0, 0, 0);

		const newCardsThisMonth =
			recentCards?.filter((card) => new Date(card.created_at) >= thisMonth).length || 0;

		// Create recent activity from recent cards
		const recentCardsAny = (recentCards as any[]) || [];
		const recentActivity =
			recentCardsAny
				?.map((card) => ({
					id: card.id,
					type: 'card_generated',
					description: `ID card generated for ${card.data?.name || card.data?.full_name || 'Unknown'}`,
					created_at: card.created_at
				}))
				.slice(0, 5) || [];

		// Add user registration activities
		const usersAny = (users as any[]) || [];
		const recentUsers =
			usersAny
				?.filter((user) => {
					const userDate = new Date(user.created_at);
					const sevenDaysAgo = new Date();
					sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
					return userDate >= sevenDaysAgo;
				})
				.map((user) => ({
					id: `user_${user.id}`,
					type: 'user_added',
					description: `New user registered: ${user.email}`,
					created_at: user.created_at
				})) || [];

		// Combine and sort activities
		const allActivities = [...recentActivity, ...recentUsers]
			.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
			.slice(0, 10);

		return {
			stats: {
				totalCards: totalCards || 0,
				newCardsThisMonth,
				newCardsToday: cardsToday || 0,
				totalUsers: users?.length || 0,
				totalTemplates: templates?.length || 0,
				totalCredits,
				creditsUsedToday,
				totalRevenue,
				paidInvoicesCount,
				totalTemplateAssets: totalTemplateAssets || 0,
				publishedTemplateAssets: publishedTemplateAssets || 0,
				totalOrgs: totalOrgs || 0
			},
			users: users || [],
			templates: templates || [],
			recentActivity: allActivities.map((a) => ({
				id: String(a.id),
				type: a.type as 'card_generated' | 'user_added',
				description: a.description,
				created_at: String(a.created_at)
			})),
			errors: {
				users: usersError?.message || null,
				templates: templatesError?.message || null,
				recentCards: recentCardsError?.message || null
			}
		};
	} catch (err) {
		console.error('Error loading admin dashboard data:', err);
		throw error(500, 'Failed to load dashboard data');
	}
});

export const getUsersData = query(async (): Promise<UsersData> => {
	const { user, org_id } = await requireAdminPermissions();
	const supabase = getAdminClient();

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	try {
		// Get all users in the organization
		const { data: users, error: usersError } = await supabase
			.from('profiles')
			.select('id, email, role, created_at, updated_at')
			.eq('org_id', org_id)
			.order('created_at', { ascending: false });

		if (usersError) {
			console.error('Error fetching users:', usersError);
			throw error(500, 'Failed to load users');
		}

		return {
			users: users || [],
			currentUserId: user?.id,
			currentUserRole: user?.role
		};
	} catch (err) {
		console.error('Error loading user management data:', err);
		throw error(500, 'Failed to load user management data');
	}
});

// Command functions
// Command functions
export const addUser = command('unchecked', async ({ email, role }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();
	const supabase = getAdminClient();

	try {
		// Validate role
		const validRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
		if (!validRoles.includes(role)) {
			throw error(400, 'Invalid role specified');
		}

		// Check if user already exists
		const { data: existingUser, error: checkError } = await supabase
			.from('profiles')
			.select('id')
			.eq('email', email)
			.eq('org_id', org_id!)
			.single();

		if (checkError && checkError.code !== 'PGRST116') {
			// PGRST116 = no rows found
			console.error('Error checking existing user:', checkError);
			throw error(500, 'Failed to check existing user');
		}

		if (existingUser) {
			throw error(400, 'User with this email already exists in your organization');
		}

		// Create user in auth (requires service role for admin.createUser)
		const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
			email,
			email_confirm: true, // Skip email confirmation for admin-created users
			user_metadata: {
				role,
				org_id,
				invited_by: user.id
			}
		});

		if (authError) {
			console.error('Error creating auth user:', authError);
			throw error(500, `Failed to create user: ${authError.message}`);
		}

		// Create profile
		const { error: profileError } = await (supabase as any).from('profiles').insert({
			id: authUser.user.id,
			email,
			role: role,
			org_id,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		});

		if (profileError) {
			console.error('Error creating profile:', profileError);
			// Try to cleanup the auth user if profile creation failed
			await supabase.auth.admin.deleteUser(authUser.user.id);
			throw error(500, 'Failed to create user profile');
		}

		// Send invitation email (this would typically be handled by your email service)
		const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);

		if (inviteError) {
			console.warn('Failed to send invitation email:', inviteError);
			// Don't fail the request if email fails, user was created successfully
		}

		// Refresh the users query
		await getUsersData().refresh();

		return {
			success: true,
			message: `User ${email} added successfully. They will receive an invitation email.`
		};
	} catch (err) {
		console.error('Error in addUser command:', err);
		if (err instanceof Error && err.message.includes('error')) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'An unexpected error occurred');
	}
});

export const updateUserRole = command('unchecked', async ({ userId, role }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();
	const supabase = getAdminClient();

	// Ensure org_id is defined
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
		const { data: targetUser, error: fetchError } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', userId)
			.eq('org_id', org_id)
			.single();

		if (fetchError || !targetUser) {
			console.error('Error fetching target user:', fetchError);
			throw error(500, 'Failed to find user');
		}

		// Only super_admin can modify super_admin roles
		const safeTargetUser = targetUser as any;
		if (safeTargetUser.role === 'super_admin' && user.role !== 'super_admin') {
			throw error(403, 'Only super administrators can modify super admin roles');
		}

		// Only super_admin can create super_admin roles
		if (role === 'super_admin' && user.role !== 'super_admin') {
			throw error(403, 'Only super administrators can assign super admin roles');
		}

		// Update user role
		const { error: updateError } = await (supabase as any)
			.from('profiles')
			.update({
				role: role,
				updated_at: new Date().toISOString()
			})
			.eq('id', userId)
			.eq('org_id', org_id!);

		if (updateError) {
			console.error('Error updating user role:', updateError);
			throw error(500, 'Failed to update user role');
		}

		// Refresh the users query
		await getUsersData().refresh();

		return {
			success: true,
			message: 'User role updated successfully'
		};
	} catch (err) {
		console.error('Error in updateUserRole command:', err);
		if (err instanceof Error && err.message.includes('error')) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'An unexpected error occurred');
	}
});

export const deleteUser = command('unchecked', async ({ userId }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();
	const supabase = getAdminClient();

	// Ensure org_id is defined
	if (!org_id) {
		throw error(500, 'Organization context missing');
	}

	try {
		// Prevent self-deletion
		if (userId === user.id) {
			throw error(400, 'Cannot delete your own account');
		}

		// Get target user details
		const { data: targetUserData, error: fetchError } = await supabase
			.from('profiles')
			.select('role, email')
			.eq('id', userId)
			.eq('org_id', org_id!)
			.single();

		const targetUser = targetUserData as any;

		if (fetchError || !targetUser) {
			console.error('Error fetching target user:', fetchError);
			throw error(500, 'Failed to find user');
		}

		// Check if this is the last admin
		if (['super_admin', 'org_admin'].includes(targetUser.role)) {
			const { count: adminCount } = await supabase
				.from('profiles')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id)
				.in('role', ['super_admin', 'org_admin'])
				.neq('id', userId);

			if ((adminCount || 0) === 0) {
				throw error(400, 'Cannot delete the last administrator in the organization');
			}
		}

		// Delete profile (this should cascade to related data)
		const { error: deleteError } = await supabase
			.from('profiles')
			.delete()
			.eq('id', userId)
			.eq('org_id', org_id);

		if (deleteError) {
			console.error('Error deleting profile:', deleteError);
			throw error(500, 'Failed to delete user profile');
		}

		// Delete from auth (requires service role)
		const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
		if (authDeleteError) {
			console.warn('Failed to delete auth user:', authDeleteError);
			// Don't fail the request if auth deletion fails
		}

		// Refresh the users query
		await getUsersData().refresh();

		return {
			success: true,
			message: `User ${(targetUser as any).email} deleted successfully`
		};
	} catch (err) {
		console.error('Error in deleteUser command:', err);
		if (err instanceof Error && err.message.includes('error')) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'An unexpected error occurred');
	}
});

// ============================================================
// ROLES & PERMISSIONS QUERIES
// ============================================================

export const getRolesData = query(async (): Promise<RolesData> => {
	const { user } = await requireAdminPermissions();
	const supabase = getAdminClient();

	try {
		// Get all roles (system + org-specific)
		const { data: roles, error: rolesError } = await supabase
			.from('roles')
			.select('*')
			.order('is_system', { ascending: false })
			.order('name');

		if (rolesError) {
			console.error('Error fetching roles:', rolesError);
			throw error(500, 'Failed to load roles');
		}

		// Get all role permissions
		const { data: permissions, error: permissionsError } = await supabase
			.from('role_permissions')
			.select('*')
			.order('role')
			.order('permission');

		if (permissionsError) {
			console.error('Error fetching permissions:', permissionsError);
			throw error(500, 'Failed to load permissions');
		}

		// Get available permissions from enum
		const { data: enumData, error: enumError } = await supabase.rpc('get_enum_values', {
			enum_name: 'app_permission'
		});

		let availablePermissions: string[] = [];
		if (enumError) {
			// Fallback: hardcode known permissions if RPC fails
			availablePermissions = [
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
		} else {
			availablePermissions = (enumData as any[])?.map((e) => e.value) || [];
		}

		return {
			roles: (roles || []).map((r: any) => ({
				...r,
				created_at: r.created_at || new Date().toISOString(),
				updated_at: r.updated_at || null
			})),
			permissions: (permissions || []).map((p: any) => ({
				id: p.id,
				role: p.role,
				permission: p.permission,
				role_id: p.role_id || null
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
	const { user, org_id } = await requireSuperAdminPermissions();
	const supabase = getAdminClient();

	try {
		// Check if role name already exists
		const { data: existing } = await supabase.from('roles').select('id').eq('name', name).single();

		if (existing) {
			throw error(400, 'A role with this name already exists');
		}

		// Create the role (org-specific, not system)
		const { data: newRole, error: createError } = await supabase
			.from('roles')
			.insert({
				name,
				display_name,
				description: description || null,
				is_system: false,
				org_id,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.select()
			.single();

		if (createError) {
			console.error('Error creating role:', createError);
			throw error(500, 'Failed to create role');
		}

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
		const { user } = await requireSuperAdminPermissions();
		const supabase = getAdminClient();

		try {
			// Check if role exists and is not a system role
			const { data: existingRole, error: fetchError } = await supabase
				.from('roles')
				.select('*')
				.eq('id', roleId)
				.single();

			if (fetchError || !existingRole) {
				throw error(404, 'Role not found');
			}

			if ((existingRole as any).is_system) {
				throw error(403, 'Cannot modify system roles');
			}

			// Update the role
			const updateData: any = { updated_at: new Date().toISOString() };
			if (display_name) updateData.display_name = display_name;
			if (description !== undefined) updateData.description = description;

			const { error: updateError } = await supabase
				.from('roles')
				.update(updateData)
				.eq('id', roleId);

			if (updateError) {
				console.error('Error updating role:', updateError);
				throw error(500, 'Failed to update role');
			}

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
	const { user } = await requireSuperAdminPermissions();
	const supabase = getAdminClient();

	try {
		// Check if role exists and is not a system role
		const { data: existingRole, error: fetchError } = await supabase
			.from('roles')
			.select('*')
			.eq('id', roleId)
			.single();

		if (fetchError || !existingRole) {
			throw error(404, 'Role not found');
		}

		if ((existingRole as any).is_system) {
			throw error(403, 'Cannot delete system roles');
		}

		// Delete the role (cascade will delete permissions)
		const { error: deleteError } = await supabase.from('roles').delete().eq('id', roleId);

		if (deleteError) {
			console.error('Error deleting role:', deleteError);
			throw error(500, 'Failed to delete role');
		}

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

export const assignPermission = command('unchecked', async ({ role, permission, roleId }: any) => {
	const { user } = await requireSuperAdminPermissions();
	const supabase = getAdminClient();

	try {
		// Check if permission already exists
		const { data: existing } = await supabase
			.from('role_permissions')
			.select('id')
			.eq('role', role)
			.eq('permission', permission)
			.single();

		if (existing) {
			return {
				success: true,
				message: 'Permission already assigned'
			};
		}

		// Insert the permission
		const { error: insertError } = await supabase.from('role_permissions').insert({
			role,
			permission,
			role_id: roleId || null
		});

		if (insertError) {
			console.error('Error assigning permission:', insertError);
			throw error(500, 'Failed to assign permission');
		}

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
	const { user } = await requireSuperAdminPermissions();
	const supabase = getAdminClient();

	try {
		const { error: deleteError } = await supabase
			.from('role_permissions')
			.delete()
			.eq('role', role)
			.eq('permission', permission);

		if (deleteError) {
			console.error('Error revoking permission:', deleteError);
			throw error(500, 'Failed to revoke permission');
		}

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
	async ({ role, permissions, roleId }: any) => {
		const { user } = await requireSuperAdminPermissions();
		const supabase = getAdminClient();

		try {
			// First, delete all existing permissions for this role
			const { error: deleteError } = await supabase
				.from('role_permissions')
				.delete()
				.eq('role', role);

			if (deleteError) {
				console.error('Error clearing permissions:', deleteError);
				throw error(500, 'Failed to update permissions');
			}

			// Insert new permissions
			if (permissions && permissions.length > 0) {
				const insertData = permissions.map((permission: string) => ({
					role,
					permission,
					role_id: roleId || null
				}));

				const { error: insertError } = await supabase.from('role_permissions').insert(insertData);

				if (insertError) {
					console.error('Error assigning permissions:', insertError);
					throw error(500, 'Failed to assign permissions');
				}
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

// Get organization details with stats
export const getOrganizationDetails = query(async () => {
	const { user, org_id } = await requireAdminPermissions();
	const supabase = getAdminClient();

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	try {
		const [
			{ data: organization, error: orgError },
			{ data: members, error: membersError },
			{ count: totalCards },
			{ count: totalTemplates },
			{ data: orgSettings }
		] = await Promise.all([
			supabase.from('organizations').select('*').eq('id', org_id).single(),
			supabase.from('profiles')
				.select('id, email, role, created_at, credits_balance, card_generation_count')
				.eq('org_id', org_id)
				.order('created_at', { ascending: false }),
			supabase.from('idcards').select('*', { count: 'exact', head: true }).eq('org_id', org_id),
			supabase.from('templates').select('*', { count: 'exact', head: true }).eq('org_id', org_id),
			supabase.from('org_settings').select('*').eq('org_id', org_id).single()
		]);

		if (orgError) {
			console.error('Error fetching organization:', orgError);
			throw error(500, 'Failed to fetch organization');
		}

		return {
			organization,
			members: members || [],
			stats: {
				totalCards: totalCards || 0,
				totalTemplates: totalTemplates || 0,
				totalMembers: members?.length || 0
			},
			orgSettings: orgSettings || null
		};
	} catch (err) {
		console.error('Error loading organization details:', err);
		throw error(500, 'Failed to load organization details');
	}
});

// Get all organizations (super admin only)
export const getAllOrganizations = query(async () => {
	const { user } = await requireSuperAdminPermissions();
	const supabase = getAdminClient();

	try {
		const { data: organizations, error: orgsError } = await supabase
			.from('organizations')
			.select('id, name, created_at')
			.order('name', { ascending: true });

		if (orgsError) {
			console.error('Error fetching organizations:', orgsError);
			throw error(500, 'Failed to fetch organizations');
		}

		return { organizations: organizations || [] };
	} catch (err) {
		console.error('Error loading organizations:', err);
		throw error(500, 'Failed to load organizations');
	}
});

// Update organization name
export const updateOrganizationName = command('unchecked', async ({ orgId, name }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();
	const supabase = getAdminClient();

	// Org admins can only update their own org
	const isSuperAdmin = user.role === 'super_admin';
	const targetOrgId = isSuperAdmin ? orgId : org_id;

	if (!isSuperAdmin && orgId !== org_id) {
		throw error(403, 'Cannot update other organizations');
	}

	try {
		const { error: updateError } = await supabase
			.from('organizations')
			.update({
				name: name.trim(),
				updated_at: new Date().toISOString()
			})
			.eq('id', targetOrgId);

		if (updateError) {
			console.error('Error updating organization:', updateError);
			throw error(500, 'Failed to update organization');
		}

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

// Update organization member role
export const updateOrganizationMember = command('unchecked', async ({ memberId, role }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();
	const supabase = getAdminClient();

	if (!org_id) {
		throw error(500, 'Organization context missing');
	}

	try {
		// Get valid ID-gen roles
		const validRoles = [
			'org_admin', 'id_gen_admin', 'id_gen_user',
			'id_gen_accountant', 'id_gen_encoder', 'id_gen_printer',
			'id_gen_viewer', 'id_gen_template_designer', 'id_gen_auditor'
		];

		if (!validRoles.includes(role)) {
			throw error(400, 'Invalid role specified');
		}

		// Check user belongs to org
		const { data: member, error: memberError } = await supabase
			.from('profiles')
			.select('id, role')
			.eq('id', memberId)
			.eq('org_id', org_id)
			.single();

		if (memberError || !member) {
			throw error(404, 'Member not found in organization');
		}

		// Prevent self-demotion from admin
		if (memberId === user.id && ['org_admin', 'super_admin'].includes(user.role)) {
			const isNewRoleAdmin = ['org_admin', 'super_admin'].includes(role);
			if (!isNewRoleAdmin) {
				throw error(400, 'Cannot demote yourself from admin role');
			}
		}

		const { error: updateError } = await supabase
			.from('profiles')
			.update({
				role: role,
				updated_at: new Date().toISOString()
			})
			.eq('id', memberId)
			.eq('org_id', org_id);

		if (updateError) {
			console.error('Error updating member role:', updateError);
			throw error(500, 'Failed to update member role');
		}

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

// Remove member from organization
export const removeOrganizationMember = command('unchecked', async ({ memberId }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();
	const supabase = getAdminClient();

	if (!org_id) {
		throw error(500, 'Organization context missing');
	}

	try {
		// Prevent self-removal
		if (memberId === user.id) {
			throw error(400, 'Cannot remove yourself from the organization');
		}

		// Check user belongs to org and get their info
		const { data: member, error: memberError } = await supabase
			.from('profiles')
			.select('id, email, role')
			.eq('id', memberId)
			.eq('org_id', org_id)
			.single();

		if (memberError || !member) {
			throw error(404, 'Member not found in organization');
		}

		// Check if this is the last admin
		const memberAny = member as any;
		if (['super_admin', 'org_admin'].includes(memberAny.role)) {
			const { count: adminCount } = await supabase
				.from('profiles')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id)
				.in('role', ['super_admin', 'org_admin'])
				.neq('id', memberId);

			if ((adminCount || 0) === 0) {
				throw error(400, 'Cannot remove the last administrator');
			}
		}

		// Remove from organization (set org_id to null)
		const { error: updateError } = await supabase
			.from('profiles')
			.update({
				org_id: null,
				updated_at: new Date().toISOString()
			})
			.eq('id', memberId)
			.eq('org_id', org_id);

		if (updateError) {
			console.error('Error removing member:', updateError);
			throw error(500, 'Failed to remove member');
		}

		await getOrganizationDetails().refresh();

		return {
			success: true,
			message: `Member ${memberAny.email} removed from organization`
		};
	} catch (err) {
		console.error('Error in removeOrganizationMember:', err);
		if (err instanceof Error && 'status' in err) throw err;
		throw error(500, 'An unexpected error occurred');
	}
});

// Update organization settings
export const updateOrganizationSettings = command('unchecked', async ({ paymentsEnabled, paymentsBypass }: any) => {
	const { user, org_id } = await requireUserManagementPermissions();
	const supabase = getAdminClient();

	if (!org_id) {
		throw error(500, 'Organization context missing');
	}

	try {
		const updateData: any = {
			updated_at: new Date().toISOString(),
			updated_by: user.id
		};

		if (paymentsEnabled !== undefined) updateData.payments_enabled = paymentsEnabled;
		
		// SECURITY: Only super_admin can modify payments_bypass
		if (paymentsBypass !== undefined) {
			const isSuperAdmin = user.role === 'super_admin';
			if (!isSuperAdmin) {
				throw error(403, 'Only super administrators can modify payment bypass settings');
			}
			updateData.payments_bypass = paymentsBypass;
		}

		const { error: updateError } = await supabase
			.from('org_settings')
			.upsert({
				org_id,
				...updateData
			});

		if (updateError) {
			console.error('Error updating org settings:', updateError);
			throw error(500, 'Failed to update settings');
		}

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
