import { browser } from '$app/environment';

/**
 * Lazy load a component with optional loading fallback
 */
export async function lazyLoadComponent<T>(
	loader: () => Promise<{ default: T }>,
	fallback?: T
): Promise<T> {
	if (!browser) {
		return fallback as T;
	}
	
	try {
		const module = await loader();
		return module.default;
	} catch (error) {
		console.warn('Failed to lazy load component:', error);
		if (fallback) {
			return fallback;
		}
		throw error;
	}
}

/**
 * Lazy load multiple components in parallel
 */
export async function lazyLoadComponents<T extends Record<string, any>>(
	loaders: Record<keyof T, () => Promise<{ default: any }>>
): Promise<T> {
	if (!browser) {
		return {} as T;
	}
	
	const keys = Object.keys(loaders) as Array<keyof T>;
	const promises = keys.map(key => lazyLoadComponent(loaders[key]));
	
	const components = await Promise.all(promises);
	
	return keys.reduce((acc, key, index) => {
		acc[key] = components[index];
		return acc;
	}, {} as T);
}

/**
 * Preload a component without importing it immediately
 */
export function preloadComponent(loader: () => Promise<{ default: any }>): void {
	if (!browser) return;
	
	// Trigger the import to cache it, but don't wait for it
	loader().catch(error => {
		console.warn('Failed to preload component:', error);
	});
}

/**
 * Lazy load based on intersection observer (when component comes into view)
 */
export function lazyLoadOnVisible<T>(
	node: HTMLElement,
	loader: () => Promise<{ default: T }>
): { destroy: () => void } {
	if (!browser) {
		return { destroy: () => {} };
	}
	
	let hasLoaded = false;
	
	const observer = new IntersectionObserver(
		async (entries) => {
			if (entries[0].isIntersecting && !hasLoaded) {
				hasLoaded = true;
				try {
					await loader();
					observer.unobserve(node);
				} catch (error) {
					console.warn('Failed to lazy load on visibility:', error);
				}
			}
		},
		{
			rootMargin: '50px'
		}
	);
	
	observer.observe(node);
	
	return {
		destroy() {
			observer.disconnect();
		}
	};
}

/**
 * Common lazy loaders for the app - using existing components
 */
export const lazyLoaders = {
	// Heavy modals that exist in the codebase
	async utilityBillingModal() {
		return await import('../../routes/utility-billings/ReadingEntryModal.svelte');
	},
	
	async printPreviewModal() {
		return await import('../../routes/utility-billings/PrintPreviewModal.svelte');
	},
	
	async billingPeriodsGraphModal() {
		return await import('../../routes/utility-billings/BillingPeriodsGraphModal.svelte');
	},
	
	async leaseFormModal() {
		return await import('../../routes/leases/LeaseFormModal.svelte');
	},
	
	async expenseFormModal() {
		return await import('../../routes/expenses/ExpenseFormModal.svelte');
	}
};

/**
 * Preload commonly used heavy components
 */
export function preloadHeavyComponents(): void {
	if (!browser) return;
	
	// Preload heavy modals after a short delay to not block initial render
	setTimeout(() => {
		preloadComponent(lazyLoaders.utilityBillingModal);
		preloadComponent(lazyLoaders.printPreviewModal);
	}, 2000);
	
	// Preload form modals after a longer delay
	setTimeout(() => {
		preloadComponent(lazyLoaders.leaseFormModal);
		preloadComponent(lazyLoaders.expenseFormModal);
	}, 5000);
}