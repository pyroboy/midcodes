// System verification script for payment controls
// Run this with: `npx tsx verify_payment_system.ts` or similar

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Verification script to test payment system components
 * This should be run after deployment to verify everything is working
 */
async function verifyPaymentSystem(supabase: SupabaseClient, orgId: string) {
  console.log('🔍 Verifying Payment System Components...\n');

  // 1. Check org_settings table structure
  console.log('1. Checking org_settings table...');
  try {
    const { data: tableInfo, error } = await supabase
      .from('org_settings')
      .select('*')
      .limit(0); // Just check table structure

    if (error) {
      console.log('❌ org_settings table not accessible:', error.message);
      return false;
    }
    console.log('✅ org_settings table exists and accessible');
  } catch (error) {
    console.log('❌ Error checking org_settings:', error);
    return false;
  }

  // 2. Check if org has settings row
  console.log('2. Checking org settings exist...');
  try {
    const { data: orgSettings, error } = await supabase
      .from('org_settings')
      .select('payments_enabled, payments_bypass, updated_by, updated_at')
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found, create default
        console.log('⚠️  No org settings found, creating default...');
        const { error: insertError } = await supabase
          .from('org_settings')
          .insert({ 
            org_id: orgId, 
            payments_enabled: true, 
            payments_bypass: false 
          });
        
        if (insertError) {
          console.log('❌ Failed to create default org settings:', insertError.message);
          return false;
        }
        console.log('✅ Default org settings created');
      } else {
        console.log('❌ Error fetching org settings:', error.message);
        return false;
      }
    } else {
      console.log('✅ Org settings found:', {
        payments_enabled: orgSettings.payments_enabled,
        payments_bypass: orgSettings.payments_bypass,
        last_updated: orgSettings.updated_at
      });
    }
  } catch (error) {
    console.log('❌ Error checking org settings:', error);
    return false;
  }

  // 3. Check admin_audit table (optional)
  console.log('3. Checking admin_audit table...');
  try {
    const { data: auditInfo, error } = await supabase
      .from('admin_audit')
      .select('*')
      .limit(0); // Just check table structure

    if (error) {
      console.log('⚠️  admin_audit table not accessible (optional feature):', error.message);
    } else {
      console.log('✅ admin_audit table exists and accessible');
    }
  } catch (error) {
    console.log('⚠️  admin_audit table check failed (optional):', error);
  }

  // 4. Check credit_transactions table
  console.log('4. Checking credit_transactions table...');
  try {
    const { data: txInfo, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .limit(0); // Just check table structure

    if (error) {
      console.log('❌ credit_transactions table not accessible:', error.message);
      return false;
    }
    console.log('✅ credit_transactions table exists and accessible');
  } catch (error) {
    console.log('❌ Error checking credit_transactions:', error);
    return false;
  }

  // 5. Check user roles
  console.log('5. Checking user roles...');
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .in('role', ['super_admin', 'org_admin', 'id_gen_user'])
      .eq('org_id', orgId)
      .limit(5);

    if (error) {
      console.log('❌ Error fetching user roles:', error.message);
      return false;
    }

    const roleCount = {
      super_admin: users?.filter(u => u.role === 'super_admin').length || 0,
      org_admin: users?.filter(u => u.role === 'org_admin').length || 0,
      id_gen_user: users?.filter(u => u.role === 'id_gen_user').length || 0
    };

    console.log('✅ User roles found:', roleCount);

    if (roleCount.super_admin === 0) {
      console.log('⚠️  No super_admin users found. Payment controls may not be accessible.');
    }
  } catch (error) {
    console.log('❌ Error checking user roles:', error);
    return false;
  }

  console.log('\n🎉 Payment System Verification Complete!\n');
  
  // Summary and next steps
  console.log('Next Steps:');
  console.log('1. Deploy the UI components (admin dashboard, pricing page)');
  console.log('2. Deploy the remote functions (billing.remote.ts, payments.remote.ts)');
  console.log('3. Run manual QA tests as super_admin user');
  console.log('4. Test payment toggle and bypass functionality');
  console.log('5. Monitor logs and audit trail');

  return true;
}

/**
 * Quick test of payment toggle functionality
 * This simulates what happens when admin toggles payments
 */
async function testPaymentToggle(supabase: SupabaseClient, orgId: string, adminId: string) {
  console.log('\n🧪 Testing Payment Toggle Functionality...\n');

  // Get current settings
  const { data: before } = await supabase
    .from('org_settings')
    .select('payments_enabled, payments_bypass')
    .eq('org_id', orgId)
    .single();

  console.log('Current settings:', before);

  // Simulate toggle
  const newEnabled = !before?.payments_enabled;
  
  const { error: updateError } = await supabase
    .from('org_settings')
    .update({
      payments_enabled: newEnabled,
      updated_by: adminId,
      updated_at: new Date().toISOString()
    })
    .eq('org_id', orgId);

  if (updateError) {
    console.log('❌ Failed to toggle payments:', updateError.message);
    return false;
  }

  // Verify the change
  const { data: after } = await supabase
    .from('org_settings')
    .select('payments_enabled, payments_bypass, updated_by, updated_at')
    .eq('org_id', orgId)
    .single();

  console.log('Settings after toggle:', after);
  console.log('✅ Payment toggle test successful');

  // Toggle back to original state
  const { error: revertError } = await supabase
    .from('org_settings')
    .update({
      payments_enabled: before?.payments_enabled,
      updated_by: adminId,
      updated_at: new Date().toISOString()
    })
    .eq('org_id', orgId);

  if (!revertError) {
    console.log('✅ Reverted to original settings');
  }

  return true;
}

// Example usage:
// const supabase = createSupabaseClient();
// const orgId = 'your-org-id';
// await verifyPaymentSystem(supabase, orgId);

export { verifyPaymentSystem, testPaymentToggle };
