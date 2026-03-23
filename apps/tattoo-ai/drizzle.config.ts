import type { Config } from 'drizzle-kit';
import { env } from '$env/dynamic/private';

export default {
	schema: './src/lib/server/schema.ts',
	out: './drizzle',
	driver: 'pg',
	dbCredentials: {
		connectionString: process.env.DATABASE_URL || ''
	},
	strict: true,
	verbose: true
} satisfies Config;
