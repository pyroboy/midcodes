import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { checkSuperAdmin, checkSuperAdminEmulatedOnly, shouldBypassFor403, wantsToAssumeRole } from '$lib/utils/adminPermissions';

// Type for organization from database
interface Organization {
	id: string;
	name: string;
	created_at: string | null;
	updated_at: string | null;
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
	const { supabase, user, roleEmulation } = locals;

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
		// Fetch ALL organizations with member counts
		const { data: organizations, error: orgsError } = await supabase
			.from('organizations')
			.select(
				`
				id,
				name,
				created_at,
				updated_at
			`
			)
			.order('name', { ascending: true });

		if (orgsError) {
			console.error('Error fetching organizations:', orgsError);
			throw error(500, 'Failed to fetch organizations');
		}

		// Cast to proper type
		const typedOrganizations = (organizations || []) as Organization[];

		// Get member counts and card counts for each organization
		const orgStats: OrganizationWithStats[] = await Promise.all(
			typedOrganizations.map(async (org: Organization) => {
				const [{ count: memberCount }, { count: cardCount }, { count: templateCount }] =
					await Promise.all([
						supabase
							.from('profiles')
							.select('*', { count: 'exact', head: true })
							.eq('org_id', org.id),
						supabase
							.from('idcards')
							.select('*', { count: 'exact', head: true })
							.eq('org_id', org.id),
						supabase
							.from('templates')
							.select('*', { count: 'exact', head: true })
							.eq('org_id', org.id)
					]);

				return {
					...org,
					memberCount: memberCount || 0,
					cardCount: cardCount || 0,
					templateCount: templateCount || 0
				};
			})
		);

		// Calculate global stats
		const totalOrganizations = orgStats.length;
		const totalMembers = orgStats.reduce(
			(sum: number, org: OrganizationWithStats) => sum + org.memberCount,
			0
		);
		const totalCards = orgStats.reduce(
			(sum: number, org: OrganizationWithStats) => sum + org.cardCount,
			0
		);
		const totalTemplates = orgStats.reduce(
			(sum: number, org: OrganizationWithStats) => sum + org.templateCount,
			0
		);

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
