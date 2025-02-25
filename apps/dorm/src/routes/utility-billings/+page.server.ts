import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import type { Database } from '$lib/database.types';
import { utilityBillingCreationSchema } from '$lib/schemas/utility-billings';

// Allowed roles that can access billings
const BILLING_VIEW_ROLES = ['super_admin', 'property_admin', 'accountant', 'manager', 'frontdesk'];
const BILLING_CREATE_ROLES = ['super_admin', 'property_admin', 'accountant'];

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const session = await safeGetSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  const form = await superValidate(zod(utilityBillingCreationSchema));

  // Get user's property and role access
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('property_id, role')
    .eq('id', session.user.id)
    .single();

  if (profileError || !profile?.property_id) {
    throw error(400, 'User not associated with a property');
  }

  // Check user role
  const canAccessBillings = BILLING_VIEW_ROLES.includes(profile.role);
  if (!canAccessBillings) {
    throw error(403, 'Insufficient permissions to view billings');
  }

  // Get all meters for the property
  const { data: meters, error: metersError } = await supabase
    .from('meters')
    .select(`
      id,
      name,
      type,
      location_type,
      property_id,
      floor_id,
      rental_unit_id,
      rental_unit:rental_unit (
        id,
        name,
        number
      )
    `)
    .eq('property_id', profile.property_id);

  if (metersError) throw error(500, `Error fetching meters: ${metersError.message}`);

  // Get all readings
  const { data: readings, error: readingsError } = await supabase
    .from('readings')
    .select(`
      id,
      meter_id,
      reading_date,
      reading
    `)
    .in('meter_id', meters?.map(m => m.id) || []);

  if (readingsError) throw error(500, `Error fetching readings: ${readingsError.message}`);

  // Get available reading dates
  const { data: availableReadingDates, error: datesError } = await supabase
    .from('readings')
    .select('reading_date')
    .in('meter_id', meters?.map(m => m.id) || [])
    .order('reading_date');

  if (datesError) throw error(500, `Error fetching reading dates: ${datesError.message}`);

  // Get tenant counts per rental_unit
  const { data: tenantCounts, error: tenantsError } = await supabase
    .from('leases')
    .select(`
      rental_unit_id,
      tenants:lease_tenants (
        tenant:profiles (
          id
        )
      )
    `)
    .eq('property_id', profile.property_id)
    .eq('status', 'ACTIVE');

  if (tenantsError) throw error(500, `Error fetching tenant counts: ${tenantsError.message}`);

  // Process tenant counts
  const rental_unitTenantCounts = tenantCounts.reduce((acc, lease) => {
    if (!lease.rental_unit_id) return acc;
    acc[lease.rental_unit_id] = (lease.tenants?.length || 0);
    return acc;
  }, {} as Record<number, number>);

  // Get unique reading dates (ensure they are Date objects for comparison)
  const uniqueDates = [...new Set(availableReadingDates?.map(d => d.reading_date))].sort();

  return {
    form,
    meters: meters || [],
    readings: readings || [],
    availableReadingDates: uniqueDates,
    rental_unitTenantCounts,
    property_id: profile.property_id,
    role: profile.role,
    canCreateBillings: BILLING_CREATE_ROLES.includes(profile.role)
  };
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase, safeGetSession } }) => {
    const session = await safeGetSession();
    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const form = await superValidate(request, zod(utilityBillingCreationSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    // Get user's property and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('property_id, role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile?.property_id) {
      throw error(400, 'User not associated with a property');
    }

    // Check user permissions
    const canCreateBillings = BILLING_CREATE_ROLES.includes(profile.role);
    if (!canCreateBillings) {
      throw error(403, 'Insufficient permissions to create billings');
    }

    // Validate dates
    const startDate = new Date(form.data.start_date);
    const endDate = new Date(form.data.end_date);
    
    if (startDate >= endDate) {
      return fail(400, {
        form,
        error: 'Start date must be before end date'
      });
    }

    // Format meter billings data for the RPC call
    const formattedMeterBillings = form.data.meter_billings.map(billing => ({
      meter_id: billing.meter_id,
      start_reading: billing.start_reading,
      end_reading: billing.end_reading,
      consumption: billing.consumption,
      total_cost: billing.total_cost,
      tenant_count: billing.tenant_count,
      per_tenant_cost: billing.per_tenant_cost
    }));

    // Call RPC to create utility billing
    const { data, error: billingError } = await supabase.rpc('create_utility_billing', {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
      p_type: form.data.type,
      p_cost_per_unit: form.data.cost_per_unit,
      p_property_id: profile.property_id,
      p_meter_billings: formattedMeterBillings
    });

    if (billingError) {
      console.error('Error creating utility billing:', billingError);
      return fail(500, {
        form,
        error: `Failed to create utility billing: ${billingError.message}`
      });
    }

    // Redirect to billings list or show success message
    return { 
      form,
      success: true,
      message: 'Utility billing created successfully'
    };
  }
};