// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { dev } from '$app/environment';
import { isDbAvailable, DEV_PROPERTIES } from '$lib/server/dev-bypass';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	const { session, user, permissions } = locals;

	depends('app:cache');

	// Dev bypass — no DB, return mock data
	if (dev && !isDbAvailable()) {
		return {
			session,
			user,
			permissions,
			properties: user ? DEV_PROPERTIES : []
		};
	}

	// Normal DB flow
	const { cache, cacheKeys, CACHE_TTL } = await import('$lib/services/cache');
	const { db } = await import('$lib/server/db');
	const { properties } = await import('$lib/server/schema');
	const { eq, asc } = await import('drizzle-orm');

	const fetchProperties = async () => {
		if (!user) return [];

		const cacheKey = cacheKeys.activeProperties();
		const cached = cache.get<any[]>(cacheKey);
		if (cached) return cached;

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

			if (activeProperties.length === 0) {
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

				cache.set(cacheKey, allProperties, CACHE_TTL.LONG);
				return allProperties;
			}

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
		properties: fetchProperties()
	};
};
