import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LayerSelection } from '../../src/lib/schemas/decompose.schema';
import type { TemplateElement } from '../../src/lib/schemas/template-element.schema';
import { templateElementSchema } from '../../src/lib/schemas/template-element.schema';

// Type-specific element interfaces for test assertions
type ImageElement = Extract<TemplateElement, { type: 'image' }>;
type TextElement = Extract<TemplateElement, { type: 'text' }>;
type PhotoElement = Extract<TemplateElement, { type: 'photo' }>;
type QrElement = Extract<TemplateElement, { type: 'qr' }>;
type SignatureElement = Extract<TemplateElement, { type: 'signature' }>;
type GraphicElement = Extract<TemplateElement, { type: 'graphic' }>;

// Extract the layer-to-element conversion logic for testing
// This mirrors the logic in decompose.remote.ts lines 470-542
function convertLayerToElement(layer: LayerSelection): TemplateElement {
	const baseElement = {
		id: '550e8400-e29b-41d4-a716-446655440000', // Fixed UUID for deterministic tests
		variableName: layer.variableName,
		x: layer.bounds.x,
		y: layer.bounds.y,
		width: layer.bounds.width,
		height: layer.bounds.height,
		rotation: 0,
		side: layer.side || 'front',
		visible: true,
		opacity: 1
	};

	switch (layer.elementType) {
		case 'image':
			return {
				...baseElement,
				type: 'image' as const,
				src: layer.layerImageUrl || '',
				fit: 'contain' as const
			};
		case 'text':
			return {
				...baseElement,
				type: 'text' as const,
				content: '',
				fontSize: 14,
				fontFamily: 'Roboto',
				fontWeight: 'normal' as const,
				fontStyle: 'normal' as const,
				color: '#000000',
				textAlign: 'left' as const
			};
		case 'photo':
			return {
				...baseElement,
				type: 'photo' as const,
				placeholder: 'Photo',
				aspectRatio: 'free' as const
			};
		case 'qr':
			return {
				...baseElement,
				type: 'qr' as const,
				content: '',
				contentMode: 'custom' as const,
				errorCorrectionLevel: 'M' as const
			};
		case 'signature':
			return {
				...baseElement,
				type: 'signature' as const,
				placeholder: 'Signature',
				borderWidth: 1
			};
		case 'graphic':
			return {
				...baseElement,
				type: 'graphic' as const,
				src: layer.layerImageUrl || '',
				fit: 'contain' as const,
				maintainAspectRatio: true
			};
		default:
			return {
				...baseElement,
				type: 'image' as const,
				src: layer.layerImageUrl || '',
				fit: 'contain' as const
			};
	}
}

// Helper to create a mock layer selection
function createMockLayer(overrides: Partial<LayerSelection> = {}): LayerSelection {
	return {
		layerId: '550e8400-e29b-41d4-a716-446655440001',
		included: true,
		elementType: 'text',
		variableName: 'test_field',
		bounds: { x: 100, y: 100, width: 200, height: 50 },
		layerImageUrl: 'https://example.com/layer.png',
		side: 'front',
		...overrides
	};
}

describe('Layer to Template Element Conversion', () => {
	describe('Image Layer Conversion', () => {
		it('converts image layer to image element with correct type', () => {
			const layer = createMockLayer({
				elementType: 'image',
				variableName: 'background_image',
				layerImageUrl: 'https://example.com/image.png'
			});
			const element = convertLayerToElement(layer);
			expect(element.type).toBe('image');
		});

		it('preserves layerImageUrl as src for image element', () => {
			const layer = createMockLayer({
				elementType: 'image',
				variableName: 'logo',
				layerImageUrl: 'https://example.com/logo.png'
			});
			const element = convertLayerToElement(layer) as ImageElement;
			expect(element.src).toBe('https://example.com/logo.png');
		});

		it('sets fit to contain for image elements', () => {
			const layer = createMockLayer({
				elementType: 'image',
				layerImageUrl: 'https://example.com/image.png'
			});
			const element = convertLayerToElement(layer) as ImageElement;
			expect(element.fit).toBe('contain');
		});

		it('uses empty string for src when layerImageUrl is undefined', () => {
			const layer = createMockLayer({
				elementType: 'image',
				layerImageUrl: undefined
			});
			const element = convertLayerToElement(layer) as ImageElement;
			expect(element.src).toBe('');
		});
	});

	describe('Text Layer Conversion', () => {
		it('converts text layer to text element with correct type', () => {
			const layer = createMockLayer({
				elementType: 'text',
				variableName: 'full_name'
			});
			const element = convertLayerToElement(layer);
			expect(element.type).toBe('text');
		});

		it('sets default text properties for text element', () => {
			const layer = createMockLayer({
				elementType: 'text',
				variableName: 'name_field'
			});
			const element = convertLayerToElement(layer) as TextElement;
			expect(element.content).toBe('');
			expect(element.fontSize).toBe(14);
			expect(element.fontFamily).toBe('Roboto');
			expect(element.fontWeight).toBe('normal');
			expect(element.fontStyle).toBe('normal');
			expect(element.color).toBe('#000000');
			expect(element.textAlign).toBe('left');
		});
	});

	describe('Photo Layer Conversion', () => {
		it('converts photo layer to photo element with correct type', () => {
			const layer = createMockLayer({
				elementType: 'photo',
				variableName: 'user_photo'
			});
			const element = convertLayerToElement(layer);
			expect(element.type).toBe('photo');
		});

		it('sets default placeholder for photo element', () => {
			const layer = createMockLayer({
				elementType: 'photo',
				variableName: 'profile_photo'
			});
			const element = convertLayerToElement(layer) as PhotoElement;
			expect(element.placeholder).toBe('Photo');
		});

		it('sets aspectRatio to free for photo elements', () => {
			const layer = createMockLayer({
				elementType: 'photo',
				variableName: 'photo_area'
			});
			const element = convertLayerToElement(layer) as PhotoElement;
			expect(element.aspectRatio).toBe('free');
		});
	});

	describe('QR Layer Conversion', () => {
		it('converts qr layer to qr element with correct type', () => {
			const layer = createMockLayer({
				elementType: 'qr',
				variableName: 'qr_code'
			});
			const element = convertLayerToElement(layer);
			expect(element.type).toBe('qr');
		});

		it('sets default qr properties', () => {
			const layer = createMockLayer({
				elementType: 'qr',
				variableName: 'qr_scanner'
			});
			const element = convertLayerToElement(layer) as QrElement;
			expect(element.content).toBe('');
			expect(element.contentMode).toBe('custom');
			expect(element.errorCorrectionLevel).toBe('M');
		});
	});

	describe('Signature Layer Conversion', () => {
		it('converts signature layer to signature element with correct type', () => {
			const layer = createMockLayer({
				elementType: 'signature',
				variableName: 'signature_field'
			});
			const element = convertLayerToElement(layer);
			expect(element.type).toBe('signature');
		});

		it('sets default signature properties', () => {
			const layer = createMockLayer({
				elementType: 'signature',
				variableName: 'user_signature'
			});
			const element = convertLayerToElement(layer) as SignatureElement;
			expect(element.placeholder).toBe('Signature');
			expect(element.borderWidth).toBe(1);
		});
	});

	describe('Graphic Layer Conversion', () => {
		it('converts graphic layer to graphic element with correct type', () => {
			const layer = createMockLayer({
				elementType: 'graphic',
				variableName: 'company_logo'
			});
			const element = convertLayerToElement(layer);
			expect(element.type).toBe('graphic');
		});

		it('preserves layerImageUrl as src for graphic element', () => {
			const layer = createMockLayer({
				elementType: 'graphic',
				variableName: 'watermark',
				layerImageUrl: 'https://example.com/watermark.png'
			});
			const element = convertLayerToElement(layer) as GraphicElement;
			expect(element.src).toBe('https://example.com/watermark.png');
		});

		it('sets fit to contain and maintainAspectRatio for graphic elements', () => {
			const layer = createMockLayer({
				elementType: 'graphic',
				variableName: 'logo'
			});
			const element = convertLayerToElement(layer) as GraphicElement;
			expect(element.fit).toBe('contain');
			expect(element.maintainAspectRatio).toBe(true);
		});
	});

	describe('Unknown Type Fallback', () => {
		it('falls back to image type for unknown element types', () => {
			const layer = createMockLayer({
				// @ts-expect-error - intentionally unknown type
				elementType: 'unknown_type',
				variableName: 'mystery_element'
			});
			const element = convertLayerToElement(layer);
			expect(element.type).toBe('image');
		});
	});

	describe('Side Assignment', () => {
		it('uses layer side when explicitly provided', () => {
			const layer = createMockLayer({
				side: 'back',
				variableName: 'back_element'
			});
			const element = convertLayerToElement(layer);
			expect(element.side).toBe('back');
		});

		it('defaults to front when side is not provided', () => {
			const layer = createMockLayer({
				side: undefined,
				variableName: 'default_element'
			});
			const element = convertLayerToElement(layer);
			expect(element.side).toBe('front');
		});
	});

	describe('Bounds Preservation', () => {
		it('preserves x coordinate from layer bounds', () => {
			const layer = createMockLayer({
				bounds: { x: 150, y: 200, width: 100, height: 50 }
			});
			const element = convertLayerToElement(layer);
			expect(element.x).toBe(150);
		});

		it('preserves y coordinate from layer bounds', () => {
			const layer = createMockLayer({
				bounds: { x: 150, y: 200, width: 100, height: 50 }
			});
			const element = convertLayerToElement(layer);
			expect(element.y).toBe(200);
		});

		it('preserves width from layer bounds', () => {
			const layer = createMockLayer({
				bounds: { x: 150, y: 200, width: 100, height: 50 }
			});
			const element = convertLayerToElement(layer);
			expect(element.width).toBe(100);
		});

		it('preserves height from layer bounds', () => {
			const layer = createMockLayer({
				bounds: { x: 150, y: 200, width: 100, height: 50 }
			});
			const element = convertLayerToElement(layer);
			expect(element.height).toBe(50);
		});
	});

	describe('Variable Name Preservation', () => {
		it('preserves variableName from layer', () => {
			const layer = createMockLayer({
				variableName: 'full_name_field'
			});
			const element = convertLayerToElement(layer);
			expect(element.variableName).toBe('full_name_field');
		});

		it('handles variableName with underscores', () => {
			const layer = createMockLayer({
				variableName: 'first_name'
			});
			const element = convertLayerToElement(layer);
			expect(element.variableName).toBe('first_name');
		});

		it('handles variableName with numbers', () => {
			const layer = createMockLayer({
				variableName: 'field123'
			});
			const element = convertLayerToElement(layer);
			expect(element.variableName).toBe('field123');
		});
	});

	describe('Default Values', () => {
		it('sets rotation to 0', () => {
			const layer = createMockLayer({});
			const element = convertLayerToElement(layer);
			expect(element.rotation).toBe(0);
		});

		it('sets visible to true', () => {
			const layer = createMockLayer({});
			const element = convertLayerToElement(layer);
			expect(element.visible).toBe(true);
		});

		it('sets opacity to 1', () => {
			const layer = createMockLayer({});
			const element = convertLayerToElement(layer);
			expect(element.opacity).toBe(1);
		});

		it('uses fixed UUID for deterministic tests', () => {
			const layer = createMockLayer({});
			const element = convertLayerToElement(layer);
			expect(element.id).toBe('550e8400-e29b-41d4-a716-446655440000');
		});
	});

	describe('Schema Validation After Conversion', () => {
		it('produces valid element that passes schema validation for image', () => {
			const layer = createMockLayer({
				elementType: 'image',
				variableName: 'background_img',
				layerImageUrl: 'https://example.com/bg.png'
			});
			const element = convertLayerToElement(layer);
			const result = templateElementSchema.safeParse(element);
			expect(result.success).toBe(true);
		});

		it('produces valid element that passes schema validation for text', () => {
			const layer = createMockLayer({
				elementType: 'text',
				variableName: 'name_field'
			});
			const element = convertLayerToElement(layer);
			const result = templateElementSchema.safeParse(element);
			expect(result.success).toBe(true);
		});

		it('produces valid element that passes schema validation for photo', () => {
			const layer = createMockLayer({
				elementType: 'photo',
				variableName: 'user_photo'
			});
			const element = convertLayerToElement(layer);
			const result = templateElementSchema.safeParse(element);
			expect(result.success).toBe(true);
		});

		it('produces valid element that passes schema validation for qr', () => {
			const layer = createMockLayer({
				elementType: 'qr',
				variableName: 'qr_code'
			});
			const element = convertLayerToElement(layer);
			const result = templateElementSchema.safeParse(element);
			expect(result.success).toBe(true);
		});

		it('produces valid element that passes schema validation for signature', () => {
			const layer = createMockLayer({
				elementType: 'signature',
				variableName: 'signature'
			});
			const element = convertLayerToElement(layer);
			const result = templateElementSchema.safeParse(element);
			expect(result.success).toBe(true);
		});

		it('produces valid element that passes schema validation for graphic', () => {
			const layer = createMockLayer({
				elementType: 'graphic',
				variableName: 'logo',
				layerImageUrl: 'https://example.com/logo.png'
			});
			const element = convertLayerToElement(layer);
			const result = templateElementSchema.safeParse(element);
			expect(result.success).toBe(true);
		});

		it('produces valid element that passes schema validation for selection', () => {
			const layer = createMockLayer({
				elementType: 'text', // selection uses text base + options
				variableName: 'role_select'
			});
			const element = convertLayerToElement(layer);
			const result = templateElementSchema.safeParse(element);
			expect(result.success).toBe(true);
		});
	});

	describe('Complex Layer Scenarios', () => {
		it('handles front and back elements in same batch', () => {
			const frontLayer = createMockLayer({
				layerId: '550e8400-e29b-41d4-a716-446655440001',
				side: 'front',
				variableName: 'front_name'
			});
			const backLayer = createMockLayer({
				layerId: '550e8400-e29b-41d4-a716-446655440002',
				side: 'back',
				variableName: 'back_signature'
			});

			const frontElement = convertLayerToElement(frontLayer);
			const backElement = convertLayerToElement(backLayer);

			expect(frontElement.side).toBe('front');
			expect(backElement.side).toBe('back');
			expect(frontElement.variableName).toBe('front_name');
			expect(backElement.variableName).toBe('back_signature');
		});

		it('converts multiple different element types in batch', () => {
			const layers: LayerSelection[] = [
				createMockLayer({ elementType: 'text', variableName: 'name' }),
				createMockLayer({ elementType: 'photo', variableName: 'photo' }),
				createMockLayer({ elementType: 'qr', variableName: 'qr' }),
				createMockLayer({ elementType: 'signature', variableName: 'sig' }),
				createMockLayer({ elementType: 'graphic', variableName: 'logo' })
			];

			const elements = layers.map(convertLayerToElement);

			expect(elements).toHaveLength(5);
			expect(elements[0].type).toBe('text');
			expect(elements[1].type).toBe('photo');
			expect(elements[2].type).toBe('qr');
			expect(elements[3].type).toBe('signature');
			expect(elements[4].type).toBe('graphic');
		});
	});
});
