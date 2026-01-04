/**
 * ScrollState.svelte.ts - Reactive scroll state using Svelte 5 runes
 *
 * This provides a reactive signal that syncs with Lenis scroll events.
 * Components can import and read these values reactively.
 */
import { onScroll, type LenisScrollData } from './LenisManager';

// Section breakpoints (normalized 0-1 progress values)
// Initial default breakpoints (fallback)
export const DEFAULT_BREAKPOINTS = {
	hero: { start: 0, end: 0.1 },
	encode: { start: 0.1, end: 0.2 },
	scan: { start: 0.2, end: 0.3 },
	'tap-approach': { start: 0.3, end: 0.325 },
	'tap-bump': { start: 0.325, end: 0.35 },
	'tap-linger': { start: 0.35, end: 0.375 },
	'tap-success': { start: 0.375, end: 0.4 },
	'layers-main': { start: 0.4, end: 0.44 },
	'layers-hold': { start: 0.44, end: 0.46 },
	'layer-1': { start: 0.46, end: 0.5 },
	'layer-2': { start: 0.5, end: 0.55 },
	'layer-3': { start: 0.55, end: 0.6 },
	'layer-4': { start: 0.6, end: 0.65 },
	'layer-5': { start: 0.65, end: 0.7 },
	useCases: { start: 0.7, end: 0.8 },
	systemScale: { start: 0.8, end: 0.9 },
	physical: { start: 0.9, end: 0.95 },
	footer: { start: 0.95, end: 1.0 }
} as const;

export type SectionName =
	| 'hero'
	| 'encode'
	| 'scan'
	| 'tap-approach' // Split tap section
	| 'tap-bump'
	| 'tap-linger'
	| 'tap-success'
	| 'layers-main'
	| 'layers-hold'
	| 'layer-1'
	| 'layer-2'
	| 'layer-3'
	| 'layer-4'
	| 'layer-5'
	| 'useCases'
	| 'useCases-networking'
	| 'useCases-identification'
	| 'useCases-attendance'
	| 'systemScale'
	| 'physical'
	| 'footer'
	| 'segmentation'; // Added for compatibility

// Scroll state using Svelte 5 runes
let _progress = $state(0);
let _velocity = $state(0);
let _direction = $state<1 | -1>(1);
let _currentSection = $state<SectionName>('hero');
let _sectionProgress = $state(0); // 0-1 within current section


// Cache of DOM elements for pixel-based detection
let _elements: Array<{
	id: string;
	el: HTMLElement;
	top: number;
	height: number;
}> = [];

/**
 * Update element cache. Called on mount and resize.
 */
export function refreshLayout() {
	if (typeof document === 'undefined') return;
	
	const nodes = document.querySelectorAll('[data-section-id]');
	const els: typeof _elements = [];

	nodes.forEach((node) => {
		if (node instanceof HTMLElement) {
			const id = node.getAttribute('data-section-id');
			if (id) {
				els.push({
					id: id,
					el: node,
					top: node.offsetTop,
					height: node.offsetHeight
				});
			}
		}
	});

	// Sort by position
	els.sort((a, b) => a.top - b.top);
	_elements = els;
}

/**
 * Determine valid section name
 */
function isSectionName(id: string): id is SectionName {
	return id in DEFAULT_BREAKPOINTS || id === 'segmentation';
}

/**
 * Update scroll state from Lenis
 * Uses robust BoundingClientRect logic relative to viewport top
 */
function updateFromLenis(data: LenisScrollData) {
	_progress = data.progress;
	_velocity = data.velocity;
	_direction = data.direction;

	if (_elements.length === 0) return;

	// Critical Fix: Use getBoundingClientRect for absolute truth about viewport position.
	// We don't rely on cached 'offsetTop' or 'window.scrollY' which can drift or be affected by transforms.
	
	let activeIndex = -1;
	let maxOverlap = -Infinity;

	// Loop through elements to find which one is currently "active"
	// Definition of Active: The element that is currently crossing the top of the screen,
	// OR validly occupying the primary viewport space.
	// Strict Rule: 0% progress = Element Top is at Viewport Top.
	
	for (let i = 0; i < _elements.length; i++) {
		const item = _elements[i];
		const rect = item.el.getBoundingClientRect();
		
		// An element is "active" if its top is at or above the viewport top,
		// AND its bottom is still below the viewport top (it hasn't fully scrolled past).
		// We add a small epsilon (1px) for exact boundary cases.
		
		if (rect.top <= 1 && rect.bottom > 0) {
			// Found it. 
			// If multiple match (e.g. nested or zero-height), prefer the last one or largest overlap?
			// Standard separate sections should imply only one covers the 'top line'.
			activeIndex = i;
			// We break immediately if we assume sequential non-overlapping sections.
			// However, if there are gaps, we might need fallback.
			// Let's assume standard flow.
			
			// Calculate progress:
			// 0% = rect.top is 0.
			// 100% = rect.bottom is 0 (scrolled fully past).
			// Progress = Scrolled Amount / Total Height
			// Scrolled Amount = (Total Height - rect.bottom)? No.
			// Distance traveled = Height - rect.bottom? 
			// Wait.
			// At Start: rect.top = 0, rect.bottom = Height.
			// At End: rect.top = -Height, rect.bottom = 0.
			// Scrolled = -rect.top.
			// Progress = -rect.top / Height.
			
			const scrolledPixels = -rect.top;
			_sectionProgress = Math.max(0, Math.min(1, scrolledPixels / rect.height));
			break;
		}
	}

	if (activeIndex !== -1) {
		const s = _elements[activeIndex];
		let id = s.id;
		// Removed mapping for useCases_impact as it is now systemScale
		_currentSection = id as SectionName;
	} else {
		// Fallback: If no element touches the top line.
		// If we are above the first element:
		const first = _elements[0];
		if (first.el.getBoundingClientRect().top > 0) {
			_currentSection = 'hero';
			_sectionProgress = 0;
		} 
		// If we are below the last element:
		else {
			const last = _elements[_elements.length - 1];
			// Use mapped name
			let id = last.id;
			// Removed mapping
			
			if (last.el.getBoundingClientRect().bottom <= 0) {
				_currentSection = id as SectionName;
				_sectionProgress = 1;
			} else {
				// We are in a gap between sections?
				// Find the closest previous section
				// This shouldn't happen with our contiguous layout assumption but good for safety.
				// Just keep previous value or search closest.
				// Let's assume footer or last known state.
			}
		}
	}
}

// Subscribe on module load (will be called after Lenis init)
let unsubscribe: (() => void) | null = null;
let observer: ResizeObserver | null = null;

/**
 * Connect scroll state to Lenis
 * Call this after initLenis()
 */
export function connectScrollState(): () => void {
	// Initial detection
	refreshLayout();
	
	// Recalculate on resize
	observer = new ResizeObserver(() => {
		refreshLayout();
	});
	observer.observe(document.body);

	unsubscribe = onScroll(updateFromLenis);
	
	return () => {
		unsubscribe?.();
		unsubscribe = null;
		observer?.disconnect();
		observer = null;
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
	// Not easily calculable in unitless 0-1 without updated cache logic.
	// For now, simpler approximation:
	if (_currentSection === section) return 0;
	// We need to look up target section's index vs current
    // This function is less critical for the core loop, can iterate
    const target = _elements.find(e => e.id === section);
    if (!target) return 0;
    
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    
    if (scrollY < target.top) return (target.top - scrollY) / window.innerHeight; // Distance in screens
    if (scrollY > target.top + target.height) return (target.top + target.height - scrollY) / window.innerHeight;
    
    return 0;
}
