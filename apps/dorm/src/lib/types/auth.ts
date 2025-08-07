import type { Session as SupabaseSession } from '@supabase/supabase-js';

// src/lib/types/auth.ts
export interface UserJWTPayload {
	user_roles: string[];
	// add other JWT payload fields as needed
}

// Database table interface
export interface RolePermissionRecord {
	id: number;
	role: string;
	permission: string;
}

// Cache interfaces
export interface CacheEntry {
	permissions: string[];
	timestamp: number;
}

export interface PermissionCache {
	[roleKey: string]: CacheEntry;
}
