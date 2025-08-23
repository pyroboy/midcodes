import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { 
  deductCardGenerationCredit, 
  canGenerateCard, 
  getUserCredits,
  addCredits 
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

describe('Credit Usage - ID Card Generation', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Free Generation Phase (0-10 cards)', () => {
    it('should allow free card generation for first 10 cards', async () => {
      const { profile } = testData;
      const initialBalance = profile.credits_balance;

      // Generate 10 free cards
      for (let i = 1; i <= 10; i++) {
        const canGenerate = await canGenerateCard(profile.id);
        expect(canGenerate.canGenerate).toBe(true);
        expect(canGenerate.needsCredits).toBe(false);

        const result = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          `free-card-${i}`
        );

        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(initialBalance); // No credit deduction

        // Verify card count incremented
        const credits = await getUserCredits(profile.id);
        expect(credits?.card_generation_count).toBe(i);
      }

      // Verify final state after 10 free cards
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.card_generation_count).toBe(10);
      expect(finalCredits?.credits_balance).toBe(initialBalance); // Unchanged
    });

    it('should not create credit transactions for free generations', async () => {
      const { profile } = testData;

      // Generate 5 free cards
      for (let i = 1; i <= 5; i++) {
        await deductCardGenerationCredit(profile.id, profile.org_id, `card-${i}`);
      }

      // Verify no credit transactions created
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'usage');

      expect(transactions || []).toHaveLength(0);
    });

    it('should handle partial free generation usage', async () => {
      const { profile } = testData;

      // Use only 3 free generations
      for (let i = 1; i <= 3; i++) {
        const result = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          `card-${i}`
        );
        expect(result.success).toBe(true);
      }

      // Should still have 7 free generations left
      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(true);
      expect(canGenerate.needsCredits).toBe(false);

      const credits = await getUserCredits(profile.id);
      expect(credits?.card_generation_count).toBe(3);
    });
  });

  describe('Paid Generation Phase (11+ cards)', () => {
    beforeEach(async () => {
      // Set up user with 10 cards already generated and some credits
      const { profile } = testData;
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 50
        })
        .eq('id', profile.id);
    });

    it('should deduct credits for cards after 10th generation', async () => {
      const { profile } = testData;

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'paid-card-11'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(49); // 50 - 1 = 49

      // Verify user state
      const credits = await getUserCredits(profile.id);
      expect(credits?.card_generation_count).toBe(11);
      expect(credits?.credits_balance).toBe(49);
    });

    it('should create credit transaction for paid generations', async () => {
      const { profile } = testData;

      await deductCardGenerationCredit(profile.id, profile.org_id, 'paid-card-11');

      // Verify transaction created
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'usage');

      expect(transactions).toHaveLength(1);
      expect(transactions![0]).toMatchObject({
        user_id: profile.id,
        org_id: profile.org_id,
        transaction_type: 'usage',
        amount: -1,
        credits_before: 50,
        credits_after: 49,
        description: 'Card generation',
        reference_id: 'paid-card-11'
      });

      expect(transactions![0].metadata).toMatchObject({
        type: 'card_generation'
      });
    });

    it('should handle multiple consecutive paid generations', async () => {
      const { profile } = testData;

      // Generate 5 paid cards
      for (let i = 11; i <= 15; i++) {
        const result = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          `paid-card-${i}`
        );
        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(50 - (i - 10)); // Credits decrease by 1 each time
      }

      // Verify final state
      const credits = await getUserCredits(profile.id);
      expect(credits?.card_generation_count).toBe(15);
      expect(credits?.credits_balance).toBe(45); // 50 - 5 = 45

      // Verify all transactions logged
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'usage')
        .order('created_at', { ascending: true });

      expect(transactions).toHaveLength(5);

      // Verify transaction sequence
      transactions!.forEach((transaction, index) => {
        expect(transaction).toMatchObject({
          amount: -1,
          credits_before: 50 - index,
          credits_after: 49 - index,
          reference_id: `paid-card-${11 + index}`
        });
      });
    });

    it('should maintain correct balance across mixed operations', async () => {
      const { profile } = testData;

      // Generate one paid card
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-11');

      // Add more credits
      await addCredits(profile.id, profile.org_id, 25, 'purchase-1');

      // Generate another paid card
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-12');

      // Verify final balance: 50 - 1 + 25 - 1 = 73
      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(73);
      expect(credits?.card_generation_count).toBe(12);
    });
  });

  describe('Insufficient Credit Scenarios', () => {
    beforeEach(async () => {
      // Set up user with 10 cards generated and 0 credits
      const { profile } = testData;
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 0
        })
        .eq('id', profile.id);
    });

    it('should detect insufficient credits correctly', async () => {
      const { profile } = testData;

      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(false);
      expect(canGenerate.needsCredits).toBe(true);
    });

    it('should fail deduction when credits are insufficient', async () => {
      const { profile } = testData;

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'failed-card'
      );

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(0);

      // Verify no state changes
      const credits = await getUserCredits(profile.id);
      expect(credits?.card_generation_count).toBe(10); // Unchanged
      expect(credits?.credits_balance).toBe(0); // Unchanged
    });

    it('should not create transaction for failed deductions', async () => {
      const { profile } = testData;

      await deductCardGenerationCredit(profile.id, profile.org_id, 'failed-card');

      // Verify no transactions created
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id);

      expect(transactions || []).toHaveLength(0);
    });

    it('should handle edge case of exactly 1 credit', async () => {
      const { profile } = testData;

      // Give user exactly 1 credit
      await supabase
        .from('profiles')
        .update({ credits_balance: 1 })
        .eq('id', profile.id);

      // Should be able to generate one card
      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(true);
      expect(canGenerate.needsCredits).toBe(false);

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'last-card'
      );
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(0);

      // Now should not be able to generate another
      const canGenerateAfter = await canGenerateCard(profile.id);
      expect(canGenerateAfter.canGenerate).toBe(false);
      expect(canGenerateAfter.needsCredits).toBe(true);
    });

    it('should handle negative credit balance gracefully', async () => {
      const { profile } = testData;

      // Set negative balance (shouldn't happen in practice)
      await supabase
        .from('profiles')
        .update({ credits_balance: -5 })
        .eq('id', profile.id);

      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(false);
      expect(canGenerate.needsCredits).toBe(true);
    });
  });

  describe('Transition from Free to Paid', () => {
    it('should transition correctly from free to paid generations', async () => {
      const { profile } = testData;

      // Use up all free generations
      for (let i = 1; i <= 10; i++) {
        await deductCardGenerationCredit(profile.id, profile.org_id, `free-${i}`);
      }

      // Add some credits
      await addCredits(profile.id, profile.org_id, 5, 'purchase-1');

      // Next generation should use credits
      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'first-paid'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(profile.credits_balance + 5 - 1); // Added 5, used 1

      // Verify transaction was created for the paid card
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'first-paid');

      expect(transactions).toHaveLength(1);
      expect(transactions![0].transaction_type).toBe('usage');
    });

    it('should correctly identify when transition occurs', async () => {
      const { profile } = testData;

      // At 9 cards - should still be free
      await supabase
        .from('profiles')
        .update({ card_generation_count: 9 })
        .eq('id', profile.id);

      let canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.needsCredits).toBe(false);

      // At 10 cards with no credits - should need credits
      await supabase
        .from('profiles')
        .update({ 
          card_generation_count: 10,
          credits_balance: 0 
        })
        .eq('id', profile.id);

      canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.needsCredits).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid user ID gracefully', async () => {
      const result = await deductCardGenerationCredit(
        'invalid-user-id',
        'some-org-id',
        'test-card'
      );

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(0);
    });

    it('should handle database connection errors gracefully', async () => {
      const { profile } = testData;

      // Delete profile to simulate error
      await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'error-card'
      );

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(0);
    });

    it('should handle concurrent deductions safely', async () => {
      const { profile } = testData;

      // Set up user with limited credits
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 2
        })
        .eq('id', profile.id);

      // Attempt concurrent deductions
      const promises = [
        deductCardGenerationCredit(profile.id, profile.org_id, 'concurrent-1'),
        deductCardGenerationCredit(profile.id, profile.org_id, 'concurrent-2'),
        deductCardGenerationCredit(profile.id, profile.org_id, 'concurrent-3')
      ];

      const results = await Promise.all(promises);

      // Count successful operations
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeLessThanOrEqual(2); // Can't exceed available credits

      // Verify final balance is not negative
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBeGreaterThanOrEqual(0);
    });

    it('should handle null reference IDs', async () => {
      const { profile } = testData;

      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 5
        })
        .eq('id', profile.id);

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id
        // No reference_id provided
      );

      expect(result.success).toBe(true);

      // Transaction should have null reference_id
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id);

      expect(transactions![0].reference_id).toBeNull();
    });
  });
});