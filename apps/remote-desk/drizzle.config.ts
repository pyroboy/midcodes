import type { Config } from 'drizzle-kit';
import { env } from 'process';

export default {
	schema: './src/lib/server/schema.ts',
	out: './drizzle',
	driver: 'better-sqlite',
	dbCredentials: {
		url: env.DATABASE_URL!
	}
} satisfies Config;
