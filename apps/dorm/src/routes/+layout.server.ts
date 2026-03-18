// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	const { session, user, permissions } = locals;

	depends('app:cache');

	// No user → skip all heavy imports (schema, db, drizzle, cache)
	if (!user) {
		return { session, user, permissions, properties: [] };
	}

	// Normal DB flow (only for authenticated users) — parallel imports
	const [{ cache, cacheKeys, CACHE_TTL }, { db }, { properties }, { eq, asc }] = await Promise.all([
		import('$lib/services/cache'),
		import('$lib/server/db'),
		import('$lib/server/schema'),
		import('drizzle-orm')
	]);

	const fetchProperties = async () => {

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
