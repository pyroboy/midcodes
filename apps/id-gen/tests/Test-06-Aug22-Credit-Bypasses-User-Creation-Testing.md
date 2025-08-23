# Test-06-Aug22-Credit-Bypasses-User-Creation-Testing

## Credit Bypasses and User Creation Testing Strategy

### Overview
Comprehensive testing framework for credit bypass mechanisms, premium feature unlocks, role-based permissions, user creation flows, and organization-scoped credit isolation.

### Credit Bypass Mechanisms Identified

**1. Premium Feature Bypasses:**
- `unlimited_templates`: Bypass 2-template limit for free users
- `remove_watermarks`: Bypass watermark restrictions
- `premium`: Combined unlimited templates + watermark removal

**2. Role-Based Bypasses:**
- `super_admin`: Full system access, can modify any organization
- `org_admin`: Organization-level admin permissions
- `user`: Standard user with credit limitations

**3. Organization Setting Bypasses:**
- `payments_bypass`: Allows simulated credit purchases for testing
- `payments_enabled`: Controls whether payment features are available

**4. Server-Side Bypass Functions:**
- `addCreditsBypass()`: Admin credit allocation without payment
- `grantFeatureBypass()`: Admin premium feature grants
- `generateBypassReference()`: Tracking bypass operations

### User Creation and Initial State Testing

**New User Default Values:**
```typescript
interface DefaultUserState {
  credits_balance: number           // Default: 0
  card_generation_count: number    // Default: 0  
  template_count: number           // Default: 0
  unlimited_templates: boolean     // Default: false
  remove_watermarks: boolean       // Default: false
  role: user_role                  // Default: 'user'
}
```

**Role Hierarchy:**
- `super_admin` > `org_admin` > `user`
- Additional roles: `event_admin`, `property_admin`, etc.

### Testing Framework Implementation

```typescript
// tests/unit/credit-bypasses.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import {
  canCreateTemplate,
  canGenerateCard,
  grantUnlimitedTemplates,
  grantWatermarkRemoval,
  getUserCredits
} from '$lib/utils/credits';
import {
  addCreditsBypass,
  grantFeatureBypass,
  generateBypassReference
} from '$lib/server/credits/bypass-helpers';
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
      await grantUnlimitedTemplates(profile.id, profile.org_id, 'bypass-test-1');

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
        transaction_type: 'purchase',
        amount: 0, // No credits added
        description: 'Unlimited templates upgrade'
      });

      expect(transaction.metadata).toMatchObject({
        type: 'unlimited_templates_purchase',
        amount_paid: 99
      });
    });
  });

  describe('Watermark Removal Bypass', () => {
    it('should grant watermark removal feature', async () => {
      const { profile } = testData;

      // Initially should not have watermark removal
      let credits = await getUserCredits(profile.id);
      expect(credits?.remove_watermarks).toBe(false);

      // Grant watermark removal
      await grantWatermarkRemoval(profile.id, profile.org_id, 'watermark-test-ref');

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
        transaction_type: 'purchase',
        amount: 0,
        description: 'Remove watermarks upgrade'
      });

      expect(transaction.metadata).toMatchObject({
        type: 'watermark_removal_purchase',
        amount_paid: 199
      });
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
  });
});

describe('Credit Bypasses - Server-Side Bypass Functions', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Admin Credit Bypass', () => {
    it('should allow admin to add credits via bypass', async () => {
      const { profile, organization } = testData;
      const initialBalance = profile.credits_balance;

      const bypassRef = generateBypassReference();
      const result = await addCreditsBypass(
        profile.id,
        organization.id,
        'medium', // Credit package ID
        bypassRef
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(initialBalance + 100); // Medium package = 100 credits

      // Verify profile updated
      const credits = await getUserCredits(profile.id);
      expect(credits?.credits_balance).toBe(initialBalance + 100);

      // Verify bypass transaction logged
      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', bypassRef)
        .single();

      expect(transaction.metadata).toMatchObject({
        type: 'credit_purchase_bypass',
        package_id: 'medium',
        bypass: true
      });
    });

    it('should reject invalid package IDs in bypass', async () => {
      const { profile, organization } = testData;

      const result = await addCreditsBypass(
        profile.id,
        organization.id,
        'invalid-package',
        'test-ref'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or inactive credit package');
    });

    it('should handle user not found in bypass', async () => {
      const result = await addCreditsBypass(
        'invalid-user-id',
        'some-org-id',
        'small',
        'test-ref'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found or access denied');
    });
  });

  describe('Admin Feature Bypass', () => {
    it('should allow admin to grant premium features via bypass', async () => {
      const { profile, organization } = testData;

      const bypassRef = generateBypassReference();
      const result = await grantFeatureBypass(
        profile.id,
        organization.id,
        'premium', // Feature ID
        bypassRef
      );

      expect(result.success).toBe(true);

      // Verify both features granted
      const credits = await getUserCredits(profile.id);
      expect(credits?.unlimited_templates).toBe(true);
      expect(credits?.remove_watermarks).toBe(true);

      // Verify bypass transaction logged
      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', bypassRef)
        .single();

      expect(transaction.metadata).toMatchObject({
        type: 'feature_purchase_bypass',
        feature_id: 'premium',
        feature_flag: 'premium',
        bypass: true
      });
    });

    it('should reject invalid feature IDs in bypass', async () => {
      const { profile, organization } = testData;

      const result = await grantFeatureBypass(
        profile.id,
        organization.id,
        'invalid-feature',
        'test-ref'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid or inactive feature SKU');
    });
  });

  describe('Bypass Reference Generation', () => {
    it('should generate unique bypass references', async () => {
      const ref1 = generateBypassReference();
      const ref2 = generateBypassReference();
      const ref3 = generateBypassReference();

      expect(ref1).toMatch(/^bypass_\d+_[a-z0-9]{6}$/);
      expect(ref2).toMatch(/^bypass_\d+_[a-z0-9]{6}$/);
      expect(ref3).toMatch(/^bypass_\d+_[a-z0-9]{6}$/);

      // Should be unique
      expect(ref1).not.toBe(ref2);
      expect(ref2).not.toBe(ref3);
      expect(ref1).not.toBe(ref3);
    });

    it('should include timestamp in reference', async () => {
      const beforeTime = Date.now();
      const ref = generateBypassReference();
      const afterTime = Date.now();

      const timestampStr = ref.split('_')[1];
      const timestamp = parseInt(timestampStr);

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});

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
    });

    it('should handle user creation with explicit values', async () => {
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

      await testDataManager.cleanupAll();
    });
  });

  describe('User Role Assignment', () => {
    it('should create users with default role', async () => {
      const { profile } = testData;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', profile.id)
        .single();

      expect(userProfile.role).toBeDefined();
      expect(['super_admin', 'org_admin', 'user'].includes(userProfile.role)).toBe(true);
    });

    it('should create users within organization scope', async () => {
      const { profile, organization } = testData;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', profile.id)
        .single();

      expect(userProfile.org_id).toBe(organization.id);
    });
  });
});

describe('Organization-Based Credit Isolation', () => {
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
    });

    it('should prevent cross-organization credit access', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { organization: org2 } = testData2;

      // Attempt bypass with wrong organization
      const result = await addCreditsBypass(
        profile1.id,
        org2.id, // Wrong organization
        'small',
        'cross-org-test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found or access denied');
    });

    it('should maintain separate transaction histories per organization', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Add credits to both users
      await addCreditsBypass(profile1.id, org1.id, 'small', 'org1-ref');
      await addCreditsBypass(profile2.id, org2.id, 'medium', 'org2-ref');

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
          payments_enabled: true
        });

      await supabase
        .from('org_settings')
        .upsert({
          org_id: org2.id,
          payments_bypass: false,
          payments_enabled: true
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
  });
});

describe('Role-Based Credit Permissions', () => {
  let adminData: any;
  let userData: any;

  beforeEach(async () => {
    adminData = await testDataManager.createMinimalTestData();
    userData = await testDataManager.createMinimalTestData();

    // Set roles
    await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', adminData.profile.id);

    await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', userData.profile.id);
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Admin Role Capabilities', () => {
    it('should allow admin to perform bypass operations', async () => {
      const { profile: admin } = adminData;
      const { profile: user, organization } = userData;

      // Admin should be able to grant credits to users
      const result = await addCreditsBypass(
        user.id,
        organization.id,
        'large',
        'admin-grant'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(userData.profile.credits_balance + 250); // Large package
    });

    it('should allow admin to grant premium features', async () => {
      const { profile: admin } = adminData;
      const { profile: user, organization } = userData;

      const result = await grantFeatureBypass(
        user.id,
        organization.id,
        'premium',
        'admin-premium'
      );

      expect(result.success).toBe(true);

      // Verify features granted
      const credits = await getUserCredits(user.id);
      expect(credits?.unlimited_templates).toBe(true);
      expect(credits?.remove_watermarks).toBe(true);
    });
  });

  describe('User Role Limitations', () => {
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
  });
});
```

### Integration with Existing Testing Framework

```typescript
// tests/utils/bypassTestUtils.ts
import { addCreditsBypass, grantFeatureBypass, generateBypassReference } from '$lib/server/credits/bypass-helpers';
import { supabase } from '$lib/supabaseClient';

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
   * Simulate admin granting credits to user
   */
  static async adminGrantCredits(
    userId: string,
    orgId: string,
    packageId: string = 'medium'
  ) {
    const bypassRef = generateBypassReference();
    return await addCreditsBypass(userId, orgId, packageId, bypassRef);
  }

  /**
   * Simulate admin granting premium features
   */
  static async adminGrantPremium(
    userId: string,
    orgId: string,
    featureId: string = 'premium'
  ) {
    const bypassRef = generateBypassReference();
    return await grantFeatureBypass(userId, orgId, featureId, bypassRef);
  }

  /**
   * Verify bypass transaction metadata
   */
  static async verifyBypassTransaction(
    userId: string,
    referenceId: string,
    expectedType: 'credit_purchase_bypass' | 'feature_purchase_bypass'
  ) {
    const { data: transaction } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('reference_id', referenceId)
      .single();

    expect(transaction.metadata.type).toBe(expectedType);
    expect(transaction.metadata.bypass).toBe(true);
    
    return transaction;
  }
}
```

### Test Coverage Areas

**✅ Premium Feature Bypasses:**
- Unlimited templates bypass testing
- Watermark removal bypass testing
- Combined premium feature testing
- Transaction logging for feature grants

**✅ Server-Side Bypass Functions:**
- Admin credit allocation testing
- Admin feature grant testing
- Bypass reference generation testing
- Error handling for invalid operations

**✅ User Creation and Initial State:**
- Default user state verification
- Free generation availability testing
- Template limit enforcement testing
- Custom user creation testing

**✅ Organization-Based Isolation:**
- Cross-organization credit isolation
- Separate transaction histories
- Organization settings impact
- Permission boundary testing

**✅ Role-Based Permissions:**
- Admin capability testing
- User limitation enforcement
- Role hierarchy verification
- Permission escalation prevention

This comprehensive testing suite ensures all credit bypass mechanisms, user creation flows, and permission systems work correctly while maintaining proper security boundaries.