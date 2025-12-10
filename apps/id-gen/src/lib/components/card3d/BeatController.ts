/**
 * BeatController - handles showcase beat timing and action decisions
 * Extracted from TemplateCard3D.svelte for better organization
 */

import { CARD3D_CONSTANTS } from './card3d-state.svelte';

/**
 * Beat action types
 */
export type BeatAction = 'texture' | 'shape' | 'spin' | 'none';

/**
 * Result of checking for a beat
 */
export interface BeatCheckResult {
	shouldTrigger: boolean;
	action: BeatAction;
	beatCount: number;
	lastBeatTime: number;
}

/**
 * Check if it's time for a beat and determine action
 */
export function checkBeat(
	now: number,
	lastBeatTime: number,
	beatMs: number,
	currentBeatCount: number
): BeatCheckResult {
	// Check if enough time has passed for a beat
	if (now - lastBeatTime < beatMs) {
		return {
			shouldTrigger: false,
			action: 'none',
			beatCount: currentBeatCount,
			lastBeatTime
		};
	}
	
	const newBeatCount = currentBeatCount + 1;
	const action = getBeatAction(newBeatCount);
	
	return {
		shouldTrigger: true,
		action,
		beatCount: newBeatCount,
		lastBeatTime: now
	};
}

/**
 * Determine beat action based on beat count
 * Pattern:
 * - Every 4th beat: shape change
 * - Every 2nd beat: spin (fast 180° rotation)
 * - Otherwise: texture change
 */
export function getBeatAction(beatCount: number): BeatAction {
	if (isShapeBeat(beatCount)) {
		return 'shape';
	}
	if (isSpinBeat(beatCount)) {
		return 'spin';
	}
	return 'texture';
}

/**
 * Check if this beat should be a shape change
 */
export function isShapeBeat(beatCount: number): boolean {
	return beatCount % CARD3D_CONSTANTS.BEATS_PER_SHAPE_CHANGE === 0;
}

/**
 * Check if this beat should be a spin
 */
export function isSpinBeat(beatCount: number): boolean {
	return beatCount % 2 === 0;
}

/**
 * Get the next valid morph shape index
 */
export function getNextShapeIndex(
	currentValidIndex: number,
	validIndicesCount: number
): number {
	return (currentValidIndex + 1) % validIndicesCount;
}

/**
 * Get the next showcase image index
 */
export function getNextShowcaseIndex(
	currentIndex: number,
	matchingImagesCount: number
): number {
	return (currentIndex + 1) % matchingImagesCount;
}
