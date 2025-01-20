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
    // console.log('Fetching data from Supabase');
    // Fetch all required data in parallel
    const [{ data: leases }, { data: rental_units }, { data: tenants }] = await Promise.all([
      supabase
        .from('leases')
        .select(`
          *,
          lease_tenants!inner (
            tenant:tenants (
              id,
              name,
              email,
              contact_number
            )
          ),
          rental_unit:rental_unit!inner (
            id,
            name,
            property:properties!inner (
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
    console.log('🚀 Starting create lease action');
    
    try {
      const { profile } = await safeGetSession();
      if (!profile?.role || !checkAccess(profile.role, 'staff')) {
        return fail(403, { message: 'Insufficient permissions', error: true });
      }

      const formData = await request.formData();
      const tenantIdsStr = formData.get('tenantIds');
      let tenantIds: number[] = [];

      try {
        if (tenantIdsStr) {
          const parsed = JSON.parse(tenantIdsStr as string);
          if (Array.isArray(parsed)) {
            tenantIds = parsed.map(Number).filter(id => !isNaN(id));
          }
        }
        if (tenantIds.length === 0) {
          return fail(400, { message: 'At least one valid tenant ID is required', error: true });
        }
        console.log('Parsed tenant IDs:', tenantIds);
      } catch (error) {
        return fail(400, { message: 'Invalid tenant data format', error: true });
      }

      const rental_unit_id = Number(formData.get('rental_unit_id'));
      if (isNaN(rental_unit_id)) {
        return fail(400, { message: 'Invalid rental unit ID', error: true });
      }

      const { data: rental_unit, error: unitError } = await supabase
        .from('rental_unit')
        .select(`
          id,
          name,
          floor:floors!floor_id(
            floor_number,
            wing
          ),
          rental_unit_status,
          property:properties!property_id(
            name
          )
        `)
        .eq('id', rental_unit_id)
        .single();

      if (unitError || !rental_unit) {
        console.error('Unit error:', unitError);
        return fail(400, { message: 'Failed to fetch rental unit details', error: true });
      }

      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name')
        .in('id', tenantIds);

      if (tenantsError || !tenants || tenants.length === 0) {
        console.error('Tenants error:', tenantsError);
        return fail(400, { message: 'Failed to fetch tenant details', error: true });
      }

      // Generate lease name
      const floor = Array.isArray(rental_unit.floor) ? rental_unit.floor[0] : rental_unit.floor;
      const floorInfo = floor?.wing 
        ? `${floor.floor_number}F ${floor.wing}` 
        : `${floor?.floor_number}F`;
      const leaseName = `${floorInfo} - ${rental_unit.name}`;

      const form = await superValidate(
        { ...Object.fromEntries(formData), tenantIds },
        zod(leaseSchema)
      );

      if (!form.valid) {
        console.error('Form validation failed:', form.errors);
        return fail(400, { form, message: 'Validation failed', error: true });
      }

      if (rental_unit.rental_unit_status !== 'VACANT') {
        return fail(400, {
          form,
          message: 'Selected rental unit is not available',
          error: true
        });
      }

      // Create lease
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert({
          rental_unit_id: rental_unit_id,
          name: leaseName,
          status: form.data.status,
          start_date: form.data.start_date,
          end_date: form.data.end_date,
          terms_month: form.data.terms_month,
          security_deposit: form.data.security_deposit,
          rent_amount: form.data.rent_amount,
          notes: form.data.notes,
          balance: form.data.rent_amount,
          created_by: profile.id
        })
        .select()
        .single();

      if (leaseError || !lease) {
        console.error('Lease creation error:', leaseError);
        return fail(500, {
          form,
          message: 'Failed to create lease record',
          error: true,
          details: leaseError?.message
        });
      }

      console.log('Created lease:', lease);

      // Create tenant relationships - removed the id field since it's serial
      const lease_tenants = tenantIds.map(tenant_id => ({
        lease_id: lease.id,
        tenant_id,
        created_at: new Date().toISOString()
      }));

      const { error: relationError } = await supabase
        .from('lease_tenants')
        .insert(lease_tenants)
        .select();

      if (relationError) {
        console.error('Relation error:', relationError);
        await supabase.from('leases').delete().eq('id', lease.id);
        return fail(500, {
          form,
          message: 'Failed to create lease relationships',
          error: true,
          details: relationError.message
        });
      }

      return { 
        form,
        success: true
      };

    } catch (error) {
      console.error('💥 Unhandled error in create lease action:', error);
      const form = await superValidate(zod(leaseSchema));
      return fail(500, {
        form,
        message: 'An unexpected error occurred',
        error: true,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  update: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { profile } = await safeGetSession();
    if (!profile?.role || !checkAccess(profile.role, 'admin')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    try {
      const formData = await request.formData();
      const form = await superValidate(formData, zod(leaseSchema));
      
      if (!form.valid) {
        return fail(400, { form });
      }

      const { error: leaseError } = await supabase
        .from('leases')
        .update({
          status: form.data.status,
          start_date: form.data.start_date,
          end_date: form.data.end_date,
          terms_month: form.data.terms_month,
          rent_amount: form.data.rent_amount,
          security_deposit: form.data.security_deposit,
          notes: form.data.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', form.data.id);

      if (leaseError) throw leaseError;

      return { form, success: true };
    } catch (error) {
      console.error('Update lease error:', error);
      return fail(500, { 
        message: 'Failed to update lease',
        error: true
      });
    }
  },

  delete: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { profile } = await safeGetSession();
    if (!profile?.role || !checkAccess(profile.role, 'admin')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const formData = await request.formData();
    const leaseId = formData.get('id');

    if (!leaseId) {
      return fail(400, { message: 'Lease ID is required' });
    }

    try {
      const { error: leaseError } = await supabase
        .from('leases')
        .delete()
        .eq('id', leaseId);

      if (leaseError) throw leaseError;

      return { success: true };
    } catch (error) {
      console.error('Delete lease error:', error);
      return fail(500, { 
        message: 'Failed to delete lease',
        error: true
      });
    }
  }
};
