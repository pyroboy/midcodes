// src/lib/services/permissions.ts
import type { SupabaseClient } from '@supabase/supabase-js';

// Simple in-memory cache with TTL
const permissionCache = new Map<string, { permissions: string[]; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches unique permissions for a given set of user roles from the database.
 * Uses caching to reduce database calls and improve performance.
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

	// Create cache key from sorted roles
	const cacheKey = roles.sort().join(',');
	const now = Date.now();
	
	// Check cache first
	const cached = permissionCache.get(cacheKey);
	if (cached && cached.expires > now) {
		return cached.permissions;
	}

	try {
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
		
		// Cache the result
		permissionCache.set(cacheKey, {
			permissions,
			expires: now + CACHE_TTL
		});
		
		return permissions;
	} catch (error) {
		console.error('Exception while fetching permissions:', error);
		return [];
	}
}
