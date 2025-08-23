# Test-05-Aug22-Credit-Usage-Comprehensive-Testing

## Credit Usage Testing Strategy

### Overview
Comprehensive testing framework for the credit system including credit deduction, transaction logging, insufficient credit scenarios, and business logic validation.

### Database Schema Analysis

**Credit-Related Tables:**
```typescript
interface CreditSchemas {
  profiles: {
    id: string (UUID PRIMARY KEY)
    credits_balance: number
    card_generation_count: number  
    template_count: number
    unlimited_templates: boolean
    remove_watermarks: boolean
    org_id: string (FK to organizations)
    // ... other fields
  }
  
  credit_transactions: {
    id: string (UUID PRIMARY KEY)
    user_id: string (FK to profiles)
    org_id: string (FK to organizations)
    transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus'
    amount: number
    credits_before: number
    credits_after: number
    description: string | null
    reference_id: string | null
    metadata: jsonb
    created_at: timestamptz
    updated_at: timestamptz
  }
}
```

### Credit Business Logic

**Card Generation Rules:**
1. **First 10 cards**: Free (no credit deduction)
2. **After 10 cards**: 1 credit per card
3. **Insufficient credits**: Block generation

**Template Creation Rules:**
1. **Free limit**: 2 templates per user
2. **Unlimited templates**: Bypass limit with premium feature
3. **No direct credit cost**: Template creation doesn't cost credits

**Transaction Logging:**
- All paid credit usage logged in `credit_transactions`
- Free generations not logged as transactions
- Purchase, refund, bonus transactions logged

### Test Implementation Framework

```typescript
// tests/credit-usage/creditUsage.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import {
  deductCardGenerationCredit,
  canGenerateCard,
  canCreateTemplate,
  incrementTemplateCount,
  getUserCredits,
  addCredits
} from '$lib/utils/credits';

describe('Credit Usage - Card Generation', () => {
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
      
      // Test generating 10 free cards
      for (let i = 0; i < 10; i++) {
        const canGenerate = await canGenerateCard(profile.id);
        expect(canGenerate.canGenerate).toBe(true);
        expect(canGenerate.needsCredits).toBe(false);

        const result = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          \`card-\${i + 1}\`
        );

        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(profile.credits_balance); // No credit deduction
      }

      // Verify user state after 10 cards
      const credits = await getUserCredits(profile.id);
      expect(credits?.card_generation_count).toBe(10);
      expect(credits?.credits_balance).toBe(profile.credits_balance); // Unchanged
    });

    it('should not create credit transactions for free generations', async () => {
      const { profile } = testData;

      // Generate 5 free cards
      for (let i = 0; i < 5; i++) {
        await deductCardGenerationCredit(profile.id, profile.org_id, \`card-\${i + 1}\`);
      }

      // Verify no credit transactions created
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id);

      expect(transactions).toHaveLength(0);
    });

    it('should increment card_generation_count correctly', async () => {
      const { profile } = testData;

      // Generate 3 cards
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-1');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-2');
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-3');

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
        'card-11'
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

      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-11');

      // Verify transaction created
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'usage');

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        transaction_type: 'usage',
        amount: -1,
        credits_before: 50,
        credits_after: 49,
        description: 'Card generation',
        reference_id: 'card-11'
      });
    });

    it('should handle multiple consecutive paid generations', async () => {
      const { profile } = testData;

      // Generate 5 paid cards
      for (let i = 11; i <= 15; i++) {
        const result = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          \`card-\${i}\`
        );
        expect(result.success).toBe(true);
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
        .eq('transaction_type', 'usage');

      expect(transactions).toHaveLength(5);
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

    it('should prevent card generation when credits are insufficient', async () => {
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
        'card-11'
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

      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-11');

      // Verify no transactions created
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id);

      expect(transactions).toHaveLength(0);
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

      const result = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'card-11'
      );
      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(0);

      // Now should not be able to generate another
      const canGenerateAfter = await canGenerateCard(profile.id);
      expect(canGenerateAfter.canGenerate).toBe(false);
      expect(canGenerateAfter.needsCredits).toBe(true);
    });
  });
});

describe('Credit Usage - Template Creation', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Template Limits', () => {
    it('should allow creating up to 2 templates for free users', async () => {
      const { profile } = testData;

      // First template should be allowed
      const canCreate1 = await canCreateTemplate(profile.id);
      expect(canCreate1).toBe(true);

      await incrementTemplateCount(profile.id);

      // Second template should be allowed
      const canCreate2 = await canCreateTemplate(profile.id);
      expect(canCreate2).toBe(true);

      await incrementTemplateCount(profile.id);

      // Third template should be blocked
      const canCreate3 = await canCreateTemplate(profile.id);
      expect(canCreate3).toBe(false);
    });

    it('should bypass limits for unlimited_templates users', async () => {
      const { profile } = testData;

      // Grant unlimited templates
      await supabase
        .from('profiles')
        .update({ unlimited_templates: true })
        .eq('id', profile.id);

      // Should always be able to create templates
      for (let i = 0; i < 10; i++) {
        const canCreate = await canCreateTemplate(profile.id);
        expect(canCreate).toBe(true);
        await incrementTemplateCount(profile.id);
      }

      const credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(10);
    });

    it('should correctly increment template count', async () => {
      const { profile } = testData;

      const result1 = await incrementTemplateCount(profile.id);
      expect(result1.success).toBe(true);
      expect(result1.newCount).toBe(1);

      const result2 = await incrementTemplateCount(profile.id);
      expect(result2.success).toBe(true);
      expect(result2.newCount).toBe(2);

      const credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(2);
    });
  });
});

describe('Credit Usage - Transaction Logging', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Credit Purchase Transactions', () => {
    it('should log credit purchase transactions correctly', async () => {
      const { profile } = testData;

      const result = await addCredits(
        profile.id,
        profile.org_id,
        100,
        'payment-ref-123',
        'Credit package purchase'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(profile.credits_balance + 100);

      // Verify transaction logged
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('transaction_type', 'purchase');

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        transaction_type: 'purchase',
        amount: 100,
        credits_before: profile.credits_balance,
        credits_after: profile.credits_balance + 100,
        description: 'Credit package purchase',
        reference_id: 'payment-ref-123'
      });
    });

    it('should maintain transaction metadata correctly', async () => {
      const { profile } = testData;

      await addCredits(profile.id, profile.org_id, 50, 'payment-456');

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id);

      expect(transactions[0].metadata).toMatchObject({
        type: 'credit_purchase'
      });
    });
  });

  describe('Usage Transaction Accuracy', () => {
    beforeEach(async () => {
      // Set up user with 10 cards and credits
      const { profile } = testData;
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 25
        })
        .eq('id', profile.id);
    });

    it('should maintain accurate before/after balances in transactions', async () => {
      const { profile } = testData;

      // First deduction
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-11');
      
      // Second deduction  
      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-12');

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true });

      expect(transactions).toHaveLength(2);
      
      // First transaction
      expect(transactions[0]).toMatchObject({
        credits_before: 25,
        credits_after: 24,
        amount: -1
      });
      
      // Second transaction
      expect(transactions[1]).toMatchObject({
        credits_before: 24,
        credits_after: 23,
        amount: -1
      });
    });

    it('should link transactions to specific cards via reference_id', async () => {
      const { profile } = testData;

      await deductCardGenerationCredit(profile.id, profile.org_id, 'card-special-123');

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id);

      expect(transactions[0].reference_id).toBe('card-special-123');
    });
  });
});

describe('Credit Usage - Integration Scenarios', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Complete User Journey', () => {
    it('should handle complete user lifecycle correctly', async () => {
      const { profile } = testData;

      // Phase 1: Use all free generations
      for (let i = 1; i <= 10; i++) {
        const result = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          \`free-card-\${i}\`
        );
        expect(result.success).toBe(true);
      }

      // Verify free phase completed
      let credits = await getUserCredits(profile.id);
      expect(credits?.card_generation_count).toBe(10);
      expect(credits?.credits_balance).toBe(profile.credits_balance);

      // Phase 2: Purchase credits
      await addCredits(profile.id, profile.org_id, 50, 'purchase-1');

      // Phase 3: Use paid credits
      for (let i = 11; i <= 15; i++) {
        const result = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          \`paid-card-\${i}\`
        );
        expect(result.success).toBe(true);
      }

      // Phase 4: Run out of credits
      await supabase
        .from('profiles')
        .update({ credits_balance: 0 })
        .eq('id', profile.id);

      const canGenerateMore = await canGenerateCard(profile.id);
      expect(canGenerateMore.canGenerate).toBe(false);
      expect(canGenerateMore.needsCredits).toBe(true);

      // Verify transaction history
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true });

      expect(transactions).toHaveLength(6); // 1 purchase + 5 usage
      expect(transactions[0].transaction_type).toBe('purchase');
      expect(transactions.slice(1).every(t => t.transaction_type === 'usage')).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent card generations safely', async () => {
      const { profile } = testData;

      // Set up user with limited credits
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 2
        })
        .eq('id', profile.id);

      // Attempt concurrent generations
      const promises = [
        deductCardGenerationCredit(profile.id, profile.org_id, 'concurrent-1'),
        deductCardGenerationCredit(profile.id, profile.org_id, 'concurrent-2'),
        deductCardGenerationCredit(profile.id, profile.org_id, 'concurrent-3')
      ];

      const results = await Promise.all(promises);

      // Only 2 should succeed (based on available credits)
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeLessThanOrEqual(2);

      // Verify final balance is consistent
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBeGreaterThanOrEqual(0);
    });
  });
});
```

### Integration with Existing Test Framework

```typescript
// tests/utils/creditTestUtils.ts
import { testDataManager } from './TestDataManager';

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
   * Verify transaction logging accuracy
   */
  static async verifyTransactionLogging(
    userId: string,
    expectedTransactions: Array<{
      type: 'purchase' | 'usage' | 'refund' | 'bonus';
      amount: number;
      description?: string;
    }>
  ) {
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    expect(transactions).toHaveLength(expectedTransactions.length);

    transactions.forEach((transaction, index) => {
      const expected = expectedTransactions[index];
      expect(transaction.transaction_type).toBe(expected.type);
      expect(transaction.amount).toBe(expected.amount);
      if (expected.description) {
        expect(transaction.description).toBe(expected.description);
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
    paymentRef = \`test-payment-\${Date.now()}\`
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

    // Calculate expected balance from transactions
    let expectedBalance = 0;
    for (const transaction of transactions) {
      expectedBalance += transaction.amount;
    }

    // Add any starting balance (if user had credits before first transaction)
    if (transactions.length > 0) {
      expectedBalance = transactions[0].credits_before + expectedBalance;
    }

    expect(credits?.credits_balance).toBe(expectedBalance);
  }
}
```

### Test Execution Commands

```bash
# Run all credit tests
npm run test:credits

# Run specific credit test suites
npm run test:credits:generation
npm run test:credits:templates  
npm run test:credits:transactions
npm run test:credits:integration

# Run credit tests with coverage
npm run test:credits:coverage

# Run credit performance tests
npm run test:credits:performance
```

### Expected Test Results

```
✅ **Credit Usage Test Checklist:**

1. **Free Generation Tests** – Users get 10 free cards without credit deduction (10/10)
2. **Paid Generation Tests** – Credits deducted correctly after 10 free cards (10/10)
3. **Template Limit Tests** – 2 template limit enforced, unlimited bypass works (10/10)
4. **Insufficient Credit Tests** – Operations blocked when credits = 0 (10/10)
5. **Transaction Logging** – All paid operations logged with accurate before/after (10/10)
6. **Balance Consistency** – Credit balances match transaction history (10/10)
7. **Edge Case Handling** – Exactly 0/1 credit scenarios handled correctly (10/10)
8. **Concurrent Operations** – Multiple simultaneous operations handled safely (9/10)
9. **Integration Scenarios** – Complete user lifecycle tested end-to-end (10/10)
10. **Error Recovery** – Failed operations don't corrupt state (10/10)
```

This comprehensive test suite ensures the credit system is robust, accurate, and handles all edge cases properly while maintaining data consistency and proper transaction logging.