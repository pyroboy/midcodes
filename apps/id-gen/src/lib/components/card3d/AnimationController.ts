/**
 * AnimationController - handles spin and wobble animation calculations
 * Extracted from TemplateCard3D.svelte for better organization
 */

import { CARD3D_CONSTANTS } from './card3d-state.svelte';

/**
 * Spin animation state
 */
export interface SpinState {
	active: boolean;
	progress: number;
	target: number;
	startRotation: number;
	finalAngle: number;
}

/**
 * Wobble animation state
 */
export interface WobbleState {
	active: boolean;
	progress: number;
	intensity: number;      // Initial umph/strength
	oscillations: number;   // Number of wobble oscillations
	effectiveLinger: number;
	spinDirection: number;
	phaseX: number;
	phaseY: number;
	phaseZ: number;
	// Initial offsets at progress=0 (for seamless spin->wobble transition)
	initialOffsets: WobbleOffsets;
}

/**
 * Wobble offset result
 */
export interface WobbleOffsets {
	x: number;
	y: number;
	z: number;
}

/**
 * Update spin animation progress
 * Returns the new rotation Y and whether spin is complete
 */
export function updateSpinAnimation(
	spinProgress: number,
	spinTarget: number,
	spinStartRotation: number,
	spinSpeed: number = CARD3D_CONSTANTS.SPIN_SPEED
): { rotationY: number; complete: boolean; newProgress: number } {
	const newProgress = spinProgress + spinSpeed;
	
	if (newProgress >= 1) {
		return {
			rotationY: 0, // Will be set to finalAngle by caller
			complete: true,
			newProgress: 0
		};
	}
	
	// Ease-out cubic: 1 - (1-t)^3
	const easeOut = 1 - Math.pow(1 - newProgress, 3);
	const rotationDelta = spinTarget - spinStartRotation;
	const rotationY = spinStartRotation + rotationDelta * easeOut;
	
	return {
		rotationY,
		complete: false,
		newProgress
	};
}

/**
 * Initialize wobble effect after spin completes
 * @param spinSpeed - Speed of the spin (affects momentum/overshoot)
 * @param wobbleStrength - Initial intensity (umph) of the first oscillation
 * @param wobbleOscillations - Number of wobble oscillations
 * @param wobbleLinger - Duration multiplier (higher = longer wobble)
 */
export function initWobble(
	spinTarget: number,
	spinStartRotation: number,
	spinSpeed: number,
	wobbleStrength: number,
	wobbleOscillations: number,
	wobbleLinger: number
): WobbleState {
	// Capture spin direction for wobble (positive = clockwise, negative = counter-clockwise)
	const spinDirection = spinTarget > spinStartRotation ? 1 : -1;
	
	// Momentum multiplier: faster spin = more energy = more overshoot
	// wobbleStrength is base tilt, momentum scales it based on spin speed
	const momentumMultiplier = (spinSpeed / 0.04) * 2.5;
	const effectiveIntensity = wobbleStrength * momentumMultiplier;
	
	// Bias phases to favor spin direction (momentum effect)
	const phaseX = Math.random() * Math.PI * 0.5;
	const phaseY = Math.random() * Math.PI * 0.5;
	const phaseZ = Math.random() * Math.PI * 0.5;
	
	// Calculate initial offsets - MUST match multipliers used in updateWobble
	// X: subtle (0.3x), Y: main rotation axis (1x), Z: medium (0.5x)
	const initialOffsets: WobbleOffsets = {
		x: effectiveIntensity * Math.sin(phaseX) * 0.3,
		y: effectiveIntensity * Math.sin(phaseY) * spinDirection,
		z: effectiveIntensity * Math.sin(phaseZ) * spinDirection * 0.5
	};

	
	return {
		active: true,
		progress: 0,
		intensity: effectiveIntensity, // Store effective intensity for updateWobble
		oscillations: wobbleOscillations,
		effectiveLinger: wobbleLinger,
		spinDirection,
		phaseX,
		phaseY,
		phaseZ,
		initialOffsets
	};
}




/**
 * Update wobble animation
 * Returns new offsets and updated state
 */
export function updateWobble(state: WobbleState): {
	offsets: WobbleOffsets;
	newProgress: number;
	complete: boolean;
} {
	if (!state.active) {
		return {
			offsets: { x: 0, y: 0, z: 0 },
			newProgress: 0,
			complete: false
		};
	}
	
	// Calculate offsets using CURRENT progress first (before advancing)
	// This ensures first frame matches initial offsets exactly
	const currentProgress = state.progress;
	
	// Ease-out exponential decay: e^(-5*t) for strong start, slow decay
	const decayFactor = Math.exp(-5 * currentProgress);
	
	// Use oscillations as frequency (number of wobbles)
	const freq = state.oscillations;
	const wobbleX = Math.sin(currentProgress * freq * Math.PI * 2 + state.phaseX);
	const wobbleY = Math.sin(currentProgress * (freq * 0.7) * Math.PI * 2 + state.phaseY) * state.spinDirection;
	const wobbleZ = Math.sin(currentProgress * (freq * 1.3) * Math.PI * 2 + state.phaseZ);
	
	// Then advance progress for next frame
	// Linger controls duration: higher value = slower progress = longer wobble
	const wobbleSpeed = 0.01 / state.effectiveLinger;
	const newProgress = currentProgress + wobbleSpeed;
	
	const complete = newProgress >= 1;
	
	// Apply intensity and decay - MUST match multipliers used in initialOffsets
	// X: subtle (0.3x), Y: main rotation axis (1x), Z: medium (0.5x)
	return {
		offsets: complete ? { x: 0, y: 0, z: 0 } : {
			x: state.intensity * wobbleX * decayFactor * 0.3,
			y: state.intensity * wobbleY * decayFactor,
			z: state.intensity * wobbleZ * decayFactor * 0.5
		},
		newProgress: complete ? 0 : newProgress,
		complete
	};
}


/**
 * Update oscillation animation
 */
export function updateOscillation(oscillateTime: number): {
	newTime: number;
	tiltX: number;
} {
	const newTime = oscillateTime + CARD3D_CONSTANTS.OSCILLATE_SPEED;
	const tiltX = CARD3D_CONSTANTS.BASE_TILT_X + Math.sin(newTime) * CARD3D_CONSTANTS.OSCILLATE_AMPLITUDE;
	return { newTime, tiltX };
}

/**
 * Trigger a template change spin
 */
export function triggerTemplateChangeSpin(currentRotationY: number): {
	spinTarget: number;
	finalAngle: number;
} {
	// Generate random angle within ±30° of front-facing (0°)
	const randomOffset = (Math.random() - 0.5) * 2 * CARD3D_CONSTANTS.FRONT_FACING_TOLERANCE;
	// Single half rotation (180°) - briefly show back, then land on front
	const halfSpin = Math.PI;
	
	return {
		spinTarget: currentRotationY + halfSpin,
		finalAngle: randomOffset
	};
}

/**
 * Trigger a beat spin (180 degree rotation)
 */
export function triggerBeatSpin(currentRotationY: number): {
	spinTarget: number;
	spinStartRotation: number;
	finalAngle: number;
} {
	const halfRotation = Math.PI;
	const targetRotation = Math.ceil(currentRotationY / halfRotation) * halfRotation + halfRotation;
	
	return {
		spinTarget: targetRotation,
		spinStartRotation: currentRotationY,
		finalAngle: targetRotation
	};
}
