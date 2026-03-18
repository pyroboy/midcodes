/**
 * Lightweight DB instance for Better Auth only.
 * Uses schema-auth.ts (4 tables) instead of schema.ts (32 tables + 25 enums).
 * This keeps CF Workers under the 10ms CPU limit.
 */
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { env } from './env';
import * as authSchema from './schema-auth';

let _sql: NeonQueryFunction<false, false> | null = null;
let _db: NeonHttpDatabase<typeof authSchema> | null = null;

export function getAuthDb(): NeonHttpDatabase<typeof authSchema> {
	if (!_db) {
		const url = env.NEON_DATABASE_URL;
		if (!url) throw new Error('NEON_DATABASE_URL is missing.');
		_sql = neon(url);
		_db = drizzle(_sql, { schema: authSchema });
	}
	return _db;
}
