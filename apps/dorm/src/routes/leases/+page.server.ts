import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { leaseSchema, deleteLeaseSchema } from './formSchema';
import type { Actions, PageServerLoad } from './$types';
import type { Database } from '$lib/database.types';
import type { PostgrestError } from '@supabase/postgrest-js';
import { createPaymentSchedules } from './utils';
import type { PaymentSchedule as DBPaymentSchedule } from '$lib/types/database';

type DBLease = Database['public']['Tables']['leases']['Row'];
type DBTenant = Database['public']['Tables']['tenants']['Row'];
type DBRentalUnit = Database['public']['Tables']['rental_unit']['Row'];
type DBProperty = Database['public']['Tables']['properties']['Row'];
type DBFloor = Database['public']['Tables']['floors']['Row'];

interface LeaseResponse extends DBLease {
  tenant: Pick<DBTenant, 'id' | 'name' | 'email' | 'contact_number'>;
  rental_unit: Pick<DBRentalUnit, 'id' | 'name'> & {
    property: Pick<DBProperty, 'id' | 'name'>;
    floor: Pick<DBFloor, 'floor_number' | 'wing'>;
  };
  payment_schedules: DBPaymentSchedule[];
  balance: number;
}

interface LeaseTenant {
  lease_id: number;
  tenant: DBTenant;
}

interface RentalUnit {
  id: number;
  rental_unit_number: string;
  property_id: number;
  floor_id?: number;
}

interface Property {
  id: number;
  name: string;
}

interface Floor {
  id: number;
  floor_number: string;
  wing?: string;
}

interface PaymentSchedule {
  id: number;
  lease_id: number;
  due_date: string;
  expected_amount: number;
  status: string;
  type: string;
  frequency: string;
}

interface Lease {
  id: number;
  name?: string;
  status: string;
  type: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  security_deposit: number;
  notes?: string;
  rental_unit_id: number;
}
export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  console.log('🔄 Starting leases load');
  
  const { user } = await safeGetSession();
  if (!user) throw error(401, 'Unauthorized');

  console.log('📊 Fetching leases data');
  const startTime = performance.now();
  
  try {
    // Single query to fetch leases with all related data
    const { data: leases, error: leasesError } = await supabase
      .from('leases')
      .select(`
        *,
        lease_tenants (
          tenant:tenants (
            id,
            name,
            email,
            contact_number,
            created_at,
            updated_at,
            auth_id
          )
        ),
        rental_unit:rental_unit (
          id,
          name,
          number,
          floor_id,
          property:properties!rooms_property_id_fkey (
            id,
            name
          )
        ),
        payment_schedules (
          *
        )
      `)
      .order('created_at', { ascending: false });

    if (leasesError) {
      console.error('Error loading leases:', leasesError);
      throw error(500, 'Failed to load leases');
    }

    // Fetch floors separately since there's no direct relationship
    const { data: floors, error: floorsError } = await supabase
      .from('floors')
      .select('*');

    if (floorsError) {
      console.error('Error loading floors:', floorsError);
      throw error(500, 'Failed to load floors');
    }

    // Create a floors lookup map
    const floorsMap = new Map(floors?.map(floor => [floor.id, floor]));

    // Transform the data structure
    const mappedLeases = leases?.map(lease => {
      interface LeaseTenant {
        tenant: {
          id: number;
          name: string;
          email: string | null;
          contact_number: string | null;
          created_at: string;
          updated_at: string;
          auth_id: string | null;
        };
      }
      
      const tenants = lease.lease_tenants?.map((lt: LeaseTenant) => lt.tenant) || [];
      const paymentSchedules = lease.payment_schedules || [];

      // Calculate total expected amount
      const totalExpected = paymentSchedules.reduce((sum: number, schedule: PaymentSchedule) => {
        return sum + (schedule.expected_amount || 0);
      }, 0);

      // Get floor information from the map
      const floor = lease.rental_unit?.floor_id ? floorsMap.get(lease.rental_unit.floor_id) : null;

      const mappedLease = {
        ...lease,
        name: lease.name || `Lease #${lease.id}`,
        balance: totalExpected,
        payment_schedules: paymentSchedules,
        lease_tenants: tenants.map((tenant: LeaseTenant['tenant']) => ({
          tenant: {
            name: tenant.name,
            contact_number: tenant.contact_number || undefined,
            email: tenant.email || undefined
          }
        })),
        rental_unit: lease.rental_unit ? {
          rental_unit_number: lease.rental_unit.number || '',
          property: lease.rental_unit.property ? {
            name: lease.rental_unit.property.name
          } : undefined,
          floor: floor ? {
            floor_number: floor.floor_number,
            wing: floor.wing || ''
          } : {
            floor_number: '',
            wing: ''
          }
        } : undefined,
        type: lease.type || 'STANDARD',
        status: lease.status || 'ACTIVE',
        security_deposit: Number(lease.security_deposit || 0),
        rent_amount: Number(lease.rent_amount || 0)
      };

      console.log('📋 Mapped Lease:', {
        id: mappedLease.id,
        name: mappedLease.name,
        tenants: mappedLease.lease_tenants?.map((lt: { tenant: { name: string } }) => lt.tenant.name),
        rentalUnitNumber: mappedLease.rental_unit?.rental_unit_number,
        propertyName: mappedLease.rental_unit?.property?.name,
        floorNumber: mappedLease.rental_unit?.floor?.floor_number,
        wing: mappedLease.rental_unit?.floor?.wing,
        balance: mappedLease.balance,
        paymentSchedulesCount: mappedLease.payment_schedules?.length || 0
      });

      return mappedLease;
    }) || [];

    // Fetch additional data needed for forms
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, email, contact_number');

    if (tenantsError) {
      console.error('Error loading tenants:', tenantsError);
      throw error(500, 'Failed to load tenants');
    }

    const { data: rentalUnits, error: unitsError } = await supabase
      .from('rental_unit')
      .select(`
        *,
        property:properties!rooms_property_id_fkey (
          id,
          name
        )
      `);

    if (unitsError) {
      console.error('Error loading rental units:', unitsError);
      throw error(500, 'Failed to load rental units');
    }

    // Map rental units with floor information
    const rentalUnitsWithFloors = rentalUnits?.map(unit => ({
      id: unit.id,
      name: unit.name,
      property: unit.property ? [{
        id: unit.property.id,
        name: unit.property.name
      }] : [], // Wrap in array since form expects array
      floor: unit.floor_id ? floorsMap.get(unit.floor_id) : null
    }));

    const queryTime = performance.now() - startTime;
    console.log('⏱️ Data fetch completed:', {
      leases: mappedLeases.length,
      units: rentalUnits?.length || 0,
      tenants: tenants?.length || 0,
      time: `${queryTime.toFixed(2)}ms`
    });

    const form = await superValidate(zod(leaseSchema));
    const deleteForm = await superValidate(zod(deleteLeaseSchema));

    return {
      form,
      deleteForm,
      leases: mappedLeases,
      tenants: tenants || [],
      rental_units: rentalUnitsWithFloors || []
    };
  } catch (err) {
    console.error('Error in load function:', err);
    throw error(500, 'Internal server error');
  }
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
      
      // Start a transaction
      const { data: lease, error: leaseError } = await supabase
        .from('leases')
        .insert({
          rental_unit_id: leaseData.rental_unit_id,
          name: leaseName,
          start_date: leaseData.start_date,
          end_date: leaseData.end_date,
          rent_amount: leaseData.rent_amount,
          security_deposit: leaseData.security_deposit,
          notes: leaseData.notes || null,
          created_by: user.id,
          terms_month: leaseData.terms_month,
          status: leaseData.status,
          created_at: new Date().toISOString()
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

      // Create payment schedules
      await createPaymentSchedules(
        supabase,
        lease.id,
        form.data.start_date,
        form.data.end_date,
        form.data.rent_amount,
        form.data.prorated_amount
      );

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
        message: ['Failed to create lease and payment schedules'],
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
      // First delete billings
      const { error: billingsError } = await supabase
        .from('billings')
        .delete()
        .eq('lease_id', form.data.id);

      if (billingsError) {
        console.error('Error deleting billings:', billingsError);
        throw new Error('Failed to delete billings');
      }

      // Then delete payment schedules
      const { error: schedulesError } = await supabase
        .from('payment_schedules')
        .delete()
        .eq('lease_id', form.data.id);

      if (schedulesError) {
        console.error('Error deleting payment schedules:', schedulesError);
        throw new Error('Failed to delete payment schedules');
      }

      // Then delete lease_tenants
      const { error: tenantsError } = await supabase
        .from('lease_tenants')
        .delete()
        .eq('lease_id', form.data.id);

      if (tenantsError) {
        console.error('Error deleting lease tenants:', tenantsError);
        throw new Error('Failed to delete lease tenants');
      }

      // Finally delete the lease
      const { error: leaseError } = await supabase
        .from('leases')
        .delete()
        .eq('id', form.data.id);

      if (leaseError) {
        console.error('Error deleting lease:', leaseError);
        throw new Error('Failed to delete lease');
      }

      return { success: true };
    } catch (error) {
      console.error('Delete transaction failed:', error);
      return fail(500, {
        message: 'Failed to delete lease and associated records'
      });
    }
  }
};