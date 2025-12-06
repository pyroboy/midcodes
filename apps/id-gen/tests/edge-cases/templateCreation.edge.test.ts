import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	templateCreationInputSchema,
	templateCreationDataSchema,
	dpiSchema,
	pixelDimensionSchema,
	type TemplateCreationInput,
	type TemplateCreationData
} from '$lib/schemas/template-creation.schema';

describe('Template Creation Edge Cases', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Boundary Value Edge Cases', () => {
		it('should handle exact minimum values', () => {
			const minimalTemplate: TemplateCreationInput = {
				name: 'A', // Single character name
				width_pixels: 100, // Minimum width
				height_pixels: 100, // Minimum height
				dpi: 72 // Minimum DPI
			};

			const result = templateCreationInputSchema.safeParse(minimalTemplate);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toBe('A');
				expect(result.data.width_pixels).toBe(100);
				expect(result.data.height_pixels).toBe(100);
				expect(result.data.dpi).toBe(72);
			}
		});

		it('should handle exact maximum values', () => {
			const maximalTemplate: TemplateCreationInput = {
				name: 'x'.repeat(100), // Maximum name length
				width_pixels: 7200, // Maximum width
				height_pixels: 7200, // Maximum height
				dpi: 600 // Maximum DPI
			};

			const result = templateCreationInputSchema.safeParse(maximalTemplate);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.name).toHaveLength(100);
				expect(result.data.width_pixels).toBe(7200);
				expect(result.data.height_pixels).toBe(7200);
				expect(result.data.dpi).toBe(600);
			}
		});

		it('should reject values just below minimum', () => {
			const belowMinimum = [
				{ name: '', width_pixels: 1013, height_pixels: 638, dpi: 300 }, // Empty name
				{ name: 'Valid', width_pixels: 99, height_pixels: 638, dpi: 300 }, // Width too small
				{ name: 'Valid', width_pixels: 1013, height_pixels: 99, dpi: 300 }, // Height too small
				{ name: 'Valid', width_pixels: 1013, height_pixels: 638, dpi: 71 } // DPI too low
			];

			belowMinimum.forEach((template, index) => {
				const result = templateCreationInputSchema.safeParse(template);
				expect(result.success).toBe(false);
			});
		});

		it('should reject values just above maximum', () => {
			const aboveMaximum = [
				{ name: 'x'.repeat(101), width_pixels: 1013, height_pixels: 638, dpi: 300 }, // Name too long
				{ name: 'Valid', width_pixels: 7201, height_pixels: 638, dpi: 300 }, // Width too large
				{ name: 'Valid', width_pixels: 1013, height_pixels: 7201, dpi: 300 }, // Height too large
				{ name: 'Valid', width_pixels: 1013, height_pixels: 638, dpi: 601 } // DPI too high
			];

			aboveMaximum.forEach((template) => {
				const result = templateCreationInputSchema.safeParse(template);
				expect(result.success).toBe(false);
			});
		});
	});

	describe('Data Type Edge Cases', () => {
		it('should handle floating point precision issues', () => {
			const floatTemplate = {
				name: 'Float Test',
				width_pixels: 100.0000001, // Very small decimal
				height_pixels: 200.9999999, // Nearly integer
				dpi: 300.5 // Half DPI
			};

			const result = templateCreationInputSchema.safeParse(floatTemplate);
			expect(result.success).toBe(false); // Should fail because pixels must be integers
		});

		it('should reject non-numeric dimension values', () => {
			const invalidTypes = [
				{ name: 'Test', width_pixels: '100', height_pixels: 200, dpi: 300 },
				{ name: 'Test', width_pixels: 100, height_pixels: '200', dpi: 300 },
				{ name: 'Test', width_pixels: 100, height_pixels: 200, dpi: '300' },
				{ name: 'Test', width_pixels: null, height_pixels: 200, dpi: 300 },
				{ name: 'Test', width_pixels: undefined, height_pixels: 200, dpi: 300 },
				{ name: 'Test', width_pixels: 100, height_pixels: 200, dpi: NaN },
				{ name: 'Test', width_pixels: Infinity, height_pixels: 200, dpi: 300 },
				{ name: 'Test', width_pixels: 100, height_pixels: -Infinity, dpi: 300 }
			];

			invalidTypes.forEach((template) => {
				const result = templateCreationInputSchema.safeParse(template as any);
				expect(result.success).toBe(false);
			});
		});

		it('should handle special string characters in template name', () => {
			const specialCharNames = [
				'Template with émojis 🎨',
				'Template with "quotes"',
				"Template with 'apostrophes'",
				'Template with <tags>',
				'Template with & ampersands',
				'Template with \\backslashes\\',
				'Template with /forward/slashes/',
				'Template with\nnewlines',
				'Template with\ttabs',
				'Template with\r\ncarriage returns',
				'템플릿 한국어', // Korean characters
				'テンプレート日本語', // Japanese characters
				'Шаблон русский', // Russian characters
				'🎨🖼️📝 Emoji Only Template 📏📐🔧'
			];

			specialCharNames.forEach((name) => {
				if (name.length <= 100) {
					const template = {
						name,
						width_pixels: 1013,
						height_pixels: 638,
						dpi: 300
					};
					const result = templateCreationInputSchema.safeParse(template);
					expect(result.success).toBe(true);
					if (result.success) {
						expect(result.data.name).toBe(name);
					}
				}
			});
		});

		it('should handle whitespace-only names after trimming', () => {
			const whitespaceNames = [
				'   ', // Spaces only - should fail (empty after trim)
				'\t\t\t', // Tabs only - should fail (empty after trim)
				'\n\n\n', // Newlines only - should fail (empty after trim)
				'   \t  \n  ', // Mixed whitespace - should fail (empty after trim)
				' Valid Name ' // Valid with surrounding whitespace - should pass
			];

			whitespaceNames.forEach((name, index) => {
				const template = {
					name,
					width_pixels: 1013,
					height_pixels: 638,
					dpi: 300
				};
				const result = templateCreationInputSchema.safeParse(template);

				if (index < 4) {
					// First 4 are whitespace-only
					expect(result.success).toBe(false); // Empty after trim
				} else {
					// Last one has valid content
					expect(result.success).toBe(true);
					if (result.success) {
						expect(result.data.name).toBe(name.trim());
					}
				}
			});
		});
	});

	describe('Complex Data Structure Edge Cases', () => {
		it('should handle extremely large template elements arrays', () => {
			const massiveElementsArray = Array.from({ length: 10000 }, (_, i) => ({
				id: `element-${i}`,
				type: 'text',
				x: i % 1000,
				y: Math.floor(i / 1000) * 20,
				width: 50,
				height: 15,
				variableName: `var_${i}`,
				side: i % 2 === 0 ? 'front' : 'back',
				content: `Element ${i}`
			}));

			const templateData: TemplateCreationData = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				user_id: '550e8400-e29b-41d4-a716-446655440001',
				org_id: '550e8400-e29b-41d4-a716-446655440002',
				name: 'Massive Elements Template',
				width_pixels: 1013,
				height_pixels: 638,
				dpi: 300,
				template_elements: massiveElementsArray,
				orientation: 'landscape'
			};

			const result = templateCreationDataSchema.safeParse(templateData);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.template_elements).toHaveLength(10000);
			}
		});

		it('should handle deeply nested template element structures', () => {
			const deepNestedElement = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				type: 'complex_nested',
				x: 0,
				y: 0,
				width: 100,
				height: 100,
				variableName: 'nestedElement',
				side: 'front',
				metadata: {
					level1: {
						level2: {
							level3: {
								level4: {
									level5: {
										deepValue: 'Very deeply nested value',
										array: [1, 2, 3, { nested: true }]
									}
								}
							}
						}
					}
				}
			};

			const templateData: TemplateCreationData = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				user_id: '550e8400-e29b-41d4-a716-446655440001',
				org_id: '550e8400-e29b-41d4-a716-446655440002',
				name: 'Deep Nested Template',
				width_pixels: 1013,
				height_pixels: 638,
				dpi: 300,
				template_elements: [deepNestedElement],
				orientation: 'landscape'
			};

			// Should handle any structure since template_elements uses z.any()
			const result = templateCreationDataSchema.safeParse(templateData);
			expect(result.success).toBe(true);
		});

		it('should handle malformed JSON-like structures in elements', () => {
			const malformedElements = [
				null,
				undefined,
				'',
				'not-an-object',
				123,
				true,
				[],
				{ missingRequiredFields: true },
				{ circularRef: {} }
			];

			// Add circular reference
			(malformedElements[malformedElements.length - 1] as any).circularRef.self =
				malformedElements[malformedElements.length - 1];

			const templateData: TemplateCreationData = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				user_id: '550e8400-e29b-41d4-a716-446655440001',
				org_id: '550e8400-e29b-41d4-a716-446655440002',
				name: 'Malformed Elements Template',
				width_pixels: 1013,
				height_pixels: 638,
				dpi: 300,
				template_elements: malformedElements,
				orientation: 'landscape'
			};

			// Should still validate at schema level (validation happens at element level)
			const result = templateCreationDataSchema.safeParse(templateData);
			expect(result.success).toBe(true);
		});
	});

	describe('UUID and DateTime Edge Cases', () => {
		it('should handle various UUID formats', () => {
			const uuidFormats = [
				'550e8400-e29b-41d4-a716-446655440000', // Standard
				'550E8400-E29B-41D4-A716-446655440000', // Uppercase
				'550e8400e29b41d4a716446655440000', // No hyphens - should fail
				'{550e8400-e29b-41d4-a716-446655440000}', // With braces - should fail
				'invalid-uuid-format', // Invalid format
				'', // Empty
				'550e8400-e29b-41d4-a716-44665544000' // Missing character
			];

			uuidFormats.forEach((uuid, index) => {
				const templateData = {
					id: uuid,
					user_id: '550e8400-e29b-41d4-a716-446655440001',
					org_id: '550e8400-e29b-41d4-a716-446655440002',
					name: `UUID Test Template ${index}`,
					width_pixels: 1013,
					height_pixels: 638,
					dpi: 300,
					template_elements: [],
					orientation: 'landscape'
				};

				const result = templateCreationDataSchema.safeParse(templateData);

				if (index === 0 || index === 1) {
					// Valid UUIDs
					expect(result.success).toBe(true);
				} else {
					expect(result.success).toBe(false);
				}
			});
		});

		it('should handle various datetime formats', () => {
			const validDates = [
				'2024-08-20T10:30:00Z', // ISO 8601 UTC
				'2024-08-20T10:30:00.000Z' // With milliseconds
			];

			const invalidDates = [
				'2024-08-20T10:30:00+05:30', // With timezone offset - Zod datetime() might be strict
				'2024-08-20T10:30:00-05:00', // Negative timezone offset
				'2024-08-20 10:30:00', // Without T separator - should fail
				'08/20/2024 10:30:00', // US format - should fail
				'20-08-2024 10:30:00', // European format - should fail
				'invalid-date', // Invalid format
				'2024-13-45T25:70:80Z' // Invalid date values
			];

			// Test valid dates
			validDates.forEach((dateStr, index) => {
				const templateData = {
					id: '550e8400-e29b-41d4-a716-446655440000',
					user_id: '550e8400-e29b-41d4-a716-446655440001',
					org_id: '550e8400-e29b-41d4-a716-446655440002',
					name: `Valid DateTime Test Template ${index}`,
					width_pixels: 1013,
					height_pixels: 638,
					dpi: 300,
					template_elements: [],
					orientation: 'landscape' as const,
					created_at: dateStr
				};

				const result = templateCreationDataSchema.safeParse(templateData);
				expect(result.success).toBe(true);
			});

			// Test invalid dates
			invalidDates.forEach((dateStr, index) => {
				const templateData = {
					id: '550e8400-e29b-41d4-a716-446655440000',
					user_id: '550e8400-e29b-41d4-a716-446655440001',
					org_id: '550e8400-e29b-41d4-a716-446655440002',
					name: `Invalid DateTime Test Template ${index}`,
					width_pixels: 1013,
					height_pixels: 638,
					dpi: 300,
					template_elements: [],
					orientation: 'landscape' as const,
					created_at: dateStr
				};

				const result = templateCreationDataSchema.safeParse(templateData);
				expect(result.success).toBe(false);
			});

			// Test with empty string (should pass since field is optional)
			const templateWithEmptyDate = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				user_id: '550e8400-e29b-41d4-a716-446655440001',
				org_id: '550e8400-e29b-41d4-a716-446655440002',
				name: 'Empty DateTime Test Template',
				width_pixels: 1013,
				height_pixels: 638,
				dpi: 300,
				template_elements: [],
				orientation: 'landscape' as const
				// No created_at field
			};

			const emptyResult = templateCreationDataSchema.safeParse(templateWithEmptyDate);
			expect(emptyResult.success).toBe(true);
		});
	});

	describe('Memory and Performance Edge Cases', () => {
		it('should handle very large string values', () => {
			const hugeString = 'x'.repeat(1000000); // 1MB string

			const templateData = {
				name: hugeString.substring(0, 100), // Truncated to fit validation
				description: hugeString, // This field is optional and not length-limited
				width_pixels: 1013,
				height_pixels: 638,
				dpi: 300
			};

			const result = templateCreationInputSchema.safeParse(templateData);
			expect(result.success).toBe(true);
		});

		it('should handle zero-dimension edge cases', () => {
			const zeroDimensions = [
				{ width_pixels: 0, height_pixels: 638 },
				{ width_pixels: 1013, height_pixels: 0 },
				{ width_pixels: 0, height_pixels: 0 }
			];

			zeroDimensions.forEach((dims) => {
				const template = {
					name: 'Zero Dimension Test',
					...dims,
					dpi: 300
				};

				const result = templateCreationInputSchema.safeParse(template);
				expect(result.success).toBe(false); // Should fail minimum validation
			});
		});

		it('should handle negative dimension values', () => {
			const negativeDimensions = [
				{ width_pixels: -100, height_pixels: 638 },
				{ width_pixels: 1013, height_pixels: -200 },
				{ width_pixels: -100, height_pixels: -200 }
			];

			negativeDimensions.forEach((dims) => {
				const template = {
					name: 'Negative Dimension Test',
					...dims,
					dpi: 300
				};

				const result = templateCreationInputSchema.safeParse(template);
				expect(result.success).toBe(false);
			});
		});
	});

	describe('Orientation and Legacy Field Edge Cases', () => {
		it('should handle all valid orientation values', () => {
			const orientations = ['landscape', 'portrait'];

			orientations.forEach((orientation) => {
				const templateData = {
					id: '550e8400-e29b-41d4-a716-446655440000',
					user_id: '550e8400-e29b-41d4-a716-446655440001',
					org_id: '550e8400-e29b-41d4-a716-446655440002',
					name: `${orientation} Template`,
					width_pixels: 1013,
					height_pixels: 638,
					dpi: 300,
					template_elements: [],
					orientation
				};

				const result = templateCreationDataSchema.safeParse(templateData);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.orientation).toBe(orientation);
				}
			});
		});

		it('should reject invalid orientation values', () => {
			const invalidOrientations = ['vertical', 'horizontal', 'square', '', 123];

			invalidOrientations.forEach((orientation) => {
				const templateData = {
					id: '550e8400-e29b-41d4-a716-446655440000',
					user_id: '550e8400-e29b-41d4-a716-446655440001',
					org_id: '550e8400-e29b-41d4-a716-446655440002',
					name: 'Invalid Orientation Template',
					width_pixels: 1013,
					height_pixels: 638,
					dpi: 300,
					template_elements: [],
					orientation
				};

				const result = templateCreationDataSchema.safeParse(templateData as any);
				if (orientation === null || orientation === undefined) {
					// null/undefined should pass (optional field)
					expect(result.success).toBe(true);
				} else {
					// Invalid string/number values should fail
					expect(result.success).toBe(false);
				}
			});
		});

		it('should handle pixel-only template data correctly', () => {
			const templateDataPixelOnly = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				user_id: '550e8400-e29b-41d4-a716-446655440001',
				org_id: '550e8400-e29b-41d4-a716-446655440002',
				name: 'Pixel Only Template',
				width_pixels: 1013,
				height_pixels: 638,
				dpi: 300,
				template_elements: [],
				orientation: 'landscape'
			};

			const result = templateCreationDataSchema.safeParse(templateDataPixelOnly);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.width_pixels).toBe(1013);
				expect(result.data.height_pixels).toBe(638);
				expect(result.data.dpi).toBe(300);
				expect(result.data.orientation).toBe('landscape');
			}
		});
	});

	describe('Concurrent Modification Edge Cases', () => {
		it('should handle rapid schema validation calls', () => {
			const templateData = {
				name: 'Concurrent Test Template',
				width_pixels: 1013,
				height_pixels: 638,
				dpi: 300
			};

			// Simulate 1000 rapid validation calls
			const validationPromises = Array.from({ length: 1000 }, () =>
				templateCreationInputSchema.safeParse(templateData)
			);

			const results = validationPromises;
			results.forEach((result) => {
				expect(result.success).toBe(true);
			});
		});

		it('should handle template element mutations during validation', () => {
			const mutableElements = [
				{
					id: '550e8400-e29b-41d4-a716-446655440000',
					type: 'text',
					x: 50,
					y: 100,
					width: 200,
					height: 30,
					variableName: 'mutableField',
					side: 'front'
				}
			];

			const templateData = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				user_id: '550e8400-e29b-41d4-a716-446655440001',
				org_id: '550e8400-e29b-41d4-a716-446655440002',
				name: 'Mutable Elements Template',
				width_pixels: 1013,
				height_pixels: 638,
				dpi: 300,
				template_elements: mutableElements,
				orientation: 'landscape'
			};

			// Start validation
			const validationResult = templateCreationDataSchema.safeParse(templateData);

			// Mutate the original array while validation might be happening
			mutableElements[0].x = 999;
			mutableElements.push({
				id: '550e8400-e29b-41d4-a716-446655440001',
				type: 'photo',
				x: 0,
				y: 0,
				width: 100,
				height: 100,
				variableName: 'newPhoto',
				side: 'back'
			} as any);

			// Validation should still succeed with original data
			expect(validationResult.success).toBe(true);
		});
	});
});
