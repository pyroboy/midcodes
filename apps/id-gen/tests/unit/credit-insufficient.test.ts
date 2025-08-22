import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { 
  deductCardGenerationCredit, 
  canGenerateCard, 
  canCreateTemplate,
  getUserCredits,
  addCredits
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

describe('Credit Usage - Insufficient Credit Scenarios', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Zero Credits Scenarios', () => {
    beforeEach(async () => {
      // Set up user with no credits and exhausted free generations
      const { profile } = testData;
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10, // Used all free generations
          credits_balance: 0
        })
        .eq('id', profile.id);
    });

    it('should detect when user cannot generate cards', async () => {
      const { profile } = testData;

      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(false);
      expect(canGenerate.needsCredits).toBe(true);
    });

    it('should prevent card generation when credits are zero', async () => {
      const { profile } = testData;

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'blocked-card'
      );

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(0);

      // Verify no state changes occurred
      const credits = await getUserCredits(profile.id);
      expect(credits?.card_generation_count).toBe(10); // Unchanged
      expect(credits?.credits_balance).toBe(0); // Unchanged
    });

    it('should not create transactions for blocked operations', async () => {
      const { profile } = testData;

      // Attempt blocked operation
      await deductCardGenerationCredit(profile.id, profile.org_id, 'blocked-card');

      // Verify no transactions created
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id);

      expect(transactions || []).toHaveLength(0);
    });

    it('should allow operations after purchasing credits', async () => {
      const { profile } = testData;

      // Initially blocked
      let canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(false);

      // Purchase credits
      await addCredits(profile.id, profile.org_id, 10, 'rescue-purchase');

      // Now should be able to generate
      canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(true);
      expect(canGenerate.needsCredits).toBe(false);

      // Should successfully generate card
      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'rescued-card'
      );
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(9); // 10 - 1 = 9
    });
  });

  describe('Exact Credit Edge Cases', () => {
    it('should handle exactly 1 credit scenario', async () => {
      const { profile } = testData;

      // Set up user with exactly 1 credit
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 1
        })
        .eq('id', profile.id);

      // Should be able to generate one card
      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(true);
      expect(canGenerate.needsCredits).toBe(false);

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'last-possible-card'
      );
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(0);

      // Now should be blocked
      const canGenerateAfter = await canGenerateCard(profile.id);
      expect(canGenerateAfter.canGenerate).toBe(false);
      expect(canGenerateAfter.needsCredits).toBe(true);

      // Another attempt should fail
      const blockedResult = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'impossible-card'
      );
      expect(blockedResult.success).toBe(false);
    });

    it('should handle rapid credit depletion', async () => {
      const { profile } = testData;

      // Set up user with 3 credits
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 3
        })
        .eq('id', profile.id);

      // Deplete credits one by one
      for (let i = 1; i <= 3; i++) {
        const canGenerate = await canGenerateCard(profile.id);
        expect(canGenerate.canGenerate).toBe(true);

        const result = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          `depleting-card-${i}`
        );
        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(3 - i);
      }

      // Now should be blocked
      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(false);
      expect(canGenerate.needsCredits).toBe(true);
    });
  });

  describe('Negative Credit Scenarios', () => {
    it('should handle negative credit balance gracefully', async () => {
      const { profile } = testData;

      // Set negative balance (edge case that shouldn't happen)
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: -5
        })
        .eq('id', profile.id);

      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(false);
      expect(canGenerate.needsCredits).toBe(true);

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'negative-test'
      );
      expect(result.success).toBe(false);
    });

    it('should not allow operations that would create negative balance', async () => {
      const { profile } = testData;

      // Start with 0 credits
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 0
        })
        .eq('id', profile.id);

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'would-be-negative'
      );

      expect(result.success).toBe(false);

      // Verify balance didn't go negative
      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(0);
    });
  });

  describe('Concurrent Insufficient Credit Operations', () => {
    it('should handle concurrent operations with insufficient credits', async () => {
      const { profile } = testData;

      // Set up user with only 1 credit
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 1
        })
        .eq('id', profile.id);

      // Attempt 3 concurrent operations with only 1 credit
      const promises = [
        deductCardGenerationCredit(profile.id, profile.org_id, 'concurrent-1'),
        deductCardGenerationCredit(profile.id, profile.org_id, 'concurrent-2'),
        deductCardGenerationCredit(profile.id, profile.org_id, 'concurrent-3')
      ];

      const results = await Promise.all(promises);

      // Only 1 should succeed
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(1);

      // Verify final balance is 0 (not negative)
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(0);

      // Verify exactly 1 transaction was created
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'usage');

      expect(transactions).toHaveLength(1);
    });

    it('should handle race conditions safely', async () => {
      const { profile } = testData;

      // Set up user with 2 credits
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 2
        })
        .eq('id', profile.id);

      // Launch many concurrent operations
      const promises = Array.from({ length: 10 }, (_, i) =>
        deductCardGenerationCredit(profile.id, profile.org_id, `race-${i}`)
      );

      const results = await Promise.all(promises);

      // Only 2 should succeed (matching available credits)
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeLessThanOrEqual(2);

      // Final balance should be non-negative
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBeGreaterThanOrEqual(0);

      // Transaction count should match successful operations
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'usage');

      expect(transactions).toHaveLength(successCount);
    });
  });

  describe('Template Creation with Insufficient Permissions', () => {
    it('should block template creation after limit for free users', async () => {
      const { profile } = testData;

      // Set user to template limit
      await supabase
        .from('profiles')
        .update({
          template_count: 2,
          unlimited_templates: false
        })
        .eq('id', profile.id);

      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(false);
    });

    it('should not block template creation for unlimited users', async () => {
      const { profile } = testData;

      // Set user to high template count but with unlimited
      await supabase
        .from('profiles')
        .update({
          template_count: 100,
          unlimited_templates: true
        })
        .eq('id', profile.id);

      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(true);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover gracefully from invalid user state', async () => {
      // Create user with invalid/null values
      const { data: invalidProfile } = await supabase
        .from('profiles')
        .insert({
          id: 'invalid-test-user',
          email: 'invalid@test.com',
          org_id: testData.organization.id,
          role: 'id_gen_user',
          credits_balance: null, // Invalid null
          card_generation_count: null, // Invalid null
          template_count: null
        })
        .select()
        .single();

      const canGenerate = await canGenerateCard(invalidProfile.id);
      expect(canGenerate.canGenerate).toBe(false);

      const result = await deductCardGenerationCredit(
        invalidProfile.id,
        testData.organization.id,
        'invalid-test'
      );
      expect(result.success).toBe(false);

      // Cleanup
      await supabase
        .from('profiles')
        .delete()
        .eq('id', invalidProfile.id);
    });

    it('should handle database constraint violations', async () => {
      const { profile } = testData;

      // Manually set invalid state that violates business logic
      await supabase
        .rpc('update_profile_unsafe', {
          profile_id: profile.id,
          new_balance: 0,
          new_count: 10
        });

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'constraint-test'
      );

      expect(result.success).toBe(false);
    });
  });

  describe('User Experience Edge Cases', () => {
    it('should provide consistent state across permission checks', async () => {
      const { profile } = testData;

      // Set borderline state
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 9,
          credits_balance: 0
        })
        .eq('id', profile.id);

      // Should be able to generate (still has 1 free left)
      const canGenerate1 = await canGenerateCard(profile.id);
      expect(canGenerate1.canGenerate).toBe(true);
      expect(canGenerate1.needsCredits).toBe(false);

      // Use last free generation
      await deductCardGenerationCredit(profile.id, profile.org_id, 'last-free');

      // Now should need credits
      const canGenerate2 = await canGenerateCard(profile.id);
      expect(canGenerate2.canGenerate).toBe(false);
      expect(canGenerate2.needsCredits).toBe(true);
    });

    it('should handle user profile not found scenario', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      const canGenerate = await canGenerateCard(nonExistentUserId);
      expect(canGenerate.canGenerate).toBe(false);
      expect(canGenerate.needsCredits).toBe(false);

      const canCreate = await canCreateTemplate(nonExistentUserId);
      expect(canCreate).toBe(false);

      const result = await deductCardGenerationCredit(
        nonExistentUserId,
        'some-org-id',
        'test-card'
      );
      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(0);
    });
  });
});