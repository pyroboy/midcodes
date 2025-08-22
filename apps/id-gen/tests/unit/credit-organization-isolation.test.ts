import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import {
  addCredits,
  deductCardGenerationCredit,
  getUserCredits,
  getCreditHistory
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

describe('Multi-Tenant Organization Isolation', () => {
  let testData1: any;
  let testData2: any;

  beforeEach(async () => {
    testData1 = await testDataManager.createMinimalTestData();
    testData2 = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Credit Operation Isolation', () => {
    it('should isolate credit operations between organizations', async () => {
      const { profile: profile1 } = testData1;
      const { profile: profile2 } = testData2;

      // Add credits to first user
      await supabase
        .from('profiles')
        .update({ credits_balance: 100 })
        .eq('id', profile1.id);

      // Second user should be unaffected
      const credits2 = await getUserCredits(profile2.id);
      expect(credits2?.credits_balance).not.toBe(100);
      expect(credits2?.credits_balance).toBe(testData2.profile.credits_balance);
    });

    it('should maintain separate credit balances per organization', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Add different amounts to each organization
      await addCredits(profile1.id, org1.id, 50, 'org1-purchase', 'Org 1 credits');
      await addCredits(profile2.id, org2.id, 75, 'org2-purchase', 'Org 2 credits');

      // Verify isolation
      const credits1 = await getUserCredits(profile1.id);
      const credits2 = await getUserCredits(profile2.id);

      expect(credits1?.credits_balance).toBe(testData1.profile.credits_balance + 50);
      expect(credits2?.credits_balance).toBe(testData2.profile.credits_balance + 75);
    });

    it('should isolate card generation counts between organizations', async () => {
      const { profile: profile1 } = testData1;
      const { profile: profile2 } = testData2;

      // Generate cards for first user
      await supabase
        .from('profiles')
        .update({ card_generation_count: 5 })
        .eq('id', profile1.id);

      // Second user should be unaffected
      const credits2 = await getUserCredits(profile2.id);
      expect(credits2?.card_generation_count).toBe(0);
    });

    it('should isolate template counts between organizations', async () => {
      const { profile: profile1 } = testData1;
      const { profile: profile2 } = testData2;

      // Update template count for first user
      await supabase
        .from('profiles')
        .update({ template_count: 2 })
        .eq('id', profile1.id);

      // Second user should be unaffected
      const credits2 = await getUserCredits(profile2.id);
      expect(credits2?.template_count).toBe(0);
    });

    it('should maintain separate transaction histories per organization', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Add credits to both users
      await addCredits(profile1.id, org1.id, 25, 'org1-ref', 'Org 1 transaction');
      await addCredits(profile2.id, org2.id, 50, 'org2-ref', 'Org 2 transaction');

      // Check org1 transactions
      const { data: org1Transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('org_id', org1.id);

      // Check org2 transactions
      const { data: org2Transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('org_id', org2.id);

      expect(org1Transactions).toHaveLength(1);
      expect(org2Transactions).toHaveLength(1);
      expect(org1Transactions![0].reference_id).toBe('org1-ref');
      expect(org2Transactions![0].reference_id).toBe('org2-ref');
      expect(org1Transactions![0].amount).toBe(25);
      expect(org2Transactions![0].amount).toBe(50);
    });

    it('should prevent cross-organization transaction access', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Add credits to both organizations
      await addCredits(profile1.id, org1.id, 100, 'cross-test-1');
      await addCredits(profile2.id, org2.id, 150, 'cross-test-2');

      // Get transactions for profile1 - should only see org1 transactions
      const history1 = await getCreditHistory(profile1.id);
      expect(history1).toHaveLength(1);
      expect(history1[0].org_id).toBe(org1.id);
      expect(history1[0].reference_id).toBe('cross-test-1');

      // Get transactions for profile2 - should only see org2 transactions
      const history2 = await getCreditHistory(profile2.id);
      expect(history2).toHaveLength(1);
      expect(history2[0].org_id).toBe(org2.id);
      expect(history2[0].reference_id).toBe('cross-test-2');
    });
  });

  describe('Organization Data Scope Enforcement', () => {
    it('should enforce organization scope in credit queries', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Verify users belong to different organizations
      expect(org1.id).not.toBe(org2.id);

      const { data: profile1Data } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', profile1.id)
        .single();

      const { data: profile2Data } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', profile2.id)
        .single();

      expect(profile1Data!.org_id).toBe(org1.id);
      expect(profile2Data!.org_id).toBe(org2.id);
    });

    it('should maintain organization scope during credit operations', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Set up users for paid card generation
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 20
        })
        .eq('id', profile1.id);

      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 30
        })
        .eq('id', profile2.id);

      // Generate cards for both users
      await deductCardGenerationCredit(profile1.id, org1.id, 'org1-card');
      await deductCardGenerationCredit(profile2.id, org2.id, 'org2-card');

      // Verify transactions are organization-scoped
      const { data: org1Transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('org_id', org1.id)
        .eq('reference_id', 'org1-card');

      const { data: org2Transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('org_id', org2.id)
        .eq('reference_id', 'org2-card');

      expect(org1Transactions).toHaveLength(1);
      expect(org2Transactions).toHaveLength(1);
      expect(org1Transactions![0].user_id).toBe(profile1.id);
      expect(org2Transactions![0].user_id).toBe(profile2.id);
    });

    it('should handle organization-scoped credit aggregation', async () => {
      const { organization: org1 } = testData1;
      const { organization: org2 } = testData2;

      // Create multiple users in org1
      const org1User2 = await testDataManager.createUserWithCredits({
        credits: 50,
        card_generation_count: 0,
        template_count: 0
      });

      // Update org_id for second user in org1
      await supabase
        .from('profiles')
        .update({ org_id: org1.id })
        .eq('id', org1User2.profile.id);

      // Add credits to multiple users in org1
      await addCredits(testData1.profile.id, org1.id, 100, 'org1-user1');
      await addCredits(org1User2.profile.id, org1.id, 150, 'org1-user2');

      // Add credits to org2
      await addCredits(testData2.profile.id, org2.id, 75, 'org2-user1');

      // Count transactions per organization
      const { data: org1Count } = await supabase
        .from('credit_transactions')
        .select('*', { count: 'exact' })
        .eq('org_id', org1.id);

      const { data: org2Count } = await supabase
        .from('credit_transactions')
        .select('*', { count: 'exact' })
        .eq('org_id', org2.id);

      expect(org1Count).toHaveLength(2);
      expect(org2Count).toHaveLength(1);

      // Cleanup additional test data
      await supabase
        .from('profiles')
        .delete()
        .eq('id', org1User2.profile.id);
    });
  });

  describe('Organization Settings Impact', () => {
    it('should respect payments_bypass setting per organization', async () => {
      const { organization: org1 } = testData1;
      const { organization: org2 } = testData2;

      // Enable bypass for org1 only
      await supabase
        .from('org_settings')
        .upsert({
          org_id: org1.id,
          payments_bypass: true,
          payments_enabled: true,
          updated_by: testData1.profile.id,
          updated_at: new Date().toISOString()
        });

      await supabase
        .from('org_settings')
        .upsert({
          org_id: org2.id,
          payments_bypass: false,
          payments_enabled: true,
          updated_by: testData2.profile.id,
          updated_at: new Date().toISOString()
        });

      // Verify settings are isolated
      const { data: org1Settings } = await supabase
        .from('org_settings')
        .select('*')
        .eq('org_id', org1.id)
        .single();

      const { data: org2Settings } = await supabase
        .from('org_settings')
        .select('*')
        .eq('org_id', org2.id)
        .single();

      expect(org1Settings.payments_bypass).toBe(true);
      expect(org2Settings.payments_bypass).toBe(false);
    });

    it('should handle independent organization setting updates', async () => {
      const { organization: org1 } = testData1;
      const { organization: org2 } = testData2;

      // Create initial settings
      await supabase
        .from('org_settings')
        .upsert({
          org_id: org1.id,
          payments_enabled: false,
          payments_bypass: false,
          updated_by: testData1.profile.id,
          updated_at: new Date().toISOString()
        });

      await supabase
        .from('org_settings')
        .upsert({
          org_id: org2.id,
          payments_enabled: false,
          payments_bypass: false,
          updated_by: testData2.profile.id,
          updated_at: new Date().toISOString()
        });

      // Update only org1 settings
      await supabase
        .from('org_settings')
        .update({
          payments_enabled: true,
          payments_bypass: true,
          updated_at: new Date().toISOString()
        })
        .eq('org_id', org1.id);

      // Verify org2 settings unchanged
      const { data: org2Settings } = await supabase
        .from('org_settings')
        .select('*')
        .eq('org_id', org2.id)
        .single();

      expect(org2Settings.payments_enabled).toBe(false);
      expect(org2Settings.payments_bypass).toBe(false);
    });

    it('should handle missing organization settings gracefully', async () => {
      const { organization: org1 } = testData1;

      // Try to get settings that don't exist
      const { data: settings, error } = await supabase
        .from('org_settings')
        .select('*')
        .eq('org_id', org1.id)
        .single();

      // Should handle missing settings (either null data or specific error)
      if (error) {
        expect(error.code).toBe('PGRST116'); // No rows returned
      } else {
        expect(settings).toBeNull();
      }
    });
  });

  describe('Cross-Organization Security', () => {
    it('should prevent users from accessing other organization data', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Add transaction to org1
      await addCredits(profile1.id, org1.id, 100, 'security-test');

      // Profile2 should not see org1 transactions
      const { data: profile2Transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile2.id)
        .eq('reference_id', 'security-test');

      expect(profile2Transactions || []).toHaveLength(0);

      // Verify profile1 can see their own transaction
      const { data: profile1Transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile1.id)
        .eq('reference_id', 'security-test');

      expect(profile1Transactions).toHaveLength(1);
    });

    it('should enforce organization boundaries in profile queries', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Query profiles in org1 - should not return org2 users
      const { data: org1Profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', org1.id);

      // Query profiles in org2 - should not return org1 users
      const { data: org2Profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', org2.id);

      const org1UserIds = org1Profiles?.map(p => p.id) || [];
      const org2UserIds = org2Profiles?.map(p => p.id) || [];

      expect(org1UserIds).toContain(profile1.id);
      expect(org1UserIds).not.toContain(profile2.id);
      expect(org2UserIds).toContain(profile2.id);
      expect(org2UserIds).not.toContain(profile1.id);
    });

    it('should maintain transaction integrity across organizations', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Perform operations in both organizations simultaneously
      const promises = [
        addCredits(profile1.id, org1.id, 50, 'concurrent-org1'),
        addCredits(profile2.id, org2.id, 75, 'concurrent-org2')
      ];

      const results = await Promise.all(promises);

      // Both operations should succeed
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      // Verify correct balances
      const credits1 = await getUserCredits(profile1.id);
      const credits2 = await getUserCredits(profile2.id);

      expect(credits1?.credits_balance).toBe(testData1.profile.credits_balance + 50);
      expect(credits2?.credits_balance).toBe(testData2.profile.credits_balance + 75);

      // Verify transactions are correctly attributed
      const { data: allTransactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .in('reference_id', ['concurrent-org1', 'concurrent-org2'])
        .order('reference_id');

      expect(allTransactions).toHaveLength(2);
      expect(allTransactions![0].org_id).toBe(org1.id);
      expect(allTransactions![1].org_id).toBe(org2.id);
    });
  });
});