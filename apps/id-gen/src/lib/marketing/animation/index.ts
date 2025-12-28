/**
 * Marketing Animation Module
 *
 * Animation utilities for the marketing page 3D card.
 */
export {
	Easing,
	lerp,
	clamp,
	mapRange,
	mapRangeClamped,
	lerpVec3,
	scrollRange,
	scrollPingPong,
	scrollStep,
	SpringPresets,
	updateSpring,
	isSpringSettled,
	type EasingFunction,
	type SpringConfig,
	type SpringState
} from './CardAnimations';

export {
	getSectionCardState,
	getStateTransform,
	getStateVisuals,
	blendTransforms,
	blendVisuals,
	type CardState,
	type CardTransform,
	type CardVisualState
} from './HeroCardStateMachine';
