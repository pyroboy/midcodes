// src/lib/services/permissions.ts
import type { SupabaseClient } from '@supabase/supabase-js';

interface CacheEntry {
  permissions: string[];
  timestamp: number;
}

interface PermissionCache {
  [roleKey: string]: CacheEntry;
}

let permissionCache: PermissionCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getUserPermissions(roles: string[] | undefined, supabase: SupabaseClient): Promise<string[]> {
  // Return empty array if roles is undefined or empty
  if (!roles || roles.length === 0) {
    return [];
  }

  // Create cache key from sorted roles
  const cacheKey = roles.sort().join(',');
  const now = Date.now();

  // Check cache
  if (permissionCache[cacheKey] && (now - permissionCache[cacheKey].timestamp < CACHE_TTL)) {
    return permissionCache[cacheKey].permissions;
  }

  // Fetch permissions for the specified roles
  const { data, error } = await supabase
    .from('role_permissions')
    .select('permission')
    .in('role', roles);

  if (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }

  // Extract unique permissions
  const permissions = [...new Set(data.map(rp => rp.permission))];

  // Update cache
  permissionCache[cacheKey] = {
    permissions,
    timestamp: now
  };

  return permissions;
}

export function cleanupPermissionCache(): void {
  const now = Date.now();
  Object.keys(permissionCache).forEach(key => {
    if (now - permissionCache[key].timestamp > CACHE_TTL) {
      delete permissionCache[key];
    }
  });
}

export function clearPermissionCache(): void {
  permissionCache = {};
}