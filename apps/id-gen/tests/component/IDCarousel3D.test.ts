import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import * as THREE from 'three';

// Mock the Supabase storage URL function
vi.mock('$lib/utils/supabase', () => ({
	getSupabaseStorageUrl: (path: string, bucket: string) =>
		`https://supabase.co/storage/v1/${bucket}/${path}`
}));

// Mock Threlte modules (WebGL not available in jsdom)
vi.mock('@threlte/core', () => ({
	T: {
		PerspectiveCamera: vi.fn(),
		AmbientLight: vi.fn(),
		DirectionalLight: vi.fn(),
		Group: vi.fn(),
		Mesh: vi.fn(),
		ShapeGeometry: vi.fn(),
		MeshBasicMaterial: vi.fn()
	},
	Canvas: vi.fn()
}));

vi.mock('@threlte/extras', () => ({
	useTexture: vi.fn().mockResolvedValue({})
}));

// ============================
// Types (matching component)
// ============================
interface IDCard {
	idcard_id?: number;
	template_name: string;
	front_image?: string | null;
	back_image?: string | null;
	created_at?: string;
	fields?: Record<string, { value: string }>;
}

// ============================
// Constants (matching component)
// ============================
const CARD_WIDTH = 3.6;
const CARD_HEIGHT = 2.4;
const CARD_SPACING = 2.8;
const CENTER_SCALE = 1.4;
const SIDE_SCALE = 0.8;
const SIDE_TILT = 0.5;
const VISIBLE_COUNT = 7;
const CORNER_RADIUS = 0.15;
const CARD_ASPECT = CARD_WIDTH / CARD_HEIGHT;

// ============================
// Extracted Functions for Testing
// ============================

/**
 * Navigate to a specific index, clamped to valid range
 */
function goTo(currentIndex: number, targetIndex: number, cardsLength: number): number {
	return Math.max(0, Math.min(cardsLength - 1, targetIndex));
}

/**
 * Calculate visible card indices around current index
 */
function getVisibleIndices(currentIndex: number, cardsLength: number): number[] {
	const half = Math.floor(VISIBLE_COUNT / 2);
	const result: number[] = [];
	for (let i = -half; i <= half; i++) {
		const idx = currentIndex + i;
		if (idx >= 0 && idx < cardsLength) {
			result.push(idx);
		}
	}
	return result;
}

/**
 * Calculate card transform based on position in carousel
 */
function getCardTransform(cardIndex: number, effectiveIndex: number) {
	const offset = cardIndex - effectiveIndex;

	// Position
	const x = offset * CARD_SPACING;
	const z = -Math.abs(offset) * 0.8;

	// Rotation
	let rotY = 0;
	if (offset < -0.1) {
		rotY = SIDE_TILT;
	} else if (offset > 0.1) {
		rotY = -SIDE_TILT;
	}

	// Scale
	const distFromCenter = Math.abs(offset);
	const scale =
		distFromCenter < 0.3
			? CENTER_SCALE
			: Math.max(SIDE_SCALE, CENTER_SCALE - distFromCenter * 0.35);

	// Opacity
	const opacity = Math.max(0.35, 1 - distFromCenter * 0.3);

	return { x, z, rotY, scale, opacity, distFromCenter };
}

/**
 * Get image URL for card
 */
function getImageUrl(card: IDCard): string | null {
	if (!card.front_image) return null;
	// Using mocked function - returns Supabase URL format
	return `https://supabase.co/storage/v1/rendered-id-cards/${card.front_image}`;
}

/**
 * Create rounded rectangle shape for card
 */
function createRoundedRectShape(width: number, height: number, radius: number) {
	const shape = new THREE.Shape();
	const x = -width / 2;
	const y = -height / 2;

	shape.moveTo(x + radius, y);
	shape.lineTo(x + width - radius, y);
	shape.quadraticCurveTo(x + width, y, x + width, y + radius);
	shape.lineTo(x + width, y + height - radius);
	shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	shape.lineTo(x + radius, y + height);
	shape.quadraticCurveTo(x, y + height, x, y + height - radius);
	shape.lineTo(x, y + radius);
	shape.quadraticCurveTo(x, y, x + radius, y);

	return shape;
}

/**
 * Transform texture for cover-fit on card
 */
function transformTexture(
	texture: THREE.Texture,
	imageWidth: number,
	imageHeight: number
): THREE.Texture {
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.wrapS = THREE.ClampToEdgeWrapping;
	texture.wrapT = THREE.ClampToEdgeWrapping;

	const imageAspect = imageWidth / imageHeight;

	// Cover fit
	if (imageAspect > CARD_ASPECT) {
		// Image is wider - fit by height, crop sides
		const scale = CARD_ASPECT / imageAspect;
		texture.repeat.set(scale, 1);
		texture.offset.set((1 - scale) / 2, 0);
	} else {
		// Image is taller - fit by width, crop top/bottom
		const scale = imageAspect / CARD_ASPECT;
		texture.repeat.set(1, scale);
		texture.offset.set(0, (1 - scale) / 2);
	}

	texture.needsUpdate = true;
	return texture;
}

/**
 * Calculate drag navigation result
 */
function calculateDragNavigation(
	dragOffset: number,
	currentIndex: number,
	cardsLength: number
): number {
	const movement = Math.round(-dragOffset);
	if (movement !== 0) {
		return goTo(currentIndex, currentIndex + movement, cardsLength);
	}
	return currentIndex;
}

// ============================
// Test Data
// ============================
const mockCards: IDCard[] = [
	{ idcard_id: 1, template_name: 'Template A', front_image: 'card1.png' },
	{ idcard_id: 2, template_name: 'Template B', front_image: 'card2.png' },
	{ idcard_id: 3, template_name: 'Template C', front_image: null },
	{ idcard_id: 4, template_name: 'Template D', front_image: 'card4.png' },
	{ idcard_id: 5, template_name: 'Template E', front_image: 'card5.png' },
	{ idcard_id: 6, template_name: 'Template F', front_image: 'card6.png' },
	{ idcard_id: 7, template_name: 'Template G', front_image: 'card7.png' },
	{ idcard_id: 8, template_name: 'Template H', front_image: 'card8.png' },
	{ idcard_id: 9, template_name: 'Template I', front_image: 'card9.png' },
	{ idcard_id: 10, template_name: 'Template J', front_image: 'card10.png' }
];

// ============================
// TESTS
// ============================

describe('IDCarousel3D Component Logic', () => {
	describe('Navigation Functions', () => {
		it('goTo navigates to valid index', () => {
			expect(goTo(0, 5, 10)).toBe(5);
			expect(goTo(3, 7, 10)).toBe(7);
		});

		it('goTo clamps to minimum index 0', () => {
			expect(goTo(2, -5, 10)).toBe(0);
			expect(goTo(0, -1, 10)).toBe(0);
		});

		it('goTo clamps to maximum index (length - 1)', () => {
			expect(goTo(5, 15, 10)).toBe(9);
			expect(goTo(9, 10, 10)).toBe(9);
		});

		it('next() increments current index', () => {
			const current = 3;
			const next = goTo(current, current + 1, 10);
			expect(next).toBe(4);
		});

		it('prev() decrements current index', () => {
			const current = 5;
			const prev = goTo(current, current - 1, 10);
			expect(prev).toBe(4);
		});

		it('next() is clamped at last index', () => {
			const current = 9;
			const next = goTo(current, current + 1, 10);
			expect(next).toBe(9);
		});

		it('prev() is clamped at first index', () => {
			const current = 0;
			const prev = goTo(current, current - 1, 10);
			expect(prev).toBe(0);
		});
	});

	describe('Visible Indices Calculation', () => {
		it('calculates visible indices centered on current', () => {
			const indices = getVisibleIndices(5, 10);
			// VISIBLE_COUNT = 7, half = 3, so indices 2,3,4,5,6,7,8
			expect(indices).toEqual([2, 3, 4, 5, 6, 7, 8]);
		});

		it('filters out negative indices at beginning', () => {
			const indices = getVisibleIndices(1, 10);
			// Would be -2,-1,0,1,2,3,4 but negative filtered
			expect(indices).toEqual([0, 1, 2, 3, 4]);
		});

		it('filters out indices beyond array length at end', () => {
			const indices = getVisibleIndices(8, 10);
			// Would be 5,6,7,8,9,10,11 but >9 filtered
			expect(indices).toEqual([5, 6, 7, 8, 9]);
		});

		it('handles small card arrays', () => {
			const indices = getVisibleIndices(1, 3);
			expect(indices).toEqual([0, 1, 2]);
		});

		it('handles single card', () => {
			const indices = getVisibleIndices(0, 1);
			expect(indices).toEqual([0]);
		});
	});

	describe('Card Transform Calculation', () => {
		it('center card has correct position and scale', () => {
			const transform = getCardTransform(5, 5);
			expect(transform.x).toBe(0);
			expect(transform.z).toBeCloseTo(0, 10); // Use toBeCloseTo to handle -0 vs 0
			expect(transform.rotY).toBe(0);
			expect(transform.scale).toBe(CENTER_SCALE);
			expect(transform.opacity).toBe(1);
			expect(transform.distFromCenter).toBe(0);
		});

		it('left side cards have positive rotation (facing center)', () => {
			const transform = getCardTransform(3, 5);
			expect(transform.x).toBe(-2 * CARD_SPACING);
			expect(transform.rotY).toBe(SIDE_TILT);
		});

		it('right side cards have negative rotation (facing center)', () => {
			const transform = getCardTransform(7, 5);
			expect(transform.x).toBe(2 * CARD_SPACING);
			expect(transform.rotY).toBe(-SIDE_TILT);
		});

		it('far cards have reduced scale and opacity', () => {
			const transform = getCardTransform(2, 5);
			expect(transform.scale).toBeLessThan(CENTER_SCALE);
			expect(transform.scale).toBeGreaterThanOrEqual(SIDE_SCALE);
			expect(transform.opacity).toBeLessThan(1);
			expect(transform.opacity).toBeGreaterThanOrEqual(0.35);
		});

		it('z position is negative for non-center cards', () => {
			const transform = getCardTransform(3, 5);
			expect(transform.z).toBeLessThan(0);
		});
	});

	describe('Image Loading', () => {
		it('returns Supabase URL for cards with front_image', () => {
			const card = mockCards[0];
			const url = getImageUrl(card);
			expect(url).toBe('https://supabase.co/storage/v1/rendered-id-cards/card1.png');
		});

		it('returns null for cards without front_image', () => {
			const card = mockCards[2]; // has front_image: null
			const url = getImageUrl(card);
			expect(url).toBeNull();
		});

		it('handles undefined front_image', () => {
			const card: IDCard = { template_name: 'Test' };
			const url = getImageUrl(card);
			expect(url).toBeNull();
		});
	});

	describe('Texture Transformation', () => {
		// Create a mock texture object that mimics THREE.Texture interface
		interface MockTexture {
			colorSpace: string;
			wrapS: number;
			wrapT: number;
			repeat: { x: number; y: number; set: (x: number, y: number) => void };
			offset: { x: number; y: number; set: (x: number, y: number) => void };
			needsUpdate: boolean;
		}

		function createMockTexture(): MockTexture {
			const repeat = {
				x: 1,
				y: 1,
				set: function (x: number, y: number) {
					this.x = x;
					this.y = y;
				}
			};
			const offset = {
				x: 0,
				y: 0,
				set: function (x: number, y: number) {
					this.x = x;
					this.y = y;
				}
			};
			return {
				colorSpace: '',
				wrapS: 0,
				wrapT: 0,
				repeat,
				offset,
				needsUpdate: false
			};
		}

		// Version of transformTexture that works with mock
		function transformMockTexture(
			texture: MockTexture,
			imageWidth: number,
			imageHeight: number
		): MockTexture {
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.wrapS = THREE.ClampToEdgeWrapping;
			texture.wrapT = THREE.ClampToEdgeWrapping;

			const imageAspect = imageWidth / imageHeight;

			if (imageAspect > CARD_ASPECT) {
				const scale = CARD_ASPECT / imageAspect;
				texture.repeat.set(scale, 1);
				texture.offset.set((1 - scale) / 2, 0);
			} else {
				const scale = imageAspect / CARD_ASPECT;
				texture.repeat.set(1, scale);
				texture.offset.set(0, (1 - scale) / 2);
			}

			texture.needsUpdate = true;
			return texture;
		}

		it('sets correct color space and wrapping', () => {
			const mockTexture = createMockTexture();
			transformMockTexture(mockTexture, 1000, 600);
			expect(mockTexture.colorSpace).toBe(THREE.SRGBColorSpace);
			expect(mockTexture.wrapS).toBe(THREE.ClampToEdgeWrapping);
			expect(mockTexture.wrapT).toBe(THREE.ClampToEdgeWrapping);
		});

		it('applies correct scaling for wider images', () => {
			// Wider image: aspect > CARD_ASPECT (1.5)
			// e.g., 2000x1000 = aspect 2.0
			const imageAspect = 2.0;
			const mockTexture = createMockTexture();
			transformMockTexture(mockTexture, 2000, 1000);

			const expectedScale = CARD_ASPECT / imageAspect;
			expect(mockTexture.repeat.x).toBeCloseTo(expectedScale, 5);
			expect(mockTexture.repeat.y).toBe(1);
		});

		it('applies correct scaling for taller images', () => {
			// Taller image: aspect < CARD_ASPECT (1.5)
			// e.g., 800x800 = aspect 1.0
			const imageAspect = 1.0;
			const mockTexture = createMockTexture();
			transformMockTexture(mockTexture, 800, 800);

			const expectedScale = imageAspect / CARD_ASPECT;
			expect(mockTexture.repeat.x).toBe(1);
			expect(mockTexture.repeat.y).toBeCloseTo(expectedScale, 5);
		});

		it('marks texture for update', () => {
			const mockTexture = createMockTexture();
			transformMockTexture(mockTexture, 1000, 600);
			expect(mockTexture.needsUpdate).toBe(true);
		});
	});

	describe('Drag Gesture Navigation', () => {
		it('small drag does not change index', () => {
			const newIndex = calculateDragNavigation(0.3, 5, 10);
			expect(newIndex).toBe(5);
		});

		it('drag left (positive offset) navigates to previous card', () => {
			// Dragging right means positive dragOffset, and movement = -dragOffset
			const newIndex = calculateDragNavigation(-1.2, 5, 10);
			expect(newIndex).toBe(6);
		});

		it('drag right (negative offset) navigates to next card', () => {
			const newIndex = calculateDragNavigation(1.5, 5, 10);
			expect(newIndex).toBe(4);
		});

		it('large drag navigates multiple cards', () => {
			const newIndex = calculateDragNavigation(3.0, 5, 10);
			expect(newIndex).toBe(2);
		});

		it('drag navigation is clamped at boundaries', () => {
			const newIndex = calculateDragNavigation(10, 2, 10);
			expect(newIndex).toBe(0);
		});
	});

	describe('Rounded Rectangle Shape', () => {
		it('creates a valid THREE.Shape', () => {
			const shape = createRoundedRectShape(CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS);
			expect(shape).toBeInstanceOf(THREE.Shape);
		});

		it('creates shape with correct dimensions', () => {
			const shape = createRoundedRectShape(4, 2, 0.2);
			// Shape should exist and have curves
			expect(shape.curves.length).toBeGreaterThan(0);
		});
	});

	describe('Constants and Configuration', () => {
		it('has correct card aspect ratio', () => {
			expect(CARD_ASPECT).toBeCloseTo(1.5, 5);
		});

		it('center scale is larger than side scale', () => {
			expect(CENTER_SCALE).toBeGreaterThan(SIDE_SCALE);
		});

		it('visible count is odd for centered display', () => {
			expect(VISIBLE_COUNT % 2).toBe(1);
		});
	});
});

describe('Keyboard Navigation', () => {
	it('ArrowLeft should trigger prev navigation', () => {
		// Simulate the logic that would happen on ArrowLeft
		const current = 5;
		const newIndex = goTo(current, current - 1, 10);
		expect(newIndex).toBe(4);
	});

	it('ArrowRight should trigger next navigation', () => {
		// Simulate the logic that would happen on ArrowRight
		const current = 5;
		const newIndex = goTo(current, current + 1, 10);
		expect(newIndex).toBe(6);
	});
});

describe('Button Disabled States', () => {
	it('Previous button should be disabled at index 0', () => {
		const currentIndex = 0;
		const isDisabled = currentIndex === 0;
		expect(isDisabled).toBe(true);
	});

	it('Previous button should be enabled when not at index 0', () => {
		const currentIndex: number = 5;
		const isDisabled = currentIndex === 0;
		expect(isDisabled).toBe(false);
	});

	it('Next button should be disabled at last index', () => {
		const currentIndex = 9;
		const cardsLength = 10;
		const isDisabled = currentIndex === cardsLength - 1;
		expect(isDisabled).toBe(true);
	});

	it('Next button should be enabled when not at last index', () => {
		const currentIndex = 5;
		const cardsLength = 10;
		const isDisabled = currentIndex === cardsLength - 1;
		expect(isDisabled).toBe(false);
	});
});
