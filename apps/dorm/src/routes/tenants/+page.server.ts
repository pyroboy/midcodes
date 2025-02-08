import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { tenantFormSchema, tenantResponseSchema, type EmergencyContact } from './formSchema';
import type { Database } from '$lib/database.types';
// Database types
type DBTenant = Database['public']['Tables']['tenants']['Row'];
type DBLease = Database['public']['Tables']['leases']['Row'];

// Response type with relationships
export type TenantResponse = Omit<DBTenant, 'emergency_contact'> & {
  emergency_contact: EmergencyContact | null;
  lease: DBLease & {
    location: {
      id: string;
      number: string;
      property: {
        id: string;
        name: string;
      } | null;
    } | null;
  };
};

export const load: PageServerLoad = async ({ locals }) => {
  console.log('🔄 Starting server-side load function for tenants');
  
  const { user, permissions } = await locals.safeGetSession();
  const hasAccess = permissions.includes('tenants.read');
  
  if (!hasAccess) {
    throw error(401, 'Unauthorized');
  }



  try {
    const [tenantsResult, leasesResult, rentalUnitsResult, propertiesResult] = await Promise.all([
      // Get tenants
      locals.supabase
        .from('tenants')
        .select('*')
        .order('name'),

      // Get leases
      locals.supabase
        .from('leases')
        .select('*')
        .order('start_date'),

      // Get rental units
      locals.supabase
        .from('rental_unit')
        .select(`
          id,
          property_id,
          name,
          number
        `),

      // Get properties
      locals.supabase
        .from('properties')
        .select('id, name')
        .eq('status', 'ACTIVE')
    ]);

    // Check for errors
    if (tenantsResult.error) {
      console.error('Error loading tenants:', tenantsResult.error);
      throw error(500, 'Failed to load tenants');
    }

    if (leasesResult.error) {
      console.error('Error loading leases:', leasesResult.error);
      throw error(500, 'Failed to load leases');
    }

    if (rentalUnitsResult.error) {
      console.error('Error loading rental units:', rentalUnitsResult.error);
      throw error(500, 'Failed to load rental units');
    }

    if (propertiesResult.error) {
      console.error('Error loading properties:', propertiesResult.error);
      throw error(500, 'Failed to load properties');
    }

    // Create lookup maps
    const leasesMap = new Map(leasesResult.data?.map(lease => [lease.id, lease]) || []);
    const rentalUnitsMap = new Map(rentalUnitsResult.data?.map(unit => [unit.id, unit]) || []);
    const propertiesMap = new Map(propertiesResult.data?.map(property => [property.id, property]) || []);

    // Log the raw data
    // console.log('Raw tenants data:', tenantsResult.data);
    // console.log('Raw leases data:', leasesResult.data);
    // console.log('Raw rental units data:', rentalUnitsResult.data);
    // console.log('Raw properties data:', propertiesResult.data);


    const form = await superValidate(zod(tenantFormSchema));

    // Map tenants with their relationships
    const tenants = tenantsResult.data?.map(tenant => {
      // Get the tenant's lease
      const lease = leasesMap.get(tenant.lease_id);
      
      if (!lease) {
        return {
          ...tenant,
          lease: null
        };
      }

      // Get the rental unit for the lease
      const rentalUnit = rentalUnitsMap.get(lease.rental_unit_id);
      
      // Get the property for the rental unit
      const property = rentalUnit ? propertiesMap.get(rentalUnit.property_id) : null;

      return {
        ...tenant,
        lease: {
          ...lease,
          location: rentalUnit ? {
            id: rentalUnit.id,
            number: rentalUnit.number,
            property: property ? {
              id: property.id,
              name: property.name
            } : null
          } : null
        }
      };
    }) || [];

    return {
      form,
      tenants
    };
  } catch (err) {
    console.error('Error in load function:', err);
    throw error(500, 'Internal server error');
  }
};


// Base tenant insert type from database
type TenantInsertBase = {
  name: string;
  contact_number: string | null;
  email: string | null;
  tenant_status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED';
  emergency_contact: EmergencyContact | null;
};

// Types for database operations
type TenantInsert = TenantInsertBase;
type TenantUpdate = Partial<TenantInsertBase & { updated_at: string }>;

export const actions: Actions = {
  create: async ({ request, locals: { supabase } }: RequestEvent) => {
    const form = await superValidate(request, zod(tenantFormSchema));

    if (!form.valid) {
      console.error('Form validation failed:', form.errors);
      return fail(400, { form });
    }

    // Check for duplicate email if provided
    if (form.data.email) {
      const existingTenant = await supabase
        .from('tenants')
        .select('id')
        .eq('email', form.data.email)
        .single();

      if (existingTenant.data) {
        form.errors.email = ['A tenant with this email already exists'];
        return fail(400, { form });
      }
    }

    const insertData: TenantInsert = {
      name: form.data.name,
      contact_number: form.data.contact_number || null,
      email: form.data.email || null,
      tenant_status: 'PENDING',
      emergency_contact: form.data.emergency_contact || null
    };

    const { error: insertError } = await supabase
      .from('tenants')
      .insert(insertData);

    if (insertError) {
      console.error('Failed to create tenant:', insertError);
      if (insertError.message?.includes('Policy check failed')) {
        form.errors._errors = ['You do not have permission to create tenants'];
        return fail(403, { form });
      }
      form.errors._errors = ['Failed to create tenant'];
      return fail(500, { form });
    }

    return { form };
  },

  update: async ({ request, locals: { supabase } }: RequestEvent) => {
    const form = await superValidate(request, zod(tenantResponseSchema));
    if (!form.valid) {
      console.error('Form validation failed:', form.errors);
      return fail(400, { form });
    }

    // Check for duplicate email, excluding current tenant
    if (form.data.email) {
      const existingTenant = await supabase
        .from('tenants')
        .select('id')
        .eq('email', form.data.email)
        .neq('id', form.data.id)
        .single();

      if (existingTenant.data) {
        console.error('Duplicate email found:', form.data.email);
        form.errors.email = ['A tenant with this email already exists'];
        return fail(400, { form });
      }
    }

    const updateData: TenantUpdate = {
      name: form.data.name,
      contact_number: form.data.contact_number || null,
      email: form.data.email || null,
      tenant_status: form.data.tenant_status,
      emergency_contact: form.data.emergency_contact || null,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', form.data.id);

    if (updateError) {
      console.error('Error updating tenant:', updateError);
      if (updateError.message?.includes('Policy check failed')) {
        form.errors._errors = ['You do not have permission to update tenants'];
        return fail(403, { form });
      }
      return fail(500, { form, message: 'Failed to update tenant' });
    }

    return { form };
  },

  delete: async ({ request, locals: { supabase } }: RequestEvent) => {
    const formData = await request.formData();
    const id = formData.get('id');

    if (!id || typeof id !== 'string') {
      return fail(400, { message: 'Invalid tenant ID' });
    }

    const tenantId = parseInt(id, 10);
    if (isNaN(tenantId)) {
      return fail(400, { message: 'Invalid tenant ID format' });
    }

    const { error: deleteError } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (deleteError) {
      console.error('Error deleting tenant:', deleteError);
      if (deleteError.message?.includes('Policy check failed')) {
        return fail(403, { message: 'You do not have permission to delete tenants' });
      }
      if (deleteError.code === '23503') {
        return fail(400, { message: 'Cannot delete tenant because they have active leases or other records' });
      }
      return fail(500, { message: 'Failed to delete tenant' });
    }

    return { success: true };
  }
};