import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
  const session = await getSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  // Get user's profile and property assignment
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, property:staff_property_id')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    throw error(400, 'Profile not found');
  }

  if (!profile.property && !['super_admin', 'property_admin'].includes(profile.role)) {
    throw error(400, 'User not associated with a property');
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Get rooms with active leases and tenants
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select(`
      id,
      name,
      number,
      floor_number,
      room_status,
      property_id,
      leases!room_id(
        id,
        lease_status,
        lease_start_date,
        lease_end_date,
        lease_rent_rate,
        lease_tenants!lease_id(
          tenant:tenants!tenant_id(
            id,
            email,
            first_name,
            last_name
          )
        )
      )
    `)
    .eq('property_id', profile.property)
    .eq('leases.lease_status', 'ACTIVE')
    .order('floor_number');

  if (roomsError) throw error(500, 'Error fetching rooms');

  // Generate array of last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - i - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }).reverse();

  // Get balances for each tenant for last 12 months
  const { data: balances, error: balancesError } = await supabase
    .rpc('get_tenant_monthly_balances', {
      p_property_id: profile.property,
      p_months_back: 12
    });

  if (balancesError) throw error(500, 'Error fetching balances');

  return {
    rooms,
    months,
    balances,
    isAdminLevel: ['super_admin', 'property_admin'].includes(profile.role),
    isStaffLevel: ['property_manager', 'property_maintenance'].includes(profile.role),
    role: profile.role
  };
};