import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { checkSuperAdmin, checkSuperAdminEmulatedOnly, shouldBypassFor403, wantsToAssumeRole } from '$lib/utils/adminPermissions';
import { db } from '$lib/server/db';
import { organizations, profiles, idcards, templates } from '$lib/server/schema';
import { eq, sql, desc } from 'drizzle-orm';

// Type for organization from database
interface Organization {
	id: string;
	name: string;
	created_at: Date | null;
	updated_at: Date | null;
}

// Type for organization with stats
interface OrganizationWithStats extends Organization {
	memberCount: number;
	cardCount: number;
	templateCount: number;
}

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	// Get data from parent layout (authentication check happens there)
	const parentData = await parent();
	const { user, roleEmulation } = locals;

	if (!user) {
		throw error(403, 'Access denied');
	}

	// Check if user wants to assume the emulated role and experience being blocked
	const assumingRole = wantsToAssumeRole(locals, url);
	
	// Super admin only - this page manages ALL organizations
	// Use emulated-only check if user wants to assume role
	const isSuperAdmin = assumingRole 
		? checkSuperAdminEmulatedOnly(locals) 
		: checkSuperAdmin(locals);
	
	const canBypass = shouldBypassFor403(locals, url);

	// If not super admin and not bypassing, show soft denial for super admins to bypass
	if (!isSuperAdmin && !canBypass) {
		// Check if the original role is super admin (for bypass prompt)
		const originalIsSuperAdmin = checkSuperAdmin(locals);

		if (originalIsSuperAdmin) {
			// Super admin assuming role - show bypass prompt instead of 403
			return {
				...parentData,
				accessDenied: true,
				assumingRole: true,
				requiredRole: 'super_admin',
				currentRole: roleEmulation?.originalRole || user.role,
				emulatedRole: roleEmulation?.emulatedRole,
				isSuperAdmin: true
			};
		}

		// Not a super admin at all - throw hard 403
		throw error(
			403,
			'Super admin privileges required. Use /organization to manage your own organization.'
		);
	}

	// Determine if this is a bypassed access
	const bypassedAccess = canBypass;

	try {
		// Fetch ALL organizations using Drizzle
		const orgs = await db.select({
			id: organizations.id,
			name: organizations.name,
			created_at: organizations.createdAt,
			updated_at: organizations.updatedAt
		})
			.from(organizations)
			.orderBy(organizations.name);

		// Get member counts using aggregation queries for efficiency
		// We'll perform separate queries for stats to avoid complex joins/group bys if possible, 
		// or loop if N is small. For admin page, N is likely manageable, but better to be efficient.

		// Let's use individual counts per org for simplicity and accuracy matching previous logic
		// Or perform a group by query if we want to be fancy.
		// Drizzle group by:
		// db.select({ orgId: profiles.orgId, count: count() }).from(profiles).groupBy(profiles.orgId)
		
		const [memberCounts, cardCounts, templateCounts] = await Promise.all([
			db.select({ orgId: profiles.orgId, count: sql<number>`count(*)` })
				.from(profiles)
				.groupBy(profiles.orgId),
			db.select({ orgId: idcards.orgId, count: sql<number>`count(*)` })
				.from(idcards)
				.groupBy(idcards.orgId),
			db.select({ orgId: templates.orgId, count: sql<number>`count(*)` })
				.from(templates)
				.groupBy(templates.orgId)
		]);

		const memberCountMap = new Map(memberCounts.map(m => [m.orgId, Number(m.count)]));
		const cardCountMap = new Map(cardCounts.map(c => [c.orgId, Number(c.count)]));
		const templateCountMap = new Map(templateCounts.map(t => [t.orgId, Number(t.count)]));

		// Combine data
		const orgStats: OrganizationWithStats[] = orgs.map(org => ({
			...org,
			memberCount: memberCountMap.get(org.id) || 0,
			cardCount: cardCountMap.get(org.id) || 0,
			templateCount: templateCountMap.get(org.id) || 0
		}));

		// Calculate global stats
		const totalOrganizations = orgStats.length;
		const totalMembers = orgStats.reduce((sum, org) => sum + org.memberCount, 0);
		const totalCards = orgStats.reduce((sum, org) => sum + org.cardCount, 0);
		const totalTemplates = orgStats.reduce((sum, org) => sum + org.templateCount, 0);

		return {
			...parentData,
			organizations: orgStats,
			globalStats: {
				totalOrganizations,
				totalMembers,
				totalCards,
				totalTemplates
			},
			capabilities: {
				isSuperAdmin: true,
				canCreateOrg: true,
				canDeleteOrg: true,
				canEditOrg: true
			},
			// Bypass info for UI
			bypassedAccess,
			requiredRole: bypassedAccess ? 'super_admin' : undefined,
			originalRole: bypassedAccess ? roleEmulation?.originalRole || user.role : undefined
		};
	} catch (err) {
		console.error('Error loading organizations page:', err);
		throw error(500, 'Failed to load organizations data');
	}
};
