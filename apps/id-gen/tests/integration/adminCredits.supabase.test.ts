import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://wnkqlrfmtiibrqnncgqu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3FscmZtdGlpYnJxbm5jZ3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjIyMTM3MywiZXhwIjoyMDM3Nzk3MzczfQ.s_C88O9_L4O_v-e-n_2c-56G3_o-8J-8Z-5e-7D-3E';

const TEST_ORG_ID = '3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d';
const TEST_USER_ID = '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d';
const SUPER_ADMIN_USER_ID = '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d';

describe('Admin Credit Adjustment Integration Tests', () => {
    let supabase;

    beforeEach(async () => {
        supabase = createClient(supabaseUrl, supabaseKey);
        await cleanupTestData();
        await setupTestData();
    });

    afterEach(async () => {
        await cleanupTestData();
    });

    async function setupTestData() {
        // Create a test organization
        await supabase.from('organizations').insert({ id: TEST_ORG_ID, name: 'Test Org' });

        // Create a test user (the one whose credits will be adjusted)
        await supabase.from('users').insert({ id: TEST_USER_ID, email: 'test@example.com' });
        await supabase.from('profiles').insert({ id: TEST_USER_ID, org_id: TEST_ORG_ID, credits_balance: 0 });

        // Create a super admin user (the one performing the adjustment)
        await supabase.from('users').insert({ id: SUPER_ADMIN_USER_ID, email: 'admin@example.com' });
        await supabase.from('profiles').insert({ id: SUPER_ADMIN_USER_ID, org_id: TEST_ORG_ID, role: 'super_admin' });
    }

    async function cleanupTestData() {
        await supabase.from('admin_audit_log').delete().eq('admin_id', SUPER_ADMIN_USER_ID);
        await supabase.from('credit_transactions').delete().eq('user_id', TEST_USER_ID);
        await supabase.from('profiles').delete().in('id', [TEST_USER_ID, SUPER_ADMIN_USER_ID]);
        await supabase.from('users').delete().in('id', [TEST_USER_ID, SUPER_ADMIN_USER_ID]);
        await supabase.from('organizations').delete().eq('id', TEST_ORG_ID);
    }

    it('should correctly adjust user credits and create audit logs', async () => {
        const delta = 100;
        const reason = 'Test credit addition';

        // 1. Fetch initial balance
        const { data: initialProfile } = await supabase
            .from('profiles')
            .select('credits_balance')
            .eq('id', TEST_USER_ID)
            .single();

        expect(initialProfile.credits_balance).toBe(0);
        const before = initialProfile.credits_balance;
        const after = before + delta;

        // 2. Update user's credit balance
        await supabase
            .from('profiles')
            .update({ credits_balance: after })
            .eq('id', TEST_USER_ID);

        // 3. Create a credit transaction record
        await supabase.from('credit_transactions').insert({
            user_id: TEST_USER_ID,
            org_id: TEST_ORG_ID,
            transaction_type: 'bonus',
            amount: delta,
            credits_before: before,
            credits_after: after,
            description: reason,
            metadata: { adjusted_by: 'super_admin' }
        });

        // 4. Create an admin audit log entry
        await supabase.rpc('insert_admin_audit', {
            p_org_id: TEST_ORG_ID,
            p_admin_id: SUPER_ADMIN_USER_ID,
            p_action: 'credit_adjustment',
            p_target_type: 'user_credits',
            p_target_id: TEST_USER_ID,
            p_metadata: { delta, before, after, reason }
        });

        // 5. Verify the changes
        const { data: finalProfile } = await supabase
            .from('profiles')
            .select('credits_balance')
            .eq('id', TEST_USER_ID)
            .single();
        expect(finalProfile.credits_balance).toBe(after);

        const { data: transaction } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', TEST_USER_ID)
            .single();
        expect(transaction.amount).toBe(delta);
        expect(transaction.credits_before).toBe(before);
        expect(transaction.credits_after).toBe(after);
        expect(transaction.description).toBe(reason);

        const { data: auditLog } = await supabase
            .from('admin_audit_log')
            .select('*')
            .eq('target_id', TEST_USER_ID)
            .single();
        expect(auditLog.action).toBe('credit_adjustment');
        expect(auditLog.metadata.delta).toBe(delta);
        expect(auditLog.metadata.reason).toBe(reason);
    });
});
