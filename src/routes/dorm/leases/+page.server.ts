import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { checkAccess } from '$lib/utils/roleChecks';
import { leaseSchema } from './formSchema';
import type { Database } from '$lib/database.types';

// Type definitions
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
  console.log('Starting page load');
  
  const { profile,user } = await safeGetSession();
  console.log('User profile loaded:', { role: profile?.role });

  if (!profile?.role || !checkAccess(profile.role, 'staff')) {
    console.log('Unauthorized access attempt');
    throw redirect(302, '/unauthorized');
  }

  try {
    console.log('Fetching data from Supabase');
    // Fetch all required data in parallel
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

    console.log('Data fetched successfully', {
      leasesCount: leases?.length || 0,
      unitsCount: rental_units?.length || 0,
      tenantsCount: tenants?.length || 0
    });

    return {
      form: await superValidate(zod(leaseSchema)),
      leases: leases ?? [],
      rental_units: rental_units ?? [],
      tenants: tenants ?? [],
      isAdminLevel,
      isAccountant
    };
  } catch (error: unknown) {
    console.error('Error in page load:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred during page load');
  }
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase, safeGetSession } }) => {

    console.log('Starting create lease action');
    
    const { profile } = await safeGetSession();
    console.log('User profile:', profile);

    if (!profile?.role || !checkAccess(profile.role, 'staff')) {
      console.error('Permission denied - User role:', profile?.role);
      return fail(403, { message: 'Insufficient permissions' });
    }

    const formData = await request.formData();
    const tenantIdsStr = formData.get('tenantIds');
    const tenantIds = tenantIdsStr ? JSON.parse(tenantIdsStr as string) : [];
    
    // Convert form data to object and parse numeric fields
    const formObject = Object.fromEntries(formData);
    const parsedData = {
      ...formObject,
      tenantIds,
      locationId: formObject.locationId ? Number(formObject.locationId) : undefined,
      leaseTermsMonth: formObject.leaseTermsMonth ? Number(formObject.leaseTermsMonth) : undefined,
      leaseSecurityDeposit: formObject.leaseSecurityDeposit ? Number(formObject.leaseSecurityDeposit) : undefined,
      leaseRentRate: formObject.leaseRentRate ? Number(formObject.leaseRentRate) : undefined
    };
    
    const form = await superValidate(parsedData, zod(leaseSchema));
    
    console.log('Form validation result:', {
      valid: form.valid,
      data: form.data,
      errors: form.errors
    });

    if (!form.valid) {
      console.error('Form validation failed:', form.errors);
      return fail(400, { form });
    }

    try {
      console.log('Checking rental unit availability for ID:', form.data.rental_unit_id);
      const { data: rental_unit, error: unitError } = await supabase
        .from('rental_unit')
        .select('rental_unit_status')
        .eq('id', form.data.rental_unit_id)
        .single();
      
      if (unitError) {
        console.error('Error fetching rental unit:', unitError);
        throw unitError;
      }

      console.log('Rental unit status:', rental_unit?.rental_unit_status);
      if (!rental_unit || !['VACANT', 'RESERVED'].includes(rental_unit.rental_unit_status)) {
        console.error('Invalid rental unit status:', rental_unit?.rental_unit_status);
        return fail(400, { form, message: 'Selected rental unit is not available' });
      }

      console.log('Creating new lease record');
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert({
          rental_unit_id: form.data.rental_unit_id,
          name: form.data.name,
          type: form.data.type,
          status: form.data.status,
          start_date: form.data.start_date,
          end_date: form.data.end_date,
          terms_month: form.data.terms_month,
          security_deposit: form.data.security_deposit,
          rent_amount: form.data.rent_amount,
          notes: form.data.notes,
          balance: form.data.balance,
          created_by: profile.id
        })
        .select()
        .single();

      if (leaseError) {
        console.error('Error creating lease:', leaseError);
        throw leaseError;
      }
      
      console.log('Lease created successfully:', lease);

      console.log('Updating rental unit status and creating tenant relationships');
      try {
        await Promise.all([
          supabase
            .from('rental_unit')
            .update({ rental_unit_status: 'OCCUPIED' })
            .eq('id', form.data.rental_unit_id),

          supabase
            .from('lease_tenants')
            .insert(form.data.tenantIds.map(tenantId => ({
              leaseId: lease.id,
              tenantId
            })))
        ]);
        
        console.log('Related records updated successfully');
      } catch (relationError) {
        console.error('Error updating related records:', relationError);
        // Attempt to rollback lease creation
        try {
          console.log('Attempting to rollback lease creation');
          await supabase
            .from('leases')
            .delete()
            .eq('id', lease.id);
          console.log('Lease rollback successful');
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
        throw relationError;
      }

      console.log('Create lease action completed successfully');
      return { form };
      
    } catch (error: unknown) {
      console.error('Create lease error:', error);
      
      let errorMessage = 'Failed to create lease';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return fail(500, { 
        form, 
        message: 'Failed to create lease',
        details: errorMessage 
      });
    }
  },

  update: async ({ request, locals: { supabase, safeGetSession } }) => {
    console.log('Starting update lease action');
    
    const { profile } = await safeGetSession();
    console.log('User profile:', profile);

    if (!profile?.role || !checkAccess(profile.role, 'admin')) {
      console.error('Permission denied - User role:', profile?.role);
      return fail(403, { message: 'Insufficient permissions' });
    }

    const formData = await request.formData();
    const tenantIdsStr = formData.get('tenantIds');
    const tenantIds = tenantIdsStr ? JSON.parse(tenantIdsStr as string) : [];
    
    const form = await superValidate(
      { ...Object.fromEntries(formData), tenantIds },
      zod(leaseSchema)
    );
    
    console.log('Form validation result:', {
      valid: form.valid,
      data: form.data,
      errors: form.errors
    });
    
    if (!form.valid) {
      console.error('Form validation failed:', form.errors);
      return fail(400, { form });
    }

    try {
      console.log('Fetching current lease details for ID:', form.data.id);
      const { data: currentLease } = await supabase
        .from('leases')
        .select('rental_unit_id')
        .eq('id', form.data.id)
        .single();

      if (currentLease) {
        if (currentLease.rental_unit_id !== form.data.rental_unit_id) {
          console.log('Rental unit change detected. Updating statuses');
          await Promise.all([
            supabase
              .from('rental_unit')
              .update({ rental_unit_status: 'VACANT' })
              .eq('id', currentLease.rental_unit_id),
            
            supabase
              .from('rental_unit')
              .update({ rental_unit_status: 'OCCUPIED' })
              .eq('id', form.data.rental_unit_id)
          ]);
        }
      }

      console.log('Updating lease record');
      const { error: leaseError } = await supabase
        .from('leases')
        .update({
          ...form.data,
          updated_by: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', form.data.id);

      if (leaseError) {
        console.error('Error updating lease:', leaseError);
        throw leaseError;
      }

      console.log('Updating tenant relationships');
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

      console.log('Update completed successfully');
      return { form };
    } catch (error: unknown) {
      console.error('Update lease error:', error);
      
      let errorMessage = 'Failed to update lease';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return fail(500, { 
        form, 
        message: 'Failed to update lease',
        details: errorMessage 
      });
    }
  },

  delete: async ({ request, locals: { supabase, safeGetSession } }) => {
    console.log('Starting delete lease action');
    
    const { profile } = await safeGetSession();
    console.log('User profile:', profile);

    if (!profile?.role || !checkAccess(profile.role, 'admin')) {
      console.error('Permission denied - User role:', profile?.role);
      return fail(403, { message: 'Insufficient permissions' });
    }

    const formData = await request.formData();
    const tenantIdsStr = formData.get('tenantIds');
    const tenantIds = tenantIdsStr ? JSON.parse(tenantIdsStr as string) : [];
    
    const form = await superValidate(
      { ...Object.fromEntries(formData), tenantIds },
      zod(leaseSchema)
    );
    if (!form.valid) {
      console.error('Form validation failed:', form.errors);
      return fail(400, { form });
    }

    console.log('Checking for lease dependencies');
    const { data: dependencies } = await supabase
      .from('lease_tenants')
      .select('id')
      .eq('leaseId', form.data.id)
      .limit(1);

    if (dependencies && dependencies.length > 0) {
      console.error('Delete blocked - existing tenant relationships found');
      return fail(400, {
        form,
        message: 'Cannot delete lease with existing tenant relationships'
      });
    }

    try {
      console.log('Fetching lease details for cleanup');
      const { data: lease } = await supabase
        .from('leases')
        .select('rental_unit_id')
        .eq('id', form.data.id)
        .single();

      if (lease) {
        console.log('Updating rental unit status and deleting lease');
        await Promise.all([
          supabase
            .from('rental_unit')
            .update({ rental_unit_status: 'VACANT' })
            .eq('id', lease.rental_unit_id),

          supabase
            .from('leases')
            .delete()
            .eq('id', form.data.id)
        ]);
      }

      console.log('Delete completed successfully');
      return { success: true };
    } catch (error: unknown) {
      console.error('Delete lease error:', error);
      
      let errorMessage = 'Failed to delete lease';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return fail(500, { 
        message: 'Failed to delete lease',
        details: errorMessage 
      });
    }
  }
};
