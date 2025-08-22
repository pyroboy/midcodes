import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  getUserCredits,
  deductCardGenerationCredit,
  addCredits,
  getCreditHistory,
  type UserCredits
} from '$lib/utils/credits';
import { setupPerformanceTest, measureTestPerformance } from '../utils/testSetup';
import { testDataManager } from '../utils/TestDataManager';

describe('Credits Performance Tests', () => {
  const testSetup = setupPerformanceTest();
  let testOrg: any;
  let testUsers: any[] = [];

  beforeAll(async () => {
    const testData = await testSetup.getTestData();
    testOrg = testData.organization;
    
    // Create multiple users for concurrent testing
    for (let i = 0; i < 10; i++) {
      const profiles = await testDataManager.createTestProfiles(testOrg.id);
      testUsers.push(...profiles);
    }
  });

  describe('Single Operation Performance', () => {
    it('should retrieve user credits quickly', async () => {
      const testUser = testUsers[0];
      
      const { result, duration } = await measureTestPerformance(
        () => getUserCredits(testUser.id),
        'getUserCredits'
      );

      expect(result).toBeTruthy();
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    it('should add credits efficiently', async () => {
      const testUser = testUsers[1];
      
      const { result, duration } = await measureTestPerformance(
        () => addCredits(testUser.id, testOrg.id, 100, `perf-test-${Date.now()}`),
        'addCredits'
      );

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should deduct credits efficiently', async () => {
      const testUser = testUsers[2];
      
      // Ensure user has credits and is above free limit
      await addCredits(testUser.id, testOrg.id, 50, 'setup-credits');
      const { supabase } = await import('$lib/supabaseClient');
      await supabase
        .from('profiles')
        .update({ card_generation_count: 15 })
        .eq('id', testUser.id);

      const { result, duration } = await measureTestPerformance(
        () => deductCardGenerationCredit(testUser.id, testOrg.id, `perf-card-${Date.now()}`),
        'deductCardGenerationCredit'
      );

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(800); // Should complete within 800ms
    });

    it('should fetch credit history efficiently', async () => {
      const testUser = testUsers[3];
      
      // Add some transaction history
      for (let i = 0; i < 5; i++) {
        await addCredits(testUser.id, testOrg.id, 10, `history-${i}`);
      }

      const { result, duration } = await measureTestPerformance(
        () => getCreditHistory(testUser.id, 20),
        'getCreditHistory'
      );

      expect(Array.isArray(result)).toBe(true);
      expect(duration).toBeLessThan(600); // Should complete within 600ms
    });
  });

  describe('Batch Operations Performance', () => {
    it('should handle multiple credit additions efficiently', async () => {
      const testUser = testUsers[4];
      const batchSize = 10;
      
      const { result, duration } = await measureTestPerformance(
        async () => {
          const promises = [];
          for (let i = 0; i < batchSize; i++) {
            promises.push(
              addCredits(testUser.id, testOrg.id, 10, `batch-${i}-${Date.now()}`)
            );
          }
          return Promise.all(promises);
        },
        'batchAddCredits'
      );

      expect(result).toHaveLength(batchSize);
      result.forEach(res => expect(res.success).toBe(true));
      expect(duration).toBeLessThan(5000); // Batch should complete within 5 seconds
      
      // Calculate average time per operation
      const avgTimePerOp = duration / batchSize;
      expect(avgTimePerOp).toBeLessThan(500); // Average should be under 500ms
    });

    it('should handle multiple credit deductions efficiently', async () => {
      const testUser = testUsers[5];
      
      // Setup user with credits and high generation count
      await addCredits(testUser.id, testOrg.id, 100, 'batch-setup');
      const { supabase } = await import('$lib/supabaseClient');
      await supabase
        .from('profiles')
        .update({ card_generation_count: 20 })
        .eq('id', testUser.id);

      const batchSize = 5; // Fewer operations to avoid running out of credits
      
      const { result, duration } = await measureTestPerformance(
        async () => {
          const promises = [];
          for (let i = 0; i < batchSize; i++) {
            promises.push(
              deductCardGenerationCredit(testUser.id, testOrg.id, `batch-deduct-${i}-${Date.now()}`)
            );
          }
          return Promise.all(promises);
        },
        'batchDeductCredits'
      );

      expect(result).toHaveLength(batchSize);
      // Some operations might fail due to race conditions, but most should succeed
      const successCount = result.filter(res => res.success).length;
      expect(successCount).toBeGreaterThan(batchSize / 2);
      expect(duration).toBeLessThan(4000); // Batch should complete within 4 seconds
    });
  });

  describe('Concurrent User Operations', () => {
    it('should handle concurrent credit retrievals', async () => {
      const concurrentUsers = testUsers.slice(0, 5);
      
      const { result, duration } = await measureTestPerformance(
        async () => {
          const promises = concurrentUsers.map(user => getUserCredits(user.id));
          return Promise.allSettled(promises);
        },
        'concurrentGetCredits'
      );

      expect(result).toHaveLength(concurrentUsers.length);
      const successCount = result.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBe(concurrentUsers.length);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent credit additions by different users', async () => {
      const concurrentUsers = testUsers.slice(0, 3);
      
      const { result, duration } = await measureTestPerformance(
        async () => {
          const promises = concurrentUsers.map((user, index) => 
            addCredits(user.id, testOrg.id, 25, `concurrent-${index}-${Date.now()}`)
          );
          return Promise.allSettled(promises);
        },
        'concurrentAddCredits'
      );

      expect(result).toHaveLength(concurrentUsers.length);
      const successCount = result.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      expect(successCount).toBe(concurrentUsers.length);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle race conditions gracefully for same user', async () => {
      const testUser = testUsers[6];
      
      // Setup user with sufficient credits
      await addCredits(testUser.id, testOrg.id, 50, 'race-setup');
      const { supabase } = await import('$lib/supabaseClient');
      await supabase
        .from('profiles')
        .update({ card_generation_count: 25 })
        .eq('id', testUser.id);

      const concurrentOps = 3;
      
      const { result, duration } = await measureTestPerformance(
        async () => {
          const promises = [];
          for (let i = 0; i < concurrentOps; i++) {
            promises.push(
              deductCardGenerationCredit(testUser.id, testOrg.id, `race-${i}-${Date.now()}`)
            );
          }
          return Promise.allSettled(promises);
        },
        'raceConditionTest'
      );

      expect(result).toHaveLength(concurrentOps);
      
      // Count successful operations
      const successCount = result.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      
      // Should have some successes but may have failures due to race conditions
      expect(successCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThanOrEqual(concurrentOps);
      expect(duration).toBeLessThan(2000);

      // Verify final balance consistency
      const finalCredits = await getUserCredits(testUser.id);
      expect(finalCredits).toBeTruthy();
      expect(finalCredits!.credits_balance).toBeGreaterThanOrEqual(50 - concurrentOps);
    });
  });

  describe('High Volume Operations', () => {
    it('should handle high volume credit history retrieval', async () => {
      const testUser = testUsers[7];
      
      // Create a user with substantial transaction history
      for (let i = 0; i < 20; i++) {
        await addCredits(testUser.id, testOrg.id, 5, `volume-${i}`);
      }

      const { result, duration } = await measureTestPerformance(
        () => getCreditHistory(testUser.id, 100),
        'highVolumeCreditHistory'
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(15); // Should have substantial history
      expect(duration).toBeLessThan(1500); // Should complete within 1.5 seconds
      
      // Verify data integrity
      result.forEach(txn => {
        expect(txn).toHaveProperty('id');
        expect(txn).toHaveProperty('transaction_type');
        expect(txn).toHaveProperty('amount');
        expect(txn).toHaveProperty('credits_before');
        expect(txn).toHaveProperty('credits_after');
        expect(txn.user_id).toBe(testUser.id);
        expect(txn.org_id).toBe(testOrg.id);
      });
    });

    it('should maintain performance under memory pressure', async () => {
      const testUser = testUsers[8];
      
      // Create large arrays to simulate memory pressure
      const largeArrays = [];
      for (let i = 0; i < 10; i++) {
        largeArrays.push(new Array(10000).fill(`data-${i}`));
      }

      const { result, duration } = await measureTestPerformance(
        () => getUserCredits(testUser.id),
        'memoryPressureTest'
      );

      // Clean up large arrays
      largeArrays.length = 0;

      expect(result).toBeTruthy();
      expect(duration).toBeLessThan(1000); // Should still complete within 1 second
    });
  });

  describe('Error Handling Performance', () => {
    it('should fail fast for non-existent users', async () => {
      const { result, duration } = await measureTestPerformance(
        () => getUserCredits('non-existent-user-12345'),
        'nonExistentUser'
      );

      expect(result).toBeNull();
      expect(duration).toBeLessThan(300); // Should fail quickly
    });

    it('should handle insufficient credits efficiently', async () => {
      const testUser = testUsers[9];
      
      // Ensure user has no credits
      const { supabase } = await import('$lib/supabaseClient');
      await supabase
        .from('profiles')
        .update({ 
          credits_balance: 0,
          card_generation_count: 20 // Above free limit
        })
        .eq('id', testUser.id);

      const { result, duration } = await measureTestPerformance(
        () => deductCardGenerationCredit(testUser.id, testOrg.id, 'fail-fast-test'),
        'insufficientCredits'
      );

      expect(result.success).toBe(false);
      expect(duration).toBeLessThan(400); // Should fail fast
    });
  });

  describe('Scalability Metrics', () => {
    it('should maintain reasonable performance across different load levels', async () => {
      const loadLevels = [1, 3, 5, 7];
      const performanceMetrics: { load: number; duration: number; avgPerOp: number }[] = [];

      for (const load of loadLevels) {
        const testUser = testUsers[load % testUsers.length];
        
        const { duration } = await measureTestPerformance(
          async () => {
            const promises = [];
            for (let i = 0; i < load; i++) {
              promises.push(getUserCredits(testUser.id));
            }
            return Promise.all(promises);
          },
          `loadLevel${load}`
        );

        const avgPerOp = duration / load;
        performanceMetrics.push({ load, duration, avgPerOp });
        
        // Each load level should complete within reasonable time
        expect(duration).toBeLessThan(load * 300);
      }

      // Performance should degrade gracefully (not exponentially)
      for (let i = 1; i < performanceMetrics.length; i++) {
        const current = performanceMetrics[i];
        const previous = performanceMetrics[i - 1];
        
        // Average per operation should not increase dramatically
        const increase = current.avgPerOp / previous.avgPerOp;
        expect(increase).toBeLessThan(3); // Should not triple
      }
    });

    it('should handle database timeout scenarios', async () => {
      const testUser = testUsers[0];
      
      // This test simulates a scenario where database might be slow
      // We test that the operation doesn't hang indefinitely
      const timeoutPromise = new Promise<UserCredits | null>((resolve) => {
        setTimeout(() => resolve(null), 5000); // 5 second timeout
      });

      const { result, duration } = await measureTestPerformance(
        () => Promise.race([
          getUserCredits(testUser.id),
          timeoutPromise
        ]),
        'databaseTimeoutTest'
      );

      // Should complete before timeout
      expect(duration).toBeLessThan(5000);
      
      if (result) {
        expect(result).toHaveProperty('credits_balance');
      }
    });
  });

  describe('Memory Usage and Cleanup', () => {
    it('should not leak memory during repeated operations', async () => {
      const testUser = testUsers[0];
      const iterations = 20;
      
      // Measure memory before
      const memBefore = process.memoryUsage();
      
      const { duration } = await measureTestPerformance(
        async () => {
          for (let i = 0; i < iterations; i++) {
            await getUserCredits(testUser.id);
            
            // Force garbage collection if available
            if (global.gc) {
              global.gc();
            }
          }
        },
        'memoryLeakTest'
      );

      // Measure memory after
      const memAfter = process.memoryUsage();
      
      // Memory increase should be reasonable
      const heapIncrease = memAfter.heapUsed - memBefore.heapUsed;
      const heapIncreasePerOp = heapIncrease / iterations;
      
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(heapIncreasePerOp).toBeLessThan(100000); // Should not increase more than 100KB per operation
    });
  });

  afterAll(() => {
    // If the test setup has performance metrics, log them
    if ('getPerformanceMetrics' in testSetup && typeof (testSetup as any).getPerformanceMetrics === 'function') {
      const metrics = (testSetup as any).getPerformanceMetrics();
      console.log('\nCredits Performance Test Summary:');
      console.log('=================================');
      metrics.forEach((metric: any) => {
        console.log(`${metric.operation}: ${metric.duration}ms`);
      });
      
      // Calculate average performance
      const avgDuration = metrics.reduce((sum: number, m: any) => sum + m.duration, 0) / metrics.length;
      console.log(`Average operation time: ${avgDuration.toFixed(2)}ms`);
      
      // Performance threshold validation
      const slowOperations = metrics.filter((m: any) => m.duration > 2000);
      if (slowOperations.length > 0) {
        console.warn(`Warning: ${slowOperations.length} operations took longer than 2 seconds:`);
        slowOperations.forEach((op: any) => console.warn(`  ${op.operation}: ${op.duration}ms`));
      }
    } else {
      console.log('\nPerformance metrics not available from test setup.');
    }
  });
});
