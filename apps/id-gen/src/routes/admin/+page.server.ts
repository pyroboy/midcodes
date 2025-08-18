import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { supabase, user, org_id } = locals;
	
	// Ensure we have parent data (user auth and permissions)
	await parent();

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
};

export const actions: Actions = {
	// Action for quick user role updates or other admin actions
	updateUserRole: async ({ request, locals }) => {
		const { supabase, user, org_id } = locals;
		
		// Check user roles from app_metadata
		const userRoles = user?.app_metadata?.role ? [user.app_metadata.role] : 
			(user?.app_metadata?.roles || []);
		const hasAdminPermission = userRoles.some((role: string) => 
			['super_admin', 'org_admin', 'property_admin'].includes(role)
		);
		
		if (!hasAdminPermission) {
			return fail(403, { error: 'Insufficient permissions' });
		}

		try {
			const formData = await request.formData();
			const userId = formData.get('userId') as string;
			const newRole = formData.get('role') as string;

			if (!userId || !newRole) {
				return fail(400, { error: 'Missing required fields' });
			}

			// Validate the new role
			const validRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
			if (!validRoles.includes(newRole)) {
				return fail(400, { error: 'Invalid role specified' });
			}

			// Update user role
			const { error: updateError } = await supabase
				.from('profiles')
				.update({ role: newRole, updated_at: new Date().toISOString() })
				.eq('id', userId)
				.eq('org_id', org_id); // Ensure user belongs to same org

			if (updateError) {
				console.error('Error updating user role:', updateError);
				return fail(500, { error: 'Failed to update user role' });
			}

			return { success: true, message: 'User role updated successfully' };

		} catch (err) {
			console.error('Error in updateUserRole action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	deleteUser: async ({ request, locals }) => {
		const { supabase, user, org_id } = locals;
		
		// Check user roles from app_metadata
		const userRoles = user?.app_metadata?.role ? [user.app_metadata.role] : 
			(user?.app_metadata?.roles || []);
		const hasDeletePermission = userRoles.some((role: string) => 
			['super_admin', 'org_admin', 'property_admin'].includes(role)
		);
		
		if (!hasDeletePermission) {
			return fail(403, { error: 'Insufficient permissions' });
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

			// Delete user profile (this should cascade to related data)
			const { error: deleteError } = await supabase
				.from('profiles')
				.delete()
				.eq('id', userId)
				.eq('org_id', org_id); // Ensure user belongs to same org

			if (deleteError) {
				console.error('Error deleting user:', deleteError);
				return fail(500, { error: 'Failed to delete user' });
			}

			return { success: true, message: 'User deleted successfully' };

		} catch (err) {
			console.error('Error in deleteUser action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};