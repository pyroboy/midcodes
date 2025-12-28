/**
 * ScrollObservers.ts - IntersectionObserver factory for section visibility
 *
 * Complements scroll-position based triggers with visibility-based triggers.
 * Useful for:
 * - Lazy loading assets when sections come into view
 * - Triggering animations when elements become visible
 * - Pausing off-screen animations for performance
 */
import { browser } from '$app/environment';

export interface SectionVisibility {
	isVisible: boolean;
	ratio: number; // 0-1 intersection ratio
	entry: IntersectionObserverEntry | null;
}

type VisibilityCallback = (visibility: SectionVisibility) => void;

const observers: Map<HTMLElement, IntersectionObserver> = new Map();
const callbacks: Map<HTMLElement, Set<VisibilityCallback>> = new Map();

/**
 * Default observer options optimized for section transitions
 */
const DEFAULT_OPTIONS: IntersectionObserverOptions = {
	root: null, // Viewport
	rootMargin: '0px',
	threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1] // Multiple thresholds for granular updates
};

interface IntersectionObserverOptions {
	root?: Element | null;
	rootMargin?: string;
	threshold?: number | number[];
}

/**
 * Create an observer for a section element
 * Returns cleanup function
 */
export function observeSection(
	element: HTMLElement,
	callback: VisibilityCallback,
	options: IntersectionObserverOptions = {}
): () => void {
	if (!browser) {
		return () => {};
	}

	// Merge with defaults
	const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

	// Get or create callbacks set for this element
	if (!callbacks.has(element)) {
		callbacks.set(element, new Set());
	}
	callbacks.get(element)!.add(callback);

	// Create observer if needed
	if (!observers.has(element)) {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const visibility: SectionVisibility = {
					isVisible: entry.isIntersecting,
					ratio: entry.intersectionRatio,
					entry
				};

				// Notify all callbacks for this element
				callbacks.get(element)?.forEach((cb) => cb(visibility));
			});
		}, mergedOptions);

		observer.observe(element);
		observers.set(element, observer);
	}

	// Cleanup function
	return () => {
		const cbs = callbacks.get(element);
		cbs?.delete(callback);

		// If no more callbacks, disconnect observer
		if (cbs?.size === 0) {
			observers.get(element)?.disconnect();
			observers.delete(element);
			callbacks.delete(element);
		}
	};
}

/**
 * Observe when an element enters the viewport (one-time trigger)
 * Automatically disconnects after first intersection
 */
export function observeOnce(
	element: HTMLElement,
	callback: () => void,
	threshold: number = 0.1
): () => void {
	if (!browser) {
		return () => {};
	}

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					callback();
					observer.disconnect();
				}
			});
		},
		{ threshold }
	);

	observer.observe(element);

	return () => observer.disconnect();
}

/**
 * Create a Svelte action for observing elements
 * Usage: <div use:observeVisibility={handleVisibility}>
 */
export function observeVisibility(
	element: HTMLElement,
	callback: VisibilityCallback
): { destroy: () => void } {
	const cleanup = observeSection(element, callback);
	return { destroy: cleanup };
}

/**
 * Utility: Check if an element is currently in viewport
 */
export function isInViewport(element: HTMLElement, margin: number = 0): boolean {
	if (!browser) return false;

	const rect = element.getBoundingClientRect();
	const windowHeight = window.innerHeight;
	const windowWidth = window.innerWidth;

	return (
		rect.top < windowHeight + margin &&
		rect.bottom > -margin &&
		rect.left < windowWidth + margin &&
		rect.right > -margin
	);
}

/**
 * Cleanup all observers (call on page unmount)
 */
export function destroyAllObservers() {
	observers.forEach((observer) => observer.disconnect());
	observers.clear();
	callbacks.clear();
}
