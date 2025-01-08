import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { checkAccess } from '$lib/utils/roleChecks';
import { leaseSchema } from './formSchema';
import type { Database } from '$lib/database.types';

// Type definitions following template pattern
type DBLease = Database['public']['Tables']['leases']['Row'];
type DBTenant = Database['public']['Tables']['tenants']['Row'];
type DBRentalUnit = Database['public']['Tables']['rental_unit']['Row'];
type DBProperty = Database['public']['Tables']['properties']['Row'];

interface LeaseResponse extends DBLease {
tenant: Pick<DBTenant, 'id' | 'name' | 'email' | 'contact_number'>;
rental_unit: Pick<DBRentalUnit, 'id' | 'name'> & {
  property: Pick<DBProperty, 'id' | 'name'>;
};
}

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
const { profile } = await safeGetSession();

if (!profile?.role || !checkAccess(profile.role, 'staff')) {
  throw redirect(302, '/unauthorized');
}

// Fetch all required data in parallel following template pattern
const [{ data: leases }, { data: rental_units }, { data: tenants }] = await Promise.all([
  supabase
    .from('leases')
    .select(`
      *,
      tenant:tenants (
        id,
        name,
        email,
        contact_number
      ),
      rental_unit:rental_unit (
        id,
        name,
        property:properties (
          id,
          name
        )
      )
    `)
    .order('start_date', { ascending: false }),

  supabase
    .from('rental_unit')
    .select(`
      id,
      name,
      property:properties (
        id,
        name
      )
    `)
    .in('rental_unit_status', ['VACANT', 'RESERVED'])
    .order('name'),

  supabase
    .from('tenants')
    .select('id, name, email, contact_number')
    .order('name')
]);

const isAdminLevel = profile?.role && checkAccess(profile.role, 'admin');
const isAccountant = profile?.role === 'property_accountant' || isAdminLevel;

return {
  form: await superValidate(zod(leaseSchema)),
  leases: leases ?? [],
  rental_units: rental_units ?? [],
  tenants: tenants ?? [],
  isAdminLevel,
  isAccountant
};
};

export const actions: Actions = {
create: async ({ request, locals: { supabase, safeGetSession } }) => {
  const { profile } = await safeGetSession();
  if (!profile?.role || !checkAccess(profile.role, 'staff')) {
    return fail(403, { message: 'Insufficient permissions' });
  }

  const form = await superValidate(request, zod(leaseSchema));
  if (!form.valid) return fail(400, { form });

  try {
    const { data: rental_unit } = await supabase
      .from('rental_unit')
      .select('rental_unit_status')
      .eq('id', form.data.locationId)
      .single();

    if (!rental_unit || !['VACANT', 'RESERVED'].includes(rental_unit.rental_unit_status)) {
      return fail(400, { form, message: 'Selected rental unit is not available' });
    }

    const { data: lease, error: leaseError } = await supabase
      .from('leases')
      .insert({
        location_id: form.data.locationId,
        lease_type: form.data.leaseType,
        lease_status: form.data.leaseStatus,
        lease_start_date: form.data.leaseStartDate,
        lease_end_date: form.data.leaseEndDate,
        lease_terminate_date: form.data.leaseTerminateDate,
        lease_terms_month: form.data.leaseTermsMonth,
        lease_security_deposit: form.data.leaseSecurityDeposit,
        lease_rent_rate: form.data.leaseRentRate,
        lease_notes: form.data.leaseNotes,
        created_by: profile.id
      })
      .select()
      .single();

    if (leaseError) throw leaseError;

    await Promise.all([
      supabase
        .from('rental_unit')
        .update({ rental_unit_status: 'OCCUPIED' })
        .eq('id', form.data.locationId),

      supabase
        .from('lease_tenants')
        .insert(form.data.tenantIds.map(tenantId => ({
          leaseId: lease.id,
          tenantId
        })))
    ]);

    return { form };
  } catch (error) {
    console.error('Create lease error:', error);
    return fail(500, { form, message: 'Failed to create lease' });
  }
},

update: async ({ request, locals: { supabase, safeGetSession } }) => {
  const { profile } = await safeGetSession();
  if (!profile?.role || !checkAccess(profile.role, 'admin')) {
    return fail(403, { message: 'Insufficient permissions' });
  }

  const form = await superValidate(request, zod(leaseSchema));
  if (!form.valid) return fail(400, { form });

  try {
    const { data: currentLease } = await supabase
      .from('leases')
      .select('locationId')
      .eq('id', form.data.id)
      .single();

    if (currentLease) {
      if (currentLease.locationId !== form.data.locationId) {
        await Promise.all([
          supabase
            .from('rental_unit')
            .update({ rental_unit_status: 'VACANT' })
            .eq('id', currentLease.locationId),
          
          supabase
            .from('rental_unit')
            .update({ rental_unit_status: 'OCCUPIED' })
            .eq('id', form.data.locationId)
        ]);
      }
    }

    const { error: leaseError } = await supabase
      .from('leases')
      .update({
        ...form.data,
        updated_by: profile.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', form.data.id);

    if (leaseError) throw leaseError;

    await Promise.all([
      supabase
        .from('lease_tenants')
        .delete()
        .eq('leaseId', form.data.id),
      
      supabase
        .from('lease_tenants')
        .insert(form.data.tenantIds.map(tenantId => ({
          leaseId: form.data.id,
          tenantId
        })))
    ]);

    return { form };
  } catch (error) {
    console.error('Update lease error:', error);
    return fail(500, { form, message: 'Update failed' });
  }
},

delete: async ({ request, locals: { supabase, safeGetSession } }) => {
  const { profile } = await safeGetSession();
  if (!profile?.role || !checkAccess(profile.role, 'admin')) {
    return fail(403, { message: 'Insufficient permissions' });
  }

  const form = await superValidate(request, zod(leaseSchema));
  if (!form.valid) return fail(400, { form });

  // Check for dependencies
  const { data: dependencies } = await supabase
    .from('lease_tenants')
    .select('id')
    .eq('leaseId', form.data.id)
    .limit(1);

  if (dependencies && dependencies.length > 0) {
    return fail(400, {
      form,
      message: 'Cannot delete lease with existing tenant relationships'
    });
  }

  try {
    const { data: lease } = await supabase
      .from('leases')
      .select('locationId')
      .eq('id', form.data.id)
      .single();

    if (lease) {
      await Promise.all([
        supabase
          .from('rental_unit')
          .update({ rental_unit_status: 'VACANT' })
          .eq('id', lease.locationId),

        supabase
          .from('leases')
          .delete()
          .eq('id', form.data.id)
      ]);
    }

    return { success: true };
  } catch (error) {
    console.error('Delete lease error:', error);
    return fail(500, { message: 'Deletion failed' });
  }
}
};
