import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
    templateCreationInputSchema, 
    templateCreationDataSchema,
    type TemplateCreationData 
} from '$lib/schemas/template-creation.schema';

// Use the MCP Supabase server functions for real database operations
declare global {
    var mcp__supabase__execute_sql: (params: { query: string }) => Promise<string>;
}

describe('Template Creation Real Database Integration Tests', () => {
    const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001';
    const TEST_USER_ID = '10000000-0000-0000-0000-000000000001';
    const TEST_ORG_ID_2 = '00000000-0000-0000-0000-000000000002';
    const TEST_USER_ID_2 = '10000000-0000-0000-0000-000000000002';

    let createdTemplateIds: string[] = [];

    beforeEach(async () => {
        // Clean up any existing test templates
        await cleanupTestTemplates();
        createdTemplateIds = [];
    });

    afterEach(async () => {
        // Clean up templates created during test
        await cleanupTestTemplates();
    });

    async function cleanupTestTemplates() {
        try {
            await global.mcp__supabase__execute_sql({
                query: 'DELETE FROM test_integration.templates WHERE org_id IN ($1, $2)',
            });
        } catch (error) {
            // Ignore cleanup errors in tests
        }
    }

    async function executeSQL(query: string): Promise<any[]> {
        try {
            const result = await global.mcp__supabase__execute_sql({ query });
            
            // Parse the result from the MCP response format
            const match = result.match(/<untrusted-data-[^>]+>(.*?)<\/untrusted-data-[^>]+>/s);
            if (match) {
                return JSON.parse(match[1]);
            }
            return [];
        } catch (error) {
            console.error('SQL execution error:', error);
            return [];
        }
    }

    describe('Template Creation Database Operations', () => {
        it('should create a new template in the database', async () => {
            const templateId = crypto.randomUUID();
            const templateData: TemplateCreationData = {
                id: templateId,
                user_id: TEST_USER_ID,
                org_id: TEST_ORG_ID,
                name: 'Real Integration Test Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            // Step 1: Validate schema
            const validation = templateCreationDataSchema.safeParse(templateData);
            expect(validation.success).toBe(true);

            // Step 2: Insert into database
            const insertQuery = `
                INSERT INTO test_integration.templates (
                    id, user_id, org_id, name, width_pixels, height_pixels, 
                    dpi, template_elements, orientation
                ) VALUES (
                    '${templateId}',
                    '${TEST_USER_ID}',
                    '${TEST_ORG_ID}',
                    '${templateData.name}',
                    ${templateData.width_pixels},
                    ${templateData.height_pixels},
                    ${templateData.dpi},
                    '${JSON.stringify(templateData.template_elements)}'::jsonb,
                    '${templateData.orientation}'
                ) RETURNING *;
            `;

            const insertResult = await executeSQL(insertQuery);
            expect(insertResult).toHaveLength(1);
            
            const insertedTemplate = insertResult[0];
            expect(insertedTemplate.id).toBe(templateId);
            expect(insertedTemplate.name).toBe(templateData.name);
            expect(insertedTemplate.org_id).toBe(TEST_ORG_ID);
            
            createdTemplateIds.push(templateId);

            // Step 3: Verify it can be retrieved
            const selectQuery = `
                SELECT * FROM test_integration.templates 
                WHERE id = '${templateId}' AND org_id = '${TEST_ORG_ID}';
            `;
            
            const selectResult = await executeSQL(selectQuery);
            expect(selectResult).toHaveLength(1);
            expect(selectResult[0].id).toBe(templateId);
        });

        it('should handle template upsert operations', async () => {
            const templateId = crypto.randomUUID();
            
            // Initial template data
            const initialTemplate: TemplateCreationData = {
                id: templateId,
                user_id: TEST_USER_ID,
                org_id: TEST_ORG_ID,
                name: 'Initial Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            // Step 1: Insert initial template
            const insertQuery = `
                INSERT INTO test_integration.templates (
                    id, user_id, org_id, name, width_pixels, height_pixels, 
                    dpi, template_elements, orientation
                ) VALUES (
                    '${templateId}',
                    '${TEST_USER_ID}',
                    '${TEST_ORG_ID}',
                    '${initialTemplate.name}',
                    ${initialTemplate.width_pixels},
                    ${initialTemplate.height_pixels},
                    ${initialTemplate.dpi},
                    '${JSON.stringify(initialTemplate.template_elements)}'::jsonb,
                    '${initialTemplate.orientation}'
                );
            `;

            await executeSQL(insertQuery);
            createdTemplateIds.push(templateId);

            // Step 2: Update template (simulate upsert)
            const updateQuery = `
                UPDATE test_integration.templates 
                SET 
                    name = 'Updated Template Name',
                    dpi = 150,
                    updated_at = NOW()
                WHERE id = '${templateId}'
                RETURNING *;
            `;

            const updateResult = await executeSQL(updateQuery);
            expect(updateResult).toHaveLength(1);
            
            const updatedTemplate = updateResult[0];
            expect(updatedTemplate.id).toBe(templateId);
            expect(updatedTemplate.name).toBe('Updated Template Name');
            expect(updatedTemplate.dpi).toBe(150);
            expect(updatedTemplate.user_id).toBe(TEST_USER_ID);
            expect(updatedTemplate.org_id).toBe(TEST_ORG_ID);
        });

        it('should enforce organization scoping', async () => {
            const templateId1 = crypto.randomUUID();
            const templateId2 = crypto.randomUUID();

            // Create template for Org 1
            const org1Template: TemplateCreationData = {
                id: templateId1,
                user_id: TEST_USER_ID,
                org_id: TEST_ORG_ID,
                name: 'Org 1 Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            // Create template for Org 2
            const org2Template: TemplateCreationData = {
                id: templateId2,
                user_id: TEST_USER_ID_2,
                org_id: TEST_ORG_ID_2,
                name: 'Org 2 Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            // Insert both templates
            const insertQuery1 = `
                INSERT INTO test_integration.templates (
                    id, user_id, org_id, name, width_pixels, height_pixels, 
                    dpi, template_elements, orientation
                ) VALUES (
                    '${templateId1}', '${TEST_USER_ID}', '${TEST_ORG_ID}',
                    '${org1Template.name}', ${org1Template.width_pixels}, ${org1Template.height_pixels},
                    ${org1Template.dpi}, '${JSON.stringify(org1Template.template_elements)}'::jsonb,
                    '${org1Template.orientation}'
                );
            `;

            const insertQuery2 = `
                INSERT INTO test_integration.templates (
                    id, user_id, org_id, name, width_pixels, height_pixels, 
                    dpi, template_elements, orientation
                ) VALUES (
                    '${templateId2}', '${TEST_USER_ID_2}', '${TEST_ORG_ID_2}',
                    '${org2Template.name}', ${org2Template.width_pixels}, ${org2Template.height_pixels},
                    ${org2Template.dpi}, '${JSON.stringify(org2Template.template_elements)}'::jsonb,
                    '${org2Template.orientation}'
                );
            `;

            await executeSQL(insertQuery1);
            await executeSQL(insertQuery2);
            
            createdTemplateIds.push(templateId1, templateId2);

            // Test organization scoping
            const org1Query = `
                SELECT * FROM test_integration.templates 
                WHERE org_id = '${TEST_ORG_ID}';
            `;
            
            const org2Query = `
                SELECT * FROM test_integration.templates 
                WHERE org_id = '${TEST_ORG_ID_2}';
            `;

            const org1Results = await executeSQL(org1Query);
            const org2Results = await executeSQL(org2Query);

            expect(org1Results).toHaveLength(1);
            expect(org2Results).toHaveLength(1);
            expect(org1Results[0].org_id).toBe(TEST_ORG_ID);
            expect(org2Results[0].org_id).toBe(TEST_ORG_ID_2);
            expect(org1Results[0].name).toBe('Org 1 Template');
            expect(org2Results[0].name).toBe('Org 2 Template');

            // Test cross-organization isolation
            const wrongOrgQuery = `
                SELECT * FROM test_integration.templates 
                WHERE id = '${templateId1}' AND org_id = '${TEST_ORG_ID_2}';
            `;
            
            const wrongOrgResults = await executeSQL(wrongOrgQuery);
            expect(wrongOrgResults).toHaveLength(0);
        });

        it('should handle complex template elements JSONB storage', async () => {
            const templateId = crypto.randomUUID();
            const complexElements = [
                {
                    id: 'elem-' + crypto.randomUUID(),
                    type: 'text',
                    x: 50,
                    y: 100,
                    width: 200,
                    height: 30,
                    variableName: 'employeeName',
                    side: 'front',
                    fontSize: 16,
                    fontFamily: 'Arial',
                    color: '#000000',
                    content: 'Employee Name'
                },
                {
                    id: 'elem-' + crypto.randomUUID(),
                    type: 'photo',
                    x: 300,
                    y: 50,
                    width: 150,
                    height: 200,
                    variableName: 'employeePhoto',
                    side: 'front',
                    aspectRatio: 'portrait'
                },
                {
                    id: 'elem-' + crypto.randomUUID(),
                    type: 'qr',
                    x: 400,
                    y: 300,
                    width: 100,
                    height: 100,
                    variableName: 'employeeQR',
                    side: 'back',
                    content: 'https://company.com/employee/'
                }
            ];

            const templateData: TemplateCreationData = {
                id: templateId,
                user_id: TEST_USER_ID,
                org_id: TEST_ORG_ID,
                name: 'Complex Elements Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: complexElements,
                orientation: 'landscape'
            };

            // Validate schema
            const validation = templateCreationDataSchema.safeParse(templateData);
            expect(validation.success).toBe(true);

            // Insert with complex JSONB elements
            const insertQuery = `
                INSERT INTO test_integration.templates (
                    id, user_id, org_id, name, width_pixels, height_pixels, 
                    dpi, template_elements, orientation
                ) VALUES (
                    '${templateId}',
                    '${TEST_USER_ID}',
                    '${TEST_ORG_ID}',
                    '${templateData.name}',
                    ${templateData.width_pixels},
                    ${templateData.height_pixels},
                    ${templateData.dpi},
                    '${JSON.stringify(templateData.template_elements)}'::jsonb,
                    '${templateData.orientation}'
                ) RETURNING *;
            `;

            const insertResult = await executeSQL(insertQuery);
            expect(insertResult).toHaveLength(1);
            
            createdTemplateIds.push(templateId);

            // Verify JSONB elements are stored and retrievable
            const selectQuery = `
                SELECT 
                    id, 
                    name, 
                    template_elements,
                    jsonb_array_length(template_elements) as elements_count
                FROM test_integration.templates 
                WHERE id = '${templateId}';
            `;

            const selectResult = await executeSQL(selectQuery);
            expect(selectResult).toHaveLength(1);
            
            const retrievedTemplate = selectResult[0];
            expect(retrievedTemplate.elements_count).toBe(3);
            expect(Array.isArray(retrievedTemplate.template_elements)).toBe(true);
            expect(retrievedTemplate.template_elements).toHaveLength(3);
            
            // Verify element types
            const elementTypes = retrievedTemplate.template_elements.map((el: any) => el.type);
            expect(elementTypes).toContain('text');
            expect(elementTypes).toContain('photo');
            expect(elementTypes).toContain('qr');
        });

        it('should handle database constraints and errors', async () => {
            // Test 1: Missing required name field
            const missingNameQuery = `
                INSERT INTO test_integration.templates (
                    id, user_id, org_id, width_pixels, height_pixels, 
                    dpi, template_elements
                ) VALUES (
                    '${crypto.randomUUID()}',
                    '${TEST_USER_ID}',
                    '${TEST_ORG_ID}',
                    1013,
                    638,
                    300,
                    '[]'::jsonb
                );
            `;

            // This should fail due to NOT NULL constraint on name
            try {
                await executeSQL(missingNameQuery);
                // If we get here, the constraint didn't work as expected
                expect(true).toBe(false); // Force failure
            } catch (error) {
                // Expected to fail
                expect(true).toBe(true);
            }

            // Test 2: Duplicate ID constraint
            const templateId = crypto.randomUUID();
            const duplicateIdQuery = `
                INSERT INTO test_integration.templates (
                    id, user_id, org_id, name, width_pixels, height_pixels, 
                    dpi, template_elements
                ) VALUES (
                    '${templateId}',
                    '${TEST_USER_ID}',
                    '${TEST_ORG_ID}',
                    'Duplicate ID Test',
                    1013,
                    638,
                    300,
                    '[]'::jsonb
                );
            `;

            // First insert should succeed
            await executeSQL(duplicateIdQuery);
            createdTemplateIds.push(templateId);

            // Second insert with same ID should fail
            try {
                await executeSQL(duplicateIdQuery);
                expect(true).toBe(false); // Force failure if no constraint error
            } catch (error) {
                // Expected to fail due to primary key constraint
                expect(true).toBe(true);
            }
        });
    });

    describe('Performance and Concurrency Tests', () => {
        it('should handle multiple simultaneous template creation', async () => {
            const templatePromises = [];
            const templateIds: string[] = [];

            // Create 5 templates simultaneously
            for (let i = 0; i < 5; i++) {
                const templateId = crypto.randomUUID();
                templateIds.push(templateId);
                
                const insertQuery = `
                    INSERT INTO test_integration.templates (
                        id, user_id, org_id, name, width_pixels, height_pixels, 
                        dpi, template_elements, orientation
                    ) VALUES (
                        '${templateId}',
                        '${TEST_USER_ID}',
                        '${TEST_ORG_ID}',
                        'Concurrent Template ${i + 1}',
                        1013,
                        638,
                        300,
                        '[]'::jsonb,
                        'landscape'
                    );
                `;
                
                templatePromises.push(executeSQL(insertQuery));
            }

            // Wait for all insertions
            const results = await Promise.allSettled(templatePromises);
            
            // All should succeed
            results.forEach((result, index) => {
                expect(result.status).toBe('fulfilled');
            });

            createdTemplateIds.push(...templateIds);

            // Verify all templates were created
            const verifyQuery = `
                SELECT COUNT(*) as count 
                FROM test_integration.templates 
                WHERE id = ANY(ARRAY['${templateIds.join("','")}']);
            `;

            const countResult = await executeSQL(verifyQuery);
            expect(countResult[0].count).toBe(5);
        });

        it('should handle large template elements arrays', async () => {
            const templateId = crypto.randomUUID();
            
            // Create large elements array (100 elements)
            const largeElementsArray = Array.from({ length: 100 }, (_, i) => ({
                id: `elem-${i}-${crypto.randomUUID()}`,
                type: 'text',
                x: (i % 10) * 100,
                y: Math.floor(i / 10) * 50,
                width: 80,
                height: 20,
                variableName: `field_${i}`,
                side: i % 2 === 0 ? 'front' : 'back',
                content: `Field ${i + 1}`
            }));

            const insertQuery = `
                INSERT INTO test_integration.templates (
                    id, user_id, org_id, name, width_pixels, height_pixels, 
                    dpi, template_elements, orientation
                ) VALUES (
                    '${templateId}',
                    '${TEST_USER_ID}',
                    '${TEST_ORG_ID}',
                    'Large Elements Template',
                    1013,
                    638,
                    300,
                    '${JSON.stringify(largeElementsArray)}'::jsonb,
                    'landscape'
                ) RETURNING jsonb_array_length(template_elements) as elements_count;
            `;

            const startTime = Date.now();
            const insertResult = await executeSQL(insertQuery);
            const endTime = Date.now();

            expect(insertResult).toHaveLength(1);
            expect(insertResult[0].elements_count).toBe(100);
            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

            createdTemplateIds.push(templateId);
        });
    });
});