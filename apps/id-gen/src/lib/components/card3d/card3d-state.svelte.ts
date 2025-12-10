/**
 * Card3D constants and helper functions
 * Extracted from TemplateCard3D.svelte for better organization
 */

import type { MorphShape, CardDimensions } from './types';

/**
 * All constants for the 3D card component
 */
export const CARD3D_CONSTANTS = {
	// Base scale for 3D units
	BASE_SCALE: 3.6,

	// Rotation speeds - dynamic based on which face is visible
	ROTATION_SPEED_FACE: 0.002, // Front & back facing speed (linger longer on faces)
	ROTATION_SPEED_EDGE: 0.12, // Edge transition speed (very fast through edges)
	SPIN_SPEED: 0.08, // Eased spin speed (progress increment per frame)

	// Thresholds for speed zones (in radians)
	FACE_THRESHOLD: (15 * Math.PI) / 180, // 15 degrees - slow zone around front & back

	// Front-facing tolerance for final angle: random within +/-30 degrees
	FRONT_FACING_TOLERANCE: Math.PI / 6, // 30 degrees

	// Base tilt
	BASE_TILT_X: -0.12,

	// Oscillating tilt animation
	OSCILLATE_SPEED: 0.015, // Faster oscillation (was 0.008)
	OSCILLATE_AMPLITUDE: (12 * Math.PI) / 180, // 12 degrees in radians (was 5)

	// Wobble effect
	WOBBLE_FREQUENCY: 8, // Oscillation frequency (slightly slower for smoothness)

	// Morphing animation
	MORPH_SPEED: 0.008, // Speed of cycling
	HOLD_DURATION: 0.6, // Hold at each shape (0-1 range, 0.6 = 60% of cycle is holding)

	// Beat system
	BEATS_PER_SHAPE_CHANGE: 4,

	// Loading
	LOADING_DEBOUNCE_MS: 200 // Show loading icon only after 200ms delay
} as const;

/**
 * Pre-defined morph shapes - Real-world card sizes at 300 DPI
 * Based on standard card dimensions used in printing
 */
export const MORPH_SHAPES: readonly MorphShape[] = [
	// Credit Card / CR80 (3.375" x 2.125" = 1013 x 638 px)
	{ w: 1013, h: 638 }, // CR80 Landscape
	{ w: 675, h: 1013 }, // CR80 Portrait (Adjusted to ~2:3 for better visual fit)

	// Business Card (3.5" x 2.0" = 1050 x 600 px)
	{ w: 1050, h: 600 }, // Business Card Landscape
	{ w: 600, h: 1050 }, // Business Card Portrait

	// ID Badge (4.0" x 3.0" = 1200 x 900 px)
	{ w: 1200, h: 900 }, // ID Badge Landscape
	{ w: 900, h: 1200 }, // ID Badge Portrait

	// Mini Card (2.5" x 1.5" = 750 x 450 px)
	{ w: 750, h: 450 }, // Mini Card Landscape
	{ w: 450, h: 750 }, // Mini Card Portrait

	// Jumbo Card (4.25" x 2.75" = 1275 x 825 px)
	{ w: 1275, h: 825 }, // Jumbo Card Landscape
	{ w: 825, h: 1275 } // Jumbo Card Portrait
] as const;

/**
 * Get dynamic rotation speed based on current angle
 * ONLY slow at faces (front 0deg and back 180deg), full speed everywhere else
 */
export function getRotationSpeed(angle: number): number {
	// Normalize angle to 0-2pi range
	const twoPi = Math.PI * 2;
	const normalized = ((angle % twoPi) + twoPi) % twoPi;

	// Convert to degrees for easier reasoning (0-360)
	const degrees = (normalized * 180) / Math.PI;

	// Front face: 0deg (or 360deg), Back face: 180deg
	// Check if we're within FACE_THRESHOLD of either face
	const degreesThreshold = (CARD3D_CONSTANTS.FACE_THRESHOLD * 180) / Math.PI; // 15 degrees

	const nearFront = degrees <= degreesThreshold || degrees >= 360 - degreesThreshold;
	const nearBack = degrees >= 180 - degreesThreshold && degrees <= 180 + degreesThreshold;

	if (nearFront || nearBack) {
		return CARD3D_CONSTANTS.ROTATION_SPEED_FACE;
	}
	return CARD3D_CONSTANTS.ROTATION_SPEED_EDGE;
}

/**
 * Calculate card dimensions in 3D space from pixel dimensions
 */
export function getCardDimensions(w: number, h: number): CardDimensions {
	const aspect = w / h;
	if (aspect >= 1) {
		return { width: CARD3D_CONSTANTS.BASE_SCALE, height: CARD3D_CONSTANTS.BASE_SCALE / aspect };
	} else {
		return { width: CARD3D_CONSTANTS.BASE_SCALE * aspect, height: CARD3D_CONSTANTS.BASE_SCALE };
	}
}

/**
 * Get orientation from morph shape
 */
export function getShapeOrientation(shape: MorphShape): 'landscape' | 'portrait' {
	return shape.w >= shape.h ? 'landscape' : 'portrait';
}

/**
 * Lerp helper for smooth interpolation
 */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}
