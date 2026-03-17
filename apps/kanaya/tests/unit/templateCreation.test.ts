import { describe, it, expect } from 'vitest';
import {
	templateCreationInputSchema,
	templateElementSchema,
	templateUpdateDataSchema,
	imageUploadSchema
} from '$lib/schemas';
import { templateData } from '$lib/stores/templateStore';
import { get } from 'svelte/store';

describe('Template Creation Schema Validation', () => {
	it('should validate correct template creation data', () => {
		const validData = {
			name: 'Employee ID Card',
			description: 'Standard employee identification card',
			width_pixels: 1013,
			height_pixels: 638,
			dpi: 300
		};

		const result = templateCreationInputSchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe('Employee ID Card');
			expect(result.data.width_pixels).toBe(1013);
			expect(result.data.dpi).toBe(300);
		}
	});

	it('should reject invalid template creation data', () => {
		const invalidData = {
			name: '', // Empty name
			width_pixels: 50, // Below min 100
			height_pixels: 9000, // Above max 7200
			dpi: 50 // Below min 72
		};

		const result = templateCreationInputSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		if (!result.success) {
			const issues = result.error.issues;
			expect(issues.some((issue) => issue.path.includes('name'))).toBe(true);
			expect(issues.some((issue) => issue.path.includes('width_pixels'))).toBe(true);
			expect(issues.some((issue) => issue.path.includes('height_pixels'))).toBe(true);
			expect(issues.some((issue) => issue.path.includes('dpi'))).toBe(true);
		}
	});

	it('should apply default DPI value when not provided', () => {
		const dataWithoutDPI = {
			name: 'Test Template',
			width_pixels: 1013,
			height_pixels: 638
		};
		const result = templateCreationInputSchema.safeParse(dataWithoutDPI);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.dpi).toBe(300);
		}
	});

	it('should reject dimensions just outside boundaries', () => {
		const belowMin = {
			name: 'Too Small',
			width_pixels: 99,
			height_pixels: 638,
			dpi: 300
		};
		const aboveMax = {
			name: 'Too Big',
			width_pixels: 1013,
			height_pixels: 7201,
			dpi: 300
		};
		expect(templateCreationInputSchema.safeParse(belowMin).success).toBe(false);
		expect(templateCreationInputSchema.safeParse(aboveMax).success).toBe(false);
	});

	it('should reject invalid dpi values', () => {
		const invalidDpi = {
			name: 'Invalid DPI',
			width_pixels: 1013,
			height_pixels: 638,
			dpi: 601 // max is 600
		};
		expect(templateCreationInputSchema.safeParse(invalidDpi).success).toBe(false);
	});

	it('should handle long but valid names', () => {
		const longNameData = {
			name: 'a'.repeat(100),
			width_pixels: 1013,
			height_pixels: 638,
			dpi: 300
		};
		const result = templateCreationInputSchema.safeParse(longNameData);
		expect(result.success).toBe(true);
	});
});

describe('Template Element Schema Validation', () => {
	it('should validate correct template element data', () => {
		const validElement = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			type: 'text',
			x: 50,
			y: 100,
			width: 200,
			height: 30,
			content: 'Employee Name',
			variableName: 'employeeName',
			fontSize: 14,
			fontFamily: 'Arial',
			color: '#000000',
			side: 'front'
		};

		const result = templateElementSchema.safeParse(validElement);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe('text');
			expect(result.data.variableName).toBe('employeeName');
			expect(result.data.side).toBe('front');
		}
	});

	it('should reject element with invalid type', () => {
		const invalidElement = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			type: 'invalid-type',
			x: 0,
			y: 0,
			width: 100,
			height: 50,
			variableName: 'test',
			side: 'front'
		};

		const result = templateElementSchema.safeParse(invalidElement);
		expect(result.success).toBe(false);
	});

	it('should reject element with negative dimensions', () => {
		const invalidElement = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			type: 'text',
			x: -10,
			y: 0,
			width: 0,
			height: -5,
			variableName: 'test',
			side: 'front'
		};

		const result = templateElementSchema.safeParse(invalidElement);
		expect(result.success).toBe(false);
	});

	it('should validate a complete QR element', () => {
		const qrElement = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567891',
			type: 'qr',
			x: 10,
			y: 10,
			width: 50,
			height: 50,
			variableName: 'qr_code',
			side: 'back',
			content: 'https://example.com'
		};
		const result = templateElementSchema.safeParse(qrElement);
		expect(result.success).toBe(true);
	});

	it('should validate a photo element with specific aspect ratio', () => {
		const photoElement = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567892',
			type: 'photo',
			x: 20,
			y: 20,
			width: 150,
			height: 200,
			variableName: 'user_photo',
			side: 'front',
			aspectRatio: 'portrait'
		};
		const result = templateElementSchema.safeParse(photoElement);
		expect(result.success).toBe(true);
	});

	it('should validate a signature element', () => {
		const signatureElement = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567893',
			type: 'signature',
			x: 30,
			y: 30,
			width: 200,
			height: 50,
			variableName: 'user_signature',
			side: 'back'
		};
		const result = templateElementSchema.safeParse(signatureElement);
		expect(result.success).toBe(true);
	});

	it('should validate a selection element with options', () => {
		const selectionElement = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567894',
			type: 'selection',
			x: 40,
			y: 40,
			width: 250,
			height: 40,
			variableName: 'department',
			side: 'front',
			options: ['HR', 'Engineering', 'Sales']
		};
		const result = templateElementSchema.safeParse(selectionElement);
		expect(result.success).toBe(true);
	});

	it('should reject an element with an invalid variableName', () => {
		const invalidElement = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567895',
			type: 'text',
			x: 0,
			y: 0,
			width: 100,
			height: 50,
			variableName: '1_invalid_start',
			side: 'front'
		};
		const result = templateElementSchema.safeParse(invalidElement);
		expect(result.success).toBe(false);
	});

	it('should reject an element with an invalid color string', () => {
		const invalidElement = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567896',
			type: 'text',
			x: 0,
			y: 0,
			width: 100,
			height: 50,
			variableName: 'colored_text',
			side: 'front',
			color: 'invalid-color'
		};
		const result = templateElementSchema.safeParse(invalidElement);
		expect(result.success).toBe(false);
	});
});

describe('Template Store Management', () => {
	it('should initialize with default values', () => {
		const initialState = get(templateData);

		expect(initialState.id).toBe('');
		expect(initialState.name).toBe('');
		expect(initialState.orientation).toBe('landscape');
		expect(initialState.template_elements).toEqual([]);
		expect(initialState.width_inches).toBe(3.375);
		expect(initialState.height_inches).toBe(2.125);
		expect(initialState.dpi).toBe(300);
		expect(initialState.width_pixels).toBe(1013);
		expect(initialState.height_pixels).toBe(638);
	});

	it('should select template data correctly', () => {
		const testTemplate = {
			id: 'test-123',
			user_id: 'user-456',
			name: 'Test Template',
			front_background: 'front.jpg',
			back_background: 'back.jpg',
			orientation: 'portrait' as const,
			template_elements: [],
			created_at: '2024-08-20T10:00:00Z',
			org_id: 'org-789',
			width_inches: 4,
			height_inches: 6,
			dpi: 150,
			width_pixels: 600,
			height_pixels: 900
		};

		templateData.select(testTemplate);
		const currentState = get(templateData);

		expect(currentState.id).toBe('test-123');
		expect(currentState.name).toBe('Test Template');
		expect(currentState.orientation).toBe('portrait');
		expect(currentState.width_inches).toBe(4);
		expect(currentState.height_inches).toBe(6);
		expect(currentState.dpi).toBe(150);
	});

	it('should reset to default state', () => {
		// First modify the store
		templateData.select({
			id: 'modified',
			user_id: 'user',
			name: 'Modified Template',
			front_background: '',
			back_background: '',
			orientation: 'portrait' as const,
			template_elements: [],
			created_at: '2024-08-20T10:00:00Z',
			org_id: 'org',
			width_inches: 3.375,
			height_inches: 2.125,
			dpi: 300,
			width_pixels: 1013,
			height_pixels: 638
		});

		// Then reset
		templateData.reset();
		const resetState = get(templateData);

		expect(resetState.id).toBe('');
		expect(resetState.name).toBe('');
		expect(resetState.orientation).toBe('landscape');
		expect(resetState.width_inches).toBe(3.375);
		expect(resetState.height_inches).toBe(2.125);
		expect(resetState.dpi).toBe(300);
	});
});

describe('Template Update Schema Validation', () => {
	it('should validate complete template update data', () => {
		const validUpdateData = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			name: 'Updated Employee Card',
			description: 'Updated description',
			width_pixels: 1050,
			height_pixels: 660,
			dpi: 300,
			template_elements: [
				{
					id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
					type: 'text',
					x: 10,
					y: 20,
					width: 100,
					height: 30,
					variableName: 'name',
					side: 'front'
				}
			]
		};

		const result = templateUpdateDataSchema.safeParse(validUpdateData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe('Updated Employee Card');
			expect(result.data.width_pixels).toBe(1050);
			expect(result.data.template_elements).toHaveLength(1);
		}
	});

	it('should reject invalid URL formats', () => {
		const invalidUpdateData = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			user_id: 'user-123',
			name: 'Test Template',
			org_id: 'org-456',
			front_background: 'not-a-url',
			back_background: 'also-not-a-url',
			orientation: 'landscape' as const,
			template_elements: [],
			created_at: '2024-08-20T10:00:00Z',
			width_inches: 3,
			height_inches: 2,
			dpi: 300
		};

		const result = templateUpdateDataSchema.safeParse(invalidUpdateData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((issue) => issue.path.includes('front_background'))).toBe(
				true
			);
			expect(result.error.issues.some((issue) => issue.path.includes('back_background'))).toBe(
				true
			);
		}
	});

	it('should allow partial updates, e.g., only changing the name', () => {
		const partialUpdate = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			name: 'A New Name'
		};
		const result = templateUpdateDataSchema.partial().safeParse(partialUpdate);
		expect(result.success).toBe(true);
	});

	it('should correctly update orientation', () => {
		const orientationUpdate = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			orientation: 'portrait' as const
		};
		const result = templateUpdateDataSchema.partial().safeParse(orientationUpdate);
		expect(result.success).toBe(true);
	});

	it('should accept an empty template_elements array', () => {
		const emptyElementsUpdate = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			template_elements: []
		};
		const result = templateUpdateDataSchema.partial().safeParse(emptyElementsUpdate);
		expect(result.success).toBe(true);
	});

	it('should reject an invalid org_id UUID', () => {
		const invalidOrgId = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			org_id: 'not-a-uuid'
		};
		const result = templateUpdateDataSchema.partial().safeParse(invalidOrgId);
		expect(result.success).toBe(false);
	});

	it('should reject an invalid datetime string for updated_at', () => {
		const invalidDate = {
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			updated_at: 'not-a-date'
		};
		const result = templateUpdateDataSchema.partial().safeParse(invalidDate);
		expect(result.success).toBe(false);
	});

	it('should reject invalid UUID format', () => {
		const invalidUUIDData = {
			id: 'not-a-uuid',
			user_id: 'user-123',
			name: 'Test Template',
			org_id: 'org-456',
			front_background: 'https://example.com/front.jpg',
			back_background: 'https://example.com/back.jpg',
			orientation: 'portrait' as const,
			template_elements: [],
			created_at: '2024-08-20T10:00:00Z',
			width_inches: 3,
			height_inches: 2,
			dpi: 300
		};

		const result = templateUpdateDataSchema.safeParse(invalidUUIDData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((issue) => issue.path.includes('id'))).toBe(true);
		}
	});
});

describe('Image Upload Schema Validation', () => {
	it('should validate correct image upload data', () => {
		const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
		const validUploadData = {
			file: mockFile,
			side: 'front',
			expectedWidth: 1013,
			expectedHeight: 638
		};

		const result = imageUploadSchema.safeParse(validUploadData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.file).toBeInstanceOf(File);
			expect(result.data.side).toBe('front');
			expect(result.data.expectedWidth).toBe(1013);
			expect(result.data.expectedHeight).toBe(638);
		}
	});

	it('should reject invalid side value', () => {
		const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
		const invalidUploadData = {
			file: mockFile,
			side: 'middle', // Invalid side
			expectedWidth: 100,
			expectedHeight: 100
		};

		const result = imageUploadSchema.safeParse(invalidUploadData);
		expect(result.success).toBe(false);
	});

	it('should reject negative dimensions', () => {
		const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
		const invalidUploadData = {
			file: mockFile,
			side: 'back',
			expectedWidth: -100,
			expectedHeight: 0
		};

		const result = imageUploadSchema.safeParse(invalidUploadData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((issue) => issue.path.includes('expectedWidth'))).toBe(true);
			expect(result.error.issues.some((issue) => issue.path.includes('expectedHeight'))).toBe(true);
		}
	});

	it('should reject non-File objects', () => {
		const invalidUploadData = {
			file: 'not-a-file',
			side: 'front',
			expectedWidth: 100,
			expectedHeight: 100
		};

		const result = imageUploadSchema.safeParse(invalidUploadData);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((issue) => issue.path.includes('file'))).toBe(true);
		}
	});

	it('should handle uppercase file extensions', () => {
		const upperExtFile = new File(['test'], 'test.JPG', { type: 'image/jpeg' });
		const result = imageUploadSchema.safeParse({
			file: upperExtFile,
			side: 'front',
			expectedWidth: 100,
			expectedHeight: 100
		});
		expect(result.success).toBe(true);
	});

	it('should validate side as back', () => {
		const backFile = new File(['test'], 'back.png', { type: 'image/png' });
		const result = imageUploadSchema.safeParse({
			file: backFile,
			side: 'back',
			expectedWidth: 100,
			expectedHeight: 100
		});
		expect(result.success).toBe(true);
	});

	it('should validate with minimum dimensions', () => {
		const minDimFile = new File(['test'], 'min.png', { type: 'image/png' });
		const result = imageUploadSchema.safeParse({
			file: minDimFile,
			side: 'front',
			expectedWidth: 1,
			expectedHeight: 1
		});
		expect(result.success).toBe(true);
	});

	it('should handle a very long filename', () => {
		const longFileName = 'a'.repeat(255) + '.jpg';
		const longFile = new File(['test'], longFileName, { type: 'image/jpeg' });
		const result = imageUploadSchema.safeParse({
			file: longFile,
			side: 'front',
			expectedWidth: 100,
			expectedHeight: 100
		});
		expect(result.success).toBe(true);
	});
});
