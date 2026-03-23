import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { env } from './env';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDb() {
	if (!_db) {
		const sql = neon(env.NEON_DATABASE_URL);
		_db = drizzle(sql, { schema });
	}
	return _db;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
	get(_target, prop) {
		const instance = getDb();
		const value = (instance as any)[prop];
		return typeof value === 'function' ? value.bind(instance) : value;
	}
});
