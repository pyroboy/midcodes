import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent, locals }) => {
	// Get data from parent layout (authentication check happens there)
	const parentData = await parent();
	const { supabase, user, org_id, permissions } = locals;

	if (!user || !org_id) {
		throw error(403, 'Access denied');
	}

	// Determine user capabilities based on role
	const isSuperAdmin = ['super_admin', 'id_gen_super_admin'].includes(user.role || '');
	const isOrgAdmin = ['org_admin', 'id_gen_org_admin'].includes(user.role || '') || isSuperAdmin;

	if (!isOrgAdmin) {
		throw error(403, 'Organization admin privileges required');
	}

	try {
		// Fetch current organization details
		const { data: organization, error: orgError } = await supabase
			.from('organizations')
			.select('*')
			.eq('id', org_id)
			.single();

		if (orgError) {
			console.error('Error fetching organization:', orgError);
			throw error(500, 'Failed to fetch organization');
		}

		// Fetch organization members with their profiles
		const { data: members, error: membersError } = await supabase
			.from('profiles')
			.select('id, email, role, created_at, updated_at, credits_balance, card_generation_count')
			.eq('org_id', org_id)
			.order('created_at', { ascending: false });

		if (membersError) {
			console.error('Error fetching members:', membersError);
		}

		// Fetch org statistics
		const [
			{ count: totalCards },
			{ count: totalTemplates },
			{ data: orgSettings }
		] = await Promise.all([
			supabase.from('idcards').select('*', { count: 'exact', head: true }).eq('org_id', org_id),
			supabase.from('templates').select('*', { count: 'exact', head: true }).eq('org_id', org_id),
			supabase.from('org_settings').select('*').eq('org_id', org_id).single()
		]);

		// For super admins, fetch all organizations for the switcher
		let allOrganizations: { id: string; name: string }[] = [];
		if (isSuperAdmin) {
			const { data: orgs, error: orgsError } = await supabase
				.from('organizations')
				.select('id, name')
				.order('name', { ascending: true });

			if (!orgsError && orgs) {
				allOrganizations = orgs;
			}
		}

		// Fetch available roles (system roles + org-specific roles)
		const { data: availableRoles, error: rolesError } = await supabase
			.from('roles')
			.select('id, name, display_name, description, is_system, org_id')
			.or(`org_id.is.null,org_id.eq.${org_id}`)
			.order('name', { ascending: true });

		if (rolesError) {
			console.error('Error fetching roles:', rolesError);
		}

		return {
			...parentData,
			organization,
			members: members || [],
			stats: {
				totalCards: totalCards || 0,
				totalTemplates: totalTemplates || 0,
				totalMembers: members?.length || 0
			},
			orgSettings: orgSettings || null,
			allOrganizations,
			availableRoles: availableRoles || [],
			capabilities: {
				isSuperAdmin,
				isOrgAdmin,
				canManageMembers: isOrgAdmin,
				canManageRoles: isSuperAdmin,
				canSwitchOrgs: isSuperAdmin,
				canManageSettings: isOrgAdmin
			}
		};
	} catch (err) {
		console.error('Error loading organization page:', err);
		throw error(500, 'Failed to load organization data');
	}
};
