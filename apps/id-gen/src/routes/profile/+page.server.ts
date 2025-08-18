import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, session, user, org_id } = locals;

	// Check if user is authenticated
	if (!session || !user) {
		throw redirect(303, '/auth?returnTo=/profile');
	}

	try {
		// Get user profile with preferences
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('id, email, role, created_at, updated_at, context')
			.eq('id', user.id)
			.single();

		if (profileError) {
			console.error('Error fetching profile:', profileError);
			throw error(500, 'Failed to load profile data');
		}

		// Get organization information
		let organization = null;
		if (org_id) {
			const { data: orgData, error: orgError } = await supabase
				.from('organizations')
				.select('id, name, created_at')
				.eq('id', org_id)
				.single();

			if (orgError) {
				console.error('Error fetching organization:', orgError);
			} else {
				organization = orgData;
			}
		}

		// Get available templates for default template selection
		const { data: templates, error: templatesError } = await supabase
			.from('templates')
			.select('id, name')
			.eq('org_id', org_id || '')
			.order('name');

		if (templatesError) {
			console.error('Error fetching templates:', templatesError);
		}

		// Get user statistics
		const { count: cardsCreated } = await supabase
			.from('idcards')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.id);

		// Extract preferences from context
		const preferences = profile.context?.preferences || {
			darkMode: false,
			emailNotifications: true,
			adminNotifications: true,
			defaultTemplate: null
		};

		return {
			profile: {
				id: profile.id,
				email: profile.email,
				role: profile.role,
				created_at: profile.created_at,
				updated_at: profile.updated_at
			},
			organization,
			preferences,
			templates: templates || [],
			userStats: {
				cardsCreated: cardsCreated || 0
			}
		};
	} catch (err) {
		console.error('Error loading profile data:', err);
		throw error(500, 'Failed to load profile data');
	}
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const { supabase, user } = locals;

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			const formData = await request.formData();

			// For now, we don't allow email changes via this form
			// Email updates should go through proper email verification flow

			// Update timestamp
			const { error: updateError } = await supabase
				.from('profiles')
				.update({
					updated_at: new Date().toISOString()
				})
				.eq('id', user.id);

			if (updateError) {
				console.error('Error updating profile:', updateError);
				return fail(500, { error: 'Failed to update profile' });
			}

			return {
				success: true,
				message: 'Profile updated successfully',
				updatedProfile: {
					updated_at: new Date().toISOString()
				}
			};
		} catch (err) {
			console.error('Error in updateProfile action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	updatePreferences: async ({ request, locals }) => {
		const { supabase, user } = locals;

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			const formData = await request.formData();
			const darkMode = formData.get('darkMode') === 'on';
			const emailNotifications = formData.get('emailNotifications') === 'on';
			const adminNotifications = formData.get('adminNotifications') === 'on';
			const defaultTemplate = formData.get('defaultTemplate') as string;

			// Get current profile to preserve other context data
			const { data: currentProfile, error: fetchError } = await supabase
				.from('profiles')
				.select('context')
				.eq('id', user.id)
				.single();

			if (fetchError) {
				console.error('Error fetching current profile:', fetchError);
				return fail(500, { error: 'Failed to fetch current profile' });
			}

			// Update preferences in context
			const updatedContext = {
				...currentProfile.context,
				preferences: {
					darkMode,
					emailNotifications,
					adminNotifications,
					defaultTemplate: defaultTemplate || null
				}
			};

			const { error: updateError } = await supabase
				.from('profiles')
				.update({
					context: updatedContext,
					updated_at: new Date().toISOString()
				})
				.eq('id', user.id);

			if (updateError) {
				console.error('Error updating preferences:', updateError);
				return fail(500, { error: 'Failed to update preferences' });
			}

			return {
				success: true,
				message: 'Preferences updated successfully',
				updatedPreferences: updatedContext.preferences
			};
		} catch (err) {
			console.error('Error in updatePreferences action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	changePassword: async ({ request, locals }) => {
		const { supabase, user } = locals;

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			const formData = await request.formData();
			const currentPassword = formData.get('currentPassword') as string;
			const newPassword = formData.get('newPassword') as string;
			const confirmPassword = formData.get('confirmPassword') as string;

			if (!currentPassword || !newPassword || !confirmPassword) {
				return fail(400, { error: 'All password fields are required' });
			}

			if (newPassword !== confirmPassword) {
				return fail(400, { error: 'New passwords do not match' });
			}

			if (newPassword.length < 6) {
				return fail(400, { error: 'Password must be at least 6 characters long' });
			}

			// Verify current password by attempting to sign in
			const { error: signInError } = await supabase.auth.signInWithPassword({
				email: user.email || '',
				password: currentPassword
			});

			if (signInError) {
				return fail(400, { error: 'Current password is incorrect' });
			}

			// Update password
			const { error: updateError } = await supabase.auth.updateUser({
				password: newPassword
			});

			if (updateError) {
				console.error('Error updating password:', updateError);
				return fail(500, { error: 'Failed to update password' });
			}

			return {
				success: true,
				message: 'Password updated successfully'
			};
		} catch (err) {
			console.error('Error in changePassword action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	exportData: async ({ locals }) => {
		const { supabase, user, org_id } = locals;

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			// Get user's profile data
			const { data: profile, error: profileError } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', user.id)
				.single();

			// Get user's created ID cards
			const { data: idCards, error: cardsError } = await supabase
				.from('idcards')
				.select('id, template_id, created_at, data')
				.eq('user_id', user.id);

			// Get user's created templates (if any)
			const { data: templates, error: templatesError } = await supabase
				.from('templates')
				.select('id, name, created_at')
				.eq('user_id', user.id);

			if (profileError || cardsError || templatesError) {
				console.error('Error exporting data:', { profileError, cardsError, templatesError });
				return fail(500, { error: 'Failed to export data' });
			}

			// Create export data
			const exportData = {
				exportDate: new Date().toISOString(),
				profile: {
					id: profile.id,
					email: profile.email,
					role: profile.role,
					created_at: profile.created_at,
					updated_at: profile.updated_at,
					preferences: profile.context?.preferences || {}
				},
				idCards:
					idCards?.map((card) => ({
						id: card.id,
						template_id: card.template_id,
						created_at: card.created_at,
						data: card.data
					})) || [],
				templates: templates || [],
				statistics: {
					totalIdCards: idCards?.length || 0,
					totalTemplates: templates?.length || 0
				}
			};

			// Return the data as JSON for download
			return {
				success: true,
				exportData,
				message: 'Data exported successfully'
			};
		} catch (err) {
			console.error('Error in exportData action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	deleteAccount: async ({ locals }) => {
		const { supabase, user, org_id } = locals;

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			// First get the user's profile to check their role
			const { data: profile, error: profileError } = await supabase
				.from('profiles')
				.select('role, org_id')
				.eq('id', user.id)
				.single();

			if (profileError) {
				console.error('Error fetching profile:', profileError);
				return fail(500, { error: 'Failed to access profile' });
			}

			// Note: This is a soft delete - we remove the profile but the auth user remains
			// In a production system, you might want to implement a proper account deletion flow
			// that includes email verification and a grace period

			// Check if user has admin role - prevent deletion of last admin
			if (profile.role && ['super_admin', 'org_admin'].includes(profile.role)) {
				// Count other admins in organization
				const { count: adminCount } = await supabase
					.from('profiles')
					.select('*', { count: 'exact', head: true })
					.eq('org_id', profile.org_id || org_id || '')
					.in('role', ['super_admin', 'org_admin'])
					.neq('id', user.id);

				if ((adminCount || 0) === 0) {
					return fail(400, {
						error: 'Cannot delete account: You are the last administrator in your organization'
					});
				}
			}

			// Delete profile (this should cascade to related data based on foreign key constraints)
			const { error: deleteError } = await supabase.from('profiles').delete().eq('id', user.id);

			if (deleteError) {
				console.error('Error deleting profile:', deleteError);
				return fail(500, { error: 'Failed to delete account' });
			}

			// Sign out the user
			await supabase.auth.signOut();

			// Redirect to auth page with message
			throw redirect(303, '/auth?message=Account deleted successfully');
		} catch (err) {
			if (err instanceof Error && err.message.includes('redirect')) {
				throw err; // Re-throw redirects
			}
			console.error('Error in deleteAccount action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};
