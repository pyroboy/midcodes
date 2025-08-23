import { vi, expect } from 'vitest';
import type { TemplateData, TemplateElement } from '$lib/stores/templateStore';

/**
 * Shared test utilities and helpers for ID Generation app testing
 */

// Test data factories
export const TestDataFactory = {
  /**
   * Create a basic template for testing
   */
  createTemplate(overrides: Partial<TemplateData> = {}): TemplateData {
    return {
      id: 'test-template-' + Date.now(),
      user_id: 'test-user-' + Date.now(),
      name: 'Test Template',
      org_id: 'test-org-' + Date.now(),
      front_background: '#ffffff',
      back_background: '#f0f0f0',
      orientation: 'landscape',
      template_elements: [],
      created_at: new Date().toISOString(),
      dpi: 300,
      width_pixels: 1013,
      height_pixels: 638,
      ...overrides
    };
  },

  /**
   * Create a template element for testing
   */
  createElement(overrides: Partial<TemplateElement> = {}): TemplateElement {
    return {
      id: 'element-' + Date.now(),
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 30,
      variableName: 'test_field',
      side: 'front',
      fontSize: 14,
      fontFamily: 'Arial',
      color: '#000000',
      ...overrides
    };
  },

  /**
   * Create multiple elements with different types
   */
  createElementSet(): TemplateElement[] {
    return [
      this.createElement({
        id: 'name-element',
        type: 'text',
        variableName: 'name',
        x: 50,
        y: 50
      }),
      this.createElement({
        id: 'photo-element',
        type: 'image',
        variableName: 'photo',
        x: 300,
        y: 50,
        width: 100,
        height: 100
      }),
      this.createElement({
        id: 'qr-element',
        type: 'qr',
        variableName: 'qr_data',
        x: 450,
        y: 50,
        width: 80,
        height: 80
      })
    ];
  },

  /**
   * Create test user profile data
   */
  createUserProfile(overrides: any = {}) {
    return {
      id: 'user-' + Date.now(),
      email: 'test@example.com',
      org_id: 'org-' + Date.now(),
      credits_balance: 100,
      card_generation_count: 0,
      template_count: 0,
      role: 'id_gen_user',
      created_at: new Date().toISOString(),
      ...overrides
    };
  },

  /**
   * Create test organization data
   */
  createOrganization(overrides: any = {}) {
    return {
      id: 'org-' + Date.now(),
      name: 'Test Organization',
      created_at: new Date().toISOString(),
      ...overrides
    };
  },

  /**
   * Create test ID card data
   */
  createIDCard(overrides: any = {}) {
    return {
      id: 'card-' + Date.now(),
      user_id: 'user-' + Date.now(),
      org_id: 'org-' + Date.now(),
      template_id: 'template-' + Date.now(),
      data: { name: 'John Doe', title: 'Employee' },
      front_image: 'front.jpg',
      back_image: 'back.jpg',
      created_at: new Date().toISOString(),
      ...overrides
    };
  },

  /**
   * Alias for createIDCard for camelCase consistency
   */
  createIdCard(overrides: any = {}) {
    return this.createIDCard(overrides);
  }
};

// Mock utilities
export const MockUtilities = {
  /**
   * Create a mock Supabase client with common operations
   */
  createSupabaseMock() {
    const supabaseClient = {
      from: vi.fn((table: string) => {
        // Create a simple mock that returns itself for chaining
        const mockChain: any = {
          select: vi.fn((columns?: string) => mockChain),
          eq: vi.fn((column: string, value: any) => mockChain),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          in: vi.fn((column: string, values: any[]) => mockChain),
          order: vi.fn((column: string, options?: any) => mockChain),
          limit: vi.fn((count: number) => Promise.resolve({ data: [], error: null })),
          mockResolvedValueOnce: vi.fn((value: any) => mockChain),
          mockRejectedValueOnce: vi.fn((error: any) => mockChain)
        };
        
        return {
          select: vi.fn((columns?: string) => mockChain),
          insert: vi.fn((data?: any) => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              mockResolvedValueOnce: vi.fn((value: any) => Promise.resolve(value))
            }))
          })),
          update: vi.fn((data?: any) => mockChain),
          delete: vi.fn(() => mockChain),
          upsert: vi.fn((data: any) => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        };
      }),
      
      storage: {
        from: vi.fn((bucket: string) => ({
          upload: vi.fn(() => Promise.resolve({ data: { path: 'test/path.jpg' }, error: null })),
          remove: vi.fn(() => Promise.resolve({ data: [], error: null })),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test.jpg' } })),
          list: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      },

      auth: {
        getUser: vi.fn(() => Promise.resolve({ 
          data: { user: { id: 'test-user', email: 'test@example.com' } }, 
          error: null 
        })),
        getSession: vi.fn(() => Promise.resolve({ 
          data: { session: { access_token: 'test-token' } }, 
          error: null 
        }))
      }
    };

    return {
      supabase: supabaseClient
    };
  },

  /**
   * Create a mock file for upload testing
   */
  createMockFile(name = 'test.jpg', type = 'image/jpeg', size = 1024) {
    return new File(['x'.repeat(size)], name, { type });
  },

  /**
   * Create mock WebGL context
   */
  createWebGLMock() {
    return {
      canvas: {
        width: 800,
        height: 600,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      },
      context: {
        getExtension: vi.fn(),
        getParameter: vi.fn(),
        createTexture: vi.fn(() => ({ id: 'texture-' + Date.now() })),
        bindTexture: vi.fn(),
        texImage2D: vi.fn(),
        deleteTexture: vi.fn(),
        viewport: vi.fn(),
        clear: vi.fn()
      }
    };
  },

  /**
   * Create mock Three.js renderer
   */
  createThreeJSMock() {
    return {
      domElement: document.createElement('canvas'),
      render: vi.fn(),
      setSize: vi.fn(),
      dispose: vi.fn(),
      capabilities: { maxTextureSize: 2048 },
      info: {
        memory: { geometries: 0, textures: 0 },
        render: { calls: 0, triangles: 0 }
      }
    };
  }
};

// Validation utilities
export const ValidationHelpers = {
  /**
   * Validate template structure
   */
  isValidTemplate(template: any): boolean {
    return !!(
      template.id &&
      template.name &&
      template.org_id &&
      template.user_id &&
      Array.isArray(template.template_elements) &&
      typeof template.width_pixels === 'number' &&
      typeof template.height_pixels === 'number'
    );
  },

  /**
   * Validate template element structure
   */
  isValidElement(element: any): boolean {
    return !!(
      element.id &&
      element.type &&
      element.variableName &&
      element.side &&
      typeof element.x === 'number' &&
      typeof element.y === 'number' &&
      typeof element.width === 'number' &&
      typeof element.height === 'number'
    );
  },

  /**
   * Validate organization scoping
   */
  isOrganizationScoped(data: any, expectedOrgId: string): boolean {
    return data.org_id === expectedOrgId;
  },

  /**
   * Validate file upload data
   */
  isValidFileUpload(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  },

  /**
   * Validate permissions for role
   */
  hasRequiredPermissions(userRole: string, requiredPermissions: string[]): boolean {
    const rolePermissions = {
      'super_admin': ['*'], // All permissions
      'org_admin': ['create_template', 'update_template', 'delete_template', 'manage_users'],
      'id_gen_admin': ['create_template', 'update_template', 'delete_template'],
      'id_gen_user': ['read_template', 'generate_id']
    };

    const permissions = rolePermissions[userRole as keyof typeof rolePermissions] || [];
    
    if (permissions.includes('*')) return true;
    
    return requiredPermissions.every(perm => permissions.includes(perm));
  },

  /**
   * Validate element property values
   */
  validateElementProperty(property: string, value: any, element: any): boolean {
    switch (property) {
      case 'x':
      case 'y':
      case 'width':
      case 'height':
        return typeof value === 'number' && value >= 0;
      case 'content':
        return typeof value === 'string' && value.length > 0;
      case 'fontSize':
        return typeof value === 'number' && value > 0 && value <= 72;
      case 'color':
        return typeof value === 'string' && /^#[0-9A-F]{6}$/i.test(value);
      default:
        return true;
    }
  },

  /**
   * Validate UUID format
   */
  isValidUUID(uuid: string): boolean {
    if (typeof uuid !== 'string') return false;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
};

// Test assertion helpers
export const AssertionHelpers = {
  /**
   * Assert template equality with flexible field checking
   */
  expectTemplateToMatch(actual: any, expected: Partial<TemplateData>) {
    Object.keys(expected).forEach(key => {
      expect(actual[key as keyof TemplateData]).toEqual(expected[key as keyof TemplateData]);
    });
  },

  /**
   * Assert element positioning is within bounds
   */
  expectElementInBounds(element: TemplateElement, templateWidth: number, templateHeight: number) {
    expect(element.x).toBeGreaterThanOrEqual(0);
    expect(element.y).toBeGreaterThanOrEqual(0);
    expect(element.x + element.width).toBeLessThanOrEqual(templateWidth);
    expect(element.y + element.height).toBeLessThanOrEqual(templateHeight);
  },

  /**
   * Assert organization data isolation
   */
  expectOrganizationIsolation(data: any[], orgId: string) {
    data.forEach(item => {
      expect(item.org_id).toBe(orgId);
    });
  },

  /**
   * Assert error structure
   */
  expectValidErrorStructure(error: any) {
    expect(error).toHaveProperty('message');
    expect(typeof error.message).toBe('string');
    expect(error.message.length).toBeGreaterThan(0);
  },

  /**
   * Assert async operation completion
   */
  async expectAsyncOperation(operation: Promise<any>, shouldSucceed = true) {
    if (shouldSucceed) {
      const result = await operation;
      expect(result).toBeTruthy();
      return result;
    } else {
      await expect(operation).rejects.toThrow();
    }
  }
};

// Performance testing utilities
export const PerformanceHelpers = {
  /**
   * Measure execution time of a function
   */
  async measureExecutionTime<T>(fn: () => Promise<T> | T): Promise<{ result: T; time: number }> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    
    return {
      result,
      time: endTime - startTime
    };
  },

  /**
   * Assert operation completes within time limit
   */
  async expectWithinTimeLimit<T>(
    operation: () => Promise<T> | T,
    maxTime: number,
    description = 'Operation'
  ): Promise<T> {
    const { result, time } = await this.measureExecutionTime(operation);
    
    expect(time).toBeLessThan(maxTime);
    
    return result;
  },

  /**
   * Simulate concurrent operations
   */
  async simulateConcurrentOperations<T>(
    operations: (() => Promise<T>)[],
    maxConcurrent = 10
  ): Promise<T[]> {
    const chunks = [];
    
    for (let i = 0; i < operations.length; i += maxConcurrent) {
      chunks.push(operations.slice(i, i + maxConcurrent));
    }
    
    const results: T[] = [];
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk.map(op => op()));
      results.push(...chunkResults);
    }
    
    return results;
  },

  /**
   * Memory usage tracking (simplified)
   */
  trackMemoryUsage() {
    const getMemoryUsage = () => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0; // Fallback for environments without memory API
    };

    const initial = getMemoryUsage();
    
    return {
      initial,
      current: () => getMemoryUsage(),
      difference: () => getMemoryUsage() - initial
    };
  }
};

// Database testing utilities
export const DatabaseHelpers = {
  /**
   * Create test data with proper relationships
   */
  async createTestDataSet(supabase: any) {
    const org = TestDataFactory.createOrganization();
    const user = TestDataFactory.createUserProfile({ org_id: org.id });
    const template = TestDataFactory.createTemplate({ 
      org_id: org.id, 
      user_id: user.id,
      template_elements: TestDataFactory.createElementSet()
    });
    const idCard = TestDataFactory.createIDCard({
      org_id: org.id,
      user_id: user.id,
      template_id: template.id
    });

    return { org, user, template, idCard };
  },

  /**
   * Clean up test data
   */
  async cleanupTestData(supabase: any, testData: any) {
    const { org, user, template, idCard } = testData;
    
    // Clean up in reverse dependency order
    if (idCard?.id) {
      await supabase.from('idcards').delete().eq('id', idCard.id);
    }
    if (template?.id) {
      await supabase.from('templates').delete().eq('id', template.id);
    }
    if (user?.id) {
      await supabase.from('profiles').delete().eq('id', user.id);
    }
    if (org?.id) {
      await supabase.from('organizations').delete().eq('id', org.id);
    }
  },

  /**
   * Verify database integrity
   */
  async verifyDataIntegrity(supabase: any, testData: any) {
    const { org, user, template, idCard } = testData;
    
    // Verify all records exist
    if (org?.id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', org.id)
        .single();
      expect(orgData).toBeTruthy();
    }
    
    if (user?.id) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      expect(userData).toBeTruthy();
      expect(userData.org_id).toBe(org.id);
    }
    
    if (template?.id) {
      const { data: templateData } = await supabase
        .from('templates')
        .select('*')
        .eq('id', template.id)
        .single();
      expect(templateData).toBeTruthy();
      expect(templateData.org_id).toBe(org.id);
      expect(templateData.user_id).toBe(user.id);
    }
    
    if (idCard?.id) {
      const { data: cardData } = await supabase
        .from('idcards')
        .select('*')
        .eq('id', idCard.id)
        .single();
      expect(cardData).toBeTruthy();
      expect(cardData.org_id).toBe(org.id);
      expect(cardData.user_id).toBe(user.id);
      expect(cardData.template_id).toBe(template.id);
    }
  }
};

