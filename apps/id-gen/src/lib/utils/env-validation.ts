/**
 * Environment Variable Validation
 * SECURITY: Validates all required environment variables at startup
 * to prevent runtime errors and security misconfigurations
 */

import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';

interface EnvValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

/**
 * Validates that a URL is properly formatted
 */
function isValidUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:';
	} catch {
		return false;
	}
}

/**
 * Validates all required environment variables
 * Call this in hooks.server.ts during initialization
 */
export function validateEnvironment(): EnvValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Neon Database URL (Critical)
	// Try both process.env (Node.js/Vite) and privateEnv (SvelteKit runtime)
	const neonUrl = process.env.NEON_DATABASE_URL || privateEnv.NEON_DATABASE_URL;
	if (!neonUrl) {
		errors.push('NEON_DATABASE_URL is not set - database operations will fail');
	} else if (!isValidUrl(neonUrl)) {
		errors.push('NEON_DATABASE_URL is not a valid URL');
	}

	// R2 Storage (Optional but recommended)
	const r2AccountId = privateEnv.R2_ACCOUNT_ID;
	const r2AccessKeyId = privateEnv.R2_ACCESS_KEY_ID;
	const r2SecretAccessKey = privateEnv.R2_SECRET_ACCESS_KEY;
	const r2BucketName = privateEnv.R2_BUCKET_NAME;

	if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName) {
		warnings.push('R2 storage not fully configured - file uploads may fail');
	}

	// Better Auth Secret (Critical for auth)
	const betterAuthSecret = privateEnv.BETTER_AUTH_SECRET;
	if (!betterAuthSecret) {
		if (dev) {
			warnings.push('BETTER_AUTH_SECRET is not set - using default for development');
		} else {
			errors.push('BETTER_AUTH_SECRET is not set - authentication will fail');
		}
	}

	// CSRF Secret (Optional - will generate random if not set)
	const csrfSecret = privateEnv.CSRF_SECRET;
	if (!csrfSecret && !dev) {
		warnings.push('CSRF_SECRET is not set - a random secret will be generated (not persistent across instances)');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * SECURITY: Validates environment and logs results safely
 * Never logs actual secret values - only configuration status
 * In dev mode, only warns but doesn't throw (actual code will provide clearer errors)
 */
export function validateAndLogEnvironment(): void {
	const result = validateEnvironment();

	// SECURITY: Log only configuration status, never actual values
	if (result.warnings.length > 0) {
		console.warn('⚠️  Environment validation warnings:');
		result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
	}

	if (!result.isValid) {
		console.error('❌ Environment validation issues:');
		result.errors.forEach((error) => console.error(`  - ${error}`));
		
		// In dev mode, don't throw - the actual code will provide clearer errors
		// This helps when $env/dynamic/private hasn't loaded yet
		if (!dev) {
			throw new Error(
				'Environment validation failed. Please check your .env file and ensure all required variables are set.'
			);
		} else {
			console.warn('⚠️  Continuing in dev mode despite validation issues...');
		}
	} else {
		// SECURITY: Log only that validation passed, with boolean status indicators
		// Never log actual values or lengths that could hint at secrets
		console.log('✅ Environment validation passed', {
			neonConfigured: !!privateEnv.NEON_DATABASE_URL,
			r2Configured: !!(privateEnv.R2_ACCOUNT_ID && privateEnv.R2_ACCESS_KEY_ID),
			authConfigured: !!privateEnv.BETTER_AUTH_SECRET || dev,
			mode: dev ? 'development' : 'production'
		});
	}
}
