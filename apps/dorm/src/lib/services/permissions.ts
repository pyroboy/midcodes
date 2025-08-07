// src/lib/services/permissions.ts
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetches unique permissions for a given set of user roles from the database.
 * @param roles - An array of user roles.
 * @param supabase - The Supabase client instance.
 * @returns A promise that resolves to an array of unique permission strings.
 */
export async function getUserPermissions(
	roles: string[],
	supabase: SupabaseClient
): Promise<string[]> {
	if (!roles || roles.length === 0) {
		return [];
	}

	const { data, error } = await supabase
		.from('role_permissions')
		.select('permission')
		.in('role', roles);

	if (error) {
		console.error('Error fetching permissions:', error);
		return [];
	}

	// Use a Set to get unique permission values
	const permissions = [...new Set(data.map((rp) => rp.permission))];
	return permissions;
}
