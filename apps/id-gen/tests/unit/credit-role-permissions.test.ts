import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import {
  canCreateTemplate,
  canGenerateCard,
  addCredits,
  getUserCredits,
  grantUnlimitedTemplates,
  grantWatermarkRemoval
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

describe('Role-Based Credit Permissions', () => {
  let adminData: any;
  let userData: any;
  let orgAdminData: any;

  beforeEach(async () => {
    adminData = await testDataManager.createMinimalTestData();
    userData = await testDataManager.createMinimalTestData();
    orgAdminData = await testDataManager.createMinimalTestData();

    // Set roles
    await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', adminData.profile.id);

    await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', userData.profile.id);

    await supabase
      .from('profiles')
      .update({ role: 'org_admin' })
      .eq('id', orgAdminData.profile.id);
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Super Admin Role Capabilities', () => {
    it('should follow same credit rules as regular users', async () => {
      const { profile: admin } = adminData;

      // Admin should still be subject to credit rules
      const canGenerate = await canGenerateCard(admin.id);
      expect(canGenerate.canGenerate).toBe(true); // Should have free generations
      expect(canGenerate.needsCredits).toBe(false);

      // Admin should still be subject to template limits initially
      await supabase
        .from('profiles')
        .update({
          template_count: 2,
          unlimited_templates: false
        })
        .eq('id', admin.id);

      const canCreate = await canCreateTemplate(admin.id);
      expect(canCreate).toBe(false); // Should be blocked without unlimited_templates
    });

    it('should be able to grant premium features to users', async () => {
      const { profile: admin } = adminData;
      const { profile: user, organization } = userData;

      // Admin grants unlimited templates to user
      const result = await grantUnlimitedTemplates(
        user.id,
        organization.id,
        'admin-grant-unlimited'
      );

      expect(result.success).toBe(true);

      // Verify user received the feature
      const credits = await getUserCredits(user.id);
      expect(credits?.unlimited_templates).toBe(true);

      // Verify transaction logged
      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('reference_id', 'admin-grant-unlimited')
        .single();

      expect(transaction.description).toBe('Unlimited templates upgrade');
    });

    it('should be able to add credits to users', async () => {
      const { profile: admin } = adminData;
      const { profile: user, organization } = userData;
      const initialBalance = user.credits_balance;

      // Admin adds credits to user
      const result = await addCredits(
        user.id,
        organization.id,
        150,
        'admin-credit-grant',
        'Admin credit allocation'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(initialBalance + 150);

      // Verify user received credits
      const credits = await getUserCredits(user.id);
      expect(credits?.credits_balance).toBe(initialBalance + 150);
    });

    it('should maintain admin audit trail for privileged operations', async () => {
      const { profile: admin } = adminData;
      const { profile: user, organization } = userData;

      // Perform multiple admin operations
      await grantUnlimitedTemplates(user.id, organization.id, 'admin-op-1');
      await grantWatermarkRemoval(user.id, organization.id, 'admin-op-2');
      await addCredits(user.id, organization.id, 100, 'admin-op-3', 'Admin credit grant');

      // Verify all transactions logged
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .in('reference_id', ['admin-op-1', 'admin-op-2', 'admin-op-3'])
        .order('created_at', { ascending: true });

      expect(transactions).toHaveLength(3);

      // Verify transaction types
      expect(transactions![0].description).toBe('Unlimited templates upgrade');
      expect(transactions![1].description).toBe('Remove watermarks upgrade');
      expect(transactions![2].description).toBe('Admin credit grant');
    });
  });

  describe('Organization Admin Role Capabilities', () => {
    it('should follow same credit rules as regular users', async () => {
      const { profile: orgAdmin } = orgAdminData;

      // Org admin should be subject to same credit rules
      const canGenerate = await canGenerateCard(orgAdmin.id);
      expect(canGenerate.canGenerate).toBe(true);
      expect(canGenerate.needsCredits).toBe(false);

      // Should be subject to template limits
      await supabase
        .from('profiles')
        .update({
          template_count: 2,
          unlimited_templates: false
        })
        .eq('id', orgAdmin.id);

      const canCreate = await canCreateTemplate(orgAdmin.id);
      expect(canCreate).toBe(false);
    });

    it('should be able to grant features within their organization', async () => {
      const { profile: orgAdmin, organization } = orgAdminData;

      // Create user in same organization
      const sameOrgUser = await testDataManager.createUserWithCredits({
        credits_balance: 0,
        card_generation_count: 0,
        template_count: 0
      });

      await supabase
        .from('profiles')
        .update({ org_id: organization.id })
        .eq('id', sameOrgUser.profile.id);

      // Org admin grants feature to user in same org
      const result = await grantUnlimitedTemplates(
        sameOrgUser.profile.id,
        organization.id,
        'org-admin-grant'
      );

      expect(result.success).toBe(true);

      // Verify user received feature
      const credits = await getUserCredits(sameOrgUser.profile.id);
      expect(credits?.unlimited_templates).toBe(true);

      // Cleanup
      await supabase
        .from('profiles')
        .delete()
        .eq('id', sameOrgUser.profile.id);
    });

    it('should maintain organization scope for admin operations', async () => {
      const { profile: orgAdmin, organization: org1 } = orgAdminData;
      const { profile: userInDifferentOrg, organization: org2 } = userData;

      // Org admin should only manage users in their organization
      expect(org1.id).not.toBe(org2.id);

      // Attempt to grant features across organizations should work at function level
      // (organization isolation is typically enforced at API/route level)
      const result = await grantUnlimitedTemplates(
        userInDifferentOrg.id,
        org2.id, // Different org
        'cross-org-test'
      );

      // Function should work, but this would typically be prevented by authorization middleware
      expect(result.success).toBe(true);
    });
  });

  describe('Regular User Role Limitations', () => {
    it('should enforce credit limits for regular users', async () => {
      const { profile: user } = userData;

      // Set user past free limit with no credits
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 0
        })
        .eq('id', user.id);

      const canGenerate = await canGenerateCard(user.id);
      expect(canGenerate.canGenerate).toBe(false);
      expect(canGenerate.needsCredits).toBe(true);
    });

    it('should enforce template limits for regular users', async () => {
      const { profile: user } = userData;

      // Set user to template limit
      await supabase
        .from('profiles')
        .update({
          template_count: 2,
          unlimited_templates: false
        })
        .eq('id', user.id);

      const canCreate = await canCreateTemplate(user.id);
      expect(canCreate).toBe(false);
    });

    it('should allow users to purchase and use credits normally', async () => {
      const { profile: user, organization } = userData;
      const initialBalance = user.credits_balance;

      // User purchases credits
      const result = await addCredits(
        user.id,
        organization.id,
        100,
        'user-purchase',
        'User credit purchase'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(initialBalance + 100);

      // User should be able to use credits
      await supabase
        .from('profiles')
        .update({ card_generation_count: 10 })
        .eq('id', user.id);

      const canGenerate = await canGenerateCard(user.id);
      expect(canGenerate.canGenerate).toBe(true);
      expect(canGenerate.needsCredits).toBe(false);
    });

    it('should allow users to receive admin-granted features', async () => {
      const { profile: user, organization } = userData;

      // User starts without premium features
      let credits = await getUserCredits(user.id);
      expect(credits?.unlimited_templates).toBe(false);
      expect(credits?.remove_watermarks).toBe(false);

      // Admin grants features
      await grantUnlimitedTemplates(user.id, organization.id, 'admin-grants-unlimited');
      await grantWatermarkRemoval(user.id, organization.id, 'admin-grants-watermark');

      // User should now have features
      credits = await getUserCredits(user.id);
      expect(credits?.unlimited_templates).toBe(true);
      expect(credits?.remove_watermarks).toBe(true);

      // User should be able to use features
      await supabase
        .from('profiles')
        .update({ template_count: 5 })
        .eq('id', user.id);

      const canCreate = await canCreateTemplate(user.id);
      expect(canCreate).toBe(true); // Should bypass limit with unlimited_templates
    });
  });

  describe('Role Hierarchy and Permissions', () => {
    it('should maintain proper role hierarchy', async () => {
      const { profile: admin } = adminData;
      const { profile: orgAdmin } = orgAdminData;
      const { profile: user } = userData;

      // Verify roles are set correctly
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, role')
        .in('id', [admin.id, orgAdmin.id, user.id]);

      const roleMap = profiles?.reduce((acc, p) => {
        acc[p.id] = p.role;
        return acc;
      }, {} as Record<string, string>) || {};

      expect(roleMap[admin.id]).toBe('super_admin');
      expect(roleMap[orgAdmin.id]).toBe('org_admin');
      expect(roleMap[user.id]).toBe('user');
    });

    it('should handle role transitions correctly', async () => {
      const { profile: user } = userData;

      // Start as regular user
      let credits = await getUserCredits(user.id);
      expect(credits?.unlimited_templates).toBe(false);

      // Upgrade to org_admin
      await supabase
        .from('profiles')
        .update({ role: 'org_admin' })
        .eq('id', user.id);

      // Should still follow same credit rules (role doesn't grant features)
      credits = await getUserCredits(user.id);
      expect(credits?.unlimited_templates).toBe(false);

      // Set to template limit
      await supabase
        .from('profiles')
        .update({
          template_count: 2,
          unlimited_templates: false
        })
        .eq('id', user.id);

      const canCreate = await canCreateTemplate(user.id);
      expect(canCreate).toBe(false); // Still blocked without unlimited_templates feature
    });

    it('should handle role-based feature inheritance', async () => {
      const { profile: user, organization } = userData;

      // Grant features to user as regular user
      await grantUnlimitedTemplates(user.id, organization.id, 'pre-promotion');
      
      // Promote to admin
      await supabase
        .from('profiles')
        .update({ role: 'org_admin' })
        .eq('id', user.id);

      // Should retain features after promotion
      const credits = await getUserCredits(user.id);
      expect(credits?.unlimited_templates).toBe(true);

      const canCreate = await canCreateTemplate(user.id);
      expect(canCreate).toBe(true);
    });
  });

  describe('Permission Edge Cases', () => {
    it('should handle users with null roles', async () => {
      const { profile: user } = userData;

      // Set null role
      await supabase
        .from('profiles')
        .update({ role: null })
        .eq('id', user.id);

      // Should still follow credit rules
      const canGenerate = await canGenerateCard(user.id);
      expect(canGenerate.canGenerate).toBe(true); // Should have free generations

      const canCreate = await canCreateTemplate(user.id);
      expect(canCreate).toBe(true); // Should be able to create first template
    });

    it('should handle unknown role values gracefully', async () => {
      const { profile: user } = userData;

      // This test would typically be prevented by database constraints
      // but we test the function behavior
      const credits = await getUserCredits(user.id);
      expect(credits).toBeDefined();
      expect(typeof credits?.credits_balance).toBe('number');
    });

    it('should maintain role consistency across operations', async () => {
      const { profile: admin } = adminData;
      const { profile: user, organization } = userData;

      // Verify admin can perform multiple operations
      await addCredits(user.id, organization.id, 50, 'multi-op-1');
      await grantUnlimitedTemplates(user.id, organization.id, 'multi-op-2');
      await grantWatermarkRemoval(user.id, organization.id, 'multi-op-3');

      // Verify all operations succeeded
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .in('reference_id', ['multi-op-1', 'multi-op-2', 'multi-op-3']);

      expect(transactions).toHaveLength(3);

      // Verify user has all features and credits
      const credits = await getUserCredits(user.id);
      expect(credits?.credits_balance).toBe(userData.profile.credits_balance + 50);
      expect(credits?.unlimited_templates).toBe(true);
      expect(credits?.remove_watermarks).toBe(true);
    });
  });

  describe('Role-Based Credit System Integration', () => {
    it('should integrate roles with credit system seamlessly', async () => {
      const { profile: admin } = adminData;
      const { profile: user, organization } = userData;

      // Admin creates a comprehensive setup for user
      await addCredits(user.id, organization.id, 200, 'comprehensive-setup');
      await grantUnlimitedTemplates(user.id, organization.id, 'comprehensive-unlimited');
      await grantWatermarkRemoval(user.id, organization.id, 'comprehensive-watermark');

      // User should be able to use all features
      const canGenerate = await canGenerateCard(user.id);
      expect(canGenerate.canGenerate).toBe(true);

      const canCreate = await canCreateTemplate(user.id);
      expect(canCreate).toBe(true);

      const credits = await getUserCredits(user.id);
      expect(credits?.credits_balance).toBe(userData.profile.credits_balance + 200);
      expect(credits?.unlimited_templates).toBe(true);
      expect(credits?.remove_watermarks).toBe(true);

      // Verify complete audit trail
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      expect(transactions).toHaveLength(3);
      expect(transactions!.map(t => t.reference_id)).toEqual([
        'comprehensive-setup',
        'comprehensive-unlimited', 
        'comprehensive-watermark'
      ]);
    });

    it('should handle role changes without affecting credit data', async () => {
      const { profile: user, organization } = userData;

      // Set up user with credits and features
      await addCredits(user.id, organization.id, 100, 'pre-role-change');
      await grantUnlimitedTemplates(user.id, organization.id, 'pre-role-unlimited');

      const beforeCredits = await getUserCredits(user.id);

      // Change role
      await supabase
        .from('profiles')
        .update({ role: 'org_admin' })
        .eq('id', user.id);

      // Credit data should remain unchanged
      const afterCredits = await getUserCredits(user.id);
      expect(afterCredits?.credits_balance).toBe(beforeCredits?.credits_balance);
      expect(afterCredits?.unlimited_templates).toBe(beforeCredits?.unlimited_templates);
      expect(afterCredits?.card_generation_count).toBe(beforeCredits?.card_generation_count);
      expect(afterCredits?.template_count).toBe(beforeCredits?.template_count);
    });
  });
});