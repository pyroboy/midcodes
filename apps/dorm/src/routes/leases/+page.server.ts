import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { leaseSchema, deleteLeaseSchema } from './formSchema';
import type { Actions, PageServerLoad } from './$types';
import type { Database } from '$lib/database.types';
import type { PostgrestError } from '@supabase/postgrest-js';

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
  console.log('🔄 Starting leases load');
  
  const { user } = await safeGetSession();
  if (!user) throw error(401, 'Unauthorized');

  console.log('📊 Fetching leases data');
  const startTime = performance.now();
  
  const [leasesResult, unitsResult, tenantsResult] = await Promise.all([
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
        property:properties (id, name)
      `)
      .in('rental_unit_status', ['VACANT', 'RESERVED'])
      .order('name'),

    supabase
      .from('tenants')
      .select('id, name, email, contact_number')
      .order('name')
  ]);

  console.log('⏱️ Data fetch completed:', {
    leases: leasesResult.data?.length || 0,
    units: unitsResult.data?.length || 0,
    tenants: tenantsResult.data?.length || 0,
    time: `${(performance.now() - startTime).toFixed(2)}ms`
  });

  return {
    form: await superValidate(zod(leaseSchema)),
    deleteForm: await superValidate(zod(deleteLeaseSchema)),
    leases: leasesResult.data ?? [],
    rental_units: unitsResult.data ?? [],
    tenants: tenantsResult.data ?? []
  };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase, safeGetSession } }) => {
    console.log('🚀 Creating lease');
    const form = await superValidate(request, zod(leaseSchema));
    
    if (!form.valid) {
      console.error('❌ Form validation failed:', form.errors);
      return fail(400, { form });
    }

    const { user } = await safeGetSession();
    if (!user) return fail(403, { form, message: ['Unauthorized'] });

    try {
      // Validate rental unit status
      const { data: rentalUnit } = await supabase
        .from('rental_unit')
        .select('rental_unit_status')
        .eq('id', form.data.rental_unit_id)
        .single();

      if (rentalUnit?.rental_unit_status !== 'VACANT') {
        form.errors.rental_unit_id = ['Unit must be vacant to create lease'];
        return fail(400, { form });
      }

      // Get unit details for lease name
      const { data: unit } = await supabase
        .from('rental_unit')
        .select(`
          name,
          floor:floors (
            floor_number,
            wing
          )
        `)
        .eq('id', form.data.rental_unit_id)
        .single();

      // Generate lease name with fallback
      let leaseName: string;
      if (!unit?.floor?.[0]) {
        leaseName = unit?.name ?? `Unit ${form.data.rental_unit_id}`;
      } else {
        const floorInfo = unit.floor[0];
        leaseName = `${floorInfo.floor_number}F${floorInfo.wing ? ` ${floorInfo.wing}` : ''} - ${unit.name}`;
      }

      // Extract tenant IDs and prepare lease data matching the schema
      const { tenantIds, ...leaseData } = form.data;
      
      // Create lease with exact schema match
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert({
          rental_unit_id: leaseData.rental_unit_id,
          name: leaseName,
          start_date: leaseData.start_date,
          end_date: leaseData.end_date,
          rent_amount: leaseData.rent_amount,
          security_deposit: leaseData.security_deposit,
          balance: leaseData.rent_amount, // Initial balance is rent amount
          notes: leaseData.notes || null,
          created_by: user.id,
          terms_month: leaseData.terms_month,
          status: leaseData.status
        })
        .select()
        .single();

      if (leaseError) throw leaseError;

      // Create lease-tenant relationships
      const leaseTenants = tenantIds.map(tenant_id => ({
        lease_id: lease.id,
        tenant_id
      }));

      const { error: relationError } = await supabase
        .from('lease_tenants')
        .insert(leaseTenants);

      if (relationError) {
        // Rollback lease creation if tenant relationship fails
        await supabase.from('leases').delete().eq('id', lease.id);
        throw relationError;
      }

      // Note: The trigger update_rental_unit_status_on_lease will handle unit status update

      return { form };

    } catch (err) {
      console.error('💥 Lease creation error:', err);
      const error = err as PostgrestError;
      
      if (error.message?.includes('Policy check failed')) {
        return fail(403, { 
          form, 
          message: ['Permission denied'],
          errors: [error.message] 
        });
      }
      
      return fail(500, { 
        form, 
        message: ['Failed to create lease'],
        errors: [error.message] 
      });
    }
  },

  update: async ({ request, locals: { supabase, safeGetSession } }) => {
    const form = await superValidate(request, zod(leaseSchema));
    
    if (!form.valid) {
      console.error('❌ Update validation failed:', form.errors);
      return fail(400, { form });
    }

    const { user } = await safeGetSession();
    if (!user) return fail(403, { form, message: ['Unauthorized'] });

    try {
      // Extract tenant IDs and prepare lease data
      const { tenantIds, ...leaseData } = form.data;

      // Update lease
      const { error: updateError } = await supabase
        .from('leases')
        .update({
          rental_unit_id: leaseData.rental_unit_id,
          name: leaseData.name,
          start_date: leaseData.start_date,
          end_date: leaseData.end_date,
          rent_amount: leaseData.rent_amount,
          security_deposit: leaseData.security_deposit,
          notes: leaseData.notes || null,
          terms_month: leaseData.terms_month,
          status: leaseData.status
        })
        .eq('id', leaseData.id);

      if (updateError) throw updateError;

      // Update tenant relationships
      if (tenantIds && leaseData.id) {
        // Delete existing relationships
        await supabase
          .from('lease_tenants')
          .delete()
          .eq('lease_id', leaseData.id);

        // Create new relationships
        const leaseTenants = tenantIds.map(tenant_id => ({
          lease_id: leaseData.id!,
          tenant_id
        }));

        const { error: relationError } = await supabase
          .from('lease_tenants')
          .insert(leaseTenants);

        if (relationError) throw relationError;
      }

      // Note: Triggers will handle:
      // - update_lease_status_on_change
      // - update_leases_updated_at
      // - update_rental_unit_status_on_lease

      return { form };

    } catch (err) {
      console.error('💥 Lease update error:', err);
      const error = err as PostgrestError;
      
      return fail(500, { 
        form, 
        message: ['Failed to update lease'],
        errors: [error.message] 
      });
    }
  },

  delete: async ({ request, locals: { supabase, safeGetSession } }) => {
    const form = await superValidate(request, zod(deleteLeaseSchema));
    
    if (!form.valid) {
      console.error('❌ Delete validation failed:', form.errors);
      return fail(400, { form });
    }

    const { user } = await safeGetSession();
    if (!user) return fail(403, { form, message: ['Unauthorized'] });

    try {
      // Delete lease (cascade will handle lease_tenants deletion)
      const { error: deleteError } = await supabase
        .from('leases')
        .delete()
        .eq('id', form.data.id);

      if (deleteError) throw deleteError;

      // Note: update_rental_unit_status_on_lease trigger will handle unit status update

      return { form };

    } catch (err) {
      console.error('💥 Lease deletion error:', err);
      const error = err as PostgrestError;
      
      return fail(500, { 
        form, 
        message: ['Failed to delete lease'],
        errors: [error.message] 
      });
    }
  }
};