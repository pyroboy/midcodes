/**
 * Environment Variable Validation
 * SECURITY: Validates all required environment variables at startup
 * to prevent runtime errors and security misconfigurations
 */

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { dev } from '$app/environment';
// @ts-ignore
import {
	PRIVATE_SERVICE_ROLE,
	PAYMONGO_SECRET_KEY,
	PAYMONGO_WEBHOOK_SECRET
} from '$env/static/private';

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
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
}

/**
 * Validates that a value is not empty and meets minimum length requirements
 */
function isValidSecret(value: string, minLength = 20): boolean {
	return value.length >= minLength;
}

/**
 * Validates all required environment variables
 * Call this in hooks.server.ts during initialization
 */
export function validateEnvironment(): EnvValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Public Supabase URL
	if (!PUBLIC_SUPABASE_URL) {
		errors.push('PUBLIC_SUPABASE_URL is not set');
	} else if (!isValidUrl(PUBLIC_SUPABASE_URL)) {
		errors.push('PUBLIC_SUPABASE_URL is not a valid URL');
	}

	// Public Supabase Anon Key
	if (!PUBLIC_SUPABASE_ANON_KEY) {
		errors.push('PUBLIC_SUPABASE_ANON_KEY is not set');
	} else if (!isValidSecret(PUBLIC_SUPABASE_ANON_KEY, 30)) {
		errors.push('PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
	}

	// Private Service Role Key (Critical)
	if (!PRIVATE_SERVICE_ROLE) {
		errors.push('PRIVATE_SERVICE_ROLE is not set - admin operations will fail');
	} else if (!isValidSecret(PRIVATE_SERVICE_ROLE, 30)) {
		errors.push('PRIVATE_SERVICE_ROLE appears to be invalid (too short)');
	}

	// PayMongo Secret Key (Critical for payments)
	if (!PAYMONGO_SECRET_KEY) {
		warnings.push('PAYMONGO_SECRET_KEY is not set - payment processing will fail');
	} else if (!PAYMONGO_SECRET_KEY.startsWith('sk_')) {
		warnings.push('PAYMONGO_SECRET_KEY does not start with sk_ - might be invalid');
	}

	// PayMongo Webhook Secret (Critical for security)
	if (!PAYMONGO_WEBHOOK_SECRET) {
		if (dev) {
			warnings.push('PAYMONGO_WEBHOOK_SECRET is not set - webhook verification will fail (SECURITY RISK - DEV MODE)');
		} else {
			errors.push(
				'PAYMONGO_WEBHOOK_SECRET is not set - webhook verification will fail (SECURITY RISK)'
			);
		}
	} else if (!isValidSecret(PAYMONGO_WEBHOOK_SECRET, 10)) {
		warnings.push('PAYMONGO_WEBHOOK_SECRET appears to be too short');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Validates environment and logs results
 * Throws error if critical validation fails
 */
export function validateAndLogEnvironment(): void {
	const result = validateEnvironment();

	if (result.warnings.length > 0) {
		console.warn('⚠️  Environment validation warnings:');
		result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
	}

	if (!result.isValid) {
		console.error('❌ Environment validation failed:');
		result.errors.forEach((error) => console.error(`  - ${error}`));
		throw new Error(
			'Environment validation failed. Please check your .env file and ensure all required variables are set.'
		);
	}

	console.log('✅ Environment validation passed');
}
