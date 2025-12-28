/**
 * Marketing Scroll Module
 *
 * Provides smooth scrolling and visibility-based triggers for the marketing page.
 */
export {
	initLenis,
	destroyLenis,
	getLenis,
	onScroll,
	scrollTo,
	pauseScroll,
	resumeScroll,
	type LenisScrollData
} from './LenisManager';

export {
	connectScrollState,
	getScrollState,
	getSectionLocalProgress,
	getDistanceToSection,
	SECTION_BREAKPOINTS,
	type SectionName
} from './ScrollState.svelte.js';

export {
	observeSection,
	observeOnce,
	observeVisibility,
	isInViewport,
	destroyAllObservers,
	type SectionVisibility
} from './ScrollObservers';
