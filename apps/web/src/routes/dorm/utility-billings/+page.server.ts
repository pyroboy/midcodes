import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import type { Database } from '$lib/database.types';
import { utilityBillingCreationSchema } from '$lib/schemas/utility-billings';

export const load: PageServerLoad = async ({ locals: { supabase, getSession } }) => {
  const session = await getSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  const form = await superValidate(zod(utilityBillingCreationSchema));

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', session.user.id)
    .single();

  if (!profile?.org_id) {
    throw error(400, 'User not associated with an organization');
  }

  // Check user role
  const canAccessBillings = ['super_admin', 'property_admin', 'accountant', 'manager', 'frontdesk'].includes(profile.role);
  if (!canAccessBillings) {
    throw error(403, 'Insufficient permissions');
  }

  // Get all meters for the organization
  const { data: meters, error: metersError } = await supabase
    .from('meters')
    .select(`
      id,
      name,
      type,
      rental_unit:rental_unit (
        id,
        name,
        number
      )
    `)
    .eq('org_id', profile.org_id);

  if (metersError) throw error(500, 'Error fetching meters');

  // Get all readings
  const { data: readings, error: readingsError } = await supabase
    .from('readings')
    .select(`
      meter_id,
      reading_date,
      reading_value
    `)
    .eq('org_id', profile.org_id);

  if (readingsError) throw error(500, 'Error fetching readings');

  // Get available reading dates
  const { data: availableReadingDates, error: datesError } = await supabase
    .from('readings')
    .select('reading_date')
    .eq('org_id', profile.org_id)
    .order('reading_date');

  if (datesError) throw error(500, 'Error fetching reading dates');

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
    .eq('org_id', profile.org_id)
    .eq('status', 'ACTIVE');

  if (tenantsError) throw error(500, 'Error fetching tenant counts');

  // Process tenant counts
  const rental_unitTenantCounts = tenantCounts.reduce((acc, lease) => {
    acc[lease.rental_unit_id] = (lease.tenants?.length || 0);
    return acc;
  }, {} as Record<number, number>);

  return {
    form,
    meters,
    readings,
    availableReadingDates: availableReadingDates?.map(d => d.reading_date) || [],
    rental_unitTenantCounts,
    org_id: profile.org_id,
    role: profile.role
  };
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase, getSession } }) => {
    const session = await getSession();
    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const form = await superValidate(request, zod(utilityBillingCreationSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    // Get user's organization and role
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single();

    if (!profile?.org_id) {
      throw error(400, 'User not associated with an organization');
    }

    // Check if user has permission to create billings
    const canCreateBillings = ['super_admin', 'property_admin', 'accountant'].includes(profile.role);
    if (!canCreateBillings) {
      throw error(403, 'Insufficient permissions to create utility billings');
    }

    const { data, error: billingError } = await supabase.rpc('create_utility_billing', {
      p_start_date: form.data.start_date,
      p_end_date: form.data.end_date,
      p_type: form.data.type,
      p_cost_per_unit: form.data.cost_per_unit,
      p_org_id: profile.org_id,
      p_meter_billings: form.data.meter_billings
    });

    if (billingError) {
      console.error('Error creating utility billing:', billingError);
      return fail(500, {
        form,
        error: 'Failed to create utility billing. Please try again.'
      });
    }

    return { form };
  }
};