import { expect } from 'vitest';
import { testDataManager } from './TestDataManager';
import { supabase } from '$lib/supabaseClient';
import { addCredits, getUserCredits, getCreditHistory } from '$lib/utils/credits';
import type { CreditTransaction } from '$lib/utils/credits';

export class CreditTestUtils {
  /**
   * Create user with specific credit configuration
   */
  static async createUserWithCredits(config: {
    credits_balance: number;
    card_generation_count: number;
    template_count: number;
    unlimited_templates?: boolean;
    remove_watermarks?: boolean;
  }) {
    const testData = await testDataManager.createMinimalTestData();
    
    await supabase
      .from('profiles')
      .update(config)
      .eq('id', testData.profile.id);

    return testData;
  }

  /**
   * Create user at free generation limit (10 cards generated)
   */
  static async createUserAtFreeLimit(credits_balance = 0) {
    return await this.createUserWithCredits({
      credits_balance,
      card_generation_count: 10,
      template_count: 0
    });
  }

  /**
   * Create user with exhausted free generations and some credits
   */
  static async createUserWithCredits_PostFree(credits_balance = 50) {
    return await this.createUserWithCredits({
      credits_balance,
      card_generation_count: 10,
      template_count: 0
    });
  }

  /**
   * Create user at template limit
   */
  static async createUserAtTemplateLimit(unlimited_templates = false) {
    return await this.createUserWithCredits({
      credits_balance: 100,
      card_generation_count: 5,
      template_count: 2,
      unlimited_templates
    });
  }

  /**
   * Verify transaction logging accuracy
   */
  static async verifyTransactionLogging(
    userId: string,
    expectedTransactions: Array<{
      type: 'purchase' | 'usage' | 'refund' | 'bonus';
      amount: number;
      description?: string;
      reference_id?: string;
    }>
  ) {
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    expect(transactions).toHaveLength(expectedTransactions.length);

    transactions!.forEach((transaction, index) => {
      const expected = expectedTransactions[index];
      expect(transaction.transaction_type).toBe(expected.type);
      expect(transaction.amount).toBe(expected.amount);
      
      if (expected.description) {
        expect(transaction.description).toBe(expected.description);
      }
      
      if (expected.reference_id) {
        expect(transaction.reference_id).toBe(expected.reference_id);
      }
    });
  }

  /**
   * Simulate credit purchase
   */
  static async simulateCreditPurchase(
    userId: string,
    orgId: string,
    amount: number,
    paymentRef = `test-payment-${Date.now()}`
  ) {
    return await addCredits(userId, orgId, amount, paymentRef, 'Test credit purchase');
  }

  /**
   * Verify credit balance consistency
   */
  static async verifyCreditConsistency(userId: string) {
    const credits = await getUserCredits(userId);
    
    // Get all transactions
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!transactions || transactions.length === 0) {
      // No transactions, balance should match profile's initial balance
      return true;
    }

    // Calculate expected balance from transactions
    let expectedBalance = transactions[0].credits_before;
    for (const transaction of transactions) {
      expectedBalance += transaction.amount;
      expect(transaction.credits_after).toBe(expectedBalance);
    }

    expect(credits?.credits_balance).toBe(expectedBalance);
  }

  /**
   * Create scenario with mixed transaction history
   */
  static async createMixedTransactionHistory(userId: string, orgId: string) {
    // Purchase credits
    await addCredits(userId, orgId, 100, 'scenario-purchase-1', 'Initial purchase');
    
    // Set up for paid generations
    await supabase
      .from('profiles')
      .update({ card_generation_count: 10 })
      .eq('id', userId);

    // Import deductCardGenerationCredit here to avoid circular dependency
    const { deductCardGenerationCredit } = await import('$lib/utils/credits');
    
    // Use some credits
    await deductCardGenerationCredit(userId, orgId, 'scenario-card-1');
    await deductCardGenerationCredit(userId, orgId, 'scenario-card-2');
    
    // Purchase more credits
    await addCredits(userId, orgId, 50, 'scenario-purchase-2', 'Second purchase');
    
    // Use more credits
    await deductCardGenerationCredit(userId, orgId, 'scenario-card-3');

    return {
      expectedBalance: 100 - 1 - 1 + 50 - 1, // 147 + initial balance
      expectedTransactionCount: 5
    };
  }

  /**
   * Verify transaction sequence integrity
   */
  static async verifyTransactionSequence(userId: string) {
    const history = await getCreditHistory(userId);
    
    if (history.length === 0) return true;

    // Verify transactions are in reverse chronological order
    for (let i = 0; i < history.length - 1; i++) {
      const current = new Date(history[i].created_at).getTime();
      const next = new Date(history[i + 1].created_at).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }

    // Verify before/after balance chain
    const chronological = [...history].reverse();
    for (let i = 1; i < chronological.length; i++) {
      const prev = chronological[i - 1];
      const current = chronological[i];
      expect(current.credits_before).toBe(prev.credits_after);
    }
  }

  /**
   * Get transaction statistics for a user
   */
  static async getTransactionStats(userId: string) {
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId);

    if (!transactions || transactions.length === 0) {
      return {
        total: 0,
        purchases: 0,
        usage: 0,
        totalPurchased: 0,
        totalUsed: 0,
        netChange: 0
      };
    }

    const purchases = transactions.filter(t => t.transaction_type === 'purchase');
    const usage = transactions.filter(t => t.transaction_type === 'usage');
    
    const totalPurchased = purchases.reduce((sum, t) => sum + t.amount, 0);
    const totalUsed = Math.abs(usage.reduce((sum, t) => sum + t.amount, 0));
    const netChange = transactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      total: transactions.length,
      purchases: purchases.length,
      usage: usage.length,
      totalPurchased,
      totalUsed,
      netChange
    };
  }

  /**
   * Simulate concurrent credit operations for testing race conditions
   */
  static async simulateConcurrentOperations(
    userId: string,
    orgId: string,
    operationCount: number,
    availableCredits: number
  ) {
    // Set up user with specific credit amount
    await supabase
      .from('profiles')
      .update({
        card_generation_count: 10, // Past free limit
        credits_balance: availableCredits
      })
      .eq('id', userId);

    const { deductCardGenerationCredit } = await import('$lib/utils/credits');

    // Launch concurrent operations
    const promises = Array.from({ length: operationCount }, (_, i) =>
      deductCardGenerationCredit(userId, orgId, `concurrent-${i}`)
    );

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;

    return {
      attempted: operationCount,
      successful: successCount,
      failed: operationCount - successCount,
      results
    };
  }

  /**
   * Create test data for performance testing
   */
  static async createPerformanceTestData(userId: string, orgId: string, transactionCount = 100) {
    const operations = [];
    
    // Mix of purchases and usage
    for (let i = 0; i < transactionCount; i++) {
      if (i % 10 === 0) {
        // Every 10th operation is a purchase
        operations.push(
          addCredits(userId, orgId, 50, `perf-purchase-${i}`, 'Performance test purchase')
        );
      } else {
        // Set up for usage operations
        await supabase
          .from('profiles')
          .update({ card_generation_count: 10 })
          .eq('id', userId);

        const { deductCardGenerationCredit } = await import('$lib/utils/credits');
        operations.push(
          deductCardGenerationCredit(userId, orgId, `perf-card-${i}`)
        );
      }
    }

    const startTime = Date.now();
    await Promise.all(operations);
    const endTime = Date.now();

    return {
      transactionCount,
      duration: endTime - startTime,
      avgTimePerTransaction: (endTime - startTime) / transactionCount
    };
  }

  /**
   * Verify no orphaned transactions exist
   */
  static async verifyNoOrphanedTransactions(userId: string) {
    // Check that all transactions have valid user and org references
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select(`
        *,
        profiles!inner(id),
        organizations!inner(id)
      `)
      .eq('user_id', userId);

    expect(transactions).toBeDefined();
    
    // All transactions should have valid profile and organization references
    transactions!.forEach(transaction => {
      expect(transaction.profiles).toBeDefined();
      expect(transaction.organizations).toBeDefined();
    });
  }

  /**
   * Clean up test transactions (for cleanup verification)
   */
  static async cleanupTestTransactions(userId: string) {
    const { error } = await supabase
      .from('credit_transactions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.warn('Failed to cleanup test transactions:', error);
    }
  }

  /**
   * Simulate credit system stress test
   */
  static async stressTest(userId: string, orgId: string, options: {
    concurrentOperations: number;
    iterations: number;
    creditsPerIteration: number;
  }) {
    const results = [];

    for (let i = 0; i < options.iterations; i++) {
      // Give user credits for this iteration
      await this.simulateCreditPurchase(userId, orgId, options.creditsPerIteration);

      // Perform concurrent operations
      const result = await this.simulateConcurrentOperations(
        userId,
        orgId,
        options.concurrentOperations,
        options.creditsPerIteration
      );

      results.push(result);

      // Verify consistency after each iteration
      await this.verifyCreditConsistency(userId);
    }

    return {
      iterations: options.iterations,
      results,
      totalOperations: results.reduce((sum, r) => sum + r.attempted, 0),
      totalSuccessful: results.reduce((sum, r) => sum + r.successful, 0)
    };
  }
}

// Export helper functions for common test scenarios
export const creditTestScenarios = {
  /**
   * User with no credits, past free limit
   */
  async noCreditsPostFree() {
    return await CreditTestUtils.createUserAtFreeLimit(0);
  },

  /**
   * User with some credits, past free limit
   */
  async hasCreditsPostFree(credits = 50) {
    return await CreditTestUtils.createUserWithCredits_PostFree(credits);
  },

  /**
   * User at template limit
   */
  async atTemplateLimit() {
    return await CreditTestUtils.createUserAtTemplateLimit(false);
  },

  /**
   * User with unlimited templates
   */
  async unlimitedTemplates() {
    return await CreditTestUtils.createUserAtTemplateLimit(true);
  },

  /**
   * User with exactly 1 credit
   */
  async oneCredit() {
    return await CreditTestUtils.createUserAtFreeLimit(1);
  }
};

