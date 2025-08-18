import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';

// Type definitions for validation
const UserRoleSchema = v.union([
	v.literal('super_admin'),
	v.literal('org_admin'),
	v.literal('id_gen_admin'),
	v.literal('id_gen_user')
]);

const AddUserSchema = v.object({
	email: v.pipe(v.string(), v.email()),
	role: UserRoleSchema
});

const UpdateUserRoleSchema = v.object({
	userId: v.string(),
	role: UserRoleSchema
});

const DeleteUserSchema = v.object({
	userId: v.string()
});

// Helper function to check admin permissions
async function requireAdminPermissions() {
	const { locals } = getRequestEvent();
	const { user } = locals;

	if (!user?.role || !['super_admin', 'org_admin', 'id_gen_admin'].includes(user.role)) {
		throw error(403, 'Access denied. Admin privileges required.');
	}

	return { user, supabase: locals.supabase, org_id: locals.org_id };
}

// Helper function to check specific admin permissions for user management
async function requireUserManagementPermissions() {
	const { locals } = getRequestEvent();
	const { user } = locals;

	if (!user?.role || !['super_admin', 'org_admin'].includes(user.role)) {
		throw error(403, 'Insufficient permissions for user management.');
	}

	return { user, supabase: locals.supabase, org_id: locals.org_id };
}

// Helper function to check super admin permissions
async function requireSuperAdminPermissions() {
	const { locals } = getRequestEvent();
	const { user } = locals;

	if (user?.role !== 'super_admin') {
		throw error(403, 'Super admin privileges required.');
	}

	return { user, supabase: locals.supabase, org_id: locals.org_id };
}

// Query functions
export const getAdminDashboardData = query(async () => {
	const { user, supabase, org_id } = await requireAdminPermissions();

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	try {
		// Get organization stats
		const [
			{ count: totalCards },
			{ data: users, error: usersError },
			{ data: templates, error: templatesError },
			{ data: recentCards, error: recentCardsError }
		] = await Promise.all([
			// Total cards count
			supabase
				.from('idcards')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id),

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
				.limit(10)
		]);

		// Handle any errors
		if (usersError) {
			console.error('Error fetching users:', usersError);
		}
		if (templatesError) {
			console.error('Error fetching templates:', templatesError);
		}
		if (recentCardsError) {
			console.error('Error fetching recent cards:', recentCardsError);
		}

		// Calculate new cards this month
		const thisMonth = new Date();
		thisMonth.setDate(1);
		thisMonth.setHours(0, 0, 0, 0);

		const newCardsThisMonth = recentCards?.filter(card => 
			new Date(card.created_at) >= thisMonth
		).length || 0;

		// Create recent activity from recent cards
		const recentActivity = recentCards?.map(card => ({
			id: card.id,
			type: 'card_generated',
			description: `ID card generated for ${card.data?.name || card.data?.full_name || 'Unknown'}`,
			created_at: card.created_at
		})).slice(0, 5) || [];

		// Add user registration activities
		const recentUsers = users?.filter(user => {
			const userDate = new Date(user.created_at);
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
			return userDate >= sevenDaysAgo;
		}).map(user => ({
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
				newCardsThisMonth
			},
			users: users || [],
			templates: templates || [],
			recentActivity: allActivities,
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

export const getUsersData = query(async () => {
	const { user, supabase, org_id } = await requireAdminPermissions();

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
export const addUser = command(AddUserSchema, async ({ email, role }) => {
	const { user, supabase, org_id } = await requireUserManagementPermissions();

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
			.eq('org_id', org_id)
			.single();

		if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
			console.error('Error checking existing user:', checkError);
			throw error(500, 'Failed to check existing user');
		}

		if (existingUser) {
			throw error(400, 'User with this email already exists in your organization');
		}

		// Create user in auth (they'll need to set their password via invite)
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
		const { error: profileError } = await supabase
			.from('profiles')
			.insert({
				id: authUser.user.id,
				email,
				role,
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

export const updateUserRole = command(UpdateUserRoleSchema, async ({ userId, role }) => {
	const { user, supabase, org_id } = await requireUserManagementPermissions();

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

		if (fetchError) {
			console.error('Error fetching target user:', fetchError);
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

		// Update user role
		const { error: updateError } = await supabase
			.from('profiles')
			.update({ 
				role: role, 
				updated_at: new Date().toISOString() 
			})
			.eq('id', userId)
			.eq('org_id', org_id);

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

export const deleteUser = command(DeleteUserSchema, async ({ userId }) => {
	const { user, supabase, org_id } = await requireUserManagementPermissions();

	try {
		// Prevent self-deletion
		if (userId === user.id) {
			throw error(400, 'Cannot delete your own account');
		}

		// Get target user details
		const { data: targetUser, error: fetchError } = await supabase
			.from('profiles')
			.select('role, email')
			.eq('id', userId)
			.eq('org_id', org_id)
			.single();

		if (fetchError) {
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

		// Delete from auth (optional - you might want to keep the auth user)
		const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
		if (authDeleteError) {
			console.warn('Failed to delete auth user:', authDeleteError);
			// Don't fail the request if auth deletion fails
		}

		// Refresh the users query
		await getUsersData().refresh();

		return { 
			success: true, 
			message: `User ${targetUser.email} deleted successfully`
		};

	} catch (err) {
		console.error('Error in deleteUser command:', err);
		if (err instanceof Error && err.message.includes('error')) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'An unexpected error occurred');
	}
});