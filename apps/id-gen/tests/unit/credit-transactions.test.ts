import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { 
  deductCardGenerationCredit, 
  addCredits,
  getCreditHistory,
  grantUnlimitedTemplates,
  grantWatermarkRemoval,
  getUserCredits
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

describe('Credit Usage - Transaction Logging', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Credit Purchase Transaction Logging', () => {
    it('should log credit purchase transactions correctly', async () => {
      const { profile } = testData;
      const initialBalance = profile.credits_balance;

      const result = await addCredits(
        profile.id,
        profile.org_id,
        100,
        'payment-ref-123',
        'Credit package purchase'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(initialBalance + 100);

      // Verify transaction logged
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'purchase');

      expect(transactions).toHaveLength(1);
      expect(transactions![0]).toMatchObject({
        user_id: profile.id,
        org_id: profile.org_id,
        transaction_type: 'purchase',
        amount: 100,
        credits_before: initialBalance,
        credits_after: initialBalance + 100,
        description: 'Credit package purchase',
        reference_id: 'payment-ref-123'
      });

      expect(transactions![0].metadata).toMatchObject({
        type: 'credit_purchase'
      });

      // Verify timestamps
      expect(transactions![0].created_at).toBeDefined();
      expect(new Date(transactions![0].created_at).getTime()).toBeCloseTo(Date.now(), -2); // Within 100ms
    });

    it('should handle default description for credit purchases', async () => {
      const { profile } = testData;

      await addCredits(profile.id, profile.org_id, 50, 'payment-456');

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id);

      expect(transactions![0].description).toBe('Credit purchase');
    });

    it('should log multiple purchase transactions sequentially', async () => {
      const { profile } = testData;
      const initialBalance = profile.credits_balance;

      // First purchase
      await addCredits(profile.id, profile.org_id, 25, 'payment-1', 'First purchase');
      
      // Second purchase
      await addCredits(profile.id, profile.org_id, 75, 'payment-2', 'Second purchase');

      // Get transactions in order
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'purchase')
        .order('created_at', { ascending: true });

      expect(transactions).toHaveLength(2);

      // First transaction
      expect(transactions![0]).toMatchObject({
        amount: 25,
        credits_before: initialBalance,
        credits_after: initialBalance + 25,
        reference_id: 'payment-1',
        description: 'First purchase'
      });

      // Second transaction (builds on first)
      expect(transactions![1]).toMatchObject({
        amount: 75,
        credits_before: initialBalance + 25,
        credits_after: initialBalance + 100,
        reference_id: 'payment-2',
        description: 'Second purchase'
      });
    });
  });

  describe('Credit Usage Transaction Logging', () => {
    beforeEach(async () => {
      // Set up user with exhausted free generations and credits
      const { profile } = testData;
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 25
        })
        .eq('id', profile.id);
    });

    it('should log card generation usage transactions', async () => {
      const { profile } = testData;

      await deductCardGenerationCredit(profile.id, profile.org_id, 'test-card-123');

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
        credits_before: 25,
        credits_after: 24,
        description: 'Card generation',
        reference_id: 'test-card-123'
      });

      expect(transactions![0].metadata).toMatchObject({
        type: 'card_generation'
      });
    });

    it('should maintain accurate before/after balances in sequence', async () => {
      const { profile } = testData;

      // Multiple card generations
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-1');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-2');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-3');

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'usage')
        .order('created_at', { ascending: true });

      expect(transactions).toHaveLength(3);

      // First transaction: 25 -> 24
      expect(transactions![0]).toMatchObject({
        credits_before: 25,
        credits_after: 24,
        amount: -1,
        reference_id: 'card-1'
      });

      // Second transaction: 24 -> 23
      expect(transactions![1]).toMatchObject({
        credits_before: 24,
        credits_after: 23,
        amount: -1,
        reference_id: 'card-2'
      });

      // Third transaction: 23 -> 22
      expect(transactions![2]).toMatchObject({
        credits_before: 23,
        credits_after: 22,
        amount: -1,
        reference_id: 'card-3'
      });
    });

    it('should not log transactions for free generations', async () => {
      const { profile } = testData;

      // Reset to use free generations
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 5,
          credits_balance: 25
        })
        .eq('id', profile.id);

      // Generate some free cards
      await deductCardGenerationCredit(profile.id, profile.org_id, 'free-card-1');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'free-card-2');

      // Should have no usage transactions
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'usage');

      expect(transactions || []).toHaveLength(0);
    });

    it('should handle null reference IDs in usage transactions', async () => {
      const { profile } = testData;

      await deductCardGenerationCredit(profile.id, profile.org_id); // No reference_id

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id);

      expect(transactions![0].reference_id).toBeNull();
    });
  });

  describe('Premium Feature Transaction Logging', () => {
    it('should log unlimited templates purchase correctly', async () => {
      const { profile } = testData;

      const result = await grantUnlimitedTemplates(
        profile.id,
        profile.org_id,
        'unlimited-payment-123'
      );

      expect(result.success).toBe(true);

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'unlimited-payment-123');

      expect(transactions).toHaveLength(1);
      expect(transactions![0]).toMatchObject({
        transaction_type: 'purchase',
        amount: 0, // No credits added, just feature unlock
        credits_before: 0,
        credits_after: 0,
        description: 'Unlimited templates upgrade',
        reference_id: 'unlimited-payment-123'
      });

      expect(transactions![0].metadata).toMatchObject({
        type: 'unlimited_templates_purchase',
        amount_paid: 99
      });
    });

    it('should log watermark removal purchase correctly', async () => {
      const { profile } = testData;

      const result = await grantWatermarkRemoval(
        profile.id,
        profile.org_id,
        'watermark-payment-456'
      );

      expect(result.success).toBe(true);

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'watermark-payment-456');

      expect(transactions).toHaveLength(1);
      expect(transactions![0]).toMatchObject({
        transaction_type: 'purchase',
        amount: 0,
        description: 'Remove watermarks upgrade',
        reference_id: 'watermark-payment-456'
      });

      expect(transactions![0].metadata).toMatchObject({
        type: 'watermark_removal_purchase',
        amount_paid: 199
      });
    });
  });

  describe('Mixed Transaction Scenarios', () => {
    it('should log complete user transaction history correctly', async () => {
      const { profile } = testData;

      // Start with credit purchase
      await addCredits(profile.id, profile.org_id, 50, 'initial-purchase');

      // Purchase unlimited templates
      await grantUnlimitedTemplates(profile.id, profile.org_id, 'unlimited-purchase');

      // Use up free generations first
      await supabase
        .from('profiles')
        .update({ card_generation_count: 10 })
        .eq('id', profile.id);

      // Generate paid cards
      await deductCardGenerationCredit(profile.id, profile.org_id, 'paid-card-1');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'paid-card-2');

      // Purchase more credits
      await addCredits(profile.id, profile.org_id, 25, 'second-purchase');

      // Get complete history
      const history = await getCreditHistory(profile.id);

      expect(history).toHaveLength(5);

      // Verify transaction types in reverse chronological order
      const transactionTypes = history.map(t => ({
        type: t.transaction_type,
        amount: t.amount,
        description: t.description
      }));

      expect(transactionTypes).toEqual([
        { type: 'purchase', amount: 25, description: 'Credit purchase' },
        { type: 'usage', amount: -1, description: 'Card generation' },
        { type: 'usage', amount: -1, description: 'Card generation' },
        { type: 'purchase', amount: 0, description: 'Unlimited templates upgrade' },
        { type: 'purchase', amount: 50, description: 'Credit purchase' }
      ]);
    });

    it('should maintain balance consistency across mixed operations', async () => {
      const { profile } = testData;
      const initialBalance = profile.credits_balance;

      // Complex sequence of operations
      await addCredits(profile.id, profile.org_id, 100, 'purchase-1'); // +100
      
      // Set up for paid generations
      await supabase
        .from('profiles')
        .update({ card_generation_count: 10 })
        .eq('id', profile.id);

      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-1'); // -1
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-2'); // -1
      await addCredits(profile.id, profile.org_id, 50, 'purchase-2'); // +50
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-3'); // -1

      // Calculate expected balance: initial + 100 - 1 - 1 + 50 - 1
      const expectedBalance = initialBalance + 100 - 1 - 1 + 50 - 1;

      const currentCredits = await getUserCredits(profile.id);
      expect(currentCredits?.credits_balance).toBe(expectedBalance);

      // Verify transaction history adds up
      const history = await getCreditHistory(profile.id);
      const totalFromTransactions = history.reduce((sum, t) => sum + t.amount, 0);
      expect(totalFromTransactions).toBe(expectedBalance - initialBalance);
    });
  });

  describe('Transaction History Retrieval', () => {
    beforeEach(async () => {
      const { profile } = testData;
      
      // Create multiple transactions
      await addCredits(profile.id, profile.org_id, 100, 'purchase-1');
      await supabase.from('profiles').update({ card_generation_count: 10 }).eq('id', profile.id);
      
      for (let i = 1; i <= 5; i++) {
        await deductCardGenerationCredit(profile.id, profile.org_id, `card-${i}`);
      }
      
      await addCredits(profile.id, profile.org_id, 50, 'purchase-2');
    });

    it('should retrieve transaction history in correct order', async () => {
      const { profile } = testData;

      const history = await getCreditHistory(profile.id);

      expect(history.length).toBeGreaterThan(0);

      // Should be in reverse chronological order (newest first)
      for (let i = 0; i < history.length - 1; i++) {
        const current = new Date(history[i].created_at).getTime();
        const next = new Date(history[i + 1].created_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should respect transaction history limit', async () => {
      const { profile } = testData;

      const limitedHistory = await getCreditHistory(profile.id, 3);
      expect(limitedHistory).toHaveLength(3);

      const fullHistory = await getCreditHistory(profile.id);
      expect(fullHistory.length).toBeGreaterThan(3);
    });

    it('should return empty array for user with no transactions', async () => {
      const newTestData = await testDataManager.createMinimalTestData();
      
      const history = await getCreditHistory(newTestData.profile.id);
      expect(history).toEqual([]);

      await testDataManager.cleanupAll();
    });

    it('should handle invalid user ID gracefully', async () => {
      const history = await getCreditHistory('invalid-user-id');
      expect(history).toEqual([]);
    });
  });

  describe('Transaction Metadata and References', () => {
    it('should store and retrieve metadata correctly', async () => {
      const { profile } = testData;

      await addCredits(profile.id, profile.org_id, 75, 'meta-test', 'Metadata test');

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'meta-test');

      const metadata = transactions![0].metadata;
      expect(metadata).toMatchObject({
        type: 'credit_purchase'
      });
      expect(typeof metadata).toBe('object');
    });

    it('should link transactions to specific operations via reference_id', async () => {
      const { profile } = testData;

      await supabase
        .from('profiles')
        .update({ card_generation_count: 10 })
        .eq('id', profile.id);

      const cardIds = ['card-alpha', 'card-beta', 'card-gamma'];
      
      for (const cardId of cardIds) {
        await deductCardGenerationCredit(profile.id, profile.org_id, cardId);
      }

      // Verify each transaction has correct reference
      for (const cardId of cardIds) {
        const { data: transactions } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', profile.id)
          .eq('reference_id', cardId);

        expect(transactions).toHaveLength(1);
        expect(transactions![0].description).toBe('Card generation');
      }
    });

    it('should handle missing metadata gracefully', async () => {
      const { profile } = testData;

      // Manually create transaction without metadata
      const { data: transaction } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: profile.id,
          org_id: profile.org_id,
          transaction_type: 'bonus',
          amount: 10,
          credits_before: 0,
          credits_after: 10,
          description: 'Test bonus',
          reference_id: 'bonus-test',
          metadata: {}
        })
        .select()
        .single();

      expect(transaction.metadata).toEqual({});

      const history = await getCreditHistory(profile.id);
      const bonusTransaction = history.find(t => t.reference_id === 'bonus-test');
      expect(bonusTransaction?.metadata).toEqual({});
    });
  });

  describe('Transaction Audit Trail', () => {
    it('should provide complete audit trail for credit operations', async () => {
      const { profile } = testData;

      // Perform auditable operations
      await addCredits(profile.id, profile.org_id, 100, 'audit-purchase-1', 'Initial credits');
      await grantUnlimitedTemplates(profile.id, profile.org_id, 'audit-unlimited');
      
      await supabase.from('profiles').update({ card_generation_count: 10 }).eq('id', profile.id);
      
      await deductCardGenerationCredit(profile.id, profile.org_id, 'audit-card-1');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'audit-card-2');

      const history = await getCreditHistory(profile.id);

      // Verify audit trail completeness
      expect(history).toHaveLength(4);

      // Check each transaction has required audit fields
      history.forEach(transaction => {
        expect(transaction.id).toBeDefined();
        expect(transaction.user_id).toBe(profile.id);
        expect(transaction.org_id).toBe(profile.org_id);
        expect(transaction.transaction_type).toMatch(/^(purchase|usage|refund|bonus)$/);
        expect(typeof transaction.amount).toBe('number');
        expect(typeof transaction.credits_before).toBe('number');
        expect(typeof transaction.credits_after).toBe('number');
        expect(transaction.created_at).toBeDefined();
        expect(new Date(transaction.created_at).getTime()).toBeLessThanOrEqual(Date.now());
      });
    });

    it('should maintain transaction immutability', async () => {
      const { profile } = testData;

      await addCredits(profile.id, profile.org_id, 50, 'immutable-test');

      const { data: originalTransaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'immutable-test')
        .single();

      // Attempt to modify (should fail or be ignored)
      await supabase
        .from('credit_transactions')
        .update({ amount: 999 })
        .eq('id', originalTransaction.id);

      const { data: afterUpdate } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('id', originalTransaction.id)
        .single();

      // Transaction should remain unchanged (depending on RLS policies)
      expect(afterUpdate.amount).toBe(originalTransaction.amount);
    });
  });
});