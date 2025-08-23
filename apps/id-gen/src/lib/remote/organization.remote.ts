import { error } from '@sveltejs/kit';
import { query, command, getRequestEvent } from '$app/server';
import type { Database } from '$lib/types/database.types.js';
import {
	organizationCreationSchema,
	organizationUpdateSchema,
	orgSettingsUpdateSchema,
	organizationSearchSchema,
	type OrganizationCreation,
	type OrganizationResponse,
	type OrganizationUpdate,
	type OrgSettings,
	type OrgSettingsUpdate,
	type OrganizationStats,
	type OrganizationSearch
} from '$lib/schemas/organization.schema.js';

// Helper function to check super admin permissions
async function requireSuperAdminPermissions() {
	const { locals } = getRequestEvent();
	const { user } = locals;

	if (user?.role !== 'super_admin') {
		throw error(403, 'Super admin privileges required.');
	}

	return { user, supabase: locals.supabase, org_id: locals.org_id };
}

// Helper function to check organization admin permissions
async function requireOrgAdminPermissions() {
	const { locals } = getRequestEvent();
	const { user } = locals;

	if (!user?.role || !['super_admin', 'org_admin'].includes(user.role)) {
		throw error(403, 'Organization admin privileges required.');
	}

	return { user, supabase: locals.supabase, org_id: locals.org_id };
}

// Helper function to check organization access
async function requireOrganizationAccess() {
	const { locals } = getRequestEvent();
	const { user } = locals;

	if (!user?.role) {
		throw error(401, 'Authentication required.');
	}

	return { user, supabase: locals.supabase, org_id: locals.org_id };
}

// Query functions
export const getOrganization = query(async (id?: string): Promise<OrganizationResponse> => {
	const { user, supabase, org_id } = await requireOrganizationAccess();

	// Use provided ID or current user's org_id
	const targetOrgId = id || org_id;

	if (!targetOrgId) {
		throw error(400, 'Organization ID is required');
	}

	// Only super admin can access other organizations
	if (id && id !== org_id && user.role !== 'super_admin') {
		throw error(403, 'Access denied to this organization');
	}

	try {
		const { data: organization, error: orgError } = await supabase
			.from('organizations')
			.select('id, name, created_at, updated_at')
			.eq('id', targetOrgId)
			.single();

		if (orgError) {
			console.error('Error fetching organization:', orgError);
			throw error(404, 'Organization not found');
		}

		return organization;
	} catch (err) {
		console.error('Error in getOrganization:', err);
		throw error(500, 'Failed to fetch organization');
	}
});

export const getOrganizationStats = query(async (): Promise<OrganizationStats> => {
	const { user, supabase, org_id } = await requireOrganizationAccess();

	if (!org_id) {
		throw error(400, 'Organization ID not found');
	}

	try {
		// Get current month boundaries
		const now = new Date();
		const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

		// Execute all queries in parallel
		const [
			{ count: totalTemplates },
			{ count: totalIdCards },
			{ count: activeUsers },
			{ count: templatesThisMonth },
			{ count: cardsThisMonth }
		] = await Promise.all([
			// Total templates
			supabase
				.from('templates')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id),

			// Total ID cards
			supabase
				.from('idcards')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id),

			// Active users (users who have logged in within 30 days)
			supabase
				.from('profiles')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id),

			// Templates created this month
			supabase
				.from('templates')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id)
				.gte('created_at', thisMonth.toISOString())
				.lt('created_at', nextMonth.toISOString()),

			// Cards generated this month
			supabase
				.from('idcards')
				.select('*', { count: 'exact', head: true })
				.eq('org_id', org_id)
				.gte('created_at', thisMonth.toISOString())
				.lt('created_at', nextMonth.toISOString())
		]);

		// Get storage usage (simplified - would need actual file size calculation)
		const storageUsage = {
			total_bytes: 0,
			templates_bytes: 0,
			cards_bytes: 0,
			formatted_size: '0 MB'
		};

		return {
			org_id,
			total_templates: totalTemplates || 0,
			total_id_cards: totalIdCards || 0,
			active_users: activeUsers || 0,
			templates_this_month: templatesThisMonth || 0,
			cards_this_month: cardsThisMonth || 0,
			storage_usage: storageUsage
		};
	} catch (err) {
		console.error('Error fetching organization stats:', err);
		throw error(500, 'Failed to fetch organization statistics');
	}
});

export const getOrganizationSettings = query(async (): Promise<OrgSettings> => {
	const { user, supabase, org_id } = await requireOrgAdminPermissions();

	if (!org_id) {
		throw error(400, 'Organization ID not found');
	}

	try {
		const { data: settings, error: settingsError } = await supabase
			.from('org_settings')
			.select('*')
			.eq('org_id', org_id)
			.single();

		if (settingsError) {
			if (settingsError.code === 'PGRST116') {
				// No settings found, create default settings
				const defaultSettings = {
					org_id,
					payments_enabled: false,
					payments_bypass: false,
					updated_by: user.id,
					updated_at: new Date().toISOString()
				};

				const { data: newSettings, error: createError } = await supabase
					.from('org_settings')
					.insert(defaultSettings)
					.select()
					.single();

				if (createError) {
					console.error('Error creating default settings:', createError);
					throw error(500, 'Failed to create organization settings');
				}

				return newSettings;
			}

			console.error('Error fetching organization settings:', settingsError);
			throw error(500, 'Failed to fetch organization settings');
		}

		return settings;
	} catch (err) {
		console.error('Error in getOrganizationSettings:', err);
		throw error(500, 'Failed to fetch organization settings');
	}
});

export const searchOrganizations = query(organizationSearchSchema, async (searchParams: OrganizationSearch): Promise<{ organizations: OrganizationResponse[], total: number }> => {
	const { user, supabase } = await requireSuperAdminPermissions();

	// Validate search parameters
	const validatedParams = organizationSearchSchema.parse(searchParams);

	try {
		let query = supabase
			.from('organizations')
			.select('id, name, created_at, updated_at', { count: 'exact' });

		// Apply search filter
		if (validatedParams.query) {
			query = query.ilike('name', `%${validatedParams.query}%`);
		}

		// Apply date filters
		if (validatedParams.filters?.created_after) {
			query = query.gte('created_at', validatedParams.filters.created_after);
		}
		if (validatedParams.filters?.created_before) {
			query = query.lte('created_at', validatedParams.filters.created_before);
		}

		// Apply sorting
		query = query.order(validatedParams.sort_by, { ascending: validatedParams.sort_order === 'asc' });

		// Apply pagination
		query = query.range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1);

		const { data: organizations, error: searchError, count } = await query;

		if (searchError) {
			console.error('Error searching organizations:', searchError);
			throw error(500, 'Failed to search organizations');
		}

		return {
			organizations: organizations || [],
			total: count || 0
		};
	} catch (err) {
		console.error('Error in searchOrganizations:', err);
		throw error(500, 'Failed to search organizations');
	}
});

// Command functions
export const createOrganization = command('unchecked', async (data: OrganizationCreation) => {
	const { user, supabase } = await requireSuperAdminPermissions();

	// Validate input
	const validatedData = organizationCreationSchema.parse(data);

	try {
		// Check if organization name already exists
		const { data: existingOrg, error: checkError } = await supabase
			.from('organizations')
			.select('id')
			.eq('name', validatedData.name)
			.single();

		if (checkError && checkError.code !== 'PGRST116') {
			console.error('Error checking existing organization:', checkError);
			throw error(500, 'Failed to validate organization name');
		}

		if (existingOrg) {
			throw error(400, 'Organization with this name already exists');
		}

		// Create organization
		const { data: newOrg, error: createError } = await supabase
			.from('organizations')
			.insert({
				name: validatedData.name,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.select()
			.single();

		if (createError) {
			console.error('Error creating organization:', createError);
			throw error(500, 'Failed to create organization');
		}

		// Create default organization settings
		const { error: settingsError } = await supabase
			.from('org_settings')
			.insert({
				org_id: newOrg.id,
				payments_enabled: false,
				payments_bypass: false,
				updated_by: user.id,
				updated_at: new Date().toISOString()
			});

		if (settingsError) {
			console.error('Error creating organization settings:', settingsError);
			// Don't fail the organization creation if settings creation fails
		}

		return {
			success: true,
			organization: newOrg,
			message: 'Organization created successfully'
		};
	} catch (err) {
		console.error('Error in createOrganization:', err);
		if (err instanceof Error && err.message.includes('error')) {
			throw err;
		}
		throw error(500, 'An unexpected error occurred');
	}
});

export const updateOrganization = command('unchecked', async (data: OrganizationUpdate) => {
	const { user, supabase, org_id } = await requireOrgAdminPermissions();

	// Validate input
	const validatedData = organizationUpdateSchema.parse(data);

	// Check permissions - only super admin can update other organizations
	if (validatedData.id !== org_id && user.role !== 'super_admin') {
		throw error(403, 'Access denied to update this organization');
	}

	try {
		// Check if new name conflicts with existing organizations
		if (validatedData.name) {
			const { data: existingOrg, error: checkError } = await supabase
				.from('organizations')
				.select('id')
				.eq('name', validatedData.name)
				.neq('id', validatedData.id)
				.single();

			if (checkError && checkError.code !== 'PGRST116') {
				console.error('Error checking existing organization:', checkError);
				throw error(500, 'Failed to validate organization name');
			}

			if (existingOrg) {
				throw error(400, 'Organization with this name already exists');
			}
		}

		// Update organization
		const updateData: any = {
			updated_at: new Date().toISOString()
		};

		if (validatedData.name) {
			updateData.name = validatedData.name;
		}

		const { data: updatedOrg, error: updateError } = await supabase
			.from('organizations')
			.update(updateData)
			.eq('id', validatedData.id)
			.select()
			.single();

		if (updateError) {
			console.error('Error updating organization:', updateError);
			throw error(500, 'Failed to update organization');
		}

		return {
			success: true,
			organization: updatedOrg,
			message: 'Organization updated successfully'
		};
	} catch (err) {
		console.error('Error in updateOrganization:', err);
		if (err instanceof Error && err.message.includes('error')) {
			throw err;
		}
		throw error(500, 'An unexpected error occurred');
	}
});

export const updateOrganizationSettings = command('unchecked', async (data: OrgSettingsUpdate) => {
	const { user, supabase, org_id } = await requireOrgAdminPermissions();

	// Validate input
	const validatedData = orgSettingsUpdateSchema.parse(data);

	// Check permissions - only super admin can update other organization settings
	if (validatedData.org_id !== org_id && user.role !== 'super_admin') {
		throw error(403, 'Access denied to update these organization settings');
	}

	try {
		const updateData: any = {
			updated_by: validatedData.updated_by,
			updated_at: new Date().toISOString()
		};

		if (validatedData.payments_enabled !== undefined) {
			updateData.payments_enabled = validatedData.payments_enabled;
		}

		if (validatedData.payments_bypass !== undefined) {
			updateData.payments_bypass = validatedData.payments_bypass;
		}

		const { data: updatedSettings, error: updateError } = await supabase
			.from('org_settings')
			.update(updateData)
			.eq('org_id', validatedData.org_id)
			.select()
			.single();

		if (updateError) {
			console.error('Error updating organization settings:', updateError);
			throw error(500, 'Failed to update organization settings');
		}

		return {
			success: true,
			settings: updatedSettings,
			message: 'Organization settings updated successfully'
		};
	} catch (err) {
		console.error('Error in updateOrganizationSettings:', err);
		if (err instanceof Error && err.message.includes('error')) {
			throw err;
		}
		throw error(500, 'An unexpected error occurred');
	}
});

export const deleteOrganization = command('unchecked', async (id: string) => {
	const { user, supabase } = await requireSuperAdminPermissions();

	if (!id) {
		throw error(400, 'Organization ID is required');
	}

	try {
		// Check if organization exists
		const { data: organization, error: fetchError } = await supabase
			.from('organizations')
			.select('id, name')
			.eq('id', id)
			.single();

		if (fetchError) {
			console.error('Error fetching organization:', fetchError);
			throw error(404, 'Organization not found');
		}

		// Check if organization has active users, templates, or cards
		const [
			{ count: userCount },
			{ count: templateCount },
			{ count: cardCount }
		] = await Promise.all([
			supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('org_id', id),
			supabase.from('templates').select('*', { count: 'exact', head: true }).eq('org_id', id),
			supabase.from('idcards').select('*', { count: 'exact', head: true }).eq('org_id', id)
		]);

		if ((userCount || 0) > 0 || (templateCount || 0) > 0 || (cardCount || 0) > 0) {
			throw error(400, 'Cannot delete organization with existing users, templates, or ID cards. Please remove all data first.');
		}

		// Delete organization settings first
		const { error: settingsDeleteError } = await supabase
			.from('org_settings')
			.delete()
			.eq('org_id', id);

		if (settingsDeleteError) {
			console.error('Error deleting organization settings:', settingsDeleteError);
			// Don't fail if settings deletion fails (they might not exist)
		}

		// Delete organization
		const { error: deleteError } = await supabase
			.from('organizations')
			.delete()
			.eq('id', id);

		if (deleteError) {
			console.error('Error deleting organization:', deleteError);
			throw error(500, 'Failed to delete organization');
		}

		return {
			success: true,
			message: `Organization "${organization.name}" deleted successfully`
		};
	} catch (err) {
		console.error('Error in deleteOrganization:', err);
		if (err instanceof Error && err.message.includes('error')) {
			throw err;
		}
		throw error(500, 'An unexpected error occurred');
	}
});