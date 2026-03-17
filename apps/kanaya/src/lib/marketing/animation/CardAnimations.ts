/**
 * CardAnimations.ts - Easing functions and interpolation helpers
 *
 * Provides smooth animation utilities for the marketing card transitions.
 */

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * Easing functions for smooth animations
 * Based on Robert Penner's easing equations
 */
export const Easing = {
	// Linear (no easing)
	linear: (t: number) => t,

	// Quadratic
	easeInQuad: (t: number) => t * t,
	easeOutQuad: (t: number) => 1 - (1 - t) * (1 - t),
	easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),

	// Cubic
	easeInCubic: (t: number) => t * t * t,
	easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
	easeInOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

	// Exponential
	easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
	easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
	easeInOutExpo: (t: number) =>
		t === 0
			? 0
			: t === 1
				? 1
				: t < 0.5
					? Math.pow(2, 20 * t - 10) / 2
					: (2 - Math.pow(2, -20 * t + 10)) / 2,

	// Elastic (springy)
	easeOutElastic: (t: number) => {
		const c4 = (2 * Math.PI) / 3;
		return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
	},

	// Back (overshoot)
	easeOutBack: (t: number) => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
	},

	// Smooth step (CSS-like)
	smoothStep: (t: number) => t * t * (3 - 2 * t),

	// Smoother step (more gradual)
	smootherStep: (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
} as const;

export type EasingFunction = (t: number) => number;

// ============================================================================
// INTERPOLATION HELPERS
// ============================================================================

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * Map a value from one range to another
 */
export function mapRange(
	value: number,
	inMin: number,
	inMax: number,
	outMin: number,
	outMax: number
): number {
	return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/**
 * Map a value from one range to another with clamping
 */
export function mapRangeClamped(
	value: number,
	inMin: number,
	inMax: number,
	outMin: number,
	outMax: number
): number {
	const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
	return outMin + t * (outMax - outMin);
}

/**
 * Interpolate between two 3D vectors (objects with x, y, z)
 */
export function lerpVec3(
	a: { x: number; y: number; z: number },
	b: { x: number; y: number; z: number },
	t: number
): { x: number; y: number; z: number } {
	return {
		x: lerp(a.x, b.x, t),
		y: lerp(a.y, b.y, t),
		z: lerp(a.z, b.z, t)
	};
}

// ============================================================================
// SCROLL-BASED ANIMATION HELPERS
// ============================================================================

/**
 * Create a range-based animation that triggers within a scroll range
 * Returns 0 before range, 0-1 within range, 1 after range
 */
export function scrollRange(
	progress: number,
	start: number,
	end: number,
	easing: EasingFunction = Easing.smoothStep
): number {
	if (progress <= start) return 0;
	if (progress >= end) return 1;
	const t = (progress - start) / (end - start);
	return easing(t);
}

/**
 * Create a ping-pong animation within a range
 * Goes 0→1→0 within the range
 */
export function scrollPingPong(
	progress: number,
	start: number,
	end: number,
	easing: EasingFunction = Easing.smoothStep
): number {
	if (progress <= start || progress >= end) return 0;

	const mid = (start + end) / 2;
	if (progress < mid) {
		const t = (progress - start) / (mid - start);
		return easing(t);
	} else {
		const t = (end - progress) / (end - mid);
		return easing(t);
	}
}

/**
 * Create a stepped animation (discrete values)
 */
export function scrollStep(progress: number, steps: number[]): number {
	for (let i = steps.length - 1; i >= 0; i--) {
		if (progress >= steps[i]) return i;
	}
	return 0;
}

// ============================================================================
// SPRING PHYSICS
// ============================================================================

export interface SpringConfig {
	stiffness: number; // Higher = faster oscillation
	damping: number; // Higher = less bouncy
	mass: number; // Higher = more momentum
}

export interface SpringState {
	value: number;
	velocity: number;
}

/**
 * Spring presets
 */
export const SpringPresets = {
	gentle: { stiffness: 120, damping: 14, mass: 1 },
	wobbly: { stiffness: 180, damping: 12, mass: 1 },
	stiff: { stiffness: 210, damping: 20, mass: 1 },
	slow: { stiffness: 280, damping: 60, mass: 1 }
} as const;

/**
 * Update spring physics (call each frame)
 */
export function updateSpring(
	state: SpringState,
	target: number,
	config: SpringConfig,
	deltaTime: number
): SpringState {
	const { stiffness, damping, mass } = config;

	// Spring force: F = -kx - cv
	const displacement = state.value - target;
	const springForce = -stiffness * displacement;
	const dampingForce = -damping * state.velocity;

	// Acceleration
	const acceleration = (springForce + dampingForce) / mass;

	// Integrate
	const newVelocity = state.velocity + acceleration * deltaTime;
	const newValue = state.value + newVelocity * deltaTime;

	return {
		value: newValue,
		velocity: newVelocity
	};
}

/**
 * Check if spring has settled (for animation completion)
 */
export function isSpringSettled(state: SpringState, target: number, threshold: number = 0.001): boolean {
	return Math.abs(state.value - target) < threshold && Math.abs(state.velocity) < threshold;
}
