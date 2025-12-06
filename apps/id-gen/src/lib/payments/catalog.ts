import type { CreditPackage, FeatureSKU } from './types';

// Credit packages with canonical server-side pricing
export const CREDIT_PACKAGES: readonly CreditPackage[] = [
	{
		id: 'credits_100',
		name: '100 Credits',
		credits: 100,
		amountPhp: 50,
		description: 'Perfect for light usage',
		isActive: true
	},
	{
		id: 'credits_500',
		name: '500 Credits',
		credits: 500,
		amountPhp: 200,
		description: 'Great value for regular users',
		isActive: true
	},
	{
		id: 'credits_1000',
		name: '1000 Credits',
		credits: 1000,
		amountPhp: 350,
		description: 'Best value - save 12.5%',
		isActive: true
	},
	{
		id: 'credits_2500',
		name: '2500 Credits',
		credits: 2500,
		amountPhp: 750,
		description: 'For power users - save 25%',
		isActive: true
	}
] as const;

// Feature SKUs with canonical server-side pricing
export const FEATURE_SKUS: readonly FeatureSKU[] = [
	{
		id: 'premium_monthly',
		name: 'Premium Monthly',
		featureFlag: 'premium',
		amountPhp: 299,
		description: 'Premium features for 30 days',
		isActive: true
	},
	{
		id: 'premium_yearly',
		name: 'Premium Yearly',
		featureFlag: 'premium',
		amountPhp: 2999,
		description: 'Premium features for 365 days - save 17%',
		isActive: true
	},
	{
		id: 'api_access',
		name: 'API Access',
		featureFlag: 'api_access',
		amountPhp: 199,
		description: 'Access to API endpoints',
		isActive: true
	},
	{
		id: 'bulk_processing',
		name: 'Bulk Processing',
		featureFlag: 'bulk_processing',
		amountPhp: 499,
		description: 'Process multiple items at once',
		isActive: true
	}
] as const;

// Premium features for backward compatibility with credits.ts
export const PREMIUM_FEATURES = [
	{
		id: 'unlimited_templates',
		name: 'Unlimited Templates',
		price: 99,
		description: 'Create unlimited custom templates',
		type: 'one_time'
	},
	{
		id: 'remove_watermarks',
		name: 'Remove Watermarks',
		price: 199,
		description: 'Remove watermarks from all generated cards',
		type: 'one_time'
	}
] as const;

// Maps for quick lookups by ID
export const CREDIT_PACKAGE_MAP = new Map(CREDIT_PACKAGES.map((pkg) => [pkg.id, pkg]));

export const FEATURE_SKU_MAP = new Map(FEATURE_SKUS.map((sku) => [sku.id, sku]));

// Server-only functions to get pricing information
// These ensure that clients can only pass SKU IDs, never amounts
// Note: In SvelteKit 2.0+, conditional exports based on environment are not supported
// These functions should be moved to server-only files or used with proper guards
export function getCreditPackageById(id: string): CreditPackage | undefined {
	return CREDIT_PACKAGE_MAP.get(id);
}

export function getFeatureSkuById(id: string): FeatureSKU | undefined {
	return FEATURE_SKU_MAP.get(id);
}

export function getActiveCreditPackages(): readonly CreditPackage[] {
	return CREDIT_PACKAGES.filter((pkg) => pkg.isActive);
}

export function getActiveFeatureSkus(): readonly FeatureSKU[] {
	return FEATURE_SKUS.filter((sku) => sku.isActive);
}

// Client-safe exports (only metadata, no pricing)
export function getCreditPackageMetadata() {
	return CREDIT_PACKAGES.map((pkg) => ({
		id: pkg.id,
		name: pkg.name,
		credits: pkg.credits,
		description: pkg.description,
		isActive: pkg.isActive
		// Note: amountPhp is intentionally excluded
	}));
}

export function getFeatureSkuMetadata() {
	return FEATURE_SKUS.map((sku) => ({
		id: sku.id,
		name: sku.name,
		featureFlag: sku.featureFlag,
		description: sku.description,
		isActive: sku.isActive
		// Note: amountPhp is intentionally excluded
	}));
}
