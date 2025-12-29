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
	| 'systemScale' // Grid visible, main card hidden
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

		case 'systemScale':
			return 'systemScale';

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
			// Card on LEFT, phone on RIGHT
			// Adjusted rotation (45 degrees)
			return {
				position: { x: -0.5, y: 0, z: 0 },
				rotation: { x: 0, y: Math.PI * 0.25, z: 0 },
				scale: 1
			};

		case 'tap': {
			// Card taps phone with NFC, shows verification, then exits
			// Synced with phone phases:
			// 0-0.1: Approach
			// 0.1-0.25: Tap bump (NFC detected)
			// 0.25-0.35: Hold - Reading...
			// 0.35-0.5: Show Verified
			// 0.5-0.65: Move to success pose
			// 0.65-0.85: Hold success
			// 0.85-1: Exit

			const SCAN_X = -0.5;
			const SCAN_ROT_Y = Math.PI * 0.25;
			const TAP_X = -0.2;
			const TAP_ROT_Y = Math.PI * 0.15;
			const BUMP_X = 0.1;

			const SUCCESS_X = 0;
			const SUCCESS_Z = 0.4;
			const SUCCESS_ROT_Y = Math.PI * 0.05;

			// Dutch angle target for layers-main: { x: -0.3, y: Math.PI * 0.25, z: 0.3 }
			const LAYERS_ROT_X = -0.3;
			const LAYERS_ROT_Y = Math.PI * 0.25;
			const LAYERS_ROT_Z = 0.3;
			const LAYERS_POS_X = -0.2;

			let x = SCAN_X;
			let y = 0;
			let z = 0;
			let rotX = 0;
			let rotY = SCAN_ROT_Y;
			let rotZ = 0;

			if (sectionProgress < 0.1) {
				// Phase 1: Approach
				const p = sectionProgress / 0.1;
				const eased = p * p * (3 - 2 * p);
				x = SCAN_X + (TAP_X - SCAN_X) * eased;
				rotY = SCAN_ROT_Y + (TAP_ROT_Y - SCAN_ROT_Y) * eased;
			} else if (sectionProgress < 0.25) {
				// Phase 2: Tap bump
				const p = (sectionProgress - 0.1) / 0.15;
				const bumpP = Math.sin(p * Math.PI);
				x = TAP_X + (BUMP_X - TAP_X) * bumpP;
				z = 0.15 * bumpP;
				rotY = TAP_ROT_Y;
			} else if (sectionProgress < 0.5) {
				// Phase 3-4: Hold during NFC reading & verification display
				x = TAP_X;
				z = 0;
				rotY = TAP_ROT_Y;
			} else if (sectionProgress < 0.65) {
				// Phase 5: Move to success pose
				const p = (sectionProgress - 0.5) / 0.15;
				const eased = p * p * (3 - 2 * p);
				x = TAP_X + (SUCCESS_X - TAP_X) * eased;
				z = SUCCESS_Z * eased;
				rotY = TAP_ROT_Y + (SUCCESS_ROT_Y - TAP_ROT_Y) * eased;
			} else if (sectionProgress < 0.85) {
				// Phase 6: Hold success pose
				x = SUCCESS_X;
				z = SUCCESS_Z;
				rotY = SUCCESS_ROT_Y;
			} else {
				// Phase 7: Transition to dutch angle for layers-main
				const p = (sectionProgress - 0.85) / 0.15;
				const eased = p * p * (3 - 2 * p);
				x = SUCCESS_X + (LAYERS_POS_X - SUCCESS_X) * eased;
				z = SUCCESS_Z + (0 - SUCCESS_Z) * eased;
				rotX = LAYERS_ROT_X * eased;
				rotY = SUCCESS_ROT_Y + (LAYERS_ROT_Y - SUCCESS_ROT_Y) * eased;
				rotZ = LAYERS_ROT_Z * eased;
			}

			return {
				position: { x, y, z },
				rotation: { x: rotX, y: rotY, z: rotZ },
				scale: 1
			};
		}

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
		
		case 'systemScale':
			// Main card fades out during first 20% of systemScale to let sphere take focus
			const fadeProgress = Math.min(1, sectionProgress / 0.2);
			return {
				position: { x: 0, y: 0, z: 0 },
				rotation: { x: 0, y: 0, z: 0 },
				scale: 1 - fadeProgress
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

		case 'systemScale':
			// Fade out during first 20% to match scale transition
			visuals.opacity = 1 - Math.min(1, sectionProgress / 0.2);
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
