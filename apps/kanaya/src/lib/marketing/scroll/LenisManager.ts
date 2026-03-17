/**
 * LenisManager.ts - Smooth scroll singleton for marketing page
 *
 * Lenis provides buttery-smooth scrolling with:
 * - Momentum-based physics (not CSS smooth-scroll)
 * - Consistent behavior across browsers
 * - RAF-synchronized updates for Three.js integration
 */
import Lenis from 'lenis';
import { browser } from '$app/environment';

let lenisInstance: Lenis | null = null;
let rafId: number | null = null;

export interface LenisScrollData {
	scroll: number; // Current scroll position
	limit: number; // Max scroll (document height - viewport)
	velocity: number; // Scroll velocity
	direction: 1 | -1; // Scroll direction
	progress: number; // 0-1 normalized progress
}

type ScrollCallback = (data: LenisScrollData) => void;
const scrollCallbacks: Set<ScrollCallback> = new Set();

/**
 * Initialize Lenis smooth scroll
 * Call this once when the marketing page mounts
 */
export function initLenis(): Lenis | null {
	if (!browser) return null;

	// Already initialized
	if (lenisInstance) return lenisInstance;

	lenisInstance = new Lenis({
		duration: 1.0, // Reduced from 1.2 for snappier feel
		easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth easing
		orientation: 'vertical',
		gestureOrientation: 'vertical',
		smoothWheel: true,
		wheelMultiplier: 1,
		touchMultiplier: 2,
		infinite: false
	});

	let lastScroll = -1;

	// Subscribe to scroll events
	lenisInstance.on('scroll', (e: Lenis) => {
		// Optimization: Round values to 2 decimal places to avoid "super big floats"
		// and excessive reactivity updates
		const currentScroll = Math.round(e.scroll * 100) / 100;
		
		// Skip if change is insignificant (less than 0.01px)
		if (Math.abs(currentScroll - lastScroll) < 0.01) return;
		
		lastScroll = currentScroll;

		const data: LenisScrollData = {
			scroll: currentScroll,
			limit: Math.round(e.limit * 100) / 100,
			velocity: Math.round(e.velocity * 100) / 100,
			direction: e.direction as 1 | -1,
			progress: Math.round(e.progress * 1000) / 1000 // Keep 3 decimal places for progress (0-1)
		};

		// Notify all subscribers
		scrollCallbacks.forEach((cb) => cb(data));
	});

	// Start the RAF loop
	function raf(time: number) {
		lenisInstance?.raf(time);
		rafId = requestAnimationFrame(raf);
	}
	rafId = requestAnimationFrame(raf);

	return lenisInstance;
}

/**
 * Subscribe to scroll updates
 * Returns unsubscribe function
 */
export function onScroll(callback: ScrollCallback): () => void {
	scrollCallbacks.add(callback);
	return () => scrollCallbacks.delete(callback);
}

/**
 * Get current Lenis instance (for advanced usage)
 */
export function getLenis(): Lenis | null {
	return lenisInstance;
}

/**
 * Scroll to a specific position or element
 */
export function scrollTo(
	target: number | string | HTMLElement,
	options?: { offset?: number; duration?: number; immediate?: boolean }
) {
	lenisInstance?.scrollTo(target, options);
}

/**
 * Temporarily stop/start Lenis (e.g., for modals)
 */
export function pauseScroll() {
	lenisInstance?.stop();
}

export function resumeScroll() {
	lenisInstance?.start();
}

/**
 * Cleanup Lenis (call on page unmount)
 */
export function destroyLenis() {
	if (rafId) {
		cancelAnimationFrame(rafId);
		rafId = null;
	}

	lenisInstance?.destroy();
	lenisInstance = null;
	scrollCallbacks.clear();
}
