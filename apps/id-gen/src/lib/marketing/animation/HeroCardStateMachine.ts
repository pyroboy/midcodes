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
	| 'encode' // Enters stage, data entry context
	| 'scan' // Laser scan, phone interaction
	| 'tap' // NFC tap interaction
	| 'exploding' // Transition: layers separating
	| 'exploded' // 3 planes hovering apart
	| 'collapsing' // Transition: layers merging
	| 'physical' // Stack of cards + lanyard (Hero card hides or moves to top)
	| 'segmentation' // Flipping card (Student vs CEO)
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
	typingProgress: number; // 0 to 1 scaling for name bar
	opacity: number;
	highlightLayer: number; // 0 = none, 1-5 = specific layer
}

export function getSectionCardState(section: SectionName, sectionProgress: number): CardState {
	switch (section) {
		case 'hero':
			return 'hero';

		case 'encode':
			return 'encode';

		case 'scan':
			return 'scan';

		case 'tap':
			return 'tap';

		case 'layers-main':
			// Explode out
			if (sectionProgress < 0.5) return 'exploding';
			return 'exploded';

		case 'layer-1':
		case 'layer-2':
		case 'layer-3':
		case 'layer-4':
		case 'layer-5':
			return 'exploded';

		case 'useCases':
			return 'useCases';



		case 'physical':
			// Stack of cards
			return 'physical';

		// removed 'shop' case as it's replaced/merged

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

		case 'encode':
			// Centered, slight float, typing animation
			return {
				position: { x: 0, y: Math.sin(sectionProgress * Math.PI) * 0.1, z: 0 },
				rotation: { x: 0, y: 0, z: 0 },
				scale: 1
			};

		case 'scan':
			// Move to scan position and hold
			const scanPos = -1.0 + (sectionProgress * 0.4); // -1.0 -> -0.6
			return {
				position: { x: scanPos, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: 0 },
				scale: 1
			};

		case 'tap':
			// Tap animation
			// Move closer to phone (-0.6 -> -0.4) then tap (z bump)
			return {
				position: { x: -0.6 + (sectionProgress * 0.2), y: 0, z: Math.sin(sectionProgress * Math.PI * 4) * 0.05 },
				rotation: { x: 0, y: 0, z: -0.1 }, // Tilt for tap
				scale: 1
			};

		case 'exploding':
		case 'exploded':
		case 'collapsing':
			return {
				position: { x: -0.2, y: 0, z: 0 },
				// Dutch angle: Tilted UP (negative X), Rotated (Y), Rolled LEFT (positive Z)
				rotation: { x: -0.3, y: Math.PI * 0.25, z: 0.3 }, 
				scale: 0.9
			};

		case 'physical':
			// Dangling card with physics, floating above/near the stack
			return {
				position: { x: 0, y: -0.2, z: 1.5 }, // Bring forward and center
				rotation: { x: 0, y: 0, z: 0 }, // Vertical for dangling
				scale: 1
			};

		case 'segmentation':
			// Centered for flipping
			return {
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0, y: sectionProgress * Math.PI * 4, z: 0 }, // Continuous flip based on progress
				scale: 1.1
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
export function getStateVisuals(
	state: CardState,
	sectionProgress: number,
	sectionName?: SectionName
): CardVisualState {
	// Default visual state
	const defaultVisuals: CardVisualState = {
		autoRotate: false,
		autoRotateSpeed: 0,
		layerSeparation: 0,
		textureIndex: 0,
		lanyardVisible: false,
		laserScanActive: false,
		glowIntensity: 0,
		typingProgress: 1,
		opacity: 1,
		highlightLayer: 0
	};

	let visuals = { ...defaultVisuals };

	switch (state) {
		case 'hero':
			visuals.autoRotate = true;
			visuals.autoRotateSpeed = 0.3;
			visuals.typingProgress = 0;
			break;

		case 'encode':
			visuals.typingProgress = 1;
			break;

		case 'scan':
			visuals.laserScanActive = true;
			visuals.glowIntensity = 1;
			break;

		case 'tap':
			break;

		case 'exploding':
			visuals.layerSeparation = sectionProgress * 2.5;
			break;

		case 'exploded':
			visuals.layerSeparation = 0.75;
			// Map section to highlight layer
			if (sectionName === 'layer-1') visuals.highlightLayer = 1;
			else if (sectionName === 'layer-2') visuals.highlightLayer = 2;
			else if (sectionName === 'layer-3') visuals.highlightLayer = 3;
			else if (sectionName === 'layer-4') visuals.highlightLayer = 4;
			else if (sectionName === 'layer-5') visuals.highlightLayer = 5;
			break;

		case 'collapsing':
			const collapseT = (sectionProgress - 0.7) / 0.3;
			visuals.layerSeparation = 0.75 * (1 - collapseT);
			break;

		case 'physical':
			visuals.lanyardVisible = true;
			break;

		case 'segmentation':
			visuals.textureIndex = -1;
			break;

		case 'useCases':
			visuals.autoRotate = true;
			visuals.autoRotateSpeed = 0.2;
			visuals.textureIndex = Math.min(2, Math.floor(sectionProgress * 3));
			break;

		case 'shrinking':
			visuals.autoRotate = true;
			visuals.autoRotateSpeed = 0.5;
			break;

		case 'growing':
		case 'shop':
			visuals.lanyardVisible = true;
			break;

		case 'hidden':
		default:
			visuals.opacity = 0;
			break;
	}

	return visuals;
}

// Update blendVisuals to handle highlightLayer
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
		typingProgress: from.typingProgress + (to.typingProgress - from.typingProgress) * eased,
		opacity: from.opacity + (to.opacity - from.opacity) * eased,
		highlightLayer: t > 0.5 ? to.highlightLayer : from.highlightLayer
	};
}
