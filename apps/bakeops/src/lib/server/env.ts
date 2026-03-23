import { z } from 'zod/v3';

const envSchema = z.object({
	NEON_DATABASE_URL: z.string().url(),
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: z.string().url(),
	ABLY_API_KEY: z.string().min(1)
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export const env = new Proxy({} as Env, {
	get(_target, prop: string) {
		if (!_env) {
			_env = envSchema.parse({
				NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
				BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
				BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
				ABLY_API_KEY: process.env.ABLY_API_KEY
			});
		}
		return _env[prop as keyof Env];
	}
});
