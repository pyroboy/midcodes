import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { tenantFormSchema, tenantResponseSchema, type EmergencyContact } from './formSchema';
import type { Database } from '$lib/database.types';
import type { TenantResponse } from '$lib/types/tenant';

export const load: PageServerLoad = async ({ locals }) => {
  const { user, permissions } = await locals.safeGetSession();
  if (!permissions.includes('tenants.read')) throw error(401, 'Unauthorized');

  const [tenantsResult, propertiesResult] = await Promise.all([
    locals.supabase
      .from('tenants')
      .select(`
        *,
        lease_tenants:lease_tenants!left(
          lease:leases!left(
            *,
            location:rental_unit!left(
              id,
              number,
              property:properties!left(id,name)
            )
          )
        )
      `)
      .order('name'),
    locals.supabase
      .from('properties')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name')
  ]);

  if (tenantsResult.error) {
    console.error('Error loading tenants:', tenantsResult.error);
    throw error(500, 'Failed to load tenants');
  }

  // The query now returns lease_tenants[], we need to flatten it to match TenantResponse
  const tenants = tenantsResult.data.map(tenant => {
    const lease = tenant.lease_tenants[0]?.lease ?? null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lease_tenants, ...rest } = tenant;
    return { ...rest, lease };
  }) as TenantResponse[];
console.log(tenants);
  return {
    tenants,
    properties: propertiesResult.data || [],
    form: await superValidate(zod(tenantFormSchema))
  };
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