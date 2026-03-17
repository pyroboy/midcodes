/**
 * LanyardPhysics.ts - Simple pendulum physics for lanyard swing
 *
 * Simulates a pendulum-like motion for the lanyard attached to the ID card.
 * Uses a simplified physics model: damped harmonic oscillator.
 */

export interface LanyardState {
	angle: number; // Current rotation angle (radians)
	angularVelocity: number; // Angular velocity (rad/s)
}

export interface LanyardConfig {
	gravity: number; // Gravity constant
	damping: number; // Damping factor (0-1, higher = more friction)
	length: number; // Pendulum length (affects period)
	restAngle: number; // Resting angle (usually 0 for vertical hang)
}

/**
 * Default lanyard physics configuration
 */
export const DEFAULT_LANYARD_CONFIG: LanyardConfig = {
	gravity: 9.8,
	damping: 0.95, // High damping for realistic cloth behavior
	length: 1.5,
	restAngle: 0
};

/**
 * Update lanyard physics state
 * Uses simplified pendulum equation: θ'' = -(g/L) * sin(θ)
 */
export function updateLanyardPhysics(
	state: LanyardState,
	config: LanyardConfig,
	deltaTime: number,
	externalForce: number = 0
): LanyardState {
	const { gravity, damping, length, restAngle } = config;

	// Pendulum acceleration: a = -(g/L) * sin(θ - restAngle)
	const displacement = state.angle - restAngle;
	const acceleration = -(gravity / length) * Math.sin(displacement) + externalForce;

	// Update velocity with damping
	let newVelocity = state.angularVelocity + acceleration * deltaTime;
	newVelocity *= damping;

	// Update angle
	const newAngle = state.angle + newVelocity * deltaTime;

	return {
		angle: newAngle,
		angularVelocity: newVelocity
	};
}

/**
 * Apply an impulse to the lanyard (e.g., from scroll velocity)
 */
export function applyImpulse(state: LanyardState, impulse: number): LanyardState {
	return {
		angle: state.angle,
		angularVelocity: state.angularVelocity + impulse
	};
}

/**
 * Check if lanyard has settled to rest
 */
export function isLanyardSettled(
	state: LanyardState,
	config: LanyardConfig,
	threshold: number = 0.01
): boolean {
	const displacement = Math.abs(state.angle - config.restAngle);
	const velocityMagnitude = Math.abs(state.angularVelocity);

	return displacement < threshold && velocityMagnitude < threshold;
}

/**
 * Create initial lanyard state
 */
export function createLanyardState(initialAngle: number = 0): LanyardState {
	return {
		angle: initialAngle,
		angularVelocity: 0
	};
}

/**
 * Generate points along the lanyard curve
 * Creates a simple catenary-like curve
 */
export function generateLanyardCurvePoints(
	topAnchor: { x: number; y: number; z: number },
	bottomAnchor: { x: number; y: number; z: number },
	segments: number = 10,
	sag: number = 0.2
): Array<{ x: number; y: number; z: number }> {
	const points: Array<{ x: number; y: number; z: number }> = [];

	for (let i = 0; i <= segments; i++) {
		const t = i / segments;

		// Linear interpolation
		const x = topAnchor.x + (bottomAnchor.x - topAnchor.x) * t;
		const y = topAnchor.y + (bottomAnchor.y - topAnchor.y) * t;
		const z = topAnchor.z + (bottomAnchor.z - topAnchor.z) * t;

		// Add parabolic sag (maximum at middle)
		const sagAmount = sag * 4 * t * (1 - t); // Parabola peaking at t=0.5

		points.push({
			x: x + sagAmount * 0.1, // Slight horizontal sag
			y: y,
			z: z - sagAmount // Sag in Z (toward camera)
		});
	}

	return points;
}
