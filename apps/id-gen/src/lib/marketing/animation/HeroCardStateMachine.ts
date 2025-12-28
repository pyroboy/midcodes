/**
 * HeroCardStateMachine.ts - Centralized state machine for marketing card
 *
 * Manages state transitions and provides target values for each state.
 * This makes the HeroCard3D component cleaner and transitions more maintainable.
 */
import type { SectionName } from '$lib/marketing/scroll';
import { Easing, scrollRange, mapRangeClamped, type EasingFunction } from './CardAnimations';

// ============================================================================
// STATE DEFINITIONS
// ============================================================================

export type CardState =
	| 'hero' // Slow rotation, embossed Ka symbol
	| 'verification' // Flat, laser scan, green glow
	| 'exploding' // Transition: layers separating
	| 'exploded' // 3 planes hovering apart
	| 'collapsing' // Transition: layers merging
	| 'useCases' // Texture swapping on scroll
	| 'shrinking' // Transition: moving to corner
	| 'testimonials' // Small, grid visible behind
	| 'growing' // Transition: returning to center
	| 'shop' // Lanyard attached, pendulum swing
	| 'hidden'; // Footer (faded out)

export interface CardTransform {
	position: { x: number; y: number; z: number };
	rotation: { x: number; y: number; z: number };
	scale: number;
}

export interface CardVisualState {
	autoRotate: boolean;
	autoRotateSpeed: number;
	layerSeparation: number;
	textureIndex: number;
	lanyardVisible: boolean;
	laserScanActive: boolean;
	glowIntensity: number;
	opacity: number;
}

// ============================================================================
// STATE MACHINE
// ============================================================================

/**
 * Map section to card state based on section progress
 */
export function getSectionCardState(section: SectionName, sectionProgress: number): CardState {
	switch (section) {
		case 'hero':
			return 'hero';

		case 'verification':
			return 'verification';

		case 'layers':
			// Explode animation in first half, hold in second half
			if (sectionProgress < 0.3) return 'exploding';
			if (sectionProgress < 0.7) return 'exploded';
			return 'collapsing';

		case 'useCases':
			return 'useCases';

		case 'testimonials':
			if (sectionProgress < 0.2) return 'shrinking';
			return 'testimonials';

		case 'shop':
			if (sectionProgress < 0.2) return 'growing';
			return 'shop';

		case 'footer':
			return 'hidden';

		default:
			return 'hero';
	}
}

/**
 * Get target transform for a card state
 */
export function getStateTransform(state: CardState, sectionProgress: number): CardTransform {
	switch (state) {
		case 'hero':
			return {
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: 0 },
				scale: 1
			};

		case 'verification':
			return {
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: 0 },
				scale: 1
			};

		case 'exploding':
		case 'exploded':
		case 'collapsing':
			return {
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0.1, y: Math.PI * 0.08, z: 0 },
				scale: 0.9
			};

		case 'useCases':
			return {
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: 0 },
				scale: 1
			};

		case 'shrinking':
			// Animate to corner
			const shrinkT = sectionProgress / 0.2;
			return {
				position: {
					x: shrinkT * 2,
					y: shrinkT * 1.5,
					z: shrinkT * -2
				},
				rotation: { x: 0, y: 0, z: 0 },
				scale: 1 - shrinkT * 0.6
			};

		case 'testimonials':
			return {
				position: { x: 2, y: 1.5, z: -2 },
				rotation: { x: 0, y: 0, z: 0 },
				scale: 0.4
			};

		case 'growing':
			// Animate back to center
			const growT = sectionProgress / 0.2;
			return {
				position: {
					x: 2 * (1 - growT),
					y: 1.5 * (1 - growT),
					z: -2 * (1 - growT)
				},
				rotation: { x: 0, y: 0, z: 0 },
				scale: 0.4 + growT * 0.6
			};

		case 'shop':
			return {
				position: { x: 0, y: -0.5, z: 0 },
				rotation: { x: 0, y: 0, z: 0 },
				scale: 1
			};

		case 'hidden':
		default:
			return {
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: 0 },
				scale: 0
			};
	}
}

/**
 * Get visual state for a card state
 */
export function getStateVisuals(state: CardState, sectionProgress: number): CardVisualState {
	switch (state) {
		case 'hero':
			return {
				autoRotate: true,
				autoRotateSpeed: 0.3,
				layerSeparation: 0,
				textureIndex: 0,
				lanyardVisible: false,
				laserScanActive: false,
				glowIntensity: 0,
				opacity: 1
			};

		case 'verification':
			return {
				autoRotate: false,
				autoRotateSpeed: 0,
				layerSeparation: 0,
				textureIndex: 0,
				lanyardVisible: false,
				laserScanActive: true,
				glowIntensity: sectionProgress,
				opacity: 1
			};

		case 'exploding':
			return {
				autoRotate: false,
				autoRotateSpeed: 0,
				layerSeparation: sectionProgress * 2.5, // 0 → 0.75
				textureIndex: 0,
				lanyardVisible: false,
				laserScanActive: false,
				glowIntensity: 0,
				opacity: 1
			};

		case 'exploded':
			return {
				autoRotate: false,
				autoRotateSpeed: 0,
				layerSeparation: 0.75,
				textureIndex: 0,
				lanyardVisible: false,
				laserScanActive: false,
				glowIntensity: 0,
				opacity: 1
			};

		case 'collapsing':
			// Map 0.7-1.0 → 0.75-0 separation
			const collapseT = (sectionProgress - 0.7) / 0.3;
			return {
				autoRotate: false,
				autoRotateSpeed: 0,
				layerSeparation: 0.75 * (1 - collapseT),
				textureIndex: 0,
				lanyardVisible: false,
				laserScanActive: false,
				glowIntensity: 0,
				opacity: 1
			};

		case 'useCases':
			return {
				autoRotate: true,
				autoRotateSpeed: 0.2,
				layerSeparation: 0,
				textureIndex: Math.min(2, Math.floor(sectionProgress * 3)),
				lanyardVisible: false,
				laserScanActive: false,
				glowIntensity: 0,
				opacity: 1
			};

		case 'shrinking':
		case 'testimonials':
			return {
				autoRotate: true,
				autoRotateSpeed: 0.5,
				layerSeparation: 0,
				textureIndex: 0,
				lanyardVisible: false,
				laserScanActive: false,
				glowIntensity: 0,
				opacity: 1
			};

		case 'growing':
		case 'shop':
			return {
				autoRotate: false,
				autoRotateSpeed: 0,
				layerSeparation: 0,
				textureIndex: 0,
				lanyardVisible: true,
				laserScanActive: false,
				glowIntensity: 0,
				opacity: 1
			};

		case 'hidden':
		default:
			return {
				autoRotate: false,
				autoRotateSpeed: 0,
				layerSeparation: 0,
				textureIndex: 0,
				lanyardVisible: false,
				laserScanActive: false,
				glowIntensity: 0,
				opacity: 0
			};
	}
}

// ============================================================================
// TRANSITION HELPERS
// ============================================================================

/**
 * Blend two transforms with a factor (for smooth transitions)
 */
export function blendTransforms(from: CardTransform, to: CardTransform, t: number): CardTransform {
	const eased = Easing.smoothStep(t);
	return {
		position: {
			x: from.position.x + (to.position.x - from.position.x) * eased,
			y: from.position.y + (to.position.y - from.position.y) * eased,
			z: from.position.z + (to.position.z - from.position.z) * eased
		},
		rotation: {
			x: from.rotation.x + (to.rotation.x - from.rotation.x) * eased,
			y: from.rotation.y + (to.rotation.y - from.rotation.y) * eased,
			z: from.rotation.z + (to.rotation.z - from.rotation.z) * eased
		},
		scale: from.scale + (to.scale - from.scale) * eased
	};
}

/**
 * Blend two visual states
 */
export function blendVisuals(
	from: CardVisualState,
	to: CardVisualState,
	t: number
): CardVisualState {
	const eased = Easing.smoothStep(t);
	return {
		autoRotate: t > 0.5 ? to.autoRotate : from.autoRotate,
		autoRotateSpeed: from.autoRotateSpeed + (to.autoRotateSpeed - from.autoRotateSpeed) * eased,
		layerSeparation: from.layerSeparation + (to.layerSeparation - from.layerSeparation) * eased,
		textureIndex: t > 0.5 ? to.textureIndex : from.textureIndex,
		lanyardVisible: t > 0.5 ? to.lanyardVisible : from.lanyardVisible,
		laserScanActive: t > 0.5 ? to.laserScanActive : from.laserScanActive,
		glowIntensity: from.glowIntensity + (to.glowIntensity - from.glowIntensity) * eased,
		opacity: from.opacity + (to.opacity - from.opacity) * eased
	};
}
