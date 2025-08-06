import { preloadData, preloadCode } from '$app/navigation';

/**
 * Safely preloads page data with error handling
 */
export async function safePreloadData(path: string): Promise<void> {
	try {
		await preloadData(path);
	} catch (error) {
		console.warn(`Preload failed for ${path}:`, error);
	}
}

/**
 * Safely preloads page code with error handling
 */
export async function safePreloadCode(path: string): Promise<void> {
	try {
		await preloadCode(path);
	} catch (error) {
		console.warn(`Code preload failed for ${path}:`, error);
	}
}

/**
 * Preloads both data and code for a given path
 */
export async function preloadAll(path: string): Promise<void> {
	await Promise.all([
		safePreloadData(path),
		safePreloadCode(path)
	]);
}

/**
 * Creates an intersection observer to preload when elements come into view
 */
export function prefetchWhenVisible(node: HTMLAnchorElement) {
	const observer = new IntersectionObserver(
		(entries) => {
			if (entries[0].isIntersecting) {
				safePreloadData(node.href.replace(window.location.origin, ''));
				observer.unobserve(node);
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
 * Preload pages that are commonly accessed together
 */
export const preloadRelatedPages = {
	async finances(): Promise<void> {
		await Promise.all([
			safePreloadData('/transactions'),
			safePreloadData('/expenses'),
			safePreloadData('/budgets')
		]);
	},
	
	async locations(): Promise<void> {
		await Promise.all([
			safePreloadData('/properties'),
			safePreloadData('/rental-unit'),
			safePreloadData('/floors'),
			safePreloadData('/meters')
		]);
	},
	
	async rentManagement(): Promise<void> {
		await Promise.all([
			safePreloadData('/tenants'),
			safePreloadData('/leases'),
			safePreloadData('/utility-billings'),
			safePreloadData('/penalties')
		]);
	},
	
	async reports(): Promise<void> {
		await Promise.all([
			safePreloadData('/reports'),
			safePreloadData('/lease-report')
		]);
	}
};

/**
 * Preloads routes based on user role and current context
 */
export async function contextualPreload(currentPath: string, userRoles: string[] = []): Promise<void> {
	// Preload related pages based on current location
	if (currentPath.startsWith('/expenses') || currentPath.startsWith('/transactions')) {
		await preloadRelatedPages.finances();
	} else if (currentPath.startsWith('/properties') || currentPath.startsWith('/rental-unit')) {
		await preloadRelatedPages.locations();
	} else if (currentPath.startsWith('/leases') || currentPath.startsWith('/tenants')) {
		await preloadRelatedPages.rentManagement();
	} else if (currentPath.startsWith('/reports')) {
		await preloadRelatedPages.reports();
	}
	
	// Always preload dashboard/overview for quick navigation
	safePreloadData('/');
}

/**
 * Preload dynamic lease-related routes
 */
export async function preloadLeaseRoutes(leaseId: string): Promise<void> {
	// These are API endpoints, but we can preload the data
	const currentYear = new Date().getFullYear();
	const endpoints = [
		`/leases/${leaseId}/billings?year=${currentYear}&type=RENT`,
		`/leases/${leaseId}/billings?year=${currentYear}&type=UTILITY`
	];
	
	// Preload billing data for the current year
	endpoints.forEach(endpoint => {
		fetch(endpoint).catch(error => {
			console.warn(`Failed to preload ${endpoint}:`, error);
		});
	});
}

/**
 * Smart preloading based on user behavior patterns
 */
export const smartPreload = {
	/**
	 * Preload when user hovers over lease cards
	 */
	onLeaseHover(leaseId: string) {
		preloadLeaseRoutes(leaseId);
	},
	
	/**
	 * Preload when user is in a property context
	 */
	onPropertyContext(propertyId: string) {
		safePreloadData(`/properties?id=${propertyId}`);
		safePreloadData('/rental-unit');
		safePreloadData('/floors');
	},
	
	/**
	 * Preload financial routes when in billing context
	 */
	onBillingContext() {
		safePreloadData('/payments');
		safePreloadData('/transactions');
		safePreloadData('/penalties');
	}
};