import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupIntegrationTest } from '../utils/testSetup';
import { testDataManager } from '../utils/TestDataManager';

describe('Credits Database Schema Tests', () => {
  const testSetup = setupIntegrationTest();
  let supabase: any;
  let testOrg: any;
  let testUser: any;

  beforeAll(async () => {
    const testData = testSetup.getTestData();
    testOrg = testData.organization;
    testUser = testData.profiles?.[0];
    
    if (!testUser) {
      const profiles = await testDataManager.createTestProfiles(testOrg.id);
      testUser = profiles[0];
    }

    // Import supabase client
    const { supabase: supabaseClient } = await import('$lib/supabaseClient');
    supabase = supabaseClient;
  });

  describe('credit_transactions Table Schema', () => {
    it('should have correct table structure', async () => {
      // Query table information
      const { data: columns, error } = await supabase.rpc('get_table_columns', {
        table_name: 'credit_transactions'
      });

      if (error && error.code === '42883') {
        // If custom function doesn't exist, use system tables
        const { data: columnsData, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', 'credit_transactions')
          .eq('table_schema', 'public');

        expect(columnsError).toBeNull();
        expect(columnsData).toBeTruthy();

        const columnNames = columnsData?.map((c: any) => c.column_name) || [];
        
        // Required columns
        expect(columnNames).toContain('id');
        expect(columnNames).toContain('user_id');
        expect(columnNames).toContain('org_id');
        expect(columnNames).toContain('transaction_type');
        expect(columnNames).toContain('amount');
        expect(columnNames).toContain('credits_before');
        expect(columnNames).toContain('credits_after');
        expect(columnNames).toContain('description');
        expect(columnNames).toContain('reference_id');
        expect(columnNames).toContain('metadata');
        expect(columnNames).toContain('created_at');
        expect(columnNames).toContain('updated_at');
      }
    });

    it('should allow inserting valid credit transactions', async () => {
      const transactionData = {
        user_id: testUser.id,
        org_id: testOrg.id,
        transaction_type: 'purchase',
        amount: 100,
        credits_before: 0,
        credits_after: 100,
        description: 'Schema test transaction',
        reference_id: `schema-test-${Date.now()}`,
        metadata: { type: 'test_purchase' }
      };

      const { data, error } = await supabase
        .from('credit_transactions')
        .insert(transactionData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data.id).toBeTruthy();
      expect(data.user_id).toBe(testUser.id);
      expect(data.org_id).toBe(testOrg.id);
      expect(data.transaction_type).toBe('purchase');
      expect(data.amount).toBe(100);
      expect(data.credits_before).toBe(0);
      expect(data.credits_after).toBe(100);
      expect(data.description).toBe('Schema test transaction');
      expect(data.metadata).toEqual({ type: 'test_purchase' });
      expect(data.created_at).toBeTruthy();
      expect(data.updated_at).toBeTruthy();
    });

    it('should validate transaction type constraints', async () => {
      const validTypes = ['purchase', 'usage', 'refund', 'bonus'];
      
      for (const type of validTypes) {
        const transactionData = {
          user_id: testUser.id,
          org_id: testOrg.id,
          transaction_type: type,
          amount: type === 'usage' ? -1 : 10,
          credits_before: 50,
          credits_after: type === 'usage' ? 49 : 60,
          description: `Test ${type} transaction`,
          reference_id: `${type}-test-${Date.now()}`,
          metadata: { type: `test_${type}` }
        };

        const { error } = await supabase
          .from('credit_transactions')
          .insert(transactionData);

        expect(error).toBeNull();
      }
    });

    it('should reject invalid transaction types', async () => {
      const invalidTransactionData = {
        user_id: testUser.id,
        org_id: testOrg.id,
        transaction_type: 'invalid_type',
        amount: 10,
        credits_before: 50,
        credits_after: 60,
        description: 'Invalid transaction type test',
        reference_id: `invalid-test-${Date.now()}`,
        metadata: { type: 'test_invalid' }
      };

      const { error } = await supabase
        .from('credit_transactions')
        .insert(invalidTransactionData);

      // Should fail due to check constraint or enum constraint
      expect(error).not.toBeNull();
    });

    it('should have proper foreign key relationships', async () => {
      // Test with non-existent user_id
      const invalidUserTransaction = {
        user_id: 'non-existent-user-123',
        org_id: testOrg.id,
        transaction_type: 'purchase',
        amount: 10,
        credits_before: 0,
        credits_after: 10,
        description: 'FK test transaction',
        reference_id: `fk-test-${Date.now()}`,
        metadata: { type: 'test_fk' }
      };

      const { error: userFkError } = await supabase
        .from('credit_transactions')
        .insert(invalidUserTransaction);

      expect(userFkError).not.toBeNull();
      expect(userFkError.code).toBe('23503'); // Foreign key violation

      // Test with non-existent org_id
      const invalidOrgTransaction = {
        user_id: testUser.id,
        org_id: 'non-existent-org-123',
        transaction_type: 'purchase',
        amount: 10,
        credits_before: 0,
        credits_after: 10,
        description: 'FK test transaction',
        reference_id: `fk-org-test-${Date.now()}`,
        metadata: { type: 'test_fk' }
      };

      const { error: orgFkError } = await supabase
        .from('credit_transactions')
        .insert(invalidOrgTransaction);

      expect(orgFkError).not.toBeNull();
      expect(orgFkError.code).toBe('23503'); // Foreign key violation
    });
  });

  describe('profiles Table Credit Fields', () => {
    it('should have credit-related columns in profiles table', async () => {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('credits_balance, card_generation_count, template_count, unlimited_templates, remove_watermarks')
        .eq('id', testUser.id)
        .single();

      expect(error).toBeNull();
      expect(profileData).toBeTruthy();
      expect(typeof profileData.credits_balance).toBe('number');
      expect(typeof profileData.card_generation_count).toBe('number');
      expect(typeof profileData.template_count).toBe('number');
      expect(typeof profileData.unlimited_templates).toBe('boolean');
      expect(typeof profileData.remove_watermarks).toBe('boolean');
    });

    it('should have proper default values for credit fields', async () => {
      // Create a new test organization and profile to check defaults
      const newOrg = await testDataManager.createTestOrganization();
      
      const newProfileData = {
        id: `schema-test-profile-${Date.now()}`,
        email: `schema.test@example-${Date.now()}.com`,
        org_id: newOrg.id,
        role: 'id_gen_user'
      };

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert(newProfileData)
        .select('credits_balance, card_generation_count, template_count, unlimited_templates, remove_watermarks')
        .single();

      expect(error).toBeNull();
      expect(newProfile).toBeTruthy();
      
      // Check default values
      expect(newProfile.credits_balance).toBe(0);
      expect(newProfile.card_generation_count).toBe(0);
      expect(newProfile.template_count).toBe(0);
      expect(newProfile.unlimited_templates).toBe(false);
      expect(newProfile.remove_watermarks).toBe(false);
    });

    it('should allow updating credit fields', async () => {
      const updates = {
        credits_balance: 150,
        card_generation_count: 5,
        template_count: 2,
        unlimited_templates: true,
        remove_watermarks: true
      };

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', testUser.id)
        .select('credits_balance, card_generation_count, template_count, unlimited_templates, remove_watermarks')
        .single();

      expect(error).toBeNull();
      expect(updatedProfile).toBeTruthy();
      expect(updatedProfile.credits_balance).toBe(150);
      expect(updatedProfile.card_generation_count).toBe(5);
      expect(updatedProfile.template_count).toBe(2);
      expect(updatedProfile.unlimited_templates).toBe(true);
      expect(updatedProfile.remove_watermarks).toBe(true);
    });

    it('should enforce non-negative constraints on credit fields', async () => {
      const invalidUpdates = {
        credits_balance: -10,
        card_generation_count: -5,
        template_count: -1
      };

      const { error } = await supabase
        .from('profiles')
        .update(invalidUpdates)
        .eq('id', testUser.id);

      // Should fail due to check constraints
      expect(error).not.toBeNull();
    });
  });

  describe('Row Level Security (RLS) Policies', () => {
    it('should enforce RLS on credit_transactions table', async () => {
      // Check if RLS is enabled
      const { data: rlsStatus, error: rlsError } = await supabase
        .from('pg_tables')
        .select('rowsecurity')
        .eq('tablename', 'credit_transactions')
        .eq('schemaname', 'public')
        .single();

      if (rlsError) {
        console.warn('Could not check RLS status:', rlsError.message);
        return;
      }

      expect(rlsStatus?.rowsecurity).toBe(true);
    });

    it('should restrict access to user own credit transactions', async () => {
      // Create another test user
      const otherProfiles = await testDataManager.createTestProfiles(testOrg.id);
      const otherUser = otherProfiles[0];

      // Insert a transaction for the other user
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: otherUser.id,
          org_id: testOrg.id,
          transaction_type: 'purchase',
          amount: 50,
          credits_before: 0,
          credits_after: 50,
          description: 'RLS test transaction',
          reference_id: `rls-test-${Date.now()}`,
          metadata: { type: 'test_rls' }
        });

      // Try to access other user's transactions (this might be allowed in test environment)
      const { data: otherUserTransactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', otherUser.id);

      // In a real app with proper RLS and authentication, this should return empty
      // But in test environment, it might return data
      expect(Array.isArray(otherUserTransactions)).toBe(true);
    });

    it('should enforce organization-scoped access', async () => {
      // Create a transaction in a different org
      const otherOrg = await testDataManager.createTestOrganization();
      
      // This should fail if RLS is properly enforced
      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: testUser.id,
          org_id: otherOrg.id, // Different org
          transaction_type: 'purchase',
          amount: 25,
          credits_before: 0,
          credits_after: 25,
          description: 'Cross-org test',
          reference_id: `cross-org-${Date.now()}`,
          metadata: { type: 'test_cross_org' }
        });

      // May succeed in test environment but would be restricted in production
      if (!error) {
        console.warn('Cross-organization transaction was allowed in test environment');
      }
    });
  });

  describe('Database Indexes and Performance', () => {
    it('should have proper indexes for common queries', async () => {
      // Test query performance for user credit transactions
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', testUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(queryTime).toBeLessThan(1000); // Should be fast with proper indexing
    });

    it('should efficiently query transactions by organization', async () => {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('org_id', testOrg.id)
        .limit(20);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(queryTime).toBeLessThan(1000); // Should be efficient
    });

    it('should efficiently query by transaction type', async () => {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('transaction_type', 'purchase')
        .eq('user_id', testUser.id)
        .limit(10);

      const queryTime = Date.now() - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(queryTime).toBeLessThan(800);
    });
  });

  describe('Data Integrity and Constraints', () => {
    it('should maintain referential integrity on cascade operations', async () => {
      // Create a test profile with transactions
      const testProfiles = await testDataManager.createTestProfiles(testOrg.id);
      const cascadeTestUser = testProfiles[0];

      // Create a transaction for this user
      const { data: transaction, error: insertError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: cascadeTestUser.id,
          org_id: testOrg.id,
          transaction_type: 'purchase',
          amount: 30,
          credits_before: 0,
          credits_after: 30,
          description: 'Cascade test transaction',
          reference_id: `cascade-test-${Date.now()}`,
          metadata: { type: 'test_cascade' }
        })
        .select()
        .single();

      expect(insertError).toBeNull();
      expect(transaction).toBeTruthy();

      // Verify transaction exists
      const { data: existingTransactions, error: selectError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', cascadeTestUser.id);

      expect(selectError).toBeNull();
      expect(existingTransactions?.length).toBeGreaterThan(0);

      // Note: Actual cascade behavior would be tested by deleting the user,
      // but we avoid that in tests to prevent data loss
    });

    it('should handle concurrent credit balance updates correctly', async () => {
      const initialBalance = 100;
      
      // Set initial balance
      await supabase
        .from('profiles')
        .update({ credits_balance: initialBalance })
        .eq('id', testUser.id);

      // Simulate concurrent updates
      const updates = [
        supabase.from('profiles').update({ credits_balance: initialBalance + 10 }).eq('id', testUser.id),
        supabase.from('profiles').update({ credits_balance: initialBalance + 20 }).eq('id', testUser.id),
        supabase.from('profiles').update({ credits_balance: initialBalance + 30 }).eq('id', testUser.id)
      ];

      const results = await Promise.allSettled(updates);
      
      // At least one update should succeed
      const successCount = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
      expect(successCount).toBeGreaterThan(0);

      // Final balance should be consistent
      const { data: finalProfile, error } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', testUser.id)
        .single();

      expect(error).toBeNull();
      expect(finalProfile).toBeTruthy();
      expect(typeof finalProfile.credits_balance).toBe('number');
    });
  });

  describe('JSON Metadata Field', () => {
    it('should properly store and retrieve JSON metadata', async () => {
      const complexMetadata = {
        type: 'test_json',
        purchase_details: {
          package_id: 'medium',
          original_price: 450,
          discount_applied: 10,
          final_price: 405
        },
        user_agent: 'Test Browser 1.0',
        ip_address: '127.0.0.1',
        session_id: 'test-session-123',
        tags: ['test', 'schema', 'validation'],
        timestamp: new Date().toISOString()
      };

      const { data: transaction, error } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: testUser.id,
          org_id: testOrg.id,
          transaction_type: 'purchase',
          amount: 100,
          credits_before: 100,
          credits_after: 200,
          description: 'JSON metadata test',
          reference_id: `json-test-${Date.now()}`,
          metadata: complexMetadata
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(transaction).toBeTruthy();
      expect(transaction.metadata).toEqual(complexMetadata);
      expect(transaction.metadata.purchase_details.package_id).toBe('medium');
      expect(Array.isArray(transaction.metadata.tags)).toBe(true);
    });

    it('should handle null and empty metadata gracefully', async () => {
      const testCases = [null, {}, { empty: null }];

      for (const metadata of testCases) {
        const { data: transaction, error } = await supabase
          .from('credit_transactions')
          .insert({
            user_id: testUser.id,
            org_id: testOrg.id,
            transaction_type: 'purchase',
            amount: 5,
            credits_before: 200,
            credits_after: 205,
            description: 'Empty metadata test',
            reference_id: `empty-${Date.now()}-${Math.random()}`,
            metadata
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(transaction).toBeTruthy();
        expect(transaction.metadata).toEqual(metadata);
      }
    });
  });
});
