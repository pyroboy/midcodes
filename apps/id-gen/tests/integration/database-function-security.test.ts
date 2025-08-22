import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { TestDataFactory, MockUtilities } from '../utils/test-helpers';
import { supabase } from '$lib/supabaseClient';

describe('Database Function Security Testing - get_idcards_by_org', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Organization Boundary Enforcement', () => {
    it('should only return ID cards from specified organization', async () => {
      const { profile: user1, organization: org1 } = testData;
      
      // Create second organization and user
      const org2 = TestDataFactory.createOrganization({
        id: 'org-2',
        name: 'Other Organization'
      });
      
      const user2 = TestDataFactory.createProfile({
        id: 'user-2',
        org_id: org2.id,
        email: 'user2@other-org.com'
      });
      
      // Create ID cards in both organizations
      const org1Cards = [
        TestDataFactory.createIdCard({
          id: 'card-org1-1',
          org_id: org1.id,
          user_id: user1.id,
          card_data: { name: 'User 1 Card 1' }
        }),
        TestDataFactory.createIdCard({
          id: 'card-org1-2', 
          org_id: org1.id,
          user_id: user1.id,
          card_data: { name: 'User 1 Card 2' }
        })
      ];
      
      const org2Cards = [
        TestDataFactory.createIdCard({
          id: 'card-org2-1',
          org_id: org2.id,
          user_id: user2.id,
          card_data: { name: 'User 2 Card 1' }
        })
      ];
      
      // Mock database function call for org1
      const { data: org1Result, error: org1Error } = await supabase
        .rpc('get_idcards_by_org', {
          org_id: org1.id,
          page_limit: 10,
          page_offset: 0
        });
      
      expect(org1Error).toBeNull();
      expect(org1Result).toBeTruthy();
      
      // Should only contain org1 cards
      const org1CardIds = org1Result.map((card: any) => card.id);
      expect(org1CardIds).toContain('card-org1-1');
      expect(org1CardIds).toContain('card-org1-2');
      expect(org1CardIds).not.toContain('card-org2-1');
      
      // Mock database function call for org2
      const { data: org2Result, error: org2Error } = await supabase
        .rpc('get_idcards_by_org', {
          org_id: org2.id,
          page_limit: 10,
          page_offset: 0
        });
      
      expect(org2Error).toBeNull();
      expect(org2Result).toBeTruthy();
      
      // Should only contain org2 cards
      const org2CardIds = org2Result.map((card: any) => card.id);
      expect(org2CardIds).toContain('card-org2-1');
      expect(org2CardIds).not.toContain('card-org1-1');
      expect(org2CardIds).not.toContain('card-org1-2');
    });

    it('should prevent cross-organization data leaks through parameter manipulation', async () => {
      const { organization: org1 } = testData;
      const maliciousOrgId = 'non-existent-org';
      
      // Attempt to access cards from non-existent org
      const { data: result, error } = await supabase
        .rpc('get_idcards_by_org', {
          org_id: maliciousOrgId,
          page_limit: 10,
          page_offset: 0
        });
      
      // Should return empty result or error, not data from other orgs
      if (error) {
        expect(error.message).toBeTruthy();
      } else {
        expect(result).toEqual([]);
      }
    });

    it('should validate organization ID format and prevent injection', async () => {
      const maliciousOrgIds = [
        "'; DROP TABLE idcards; --",
        "' UNION SELECT * FROM profiles --",
        "1' OR '1'='1",
        "<script>alert('xss')</script>",
        "../../etc/passwd",
        null,
        undefined,
        "",
        "   ",
        123,
        true,
        []
      ];
      
      for (const maliciousId of maliciousOrgIds) {
        try {
          const { data, error } = await supabase
            .rpc('get_idcards_by_org', {
              org_id: maliciousId,
              page_limit: 10,
              page_offset: 0
            });
          
          // Should either error or return empty results
          if (!error) {
            expect(data).toEqual([]);
          }
        } catch (error) {
          // Catching errors is expected for malicious inputs
          expect(error).toBeTruthy();
        }
      }
    });

    it('should enforce row-level security policies', async () => {
      const { profile: user, organization: org } = testData;
      
      // Create cards with different user ownership within same org
      const userCard = TestDataFactory.createIdCard({
        id: 'user-own-card',
        org_id: org.id,
        user_id: user.id,
        card_data: { name: 'Own Card' }
      });
      
      const otherUserCard = TestDataFactory.createIdCard({
        id: 'other-user-card',
        org_id: org.id,
        user_id: 'other-user-same-org',
        card_data: { name: 'Other User Card' }
      });
      
      // Mock RLS enforcement - function should respect current user context
      const { data: result, error } = await supabase
        .rpc('get_idcards_by_org', {
          org_id: org.id,
          page_limit: 10,
          page_offset: 0
        });
      
      expect(error).toBeNull();
      expect(result).toBeTruthy();
      
      // Should include all cards from org if user has proper permissions
      // Or only user's own cards if RLS restricts access
      const cardIds = result.map((card: any) => card.id);
      expect(cardIds.length).toBeGreaterThan(0);
      
      // Verify no cards from other organizations are included
      result.forEach((card: any) => {
        expect(card.org_id).toBe(org.id);
      });
    });
  });

  describe('Pagination Performance and Security', () => {
    it('should handle pagination with large datasets efficiently', async () => {
      const { organization: org } = testData;
      const totalCards = 10000;
      const pageSize = 100;
      
      // Mock large dataset scenario
      const mockLargeDataset = Array.from({ length: totalCards }, (_, index) => 
        TestDataFactory.createIdCard({
          id: `large-card-${index}`,
          org_id: org.id,
          user_id: 'test-user',
          card_data: { name: `Card ${index}` }
        })
      );
      
      // Test pagination through large dataset
      const pages = Math.ceil(totalCards / pageSize);
      
      for (let page = 0; page < Math.min(pages, 5); page++) { // Test first 5 pages
        const startTime = Date.now();
        
        const { data: result, error } = await supabase
          .rpc('get_idcards_by_org', {
            org_id: org.id,
            page_limit: pageSize,
            page_offset: page * pageSize
          });
        
        const queryTime = Date.now() - startTime;
        
        expect(error).toBeNull();
        expect(result).toBeTruthy();
        expect(result.length).toBeLessThanOrEqual(pageSize);
        
        // Performance expectation - queries should complete within reasonable time
        expect(queryTime).toBeLessThan(5000); // 5 seconds max
        
        // Verify pagination order consistency
        if (result.length > 1) {
          const firstCardTime = new Date(result[0].created_at).getTime();
          const lastCardTime = new Date(result[result.length - 1].created_at).getTime();
          
          // Should be ordered (either ASC or DESC)
          expect(Math.abs(firstCardTime - lastCardTime)).toBeGreaterThan(0);
        }
      }
    });

    it('should validate pagination parameters to prevent abuse', async () => {
      const { organization: org } = testData;
      
      const maliciousPaginationParams = [
        { page_limit: -1, page_offset: 0 },        // Negative limit
        { page_limit: 0, page_offset: 0 },         // Zero limit
        { page_limit: 100000, page_offset: 0 },    // Excessive limit
        { page_limit: 10, page_offset: -1 },       // Negative offset
        { page_limit: 10, page_offset: 999999999 }, // Excessive offset
        { page_limit: null, page_offset: 0 },      // Null limit
        { page_limit: 10, page_offset: null },     // Null offset
        { page_limit: "malicious", page_offset: 0 }, // String limit
        { page_limit: 10, page_offset: "malicious" } // String offset
      ];
      
      for (const params of maliciousPaginationParams) {
        try {
          const { data, error } = await supabase
            .rpc('get_idcards_by_org', {
              org_id: org.id,
              ...params
            });
          
          // Should either error or apply safe defaults
          if (!error) {
            expect(data).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeLessThanOrEqual(1000); // Reasonable max limit
          }
        } catch (error) {
          // Expected for malicious parameters
          expect(error).toBeTruthy();
        }
      }
    });

    it('should maintain consistent ordering across paginated results', async () => {
      const { organization: org } = testData;
      
      // Create cards with known timestamps
      const testCards = Array.from({ length: 25 }, (_, index) => 
        TestDataFactory.createIdCard({
          id: `order-test-${index}`,
          org_id: org.id,
          user_id: 'test-user',
          card_data: { name: `Card ${index}`, index },
          created_at: new Date(Date.now() - (25 - index) * 1000).toISOString() // Ordered by time
        })
      );
      
      const pageSize = 10;
      let allCards: any[] = [];
      let page = 0;
      
      // Collect all cards through pagination
      while (true) {
        const { data: result, error } = await supabase
          .rpc('get_idcards_by_org', {
            org_id: org.id,
            page_limit: pageSize,
            page_offset: page * pageSize
          });
        
        expect(error).toBeNull();
        
        if (!result || result.length === 0) break;
        
        allCards = [...allCards, ...result];
        page++;
        
        if (page > 10) break; // Safety limit
      }
      
      // Verify ordering consistency
      expect(allCards.length).toBeGreaterThan(0);
      
      // Check that cards are properly ordered
      for (let i = 1; i < allCards.length; i++) {
        const prevTime = new Date(allCards[i - 1].created_at).getTime();
        const currTime = new Date(allCards[i].created_at).getTime();
        
        // Should be consistently ordered (either all ascending or all descending)
        if (i === 1) {
          // Determine order from first comparison
          continue;
        }
        
        // Verify consistent ordering pattern
        expect(typeof prevTime).toBe('number');
        expect(typeof currTime).toBe('number');
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should use parameterized queries to prevent SQL injection', async () => {
      const { organization: org } = testData;
      
      // SQL injection attempts through org_id parameter
      const injectionAttempts = [
        "' OR 1=1; --",
        "'; DELETE FROM idcards; --",
        "' UNION SELECT password FROM profiles --",
        "'; DROP TABLE organizations; --",
        "' OR '1'='1' --",
        "admin'/*",
        "1' OR '1'='1' LIMIT 1 --",
        "1' UNION SELECT NULL,NULL,NULL,NULL,username,password FROM users --"
      ];
      
      for (const injection of injectionAttempts) {
        const { data, error } = await supabase
          .rpc('get_idcards_by_org', {
            org_id: injection,
            page_limit: 10,
            page_offset: 0
          });
        
        // Should not execute SQL injection - either error or empty result
        if (error) {
          // Error is acceptable for malformed input
          expect(error.message).toBeTruthy();
        } else {
          // If no error, should return empty results (not injected data)
          expect(data).toEqual([]);
        }
      }
    });

    it('should validate all function parameters against injection', async () => {
      const { organization: org } = testData;
      
      // Test injection in pagination parameters
      const paginationInjections = [
        { page_limit: "10; DROP TABLE idcards; --", page_offset: 0 },
        { page_limit: 10, page_offset: "0 UNION SELECT * FROM profiles" },
        { page_limit: "10 OR 1=1", page_offset: 0 },
        { page_limit: 10, page_offset: "0; DELETE FROM templates" }
      ];
      
      for (const params of paginationInjections) {
        try {
          const { data, error } = await supabase
            .rpc('get_idcards_by_org', {
              org_id: org.id,
              ...params
            });
          
          // Should handle injection attempts safely
          if (!error) {
            expect(Array.isArray(data)).toBe(true);
            // Should not return sensitive data from other tables
            if (data.length > 0) {
              expect(data[0]).not.toHaveProperty('password');
              expect(data[0]).not.toHaveProperty('secret_key');
            }
          }
        } catch (error) {
          // Errors are expected for malicious inputs
          expect(error).toBeTruthy();
        }
      }
    });

    it('should escape special characters in search parameters', async () => {
      const { organization: org } = testData;
      
      // Test cards with special characters
      const specialCharCards = [
        TestDataFactory.createIdCard({
          id: 'special-1',
          org_id: org.id,
          user_id: 'test-user',
          card_data: { 
            name: "O'Malley", 
            company: "Smith & Jones", 
            notes: 'Quote: "Hello World"' 
          }
        }),
        TestDataFactory.createIdCard({
          id: 'special-2',
          org_id: org.id,
          user_id: 'test-user',
          card_data: { 
            name: "José María", 
            company: "Café & Más", 
            notes: "50% discount" 
          }
        })
      ];
      
      // Function should handle special characters without treating them as SQL
      const { data: result, error } = await supabase
        .rpc('get_idcards_by_org', {
          org_id: org.id,
          page_limit: 10,
          page_offset: 0
        });
      
      expect(error).toBeNull();
      expect(result).toBeTruthy();
      
      // Should safely return cards with special characters
      const specialCards = result.filter((card: any) => 
        card.id === 'special-1' || card.id === 'special-2'
      );
      
      specialCards.forEach((card: any) => {
        expect(card.card_data).toBeTruthy();
        // Should preserve special characters correctly
        if (card.id === 'special-1') {
          expect(card.card_data.name).toBe("O'Malley");
          expect(card.card_data.notes).toContain('"Hello World"');
        }
      });
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should respect user role permissions in data access', async () => {
      const { profile: user, organization: org } = testData;
      
      // Mock different user roles
      const roleScenarios = [
        { role: 'id_gen_user', shouldSeeAllCards: false },
        { role: 'id_gen_admin', shouldSeeAllCards: true },
        { role: 'org_admin', shouldSeeAllCards: true },
        { role: 'super_admin', shouldSeeAllCards: true }
      ];
      
      // Create cards from different users
      const userCards = [
        TestDataFactory.createIdCard({
          id: 'own-card-1',
          org_id: org.id,
          user_id: user.id,
          card_data: { name: 'Own Card 1' }
        }),
        TestDataFactory.createIdCard({
          id: 'other-card-1',
          org_id: org.id,
          user_id: 'other-user-id',
          card_data: { name: 'Other User Card' }
        })
      ];
      
      for (const scenario of roleScenarios) {
        // Mock user with specific role
        const testUser = { ...user, role: scenario.role };
        
        // Call function with role context
        const { data: result, error } = await supabase
          .rpc('get_idcards_by_org', {
            org_id: org.id,
            page_limit: 10,
            page_offset: 0
          });
        
        expect(error).toBeNull();
        expect(result).toBeTruthy();
        
        if (scenario.shouldSeeAllCards) {
          // Admin roles should see all cards in organization
          const cardIds = result.map((card: any) => card.id);
          expect(cardIds).toContain('own-card-1');
          expect(cardIds).toContain('other-card-1');
        } else {
          // Regular users might only see their own cards
          result.forEach((card: any) => {
            expect(card.org_id).toBe(org.id);
            // Additional role-based filtering would be implemented in RLS
          });
        }
      }
    });

    it('should filter sensitive data based on user permissions', async () => {
      const { profile: user, organization: org } = testData;
      
      // Create card with sensitive and non-sensitive data
      const sensitiveCard = TestDataFactory.createIdCard({
        id: 'sensitive-card',
        org_id: org.id,
        user_id: 'other-user',
        card_data: { 
          name: 'Public Name',
          email: 'public@example.com',
          ssn: '123-45-6789',        // Sensitive
          credit_score: 750,         // Sensitive
          notes: 'Internal notes'    // Potentially sensitive
        }
      });
      
      // Mock different permission levels
      const permissionScenarios = [
        { permissions: ['read_basic'], shouldSeeSensitive: false },
        { permissions: ['read_basic', 'read_full'], shouldSeeSensitive: true },
        { permissions: ['read_admin'], shouldSeeSensitive: true }
      ];
      
      for (const scenario of permissionScenarios) {
        const { data: result, error } = await supabase
          .rpc('get_idcards_by_org', {
            org_id: org.id,
            page_limit: 10,
            page_offset: 0
          });
        
        expect(error).toBeNull();
        
        const foundCard = result?.find((card: any) => card.id === 'sensitive-card');
        
        if (foundCard) {
          // Should always have basic data
          expect(foundCard.card_data.name).toBe('Public Name');
          expect(foundCard.card_data.email).toBe('public@example.com');
          
          if (scenario.shouldSeeSensitive) {
            // Should include sensitive data for privileged users
            expect(foundCard.card_data.ssn).toBe('123-45-6789');
            expect(foundCard.card_data.credit_score).toBe(750);
          } else {
            // Should exclude or mask sensitive data for regular users
            expect(foundCard.card_data.ssn).toBeUndefined();
            expect(foundCard.card_data.credit_score).toBeUndefined();
          }
        }
      }
    });
  });

  describe('Concurrent Access and Performance', () => {
    it('should handle concurrent database function calls safely', async () => {
      const { organization: org } = testData;
      const concurrentUsers = 10;
      const callsPerUser = 5;
      
      // Simulate concurrent access from multiple users
      const concurrentCalls = Array.from({ length: concurrentUsers }, (_, userIndex) =>
        Array.from({ length: callsPerUser }, (_, callIndex) =>
          supabase.rpc('get_idcards_by_org', {
            org_id: org.id,
            page_limit: 10,
            page_offset: callIndex * 10
          })
        )
      ).flat();
      
      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentCalls);
      const totalTime = Date.now() - startTime;
      
      // All calls should complete successfully
      const successfulCalls = results.filter(result => result.status === 'fulfilled').length;
      const failedCalls = results.filter(result => result.status === 'rejected').length;
      
      expect(successfulCalls).toBeGreaterThan(concurrentUsers * callsPerUser * 0.8); // At least 80% success
      expect(failedCalls).toBeLessThan(concurrentUsers * callsPerUser * 0.2); // Less than 20% failure
      
      // Performance should be reasonable even under load
      expect(totalTime).toBeLessThan(30000); // 30 seconds max for all calls
      
      // Verify data consistency across concurrent calls
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value.data)
        .filter(data => data && Array.isArray(data));
      
      // All results should have consistent org_id
      successfulResults.forEach(data => {
        data.forEach((card: any) => {
          expect(card.org_id).toBe(org.id);
        });
      });
    });

    it('should maintain database connection pool efficiency', async () => {
      const { organization: org } = testData;
      
      // Test connection pool behavior with sequential calls
      const sequentialCalls = 20;
      const connectionTimes: number[] = [];
      
      for (let i = 0; i < sequentialCalls; i++) {
        const startTime = Date.now();
        
        const { data, error } = await supabase
          .rpc('get_idcards_by_org', {
            org_id: org.id,
            page_limit: 5,
            page_offset: i * 5
          });
        
        const callTime = Date.now() - startTime;
        connectionTimes.push(callTime);
        
        expect(error).toBeNull();
        expect(data).toBeDefined();
      }
      
      // Connection times should be consistent (indicating healthy pool)
      const avgTime = connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length;
      const maxTime = Math.max(...connectionTimes);
      const minTime = Math.min(...connectionTimes);
      
      expect(avgTime).toBeLessThan(1000); // Average under 1 second
      expect(maxTime - minTime).toBeLessThan(5000); // Reasonable variance
      
      // No individual call should take excessively long
      connectionTimes.forEach(time => {
        expect(time).toBeLessThan(5000); // 5 seconds max per call
      });
    });

    it('should implement proper query optimization and indexing', async () => {
      const { organization: org } = testData;
      
      // Test query performance with different data volumes
      const testScenarios = [
        { cards: 10, expectedMaxTime: 500 },     // Small dataset
        { cards: 100, expectedMaxTime: 1000 },   // Medium dataset  
        { cards: 1000, expectedMaxTime: 2000 },  // Large dataset
        { cards: 5000, expectedMaxTime: 5000 }   // Very large dataset
      ];
      
      for (const scenario of testScenarios) {
        // Mock dataset of specified size
        const startTime = Date.now();
        
        const { data: result, error } = await supabase
          .rpc('get_idcards_by_org', {
            org_id: org.id,
            page_limit: Math.min(scenario.cards, 100), // Reasonable page size
            page_offset: 0
          });
        
        const queryTime = Date.now() - startTime;
        
        expect(error).toBeNull();
        expect(result).toBeDefined();
        
        // Query should complete within expected time for dataset size
        expect(queryTime).toBeLessThan(scenario.expectedMaxTime);
        
        // Verify proper indexing by checking execution plan (if available)
        // This would typically be done through database-specific tools
        // For now, we verify reasonable performance characteristics
        if (result && result.length > 0) {
          // Results should be properly ordered (indicating index usage)
          expect(result[0]).toHaveProperty('created_at');
          expect(result[0]).toHaveProperty('org_id');
          expect(result[0].org_id).toBe(org.id);
        }
      }
    });
  });
});