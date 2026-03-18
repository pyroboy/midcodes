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
			// Fast timeout: if Neon is down (quota exceeded, unreachable), fail quickly
			// so the page loads from RxDB cache instead of waiting 9+ seconds
			const queryWithTimeout = <T>(promise: Promise<T>): Promise<T> =>
				Promise.race([
					promise,
					new Promise<never>((_, reject) =>
						setTimeout(() => reject(new Error('Neon query timeout (5s)')), 5000)
					)
				]);

			const activeProperties = await queryWithTimeout(
				db
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
					.orderBy(asc(properties.name))
			);

			if (activeProperties.length === 0) {
				const allProperties = await queryWithTimeout(
					db
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
						.orderBy(asc(properties.name))
				);

				cache.set(cacheKey, allProperties, CACHE_TTL.LONG);
				return allProperties;
			}

			cache.set(cacheKey, activeProperties, CACHE_TTL.LONG);
			return activeProperties;
		} catch (error: any) {
			// Log concisely — the full stack is noise for quota/timeout errors
			const isQuota = error?.message?.includes('402') || error?.cause?.message?.includes('402') || error?.message?.includes('quota');
			const isTimeout = error?.message?.includes('timeout');
			if (isQuota) {
				console.warn('[Layout] Neon quota exceeded — using RxDB cache');
			} else if (isTimeout) {
				console.warn('[Layout] Neon query timed out (5s) — using RxDB cache');
			} else {
				console.error('[Layout] Exception while fetching properties:', error);
			}
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
