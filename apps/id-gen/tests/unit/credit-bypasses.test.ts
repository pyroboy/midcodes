import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import {
  canCreateTemplate,
  canGenerateCard,
  grantUnlimitedTemplates,
  grantWatermarkRemoval,
  getUserCredits
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

describe('Credit Bypasses - Premium Feature Testing', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Unlimited Templates Bypass', () => {
    it('should bypass template limit when unlimited_templates is true', async () => {
      const { profile } = testData;

      // Set user to template limit
      await supabase
        .from('profiles')
        .update({
          template_count: 2,
          unlimited_templates: false
        })
        .eq('id', profile.id);

      // Should be blocked initially
      let canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(false);

      // Grant unlimited templates
      const result = await grantUnlimitedTemplates(profile.id, profile.org_id, 'bypass-test-1');
      expect(result.success).toBe(true);

      // Should now bypass the limit
      canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(true);

      // Verify flag is set
      const credits = await getUserCredits(profile.id);
      expect(credits?.unlimited_templates).toBe(true);
    });

    it('should allow unlimited template creation with bypass', async () => {
      const { profile } = testData;

      // Grant unlimited templates
      await supabase
        .from('profiles')
        .update({ unlimited_templates: true })
        .eq('id', profile.id);

      // Should be able to create many templates
      for (let i = 1; i <= 10; i++) {
        const canCreate = await canCreateTemplate(profile.id);
        expect(canCreate).toBe(true);

        await supabase
          .from('profiles')
          .update({ template_count: i })
          .eq('id', profile.id);
      }

      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.template_count).toBe(10);
      expect(finalCredits?.unlimited_templates).toBe(true);
    });

    it('should log unlimited templates purchase transaction', async () => {
      const { profile } = testData;

      await grantUnlimitedTemplates(profile.id, profile.org_id, 'unlimited-test-ref');

      // Verify transaction logged
      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'unlimited-test-ref')
        .single();

      expect(transaction).toMatchObject({
        user_id: profile.id,
        org_id: profile.org_id,
        transaction_type: 'purchase',
        amount: 0, // No credits added
        description: 'Unlimited templates upgrade'
      });

      expect(transaction.metadata).toMatchObject({
        type: 'unlimited_templates_purchase',
        amount_paid: 99
      });
    });

    it('should handle unlimited templates with high template counts', async () => {
      const { profile } = testData;

      // Set very high template count
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

    it('should handle unlimited templates grant failure gracefully', async () => {
      const result = await grantUnlimitedTemplates(
        'invalid-user-id',
        'invalid-org-id',
        'fail-test'
      );

      expect(result.success).toBe(false);
    });
  });

  describe('Watermark Removal Bypass', () => {
    it('should grant watermark removal feature', async () => {
      const { profile } = testData;

      // Initially should not have watermark removal
      let credits = await getUserCredits(profile.id);
      expect(credits?.remove_watermarks).toBe(false);

      // Grant watermark removal
      const result = await grantWatermarkRemoval(profile.id, profile.org_id, 'watermark-test-ref');
      expect(result.success).toBe(true);

      // Should now have feature
      credits = await getUserCredits(profile.id);
      expect(credits?.remove_watermarks).toBe(true);
    });

    it('should log watermark removal purchase transaction', async () => {
      const { profile } = testData;

      await grantWatermarkRemoval(profile.id, profile.org_id, 'watermark-ref-123');

      // Verify transaction logged
      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'watermark-ref-123')
        .single();

      expect(transaction).toMatchObject({
        user_id: profile.id,
        org_id: profile.org_id,
        transaction_type: 'purchase',
        amount: 0,
        description: 'Remove watermarks upgrade'
      });

      expect(transaction.metadata).toMatchObject({
        type: 'watermark_removal_purchase',
        amount_paid: 199
      });
    });

    it('should handle watermark removal grant failure gracefully', async () => {
      const result = await grantWatermarkRemoval(
        'invalid-user-id',
        'invalid-org-id',
        'fail-test'
      );

      expect(result.success).toBe(false);
    });

    it('should not affect existing watermark removal status', async () => {
      const { profile } = testData;

      // Grant watermark removal twice
      await grantWatermarkRemoval(profile.id, profile.org_id, 'first-grant');
      await grantWatermarkRemoval(profile.id, profile.org_id, 'second-grant');

      const credits = await getUserCredits(profile.id);
      expect(credits?.remove_watermarks).toBe(true);

      // Should have two transactions
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .in('reference_id', ['first-grant', 'second-grant']);

      expect(transactions).toHaveLength(2);
    });
  });

  describe('Combined Premium Features', () => {
    it('should handle both unlimited templates and watermark removal', async () => {
      const { profile } = testData;

      // Grant both features
      await grantUnlimitedTemplates(profile.id, profile.org_id, 'premium-1');
      await grantWatermarkRemoval(profile.id, profile.org_id, 'premium-2');

      // Verify both features are active
      const credits = await getUserCredits(profile.id);
      expect(credits?.unlimited_templates).toBe(true);
      expect(credits?.remove_watermarks).toBe(true);

      // Should bypass template limits
      await supabase
        .from('profiles')
        .update({ template_count: 5 })
        .eq('id', profile.id);

      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(true);

      // Verify both transactions logged
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .in('reference_id', ['premium-1', 'premium-2']);

      expect(transactions).toHaveLength(2);
    });

    it('should maintain feature independence', async () => {
      const { profile } = testData;

      // Grant only unlimited templates
      await grantUnlimitedTemplates(profile.id, profile.org_id, 'unlimited-only');

      const credits = await getUserCredits(profile.id);
      expect(credits?.unlimited_templates).toBe(true);
      expect(credits?.remove_watermarks).toBe(false); // Should remain false
    });

    it('should handle feature combinations with template limits', async () => {
      const { profile } = testData;

      // Set to template limit without unlimited
      await supabase
        .from('profiles')
        .update({
          template_count: 2,
          unlimited_templates: false,
          remove_watermarks: false
        })
        .eq('id', profile.id);

      // Grant watermark removal only (not unlimited templates)
      await grantWatermarkRemoval(profile.id, profile.org_id, 'watermark-only');

      // Should still be blocked for templates
      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(false);

      // But should have watermark removal
      const credits = await getUserCredits(profile.id);
      expect(credits?.remove_watermarks).toBe(true);
      expect(credits?.unlimited_templates).toBe(false);
    });
  });

  describe('Premium Feature State Persistence', () => {
    it('should persist unlimited templates across sessions', async () => {
      const { profile } = testData;

      // Grant feature
      await grantUnlimitedTemplates(profile.id, profile.org_id, 'persistence-test');

      // Simulate session refresh by re-fetching user credits
      const credits1 = await getUserCredits(profile.id);
      expect(credits1?.unlimited_templates).toBe(true);

      // Check again to ensure persistence
      const credits2 = await getUserCredits(profile.id);
      expect(credits2?.unlimited_templates).toBe(true);
    });

    it('should persist watermark removal across operations', async () => {
      const { profile } = testData;

      // Grant feature
      await grantWatermarkRemoval(profile.id, profile.org_id, 'watermark-persistence');

      // Perform other operations
      await supabase
        .from('profiles')
        .update({ template_count: 1 })
        .eq('id', profile.id);

      // Feature should still be active
      const credits = await getUserCredits(profile.id);
      expect(credits?.remove_watermarks).toBe(true);
    });
  });

  describe('Premium Feature Transaction Metadata', () => {
    it('should include correct metadata for unlimited templates', async () => {
      const { profile } = testData;

      await grantUnlimitedTemplates(profile.id, profile.org_id, 'metadata-test-1');

      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'metadata-test-1')
        .single();

      expect(transaction.metadata).toEqual({
        type: 'unlimited_templates_purchase',
        amount_paid: 99
      });

      expect(transaction.created_at).toBeDefined();
      expect(new Date(transaction.created_at).getTime()).toBeCloseTo(Date.now(), -2);
    });

    it('should include correct metadata for watermark removal', async () => {
      const { profile } = testData;

      await grantWatermarkRemoval(profile.id, profile.org_id, 'metadata-test-2');

      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'metadata-test-2')
        .single();

      expect(transaction.metadata).toEqual({
        type: 'watermark_removal_purchase',
        amount_paid: 199
      });
    });

    it('should maintain transaction audit trail for premium features', async () => {
      const { profile } = testData;

      // Grant both features at different times
      await grantUnlimitedTemplates(profile.id, profile.org_id, 'audit-1');
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await grantWatermarkRemoval(profile.id, profile.org_id, 'audit-2');

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .in('reference_id', ['audit-1', 'audit-2'])
        .order('created_at', { ascending: true });

      expect(transactions).toHaveLength(2);
      
      // First transaction should be unlimited templates
      expect(transactions![0].metadata.type).toBe('unlimited_templates_purchase');
      
      // Second transaction should be watermark removal
      expect(transactions![1].metadata.type).toBe('watermark_removal_purchase');
      
      // Timestamps should be in order
      const time1 = new Date(transactions![0].created_at).getTime();
      const time2 = new Date(transactions![1].created_at).getTime();
      expect(time2).toBeGreaterThan(time1);
    });
  });
});