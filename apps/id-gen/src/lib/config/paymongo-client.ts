/**
 * Client-side PayMongo Configuration
 *
 * This module provides safe access to PayMongo public configuration
 * that can be used in browser environments.
 *
 * IMPORTANT: Only public variables are exposed here!
 */

import { publicConfig } from './environment';
import { browser } from '$app/environment';

export const paymongoClientConfig = {
	publicKey: publicConfig.paymongo.publicKey,
	appUrl: publicConfig.app.url,
	environment: publicConfig.app.environment,

	// PayMongo SDK Configuration
	sdk: {
		// These are safe to use in client-side code
		apiVersion: 'v1',
		apiBaseUrl: 'https://api.paymongo.com/v1',

		// Supported payment methods for client-side rendering
		supportedPaymentMethods: ['card', 'gcash', 'grab_pay', 'paymaya'] as const,

		// Default checkout configuration
		defaults: {
			currency: 'PHP' as const,
			locale: 'en' as const
		}
	}
} as const;

/**
 * Validates that required client-side configuration is available
 */
export function validateClientConfig() {
	const errors: string[] = [];

	if (!paymongoClientConfig.publicKey) {
		errors.push('PayMongo public key is not configured (PUBLIC_PAYMONGO_PUBLIC_KEY)');
	}

	if (!paymongoClientConfig.appUrl) {
		errors.push('App URL is not configured (PUBLIC_APP_URL)');
	}

	// Validate public key format if present
	if (paymongoClientConfig.publicKey && !paymongoClientConfig.publicKey.startsWith('pk_')) {
		errors.push('Invalid PayMongo public key format - must start with pk_test_ or pk_live_');
	}

	if (errors.length > 0) {
		throw new Error(`PayMongo client configuration errors:\n${errors.join('\n')}`);
	}
}

/**
 * Gets the checkout configuration URLs for redirects
 * Safe to use on client-side as it only uses public config
 */
export function getClientCheckoutConfig() {
	return {
		baseUrl: paymongoClientConfig.appUrl,
		// These paths will be combined with the base URL server-side
		successPath: '/account/billing/success',
		cancelPath: '/pricing?canceled=1'
	};
}

/**
 * Determines if we're in test mode based on the public key
 */
export function isTestMode(): boolean {
	return paymongoClientConfig.publicKey?.startsWith('pk_test_') ?? true;
}

/**
 * Browser-only initialization check
 */
export function ensureBrowserContext(context: string) {
	if (!browser) {
		throw new Error(`${context} can only be used in browser environment`);
	}
}

// Auto-validate configuration when imported (only in browser)
if (browser) {
	try {
		validateClientConfig();
	} catch (error) {
		console.error('PayMongo client configuration validation failed:', error);
	}
}
