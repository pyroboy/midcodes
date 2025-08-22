import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  CREDIT_PACKAGES,
  PREMIUM_FEATURES,
  type CreditTransaction,
  type UserCredits
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

// Mock the Supabase client
vi.mock('$lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('Credits Utilities Unit Tests', () => {
  const mockUserId = 'test-user-123';
  const mockOrgId = 'test-org-456';
  
  let mockSupabaseQuery: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup common mock chain
    mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery);
  });

  describe('getUserCredits', () => {
    it('should fetch user credit information successfully', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 100,
        card_generation_count: 5,
        template_count: 2,
        unlimited_templates: false,
        remove_watermarks: true
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });

      const result = await getUserCredits(mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith(
        'credits_balance, card_generation_count, template_count, unlimited_templates, remove_watermarks'
      );
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', mockUserId);
      expect(result).toEqual(mockCredits);
    });

    it('should return null when user not found', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'User not found', code: 'PGRST116' } 
      });

      const result = await getUserCredits(mockUserId);

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection error', code: 'PGRST000' } 
      });

      const result = await getUserCredits(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('canCreateTemplate', () => {
    it('should allow template creation when user has unlimited templates', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 50,
        card_generation_count: 3,
        template_count: 10, // Above limit but unlimited is true
        unlimited_templates: true,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });

      const result = await canCreateTemplate(mockUserId);

      expect(result).toBe(true);
    });

    it('should allow template creation when under limit', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 50,
        card_generation_count: 3,
        template_count: 1, // Under limit of 2
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });

      const result = await canCreateTemplate(mockUserId);

      expect(result).toBe(true);
    });

    it('should deny template creation when at limit without unlimited', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 50,
        card_generation_count: 3,
        template_count: 2, // At limit of 2
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });

      const result = await canCreateTemplate(mockUserId);

      expect(result).toBe(false);
    });

    it('should deny template creation when above limit without unlimited', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 50,
        card_generation_count: 3,
        template_count: 5, // Above limit of 2
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });

      const result = await canCreateTemplate(mockUserId);

      expect(result).toBe(false);
    });

    it('should deny template creation when user credits cannot be fetched', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: { message: 'Error' } });

      const result = await canCreateTemplate(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('canGenerateCard', () => {
    it('should allow card generation with free generations available', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 0, // No credits
        card_generation_count: 5, // Under free limit of 10
        template_count: 1,
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });

      const result = await canGenerateCard(mockUserId);

      expect(result).toEqual({ canGenerate: true, needsCredits: false });
    });

    it('should allow card generation with credits after free limit', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 25, // Has credits
        card_generation_count: 15, // Above free limit of 10
        template_count: 1,
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });

      const result = await canGenerateCard(mockUserId);

      expect(result).toEqual({ canGenerate: true, needsCredits: false });
    });

    it('should deny card generation without credits after free limit', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 0, // No credits
        card_generation_count: 15, // Above free limit of 10
        template_count: 1,
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });

      const result = await canGenerateCard(mockUserId);

      expect(result).toEqual({ canGenerate: false, needsCredits: true });
    });

    it('should handle user not found error gracefully', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: { message: 'Error' } });

      const result = await canGenerateCard(mockUserId);

      expect(result).toEqual({ canGenerate: false, needsCredits: false });
    });
  });

  describe('deductCardGenerationCredit', () => {
    it('should use free generation when available', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 50,
        card_generation_count: 5, // Under free limit
        template_count: 1,
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });
      mockSupabaseQuery.eq.mockResolvedValue({ data: {}, error: null });

      const result = await deductCardGenerationCredit(mockUserId, mockOrgId, 'card-123');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(50); // Balance unchanged
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        card_generation_count: 6, // Incremented
        credits_balance: 50 // Unchanged
      });
    });

    it('should deduct credits when free limit exceeded', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 25,
        card_generation_count: 15, // Above free limit
        template_count: 1,
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });
      mockSupabaseQuery.eq.mockResolvedValue({ data: {}, error: null });

      const result = await deductCardGenerationCredit(mockUserId, mockOrgId, 'card-123');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(24); // Credit deducted
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        card_generation_count: 15, // Unchanged
        credits_balance: 24 // Decremented
      });
    });

    it('should fail when no credits available', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 0,
        card_generation_count: 15, // Above free limit
        template_count: 1,
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });

      const result = await deductCardGenerationCredit(mockUserId, mockOrgId, 'card-123');

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(0);
    });

    it('should handle user not found error', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: { message: 'User not found' } });

      const result = await deductCardGenerationCredit(mockUserId, mockOrgId, 'card-123');

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(0);
    });

    it('should handle database update error', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 50,
        card_generation_count: 5,
        template_count: 1,
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });
      mockSupabaseQuery.eq.mockResolvedValue({ data: null, error: { message: 'Update failed' } });

      const result = await deductCardGenerationCredit(mockUserId, mockOrgId, 'card-123');

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(0);
    });
  });

  describe('addCredits', () => {
    it('should add credits and create transaction record successfully', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 50,
        card_generation_count: 5,
        template_count: 1,
        unlimited_templates: false,
        remove_watermarks: false
      };

      // Mock getting user credits
      mockSupabaseQuery.single.mockResolvedValueOnce({ data: mockCredits, error: null });
      // Mock updating profile
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: {}, error: null });
      // Mock inserting transaction
      mockSupabaseQuery.select.mockResolvedValue({ data: [{}], error: null });

      const result = await addCredits(mockUserId, mockOrgId, 25, 'payment-ref-123', 'Purchase 25 credits');

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(75);
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        credits_balance: 75
      });
    });

    it('should handle user not found error', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: { message: 'User not found' } });

      const result = await addCredits(mockUserId, mockOrgId, 25, 'payment-ref-123');

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(0);
    });

    it('should handle profile update error', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 50,
        card_generation_count: 5,
        template_count: 1,
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });
      mockSupabaseQuery.eq.mockResolvedValue({ data: null, error: { message: 'Update failed' } });

      const result = await addCredits(mockUserId, mockOrgId, 25, 'payment-ref-123');

      expect(result.success).toBe(false);
      expect(result.newBalance).toBe(0);
    });
  });

  describe('grantUnlimitedTemplates', () => {
    it('should grant unlimited templates feature successfully', async () => {
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: {}, error: null });
      mockSupabaseQuery.select.mockResolvedValue({ data: [{}], error: null });

      const result = await grantUnlimitedTemplates(mockUserId, mockOrgId, 'payment-ref-123');

      expect(result.success).toBe(true);
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        unlimited_templates: true
      });
    });

    it('should handle profile update error', async () => {
      mockSupabaseQuery.eq.mockResolvedValue({ data: null, error: { message: 'Update failed' } });

      const result = await grantUnlimitedTemplates(mockUserId, mockOrgId, 'payment-ref-123');

      expect(result.success).toBe(false);
    });
  });

  describe('grantWatermarkRemoval', () => {
    it('should grant watermark removal feature successfully', async () => {
      mockSupabaseQuery.eq.mockResolvedValueOnce({ data: {}, error: null });
      mockSupabaseQuery.select.mockResolvedValue({ data: [{}], error: null });

      const result = await grantWatermarkRemoval(mockUserId, mockOrgId, 'payment-ref-123');

      expect(result.success).toBe(true);
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        remove_watermarks: true
      });
    });

    it('should handle profile update error', async () => {
      mockSupabaseQuery.eq.mockResolvedValue({ data: null, error: { message: 'Update failed' } });

      const result = await grantWatermarkRemoval(mockUserId, mockOrgId, 'payment-ref-123');

      expect(result.success).toBe(false);
    });
  });

  describe('incrementTemplateCount', () => {
    it('should increment template count successfully', async () => {
      const mockCredits: UserCredits = {
        credits_balance: 50,
        card_generation_count: 5,
        template_count: 1,
        unlimited_templates: false,
        remove_watermarks: false
      };

      mockSupabaseQuery.single.mockResolvedValue({ data: mockCredits, error: null });
      mockSupabaseQuery.eq.mockResolvedValue({ data: {}, error: null });

      const result = await incrementTemplateCount(mockUserId);

      expect(result.success).toBe(true);
      expect(result.newCount).toBe(2);
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        template_count: 2
      });
    });

    it('should handle user not found error', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: { message: 'User not found' } });

      const result = await incrementTemplateCount(mockUserId);

      expect(result.success).toBe(false);
      expect(result.newCount).toBe(0);
    });
  });

  describe('getCreditHistory', () => {
    it('should fetch credit transaction history successfully', async () => {
      const mockTransactions: CreditTransaction[] = [
        {
          id: 'txn-1',
          user_id: mockUserId,
          org_id: mockOrgId,
          transaction_type: 'purchase',
          amount: 50,
          credits_before: 0,
          credits_after: 50,
          description: 'Credit purchase',
          reference_id: 'payment-123',
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
          credits_before: 50,
          credits_after: 49,
          description: 'Card generation',
          reference_id: 'card-456',
          metadata: { type: 'card_generation' },
          created_at: '2024-01-01T01:00:00Z',
          updated_at: '2024-01-01T01:00:00Z'
        }
      ];

      mockSupabaseQuery.limit.mockResolvedValue({ data: mockTransactions, error: null });

      const result = await getCreditHistory(mockUserId, 50);

      expect(supabase.from).toHaveBeenCalledWith('credit_transactions');
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockTransactions);
    });

    it('should return empty array on database error', async () => {
      mockSupabaseQuery.limit.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      const result = await getCreditHistory(mockUserId);

      expect(result).toEqual([]);
    });

    it('should use default limit when not specified', async () => {
      mockSupabaseQuery.limit.mockResolvedValue({ data: [], error: null });

      await getCreditHistory(mockUserId);

      expect(mockSupabaseQuery.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('Credit Package Constants', () => {
    it('should have valid CREDIT_PACKAGES structure', () => {
      expect(CREDIT_PACKAGES).toHaveLength(4);
      
      CREDIT_PACKAGES.forEach(pkg => {
        expect(pkg).toHaveProperty('id');
        expect(pkg).toHaveProperty('name');
        expect(pkg).toHaveProperty('credits');
        expect(pkg).toHaveProperty('price');
        expect(pkg).toHaveProperty('pricePerCard');
        expect(pkg).toHaveProperty('description');
        expect(pkg).toHaveProperty('popular');

        expect(typeof pkg.id).toBe('string');
        expect(typeof pkg.name).toBe('string');
        expect(typeof pkg.credits).toBe('number');
        expect(typeof pkg.price).toBe('number');
        expect(typeof pkg.pricePerCard).toBe('number');
        expect(typeof pkg.description).toBe('string');
        expect(typeof pkg.popular).toBe('boolean');

        // Verify price per card calculation
        const expectedPricePerCard = pkg.price / pkg.credits;
        expect(pkg.pricePerCard).toBeCloseTo(expectedPricePerCard, 2);
      });
    });

    it('should have medium package marked as popular', () => {
      const mediumPackage = CREDIT_PACKAGES.find(pkg => pkg.id === 'medium');
      expect(mediumPackage).toBeTruthy();
      expect(mediumPackage?.popular).toBe(true);
    });

    it('should have packages with increasing value (decreasing price per card)', () => {
      const pricesPerCard = CREDIT_PACKAGES.map(pkg => pkg.pricePerCard);
      
      for (let i = 1; i < pricesPerCard.length; i++) {
        expect(pricesPerCard[i]).toBeLessThanOrEqual(pricesPerCard[i - 1]);
      }
    });
  });

  describe('Premium Feature Constants', () => {
    it('should have valid PREMIUM_FEATURES structure', () => {
      expect(PREMIUM_FEATURES).toHaveLength(2);
      
      PREMIUM_FEATURES.forEach(feature => {
        expect(feature).toHaveProperty('id');
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('price');
        expect(feature).toHaveProperty('description');
        expect(feature).toHaveProperty('type');

        expect(typeof feature.id).toBe('string');
        expect(typeof feature.name).toBe('string');
        expect(typeof feature.price).toBe('number');
        expect(typeof feature.description).toBe('string');
        expect(feature.type).toBe('one_time');
      });
    });

    it('should have unlimited_templates feature', () => {
      const unlimitedTemplates = PREMIUM_FEATURES.find(f => f.id === 'unlimited_templates');
      expect(unlimitedTemplates).toBeTruthy();
      expect(unlimitedTemplates?.name).toBe('Unlimited Templates');
      expect(unlimitedTemplates?.price).toBe(99);
    });

    it('should have remove_watermarks feature', () => {
      const removeWatermarks = PREMIUM_FEATURES.find(f => f.id === 'remove_watermarks');
      expect(removeWatermarks).toBeTruthy();
      expect(removeWatermarks?.name).toBe('Remove Watermarks');
      expect(removeWatermarks?.price).toBe(199);
    });
  });
});
