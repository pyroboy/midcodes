/**
 * Card3D module exports
 */

// Types
export type {
	TemplateElementOverlay,
	ShowcaseImage,
	CachedGeometry,
	MorphShape,
	TextureLoadResult,
	PreloadProgress,
	CardDimensions,
	Element3DPosition
} from './types';

// Constants and state
export {
	CARD3D_CONSTANTS,
	MORPH_SHAPES,
	getRotationSpeed,
	getCardDimensions,
	getShapeOrientation,
	lerp
} from './card3d-state.svelte';

// Texture management
export { TextureManager } from './TextureManager';

// Animation controller
export {
	updateSpinAnimation,
	initWobble,
	updateWobble,
	updateOscillation,
	triggerTemplateChangeSpin,
	triggerBeatSpin
} from './AnimationController';
export type { SpinState, WobbleState, WobbleOffsets } from './AnimationController';

// Beat controller
export {
	checkBeat,
	getBeatAction,
	isShapeBeat,
	isSpinBeat,
	getNextShapeIndex,
	getNextShowcaseIndex
} from './BeatController';
export type { BeatAction, BeatCheckResult } from './BeatController';

// Overlay helpers
export {
	elementTo3D,
	getElementColor,
	getFontUrl,
	randomChar,
	generateRandomText,
	mutateText,
	createTextAnimationManager
} from './overlay-helpers';

// Tap controller
export { initTapWobble, updateTapWobble, uvToLocalCoords } from './TapController';
export type { TapWobbleState } from './TapController';
