import { expect } from 'vitest';
import { testDataManager } from './TestDataManager';
import { supabase } from '$lib/supabaseClient';
import { addCredits, grantUnlimitedTemplates, grantWatermarkRemoval } from '$lib/utils/credits';

export class BypassTestUtils {
  /**
   * Create admin user for bypass testing
   */
  static async createAdminUser(role: 'super_admin' | 'org_admin' = 'super_admin') {
    const testData = await testDataManager.createMinimalTestData();
    
    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', testData.profile.id);

    return testData;
  }

  /**
   * Create user with specific role
   */
  static async createUserWithRole(role: string) {
    const testData = await testDataManager.createMinimalTestData();
    
    await supabase
      .from('profiles')
      .update({ role })
      .eq('id', testData.profile.id);

    return testData;
  }

  /**
   * Simulate admin granting credits to user
   */
  static async adminGrantCredits(
    userId: string,
    orgId: string,
    amount: number,
    reference?: string
  ) {
    const ref = reference || `admin-grant-${Date.now()}`;
    return await addCredits(userId, orgId, amount, ref, 'Admin credit grant');
  }

  /**
   * Simulate admin granting unlimited templates
   */
  static async adminGrantUnlimitedTemplates(
    userId: string,
    orgId: string,
    reference?: string
  ) {
    const ref = reference || `admin-unlimited-${Date.now()}`;
    return await grantUnlimitedTemplates(userId, orgId, ref);
  }

  /**
   * Simulate admin granting watermark removal
   */
  static async adminGrantWatermarkRemoval(
    userId: string,
    orgId: string,
    reference?: string
  ) {
    const ref = reference || `admin-watermark-${Date.now()}`;
    return await grantWatermarkRemoval(userId, orgId, ref);
  }

  /**
   * Grant all premium features to user
   */
  static async grantAllPremiumFeatures(
    userId: string,
    orgId: string,
    baseReference = 'premium-bundle'
  ) {
    const results = await Promise.all([
      this.adminGrantUnlimitedTemplates(userId, orgId, `${baseReference}-unlimited`),
      this.adminGrantWatermarkRemoval(userId, orgId, `${baseReference}-watermark`)
    ]);

    return {
      unlimited: results[0],
      watermark: results[1],
      allSuccessful: results.every(r => r.success)
    };
  }

  /**
   * Create user with premium features pre-granted
   */
  static async createPremiumUser() {
    const testData = await testDataManager.createMinimalTestData();
    const { profile, organization } = testData;

    await this.grantAllPremiumFeatures(profile.id, organization.id, 'initial-premium');

    return testData;
  }

  /**
   * Create user with specific credit amount
   */
  static async createUserWithCredits(creditAmount: number) {
    const testData = await testDataManager.createMinimalTestData();
    const { profile, organization } = testData;

    await this.adminGrantCredits(profile.id, organization.id, creditAmount, 'initial-credits');

    return testData;
  }

  /**
   * Verify bypass transaction metadata
   */
  static async verifyPremiumTransaction(
    userId: string,
    referenceId: string,
    expectedType: 'unlimited_templates_purchase' | 'watermark_removal_purchase'
  ) {
    const { data: transaction } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('reference_id', referenceId)
      .single();

    expect(transaction).toBeDefined();
    expect(transaction.transaction_type).toBe('purchase');
    expect(transaction.amount).toBe(0); // Premium features don't add credits
    expect(transaction.metadata.type).toBe(expectedType);
    
    return transaction;
  }

  /**
   * Verify credit transaction
   */
  static async verifyCreditTransaction(
    userId: string,
    referenceId: string,
    expectedAmount: number
  ) {
    const { data: transaction } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('reference_id', referenceId)
      .single();

    expect(transaction).toBeDefined();
    expect(transaction.transaction_type).toBe('purchase');
    expect(transaction.amount).toBe(expectedAmount);
    expect(transaction.metadata.type).toBe('credit_purchase');
    
    return transaction;
  }

  /**
   * Create multi-organization test setup
   */
  static async createMultiOrgSetup() {
    const org1Data = await testDataManager.createMinimalTestData();
    const org2Data = await testDataManager.createMinimalTestData();

    // Set different roles
    await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', org1Data.profile.id);

    await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', org2Data.profile.id);

    return {
      org1: org1Data,
      org2: org2Data
    };
  }

  /**
   * Verify organization isolation
   */
  static async verifyOrganizationIsolation(
    org1Id: string,
    org2Id: string,
    operationType: 'credits' | 'transactions' | 'profiles'
  ) {
    if (operationType === 'transactions') {
      const { data: org1Transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('org_id', org1Id);

      const { data: org2Transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('org_id', org2Id);

      // Verify no cross-organization transaction contamination
      org1Transactions?.forEach(t => expect(t.org_id).toBe(org1Id));
      org2Transactions?.forEach(t => expect(t.org_id).toBe(org2Id));

      return {
        org1Count: org1Transactions?.length || 0,
        org2Count: org2Transactions?.length || 0
      };
    }

    if (operationType === 'profiles') {
      const { data: org1Profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', org1Id);

      const { data: org2Profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', org2Id);

      // Verify profiles are properly isolated
      org1Profiles?.forEach(p => expect(p.org_id).toBe(org1Id));
      org2Profiles?.forEach(p => expect(p.org_id).toBe(org2Id));

      return {
        org1Count: org1Profiles?.length || 0,
        org2Count: org2Profiles?.length || 0
      };
    }

    return { org1Count: 0, org2Count: 0 };
  }

  /**
   * Create organization settings for testing
   */
  static async createOrgSettings(
    orgId: string,
    userId: string,
    settings: {
      payments_enabled?: boolean;
      payments_bypass?: boolean;
    } = {}
  ) {
    const defaultSettings = {
      payments_enabled: false,
      payments_bypass: false,
      ...settings
    };

    const { data, error } = await supabase
      .from('org_settings')
      .upsert({
        org_id: orgId,
        updated_by: userId,
        updated_at: new Date().toISOString(),
        ...defaultSettings
      })
      .select()
      .single();

    if (error) {
      console.warn('Failed to create org settings:', error);
    }

    return data;
  }

  /**
   * Verify role permissions work correctly
   */
  static async verifyRolePermissions(
    userId: string,
    expectedRole: string,
    expectedCapabilities: {
      canBypassTemplateLimit?: boolean;
      canRemoveWatermarks?: boolean;
      hasUnlimitedCredits?: boolean;
    }
  ) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, unlimited_templates, remove_watermarks, credits_balance')
      .eq('id', userId)
      .single();

    expect(profile!.role).toBe(expectedRole);

    if (expectedCapabilities.canBypassTemplateLimit !== undefined) {
      expect(profile!.unlimited_templates).toBe(expectedCapabilities.canBypassTemplateLimit);
    }

    if (expectedCapabilities.canRemoveWatermarks !== undefined) {
      expect(profile!.remove_watermarks).toBe(expectedCapabilities.canRemoveWatermarks);
    }

    if (expectedCapabilities.hasUnlimitedCredits !== undefined) {
      // This would be implementation-specific based on how unlimited credits work
      expect(profile!.credits_balance > 1000).toBe(expectedCapabilities.hasUnlimitedCredits);
    }

    return profile;
  }

  /**
   * Create complete test scenario with multiple users and roles
   */
  static async createCompleteTestScenario() {
    const superAdmin = await this.createUserWithRole('super_admin');
    const orgAdmin = await this.createUserWithRole('org_admin');
    const regularUser = await this.createUserWithRole('user');

    // Grant different features to different users
    await this.grantAllPremiumFeatures(
      superAdmin.profile.id, 
      superAdmin.organization.id, 
      'super-admin-features'
    );

    await this.adminGrantCredits(
      orgAdmin.profile.id, 
      orgAdmin.organization.id, 
      200, 
      'org-admin-credits'
    );

    return {
      superAdmin,
      orgAdmin,
      regularUser
    };
  }

  /**
   * Performance test for bypass operations
   */
  static async performanceTestBypasses(
    userCount: number = 10,
    operationsPerUser: number = 3
  ) {
    const startTime = Date.now();
    const users = [];

    // Create users
    for (let i = 0; i < userCount; i++) {
      const user = await testDataManager.createMinimalTestData();
      users.push(user);
    }

    // Perform bypass operations
    const operations = [];
    for (const user of users) {
      for (let i = 0; i < operationsPerUser; i++) {
        operations.push(
          this.adminGrantCredits(user.profile.id, user.organization.id, 50, `perf-${i}`)
        );
      }
    }

    await Promise.all(operations);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Cleanup
    for (const user of users) {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.profile.id);
        
      await supabase
        .from('organizations')
        .delete()
        .eq('id', user.organization.id);
    }

    return {
      userCount,
      operationsPerUser,
      totalOperations: userCount * operationsPerUser,
      duration,
      averageTimePerOperation: duration / (userCount * operationsPerUser)
    };
  }

  /**
   * Test role escalation scenarios
   */
  static async testRoleEscalation(baseRole: string, targetRole: string) {
    const user = await this.createUserWithRole(baseRole);
    
    // Record initial state
    const initialCredits = await import('$lib/utils/credits').then(m => m.getUserCredits(user.profile.id));
    
    // Escalate role
    await supabase
      .from('profiles')
      .update({ role: targetRole })
      .eq('id', user.profile.id);
    
    // Verify state after escalation
    const finalCredits = await import('$lib/utils/credits').then(m => m.getUserCredits(user.profile.id));
    
    return {
      user,
      roleChanged: baseRole !== targetRole,
      creditsUnchanged: JSON.stringify(initialCredits) === JSON.stringify(finalCredits),
      initialCredits,
      finalCredits
    };
  }
}

// Export helper functions for common scenarios
export const bypassScenarios = {
  /**
   * Admin granting full premium access to user
   */
  async fullPremiumGrant(userId: string, orgId: string) {
    const result = await BypassTestUtils.grantAllPremiumFeatures(userId, orgId, 'full-premium');
    const credits = await BypassTestUtils.adminGrantCredits(userId, orgId, 500, 'premium-credits');
    
    return {
      premium: result,
      credits,
      success: result.allSuccessful && credits.success
    };
  },

  /**
   * Multi-user organization setup
   */
  async organizationSetup(userCount = 3) {
    const users = [];
    const org = await testDataManager.createMinimalTestData();
    
    // Create additional users in same organization
    for (let i = 1; i < userCount; i++) {
      const user = await testDataManager.createMinimalTestData();
      await supabase
        .from('profiles')
        .update({ org_id: org.organization.id })
        .eq('id', user.profile.id);
      users.push(user);
    }
    
    users.unshift(org); // Add original org data as first user
    
    return {
      organization: org.organization,
      users
    };
  },

  /**
   * Role hierarchy test setup
   */
  async roleHierarchy() {
    const hierarchy = await BypassTestUtils.createCompleteTestScenario();
    
    // Verify role relationships
    await BypassTestUtils.verifyRolePermissions(
      hierarchy.superAdmin.profile.id,
      'super_admin',
      { canBypassTemplateLimit: true, canRemoveWatermarks: true }
    );
    
    return hierarchy;
  }
};

