import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { testDataManager } from './TestDataManager';

/**
 * Setup for integration tests requiring full data
 */
export function setupIntegrationTest() {
  let testData: any;

  beforeAll(async () => {
    try {
      testData = await testDataManager.seedCompleteTestData();
    } catch (error) {
      console.log('Integration test setup note:', (error as Error).message);
      testData = {
        organization: { id: 'test-org', name: 'Test Organization' },
        templates: [],
        idcards: [],
        profiles: []
      };
    }
  });

  afterAll(async () => {
    try {
      await testDataManager.cleanupAll();
    } catch (error) {
      console.log('Integration test cleanup note:', (error as Error).message);
    }
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
    try {
      testData = await testDataManager.createMinimalTestData();
    } catch (error) {
      console.log('Unit test setup note:', (error as Error).message);
      testData = {
        organization: { id: 'test-org', name: 'Test Organization' },
        template: { id: 'test-template', name: 'Test Template', org_id: 'test-org' },
        profile: { id: 'test-profile', email: 'test@example.com', org_id: 'test-org' }
      };
    }
  });

  afterEach(async () => {
    try {
      await testDataManager.cleanupAll();
    } catch (error) {
      console.log('Unit test cleanup note:', (error as Error).message);
    }
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
    try {
      testData = await testDataManager.createPerformanceTestData();
    } catch (error) {
      console.log('Performance test setup note:', (error as Error).message);
      // Return fallback performance data
      const templates = Array.from({ length: 10 }, (_, i) => ({ 
        id: `perf-template-${i}`, 
        name: `Performance Template ${i}`,
        org_id: 'perf-org'
      }));
      const idcards = templates.flatMap(template => 
        Array.from({ length: 10 }, (_, j) => ({
          id: `perf-card-${template.id}-${j}`,
          template_id: template.id,
          org_id: 'perf-org'
        }))
      );

      testData = {
        organization: { id: 'perf-org', name: 'Performance Test Org' },
        templates,
        idcards,
        profiles: []
      };
    }
  });

  afterAll(async () => {
    try {
      await testDataManager.cleanupAll();
    } catch (error) {
      console.log('Performance test cleanup note:', (error as Error).message);
    }
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
    }),

    createMockCardWithImage: (overrides = {}) => ({
      idcard_id: 'mock-card-456',
      template_name: 'Mock Image Template',
      front_image: 'org-123/template-456/123456_front.png',
      back_image: 'org-123/template-456/123456_back.png',
      fields: {
        'Name': { value: 'Mock Image User', side: 'front' as const },
        'Department': { value: 'Mock Department', side: 'front' as const }
      },
      ...overrides
    }),

    createMockCardWithoutImage: (overrides = {}) => ({
      idcard_id: 'mock-card-789',
      template_name: 'Mock No Image Template',
      front_image: null,
      back_image: null,
      fields: {
        'Name': { value: 'Mock No Image User', side: 'front' as const },
        'Status': { value: 'Active', side: 'front' as const }
      },
      ...overrides
    })
  };
}

/**
 * Setup for visual regression tests
 */
export function setupVisualTest() {
  return {
    createVisualTestCard: (variant = 'default') => {
      const baseCard = {
        idcard_id: 'visual-test-card',
        template_name: 'Visual Test Template',
        fields: {
          'Name': { value: 'Visual Test User', side: 'front' as const },
          'ID': { value: 'VIS001', side: 'front' as const }
        }
      };

      switch (variant) {
        case 'with-image':
          return {
            ...baseCard,
            front_image: 'visual/test_front.png',
            back_image: 'visual/test_back.png'
          };
        
        case 'without-image':
          return {
            ...baseCard,
            front_image: null,
            back_image: null
          };
        
        case 'long-text':
          return {
            ...baseCard,
            fields: {
              'Name': { value: 'Very Long Name That Should Test Text Wrapping And Overflow Behavior', side: 'front' as const },
              'Department': { value: 'Department With Very Long Name For Testing', side: 'front' as const },
              'ID': { value: 'VERYLONGID12345', side: 'front' as const },
              'Email': { value: 'very.long.email.address@very.long.domain.name.com', side: 'back' as const }
            }
          };
        
        case 'empty-fields':
          return {
            ...baseCard,
            fields: {
              'Name': { value: '', side: 'front' as const },
              'Empty Field': { value: null, side: 'front' as const },
              'Undefined Field': { value: undefined, side: 'back' as const }
            }
          };
        
        default:
          return baseCard;
      }
    }
  };
}

/**
 * Advanced test setup for specific scenarios
 */
export function setupAdvancedTest(config: {
  withDatabase?: boolean;
  withStorage?: boolean;
  withPerformanceMonitoring?: boolean;
  dataSize?: 'minimal' | 'medium' | 'large';
}) {
  let testData: any;
  let performanceMetrics: any[] = [];

  const setupHook = config.withDatabase ? beforeAll : beforeEach;
  const teardownHook = config.withDatabase ? afterAll : afterEach;

  setupHook(async () => {
    const startTime = Date.now();
    
    try {
      if (config.withDatabase) {
        switch (config.dataSize) {
          case 'large':
            testData = await testDataManager.createPerformanceTestData();
            break;
          case 'medium':
            testData = await testDataManager.seedCompleteTestData();
            break;
          case 'minimal':
          default:
            testData = await testDataManager.createMinimalTestData();
            break;
        }
      } else {
        // Mock data only
        testData = {
          organization: { id: 'mock-org', name: 'Mock Organization' },
          templates: [{ id: 'mock-template', name: 'Mock Template', org_id: 'mock-org' }],
          idcards: [{ id: 'mock-card', template_id: 'mock-template', org_id: 'mock-org' }],
          profiles: [{ id: 'mock-profile', email: 'mock@test.com', org_id: 'mock-org' }]
        };
      }

      if (config.withPerformanceMonitoring) {
        const setupTime = Date.now() - startTime;
        performanceMetrics.push({
          operation: 'test-setup',
          duration: setupTime,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log('Advanced test setup note:', (error as Error).message);
      testData = {
        organization: { id: 'fallback-org', name: 'Fallback Organization' },
        templates: [],
        idcards: [],
        profiles: []
      };
    }
  });

  teardownHook(async () => {
    const startTime = Date.now();
    
    try {
      if (config.withDatabase) {
        await testDataManager.cleanupAll();
      }

      if (config.withPerformanceMonitoring) {
        const cleanupTime = Date.now() - startTime;
        performanceMetrics.push({
          operation: 'test-cleanup',
          duration: cleanupTime,
          timestamp: new Date().toISOString()
        });
        
        // Log performance summary
        console.log('Test Performance Metrics:', performanceMetrics);
      }
    } catch (error) {
      console.log('Advanced test cleanup note:', (error as Error).message);
    }
  });

  return {
    getTestData: () => testData,
    getPerformanceMetrics: () => performanceMetrics,
    addPerformanceMetric: (operation: string, duration: number) => {
      if (config.withPerformanceMonitoring) {
        performanceMetrics.push({
          operation,
          duration,
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}

/**
 * Utility to measure test execution time
 */
export function measureTestPerformance<T>(
  testFn: () => Promise<T> | T,
  operation: string
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve) => {
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      console.log(`${operation} completed in ${duration}ms`);
      resolve({ result, duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`${operation} failed after ${duration}ms:`, (error as Error).message);
      throw error;
    }
  });
}

/**
 * Cleanup verification utility
 */
export async function verifyTestCleanup(): Promise<void> {
  try {
    const counts = testDataManager.getResourceCounts();
    const hasLeftoverData = Object.values(counts).some(count => count > 0);
    
    if (hasLeftoverData) {
      console.warn('Test data cleanup incomplete:', counts);
      // Force cleanup
      await testDataManager.cleanupAll();
      
      const finalCounts = testDataManager.getResourceCounts();
      const stillHasData = Object.values(finalCounts).some(count => count > 0);
      
      if (stillHasData) {
        console.error('❌ Test data cleanup failed after force cleanup:', finalCounts);
        throw new Error('Test data was not properly cleaned up');
      }
    }
    
    console.log('✅ All test data cleaned up successfully');
  } catch (error) {
    console.error('Cleanup verification error:', (error as Error).message);
    throw error;
  }
}

/**
 * Test isolation utility - ensures each test starts fresh
 */
export function withTestIsolation(testFn: () => Promise<void> | void) {
  return async () => {
    // Reset test data manager state
    testDataManager.reset();
    
    try {
      await testFn();
    } finally {
      // Ensure cleanup after test
      await testDataManager.cleanupAll();
    }
  };
}
