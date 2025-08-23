import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  getUserCredits,
  canCreateTemplate,
  canGenerateCard,
  deductCardGenerationCredit,
  addCredits,
  grantUnlimitedTemplates,
  grantWatermarkRemoval,
  incrementTemplateCount,
  getCreditHistory,
  type UserCredits,
  type CreditTransaction
} from '$lib/utils/credits';
import { setupIntegrationTest } from '../utils/testSetup';
import { testDataManager } from '../utils/TestDataManager';

describe('Credits Integration Tests', () => {
  const testSetup = setupIntegrationTest();
  let testUser: any;
  let testOrg: any;

  beforeAll(async () => {
    const testData = testSetup.getTestData();
    testOrg = testData.organization;
    testUser = testData.profiles?.[0]; // Get first test user
    
    if (!testUser) {
      // Create a test user if not available
      const profiles = await testDataManager.createTestProfiles(testOrg.id);
      testUser = profiles[0];
    }
  });

  describe('getUserCredits Integration', () => {
    it('should retrieve actual user credits from database', async () => {
      const credits = await getUserCredits(testUser.id);
      
      expect(credits).toBeTruthy();
      expect(credits).toHaveProperty('credits_balance');
      expect(credits).toHaveProperty('card_generation_count');
      expect(credits).toHaveProperty('template_count');
      expect(credits).toHaveProperty('unlimited_templates');
      expect(credits).toHaveProperty('remove_watermarks');
      
      expect(typeof credits!.credits_balance).toBe('number');
      expect(typeof credits!.card_generation_count).toBe('number');
      expect(typeof credits!.template_count).toBe('number');
      expect(typeof credits!.unlimited_templates).toBe('boolean');
      expect(typeof credits!.remove_watermarks).toBe('boolean');
    });

    it('should return null for non-existent user', async () => {
      const credits = await getUserCredits('non-existent-user-id');
      expect(credits).toBeNull();
    });
  });

  describe('Template Creation Flow Integration', () => {
    it('should allow template creation for user with unlimited templates', async () => {
      // First grant unlimited templates
      const grantResult = await grantUnlimitedTemplates(testUser.id, testOrg.id, 'test-payment-ref');
      expect(grantResult.success).toBe(true);
      
      // Then check if template creation is allowed
      const canCreate = await canCreateTemplate(testUser.id);
      expect(canCreate).toBe(true);
      
      // Increment template count multiple times
      for (let i = 0; i < 5; i++) {
        const incrementResult = await incrementTemplateCount(testUser.id);
        expect(incrementResult.success).toBe(true);
      }
      
      // Should still be able to create more templates
      const canCreateMore = await canCreateTemplate(testUser.id);
      expect(canCreateMore).toBe(true);
    });

    it('should enforce template limits for users without unlimited feature', async () => {
      // Create a new test user without unlimited templates
      const newProfiles = await testDataManager.createTestProfiles(testOrg.id);
      const limitedUser = newProfiles.find((p: any) => !p.unlimited_templates);
      
      expect(limitedUser).toBeTruthy();
      if (!limitedUser) return;
      
      // Should be able to create templates up to limit
      let canCreate = await canCreateTemplate(limitedUser.id);
      expect(canCreate).toBe(true);
      
      // Create templates up to the limit (2)
      await incrementTemplateCount(limitedUser.id);
      await incrementTemplateCount(limitedUser.id);
      
      // Now should not be able to create more
      canCreate = await canCreateTemplate(limitedUser.id);
      expect(canCreate).toBe(false);
    });
  });

  describe('Card Generation Flow Integration', () => {
    it('should use free generations first, then credits', async () => {
      // Create a fresh test user with known state
      const freshProfiles = await testDataManager.createTestProfiles(testOrg.id);
      const freshUser = freshProfiles[0];
      
      // Reset their generation count to 0 for this test
      const { supabase } = await import('$lib/supabaseClient');
      await supabase
        .from('profiles')
        .update({ 
          card_generation_count: 0, 
          credits_balance: 50 
        })
        .eq('id', freshUser.id);
      
      // First 10 generations should be free
      for (let i = 0; i < 10; i++) {
        const canGenerate = await canGenerateCard(freshUser.id);
        expect(canGenerate.canGenerate).toBe(true);
        expect(canGenerate.needsCredits).toBe(false);
        
        const deductResult = await deductCardGenerationCredit(freshUser.id, testOrg.id, `card-${i}`);
        expect(deductResult.success).toBe(true);
        expect(deductResult.newBalance).toBe(50); // Credits unchanged
      }
      
      // Next generation should require credits
      const canGenerate = await canGenerateCard(freshUser.id);
      expect(canGenerate.canGenerate).toBe(true);
      expect(canGenerate.needsCredits).toBe(false); // Still has credits
      
      const deductResult = await deductCardGenerationCredit(freshUser.id, testOrg.id, 'card-11');
      expect(deductResult.success).toBe(true);
      expect(deductResult.newBalance).toBe(49); // Credits deducted
    });

    it('should prevent generation when no credits available', async () => {
      // Create a user with no credits and exceeded free limit
      const profiles = await testDataManager.createTestProfiles(testOrg.id);
      const poorUser = profiles.find((p: any) => p.credits_balance === 50); // Find a user with credits
      
      expect(poorUser).toBeTruthy();
      if (!poorUser) return;
      
      // Set them to have no credits and high generation count
      const { supabase } = await import('$lib/supabaseClient');
      await supabase
        .from('profiles')
        .update({ 
          card_generation_count: 15, // Above free limit
          credits_balance: 0 // No credits
        })
        .eq('id', poorUser.id);
      
      const canGenerate = await canGenerateCard(poorUser.id);
      expect(canGenerate.canGenerate).toBe(false);
      expect(canGenerate.needsCredits).toBe(true);
      
      const deductResult = await deductCardGenerationCredit(poorUser.id, testOrg.id, 'impossible-card');
      expect(deductResult.success).toBe(false);
    });
  });

  describe('Credit Transactions Integration', () => {
    it('should create proper transaction records when adding credits', async () => {
      const user = testUser;
      const initialCredits = await getUserCredits(user.id);
      
      const addResult = await addCredits(user.id, testOrg.id, 100, 'test-payment-123', 'Integration test credit purchase');
      expect(addResult.success).toBe(true);
      expect(addResult.newBalance).toBe(initialCredits!.credits_balance + 100);
      
      // Verify credit balance updated
      const updatedCredits = await getUserCredits(user.id);
      expect(updatedCredits!.credits_balance).toBe(addResult.newBalance);
      
      // Verify transaction record created
      const history = await getCreditHistory(user.id, 10);
      const latestTransaction = history.find(t => t.reference_id === 'test-payment-123');
      
      expect(latestTransaction).toBeTruthy();
      expect(latestTransaction!.transaction_type).toBe('purchase');
      expect(latestTransaction!.amount).toBe(100);
      expect(latestTransaction!.credits_before).toBe(initialCredits!.credits_balance);
      expect(latestTransaction!.credits_after).toBe(initialCredits!.credits_balance + 100);
      expect(latestTransaction!.description).toBe('Integration test credit purchase');
      expect(latestTransaction!.metadata).toMatchObject({ type: 'credit_purchase' });
    });

    it('should create transaction records for card generation credit usage', async () => {
      // Use a user who has exceeded free limits
      const user = testUser;
      
      // Ensure they have credits and high generation count
      const { supabase } = await import('$lib/supabaseClient');
      await supabase
        .from('profiles')
        .update({ 
          card_generation_count: 15, // Above free limit
          credits_balance: 25 // Has credits
        })
        .eq('id', user.id);
      
      const initialCredits = await getUserCredits(user.id);
      const cardId = `integration-test-card-${Date.now()}`;
      
      const deductResult = await deductCardGenerationCredit(user.id, testOrg.id, cardId);
      expect(deductResult.success).toBe(true);
      
      // Verify transaction record created
      const history = await getCreditHistory(user.id, 10);
      const usageTransaction = history.find(t => t.reference_id === cardId);
      
      expect(usageTransaction).toBeTruthy();
      expect(usageTransaction!.transaction_type).toBe('usage');
      expect(usageTransaction!.amount).toBe(-1);
      expect(usageTransaction!.credits_before).toBe(initialCredits!.credits_balance);
      expect(usageTransaction!.credits_after).toBe(initialCredits!.credits_balance - 1);
      expect(usageTransaction!.description).toBe('Card generation');
      expect(usageTransaction!.metadata).toMatchObject({ type: 'card_generation' });
    });
  });

  describe('Premium Features Integration', () => {
    it('should grant and track unlimited templates feature', async () => {
      const freshProfiles = await testDataManager.createTestProfiles(testOrg.id);
      const user = freshProfiles.find((p: any) => !p.unlimited_templates);
      
      expect(user).toBeTruthy();
      if (!user) return;
      
      // Initially should not have unlimited templates
      let credits = await getUserCredits(user.id);
      expect(credits!.unlimited_templates).toBe(false);
      
      // Grant unlimited templates
      const grantResult = await grantUnlimitedTemplates(user.id, testOrg.id, 'unlimited-payment-123');
      expect(grantResult.success).toBe(true);
      
      // Verify feature granted
      credits = await getUserCredits(user.id);
      expect(credits!.unlimited_templates).toBe(true);
      
      // Verify transaction record created
      const history = await getCreditHistory(user.id, 10);
      const featureTransaction = history.find(t => t.reference_id === 'unlimited-payment-123');
      
      expect(featureTransaction).toBeTruthy();
      expect(featureTransaction!.transaction_type).toBe('purchase');
      expect(featureTransaction!.amount).toBe(0); // Feature unlock, no credits added
      expect(featureTransaction!.description).toBe('Unlimited templates upgrade');
      expect(featureTransaction!.metadata).toMatchObject({ 
        type: 'unlimited_templates_purchase',
        amount_paid: 99
      });
    });

    it('should grant and track watermark removal feature', async () => {
      const freshProfiles = await testDataManager.createTestProfiles(testOrg.id);
      const user = freshProfiles.find((p: any) => !p.remove_watermarks);
      
      expect(user).toBeTruthy();
      if (!user) return;
      
      // Initially should not have watermark removal
      let credits = await getUserCredits(user.id);
      expect(credits!.remove_watermarks).toBe(false);
      
      // Grant watermark removal
      const grantResult = await grantWatermarkRemoval(user.id, testOrg.id, 'watermark-payment-456');
      expect(grantResult.success).toBe(true);
      
      // Verify feature granted
      credits = await getUserCredits(user.id);
      expect(credits!.remove_watermarks).toBe(true);
      
      // Verify transaction record created
      const history = await getCreditHistory(user.id, 10);
      const featureTransaction = history.find(t => t.reference_id === 'watermark-payment-456');
      
      expect(featureTransaction).toBeTruthy();
      expect(featureTransaction!.transaction_type).toBe('purchase');
      expect(featureTransaction!.amount).toBe(0); // Feature unlock, no credits added
      expect(featureTransaction!.description).toBe('Remove watermarks upgrade');
      expect(featureTransaction!.metadata).toMatchObject({ 
        type: 'watermark_removal_purchase',
        amount_paid: 199
      });
    });
  });

  describe('Credit History Integration', () => {
    it('should maintain proper chronological order and limits', async () => {
      const user = testUser;
      
      // Create multiple transactions
      await addCredits(user.id, testOrg.id, 50, 'payment-1', 'First purchase');
      await addCredits(user.id, testOrg.id, 25, 'payment-2', 'Second purchase');
      await addCredits(user.id, testOrg.id, 75, 'payment-3', 'Third purchase');
      
      // Retrieve history with limit
      const history = await getCreditHistory(user.id, 2);
      
      expect(history).toHaveLength(2);
      
      // Should be in descending order by created_at
      if (history.length >= 2) {
        const firstDate = new Date(history[0].created_at);
        const secondDate = new Date(history[1].created_at);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
      
      // All transactions should belong to the user
      history.forEach(txn => {
        expect(txn.user_id).toBe(user.id);
        expect(txn.org_id).toBe(testOrg.id);
      });
    });

    it('should include all transaction types in history', async () => {
      const freshProfiles = await testDataManager.createTestProfiles(testOrg.id);
      const user = freshProfiles[0];
      
      // Create different types of transactions
      await addCredits(user.id, testOrg.id, 100, 'purchase-ref', 'Credit purchase');
      await grantUnlimitedTemplates(user.id, testOrg.id, 'feature-ref-1');
      await grantWatermarkRemoval(user.id, testOrg.id, 'feature-ref-2');
      
      // Set up for usage transaction
      const { supabase } = await import('$lib/supabaseClient');
      await supabase
        .from('profiles')
        .update({ card_generation_count: 15 }) // Above free limit
        .eq('id', user.id);
      
      await deductCardGenerationCredit(user.id, testOrg.id, 'card-ref');
      
      // Get full history
      const history = await getCreditHistory(user.id, 50);
      
      // Should have various transaction types
      const types = new Set(history.map(t => t.transaction_type));
      expect(types.has('purchase')).toBe(true);
      expect(types.has('usage')).toBe(true);
      
      // Verify specific transactions exist
      expect(history.some(t => t.reference_id === 'purchase-ref')).toBe(true);
      expect(history.some(t => t.reference_id === 'feature-ref-1')).toBe(true);
      expect(history.some(t => t.reference_id === 'feature-ref-2')).toBe(true);
      expect(history.some(t => t.reference_id === 'card-ref')).toBe(true);
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain consistent credit balances across operations', async () => {
      const user = testUser;
      
      // Get initial state
      const initialCredits = await getUserCredits(user.id);
      expect(initialCredits).toBeTruthy();
      
      const initialBalance = initialCredits!.credits_balance;
      
      // Add credits
      await addCredits(user.id, testOrg.id, 100, 'consistency-test-1');
      
      // Verify balance increased
      let updatedCredits = await getUserCredits(user.id);
      expect(updatedCredits!.credits_balance).toBe(initialBalance + 100);
      
      // Use credits through card generation (set high generation count first)
      const { supabase } = await import('$lib/supabaseClient');
      await supabase
        .from('profiles')
        .update({ card_generation_count: 20 }) // Above free limit
        .eq('id', user.id);
      
      // Deduct credits
      const deductResult = await deductCardGenerationCredit(user.id, testOrg.id, 'consistency-card-1');
      expect(deductResult.success).toBe(true);
      expect(deductResult.newBalance).toBe(initialBalance + 100 - 1);
      
      // Verify final balance
      updatedCredits = await getUserCredits(user.id);
      expect(updatedCredits!.credits_balance).toBe(initialBalance + 100 - 1);
    });

    it('should handle concurrent credit operations gracefully', async () => {
      const user = testUser;
      const initialCredits = await getUserCredits(user.id);
      
      // Prepare user for credit deductions
      const { supabase } = await import('$lib/supabaseClient');
      await supabase
        .from('profiles')
        .update({ 
          card_generation_count: 25, // Above free limit
          credits_balance: initialCredits!.credits_balance + 10 // Ensure enough credits
        })
        .eq('id', user.id);
      
      // Attempt multiple concurrent operations
      const operations = [
        deductCardGenerationCredit(user.id, testOrg.id, 'concurrent-1'),
        deductCardGenerationCredit(user.id, testOrg.id, 'concurrent-2'),
        deductCardGenerationCredit(user.id, testOrg.id, 'concurrent-3')
      ];
      
      const results = await Promise.allSettled(operations);
      
      // Count successful operations
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThanOrEqual(3);
      
      // Verify final state is consistent
      const finalCredits = await getUserCredits(user.id);
      const expectedBalance = initialCredits!.credits_balance + 10 - successCount;
      expect(finalCredits!.credits_balance).toBe(expectedBalance);
    });
  });
});
