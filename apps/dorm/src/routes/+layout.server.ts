// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';
import { db } from '$lib/server/db';
import { properties } from '$lib/server/schema';
import { eq, asc } from 'drizzle-orm';

// Note: Cache debug panel now reads cache directly client-side for real-time updates.
// Removed server-side cacheStatus as it was a static snapshot that became stale.

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	const { session, user, permissions } = locals;

	// Set up dependency for cache status updates
	depends('app:cache');

	// Debug logging for troubleshooting
	if (process.env.NODE_ENV === 'development') {
		console.log('[Layout Server] Load function called');
		console.log('[Layout Server] Session exists:', !!session);
		console.log('[Layout Server] User exists:', !!user);
		if (user) {
			console.log('[Layout Server] User ID:', user.id);
			console.log('[Layout Server] User Email:', user.email);
			console.log('[Layout Server] Permissions:', permissions?.length || 0, 'found');
		}
	}

	// This function fetches the properties with caching
	const fetchProperties = async () => {
		if (!user) {
			// Return empty array instead of null for better handling
			if (process.env.NODE_ENV === 'development') {
				console.log('[Layout] No user found, returning empty properties array');
			}
			return [];
		}

		// Check cache first
		const cacheKey = cacheKeys.activeProperties();
		const cached = cache.get<any[]>(cacheKey);
		if (cached) {
			if (process.env.NODE_ENV === 'development') {
				console.log('[Layout] Returning cached properties');
			}
			return cached;
		}

		if (process.env.NODE_ENV === 'development') {
			console.log('[Layout] Cache miss - fetching properties from database');
		}

		try {
			const activeProperties = await db
				.select({
					id: properties.id,
					name: properties.name,
					address: properties.address,
					type: properties.type,
					status: properties.status,
					created_at: properties.createdAt,
					updated_at: properties.updatedAt
				})
				.from(properties)
				.where(eq(properties.status, 'ACTIVE'))
				.orderBy(asc(properties.name));

			if (process.env.NODE_ENV === 'development') {
				console.log(`[Layout] Found ${activeProperties.length} active properties`);
			}

			// If no active properties, try without status filter
			if (activeProperties.length === 0) {
				if (process.env.NODE_ENV === 'development') {
					console.log('[Layout] No active properties found, trying without status filter...');
				}

				const allProperties = await db
					.select({
						id: properties.id,
						name: properties.name,
						address: properties.address,
						type: properties.type,
						status: properties.status,
						created_at: properties.createdAt,
						updated_at: properties.updatedAt
					})
					.from(properties)
					.orderBy(asc(properties.name));

				if (process.env.NODE_ENV === 'development') {
					console.log(`[Layout] Found ${allProperties.length} total properties`);
				}

				// Cache the result with 10 minute TTL
				cache.set(cacheKey, allProperties, CACHE_TTL.LONG);
				return allProperties;
			}

			// Cache the result with 10 minute TTL
			cache.set(cacheKey, activeProperties, CACHE_TTL.LONG);
			return activeProperties;
		} catch (error) {
			console.error('[Layout] Exception while fetching properties:', error);
			return [];
		}
	};

	return {
		session,
		user,
		permissions,
		// Return the promise for properties. SvelteKit will handle streaming.
		properties: fetchProperties()
	};
};
