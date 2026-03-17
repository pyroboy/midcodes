import { browser } from '$app/environment';

/**
 * Mobile detection hook for Svelte 5
 * Returns reactive state for mobile screen detection
 */
export class IsMobile {
	private _isMobile = $state(false);

	constructor() {
		if (browser) {
			this.checkMobile();
			// Listen for resize events
			window.addEventListener('resize', () => this.checkMobile());
		}
	}

	private checkMobile() {
		if (browser) {
			this._isMobile = window.innerWidth < 768; // Tailwind md breakpoint
		}
	}

	get current() {
		return this._isMobile;
	}
}

// Export a singleton instance
export const isMobile = new IsMobile();
