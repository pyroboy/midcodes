import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { idcards, profiles, templates } from '$lib/server/schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user, org_id } = locals;

	// Ensure we have parent data (user auth and permissions)
	await parent();

	if (!org_id) {
		throw error(500, 'Organization ID not found');
	}

	try {
		// Get organization stats with Drizzle
		const [
			totalCardsResult,
			usersData,
			templatesData,
			recentCardsData
		] = await Promise.all([
			// Total cards count
			db.select({ count: sql<number>`count(*)` })
				.from(idcards)
				.where(eq(idcards.orgId, org_id)),

			// All users in organization
			db.select({
				id: profiles.id,
				email: profiles.email,
				role: profiles.role,
				created_at: profiles.createdAt,
				updated_at: profiles.updatedAt
			})
				.from(profiles)
				.where(eq(profiles.orgId, org_id))
				.orderBy(desc(profiles.createdAt)),

			// All templates in organization
			db.select({
				id: templates.id,
				name: templates.name,
				created_at: templates.createdAt,
				user_id: templates.userId
			})
				.from(templates)
				.where(eq(templates.orgId, org_id))
				.orderBy(desc(templates.createdAt)),

			// Recent card generations
			db.select({
				id: idcards.id,
				template_id: idcards.templateId,
				created_at: idcards.createdAt,
				data: idcards.data
			})
				.from(idcards)
				.where(eq(idcards.orgId, org_id))
				.orderBy(desc(idcards.createdAt))
				.limit(10)
		]);

		const totalCards = Number(totalCardsResult[0]?.count || 0);
		const users = usersData as any[];
		const recentCards = recentCardsData as any[];

		// Calculate new cards this month
		const thisMonth = new Date();
		thisMonth.setDate(1);
		thisMonth.setHours(0, 0, 0, 0);

		const newCardsThisMonth =
			recentCards?.filter((card) => new Date(card.created_at) >= thisMonth).length || 0;

		// Create recent activity from recent cards
		const recentActivity =
			recentCards
				?.map((card) => ({
					id: card.id,
					type: 'card_generated',
					description: `ID card generated for ${card.data?.name || card.data?.full_name || 'Unknown'}`,
					created_at: card.created_at
				}))
				.slice(0, 5) || [];

		// Add user registration activities
		const recentUsers =
			users
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
				newCardsThisMonth
			},
			users: users || [],
			templates: templatesData || [],
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
};

export const actions: Actions = {
	// Action for quick user role updates or other admin actions
	updateUserRole: async ({ request, locals }) => {
		const { user, org_id } = locals;

		// Check user permissions via effectiveRoles
		const userRoles = locals.effectiveRoles || [];
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

			// Update user role with Drizzle
			await db.update(profiles)
				.set({ 
					role: newRole as any, 
					updatedAt: new Date() 
				})
				.where(and(
					eq(profiles.id, userId),
					eq(profiles.orgId, org_id!)
				));

			return { success: true, message: 'User role updated successfully' };
		} catch (err) {
			console.error('Error in updateUserRole action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	},

	deleteUser: async ({ request, locals }) => {
		const { user, org_id } = locals;

		// Check user permissions via effectiveRoles
		const userRoles = locals.effectiveRoles || [];
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
			if (user?.id && userId === user.id) {
				return fail(400, { error: 'Cannot delete your own account' });
			}

			// Delete user profile with Drizzle
			await db.delete(profiles)
				.where(and(
					eq(profiles.id, userId),
					eq(profiles.orgId, org_id!)
				));

			return { success: true, message: 'User deleted successfully' };
		} catch (err) {
			console.error('Error in deleteUser action:', err);
			return fail(500, { error: 'An unexpected error occurred' });
		}
	}
};

