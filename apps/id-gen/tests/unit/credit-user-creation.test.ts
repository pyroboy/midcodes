import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import {
  canCreateTemplate,
  canGenerateCard,
  getUserCredits,
  incrementTemplateCount
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

describe('User Creation and Initial State', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('New User Default State', () => {
    it('should create users with correct default values', async () => {
      const { profile } = testData;

      const credits = await getUserCredits(profile.id);
      expect(credits).toMatchObject({
        credits_balance: expect.any(Number),
        card_generation_count: 0,
        template_count: 0,
        unlimited_templates: false,
        remove_watermarks: false
      });

      // Verify credits_balance is non-negative
      expect(credits?.credits_balance).toBeGreaterThanOrEqual(0);
    });

    it('should allow free generations for new users', async () => {
      const { profile } = testData;

      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(true);
      expect(canGenerate.needsCredits).toBe(false);
    });

    it('should enforce template limits for new users', async () => {
      const { profile } = testData;

      const canCreate = await canCreateTemplate(profile.id);
      expect(canCreate).toBe(true); // Should be able to create first template

      // After creating 2 templates, should be blocked
      await incrementTemplateCount(profile.id);
      await incrementTemplateCount(profile.id);

      const canCreateAfterLimit = await canCreateTemplate(profile.id);
      expect(canCreateAfterLimit).toBe(false);
    });

    it('should handle user creation with explicit values', async () => {
      // Clean up default test data
      await testDataManager.cleanupAll();

      const customTestData = await testDataManager.createUserWithCredits({
        credits_balance: 100,
        card_generation_count: 5,
        template_count: 1,
        unlimited_templates: true,
        remove_watermarks: true
      });

      const credits = await getUserCredits(customTestData.profile.id);
      expect(credits).toMatchObject({
        credits_balance: 100,
        card_generation_count: 5,
        template_count: 1,
        unlimited_templates: true,
        remove_watermarks: true
      });

      // Clean up custom test data
      await testDataManager.cleanupAll();
    });

    it('should create users with no credit transaction history', async () => {
      const { profile } = testData;

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id);

      expect(transactions || []).toHaveLength(0);
    });

    it('should handle zero-credit scenarios for new users', async () => {
      // Clean up default test data
      await testDataManager.cleanupAll();

      const zeroTestData = await testDataManager.createUserWithCredits({
        credits_balance: 0,
        card_generation_count: 0,
        template_count: 0,
        unlimited_templates: false,
        remove_watermarks: false
      });

      // Should still have free generations available
      const canGenerate = await canGenerateCard(zeroTestData.profile.id);
      expect(canGenerate.canGenerate).toBe(true);
      expect(canGenerate.needsCredits).toBe(false);

      // Should be able to create templates up to limit
      const canCreate = await canCreateTemplate(zeroTestData.profile.id);
      expect(canCreate).toBe(true);

      // Clean up
      await testDataManager.cleanupAll();
    });
  });

  describe('User Role Assignment', () => {
    it('should create users with valid role', async () => {
      const { profile } = testData;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', profile.id)
        .single();

      expect(userProfile!.role).toBeDefined();
      
      // Should be one of the valid role values
      const validRoles = [
        'super_admin', 'org_admin', 'user', 'event_admin', 'event_qr_checker',
        'property_admin', 'property_manager', 'property_accountant', 
        'property_maintenance', 'property_utility'
      ];
      
      expect(validRoles.includes(userProfile!.role)).toBe(true);
    });

    it('should create users within organization scope', async () => {
      const { profile, organization } = testData;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', profile.id)
        .single();

      expect(userProfile!.org_id).toBe(organization.id);
    });

    it('should create users with consistent email and ID', async () => {
      const { profile } = testData;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', profile.id)
        .single();

      expect(userProfile!.id).toBe(profile.id);
      expect(userProfile!.email).toBeDefined();
      expect(typeof userProfile!.email).toBe('string');
    });

    it('should handle role-specific default permissions', async () => {
      // Test with different roles
      const roles = ['user', 'org_admin'];
      
      for (const role of roles) {
        // Clean up previous test data
        await testDataManager.cleanupAll();
        
        const roleTestData = await testDataManager.createMinimalTestData();
        
        await supabase
          .from('profiles')
          .update({ role })
          .eq('id', roleTestData.profile.id);

        const credits = await getUserCredits(roleTestData.profile.id);
        
        // All roles should start with same credit limitations
        expect(credits?.unlimited_templates).toBe(false);
        expect(credits?.remove_watermarks).toBe(false);
        expect(credits?.template_count).toBe(0);
        expect(credits?.card_generation_count).toBe(0);
      }
    });
  });

  describe('User Context and Metadata', () => {
    it('should handle user context field', async () => {
      const { profile } = testData;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('context')
        .eq('id', profile.id)
        .single();

      // Context can be null or an object
      expect(userProfile!.context === null || typeof userProfile!.context === 'object').toBe(true);
    });

    it('should track creation and update timestamps', async () => {
      const { profile } = testData;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('created_at, updated_at')
        .eq('id', profile.id)
        .single();

      expect(userProfile!.created_at).toBeDefined();
      expect(userProfile!.updated_at).toBeDefined();
      
      const createdTime = new Date(userProfile!.created_at).getTime();
      const updatedTime = new Date(userProfile!.updated_at).getTime();
      
      expect(createdTime).toBeLessThanOrEqual(Date.now());
      expect(updatedTime).toBeLessThanOrEqual(Date.now());
    });

    it('should handle email validation requirements', async () => {
      const { profile } = testData;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', profile.id)
        .single();

      if (userProfile!.email) {
        // If email exists, it should be valid format
        expect(userProfile!.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      }
    });
  });

  describe('User State Transitions', () => {
    it('should track state changes correctly', async () => {
      const { profile } = testData;

      // Initial state
      let credits = await getUserCredits(profile.id);
      const initialCount = credits?.card_generation_count || 0;

      // Update template count
      await incrementTemplateCount(profile.id);

      // Verify state change
      credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(1);
      expect(credits?.card_generation_count).toBe(initialCount); // Should be unchanged
    });

    it('should maintain consistency during multiple operations', async () => {
      const { profile } = testData;

      // Perform multiple state changes
      await incrementTemplateCount(profile.id);
      
      await supabase
        .from('profiles')
        .update({ credits_balance: 50 })
        .eq('id', profile.id);

      await incrementTemplateCount(profile.id);

      // Verify final state
      const credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(2);
      expect(credits?.credits_balance).toBe(50);
    });

    it('should handle concurrent user operations safely', async () => {
      const { profile } = testData;

      // Simulate concurrent template count increments
      const promises = [
        incrementTemplateCount(profile.id),
        incrementTemplateCount(profile.id)
      ];

      const results = await Promise.all(promises);
      
      // Both operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Final count should be consistent
      const credits = await getUserCredits(profile.id);
      expect(credits?.template_count).toBe(2);
    });
  });

  describe('User Deletion and Cleanup', () => {
    it('should handle missing user queries gracefully', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      const credits = await getUserCredits(nonExistentUserId);
      expect(credits).toBeNull();

      const canGenerate = await canGenerateCard(nonExistentUserId);
      expect(canGenerate.canGenerate).toBe(false);
      expect(canGenerate.needsCredits).toBe(false);

      const canCreate = await canCreateTemplate(nonExistentUserId);
      expect(canCreate).toBe(false);
    });

    it('should maintain referential integrity', async () => {
      const { profile, organization } = testData;

      // Verify organization relationship
      const { data: userProfile } = await supabase
        .from('profiles')
        .select(`
          id,
          org_id,
          organizations!inner(id, name)
        `)
        .eq('id', profile.id)
        .single();

      expect((userProfile!.organizations as any).id).toBe(organization.id);
    });
  });

  describe('User Feature State Validation', () => {
    it('should validate boolean feature flags', async () => {
      const { profile } = testData;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('unlimited_templates, remove_watermarks')
        .eq('id', profile.id)
        .single();

      expect(typeof userProfile!.unlimited_templates).toBe('boolean');
      expect(typeof userProfile!.remove_watermarks).toBe('boolean');
    });

    it('should validate numeric fields', async () => {
      const { profile } = testData;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('credits_balance, card_generation_count, template_count')
        .eq('id', profile.id)
        .single();

      expect(typeof userProfile!.credits_balance).toBe('number');
      expect(typeof userProfile!.card_generation_count).toBe('number');
      expect(typeof userProfile!.template_count).toBe('number');

      expect(userProfile!.credits_balance).toBeGreaterThanOrEqual(0);
      expect(userProfile!.card_generation_count).toBeGreaterThanOrEqual(0);
      expect(userProfile!.template_count).toBeGreaterThanOrEqual(0);
    });

    it('should handle null/undefined values appropriately', async () => {
      const { profile } = testData;

      // Update with null values where allowed
      await supabase
        .from('profiles')
        .update({
          email: null,
          context: null,
          role: null
        })
        .eq('id', profile.id);

      const credits = await getUserCredits(profile.id);
      
      // Should still return valid credit data
      expect(credits).toBeDefined();
      expect(typeof credits?.credits_balance).toBe('number');
      expect(typeof credits?.card_generation_count).toBe('number');
      expect(typeof credits?.template_count).toBe('number');
    });
  });

  describe('Avatar and Watermark Features', () => {
    it('should create users with avatar URLs', async () => {
      await testDataManager.cleanupAll();

      const avatarUrl = 'https://example.com/avatars/test-user.jpg';
      const testDataWithAvatar = await testDataManager.createUserWithAvatar(avatarUrl);

      expect(testDataWithAvatar.profile.avatar_url).toBe(avatarUrl);

      // Verify in database
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', testDataWithAvatar.profile.id)
        .single();

      expect(userProfile?.avatar_url).toBe(avatarUrl);

      await testDataManager.cleanupAll();
    });

    it('should create users with watermark removal enabled', async () => {
      await testDataManager.cleanupAll();

      const testDataWithWatermarks = await testDataManager.createUserWithWatermarkRemoval();

      expect(testDataWithWatermarks.profile.remove_watermarks).toBe(true);

      // Verify in database
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('remove_watermarks')
        .eq('id', testDataWithWatermarks.profile.id)
        .single();

      expect(userProfile?.remove_watermarks).toBe(true);

      await testDataManager.cleanupAll();
    });

    it('should create premium users with both avatar and watermark removal', async () => {
      await testDataManager.cleanupAll();

      const customAvatarUrl = 'https://example.com/avatars/premium-user.jpg';
      const premiumTestData = await testDataManager.createPremiumUser(customAvatarUrl);

      expect(premiumTestData.profile.avatar_url).toBe(customAvatarUrl);
      expect(premiumTestData.profile.remove_watermarks).toBe(true);
      expect(premiumTestData.profile.unlimited_templates).toBe(true);
      expect(premiumTestData.profile.credits_balance).toBe(100);

      // Verify in database
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('avatar_url, remove_watermarks, unlimited_templates, credits_balance')
        .eq('id', premiumTestData.profile.id)
        .single();

      expect(userProfile).toMatchObject({
        avatar_url: customAvatarUrl,
        remove_watermarks: true,
        unlimited_templates: true,
        credits_balance: 100
      });

      await testDataManager.cleanupAll();
    });

    it('should handle null avatar URLs correctly', async () => {
      await testDataManager.cleanupAll();

      const testDataWithNullAvatar = await testDataManager.createUserWithCredits({
        avatar_url: null,
        remove_watermarks: false
      });

      expect(testDataWithNullAvatar.profile.avatar_url).toBeNull();
      expect(testDataWithNullAvatar.profile.remove_watermarks).toBe(false);

      await testDataManager.cleanupAll();
    });
  });
});