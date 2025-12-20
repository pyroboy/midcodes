// src/lib/services/permissions.ts
/**
 * Permission caching and management service
 * SECURITY: Implements cache invalidation to prevent stale permissions
 */
import { db } from '$lib/server/db';
import { rolePermissions } from '$lib/server/schema';
import { inArray } from 'drizzle-orm';

interface CacheEntry {
	permissions: string[];
	timestamp: number;
	userId?: string;
}

interface PermissionCache {
	[roleKey: string]: CacheEntry;
}

interface UserCacheIndex {
	[userId: string]: Set<string>;
}

let permissionCache: PermissionCache = {};
let userCacheIndex: UserCacheIndex = {};

const CACHE_TTL = 5 * 60 * 1000;

export async function getUserPermissions(
	roles: string[] | undefined,
	userId?: string
): Promise<string[]> {
	if (!roles || roles.length === 0) {
		return [];
	}

	const cacheKey = roles.sort().join(',');
	const now = Date.now();

	if (permissionCache[cacheKey] && now - permissionCache[cacheKey].timestamp < CACHE_TTL) {
		return permissionCache[cacheKey].permissions;
	}

	const data = await db
		.select({ permission: rolePermissions.permission })
		.from(rolePermissions)
		.where(inArray(rolePermissions.role, roles as any));

	const permissions = [...new Set(data.map((rp) => rp.permission as string))];

	// Update cache
	permissionCache[cacheKey] = {
		permissions,
		timestamp: now,
		userId
	};

	// Update user cache index for targeted invalidation
	if (userId) {
		if (!userCacheIndex[userId]) {
			userCacheIndex[userId] = new Set();
		}
		userCacheIndex[userId].add(cacheKey);
	}

	return permissions;
}

/**
 * SECURITY: Invalidate all cached permissions for a specific user
 * Call this when a user's roles change to prevent stale permissions
 *
 * @param userId - The user ID whose permissions should be invalidated
 */
export function invalidateUserPermissionCache(userId: string): void {
	const cacheKeys = userCacheIndex[userId];

	if (cacheKeys) {
		for (const key of cacheKeys) {
			delete permissionCache[key];
			console.log(`🔒 [Permissions] Invalidated cache for user ${userId}, key: ${key}`);
		}
		delete userCacheIndex[userId];
	}
}

/**
 * SECURITY: Invalidate permissions for specific role combinations
 * Call this when role definitions change (e.g., admin updates role_permissions table)
 *
 * @param roles - Array of roles that were modified
 */
export function invalidateRolePermissions(roles: string[]): void {
	const roleSet = new Set(roles);

	// Find and invalidate all cache entries that include any of the modified roles
	for (const [cacheKey, entry] of Object.entries(permissionCache)) {
		const cachedRoles = cacheKey.split(',');
		const hasAffectedRole = cachedRoles.some((role) => roleSet.has(role));

		if (hasAffectedRole) {
			delete permissionCache[cacheKey];
			console.log(`🔒 [Permissions] Invalidated cache for roles: ${cacheKey}`);
		}
	}
}

/**
 * Clean up expired cache entries
 * Can be called periodically to prevent memory leaks
 */
export function cleanupPermissionCache(): void {
	const now = Date.now();
	let cleanedCount = 0;

	Object.keys(permissionCache).forEach((key) => {
		if (now - permissionCache[key].timestamp > CACHE_TTL) {
			// Also clean up user index
			const userId = permissionCache[key].userId;
			if (userId && userCacheIndex[userId]) {
				userCacheIndex[userId].delete(key);
				if (userCacheIndex[userId].size === 0) {
					delete userCacheIndex[userId];
				}
			}

			delete permissionCache[key];
			cleanedCount++;
		}
	});

	if (cleanedCount > 0) {
		console.log(`🧹 [Permissions] Cleaned up ${cleanedCount} expired cache entries`);
	}
}

/**
 * Clear all permission caches
 * Use for testing or emergency cache reset
 */
export function clearPermissionCache(): void {
	permissionCache = {};
	userCacheIndex = {};
	console.log('🔒 [Permissions] All caches cleared');
}

/**
 * Get current cache statistics (for debugging/monitoring)
 */
export function getCacheStats(): {
	totalEntries: number;
	usersTracked: number;
	oldestEntry: number | null;
} {
	const entries = Object.values(permissionCache);
	const oldestTimestamp = entries.length > 0 ? Math.min(...entries.map((e) => e.timestamp)) : null;

	return {
		totalEntries: entries.length,
		usersTracked: Object.keys(userCacheIndex).length,
		oldestEntry: oldestTimestamp ? Date.now() - oldestTimestamp : null
	};
}
