import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface FeatureFlags {
	showSecurityDepositIndicator: boolean;
}

// Get initial feature flags from environment variables or localStorage
const getInitialFeatureFlags = (): FeatureFlags => {
	const defaults: FeatureFlags = {
		showSecurityDepositIndicator: true // Enabled by default
	};

	if (!browser) return defaults;

	// Check localStorage for persisted flags (for admin toggle capability)
	const stored = localStorage.getItem('featureFlags');
	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			return { ...defaults, ...parsed };
		} catch (error) {
			console.warn('Failed to parse stored feature flags:', error);
		}
	}

	// Check environment variables (build-time configuration)
	if (typeof window !== 'undefined' && (window as any).__FEATURE_FLAGS__) {
		return { ...defaults, ...(window as any).__FEATURE_FLAGS__ };
	}

	return defaults;
};

const createFeatureFlagsStore = () => {
	const initialFlags = getInitialFeatureFlags();
	const { subscribe, set, update } = writable<FeatureFlags>(initialFlags);

	// Persist changes to localStorage when in browser
	if (browser) {
		subscribe((flags) => {
			localStorage.setItem('featureFlags', JSON.stringify(flags));
		});
	}

	return {
		subscribe,
		set,
		update,
		// Helper methods for common operations
		toggleSecurityDepositIndicator: () => {
			update((flags) => ({
				...flags,
				showSecurityDepositIndicator: !flags.showSecurityDepositIndicator
			}));
		},
		setSecurityDepositIndicator: (enabled: boolean) => {
			update((flags) => ({
				...flags,
				showSecurityDepositIndicator: enabled
			}));
		}
	};
};

export const featureFlags = createFeatureFlagsStore();

// Export type for TypeScript support
export type { FeatureFlags };