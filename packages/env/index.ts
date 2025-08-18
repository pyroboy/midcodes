import { z } from "zod";

export const ServerEnvSchema = z.object({
  PRIVATE_SERVICE_ROLE: z.string().min(1),
  RECAPTCHA_SECRET_KEY: z.string().optional()
});

export const PublicEnvSchema = z.object({
  PUBLIC_SUPABASE_URL: z.string().url(),
  PUBLIC_SUPABASE_ANON_KEY: z.string().min(1)
});

export function validateServerEnv(env: Record<string, string | undefined>) {
  return ServerEnvSchema.parse(env);
}

export function validatePublicEnv(env: Record<string, string | undefined>) {
  return PublicEnvSchema.parse(env);
}
