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
	| 'tap-approach' 
	| 'tap-bump'
	| 'tap-linger'
	| 'tap-success'
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

// Shared constants for Tap sequence
const SCAN_X = -0.6;
const SCAN_ROT_Y = Math.PI * 0.25;

const APPROACH_X = -0.5;
const APPROACH_ROT_Y = Math.PI * 0.2;

const CONTACT_X = -0.42; // Prevent clipping (Center-to-Center needs > 0.8)
const CONTACT_Z = 0.1;

const BUMP_ROT_X = 0.15;
const BUMP_ROT_Z = -0.1;

const LINGER_X = -0.45;
const LINGER_Z = 0.05;
const LINGER_ROT_Y = Math.PI * 0.12;

const SUCCESS_X = -0.4;
const SUCCESS_Z = 0.3;
const SUCCESS_ROT_Y = Math.PI * 0.06;

// Dutch angle target for layers-main start
const LAYERS_ROT_X = -0.3;
const LAYERS_ROT_Y = Math.PI * 0.25;
const LAYERS_ROT_Z = 0.3;
const LAYERS_POS_X = -0.2;

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

		case 'tap-approach':
			return 'tap-approach';

		case 'tap-bump':
			return 'tap-bump';

		case 'tap-linger':
			return 'tap-linger';

		case 'tap-success':
			return 'tap-success';

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

		case 'tap-approach': {
			// 0-100%: Approach - Organic "Hand" Movement
			const p = sectionProgress;
			const eased = p * p * (3 - 2 * p); // smoothstep
			const arcP = Math.sin(p * Math.PI); // 0->1->0

			return {
				position: {
					x: SCAN_X + (APPROACH_X - SCAN_X) * eased,
					y: arcP * 0.05, // Slight lift
					z: arcP * 0.1   // Arc out towards camera to "clear" obstacles
				},
				rotation: {
					x: arcP * 0.1,  // "Wrist cock" - tilt back slightly during move
					y: SCAN_ROT_Y + (APPROACH_ROT_Y - SCAN_ROT_Y) * eased,
					z: -arcP * 0.1  // Bank into the turn
				},
				scale: 1
			};
		}

		case 'tap-bump': {
			// 0-100%: Tactile Bump
			const p = sectionProgress;
			const bumpP = Math.sin(p * Math.PI); // 0->1->0 base

			// Sharper impact curve? Standard sin is fine for "bounce" feel
			
			return {
				position: {
					x: APPROACH_X + (CONTACT_X - APPROACH_X) * bumpP,
					y: 0,
					z: CONTACT_Z * bumpP
				},
				rotation: {
					x: -0.2 * bumpP, // "Tip forward" to tap the reader with top edge
					y: APPROACH_ROT_Y, 
					z: -0.25 * bumpP // Stronger roll right (banking into the tap)
				},
				scale: 1
			};
		}

		case 'tap-linger': {
			// 0-100%: Magnetic Tension + Start of Peel
			const p = sectionProgress;
			const easeP = p * p * (3 - 2 * p);
			
			// High frequency "magnetic" vibration
			const vibration = Math.sin(p * Math.PI * 8) * 0.005;
			const float = Math.sin(p * Math.PI * 2) * 0.02; // Slow wobble

			// Start peeling/lifting towards the end of linger
			// EaseIn to build momentum into the success phase
			const peelP = p * p; // 0 -> 1

			// Targets for end of linger (halfway to layers-main)
			const MID_PEEL_ROT_X = -0.15;
			const MID_PEEL_ROT_Z = 0.1;

			return {
				position: {
					x: APPROACH_X + (LINGER_X - APPROACH_X) * easeP + vibration,
					y: float * 0.5,
					z: CONTACT_Z + (LINGER_Z - CONTACT_Z) * easeP 
				},
				rotation: {
					x: float + (MID_PEEL_ROT_X * peelP), 
					y: APPROACH_ROT_Y + (LINGER_ROT_Y - APPROACH_ROT_Y) * easeP,
					z: float * 0.5 + (MID_PEEL_ROT_Z * peelP)
				},
				scale: 1
			};
		}

		case 'tap-success': {
			// 0-100%: Complete Peel & Separate
			const p = sectionProgress;
			
			// Constants to match Linger end state
			const MID_PEEL_ROT_X = -0.15;
			const MID_PEEL_ROT_Z = 0.1;

			// 1. Peel Continuation: (EaseOut to finish the momentum started in Linger)
			const peelP = 1 - (1 - p) * (1 - p);
			
			// 2. Separate: (EaseInCubic)
			const separateP = p * p * p;

			// 3. Rotate Z Continuation: (SmoothStep)
			const rotateP = p * p * (3 - 2 * p);

			return {
				position: {
					x: LINGER_X + (LAYERS_POS_X - LINGER_X) * separateP,
					y: 0,
					z: LINGER_Z + (0 - LINGER_Z) * separateP
				},
				rotation: {
					x: MID_PEEL_ROT_X + (LAYERS_ROT_X - MID_PEEL_ROT_X) * peelP,
					y: LINGER_ROT_Y + (LAYERS_ROT_Y - LINGER_ROT_Y) * rotateP,
					z: MID_PEEL_ROT_Z + (LAYERS_ROT_Z - MID_PEEL_ROT_Z) * rotateP
				},
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

		case 'tap-approach':
		case 'tap-bump':
		case 'tap-linger':
		case 'tap-success':
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
