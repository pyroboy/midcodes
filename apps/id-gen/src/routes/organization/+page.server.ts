import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { hasRole, checkSuperAdmin } from '$lib/utils/adminPermissions';
import { db } from '$lib/server/db';
import { organizations, profiles, idcards, templates, orgSettings, roles } from '$lib/server/schema';
import { eq, desc, sql, or, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent, locals }) => {
	// Get data from parent layout (authentication check happens there)
	const parentData = await parent();
	const { user, org_id } = locals;

	if (!user) {
		throw redirect(303, '/auth');
	}

	if (!org_id) {
		throw error(403, 'No organization associated with your account');
	}

	// Require org admin or super admin role
	const isSuperAdmin = checkSuperAdmin(locals);
	const isOrgAdmin = hasRole(locals, ['org_admin']) || isSuperAdmin;

	if (!isOrgAdmin) {
		throw error(403, 'Organization admin privileges required');
	}

	try {
		// Fetch current organization details
		const [organization] = await db.select()
			.from(organizations)
			.where(eq(organizations.id, org_id))
			.limit(1);

		if (!organization) {
			throw error(500, 'Failed to fetch organization');
		}

		// Fetch organization members with their profiles
		const members = await db.select({
			id: profiles.id,
			email: profiles.email,
			role: profiles.role,
			created_at: profiles.createdAt,
			updated_at: profiles.updatedAt,
			credits_balance: profiles.creditsBalance,
			card_generation_count: profiles.cardGenerationCount
		})
			.from(profiles)
			.where(eq(profiles.orgId, org_id))
			.orderBy(desc(profiles.createdAt));

		// Fetch org statistics
		const [totalCardsResult, totalTemplatesResult, orgSettingsData] = await Promise.all([
			db.select({ count: sql<number>`count(*)` }).from(idcards).where(eq(idcards.orgId, org_id)),
			db.select({ count: sql<number>`count(*)` }).from(templates).where(eq(templates.orgId, org_id)),
			db.select().from(orgSettings).where(eq(orgSettings.orgId, org_id)).limit(1)
		]);

		const totalCards = Number(totalCardsResult[0]?.count || 0);
		const totalTemplates = Number(totalTemplatesResult[0]?.count || 0);

		// Fetch available roles (system roles + org-specific roles)
		const availableRoles = await db.select({
			id: roles.id,
			name: roles.name,
			display_name: roles.displayName,
			description: roles.description,
			is_system: roles.isSystem,
			org_id: roles.orgId
		})
			.from(roles)
			.where(or(isNull(roles.orgId), eq(roles.orgId, org_id)))
			.orderBy(roles.name);

		return {
			...parentData,
			organization,
			members: members || [],
			stats: {
				totalCards,
				totalTemplates,
				totalMembers: members?.length || 0
			},
			orgSettings: orgSettingsData[0] || null,
			availableRoles: availableRoles || [],
			capabilities: {
				isSuperAdmin,
				isOrgAdmin,
				canManageMembers: isOrgAdmin,
				canManageRoles: isSuperAdmin, // Only super admins can create/delete roles
				canManageSettings: isOrgAdmin
			}
		};
	} catch (err) {
		console.error('Error loading organization page:', err);
		throw error(500, 'Failed to load organization data');
	}
};
