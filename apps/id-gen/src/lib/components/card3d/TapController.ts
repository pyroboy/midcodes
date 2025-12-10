/**
 * TapController - handles tap nudge effect at pressure point
 * Quick nudge that stacks briefly with rapid taps, then decays fast
 */

import type { WobbleOffsets } from './AnimationController';

/**
 * Tap wobble state
 */
export interface TapWobbleState {
	active: boolean;
	progress: number;
	// Tap position in local card coords (-1 to 1 range)
	tapX: number;
	tapY: number;
	// Accumulated pressure (stacks with rapid taps, decays fast)
	pressure: number;
	// Current nudge intensity
	intensity: number;
	// Linger duration
	linger: number;
}

/**
 * Initialize tap nudge from a tap event
 * Only stacks if tapping in quick succession (within 500ms)
 */
export function initTapWobble(
	tapX: number,
	tapY: number,
	currentPressure: number,
	baseStrength: number,
	linger: number,
	lastTapTime: number = 0
): TapWobbleState {
	const now = performance.now();
	const timeSinceLastTap = now - lastTapTime;
	
	// Only stack if tapping within 700ms of last tap, otherwise reset to 1
	const stackWindow = 700; // ms
	let pressure: number;
	if (timeSinceLastTap < stackWindow && currentPressure > 0) {
		// Quick succession - stack pressure (cap at 5)
		pressure = Math.min(currentPressure + 1, 5);
	} else {
		// Too slow or first tap - reset to 1
		pressure = 1;
	}
	
	// Semi-exponential intensity: 3° -> 6° -> 12° -> 24° -> 48°
	const baseDegreesRad = 0.052; // 3 degrees in radians
	const intensity = baseDegreesRad * Math.pow(2, pressure - 1);
	
	return {
		active: true,
		progress: 0,
		tapX,
		tapY,
		pressure,
		intensity,
		linger
	};
}

/**
 * Calculate nudge offsets - quick push IN at tap point
 * Fast attack, medium decay - like physically tapping the card
 */
export function updateTapWobble(state: TapWobbleState): {
	offsets: WobbleOffsets;
	newProgress: number;
	complete: boolean;
	newPressure: number;
} {
	if (!state.active) {
		return {
			offsets: { x: 0, y: 0, z: 0 },
			newProgress: 0,
			complete: false,
			newPressure: state.pressure
		};
	}
	
	const currentProgress = state.progress;
	
	// Quick attack, medium sustain nudge shape
	// Fast exponential decay for snappy feel
	const decayFactor = Math.exp(-4 * currentProgress);
	
	// Nudge: Card pushed IN at tap point
	// Tap Left (X<0) -> Tilt Clockwise (RotY < 0) -> Positive correlation
	// Tap Right (X>0) -> Tilt Counter-Clockwise (RotY > 0) -> Positive correlation
	const pushY = state.tapX * state.intensity * decayFactor * 1.5; // Positive sign
	
	// Tap Bottom (Y<0) -> Tilt Down (RotX > 0) -> Negative correlation
	// Tap Top (Y>0) -> Tilt Up (RotX < 0) -> Negative correlation
	const pushX = -state.tapY * state.intensity * decayFactor * 0.4;
	
	// Very subtle bounce
	const bounce = Math.sin(currentProgress * 2 * Math.PI) * decayFactor * 0.1;
	
	// Fast progress for quick nudge (complete in ~0.3 seconds at 60fps)
	const wobbleSpeed = 0.04;
	const newProgress = currentProgress + wobbleSpeed;
	
	const complete = newProgress >= 1;
	
	// Visual decay: pressure slowly decreases per frame for visible bar animation
	// 0.05 per frame = faster decay (approx 1.6 sec to clear max pressure)
	const newPressure = Math.max(0, state.pressure - 0.05);
	
	return {
		offsets: complete ? { x: 0, y: 0, z: 0 } : {
			x: pushX + bounce * state.intensity * 0.2, // Pitch (Rotation X)
			y: pushY,                                  // Yaw (Rotation Y) - PRIMARY AXIS
			z: bounce * state.intensity * 0.05         // Roll (Rotation Z) - Minimal
		},
		newProgress: complete ? 0 : newProgress,
		complete,
		newPressure
	};
}

/**
 * Convert UV coordinates (0-1) to local card coordinates (-1 to 1)
 */
export function uvToLocalCoords(u: number, v: number): { x: number; y: number } {
	// UV origin is typically bottom-left, convert to centered coords
	return {
		x: (u - 0.5) * 2, // -1 (left) to 1 (right)
		y: (v - 0.5) * 2  // -1 (bottom) to 1 (top)
	};
}

