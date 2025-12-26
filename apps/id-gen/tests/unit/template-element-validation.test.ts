import { describe, it, expect } from 'vitest';
import {
	templateElementSchema,
	textElementSchema,
	imageElementSchema,
	qrElementSchema,
	photoElementSchema,
	signatureElementSchema,
	selectionElementSchema,
	graphicElementSchema
} from '../../src/lib/schemas/template-element.schema';
import type { TemplateElement } from '../../src/lib/schemas/template-element.schema';

// Type-specific element interfaces for test assertions
type TextElement = Extract<TemplateElement, { type: 'text' }>;
type ImageElement = Extract<TemplateElement, { type: 'image' }>;
type QrElement = Extract<TemplateElement, { type: 'qr' }>;
type PhotoElement = Extract<TemplateElement, { type: 'photo' }>;
type SignatureElement = Extract<TemplateElement, { type: 'signature' }>;
type SelectionElement = Extract<TemplateElement, { type: 'selection' }>;
type GraphicElement = Extract<TemplateElement, { type: 'graphic' }>;

// Helper to create a valid base element - returns unknown to allow flexible test inputs
function createBaseElement(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: '550e8400-e29b-41d4-a716-446655440000',
		type: 'text',
		x: 100,
		y: 100,
		width: 200,
		height: 50,
		rotation: 0,
		side: 'front',
		variableName: 'test_field',
		visible: true,
		opacity: 1,
		...overrides
	};
}

describe('templateElementSchema Validation', () => {
	describe('Valid Element Types', () => {
		it('validates a valid text element', () => {
			const textElement = createBaseElement({
				type: 'text',
				content: 'Hello World',
				fontSize: 16,
				fontFamily: 'Roboto',
				fontWeight: 'normal',
				color: '#000000'
			});
			const result = templateElementSchema.safeParse(textElement);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.type).toBe('text');
				expect((result.data as TextElement).content).toBe('Hello World');
			}
		});

		it('validates a valid image element', () => {
			const imageElement = createBaseElement({
				type: 'image',
				src: 'https://example.com/image.png',
				alt: 'Test image',
				fit: 'contain'
			});
			const result = templateElementSchema.safeParse(imageElement);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.type).toBe('image');
				expect((result.data as ImageElement).src).toBe('https://example.com/image.png');
			}
		});

		it('validates a valid qr element', () => {
			const qrElement = createBaseElement({
				type: 'qr',
				content: 'https://example.com',
				contentMode: 'custom',
				errorCorrectionLevel: 'M',
				foregroundColor: '#000000',
				backgroundColor: '#ffffff'
			});
			const result = templateElementSchema.safeParse(qrElement);
			expect(result.success).toBe(true);
			if (result.success) {
				const data = result.data as QrElement;
				expect(data.type).toBe('qr');
				expect(data.contentMode).toBe('custom');
				expect(data.errorCorrectionLevel).toBe('M');
			}
		});

		it('validates a valid photo element', () => {
			const photoElement = createBaseElement({
				type: 'photo',
				placeholder: 'Upload Photo',
				aspectRatio: 'free',
				borderRadius: 4
			});
			const result = templateElementSchema.safeParse(photoElement);
			expect(result.success).toBe(true);
			if (result.success) {
				const data = result.data as PhotoElement;
				expect(data.type).toBe('photo');
				expect(data.placeholder).toBe('Upload Photo');
				expect(data.aspectRatio).toBe('free');
			}
		});

		it('validates a valid signature element', () => {
			const signatureElement = createBaseElement({
				type: 'signature',
				placeholder: 'Sign Here',
				borderColor: '#000000',
				borderWidth: 1
			});
			const result = templateElementSchema.safeParse(signatureElement);
			expect(result.success).toBe(true);
			if (result.success) {
				const data = result.data as SignatureElement;
				expect(data.type).toBe('signature');
				expect(data.placeholder).toBe('Sign Here');
				expect(data.borderWidth).toBe(1);
			}
		});

		it('validates a valid selection element', () => {
			const selectionElement = createBaseElement({
				type: 'selection',
				options: ['Option A', 'Option B', 'Option C'],
				defaultValue: 'Option A',
				multiple: false
			});
			const result = templateElementSchema.safeParse(selectionElement);
			expect(result.success).toBe(true);
			if (result.success) {
				const data = result.data as SelectionElement;
				expect(data.type).toBe('selection');
				expect(data.options).toEqual(['Option A', 'Option B', 'Option C']);
			}
		});

		it('validates a valid graphic element', () => {
			const graphicElement = createBaseElement({
				type: 'graphic',
				src: 'https://example.com/logo.png',
				fit: 'contain',
				maintainAspectRatio: true
			});
			const result = templateElementSchema.safeParse(graphicElement);
			expect(result.success).toBe(true);
			if (result.success) {
				const data = result.data as GraphicElement;
				expect(data.type).toBe('graphic');
				expect(data.src).toBe('https://example.com/logo.png');
				expect(data.maintainAspectRatio).toBe(true);
			}
		});
	});

	describe('Invalid Type Detection', () => {
		it('rejects element with unknown type', () => {
			const invalidElement = createBaseElement({
				type: 'unknown_type'
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});
	});

	describe('Required Field Validation', () => {
		it('rejects element without UUID id', () => {
			const invalidElement = createBaseElement();
			delete invalidElement.id;
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects element with invalid UUID format', () => {
			const invalidElement = createBaseElement({
				id: 'not-a-valid-uuid'
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects element without variableName', () => {
			const invalidElement = createBaseElement();
			delete invalidElement.variableName;
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});
	});

	describe('Variable Name Validation', () => {
		it('rejects variableName with special characters', () => {
			const invalidElement = createBaseElement({
				variableName: 'field-name!' // Hyphen and exclamation not allowed
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects variableName starting with number', () => {
			const invalidElement = createBaseElement({
				variableName: '123field'
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('accepts valid variableName with underscores', () => {
			const validElement = createBaseElement({
				variableName: 'first_name'
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('accepts variableName with letters and numbers', () => {
			const validElement = createBaseElement({
				variableName: 'field123'
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});
	});

	describe('Position and Dimension Validation', () => {
		it('rejects negative x position', () => {
			const invalidElement = createBaseElement({
				x: -10
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects negative y position', () => {
			const invalidElement = createBaseElement({
				y: -10
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects zero width', () => {
			const invalidElement = createBaseElement({
				width: 0
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects zero height', () => {
			const invalidElement = createBaseElement({
				height: 0
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects negative width', () => {
			const invalidElement = createBaseElement({
				width: -100
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});
	});

	describe('Color Validation', () => {
		it('accepts valid hex color (6 digits)', () => {
			const validElement = createBaseElement({
				color: '#FF5500'
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('accepts valid hex color (3 digits)', () => {
			const validElement = createBaseElement({
				color: '#F50'
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('accepts valid rgb color', () => {
			const validElement = createBaseElement({
				color: 'rgb(255, 85, 0)'
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('accepts valid rgba color', () => {
			const validElement = createBaseElement({
				color: 'rgba(255, 85, 0, 0.5)'
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('accepts named color', () => {
			const validElement = createBaseElement({
				color: 'red'
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('rejects invalid color format', () => {
			const invalidElement = createBaseElement({
				color: 'not-a-color'
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});
	});

	describe('URL Validation', () => {
		it('rejects invalid URL for image src', () => {
			const invalidElement = createBaseElement({
				type: 'image',
				src: 'not-a-url'
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('accepts valid HTTPS URL', () => {
			const validElement = createBaseElement({
				type: 'image',
				src: 'https://cdn.example.com/image.png'
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});
	});

	describe('Rotation Validation', () => {
		it('accepts rotation of 0', () => {
			const validElement = createBaseElement({
				rotation: 0
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('accepts rotation of 180', () => {
			const validElement = createBaseElement({
				rotation: 180
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('accepts rotation of -180', () => {
			const validElement = createBaseElement({
				rotation: -180
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('rejects rotation greater than 180', () => {
			const invalidElement = createBaseElement({
				rotation: 181
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects rotation less than -180', () => {
			const invalidElement = createBaseElement({
				rotation: -181
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});
	});

	describe('Opacity Validation', () => {
		it('accepts opacity of 1', () => {
			const validElement = createBaseElement({
				opacity: 1
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('accepts opacity of 0', () => {
			const validElement = createBaseElement({
				opacity: 0
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('rejects opacity greater than 1', () => {
			const invalidElement = createBaseElement({
				opacity: 1.5
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects negative opacity', () => {
			const invalidElement = createBaseElement({
				opacity: -0.5
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});
	});

	describe('Side Validation', () => {
		it('accepts side of front', () => {
			const validElement = createBaseElement({
				side: 'front'
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('accepts side of back', () => {
			const validElement = createBaseElement({
				side: 'back'
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('rejects invalid side value', () => {
			const invalidElement = createBaseElement({
				side: 'invalid'
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});
	});

	describe('Selection Element Specific Validation', () => {
		it('rejects selection element without options', () => {
			const invalidElement = createBaseElement({
				type: 'selection'
				// options is missing
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects selection element with empty options', () => {
			const invalidElement = createBaseElement({
				type: 'selection',
				options: []
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('accepts selection element with at least one option', () => {
			const validElement = createBaseElement({
				type: 'selection',
				options: ['Option A']
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});
	});

	describe('Text Element Specific Validation', () => {
		it('accepts valid font size (1-200)', () => {
			const validElement = createBaseElement({
				type: 'text',
				fontSize: 16
			});
			const result = templateElementSchema.safeParse(validElement);
			expect(result.success).toBe(true);
		});

		it('rejects font size less than 1', () => {
			const invalidElement = createBaseElement({
				type: 'text',
				fontSize: 0
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('rejects font size greater than 200', () => {
			const invalidElement = createBaseElement({
				type: 'text',
				fontSize: 201
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});

		it('accepts valid font weight values', () => {
			const validWeights = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
			for (const weight of validWeights) {
				const validElement = createBaseElement({
					type: 'text',
					fontWeight: weight as any
				});
				const result = templateElementSchema.safeParse(validElement);
				expect(result.success).toBe(true);
			}
		});

		it('rejects invalid font weight', () => {
			const invalidElement = createBaseElement({
				type: 'text',
				fontWeight: 'extra-bold' as any
			});
			const result = templateElementSchema.safeParse(invalidElement);
			expect(result.success).toBe(false);
		});
	});
});
