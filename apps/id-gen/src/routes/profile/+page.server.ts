import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profiles, organizations, templates, idcards } from '$lib/server/schema';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user, org_id } = locals;

	// Check if user is authenticated
	if (!session || !user) {
		throw redirect(303, '/auth?returnTo=/profile');
	}

	try {
		// Get user profile with preferences
		const profile = await db.query.profiles.findFirst({
			where: eq(profiles.id, user.id)
		});

		if (!profile) {
			throw error(404, 'Profile not found');
		}

		// Get organization information
		let organization = null;
		if (org_id) {
			const orgData = await db.query.organizations.findFirst({
				where: eq(organizations.id, org_id)
			});

			if (orgData) {
				organization = orgData;
			}
		}

		// Get available templates for default template selection
		const templatesList = await db.select()
			.from(templates)
			.where(eq(templates.orgId, org_id || ''))
			.orderBy(templates.name);

		// Get user statistics
		const cardsCreated = profile.cardGenerationCount || 0;

		// Extract preferences from context
		const profileData = profile as any;
		const preferences = profileData.context?.preferences || {
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
				created_at: profile.createdAt,
				updated_at: profile.updatedAt
			},
			organization,
			preferences,
			templates: templatesList || [],
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
		const { user } = locals;

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			// Update timestamp
			await db.update(profiles)
				.set({
					updatedAt: new Date()
				})
				.where(eq(profiles.id, user.id));

			return {
				success: true,
				message: 'Profile updated successfully',
				updatedProfile: {
					updated_at: new Date()
				}
			};
		} catch (err) {
			console.error('Error in updateProfile action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	updatePreferences: async ({ request, locals }) => {
		const { user } = locals;

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
			const currentProfiles = await db.select({ context: profiles.context })
				.from(profiles)
				.where(eq(profiles.id, user.id))
				.limit(1);

			if (currentProfiles.length === 0) {
				return fail(500, { error: 'Failed to fetch current profile' });
			}

			const currentContext = (currentProfiles[0].context as any) || {};

			// Update preferences in context
			const updatedContext = {
				...currentContext,
				preferences: {
					darkMode,
					emailNotifications,
					adminNotifications,
					defaultTemplate: defaultTemplate || null
				}
			};

			await db.update(profiles)
				.set({
					context: updatedContext,
					updatedAt: new Date()
				})
				.where(eq(profiles.id, user.id));

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
		const { user } = locals;

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

			// Better Auth change password
			try {
				await auth.api.changePassword({
					body: {
						newPassword: newPassword,
						currentPassword: currentPassword,
						revokeOtherSessions: true
					},
					headers: request.headers
				});
			} catch (authError: any) {
				return fail(400, { error: authError.message || 'Failed to update password' });
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
		const { user } = locals;

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			// Get user's profile data
			const profile = await db.query.profiles.findFirst({
				where: eq(profiles.id, user.id)
			});

			// Get user's created ID cards (using orgId for now as specific user tracking might be on org level)
			const idCardsData = await db.select({
				id: idcards.id,
				template_id: idcards.templateId,
				created_at: idcards.createdAt,
				data: idcards.data
			})
				.from(idcards)
				.where(eq(idcards.orgId, user.orgId || ''));

			// Get user's created templates (if any)
			const templatesData = await db.select({
				id: templates.id,
				name: templates.name,
				created_at: templates.createdAt
			})
				.from(templates)
				.where(eq(templates.userId, user.id));

			if (!profile) {
				return fail(500, { error: 'Failed to export data' });
			}

			// Create export data
			const profileData = profile as any;
			const exportData = {
				exportDate: new Date().toISOString(),
				profile: {
					id: profileData.id,
					email: profileData.email,
					role: profileData.role,
					created_at: profileData.createdAt,
					updated_at: profileData.updatedAt,
					preferences: profileData.context?.preferences || {}
				},
				idCards:
					idCardsData?.map((card) => ({
						id: card.id,
						template_id: card.template_id,
						created_at: card.created_at,
						data: card.data
					})) || [],
				templates: templatesData || [],
				statistics: {
					totalIdCards: idCardsData?.length || 0,
					totalTemplates: templatesData?.length || 0
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

	deleteAccount: async ({ locals, request }) => {
		const { user } = locals; // org_id might not be available if not set in locals yet

		if (!user) {
			return fail(401, { error: 'Not authenticated' });
		}

		try {
			// First get the user's profile to check their role
			const profile = await db.query.profiles.findFirst({
				where: eq(profiles.id, user.id),
				columns: { role: true, orgId: true }
			});

			if (!profile) {
				return fail(500, { error: 'Failed to access profile' });
			}

			// Check if user has admin role - prevent deletion of last admin
			if (profile.role && ['super_admin', 'org_admin'].includes(profile.role)) {
                // If orgId is missing, they can't be the last admin of an org, but let's be safe
                if (profile.orgId) {
                    // Count other admins in organization
                    const adminCountResult = await db.select({ count: sql<number>`count(*)` })
                        .from(profiles)
                        .where(and(
                            eq(profiles.orgId, profile.orgId),
                            inArray(profiles.role, ['super_admin', 'org_admin'] as any),
                            sql`${profiles.id} != ${user.id}`
                        ));

                    const adminCount = Number(adminCountResult[0]?.count || 0);

                    if (adminCount === 0) {
                        return fail(400, {
                            error: 'Cannot delete account: You are the last administrator in your organization'
                        });
                    }
                }
			}

			// Delete Better Auth user
			try {
				await auth.api.deleteUser({
                    body: {},
                    headers: request.headers
                });
			} catch (authError: any) {
				console.error('Error deleting auth user:', authError);
				return fail(500, { error: 'Failed to delete account auth: ' + authError.message });
			}

            // Explicitly delete profile in case cascade is not set up
            await db.delete(profiles).where(eq(profiles.id, user.id));

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
