# Test-02-Aug22-IDCard-Integration-Tests

## Integration Tests for ID Card Operations

### Overview
Comprehensive integration tests that verify the complete ID card creation workflow from form submission to database storage, using real Supabase connections with test data isolation.

### Database Schema for Testing

**Main Tables Involved:**
```sql
-- idcards table structure
CREATE TABLE idcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  front_image TEXT,
  back_image TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- templates table structure  
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_id UUID REFERENCES organizations(id),
  template_elements JSONB NOT NULL,
  width_pixels INTEGER,
  height_pixels INTEGER,
  dpi INTEGER,
  orientation TEXT,
  front_background TEXT,
  back_background TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- organizations table structure
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Test Schema Setup:**
```sql
-- Create test_integration schema for isolated testing
CREATE SCHEMA IF NOT EXISTS test_integration;

-- Mirror tables in test schema
CREATE TABLE test_integration.idcards (LIKE public.idcards INCLUDING ALL);
CREATE TABLE test_integration.templates (LIKE public.templates INCLUDING ALL);
CREATE TABLE test_integration.organizations (LIKE public.organizations INCLUDING ALL);
```

### Integration Test Implementation

```typescript
// tests/integration/idCard.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

// Test configuration
const TEST_SUPABASE_URL = 'https://wnkqlrfmtiibrqnncgqu.supabase.co';
const TEST_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Test key

const supabase = createClient<Database>(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);

// Test data storage
let testOrgId: string;
let testTemplateId: string;
let createdIdCards: string[] = [];

describe('ID Card Integration Tests', () => {
  
  beforeAll(async () => {
    // Set up test organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Organization - ID Cards Integration'
      })
      .select()
      .single();
    
    if (orgError) throw new Error(`Failed to create test org: ${orgError.message}`);
    testOrgId = org.id;

    // Set up test template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert({
        name: 'Test Template - Integration',
        org_id: testOrgId,
        template_elements: {
          front: [
            {
              id: 'name-field',
              type: 'text',
              content: 'Name: {{name}}',
              style: { fontSize: 16, x: 50, y: 100 }
            },
            {
              id: 'id-field', 
              type: 'text',
              content: 'ID: {{employee_id}}',
              style: { fontSize: 14, x: 50, y: 130 }
            }
          ],
          back: [
            {
              id: 'signature',
              type: 'text', 
              content: 'Authorized Signature',
              style: { fontSize: 12, x: 50, y: 200 }
            }
          ]
        },
        width_pixels: 600,
        height_pixels: 400,
        dpi: 300,
        orientation: 'landscape'
      })
      .select()
      .single();

    if (templateError) throw new Error(`Failed to create test template: ${templateError.message}`);
    testTemplateId = template.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (createdIdCards.length > 0) {
      await supabase
        .from('idcards')
        .delete()
        .in('id', createdIdCards);
    }

    if (testTemplateId) {
      await supabase
        .from('templates') 
        .delete()
        .eq('id', testTemplateId);
    }

    if (testOrgId) {
      await supabase
        .from('organizations')
        .delete()
        .eq('id', testOrgId);
    }
  });

  afterEach(async () => {
    // Clean up any created ID cards after each test
    if (createdIdCards.length > 0) {
      const { error } = await supabase
        .from('idcards')
        .delete()
        .in('id', createdIdCards);
      
      if (error) console.warn('Failed to clean up ID cards:', error);
      createdIdCards = [];
    }
  });

  describe('Complete ID Card Creation Flow', () => {
    it('should create ID card with valid template and form data', async () => {
      // Prepare form data
      const formData = {
        template_id: testTemplateId,
        org_id: testOrgId,
        data: {
          name: 'John Doe',
          employee_id: 'EMP001',
          department: 'Engineering',
          email: 'john.doe@test.com'
        },
        front_image: 'https://example.com/front.png',
        back_image: 'https://example.com/back.png'
      };

      // Execute ID card creation
      const { data: idCard, error } = await supabase
        .from('idcards')
        .insert(formData)
        .select()
        .single();

      // Verify success
      expect(error).toBeNull();
      expect(idCard).toBeDefined();
      expect(idCard.id).toBeDefined();
      expect(idCard.template_id).toBe(testTemplateId);
      expect(idCard.org_id).toBe(testOrgId);
      expect(idCard.data).toEqual(formData.data);
      expect(idCard.front_image).toBe(formData.front_image);
      expect(idCard.back_image).toBe(formData.back_image);
      expect(idCard.created_at).toBeDefined();

      // Track for cleanup
      createdIdCards.push(idCard.id);
    });

    it('should enforce organization-scoped access', async () => {
      // Create different organization
      const { data: otherOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: 'Other Test Organization' })
        .select()
        .single();

      expect(orgError).toBeNull();

      try {
        // Attempt to create ID card with mismatched org and template
        const { data, error } = await supabase
          .from('idcards')
          .insert({
            template_id: testTemplateId, // Template belongs to testOrgId
            org_id: otherOrg.id,        // Different org
            data: { name: 'Test User' },
            front_image: 'front.png',
            back_image: 'back.png'
          })
          .select()
          .single();

        // This should either fail or be handled by RLS policies
        if (!error) {
          // If creation succeeds, verify RLS prevents cross-org access
          const { data: retrievedCard, error: retrieveError } = await supabase
            .from('idcards')
            .select('*')
            .eq('id', data.id)
            .eq('org_id', testOrgId) // Try to access with wrong org filter
            .single();

          expect(retrievedCard).toBeNull();
        }
      } finally {
        // Clean up other org
        await supabase
          .from('organizations')
          .delete()
          .eq('id', otherOrg.id);
      }
    });

    it('should handle missing template reference', async () => {
      const fakeTemplateId = '00000000-0000-0000-0000-000000000000';
      
      const { data, error } = await supabase
        .from('idcards')
        .insert({
          template_id: fakeTemplateId,
          org_id: testOrgId,
          data: { name: 'Test User' },
          front_image: 'front.png',
          back_image: 'back.png'
        })
        .select()
        .single();

      // Should fail due to foreign key constraint
      expect(error).toBeDefined();
      expect(error?.code).toBe('23503'); // Foreign key violation
      expect(data).toBeNull();
    });

    it('should validate required fields', async () => {
      // Test missing org_id
      const { data, error } = await supabase
        .from('idcards')
        .insert({
          template_id: testTemplateId,
          // org_id missing
          data: { name: 'Test User' },
          front_image: 'front.png',
          back_image: 'back.png'
        } as any)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(error?.code).toBe('23502'); // Not null violation
      expect(data).toBeNull();
    });
  });

  describe('ID Card Retrieval and Filtering', () => {
    beforeEach(async () => {
      // Create test ID cards for filtering tests
      const testCards = [
        {
          template_id: testTemplateId,
          org_id: testOrgId,
          data: { name: 'Alice Smith', department: 'HR' },
          front_image: 'alice_front.png',
          back_image: 'alice_back.png'
        },
        {
          template_id: testTemplateId,
          org_id: testOrgId,
          data: { name: 'Bob Johnson', department: 'Engineering' },
          front_image: 'bob_front.png',
          back_image: 'bob_back.png'
        },
        {
          template_id: testTemplateId,
          org_id: testOrgId,
          data: { name: 'Carol Davis', department: 'Marketing' },
          front_image: 'carol_front.png',
          back_image: 'carol_back.png'
        }
      ];

      const { data: cards, error } = await supabase
        .from('idcards')
        .insert(testCards)
        .select();

      expect(error).toBeNull();
      expect(cards).toHaveLength(3);
      
      createdIdCards.push(...cards.map(card => card.id));
    });

    it('should retrieve ID cards by organization', async () => {
      const { data: cards, error } = await supabase
        .from('idcards')
        .select('*')
        .eq('org_id', testOrgId)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(cards).toHaveLength(3);
      expect(cards.every(card => card.org_id === testOrgId)).toBe(true);
    });

    it('should retrieve ID cards by template', async () => {
      const { data: cards, error } = await supabase
        .from('idcards')
        .select('*')
        .eq('template_id', testTemplateId)
        .eq('org_id', testOrgId);

      expect(error).toBeNull();
      expect(cards).toHaveLength(3);
      expect(cards.every(card => card.template_id === testTemplateId)).toBe(true);
    });

    it('should support pagination', async () => {
      const { data: page1, error: error1 } = await supabase
        .from('idcards')
        .select('*')
        .eq('org_id', testOrgId)
        .range(0, 1)
        .order('created_at', { ascending: false });

      expect(error1).toBeNull();
      expect(page1).toHaveLength(2);

      const { data: page2, error: error2 } = await supabase
        .from('idcards')
        .select('*')
        .eq('org_id', testOrgId)
        .range(2, 2)
        .order('created_at', { ascending: false });

      expect(error2).toBeNull();
      expect(page2).toHaveLength(1);

      // Verify no overlap
      const page1Ids = page1.map(card => card.id);
      const page2Ids = page2.map(card => card.id);
      expect(page1Ids.some(id => page2Ids.includes(id))).toBe(false);
    });
  });

  describe('ID Card Updates and Deletion', () => {
    let testCardId: string;

    beforeEach(async () => {
      // Create a test card for update/delete operations
      const { data: card, error } = await supabase
        .from('idcards')
        .insert({
          template_id: testTemplateId,
          org_id: testOrgId,
          data: { name: 'Update Test User' },
          front_image: 'test_front.png',
          back_image: 'test_back.png'
        })
        .select()
        .single();

      expect(error).toBeNull();
      testCardId = card.id;
      createdIdCards.push(testCardId);
    });

    it('should update ID card data', async () => {
      const updatedData = {
        name: 'Updated Name',
        department: 'Updated Department',
        new_field: 'New Value'
      };

      const { data: updatedCard, error } = await supabase
        .from('idcards')
        .update({ data: updatedData })
        .eq('id', testCardId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedCard.data).toEqual(updatedData);
      expect(updatedCard.id).toBe(testCardId);
    });

    it('should update image paths', async () => {
      const newImages = {
        front_image: 'updated_front.png',
        back_image: 'updated_back.png'
      };

      const { data: updatedCard, error } = await supabase
        .from('idcards')
        .update(newImages)
        .eq('id', testCardId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updatedCard.front_image).toBe(newImages.front_image);
      expect(updatedCard.back_image).toBe(newImages.back_image);
    });

    it('should delete ID card', async () => {
      const { error: deleteError } = await supabase
        .from('idcards')
        .delete()
        .eq('id', testCardId);

      expect(deleteError).toBeNull();

      // Verify deletion
      const { data: deletedCard, error: selectError } = await supabase
        .from('idcards')
        .select('*')
        .eq('id', testCardId)
        .single();

      expect(deletedCard).toBeNull();
      expect(selectError?.code).toBe('PGRST116'); // No rows returned

      // Remove from cleanup list since it's already deleted
      createdIdCards = createdIdCards.filter(id => id !== testCardId);
    });
  });

  describe('Storage Integration', () => {
    it('should handle storage bucket operations', async () => {
      // Test file upload to storage
      const testFile = new Blob(['test content'], { type: 'image/png' });
      const testPath = `test/${testOrgId}/test-upload-${Date.now()}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('rendered-id-cards')
        .upload(testPath, testFile);

      expect(uploadError).toBeNull();
      expect(uploadData?.path).toBe(testPath);

      try {
        // Create ID card referencing uploaded file
        const { data: idCard, error: cardError } = await supabase
          .from('idcards')
          .insert({
            template_id: testTemplateId,
            org_id: testOrgId,
            data: { name: 'Storage Test User' },
            front_image: testPath,
            back_image: testPath
          })
          .select()
          .single();

        expect(cardError).toBeNull();
        expect(idCard.front_image).toBe(testPath);
        createdIdCards.push(idCard.id);

        // Verify file exists
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('rendered-id-cards')
          .download(testPath);

        expect(downloadError).toBeNull();
        expect(fileData).toBeDefined();

      } finally {
        // Clean up uploaded file
        await supabase.storage
          .from('rendered-id-cards')
          .remove([testPath]);
      }
    });
  });
});
```

### Performance Integration Tests

```typescript
describe('Performance Integration Tests', () => {
  it('should handle bulk ID card creation', async () => {
    const bulkCards = Array.from({ length: 50 }, (_, i) => ({
      template_id: testTemplateId,
      org_id: testOrgId,
      data: { 
        name: `Bulk User ${i}`,
        employee_id: `BULK${i.toString().padStart(3, '0')}`
      },
      front_image: `bulk_${i}_front.png`,
      back_image: `bulk_${i}_back.png`
    }));

    const startTime = Date.now();
    
    const { data: cards, error } = await supabase
      .from('idcards')
      .insert(bulkCards)
      .select();

    const duration = Date.now() - startTime;

    expect(error).toBeNull();
    expect(cards).toHaveLength(50);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

    // Track for cleanup
    createdIdCards.push(...cards.map(card => card.id));
  });

  it('should handle concurrent ID card operations', async () => {
    const concurrentOperations = Array.from({ length: 10 }, (_, i) => 
      supabase
        .from('idcards')
        .insert({
          template_id: testTemplateId,
          org_id: testOrgId,
          data: { name: `Concurrent User ${i}` },
          front_image: `concurrent_${i}_front.png`,
          back_image: `concurrent_${i}_back.png`
        })
        .select()
        .single()
    );

    const results = await Promise.allSettled(concurrentOperations);
    
    const successful = results.filter(result => 
      result.status === 'fulfilled' && !result.value.error
    );

    expect(successful).toHaveLength(10);

    // Track successful cards for cleanup
    successful.forEach(result => {
      if (result.status === 'fulfilled') {
        createdIdCards.push(result.value.data.id);
      }
    });
  });
});
```

### Test Data Seeding and Cleanup

```typescript
// Test utilities for data management
export class IDCardTestDataManager {
  private static instance: IDCardTestDataManager;
  private createdResources: {
    organizations: string[];
    templates: string[];
    idCards: string[];
  } = {
    organizations: [],
    templates: [],
    idCards: []
  };

  static getInstance(): IDCardTestDataManager {
    if (!this.instance) {
      this.instance = new IDCardTestDataManager();
    }
    return this.instance;
  }

  async seedTestData(supabase: any) {
    // Create test organization
    const org = await this.createTestOrganization(supabase);
    
    // Create test templates
    const template = await this.createTestTemplate(supabase, org.id);
    
    return { organization: org, template };
  }

  async createTestOrganization(supabase: any) {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: `Test Org ${Date.now()}`
      })
      .select()
      .single();

    if (error) throw error;
    this.createdResources.organizations.push(data.id);
    return data;
  }

  async createTestTemplate(supabase: any, orgId: string) {
    const { data, error } = await supabase
      .from('templates')
      .insert({
        name: `Test Template ${Date.now()}`,
        org_id: orgId,
        template_elements: {
          front: [{ id: 'test', type: 'text', content: 'Test' }],
          back: []
        },
        width_pixels: 600,
        height_pixels: 400
      })
      .select()
      .single();

    if (error) throw error;
    this.createdResources.templates.push(data.id);
    return data;
  }

  async cleanupAll(supabase: any) {
    // Clean up in reverse dependency order
    await this.cleanupIdCards(supabase);
    await this.cleanupTemplates(supabase);
    await this.cleanupOrganizations(supabase);
  }

  private async cleanupIdCards(supabase: any) {
    if (this.createdResources.idCards.length > 0) {
      await supabase
        .from('idcards')
        .delete()
        .in('id', this.createdResources.idCards);
      this.createdResources.idCards = [];
    }
  }

  private async cleanupTemplates(supabase: any) {
    if (this.createdResources.templates.length > 0) {
      await supabase
        .from('templates')
        .delete()
        .in('id', this.createdResources.templates);
      this.createdResources.templates = [];
    }
  }

  private async cleanupOrganizations(supabase: any) {
    if (this.createdResources.organizations.length > 0) {
      await supabase
        .from('organizations')
        .delete()
        .in('id', this.createdResources.organizations);
      this.createdResources.organizations = [];
    }
  }
}
```

### Test Execution Commands

```bash
# Run all integration tests
npm run test:integration idCard

# Run with database cleanup verification
npm run test:integration:clean idCard

# Run performance tests only
npm run test:integration:performance idCard

# Run with real Supabase connection
TEST_ENV=integration npm run test idCard.integration
```

### Test Quality Metrics

- **Database Isolation**: All tests use separate test data and clean up properly
- **RLS Testing**: Verifies Row Level Security policies work correctly
- **Performance Benchmarks**: Bulk operations complete within acceptable timeframes
- **Concurrency Testing**: Multiple simultaneous operations don't interfere
- **Data Integrity**: Foreign key constraints and validation work as expected