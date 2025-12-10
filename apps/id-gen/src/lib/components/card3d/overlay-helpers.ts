/**
 * Overlay helpers for 3D card element rendering
 * Extracted from TemplateCard3D.svelte
 */

import { getCardDimensions } from './card3d-state.svelte';
import { FONT_CDN_URLS } from '$lib/config/fonts';
import type { TemplateElementOverlay, Element3DPosition } from './types';

/**
 * Characters used for random text animation
 */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Convert element pixel coordinates to 3D world coordinates
 * Card center is (0,0,0), top-left in pixels maps to (-width/2, height/2) in 3D
 */
export function elementTo3D(
	el: TemplateElementOverlay,
	cardW: number,
	cardH: number
): Element3DPosition {
	const dims = getCardDimensions(cardW, cardH);
	// Convert from pixel units to 3D units
	const scaleX = dims.width / cardW;
	const scaleY = dims.height / cardH;

	// Element center in pixels (origin top-left)
	const centerX = el.x + el.width / 2;
	const centerY = el.y + el.height / 2;

	// Convert to 3D coords (origin center, Y inverted)
	const x3d = (centerX - cardW / 2) * scaleX;
	const y3d = (cardH / 2 - centerY) * scaleY;
	const w3d = el.width * scaleX;
	const h3d = el.height * scaleY;

	return { x: x3d, y: y3d, width: w3d, height: h3d };
}

/**
 * Get element color based on type
 */
export function getElementColor(type: string): string {
	switch (type) {
		case 'photo':
			return '#3b82f6'; // blue
		case 'image':
			return '#8b5cf6'; // purple
		case 'text':
			return '#10b981'; // green
		case 'qr':
			return '#f59e0b'; // amber
		case 'signature':
			return '#ec4899'; // pink
		case 'selection':
			return '#06b6d4'; // cyan
		default:
			return '#6b7280'; // gray
	}
}

/**
 * Get font URL for a font family (fallback to Roboto Regular)
 */
export function getFontUrl(
	fontFamily: string,
	fontWeight: string = '400',
	fontStyle: string = 'normal'
): string {
	const defaultFont = FONT_CDN_URLS['Roboto']['400']['normal'];

	if (!fontFamily) return defaultFont;

	// Normalize family (case-insensitive lookup)
	const normalizedFamily = fontFamily.toLowerCase().trim();
	const familyKey =
		Object.keys(FONT_CDN_URLS).find((key) => key.toLowerCase() === normalizedFamily) || 'Roboto';

	// Normalize weight (map 'bold' to '700', default to '400')
	const weightKey = fontWeight === 'bold' || parseInt(fontWeight) >= 600 ? '700' : '400';

	// Normalize style
	const styleKey = fontStyle === 'italic' ? 'italic' : 'normal';

	// Traverse map safely with fallbacks
	try {
		const familyObj = FONT_CDN_URLS[familyKey];
		if (!familyObj) return defaultFont;

		const weightObj = familyObj[weightKey] || familyObj['400'];
		if (!weightObj) return defaultFont;

		return weightObj[styleKey] || weightObj['normal'] || defaultFont;
	} catch {
		return defaultFont;
	}
}

/**
 * Generate random character
 */
export function randomChar(): string {
	return CHARS.charAt(Math.floor(Math.random() * CHARS.length));
}

/**
 * Generate initial random string of 8-12 characters
 */
export function generateRandomText(): string {
	const length = Math.floor(Math.random() * 5) + 8; // 8 to 12 chars
	let result = '';
	for (let i = 0; i < length; i++) {
		result += randomChar();
	}
	return result;
}

/**
 * Mutate 1-3 random characters in the string (per-character animation)
 */
export function mutateText(text: string): string {
	const chars = text.split('');
	const mutationCount = Math.floor(Math.random() * 3) + 1; // 1-3 chars
	for (let i = 0; i < mutationCount; i++) {
		const pos = Math.floor(Math.random() * chars.length);
		chars[pos] = randomChar();
	}
	return chars.join('');
}

/**
 * Create a text animation manager for caching animated texts per element
 */
export function createTextAnimationManager() {
	const animatedTexts = new Map<number, string>();

	return {
		/**
		 * Get animated text for element (cached per element index)
		 */
		get(idx: number): string {
			if (!animatedTexts.has(idx)) {
				animatedTexts.set(idx, generateRandomText());
			}
			return animatedTexts.get(idx) || '';
		},

		/**
		 * Mutate all texts (1-3 characters change per text)
		 */
		mutateAll(): Map<number, string> {
			const newTexts = new Map<number, string>();
			animatedTexts.forEach((text, key) => {
				newTexts.set(key, mutateText(text));
			});
			// Update internal state
			newTexts.forEach((text, key) => animatedTexts.set(key, text));
			return new Map(animatedTexts);
		},

		/**
		 * Clear all cached texts
		 */
		clear(): void {
			animatedTexts.clear();
		},

		/**
		 * Get all texts as a new Map (for Svelte reactivity)
		 */
		getAll(): Map<number, string> {
			return new Map(animatedTexts);
		}
	};
}
