// src/routes/dorm/leases/+page.server.ts

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { leaseSchema } from './formSchema';
import type { Actions, PageServerLoad } from './$types';

export const load = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    return fail(401, { message: 'Unauthorized' });
  }

  const [{ data: userRole }, { data: leases }, { data: locations }, { data: tenants }] = await Promise.all([
    locals.supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single(),

    locals.supabase
      .from('leases')
      .select(`
        *,
        tenant:tenants (
          id,
          tenantName,
          email,
          contactNumber
        ),
        location:locations (
          id,
          locationName,
          property:properties (
            id,
            propertyName
          )
        )
      `)
      .order('leaseStartDate', { ascending: false }),

    locals.supabase
      .from('locations')
      .select(`
        id,
        locationName,
        property:properties (
          id,
          propertyName
        )
      `)
      .in('locationStatus', ['VACANT', 'RESERVED'])
      .order('locationName'),

    locals.supabase
      .from('tenants')
      .select('id, tenantName, email, contactNumber')
      .order('tenantName')
  ]);

  console.log('Server response:', { userRole, leases, locations, tenants });

  const form = await superValidate(zod(leaseSchema));
  const isAdminLevel = ['super_admin', 'property_admin'].includes(userRole?.role || '');
  const isAccountant = userRole?.role === 'property_accountant';
  const isFrontdesk = userRole?.role === 'property_frontdesk';

  return {
    form,
    leases: leases || [],
    locations: locations || [],
    tenants: tenants || [],
    userRole: userRole?.role || 'USER',
    isAdminLevel,
    isAccountant,
    isFrontdesk
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const { session, user } = await locals.safeGetSession();
    if (!session || !user) {
      return fail(401, { message: 'Unauthorized' });
    }

    const form = await superValidate(request, zod(leaseSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { data: userRole } = await locals.supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_accountant', 'property_frontdesk'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    try {
      const { data: location } = await locals.supabase
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
      const { error: locationError } = await locals.supabase
        .from('locations')
        .update({ locationStatus: 'OCCUPIED' })
        .eq('id', form.data.locationId);

      if (locationError) throw locationError;

      const { data: lease, error: leaseError } = await locals.supabase
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
        await locals.supabase
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

      const { error: tenantError } = await locals.supabase
        .from('lease_tenants')
        .insert(leaseTenants);

      if (tenantError) {
        // Rollback lease and location status if tenant assignment fails
        await locals.supabase.from('leases').delete().eq('id', lease.id);
        await locals.supabase
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
    const { session, user } = await locals.safeGetSession();
    if (!session || !user) {
      return fail(401, { message: 'Unauthorized' });
    }

    const form = await superValidate(request, zod(leaseSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { data: userRole } = await locals.supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_accountant'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    try {
      const { data: currentLease } = await locals.supabase
        .from('leases')
        .select('locationId')
        .eq('id', form.data.id)
        .single();

      // If location is changing, update both old and new location statuses
      if (currentLease && currentLease.locationId !== form.data.locationId) {
        const { error: oldLocationError } = await locals.supabase
          .from('locations')
          .update({ locationStatus: 'VACANT' })
          .eq('id', currentLease.locationId);

        if (oldLocationError) throw oldLocationError;

        const { error: newLocationError } = await locals.supabase
          .from('locations')
          .update({ locationStatus: 'OCCUPIED' })
          .eq('id', form.data.locationId);

        if (newLocationError) throw newLocationError;
      }

      const { data: lease, error: leaseError } = await locals.supabase
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
          updated_by: user.id
        })
        .eq('id', form.data.id)
        .select()
        .single();

      if (leaseError) throw leaseError;

      // Update lease-tenant relationships
      const { error: deleteTenantError } = await locals.supabase
        .from('lease_tenants')
        .delete()
        .eq('leaseId', form.data.id);

      if (deleteTenantError) throw deleteTenantError;

      const leaseTenants = form.data.tenantIds.map(tenantId => ({
        leaseId: form.data.id,
        tenantId
      }));

      const { error: tenantError } = await locals.supabase
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
    const { session, user } = await locals.safeGetSession();
    if (!session || !user) {
      return fail(401, { message: 'Unauthorized' });
    }

    const form = await superValidate(request, zod(leaseSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { data: userRole } = await locals.supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userRole || (userRole.role !== 'super_admin' && userRole.role !== 'property_admin')) {
      return fail(403, { message: 'Forbidden' });
    }

    try {
      const { data: lease } = await locals.supabase
        .from('leases')
        .select('locationId')
        .eq('id', form.data.id)
        .single();

      if (lease) {
        // Update location status back to vacant
        const { error: locationError } = await locals.supabase
          .from('locations')
          .update({ locationStatus: 'VACANT' })
          .eq('id', lease.locationId);

        if (locationError) throw locationError;
      }

      // Delete lease-tenant relationships first
      const { error: tenantError } = await locals.supabase
        .from('lease_tenants')
        .delete()
        .eq('leaseId', form.data.id);

      if (tenantError) throw tenantError;

      // Then delete the lease
      const { error: leaseError } = await locals.supabase
        .from('leases')
        .delete()
        .eq('id', form.data.id);

      if (leaseError) throw leaseError;

      return {
        form,
        success: true
      };
    } catch (error) {
      console.error('Error deleting lease:', error);
      return fail(500, { message: 'Failed to delete lease' });
    }
  }
};