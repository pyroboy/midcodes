import { error, redirect } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import { z } from 'zod';

// Import schemas following AZPOS pattern
import {
	updateProfileInputSchema,
	changePasswordInputSchema,
	profileOutputSchema,
	updateProfileResultSchema,
	passwordChangeResultSchema,
	type UpdateProfileInput,
	type ChangePasswordInput,
	type ProfileOutput,
	type UpdateProfileResult,
	type PasswordChangeResult
} from '$lib/types/profile.schema';

// Local schemas for functions not covered by profile.schema.ts
const updatePreferencesSchema = z.object({
	darkMode: z.boolean(),
	emailNotifications: z.boolean(),
	adminNotifications: z.boolean(),
	defaultTemplate: z.string().nullable()
});

// Helper function to check authentication
async function requireAuth() {
	const { locals } = getRequestEvent();
	const { user, session, supabase, org_id } = locals;

	if (!session || !user) {
		throw redirect(303, '/auth?returnTo=/profile');
	}

	return { user, session, supabase, org_id };
}

// Query functions
export const getProfileData = query(async (): Promise<any> => {
	const { user, supabase, org_id } = await requireAuth();

	try {
		// Get user profile with preferences
		const { data: profileData, error: profileError } = await supabase
			.from('profiles')
			.select('id, email, role, created_at, updated_at, context')
			.eq('id', user.id)
			.single();

		if (profileError) {
			console.error('Error fetching profile:', profileError);
			throw error(500, 'Failed to load profile data');
		}

		const profile = profileData as any;

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
		const p = profile as any;
		const preferences = p.context?.preferences || {
			darkMode: false,
			emailNotifications: true,
			adminNotifications: true,
			defaultTemplate: null
		};

		return {
			profile: {
				id: p.id,
				email: p.email,
				role: p.role,
				created_at: p.created_at,
				updated_at: p.updated_at
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
});

// Command functions
export const updateProfile = command('unchecked', async () => {
	const { user, supabase } = await requireAuth();

	try {
		// For now, we don't allow email changes via this form
		// Email updates should go through proper email verification flow

		// Update timestamp
		const { error: updateError } = await (supabase as any)
			.from('profiles')
			.update({
				updated_at: new Date().toISOString()
			})
			.eq('id', user.id);

		if (updateError) {
			console.error('Error updating profile:', updateError);
			throw error(500, 'Failed to update profile');
		}

		// Refresh the profile data
		await getProfileData().refresh();

		return {
			success: true,
			message: 'Profile updated successfully'
		};
	} catch (err) {
		console.error('Error in updateProfile command:', err);
		if (err instanceof Error && err.message.includes('error')) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'An unexpected error occurred');
	}
});

export const updatePreferences = command(
	'unchecked',
	async ({ darkMode, emailNotifications, adminNotifications, defaultTemplate }: any) => {
		const { user, supabase } = await requireAuth();

		try {
			// Get current profile to preserve other context data
			const { data: currentProfile, error: fetchError } = await supabase
				.from('profiles')
				.select('context')
				.eq('id', user.id)
				.single();

			if (fetchError) {
				console.error('Error fetching current profile:', fetchError);
				throw error(500, 'Failed to fetch current profile');
			}

			// Build updated context with preferences
			const existingContext = (currentProfile as any)?.context || {};
			const updatedContext = {
				...existingContext,
				preferences: {
					darkMode,
					emailNotifications,
					adminNotifications,
					defaultTemplate: defaultTemplate || null
				}
			};

			// Update profile context
			const { error: updateError } = await (supabase as any)
				.from('profiles')
				.update({
					context: updatedContext,
					updated_at: new Date().toISOString()
				})
				.eq('id', user.id);

			if (updateError) {
				console.error('Error updating preferences:', updateError);
				throw error(500, 'Failed to update preferences');
			}

			// Refresh the profile data
			await getProfileData().refresh();

			return {
				success: true,
				message: 'Preferences updated successfully'
			};
		} catch (err) {
			console.error('Error in updatePreferences command:', err);
			if (err instanceof Error && err.message.includes('error')) {
				throw err; // Re-throw SvelteKit errors
			}
			throw error(500, 'An unexpected error occurred');
		}
	}
);

export const changePassword = command(
	'unchecked',
	async ({ currentPassword, newPassword, confirmPassword }: any) => {
		const { user, supabase } = await requireAuth();

		try {
			if (newPassword !== confirmPassword) {
				throw error(400, 'New passwords do not match');
			}

			// Verify current password by attempting to sign in
			const { error: signInError } = await supabase.auth.signInWithPassword({
				email: user.email || '',
				password: currentPassword
			});

			if (signInError) {
				throw error(400, 'Current password is incorrect');
			}

			// Update password
			const { error: updateError } = await supabase.auth.updateUser({
				password: newPassword
			});

			if (updateError) {
				console.error('Error updating password:', updateError);
				throw error(500, 'Failed to update password');
			}

			return {
				success: true,
				message: 'Password updated successfully'
			};
		} catch (err) {
			console.error('Error in changePassword command:', err);
			if (err instanceof Error && err.message.includes('error')) {
				throw err; // Re-throw SvelteKit errors
			}
			throw error(500, 'An unexpected error occurred');
		}
	}
);

export const exportData = command('unchecked', async () => {
	const { user, supabase, org_id } = await requireAuth();

	try {
		// Get user's profile data
		const { data: profileData, error: profileError } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		// Get user's created ID cards
		const { data: idCardsData, error: cardsError } = await supabase
			.from('idcards')
			.select('id, template_id, created_at, data')
			.eq('user_id', user.id);

		// Get user's created templates (if any)
		const { data: templatesData, error: templatesError } = await supabase
			.from('templates')
			.select('id, name, created_at')
			.eq('user_id', user.id);

		if (profileError || cardsError || templatesError) {
			console.error('Error exporting data:', { profileError, cardsError, templatesError });
			throw error(500, 'Failed to export data');
		}

		const profile = profileData as any;
		const idCards = (idCardsData as any[]) || [];
		const templates = (templatesData as any[]) || [];

		// Create export data
		const p = profile as any;
		const exportData = {
			exportDate: new Date().toISOString(),
			profile: {
				id: p.id,
				email: p.email,
				role: p.role,
				created_at: p.created_at,
				updated_at: p.updated_at,
				preferences: p.context?.preferences || {}
			},
			idCards: idCards.map((card: any) => ({
				id: card.id,
				template_id: card.template_id,
				created_at: card.created_at,
				data: card.data
			})),
			templates,
			statistics: {
				totalIdCards: idCards.length,
				totalTemplates: templates.length
			}
		};

		// Return the data as JSON for download
		return {
			success: true,
			exportData,
			message: 'Data exported successfully'
		};
	} catch (err) {
		console.error('Error in exportData command:', err);
		if (err instanceof Error && err.message.includes('error')) {
			throw err; // Re-throw SvelteKit errors
		}
		throw error(500, 'An unexpected error occurred');
	}
});

export const deleteAccount = command('unchecked', async () => {
	const { user, supabase } = await requireAuth();

	try {
		// Note: This is a soft delete - we remove the profile but the auth user remains
		// In a production system, you might want to implement a proper account deletion flow
		// that includes email verification and a grace period

		// Get current user profile to check org_id and role
		const { data: currentProfile, error: profileError } = await supabase
			.from('profiles')
			.select('org_id, role')
			.eq('id', user.id)
			.single();

		if (profileError) {
			console.error('Error fetching profile:', profileError);
			throw error(500, 'Failed to fetch profile');
		}

		// Check if user has admin role - prevent deletion of last admin
		const currentProfileAny = currentProfile as any;
		if (currentProfileAny.role && ['super_admin', 'org_admin'].includes(currentProfileAny.role)) {
			// Count other admins in organization
			const { count: adminCount } = await supabase
				.from('profiles')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', currentProfileAny.org_id || '')
				.in('role', ['super_admin', 'org_admin'])
				.neq('id', user.id);

			if ((adminCount || 0) === 0) {
				throw error(
					400,
					'Cannot delete account: You are the last administrator in your organization'
				);
			}
		}

		// Delete profile (this should cascade to related data based on foreign key constraints)
		const { error: deleteError } = await supabase.from('profiles').delete().eq('id', user.id);

		if (deleteError) {
			console.error('Error deleting profile:', deleteError);
			throw error(500, 'Failed to delete account');
		}

		// Sign out the user
		await supabase.auth.signOut();

		// Redirect to auth page with message
		throw redirect(303, '/auth?message=Account deleted successfully');
	} catch (err) {
		if (err instanceof Error && err.message.includes('redirect')) {
			throw err; // Re-throw redirects
		}
		console.error('Error in deleteAccount command:', err);
		throw error(500, 'An unexpected error occurred');
	}
});
