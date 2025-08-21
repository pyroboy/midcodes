import { describe, it, expect, vi } from 'vitest';
import { 
    templateCreationInputSchema, 
    templateCreationDataSchema,
    type TemplateCreationInput,
    type TemplateCreationData 
} from '$lib/schemas/template-creation.schema';

describe('Template Creation API Schema Tests', () => {
    describe('Template Creation Input Validation', () => {
        it('should validate complete template creation input', () => {
            const validInput: TemplateCreationInput = {
                name: 'Valid Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300
            };

            const result = templateCreationInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('Valid Template');
                expect(result.data.width_pixels).toBe(1013);
                expect(result.data.height_pixels).toBe(638);
                expect(result.data.dpi).toBe(300);
            }
        });

        it('should apply default DPI when not provided', () => {
            const inputWithoutDPI = {
                name: 'Template Without DPI',
                width_pixels: 1013,
                height_pixels: 638
            };

            const result = templateCreationInputSchema.safeParse(inputWithoutDPI);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.dpi).toBe(300); // Default DPI
            }
        });

        it('should reject input with missing required fields', () => {
            const incompleteInputs = [
                { width_pixels: 1013, height_pixels: 638, dpi: 300 }, // Missing name
                { name: 'Test', height_pixels: 638, dpi: 300 }, // Missing width_pixels
                { name: 'Test', width_pixels: 1013, dpi: 300 }, // Missing height_pixels
            ];

            incompleteInputs.forEach((input) => {
                const result = templateCreationInputSchema.safeParse(input);
                expect(result.success).toBe(false);
            });
        });
    });

    describe('Template Creation Data Validation', () => {
        const baseTemplateData: TemplateCreationData = {
            id: '550e8400-e29b-41d4-a716-446655440000',
            user_id: '550e8400-e29b-41d4-a716-446655440001',
            org_id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Test Template',
            width_pixels: 1013,
            height_pixels: 638,
            dpi: 300,
            template_elements: [],
            orientation: 'landscape'
        };

        it('should validate complete template data for database insertion', () => {
            const result = templateCreationDataSchema.safeParse(baseTemplateData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(baseTemplateData.id);
                expect(result.data.user_id).toBe(baseTemplateData.user_id);
                expect(result.data.org_id).toBe(baseTemplateData.org_id);
                expect(result.data.name).toBe(baseTemplateData.name);
                expect(result.data.template_elements).toEqual([]);
            }
        });

        it('should validate template data with optional fields', () => {
            const templateWithOptionals: TemplateCreationData = {
                ...baseTemplateData,
                description: 'Template description',
                front_background: 'front-bg.jpg',
                back_background: 'back-bg.jpg',
                created_at: '2024-08-21T10:30:00Z',
                updated_at: '2024-08-21T10:30:00Z'
            };

            const result = templateCreationDataSchema.safeParse(templateWithOptionals);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.description).toBe('Template description');
                expect(result.data.front_background).toBe('front-bg.jpg');
                expect(result.data.back_background).toBe('back-bg.jpg');
            }
        });

        it('should validate template data without optional ID (auto-generated)', () => {
            const templateWithoutId = {
                user_id: '550e8400-e29b-41d4-a716-446655440001',
                org_id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'Auto-ID Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape' as const
            };

            const result = templateCreationDataSchema.safeParse(templateWithoutId);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.user_id).toBe(templateWithoutId.user_id);
                expect(result.data.org_id).toBe(templateWithoutId.org_id);
                expect(result.data.name).toBe(templateWithoutId.name);
            }
        });

        it('should reject template data with invalid UUIDs', () => {
            const invalidUUIDs = [
                { ...baseTemplateData, id: 'invalid-uuid' },
                { ...baseTemplateData, user_id: 'not-a-uuid' },
                { ...baseTemplateData, org_id: '123-456-789' }
            ];

            invalidUUIDs.forEach((templateData) => {
                const result = templateCreationDataSchema.safeParse(templateData);
                expect(result.success).toBe(false);
            });
        });

        it('should reject template data with invalid dimensions', () => {
            const invalidDimensions = [
                { ...baseTemplateData, width_pixels: 50 }, // Below minimum
                { ...baseTemplateData, height_pixels: 8000 }, // Above maximum
                { ...baseTemplateData, dpi: 30 }, // Below minimum DPI
                { ...baseTemplateData, dpi: 700 } // Above maximum DPI
            ];

            invalidDimensions.forEach((templateData) => {
                const result = templateCreationDataSchema.safeParse(templateData);
                expect(result.success).toBe(false);
            });
        });

        it('should validate template data with complex elements array', () => {
            const complexElements = [
                {
                    id: '550e8400-e29b-41d4-a716-446655440010',
                    type: 'text',
                    x: 50,
                    y: 100,
                    width: 200,
                    height: 30,
                    variableName: 'employeeName',
                    side: 'front'
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440011',
                    type: 'photo',
                    x: 300,
                    y: 50,
                    width: 150,
                    height: 200,
                    variableName: 'employeePhoto',
                    side: 'front'
                }
            ];

            const templateWithElements: TemplateCreationData = {
                ...baseTemplateData,
                template_elements: complexElements
            };

            const result = templateCreationDataSchema.safeParse(templateWithElements);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.template_elements).toHaveLength(2);
                expect(Array.isArray(result.data.template_elements)).toBe(true);
            }
        });
    });

    describe('API Workflow Simulation', () => {
        it('should simulate complete template creation workflow', () => {
            // Step 1: Validate user input
            const userInput: TemplateCreationInput = {
                name: 'Employee Badge',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300
            };

            const inputValidation = templateCreationInputSchema.safeParse(userInput);
            expect(inputValidation.success).toBe(true);

            // Step 2: Prepare data for database insertion
            const databaseData: TemplateCreationData = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                user_id: '550e8400-e29b-41d4-a716-446655440001',
                org_id: '550e8400-e29b-41d4-a716-446655440002',
                ...userInput,
                template_elements: [],
                orientation: 'landscape',
                created_at: new Date().toISOString()
            };

            const dataValidation = templateCreationDataSchema.safeParse(databaseData);
            expect(dataValidation.success).toBe(true);

            // Step 3: Validate that all required fields are present
            if (dataValidation.success) {
                const validatedData = dataValidation.data;
                expect(validatedData.id).toBeDefined();
                expect(validatedData.user_id).toBeDefined();
                expect(validatedData.org_id).toBeDefined();
                expect(validatedData.name).toBe(userInput.name);
                expect(validatedData.width_pixels).toBe(userInput.width_pixels);
                expect(validatedData.height_pixels).toBe(userInput.height_pixels);
                expect(validatedData.dpi).toBe(userInput.dpi);
            }
        });

        it('should simulate template update workflow', () => {
            const originalTemplate: TemplateCreationData = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                user_id: '550e8400-e29b-41d4-a716-446655440001',
                org_id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'Original Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape',
                created_at: '2024-08-21T10:00:00Z'
            };

            // Simulate update with new data
            const updateData: TemplateCreationData = {
                ...originalTemplate,
                name: 'Updated Template',
                dpi: 150,
                updated_at: '2024-08-21T11:00:00Z'
            };

            const updateValidation = templateCreationDataSchema.safeParse(updateData);
            expect(updateValidation.success).toBe(true);

            if (updateValidation.success) {
                expect(updateValidation.data.name).toBe('Updated Template');
                expect(updateValidation.data.dpi).toBe(150);
                expect(updateValidation.data.id).toBe(originalTemplate.id);
                expect(updateValidation.data.updated_at).toBe('2024-08-21T11:00:00Z');
            }
        });

        it('should simulate organization scoping validation', () => {
            const orgId1 = '550e8400-e29b-41d4-a716-446655440001';
            const orgId2 = '550e8400-e29b-41d4-a716-446655440002';

            const template1: TemplateCreationData = {
                id: '550e8400-e29b-41d4-a716-446655440010',
                user_id: '550e8400-e29b-41d4-a716-446655440100',
                org_id: orgId1,
                name: 'Org 1 Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            const template2: TemplateCreationData = {
                id: '550e8400-e29b-41d4-a716-446655440011',
                user_id: '550e8400-e29b-41d4-a716-446655440101',
                org_id: orgId2,
                name: 'Org 2 Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            // Both templates should validate independently
            const validation1 = templateCreationDataSchema.safeParse(template1);
            const validation2 = templateCreationDataSchema.safeParse(template2);

            expect(validation1.success).toBe(true);
            expect(validation2.success).toBe(true);

            // Verify organization isolation at schema level
            if (validation1.success && validation2.success) {
                expect(validation1.data.org_id).toBe(orgId1);
                expect(validation2.data.org_id).toBe(orgId2);
                expect(validation1.data.org_id).not.toBe(validation2.data.org_id);
            }
        });
    });
});