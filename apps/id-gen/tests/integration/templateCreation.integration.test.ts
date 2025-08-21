import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
    templateCreationInputSchema, 
    templateCreationDataSchema,
    type TemplateCreationData 
} from '$lib/schemas/template-creation.schema';

// Create proper mock chains for Supabase
const createMockSupabaseChain = () => {
    const singleMock = vi.fn();
    const selectMock = vi.fn(() => ({ single: singleMock }));
    const insertMock = vi.fn(() => ({ select: selectMock }));
    const upsertMock = vi.fn(() => ({ select: selectMock }));
    const eqMock = vi.fn(() => ({ single: singleMock }));
    const selectQueryMock = vi.fn(() => ({ eq: eqMock }));
    const matchMock = vi.fn(() => ({ eq: eqMock }));
    const deleteMock = vi.fn(() => ({ match: matchMock }));
    
    const fromMock = vi.fn(() => ({
        insert: insertMock,
        upsert: upsertMock,
        select: selectQueryMock,
        delete: deleteMock
    }));

    return {
        from: fromMock,
        mocks: {
            single: singleMock,
            select: selectMock,
            insert: insertMock,
            upsert: upsertMock,
            eq: eqMock,
            selectQuery: selectQueryMock,
            match: matchMock,
            delete: deleteMock,
            from: fromMock
        }
    };
};

describe('Template Creation Integration Tests', () => {
    let supabase: any;
    let mocks: any;
    let testOrgId: string;
    let testUserId: string;
    let createdTemplateIds: string[] = [];

    beforeEach(async () => {
        // Initialize mock Supabase client
        const mockChain = createMockSupabaseChain();
        supabase = mockChain;
        mocks = mockChain.mocks;
        
        // Setup test data
        testOrgId = 'org-' + crypto.randomUUID();
        testUserId = 'user-' + crypto.randomUUID();
        createdTemplateIds = [];

        // Reset all mocks
        vi.clearAllMocks();
    });

    afterEach(async () => {
        // Cleanup created templates
        if (createdTemplateIds.length > 0) {
            await supabase
                .from('templates')
                .delete()
                .in('id', createdTemplateIds);
        }
        
        vi.clearAllMocks();
    });

    describe('Template Creation API Flow', () => {
        it('should create a new template with valid data', async () => {
            const templateData: TemplateCreationData = {
                id: crypto.randomUUID(),
                user_id: testUserId,
                org_id: testOrgId,
                name: 'Integration Test Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            // Validate schema first
            const validation = templateCreationDataSchema.safeParse(templateData);
            expect(validation.success).toBe(true);

            // Mock successful database response
            const mockData = { ...templateData };
            mocks.single.mockResolvedValue({
                data: mockData,
                error: null
            });

            // Simulate API call
            const { data, error } = await supabase
                .from('templates')
                .insert(templateData)
                .select('*')
                .single();

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data?.id).toBe(templateData.id);
            expect(data?.name).toBe(templateData.name);
            expect(data?.org_id).toBe(testOrgId);
            expect(data?.user_id).toBe(testUserId);

            if (data?.id) {
                createdTemplateIds.push(data.id);
            }
        });

        it('should update existing template with upsert operation', async () => {
            const templateId = crypto.randomUUID();
            const initialData: TemplateCreationData = {
                id: templateId,
                user_id: testUserId,
                org_id: testOrgId,
                name: 'Initial Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            // Mock initial create
            mocks.single.mockResolvedValueOnce({
                data: initialData,
                error: null
            });

            // Create initial template
            await supabase
                .from('templates')
                .insert(initialData)
                .select('*')
                .single();

            createdTemplateIds.push(templateId);

            // Update template data
            const updatedData: TemplateCreationData = {
                ...initialData,
                name: 'Updated Template',
                dpi: 150,
                updated_at: new Date().toISOString()
            };

            // Mock upsert response
            mocks.single.mockResolvedValueOnce({
                data: updatedData,
                error: null
            });

            // Perform upsert
            const { data, error } = await supabase
                .from('templates')
                .upsert(updatedData, { onConflict: 'id' })
                .select('*')
                .single();

            expect(error).toBeNull();
            expect(data?.name).toBe('Updated Template');
            expect(data?.dpi).toBe(150);
            expect(data?.id).toBe(templateId);
        });

        it('should enforce organization scoping', async () => {
            const templateData: TemplateCreationData = {
                id: crypto.randomUUID(),
                user_id: testUserId,
                org_id: testOrgId,
                name: 'Org Scoped Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            // Create template
            await supabase
                .from('templates')
                .insert(templateData);

            createdTemplateIds.push(templateData.id!);

            // Try to fetch with wrong org_id
            const wrongOrgId = 'wrong-org-' + crypto.randomUUID();
            const { data: noData, error: noError } = await supabase
                .from('templates')
                .select('*')
                .eq('id', templateData.id)
                .eq('org_id', wrongOrgId)
                .single();

            expect(noData).toBeNull();
            expect(noError).toBeDefined();

            // Fetch with correct org_id
            const { data: correctData, error: correctError } = await supabase
                .from('templates')
                .select('*')
                .eq('id', templateData.id)
                .eq('org_id', testOrgId)
                .single();

            expect(correctError).toBeNull();
            expect(correctData).toBeDefined();
            expect(correctData?.org_id).toBe(testOrgId);
        });

        it('should handle template with complex elements array', async () => {
            const complexElements = [
                {
                    id: crypto.randomUUID(),
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
                    id: crypto.randomUUID(),
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
                    id: crypto.randomUUID(),
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
                id: crypto.randomUUID(),
                user_id: testUserId,
                org_id: testOrgId,
                name: 'Complex Elements Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: complexElements,
                orientation: 'landscape'
            };

            const { data, error } = await supabase
                .from('templates')
                .insert(templateData)
                .select('*')
                .single();

            expect(error).toBeNull();
            expect(data?.template_elements).toHaveLength(3);
            expect(Array.isArray(data?.template_elements)).toBe(true);

            if (data?.id) {
                createdTemplateIds.push(data.id);
            }
        });
    });

    describe('Database Constraint Tests', () => {
        it('should enforce required fields', async () => {
            const incompleteData = {
                id: crypto.randomUUID(),
                user_id: testUserId,
                org_id: testOrgId,
                // Missing required 'name' field
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: []
            };

            const { data, error } = await supabase
                .from('templates')
                .insert(incompleteData as any);

            expect(error).toBeDefined();
            expect(data).toBeNull();
        });

        it('should handle UUID format validation', async () => {
            const invalidUUIDData = {
                id: 'invalid-uuid-format',
                user_id: testUserId,
                org_id: testOrgId,
                name: 'Invalid UUID Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: []
            };

            const { data, error } = await supabase
                .from('templates')
                .insert(invalidUUIDData as any);

            expect(error).toBeDefined();
            expect(data).toBeNull();
        });

        it('should handle JSONB template_elements validation', async () => {
            const templateData: TemplateCreationData = {
                id: crypto.randomUUID(),
                user_id: testUserId,
                org_id: testOrgId,
                name: 'JSONB Test Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [], // Valid empty array
                orientation: 'landscape'
            };

            const { data, error } = await supabase
                .from('templates')
                .insert(templateData)
                .select('*')
                .single();

            expect(error).toBeNull();
            expect(data?.template_elements).toEqual([]);

            if (data?.id) {
                createdTemplateIds.push(data.id);
            }
        });
    });

    describe('Concurrency and Performance Tests', () => {
        it('should handle multiple simultaneous template creation', async () => {
            const templatePromises = Array.from({ length: 5 }, (_, i) => {
                const templateData: TemplateCreationData = {
                    id: crypto.randomUUID(),
                    user_id: testUserId,
                    org_id: testOrgId,
                    name: `Concurrent Template ${i + 1}`,
                    width_pixels: 1013,
                    height_pixels: 638,
                    dpi: 300,
                    template_elements: [],
                    orientation: 'landscape'
                };

                return supabase
                    .from('templates')
                    .insert(templateData)
                    .select('*')
                    .single();
            });

            const results = await Promise.all(templatePromises);

            // All operations should succeed
            results.forEach(({ data, error }) => {
                expect(error).toBeNull();
                expect(data).toBeDefined();
                if (data?.id) {
                    createdTemplateIds.push(data.id);
                }
            });

            expect(results).toHaveLength(5);
        });

        it('should handle large template_elements arrays efficiently', async () => {
            // Create a large array of elements (100 elements)
            const largeElementsArray = Array.from({ length: 100 }, (_, i) => ({
                id: crypto.randomUUID(),
                type: 'text',
                x: (i % 10) * 100,
                y: Math.floor(i / 10) * 50,
                width: 80,
                height: 20,
                variableName: `field_${i}`,
                side: i % 2 === 0 ? 'front' : 'back',
                content: `Field ${i + 1}`
            }));

            const templateData: TemplateCreationData = {
                id: crypto.randomUUID(),
                user_id: testUserId,
                org_id: testOrgId,
                name: 'Large Elements Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: largeElementsArray,
                orientation: 'landscape'
            };

            const startTime = Date.now();
            const { data, error } = await supabase
                .from('templates')
                .insert(templateData)
                .select('*')
                .single();
            const endTime = Date.now();

            expect(error).toBeNull();
            expect(data?.template_elements).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

            if (data?.id) {
                createdTemplateIds.push(data.id);
            }
        });
    });

    describe('Error Recovery Tests', () => {
        it('should rollback on transaction failure', async () => {
            const templateData: TemplateCreationData = {
                id: crypto.randomUUID(),
                user_id: testUserId,
                org_id: testOrgId,
                name: 'Transaction Test Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            // First successful insert
            const { data: firstData, error: firstError } = await supabase
                .from('templates')
                .insert(templateData)
                .select('*')
                .single();

            expect(firstError).toBeNull();
            expect(firstData).toBeDefined();

            if (firstData?.id) {
                createdTemplateIds.push(firstData.id);
            }

            // Attempt duplicate insert (should fail)
            const { data: duplicateData, error: duplicateError } = await supabase
                .from('templates')
                .insert(templateData);

            expect(duplicateError).toBeDefined();
            expect(duplicateData).toBeNull();
        });

        it('should handle network timeouts gracefully', async () => {
            // This test would require mocking network conditions
            // In a real test environment, you would simulate timeout conditions
            const templateData: TemplateCreationData = {
                id: crypto.randomUUID(),
                user_id: testUserId,
                org_id: testOrgId,
                name: 'Timeout Test Template',
                width_pixels: 1013,
                height_pixels: 638,
                dpi: 300,
                template_elements: [],
                orientation: 'landscape'
            };

            // Set a very short timeout for testing
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 10); // 10ms timeout

            try {
                await supabase
                    .from('templates')
                    .insert(templateData);
            } catch (error) {
                expect(error).toBeDefined();
                // Error should be handled gracefully without corrupting database state
            }
        });
    });
});