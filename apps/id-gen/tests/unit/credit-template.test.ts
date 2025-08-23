import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { canCreateTemplate, incrementTemplateCount, getUserCredits } from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

describe('Credit Usage - Template Creation', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Template Limits for Free Users', () => {
    it('should allow creating first template', async () => {
      const { profile } = testData;

      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(true);

      const result = await incrementTemplateCount(profile.id);
      expect(result.success).toBe(true);
      expect(result.newCount).toBe(1);

      const credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(1);
    });

    it('should allow creating second template', async () => {
      const { profile } = testData;

      // Create first template
      await incrementTemplateCount(profile.id);
      
      // Should still be able to create second
      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(true);

      const result = await incrementTemplateCount(profile.id);
      expect(result.success).toBe(true);
      expect(result.newCount).toBe(2);
    });

    it('should block creating third template for free users', async () => {
      const { profile } = testData;

      // Create two templates
      await incrementTemplateCount(profile.id);
      await incrementTemplateCount(profile.id);

      // Third template should be blocked
      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(false);
    });

    it('should not deduct credits for template creation', async () => {
      const { profile } = testData;
      const initialBalance = profile.credits_balance;

      // Create templates up to limit
      await incrementTemplateCount(profile.id);
      await incrementTemplateCount(profile.id);

      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(initialBalance);
    });
  });

  describe('Template Limits for Premium Users', () => {
    beforeEach(async () => {
      // Grant unlimited templates
      const { profile } = testData;
      await supabase
        .from('profiles')
        .update({ unlimited_templates: true })
        .eq('id', profile.id);
        
      // Sync mock data
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { unlimited_templates: true });
    });

    it('should bypass template limits for unlimited_templates users', async () => {
      const { profile } = testData;

      // Should be able to create many templates
      for (let i = 1; i <= 10; i++) {
        const canCreate = await canCreateTemplate(profile.id);
        expect(canCreate).toBe(true);

        const result = await incrementTemplateCount(profile.id);
        expect(result.success).toBe(true);
        expect(result.newCount).toBe(i);
      }

      const credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(10);
      expect(credits?.unlimited_templates).toBe(true);
    });

    it('should work even with high template counts', async () => {
      const { profile } = testData;

      // Set high template count
      await supabase
        .from('profiles')
        .update({ template_count: 100 })
        .eq('id', profile.id);

      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(true);
    });
  });

  describe('Template Count Management', () => {
    it('should correctly increment template count', async () => {
      const { profile } = testData;

      // Start with 0 templates
      let credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(0);

      // Increment to 1
      const result1 = await incrementTemplateCount(profile.id);
      expect(result1.success).toBe(true);
      expect(result1.newCount).toBe(1);

      // Increment to 2
      const result2 = await incrementTemplateCount(profile.id);
      expect(result2.success).toBe(true);
      expect(result2.newCount).toBe(2);

      // Verify final state
      credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(2);
    });

    it('should handle invalid user ID gracefully', async () => {
      const result = await incrementTemplateCount('invalid-user-id');
      expect(result.success).toBe(false);
      expect(result.newCount).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      const { profile } = testData;

      // Delete the profile to simulate error
      await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);
      
      // Also simulate deletion in mock data for consistency
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.simulateUserDeletion(profile.id);

      const result = await incrementTemplateCount(profile.id);
      expect(result.success).toBe(false);
      expect(result.newCount).toBe(0);
    });
  });

  describe('Template Permission Logic', () => {
    it('should correctly evaluate unlimited_templates flag', async () => {
      const { profile } = testData;
      const { testDataUtils } = await import('../utils/TestDataManager');

      // Start as regular user
      await supabase
        .from('profiles')
        .update({ 
          template_count: 5,
          unlimited_templates: false 
        })
        .eq('id', profile.id);
        
      // Sync mock data
      testDataUtils.syncDatabaseUpdate(profile.id, { 
        template_count: 5,
        unlimited_templates: false 
      });

      let canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(false); // Over limit

      // Grant unlimited templates
      await supabase
        .from('profiles')
        .update({ unlimited_templates: true })
        .eq('id', profile.id);
        
      // Sync mock data
      testDataUtils.syncDatabaseUpdate(profile.id, { unlimited_templates: true });

      canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(true); // Now unlimited
    });

    it('should handle null/undefined values gracefully', async () => {
      const { profile } = testData;

      // Set null values
      await supabase
        .from('profiles')
        .update({ 
          template_count: null,
          unlimited_templates: null 
        })
        .eq('id', profile.id);

      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(true); // Should default to allowing creation
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly at limit scenario', async () => {
      const { profile } = testData;

      // Set to exactly 2 templates
      await supabase
        .from('profiles')
        .update({ template_count: 2 })
        .eq('id', profile.id);
        
      // Sync the mock data with database changes
      const { testDataUtils } = await import('../utils/TestDataManager');
      testDataUtils.syncDatabaseUpdate(profile.id, { template_count: 2 });

      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(false);
    });

    it('should handle concurrent template count increments', async () => {
      const { profile } = testData;

      // Attempt concurrent increments
      const promises = [
        incrementTemplateCount(profile.id),
        incrementTemplateCount(profile.id),
        incrementTemplateCount(profile.id)
      ];

      const results = await Promise.all(promises);

      // All should succeed (no credit deduction involved)
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Final count should be 3
      const credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(3);
    });

    it('should maintain consistency across operations', async () => {
      const { profile } = testData;

      // Perform multiple operations
      await incrementTemplateCount(profile.id);
      const canCreate1 = await canCreateTemplate(profile.id);
      await incrementTemplateCount(profile.id);
      const canCreate2 = await canCreateTemplate(profile.id);

      expect(canCreate1).toBe(true);
      expect(canCreate2).toBe(false);

      const credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(2);
    });
  });
});