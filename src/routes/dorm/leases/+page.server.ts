// src/routes/dorm/leases/+page.server.ts

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { leaseSchema } from './formSchema';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  const [{ data: userRole }, { data: leases }, { data: locations }, { data: tenants }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single(),

    supabase
      .from('leases')
      .select(`
        *,
        location:locations(
          id,
          locationName,
          locationFloorLevel
        ),
        lease_tenants(
          tenant:tenants(
            id,
            tenantName,
            email,
            contactNumber
          )
        )
      `)
      .order('leaseStartDate', { ascending: false }),

    supabase
      .from('locations')
      .select(`
        id,
        locationName,
        locationFloorLevel,
        locationStatus
      `)
      .in('locationStatus', ['VACANT', 'RESERVED'])
      .order('locationName'),

    supabase
      .from('tenants')
      .select('id, tenantName, email, contactNumber')
      .order('tenantName')
  ]);

  const form = await superValidate(zod(leaseSchema));
  const isAdminLevel = ['super_admin', 'property_admin'].includes(userRole?.role || '');
  const isAccountant = userRole?.role === 'property_accountant';
  const isFrontdesk = userRole?.role === 'property_frontdesk';

  return {
    form,
    leases,
    locations,
    tenants,
    userRole: userRole?.role || 'user',
    isAdminLevel,
    isAccountant,
    isFrontdesk
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_accountant', 'property_frontdesk'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(leaseSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { data: location } = await supabase
        .from('locations')
        .select('locationStatus')
        .eq('id', form.data.locationId)
        .single();

      if (!location || !['VACANT', 'RESERVED'].includes(location.locationStatus)) {
        return fail(400, { 
          form,
          message: 'Selected location is not available for new leases'
        });
      }

      // Start a transaction
      const { error: locationError } = await supabase
        .from('locations')
        .update({ locationStatus: 'OCCUPIED' })
        .eq('id', form.data.locationId);

      if (locationError) throw locationError;

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
          created_by: form.data.createdBy
        })
        .select()
        .single();

      if (leaseError) {
        // Rollback location status if lease creation fails
        await supabase
          .from('locations')
          .update({ locationStatus: location.locationStatus })
          .eq('id', form.data.locationId);
        throw leaseError;
      }

      // Create lease-tenant relationships
      const leaseTenants = form.data.tenantIds.map(tenantId => ({
        leaseId: lease.id,
        tenantId
      }));

      const { error: tenantError } = await supabase
        .from('lease_tenants')
        .insert(leaseTenants);

      if (tenantError) {
        // Rollback lease and location status if tenant assignment fails
        await supabase.from('leases').delete().eq('id', lease.id);
        await supabase
          .from('locations')
          .update({ locationStatus: location.locationStatus })
          .eq('id', form.data.locationId);
        throw tenantError;
      }

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_accountant'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(leaseSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { data: currentLease } = await supabase
        .from('leases')
        .select('locationId')
        .eq('id', form.data.id)
        .single();

      // If location is changing, update both old and new location statuses
      if (currentLease && currentLease.locationId !== form.data.locationId) {
        const { error: oldLocationError } = await supabase
          .from('locations')
          .update({ locationStatus: 'VACANT' })
          .eq('id', currentLease.locationId);

        if (oldLocationError) throw oldLocationError;

        const { error: newLocationError } = await supabase
          .from('locations')
          .update({ locationStatus: 'OCCUPIED' })
          .eq('id', form.data.locationId);

        if (newLocationError) throw newLocationError;
      }

      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .update({
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
          updated_by: session.user.id
        })
        .eq('id', form.data.id)
        .select()
        .single();

      if (leaseError) throw leaseError;

      // Update lease-tenant relationships
      const { error: deleteTenantError } = await supabase
        .from('lease_tenants')
        .delete()
        .eq('leaseId', form.data.id);

      if (deleteTenantError) throw deleteTenantError;

      const leaseTenants = form.data.tenantIds.map(tenantId => ({
        leaseId: form.data.id,
        tenantId
      }));

      const { error: tenantError } = await supabase
        .from('lease_tenants')
        .insert(leaseTenants);

      if (tenantError) throw tenantError;

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  delete: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(leaseSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { data: lease } = await supabase
        .from('leases')
        .select('locationId')
        .eq('id', form.data.id)
        .single();

      if (lease) {
        // Update location status back to vacant
        const { error: locationError } = await supabase
          .from('locations')
          .update({ locationStatus: 'VACANT' })
          .eq('id', lease.locationId);

        if (locationError) throw locationError;
      }

      // Delete lease-tenant relationships first
      const { error: tenantError } = await supabase
        .from('lease_tenants')
        .delete()
        .eq('leaseId', form.data.id);

      if (tenantError) throw tenantError;

      // Then delete the lease
      const { error: leaseError } = await supabase
        .from('leases')
        .delete()
        .eq('id', form.data.id);

      if (leaseError) throw leaseError;

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  }
};