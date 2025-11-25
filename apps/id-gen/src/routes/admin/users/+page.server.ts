import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { supabase, user, org_id } = locals;

	// Ensure we have parent data (user auth and permissions)
	const parentData = await parent();

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	try {
		// Get all users in the organization
		const { data: users, error: usersError } = await supabase
			.from('profiles')
			.select('id, email, role, created_at, updated_at')
			.eq('org_id', org_id!)
			.order('created_at', { ascending: false });

		if (usersError) {
			console.error('Error fetching users:', usersError);
			throw error(500, 'Failed to load users');
		}

		return {
			users: users || [],
			currentUserId: user?.id,
			currentUserRole: user?.role,
			organization: parentData.organization
		};
	} catch (err) {
		console.error('Error loading user management data:', err);
		throw error(500, 'Failed to load user management data');
	}
};

export const actions: Actions = {
	addUser: async ({ request, locals }) => {
		const { supabase, user, org_id } = locals;

		if (!user?.role || !['super_admin', 'org_admin'].includes(user.role)) {
			return fail(403, { error: 'Insufficient permissions to add users' });
		}

		try {
			const formData = await request.formData();
			const email = formData.get('email') as string;
			const role = formData.get('role') as string;

			if (!email || !role) {
				return fail(400, { error: 'Email and role are required' });
			}

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				return fail(400, { error: 'Invalid email format' });
			}

			// Validate role
			const validRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
			if (!validRoles.includes(role)) {
				return fail(400, { error: 'Invalid role specified' });
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
				return fail(500, { error: 'Failed to check existing user' });
			}

			if (existingUser) {
				return fail(400, { error: 'User with this email already exists in your organization' });
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
				return fail(500, { error: `Failed to create user: ${authError.message}` });
			}

			// Create profile
			const { error: profileError } = await supabase.from('profiles').insert({
				id: authUser.user.id,
				email,
				role: role as any,
				org_id,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			} as any);

			if (profileError) {
				console.error('Error creating profile:', profileError);
				// Try to cleanup the auth user if profile creation failed
				await supabase.auth.admin.deleteUser(authUser.user.id);
				return fail(500, { error: 'Failed to create user profile' });
			}

			// Send invitation email (this would typically be handled by your email service)
			const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);

			if (inviteError) {
				console.warn('Failed to send invitation email:', inviteError);
				// Don't fail the request if email fails, user was created successfully
			}

			// Get updated users list
			const { data: updatedUsers, error: fetchError } = await supabase
				.from('profiles')
				.select('id, email, role, created_at, updated_at')
				.eq('org_id', org_id!)
				.order('created_at', { ascending: false });

			if (fetchError) {
				console.error('Error fetching updated users:', fetchError);
			}

			return {
				success: true,
				message: `User ${email} added successfully. They will receive an invitation email.`,
				updatedUsers: updatedUsers || []
			};
		} catch (err) {
			console.error('Error in addUser action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	updateUserRole: async ({ request, locals }) => {
		const { supabase, user, org_id } = locals;

		if (!user?.role || !['super_admin', 'org_admin'].includes(user.role)) {
			return fail(403, { error: 'Insufficient permissions to update user roles' });
		}

		try {
			const formData = await request.formData();
			const userId = formData.get('userId') as string;
			const newRole = formData.get('role') as string;

			if (!userId || !newRole) {
				return fail(400, { error: 'User ID and role are required' });
			}

			// Validate the new role
			const validRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
			if (!validRoles.includes(newRole)) {
				return fail(400, { error: 'Invalid role specified' });
			}

			// Prevent self role changes to lower privilege (safety check)
			if (userId === user.id && user.role === 'super_admin' && newRole !== 'super_admin') {
				return fail(400, { error: 'Cannot downgrade your own super admin role' });
			}

			// Get current user to check permissions
			const { data: targetUserData, error: fetchError } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', userId)
				.eq('org_id', org_id!)
				.single();

			if (fetchError) {
				console.error('Error fetching target user:', fetchError);
				return fail(500, { error: 'Failed to find user' });
			}

			const targetUser = targetUserData as any;

			// Only super_admin can modify super_admin roles
			if (targetUser.role === 'super_admin' && user.role !== 'super_admin') {
				return fail(403, { error: 'Only super administrators can modify super admin roles' });
			}

			// Only super_admin can create super_admin roles
			if (newRole === 'super_admin' && user.role !== 'super_admin') {
				return fail(403, { error: 'Only super administrators can assign super admin roles' });
			}

			// Update user role
			const { error: updateError } = await (supabase as any)
				.from('profiles')
				.update({
					role: newRole,
					updated_at: new Date().toISOString()
				})
				.eq('id', userId)
				.eq('org_id', org_id!);

			if (updateError) {
				console.error('Error updating user role:', updateError);
				return fail(500, { error: 'Failed to update user role' });
			}

			// Get updated users list
			const { data: updatedUsers, error: fetchUsersError } = await supabase
				.from('profiles')
				.select('id, email, role, created_at, updated_at')
				.eq('org_id', org_id!)
				.order('created_at', { ascending: false });

			if (fetchUsersError) {
				console.error('Error fetching updated users:', fetchUsersError);
			}

			return {
				success: true,
				message: 'User role updated successfully',
				updatedUsers: updatedUsers || []
			};
		} catch (err) {
			console.error('Error in updateUserRole action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	deleteUser: async ({ request, locals }) => {
		const { supabase, user, org_id } = locals;

		if (!user?.role || !['super_admin', 'org_admin'].includes(user.role)) {
			return fail(403, { error: 'Insufficient permissions to delete users' });
		}

		try {
			const formData = await request.formData();
			const userId = formData.get('userId') as string;

			if (!userId) {
				return fail(400, { error: 'User ID is required' });
			}

			// Prevent self-deletion
			if (userId === user.id) {
				return fail(400, { error: 'Cannot delete your own account' });
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
				return fail(500, { error: 'Failed to find user' });
			}

			// Check if this is the last admin
			if (['super_admin', 'org_admin'].includes(targetUser.role)) {
				const { count: adminCount } = await supabase
					.from('profiles')
					.select('*', { count: 'exact', head: true })
					.eq('org_id', org_id!)
					.in('role', ['super_admin', 'org_admin'])
					.neq('id', userId);

				if ((adminCount || 0) === 0) {
					return fail(400, {
						error: 'Cannot delete the last administrator in the organization'
					});
				}
			}

			// Delete profile (this should cascade to related data)
			const { error: deleteError } = await supabase
				.from('profiles')
				.delete()
				.eq('id', userId)
				.eq('org_id', org_id!);

			if (deleteError) {
				console.error('Error deleting profile:', deleteError);
				return fail(500, { error: 'Failed to delete user profile' });
			}

			// Delete from auth (optional - you might want to keep the auth user)
			const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
			if (authDeleteError) {
				console.warn('Failed to delete auth user:', authDeleteError);
				// Don't fail the request if auth deletion fails
			}

			// Get updated users list
			const { data: updatedUsers, error: fetchUsersError } = await supabase
				.from('profiles')
				.select('id, email, role, created_at, updated_at')
				.eq('org_id', org_id!)
				.order('created_at', { ascending: false });

			if (fetchUsersError) {
				console.error('Error fetching updated users:', fetchUsersError);
			}
				
			return {
				success: true,
				message: `User ${targetUser.email} deleted successfully`,
				updatedUsers: updatedUsers || []
			};
		} catch (err) {
			console.error('Error in deleteUser action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};
