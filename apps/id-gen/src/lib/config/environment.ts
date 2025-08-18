/**
 * Environment Configuration
 * 
 * This module provides type-safe access to environment variables with proper
 * separation between server-only and public variables.
 * 
 * IMPORTANT: Never expose server-only variables to the client!
 */

import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { building, dev } from '$app/environment';

// Server-only environment variables
// These should NEVER be accessed from client-side code
export const serverEnv = {
	// PayMongo server-only secrets
	paymongo: {
		secretKey: env.PAYMONGO_SECRET_KEY,
		webhookSecret: env.PAYMONGO_WEBHOOK_SECRET,
	},
	
	// PayMongo configuration paths
	checkout: {
		successPath: env.PAYMONGO_CHECKOUT_SUCCESS_PATH || '/account/billing/success',
		cancelPath: env.PAYMONGO_CHECKOUT_CANCEL_PATH || '/pricing?canceled=1',
	}
} as const;

// Public environment variables
// These are safe to use in client-side code
export const publicConfig = {
	app: {
		url: publicEnv.PUBLIC_APP_URL || (dev ? 'http://localhost:5173' : ''),
		environment: dev ? 'development' : 'production',
	},
	
	paymongo: {
		publicKey: publicEnv.PUBLIC_PAYMONGO_PUBLIC_KEY,
	}
} as const;

// Validation function to ensure required environment variables are set
export function validateEnvironment() {
	const errors: string[] = [];
	
	// Only validate during runtime, not during build
	if (!building) {
		// Server-only validations
		if (!serverEnv.paymongo.secretKey) {
			errors.push('PAYMONGO_SECRET_KEY is required');
		}
		
		if (!serverEnv.paymongo.webhookSecret) {
			errors.push('PAYMONGO_WEBHOOK_SECRET is required');
		}
		
		// Public validations
		if (!publicConfig.paymongo.publicKey) {
			errors.push('PUBLIC_PAYMONGO_PUBLIC_KEY is required');
		}
		
		if (!publicConfig.app.url) {
			errors.push('PUBLIC_APP_URL is required');
		}
		
		// Validate secret key format
		if (serverEnv.paymongo.secretKey && !serverEnv.paymongo.secretKey.startsWith('sk_')) {
			errors.push('PAYMONGO_SECRET_KEY must start with sk_test_ or sk_live_');
		}
		
		// Validate public key format
		if (publicConfig.paymongo.publicKey && !publicConfig.paymongo.publicKey.startsWith('pk_')) {
			errors.push('PUBLIC_PAYMONGO_PUBLIC_KEY must start with pk_test_ or pk_live_');
		}
		
		// Validate webhook secret format
		if (serverEnv.paymongo.webhookSecret && !serverEnv.paymongo.webhookSecret.startsWith('whsec_')) {
			errors.push('PAYMONGO_WEBHOOK_SECRET must start with whsec_');
		}
	}
	
	if (errors.length > 0) {
		throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
	}
}

// Helper to get full URLs for redirects
export function getCheckoutUrls() {
	const baseUrl = publicConfig.app.url;
	
	return {
		success: `${baseUrl}${serverEnv.checkout.successPath}`,
		cancel: `${baseUrl}${serverEnv.checkout.cancelPath}`,
	};
}

// Type guards to prevent accidental client-side usage of server variables
export function assertServerContext(context: string) {
	if (typeof window !== 'undefined') {
		throw new Error(`${context} can only be used on the server. Do not call this from client-side code.`);
	}
}
