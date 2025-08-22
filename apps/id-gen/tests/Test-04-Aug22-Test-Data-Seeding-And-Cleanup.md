# Test-04-Aug22-Test-Data-Seeding-And-Cleanup

## Test Data Seeding and Cleanup Framework

### Overview
Comprehensive test data management system for reliable, isolated testing with automated seeding, cleanup, and test isolation across unit, integration, and component tests.

### Database Schema Analysis

**Primary Tables for Testing:**
```typescript
interface TestableSchemas {
  organizations: {
    id: string (UUID PRIMARY KEY)
    name: string
    created_at: timestamptz
    updated_at: timestamptz
  }
  
  templates: {
    id: string (UUID PRIMARY KEY)
    name: string
    org_id: string (FK to organizations)
    template_elements: JSON
    width_pixels: integer
    height_pixels: integer
    dpi: integer
    orientation: string
    front_background: string
    back_background: string
    user_id: string
    created_at: timestamptz
    updated_at: timestamptz
  }
  
  idcards: {
    id: string (UUID PRIMARY KEY)
    template_id: string (FK to templates)
    org_id: string (FK to organizations)
    front_image: string
    back_image: string
    data: JSON
    created_at: timestamptz
  }
  
  profiles: {
    id: string (UUID PRIMARY KEY)
    email: string
    org_id: string (FK to organizations)
    role: user_role ENUM
    credits_balance: number
    card_generation_count: number
    template_count: number
    unlimited_templates: boolean
    remove_watermarks: boolean
    context: JSON
    created_at: timestamptz
    updated_at: timestamptz
  }
}
```

### Test Data Manager Implementation

```typescript
// tests/utils/TestDataManager.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

export class TestDataManager {
  private static instance: TestDataManager;
  private supabase: any;
  private testResources: {
    organizations: string[];
    templates: string[];
    idcards: string[];
    profiles: string[];
    storageFiles: Array<{ bucket: string; path: string }>;
  } = {
    organizations: [],
    templates: [],
    idcards: [],
    profiles: [],
    storageFiles: []
  };

  private constructor() {
    this.supabase = createClient<Database>(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_ANON_KEY!
    );
  }

  static getInstance(): TestDataManager {
    if (!this.instance) {
      this.instance = new TestDataManager();
    }
    return this.instance;
  }

  /**
   * Create a complete test organization with templates and ID cards
   */
  async seedCompleteTestData(): Promise<{
    organization: any;
    templates: any[];
    idcards: any[];
    profiles: any[];
  }> {
    const organization = await this.createTestOrganization();
    const profiles = await this.createTestProfiles(organization.id);
    const templates = await this.createTestTemplates(organization.id);
    const idcards = await this.createTestIdCards(organization.id, templates);

    return { organization, templates, idcards, profiles };
  }

  /**
   * Create test organization
   */
  async createTestOrganization(overrides = {}): Promise<any> {
    const orgData = {
      name: `Test Organization ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...overrides
    };

    const { data, error } = await this.supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create test organization: ${error.message}`);
    
    this.testResources.organizations.push(data.id);
    return data;
  }

  /**
   * Create test profiles with different roles
   */
  async createTestProfiles(orgId: string): Promise<any[]> {
    const profilesData = [
      {
        id: `profile-super-admin-${Date.now()}`,
        email: `super.admin@test-${Date.now()}.com`,
        org_id: orgId,
        role: 'super_admin' as const,
        credits_balance: 1000,
        unlimited_templates: true,
        remove_watermarks: true
      },
      {
        id: `profile-org-admin-${Date.now()}`,
        email: `org.admin@test-${Date.now()}.com`,
        org_id: orgId,
        role: 'org_admin' as const,
        credits_balance: 500,
        unlimited_templates: true,
        remove_watermarks: false
      },
      {
        id: `profile-id-gen-admin-${Date.now()}`,
        email: `id.admin@test-${Date.now()}.com`,
        org_id: orgId,
        role: 'id_gen_admin' as const,
        credits_balance: 200,
        unlimited_templates: false,
        remove_watermarks: false
      },
      {
        id: `profile-id-gen-user-${Date.now()}`,
        email: `id.user@test-${Date.now()}.com`,
        org_id: orgId,
        role: 'id_gen_user' as const,
        credits_balance: 50,
        unlimited_templates: false,
        remove_watermarks: false
      }
    ];

    const { data, error } = await this.supabase
      .from('profiles')
      .insert(profilesData)
      .select();

    if (error) throw new Error(`Failed to create test profiles: ${error.message}`);
    
    this.testResources.profiles.push(...data.map((p: any) => p.id));
    return data;
  }

  /**
   * Create test templates
   */
  async createTestTemplates(orgId: string, count = 3): Promise<any[]> {
    const templatesData = Array.from({ length: count }, (_, i) => ({
      name: `Test Template ${i + 1} - ${Date.now()}`,
      org_id: orgId,
      template_elements: this.generateTestTemplateElements(i),
      width_pixels: 600 + (i * 100),
      height_pixels: 400 + (i * 50),
      dpi: 300,
      orientation: i % 2 === 0 ? 'landscape' : 'portrait',
      front_background: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      back_background: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }));

    const { data, error } = await this.supabase
      .from('templates')
      .insert(templatesData)
      .select();

    if (error) throw new Error(`Failed to create test templates: ${error.message}`);
    
    this.testResources.templates.push(...data.map((t: any) => t.id));
    return data;
  }

  /**
   * Create test ID cards
   */
  async createTestIdCards(orgId: string, templates: any[], cardsPerTemplate = 2): Promise<any[]> {
    const idCardsData = templates.flatMap(template => 
      Array.from({ length: cardsPerTemplate }, (_, i) => ({
        template_id: template.id,
        org_id: orgId,
        front_image: `test/${orgId}/${template.id}/${Date.now()}_${i}_front.png`,
        back_image: `test/${orgId}/${template.id}/${Date.now()}_${i}_back.png`,
        data: this.generateTestCardData(template.name, i)
      }))
    );

    const { data, error } = await this.supabase
      .from('idcards')
      .insert(idCardsData)
      .select();

    if (error) throw new Error(`Failed to create test ID cards: ${error.message}`);
    
    this.testResources.idcards.push(...data.map((c: any) => c.id));
    return data;
  }

  /**
   * Upload test files to storage
   */
  async uploadTestFiles(orgId: string, templateId: string, count = 2): Promise<string[]> {
    const uploadedPaths: string[] = [];

    for (let i = 0; i < count; i++) {
      const frontPath = `test/${orgId}/${templateId}/${Date.now()}_${i}_front.png`;
      const backPath = `test/${orgId}/${templateId}/${Date.now()}_${i}_back.png`;
      
      // Create test image blobs
      const testImageBlob = new Blob(['test image content'], { type: 'image/png' });

      // Upload front image
      const { error: frontError } = await this.supabase.storage
        .from('rendered-id-cards')
        .upload(frontPath, testImageBlob);

      if (frontError) throw new Error(`Failed to upload front image: ${frontError.message}`);

      // Upload back image
      const { error: backError } = await this.supabase.storage
        .from('rendered-id-cards')
        .upload(backPath, testImageBlob);

      if (backError) throw new Error(`Failed to upload back image: ${backError.message}`);

      this.testResources.storageFiles.push(
        { bucket: 'rendered-id-cards', path: frontPath },
        { bucket: 'rendered-id-cards', path: backPath }
      );

      uploadedPaths.push(frontPath, backPath);
    }

    return uploadedPaths;
  }

  /**
   * Generate test template elements
   */
  private generateTestTemplateElements(index: number) {
    return {
      front: [
        {
          id: `name-field-${index}`,
          type: 'text',
          content: 'Name: {{name}}',
          style: {
            fontSize: 16 + index,
            fontFamily: 'Arial',
            color: '#000000',
            x: 50,
            y: 100 + (index * 10),
            width: 200,
            height: 30
          }
        },
        {
          id: `id-field-${index}`,
          type: 'text',
          content: 'ID: {{employee_id}}',
          style: {
            fontSize: 14 + index,
            fontFamily: 'Arial',
            color: '#333333',
            x: 50,
            y: 130 + (index * 10),
            width: 150,
            height: 25
          }
        },
        {
          id: `department-field-${index}`,
          type: 'text',
          content: 'Department: {{department}}',
          style: {
            fontSize: 12 + index,
            fontFamily: 'Arial',
            color: '#666666',
            x: 50,
            y: 160 + (index * 10),
            width: 200,
            height: 20
          }
        }
      ],
      back: [
        {
          id: `signature-field-${index}`,
          type: 'text',
          content: 'Authorized Signature',
          style: {
            fontSize: 12,
            fontFamily: 'Arial',
            color: '#000000',
            x: 50,
            y: 200,
            width: 150,
            height: 20
          }
        },
        {
          id: `date-field-${index}`,
          type: 'text',
          content: 'Issue Date: {{issue_date}}',
          style: {
            fontSize: 10,
            fontFamily: 'Arial',
            color: '#999999',
            x: 50,
            y: 230,
            width: 100,
            height: 15
          }
        }
      ]
    };
  }

  /**
   * Generate test card data
   */
  private generateTestCardData(templateName: string, index: number) {
    return {
      name: `Test User ${index + 1}`,
      employee_id: `EMP${(index + 1).toString().padStart(3, '0')}`,
      department: ['Engineering', 'Marketing', 'HR', 'Sales', 'Finance'][index % 5],
      email: `test.user.${index + 1}@company.com`,
      phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      position: ['Developer', 'Manager', 'Analyst', 'Coordinator', 'Director'][index % 5],
      hire_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      issue_date: new Date().toISOString().split('T')[0],
      template_source: templateName
    };
  }

  /**
   * Clean up all test resources
   */
  async cleanupAll(): Promise<void> {
    console.log('Starting test data cleanup...');

    try {
      // Clean up in reverse dependency order
      await this.cleanupStorageFiles();
      await this.cleanupIdCards();
      await this.cleanupTemplates();
      await this.cleanupProfiles();
      await this.cleanupOrganizations();

      console.log('Test data cleanup completed successfully');
    } catch (error) {
      console.error('Error during test data cleanup:', error);
      throw error;
    }
  }

  /**
   * Clean up storage files
   */
  private async cleanupStorageFiles(): Promise<void> {
    if (this.testResources.storageFiles.length === 0) return;

    console.log(`Cleaning up ${this.testResources.storageFiles.length} storage files...`);

    // Group by bucket for efficient cleanup
    const filesByBucket = this.testResources.storageFiles.reduce((acc, file) => {
      if (!acc[file.bucket]) acc[file.bucket] = [];
      acc[file.bucket].push(file.path);
      return acc;
    }, {} as Record<string, string[]>);

    for (const [bucket, paths] of Object.entries(filesByBucket)) {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        console.warn(`Failed to cleanup storage files in ${bucket}:`, error);
      }
    }

    this.testResources.storageFiles = [];
  }

  /**
   * Clean up ID cards
   */
  private async cleanupIdCards(): Promise<void> {
    if (this.testResources.idcards.length === 0) return;

    console.log(`Cleaning up ${this.testResources.idcards.length} ID cards...`);

    const { error } = await this.supabase
      .from('idcards')
      .delete()
      .in('id', this.testResources.idcards);

    if (error) {
      console.warn('Failed to cleanup ID cards:', error);
    }

    this.testResources.idcards = [];
  }

  /**
   * Clean up templates
   */
  private async cleanupTemplates(): Promise<void> {
    if (this.testResources.templates.length === 0) return;

    console.log(`Cleaning up ${this.testResources.templates.length} templates...`);

    const { error } = await this.supabase
      .from('templates')
      .delete()
      .in('id', this.testResources.templates);

    if (error) {
      console.warn('Failed to cleanup templates:', error);
    }

    this.testResources.templates = [];
  }

  /**
   * Clean up profiles
   */
  private async cleanupProfiles(): Promise<void> {
    if (this.testResources.profiles.length === 0) return;

    console.log(`Cleaning up ${this.testResources.profiles.length} profiles...`);

    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .in('id', this.testResources.profiles);

    if (error) {
      console.warn('Failed to cleanup profiles:', error);
    }

    this.testResources.profiles = [];
  }

  /**
   * Clean up organizations
   */
  private async cleanupOrganizations(): Promise<void> {
    if (this.testResources.organizations.length === 0) return;

    console.log(`Cleaning up ${this.testResources.organizations.length} organizations...`);

    const { error } = await this.supabase
      .from('organizations')
      .delete()
      .in('id', this.testResources.organizations);

    if (error) {
      console.warn('Failed to cleanup organizations:', error);
    }

    this.testResources.organizations = [];
  }

  /**
   * Get test resource counts
   */
  getResourceCounts() {
    return {
      organizations: this.testResources.organizations.length,
      templates: this.testResources.templates.length,
      idcards: this.testResources.idcards.length,
      profiles: this.testResources.profiles.length,
      storageFiles: this.testResources.storageFiles.length
    };
  }

  /**
   * Reset the manager (for testing the manager itself)
   */
  reset(): void {
    this.testResources = {
      organizations: [],
      templates: [],
      idcards: [],
      profiles: [],
      storageFiles: []
    };
  }

  /**
   * Create minimal test data for quick tests
   */
  async createMinimalTestData(): Promise<{
    organization: any;
    template: any;
    profile: any;
  }> {
    const organization = await this.createTestOrganization();
    const [profile] = await this.createTestProfiles(organization.id);
    const [template] = await this.createTestTemplates(organization.id, 1);

    return { organization, template, profile };
  }

  /**
   * Create performance test data (large dataset)
   */
  async createPerformanceTestData(): Promise<{
    organization: any;
    templates: any[];
    idcards: any[];
    profiles: any[];
  }> {
    const organization = await this.createTestOrganization({
      name: `Performance Test Org ${Date.now()}`
    });
    
    const profiles = await this.createTestProfiles(organization.id);
    const templates = await this.createTestTemplates(organization.id, 10);
    const idcards = await this.createTestIdCards(organization.id, templates, 10);

    return { organization, templates, idcards, profiles };
  }
}

// Export singleton instance
export const testDataManager = TestDataManager.getInstance();
```

### Test Setup and Teardown Helpers

```typescript
// tests/utils/testSetup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { testDataManager } from './TestDataManager';

/**
 * Setup for integration tests requiring full data
 */
export function setupIntegrationTest() {
  let testData: any;

  beforeAll(async () => {
    testData = await testDataManager.seedCompleteTestData();
  });

  afterAll(async () => {
    await testDataManager.cleanupAll();
  });

  return {
    getTestData: () => testData
  };
}

/**
 * Setup for unit tests requiring minimal data
 */
export function setupUnitTest() {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  return {
    getTestData: () => testData
  };
}

/**
 * Setup for performance tests
 */
export function setupPerformanceTest() {
  let testData: any;

  beforeAll(async () => {
    testData = await testDataManager.createPerformanceTestData();
  });

  afterAll(async () => {
    await testDataManager.cleanupAll();
  });

  return {
    getTestData: () => testData
  };
}

/**
 * Setup for component tests (no database needed)
 */
export function setupComponentTest() {
  // Component tests typically use mocked data
  return {
    createMockCard: (overrides = {}) => ({
      idcard_id: 'mock-card-123',
      template_name: 'Mock Template',
      fields: {
        'Name': { value: 'Mock User', side: 'front' as const },
        'ID': { value: 'MOCK001', side: 'front' as const }
      },
      front_image: 'mock/front.png',
      back_image: 'mock/back.png',
      ...overrides
    })
  };
}
```

### Test Database Schema Migration

```sql
-- tests/migrations/001_setup_test_schema.sql

-- Create test schema for isolated testing
CREATE SCHEMA IF NOT EXISTS test_integration;

-- Set search path to include test schema
SET search_path TO test_integration, public;

-- Copy table structures to test schema
CREATE TABLE test_integration.organizations (LIKE public.organizations INCLUDING ALL);
CREATE TABLE test_integration.templates (LIKE public.templates INCLUDING ALL);
CREATE TABLE test_integration.idcards (LIKE public.idcards INCLUDING ALL);
CREATE TABLE test_integration.profiles (LIKE public.profiles INCLUDING ALL);

-- Copy constraints and indexes
ALTER TABLE test_integration.templates 
ADD CONSTRAINT fk_templates_org_id 
FOREIGN KEY (org_id) REFERENCES test_integration.organizations(id);

ALTER TABLE test_integration.idcards 
ADD CONSTRAINT fk_idcards_org_id 
FOREIGN KEY (org_id) REFERENCES test_integration.organizations(id);

ALTER TABLE test_integration.idcards 
ADD CONSTRAINT fk_idcards_template_id 
FOREIGN KEY (template_id) REFERENCES test_integration.templates(id);

ALTER TABLE test_integration.profiles 
ADD CONSTRAINT fk_profiles_org_id 
FOREIGN KEY (org_id) REFERENCES test_integration.organizations(id);

-- Create indexes for performance
CREATE INDEX idx_test_templates_org_id ON test_integration.templates(org_id);
CREATE INDEX idx_test_idcards_org_id ON test_integration.idcards(org_id);
CREATE INDEX idx_test_idcards_template_id ON test_integration.idcards(template_id);
CREATE INDEX idx_test_profiles_org_id ON test_integration.profiles(org_id);

-- Grant permissions
GRANT ALL ON SCHEMA test_integration TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA test_integration TO postgres;
```

### Environment Configuration

```bash
# .env.test
TEST_SUPABASE_URL=https://wnkqlrfmtiibrqnncgqu.supabase.co
TEST_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TEST_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Test database configuration
TEST_DATABASE_SCHEMA=test_integration
TEST_STORAGE_BUCKET=test-rendered-id-cards

# Test performance settings
TEST_TIMEOUT=30000
TEST_BULK_SIZE=100
TEST_CONCURRENT_OPERATIONS=10
```

### Usage Examples

```typescript
// Example: Integration test with full setup
import { describe, it, expect } from 'vitest';
import { setupIntegrationTest } from '../utils/testSetup';

describe('ID Card Integration Tests', () => {
  const { getTestData } = setupIntegrationTest();

  it('should create ID card with seeded data', async () => {
    const { organization, templates } = getTestData();
    
    // Use seeded data for test
    expect(organization).toBeDefined();
    expect(templates).toHaveLength(3);
  });
});

// Example: Unit test with minimal setup
import { describe, it, expect } from 'vitest';
import { setupUnitTest } from '../utils/testSetup';

describe('ID Card Utilities', () => {
  const { getTestData } = setupUnitTest();

  it('should process card data', async () => {
    const { organization, template } = getTestData();
    
    // Test with minimal data
    expect(organization.id).toBeDefined();
    expect(template.org_id).toBe(organization.id);
  });
});

// Example: Performance test
import { describe, it, expect } from 'vitest';
import { setupPerformanceTest } from '../utils/testSetup';

describe('ID Card Performance Tests', () => {
  const { getTestData } = setupPerformanceTest();

  it('should handle large dataset efficiently', async () => {
    const { templates, idcards } = getTestData();
    
    expect(templates).toHaveLength(10);
    expect(idcards).toHaveLength(100); // 10 templates × 10 cards each
  });
});
```

### Monitoring and Debugging

```typescript
// tests/utils/testMonitor.ts
export class TestMonitor {
  private static startTime: number;
  private static operations: Array<{
    operation: string;
    duration: number;
    success: boolean;
  }> = [];

  static startOperation(name: string): void {
    this.startTime = Date.now();
    console.log(`Starting operation: ${name}`);
  }

  static endOperation(name: string, success = true): void {
    const duration = Date.now() - this.startTime;
    this.operations.push({ operation: name, duration, success });
    console.log(`Completed ${name} in ${duration}ms (${success ? 'SUCCESS' : 'FAILED'})`);
  }

  static getStats() {
    return {
      totalOperations: this.operations.length,
      successfulOperations: this.operations.filter(op => op.success).length,
      averageDuration: this.operations.reduce((sum, op) => sum + op.duration, 0) / this.operations.length,
      slowestOperation: this.operations.reduce((prev, current) => 
        current.duration > prev.duration ? current : prev
      )
    };
  }

  static reset(): void {
    this.operations = [];
  }
}
```

### Test Execution Commands

```bash
# Setup test database
npm run test:setup

# Run tests with seeded data
npm run test:integration:seeded

# Run tests with cleanup verification
npm run test:cleanup

# Run performance tests with large dataset
npm run test:performance:bulk

# Monitor test data usage
npm run test:monitor

# Clean up abandoned test data
npm run test:cleanup:force
```

### Data Cleanup Verification

```typescript
// tests/utils/cleanupVerification.ts
export async function verifyCleanup() {
  const testDataManager = TestDataManager.getInstance();
  const counts = testDataManager.getResourceCounts();
  
  const hasLeftoverData = Object.values(counts).some(count => count > 0);
  
  if (hasLeftoverData) {
    console.warn('Test data cleanup incomplete:', counts);
    throw new Error('Test data was not properly cleaned up');
  }
  
  console.log('✅ All test data cleaned up successfully');
}
```

This comprehensive test data seeding and cleanup framework ensures:

- **Isolated Testing**: Each test gets clean, fresh data
- **Dependency Management**: Proper creation and cleanup order
- **Performance Optimization**: Bulk operations for large datasets
- **Resource Tracking**: All created resources are tracked for cleanup
- **Error Handling**: Robust error handling and recovery
- **Monitoring**: Performance monitoring and debugging tools