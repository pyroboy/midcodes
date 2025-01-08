import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getMonthlyBalances } from '$lib/server/rpc';

export const load = (async ({ locals: { supabase, safeGetSession } }) => {
  const {session,user} = await safeGetSession();

  if (!session) {
    throw error(401, { message: 'Unauthorized' });
  }

  // Get property ID from user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

    // assign context TODO
  // if (!profile?.property_id) {
  //   throw error(400, { message: 'No property assigned to user' });
  // }

  // Get rental_unit with their leases and tenants
  const { data: rental_unit, error: rental_unitError } = await supabase
    .from('rental_unit')
    .select(`
      *,
      floors!inner (
        floor_number,
        wing,
        status
      ),
      leases (
        id,
        name,
        status,
        type,
        start_date,
        end_date,
        rent_amount,
        security_deposit,
        balance,
        notes,
        lease_tenants (
          tenant:profiles (
            id,
            first_name,
            last_name,
            email,
            contact_number
          )
        ),
        billings (
          id,
          type,
          utility_type,
          amount,
          paid_amount,
          balance,
          status,
          due_date,
          billing_date,
          penalty_amount,
          notes
        ),
        payment_schedules (
          id,
          due_date,
          expected_amount,
          type,
          frequency,
          status,
          notes
        )
      ),
      meters (
        id,
        name,
        location_type,
        type,
        is_active,
        status,
        initial_reading,
        unit_rate,
        notes,
        readings (
          reading,
          reading_date
        )
      ),
      maintenance (
        id,
        title,
        description,
        status,
        completed_at,
        notes
      )
    `)
    .eq('property_id', profile.property_id);

  if (rental_unitError) {
    throw error(500, { message: rental_unitError.message });
  }

  // Get expenses for the last month
  const { data: lastMonthExpenses, error: expensesError } = await supabase
    .from('expenses')
    .select('id, property_id, amount, description, type, status, created_by, created_at')
    .eq('property_id', profile.property_id)
    .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

  if (expensesError) {
    throw error(500, { message: expensesError.message });
  }

  // Get monthly balances for all tenants
  const { data: balances, error: balancesError } = await getMonthlyBalances(supabase, {
    property_id: profile.property_id,
    months: 6
  });

  if (balancesError) {
    throw error(500, { message: balancesError.message });
  }

  // Get months for the last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString('default', { month: 'short', year: 'numeric' });
  });

  const isAdminLevel = ['super_admin', 'property_admin'].includes(profile.role);
  const isStaffLevel = ['property_manager', 'property_maintenance', 'property_accountant'].includes(profile.role);

  return {
    rental_unit: rental_unit || [],
    balances: balances || [],
    months,
    lastMonthExpenses: lastMonthExpenses || [],
    isAdminLevel,
    isStaffLevel
  };
}) satisfies PageServerLoad;