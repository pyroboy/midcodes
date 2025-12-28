/**
 * ScrollState.svelte.ts - Reactive scroll state using Svelte 5 runes
 *
 * This provides a reactive signal that syncs with Lenis scroll events.
 * Components can import and read these values reactively.
 */
import { onScroll, type LenisScrollData } from './LenisManager';

// Section breakpoints (normalized 0-1 progress values)
// Section breakpoints (normalized 0-1 progress values)
// Section breakpoints (normalized 0-1 progress values)
export const SECTION_BREAKPOINTS = {
	hero: { start: 0, end: 0.12 },
	encode: { start: 0.12, end: 0.22 }, // Kill spreadsheet / Manual Entry
	scan: { start: 0.22, end: 0.34 },   // Camera Scan
	tap: { start: 0.34, end: 0.44 },    // NFC Tap
	layers: { start: 0.44, end: 0.54 },      // ~10% for 100vh
	useCases: { start: 0.54, end: 0.69 },    // ~15% for 150vh
	testimonials: { start: 0.69, end: 0.79 }, // ~10% for 100vh
	segmentation: { start: 0.79, end: 0.89 }, // ~10% for 100vh
	physical: { start: 0.89, end: 0.98 },     // ~9% for 100vh
	footer: { start: 0.98, end: 1.0 }
} as const;

export type SectionName = keyof typeof SECTION_BREAKPOINTS;

// Scroll state using Svelte 5 runes
let _progress = $state(0);
let _velocity = $state(0);
let _direction = $state<1 | -1>(1);
let _currentSection = $state<SectionName>('hero');
let _sectionProgress = $state(0); // 0-1 within current section

/**
 * Determine which section we're in based on progress
 */
function getSectionFromProgress(progress: number): SectionName {
	for (const [name, bounds] of Object.entries(SECTION_BREAKPOINTS)) {
		if (progress >= bounds.start && progress < bounds.end) {
			return name as SectionName;
		}
	}
	return 'footer';
}

/**
 * Calculate progress within the current section (0-1)
 */
function getSectionProgress(progress: number, section: SectionName): number {
	const bounds = SECTION_BREAKPOINTS[section];
	const range = bounds.end - bounds.start;
	if (range === 0) return 0;
	return Math.max(0, Math.min(1, (progress - bounds.start) / range));
}

/**
 * Update scroll state from Lenis
 */
function updateFromLenis(data: LenisScrollData) {
	_progress = data.progress;
	_velocity = data.velocity;
	_direction = data.direction;
	_currentSection = getSectionFromProgress(data.progress);
	_sectionProgress = getSectionProgress(data.progress, _currentSection);
}

// Subscribe on module load (will be called after Lenis init)
let unsubscribe: (() => void) | null = null;

/**
 * Connect scroll state to Lenis
 * Call this after initLenis()
 */
export function connectScrollState(): () => void {
	unsubscribe = onScroll(updateFromLenis);
	return () => {
		unsubscribe?.();
		unsubscribe = null;
	};
}

/**
 * Read-only reactive getters for scroll state
 */
export function getScrollState() {
	return {
		get progress() {
			return _progress;
		},
		get velocity() {
			return _velocity;
		},
		get direction() {
			return _direction;
		},
		get currentSection() {
			return _currentSection;
		},
		get sectionProgress() {
			return _sectionProgress;
		}
	};
}

/**
 * Get progress within a specific section (useful for section-specific animations)
 * Returns 0 if not in that section, otherwise 0-1 progress within it
 */
export function getSectionLocalProgress(section: SectionName): number {
	if (_currentSection !== section) return 0;
	return _sectionProgress;
}

/**
 * Check if a section is currently active
 */
export function isSectionActive(section: SectionName): boolean {
	return _currentSection === section;
}

/**
 * Get the distance to a section (negative if past, positive if upcoming)
 * Returns 0 when inside the section
 */
export function getDistanceToSection(section: SectionName): number {
	const bounds = SECTION_BREAKPOINTS[section];
	if (_progress < bounds.start) return bounds.start - _progress;
	if (_progress > bounds.end) return bounds.end - _progress;
	return 0;
}
