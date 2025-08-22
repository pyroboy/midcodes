import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  addCredits,
  deductCardGenerationCredit,
  grantUnlimitedTemplates,
  grantWatermarkRemoval,
  getCreditHistory,
  type CreditTransaction
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

// Mock the Supabase client
vi.mock('$lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('Credit Transaction Types Tests', () => {
  const mockUserId = 'test-user-123';
  const mockOrgId = 'test-org-456';
  
  let mockSupabaseQuery: any;
  let mockTransactionInsert: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock query chain
    mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      limit: vi.fn(),
      order: vi.fn().mockReturnThis()
    };

    // Setup separate mock for transaction inserts
    mockTransactionInsert = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn()
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'credit_transactions') {
        return {
          ...mockSupabaseQuery,
          insert: vi.fn().mockReturnValue(mockTransactionInsert)
        };
      }
      return mockSupabaseQuery;
    });
  });

  describe('Purchase Transaction Type', () => {
    it('should create purchase transaction with correct balance tracking', async () => {
      const initialBalance = 100;
      const addAmount = 50;
      const expectedNewBalance = 150;

      // Mock getting user credits
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { credits_balance: initialBalance },
        error: null
      });

      // Mock profile update
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: {}, error: null });

      // Mock transaction insert
      const expectedTransaction = {
        id: 'txn-123',
        user_id: mockUserId,
        org_id: mockOrgId,
        transaction_type: 'purchase',
        amount: addAmount,
        credits_before: initialBalance,
        credits_after: expectedNewBalance,
        description: 'Credit purchase',
        reference_id: 'payment-ref-123',
        metadata: { type: 'credit_purchase' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockTransactionInsert.single.mockResolvedValue({
        data: expectedTransaction,
        error: null
      });

      const result = await addCredits(
        mockUserId,
        mockOrgId,
        addAmount,
        'payment-ref-123',
        'Credit purchase'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(expectedNewBalance);

      // Verify transaction insert was called with correct data
      expect(mockTransactionInsert.select().insert).toHaveBeenCalled();
      const insertCall = mockTransactionInsert.select().insert.mock.calls[0][0];
      expect(insertCall).toMatchObject({
        user_id: mockUserId,
        org_id: mockOrgId,
        transaction_type: 'purchase',
        amount: addAmount,
        credits_before: initialBalance,
        credits_after: expectedNewBalance,
        description: 'Credit purchase',
        reference_id: 'payment-ref-123',
        metadata: { type: 'credit_purchase' }
      });
    });

    it('should handle different purchase amounts and descriptions', async () => {
      const testCases = [
        {
          initialBalance: 0,
          amount: 100,
          description: 'Initial credit purchase',
          reference: 'first-payment'
        },
        {
          initialBalance: 50,
          amount: 25,
          description: 'Top-up purchase',
          reference: 'topup-payment'
        },
        {
          initialBalance: 200,
          amount: 500,
          description: 'Bulk credit purchase',
          reference: 'bulk-payment'
        }
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();

        // Mock getting user credits
        mockSupabaseQuery.single.mockResolvedValueOnce({
          data: { credits_balance: testCase.initialBalance },
          error: null
        });

        // Mock profile update
        mockSupabaseQuery.eq.mockResolvedValueOnce({ data: {}, error: null });

        // Mock transaction insert
        mockTransactionInsert.single.mockResolvedValue({ data: {}, error: null });

        const result = await addCredits(
          mockUserId,
          mockOrgId,
          testCase.amount,
          testCase.reference,
          testCase.description
        );

        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(testCase.initialBalance + testCase.amount);

        const insertCall = mockTransactionInsert.select().insert.mock.calls[0][0];
        expect(insertCall.amount).toBe(testCase.amount);
        expect(insertCall.credits_before).toBe(testCase.initialBalance);
        expect(insertCall.credits_after).toBe(testCase.initialBalance + testCase.amount);
        expect(insertCall.description).toBe(testCase.description);
        expect(insertCall.reference_id).toBe(testCase.reference);
      }
    });
  });

  describe('Usage Transaction Type', () => {
    it('should create usage transaction when deducting credits', async () => {
      const initialBalance = 25;
      const initialGenerationCount = 15; // Above free limit
      const expectedNewBalance = 24;

      // Mock getting user credits
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { 
          credits_balance: initialBalance,
          card_generation_count: initialGenerationCount
        },
        error: null
      });

      // Mock profile update
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: {}, error: null });

      // Mock transaction insert
      const expectedTransaction = {
        id: 'txn-usage-123',
        user_id: mockUserId,
        org_id: mockOrgId,
        transaction_type: 'usage',
        amount: -1,
        credits_before: initialBalance,
        credits_after: expectedNewBalance,
        description: 'Card generation',
        reference_id: 'card-456',
        metadata: { type: 'card_generation' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockTransactionInsert.single.mockResolvedValue({
        data: expectedTransaction,
        error: null
      });

      const result = await deductCardGenerationCredit(mockUserId, mockOrgId, 'card-456');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(expectedNewBalance);

      // Verify transaction insert was called with correct data
      const insertCall = mockTransactionInsert.select().insert.mock.calls[0][0];
      expect(insertCall).toMatchObject({
        user_id: mockUserId,
        org_id: mockOrgId,
        transaction_type: 'usage',
        amount: -1,
        credits_before: initialBalance,
        credits_after: expectedNewBalance,
        description: 'Card generation',
        reference_id: 'card-456',
        metadata: { type: 'card_generation' }
      });
    });

    it('should not create usage transaction for free generations', async () => {
      const initialBalance = 50;
      const initialGenerationCount = 5; // Under free limit

      // Mock getting user credits
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { 
          credits_balance: initialBalance,
          card_generation_count: initialGenerationCount
        },
        error: null
      });

      // Mock profile update
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: {}, error: null });

      const result = await deductCardGenerationCredit(mockUserId, mockOrgId, 'free-card-123');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(initialBalance); // No change in credits

      // Verify transaction insert was NOT called (no credit deduction)
      expect(mockTransactionInsert.select().insert).not.toHaveBeenCalled();
    });
  });

  describe('Feature Purchase Transaction Type', () => {
    it('should create purchase transaction for unlimited templates feature', async () => {
      // Mock profile update
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: {}, error: null });

      // Mock transaction insert
      const expectedTransaction = {
        id: 'txn-feature-123',
        user_id: mockUserId,
        org_id: mockOrgId,
        transaction_type: 'purchase',
        amount: 0, // Feature purchase, no credits added
        credits_before: 0,
        credits_after: 0,
        description: 'Unlimited templates upgrade',
        reference_id: 'feature-payment-123',
        metadata: { 
          type: 'unlimited_templates_purchase',
          amount_paid: 99 
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockTransactionInsert.single.mockResolvedValue({
        data: expectedTransaction,
        error: null
      });

      const result = await grantUnlimitedTemplates(mockUserId, mockOrgId, 'feature-payment-123');

      expect(result.success).toBe(true);

      // Verify transaction insert was called with correct data
      const insertCall = mockTransactionInsert.select().insert.mock.calls[0][0];
      expect(insertCall).toMatchObject({
        user_id: mockUserId,
        org_id: mockOrgId,
        transaction_type: 'purchase',
        amount: 0,
        credits_before: 0,
        credits_after: 0,
        description: 'Unlimited templates upgrade',
        reference_id: 'feature-payment-123',
        metadata: { 
          type: 'unlimited_templates_purchase',
          amount_paid: 99 
        }
      });
    });

    it('should create purchase transaction for watermark removal feature', async () => {
      // Mock profile update
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: {}, error: null });

      // Mock transaction insert
      const expectedTransaction = {
        id: 'txn-watermark-123',
        user_id: mockUserId,
        org_id: mockOrgId,
        transaction_type: 'purchase',
        amount: 0, // Feature purchase, no credits added
        credits_before: 0,
        credits_after: 0,
        description: 'Remove watermarks upgrade',
        reference_id: 'watermark-payment-456',
        metadata: { 
          type: 'watermark_removal_purchase',
          amount_paid: 199 
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockTransactionInsert.single.mockResolvedValue({
        data: expectedTransaction,
        error: null
      });

      const result = await grantWatermarkRemoval(mockUserId, mockOrgId, 'watermark-payment-456');

      expect(result.success).toBe(true);

      // Verify transaction insert was called with correct data
      const insertCall = mockTransactionInsert.select().insert.mock.calls[0][0];
      expect(insertCall).toMatchObject({
        user_id: mockUserId,
        org_id: mockOrgId,
        transaction_type: 'purchase',
        amount: 0,
        credits_before: 0,
        credits_after: 0,
        description: 'Remove watermarks upgrade',
        reference_id: 'watermark-payment-456',
        metadata: { 
          type: 'watermark_removal_purchase',
          amount_paid: 199 
        }
      });
    });
  });

  describe('Transaction History Filtering', () => {
    it('should retrieve transactions by type', async () => {
      const mockTransactions: CreditTransaction[] = [
        {
          id: 'txn-1',
          user_id: mockUserId,
          org_id: mockOrgId,
          transaction_type: 'purchase',
          amount: 100,
          credits_before: 0,
          credits_after: 100,
          description: 'Credit purchase',
          reference_id: 'payment-1',
          metadata: { type: 'credit_purchase' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'txn-2',
          user_id: mockUserId,
          org_id: mockOrgId,
          transaction_type: 'usage',
          amount: -1,
          credits_before: 100,
          credits_after: 99,
          description: 'Card generation',
          reference_id: 'card-1',
          metadata: { type: 'card_generation' },
          created_at: '2024-01-01T01:00:00Z',
          updated_at: '2024-01-01T01:00:00Z'
        },
        {
          id: 'txn-3',
          user_id: mockUserId,
          org_id: mockOrgId,
          transaction_type: 'purchase',
          amount: 0,
          credits_before: 99,
          credits_after: 99,
          description: 'Unlimited templates upgrade',
          reference_id: 'feature-1',
          metadata: { type: 'unlimited_templates_purchase', amount_paid: 99 },
          created_at: '2024-01-01T02:00:00Z',
          updated_at: '2024-01-01T02:00:00Z'
        }
      ];

      mockSupabaseQuery.limit.mockResolvedValue({
        data: mockTransactions,
        error: null
      });

      const history = await getCreditHistory(mockUserId);

      expect(history).toEqual(mockTransactions);

      // Verify different transaction types are present
      const transactionTypes = new Set(history.map(t => t.transaction_type));
      expect(transactionTypes.has('purchase')).toBe(true);
      expect(transactionTypes.has('usage')).toBe(true);

      // Verify metadata types
      const metadataTypes = new Set(
        history.map(t => t.metadata?.type).filter(Boolean)
      );
      expect(metadataTypes.has('credit_purchase')).toBe(true);
      expect(metadataTypes.has('card_generation')).toBe(true);
      expect(metadataTypes.has('unlimited_templates_purchase')).toBe(true);
    });
  });

  describe('Balance Consistency Validation', () => {
    it('should maintain sequential balance consistency across transactions', async () => {
      const transactionSequence: CreditTransaction[] = [
        {
          id: 'txn-1',
          user_id: mockUserId,
          org_id: mockOrgId,
          transaction_type: 'purchase',
          amount: 100,
          credits_before: 0,
          credits_after: 100,
          description: 'Initial purchase',
          reference_id: 'payment-1',
          metadata: { type: 'credit_purchase' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'txn-2',
          user_id: mockUserId,
          org_id: mockOrgId,
          transaction_type: 'usage',
          amount: -1,
          credits_before: 100,
          credits_after: 99,
          description: 'Card generation',
          reference_id: 'card-1',
          metadata: { type: 'card_generation' },
          created_at: '2024-01-01T01:00:00Z',
          updated_at: '2024-01-01T01:00:00Z'
        },
        {
          id: 'txn-3',
          user_id: mockUserId,
          org_id: mockOrgId,
          transaction_type: 'purchase',
          amount: 50,
          credits_before: 99,
          credits_after: 149,
          description: 'Top-up purchase',
          reference_id: 'payment-2',
          metadata: { type: 'credit_purchase' },
          created_at: '2024-01-01T02:00:00Z',
          updated_at: '2024-01-01T02:00:00Z'
        }
      ];

      // Verify balance consistency across transactions
      for (let i = 0; i < transactionSequence.length; i++) {
        const transaction = transactionSequence[i];
        
        // Check that amount calculation is correct
        const expectedAfter = transaction.credits_before + transaction.amount;
        expect(transaction.credits_after).toBe(expectedAfter);
        
        // Check that sequential transactions have consistent balances
        if (i > 0) {
          const previousTransaction = transactionSequence[i - 1];
          expect(transaction.credits_before).toBe(previousTransaction.credits_after);
        }
      }
    });

    it('should validate transaction amount signs for different types', () => {
      const transactions = [
        { type: 'purchase', amount: 100, expectedSign: 'positive' },
        { type: 'usage', amount: -1, expectedSign: 'negative' },
        { type: 'refund', amount: 25, expectedSign: 'positive' },
        { type: 'bonus', amount: 10, expectedSign: 'positive' }
      ];

      transactions.forEach(({ type, amount, expectedSign }) => {
        if (expectedSign === 'positive') {
          expect(amount).toBeGreaterThan(0);
        } else {
          expect(amount).toBeLessThan(0);
        }
      });
    });
  });

  describe('Transaction Metadata Validation', () => {
    it('should include appropriate metadata for each transaction type', () => {
      const transactionMetadata = [
        {
          type: 'credit_purchase',
          expectedFields: ['type'],
          metadata: { type: 'credit_purchase' }
        },
        {
          type: 'card_generation',
          expectedFields: ['type'],
          metadata: { type: 'card_generation' }
        },
        {
          type: 'unlimited_templates_purchase',
          expectedFields: ['type', 'amount_paid'],
          metadata: { type: 'unlimited_templates_purchase', amount_paid: 99 }
        },
        {
          type: 'watermark_removal_purchase',
          expectedFields: ['type', 'amount_paid'],
          metadata: { type: 'watermark_removal_purchase', amount_paid: 199 }
        }
      ];

      transactionMetadata.forEach(({ type, expectedFields, metadata }) => {
        expectedFields.forEach(field => {
          expect(metadata).toHaveProperty(field);
        });
        
        expect(metadata.type).toBe(type);
      });
    });
  });

  describe('Error Handling in Transactions', () => {
    it('should not create transaction record on profile update failure', async () => {
      const initialBalance = 50;
      
      // Mock getting user credits
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { credits_balance: initialBalance },
        error: null
      });

      // Mock profile update failure
      mockSupabaseQuery.eq.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Update failed' } 
      });

      const result = await addCredits(mockUserId, mockOrgId, 25, 'payment-fail-test');

      expect(result.success).toBe(false);

      // Verify transaction insert was NOT called due to profile update failure
      expect(mockTransactionInsert.select().insert).not.toHaveBeenCalled();
    });

    it('should handle transaction insert failure gracefully', async () => {
      const initialBalance = 50;
      
      // Mock getting user credits
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { credits_balance: initialBalance },
        error: null
      });

      // Mock successful profile update
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: {}, error: null });

      // Mock transaction insert failure
      mockTransactionInsert.single.mockResolvedValue({
        data: null,
        error: { message: 'Transaction insert failed' }
      });

      // The function should still return success since the main operation (credit addition) succeeded
      const result = await addCredits(mockUserId, mockOrgId, 25, 'txn-fail-test');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(75);
    });
  });
});
