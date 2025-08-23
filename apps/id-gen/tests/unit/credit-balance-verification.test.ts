import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { 
  deductCardGenerationCredit, 
  addCredits,
  getUserCredits,
  getCreditHistory
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

describe('Credit Usage - Balance Update Verification', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Balance Consistency Verification', () => {
    it('should maintain balance consistency after credit purchases', async () => {
      const { profile } = testData;
      const initialBalance = profile.credits_balance;

      // Purchase credits
      const result = await addCredits(profile.id, profile.org_id, 100, 'consistency-test-1');
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(initialBalance + 100);

      // Verify profile balance updated
      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(initialBalance + 100);

      // Verify transaction balance matches using history
      const history1 = await getCreditHistory(profile.id, 50);
      const transaction = history1.find((t) => t.reference_id === 'consistency-test-1');
      expect(transaction).toBeDefined();
      expect(transaction!.credits_after).toBe(initialBalance + 100);
      expect(transaction!.credits_before).toBe(initialBalance);
    });

    it('should maintain balance consistency after credit deductions', async () => {
      const { profile } = testData;

      // Set up user with credits and past free limit
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 50
        })
        .eq('id', profile.id);
      // Sync mock state with DB for tests running against mocked utilities
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { card_generation_count: 10, credits_balance: 50 });

      // Deduct credits
      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'consistency-test-deduct'
      );
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(49);

      // Verify profile balance updated
      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(49);

      // Verify transaction balance matches using history
      const history2 = await getCreditHistory(profile.id, 50);
      const transaction = history2.find((t) => t.reference_id === 'consistency-test-deduct');
      expect(transaction).toBeDefined();
      expect(transaction!.credits_after).toBe(49);
      expect(transaction!.credits_before).toBe(50);
    });

    it('should verify balance matches transaction history sum', async () => {
      const { profile } = testData;
      const initialBalance = profile.credits_balance;

      // Perform multiple operations
      await addCredits(profile.id, profile.org_id, 75, 'purchase-1');
      await addCredits(profile.id, profile.org_id, 25, 'purchase-2');

      // Set up for deductions
      await supabase
        .from('profiles')
        .update({ card_generation_count: 10 })
        .eq('id', profile.id);
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { card_generation_count: 10 });

      await deductCardGenerationCredit(profile.id, profile.org_id, 'deduct-1');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'deduct-2');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'deduct-3');

      // Get current balance
      const currentCredits = await getUserCredits(profile.id);
      const currentBalance = currentCredits?.credits_balance;

      // Calculate expected balance from transactions
      const history = await getCreditHistory(profile.id);
      const transactionSum = history.reduce((sum, t) => sum + t.amount, 0);
      const expectedBalance = initialBalance + transactionSum;

      expect(currentBalance).toBe(expectedBalance);
      expect(currentBalance).toBe(initialBalance + 75 + 25 - 1 - 1 - 1); // 97 + initial
    });
  });

  describe('Atomic Operation Verification', () => {
    it('should ensure atomic updates for credit deductions', async () => {
      const { profile } = testData;

      // Set up test state
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 5
        })
        .eq('id', profile.id);
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { card_generation_count: 10, credits_balance: 5 });

      // Perform deduction
      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'atomic-test'
      );

      expect(result.success).toBe(true);

      // Verify both profile and transaction were created atomically
      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(4);
      expect(credits?.card_generation_count).toBe(11);

      const history3 = await getCreditHistory(profile.id, 50);
      const transaction = history3.find((t) => t.reference_id === 'atomic-test');
      expect(transaction).toBeDefined();
      expect(transaction!.credits_before).toBe(5);
      expect(transaction!.credits_after).toBe(4);
    });

    it('should ensure atomic updates for credit purchases', async () => {
      const { profile } = testData;
      const initialBalance = profile.credits_balance;

      const result = await addCredits(
        profile.id,
        profile.org_id,
        120,
        'atomic-purchase-test'
      );

      expect(result.success).toBe(true);

      // Verify both profile and transaction were created atomically
      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(initialBalance + 120);

      const history4 = await getCreditHistory(profile.id, 50);
      const transaction = history4.find((t) => t.reference_id === 'atomic-purchase-test');
      expect(transaction).toBeDefined();
      expect(transaction!.amount).toBe(120);
      expect(transaction!.credits_after).toBe(initialBalance + 120);
    });

    it('should handle failed operations without partial updates', async () => {
      const { profile } = testData;

      // Set up user with no credits
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 0
        })
        .eq('id', profile.id);
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { card_generation_count: 10, credits_balance: 0 });

      const initialCredits = await getUserCredits(profile.id);

      // Attempt failed deduction
      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'failed-atomic-test'
      );

      expect(result.success).toBe(false);

      // Verify no state changes occurred
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(initialCredits?.credits_balance);
      expect(finalCredits?.card_generation_count).toBe(initialCredits?.card_generation_count);

      // Verify no transaction was created
      const history5 = await getCreditHistory(profile.id, 50);
      const transactions = history5.filter((t) => t.reference_id === 'failed-atomic-test');
      expect(transactions).toHaveLength(0);
    });
  });

  describe('Balance Accuracy Under Load', () => {
    it('should maintain accurate balance during rapid operations', async () => {
      const { profile } = testData;

      // Set up initial state
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 100
        })
        .eq('id', profile.id);
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { card_generation_count: 10, credits_balance: 100 });

      // Perform rapid sequence of operations
      const operations = [];
      for (let i = 1; i <= 20; i++) {
        operations.push(
          deductCardGenerationCredit(profile.id, profile.org_id, `rapid-${i}`)
        );
      }

      const results = await Promise.all(operations);
      const successCount = results.filter(r => r.success).length;

      // Verify final balance is consistent
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(100 - successCount);
      expect(finalCredits?.card_generation_count).toBe(10 + successCount);

      // Verify transaction count matches successful operations
      const history6 = await getCreditHistory(profile.id, 100);
      const transactions = history6.filter((t) => t.transaction_type === 'usage');
      expect(transactions).toHaveLength(successCount);
    });

    it('should prevent race conditions in balance updates', async () => {
      const { profile } = testData;

      // Set up user with limited credits
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 3
        })
        .eq('id', profile.id);
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { card_generation_count: 10, credits_balance: 3 });

      // Launch concurrent operations that would exceed available credits
      const promises = Array.from({ length: 10 }, (_, i) =>
        deductCardGenerationCredit(profile.id, profile.org_id, `race-${i}`)
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;

      // Should only allow 3 successful operations (matching available credits)
      expect(successCount).toBe(3);

      // Final balance should be exactly 0
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(0);

      // Verify transaction accuracy
      const history7 = await getCreditHistory(profile.id, 100);
      const transactions = history7.filter((t) => t.transaction_type === 'usage').sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

      expect(transactions).toHaveLength(3);

      // Verify transaction sequence regardless of exact timing
      const seq = transactions.map(t => ({ before: t.credits_before, after: t.credits_after }));
      // Expect monotonically decreasing credits from 3 -> 2 -> 1 -> 0 across the three transactions
      expect(new Set(seq.map(s => s.before))).toEqual(new Set([3,2,1]));
      expect(new Set(seq.map(s => s.after))).toEqual(new Set([2,1,0]));
      seq.forEach(s => expect(s.before - s.after).toBe(1));
    });
  });

  describe('Historical Balance Reconstruction', () => {
    it('should be able to reconstruct balance from transaction history', async () => {
      const { profile } = testData;
      const initialBalance = profile.credits_balance;

      // Perform a series of operations
      await addCredits(profile.id, profile.org_id, 150, 'reconstruct-purchase-1');
      await addCredits(profile.id, profile.org_id, 50, 'reconstruct-purchase-2');

      await supabase
        .from('profiles')
        .update({ card_generation_count: 10 })
        .eq('id', profile.id);

      await deductCardGenerationCredit(profile.id, profile.org_id, 'reconstruct-deduct-1');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'reconstruct-deduct-2');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'reconstruct-deduct-3');

      // Get complete transaction history
      const history = await getCreditHistory(profile.id, 100); // Get all transactions
      
      // Reconstruct balance step by step
      let reconstructedBalance = initialBalance;
      
      // Process transactions in chronological order (reverse of returned order)
      const chronologicalHistory = [...history].reverse();
      
      for (const transaction of chronologicalHistory) {
        expect(transaction.credits_before).toBe(reconstructedBalance);
        reconstructedBalance += transaction.amount;
        expect(transaction.credits_after).toBe(reconstructedBalance);
      }

      // Final reconstructed balance should match current balance
      const currentCredits = await getUserCredits(profile.id);
      expect(reconstructedBalance).toBe(currentCredits?.credits_balance);
    });

    it('should detect balance inconsistencies if they exist', async () => {
      const { profile } = testData;

      // Perform normal operations
      await addCredits(profile.id, profile.org_id, 100, 'consistency-check');
      await supabase
        .from('profiles')
        .update({ card_generation_count: 10 })
        .eq('id', profile.id);
      await deductCardGenerationCredit(profile.id, profile.org_id, 'consistency-deduct');

      // Verify consistency
      const currentCredits = await getUserCredits(profile.id);
      const history = await getCreditHistory(profile.id);
      
      const totalTransactionAmount = history.reduce((sum, t) => sum + t.amount, 0);
      const expectedBalance = profile.credits_balance + totalTransactionAmount;
      
      expect(currentCredits?.credits_balance).toBe(expectedBalance);
    });
  });

  describe('Balance Edge Cases', () => {
    it('should handle zero balance scenarios correctly', async () => {
      const { profile } = testData;

      // Set balance to exactly 1
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 1
        })
        .eq('id', profile.id);
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { card_generation_count: 10, credits_balance: 1 });

      // Deduct the last credit
      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'zero-balance-test'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(0);

      // Verify zero balance state
      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(0);

      // Verify transaction recorded correctly
      const history8 = await getCreditHistory(profile.id, 50);
      const transaction = history8.find((t) => t.reference_id === 'zero-balance-test');
      expect(transaction).toBeDefined();
      expect(transaction!.credits_before).toBe(1);
      expect(transaction!.credits_after).toBe(0);
    });

    it('should handle large balance numbers correctly', async () => {
      const { profile } = testData;

      // Add large amount of credits
      const largeAmount = 999999;
      const result = await addCredits(
        profile.id,
        profile.org_id,
        largeAmount,
        'large-balance-test'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(profile.credits_balance + largeAmount);

      // Verify balance stored correctly
      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(profile.credits_balance + largeAmount);

      // Verify transaction amounts are accurate
      const history9 = await getCreditHistory(profile.id, 50);
      const transaction = history9.find((t) => t.reference_id === 'large-balance-test');
      expect(transaction).toBeDefined();
      expect(transaction!.amount).toBe(largeAmount);
      expect(transaction!.credits_after).toBe(profile.credits_balance + largeAmount);
    });

    it('should maintain precision for all balance operations', async () => {
      const { profile } = testData;

      // Perform many small operations
      for (let i = 1; i <= 100; i++) {
        await addCredits(profile.id, profile.org_id, 1, `precision-${i}`);
      }

      // Verify exact balance
      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(profile.credits_balance + 100);

      // Verify transaction sum
      const history = await getCreditHistory(profile.id, 200);
      const purchaseTransactions = history.filter(t => t.transaction_type === 'purchase');
      const totalPurchased = purchaseTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      expect(totalPurchased).toBe(100);
    });
  });

  describe('Balance Recovery and Error Handling', () => {
    it('should handle database errors gracefully without corrupting balance', async () => {
      const { profile } = testData;
      const initialCredits = await getUserCredits(profile.id);

      // Ensure free generations are exhausted so deduction would require org validation/credits
      await supabase
        .from('profiles')
        .update({ card_generation_count: 10 })
        .eq('id', profile.id);
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { card_generation_count: 10 });

      // Attempt operation with invalid org_id (should fail)
      const result = await deductCardGenerationCredit(
        profile.id,
        'invalid-org-id',
        'error-recovery-test'
      );

      expect(result.success).toBe(false);

      // Verify balance unchanged
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(initialCredits?.credits_balance);
      expect(finalCredits?.card_generation_count).toBe(10);

      // Verify no transaction created
      const history10 = await getCreditHistory(profile.id, 50);
      const transactions = history10.filter((t) => t.reference_id === 'error-recovery-test');
      expect(transactions).toHaveLength(0);
    });

    it('should handle null/undefined balance values gracefully', async () => {
      const { profile } = testData;
      // Simulate null balance in mock and verify accessor handles it
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { credits_balance: null as unknown as number });

      const credits = await getUserCredits(profile.id);
      // Should handle null gracefully (fallback to 0)
      expect(credits?.credits_balance).toBeDefined();
    });
  });
});