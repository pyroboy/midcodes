import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { tenantFormSchema, tenantResponseSchema, type EmergencyContact, parseEmergencyContactFromForm } from './formSchema';
import type { Database } from '$lib/database.types';
import type { TenantResponse } from '$lib/types/tenant';

export const load: PageServerLoad = async ({ locals, depends }) => {
  const { user, permissions } = await locals.safeGetSession();
  if (!permissions.includes('tenants.read')) throw error(401, 'Unauthorized');

  // Set up dependencies for invalidation
  depends('app:tenants');

  // Return minimal data for instant navigation
  return {
    // Start with empty arrays for instant rendering
    tenants: [],
    properties: [],
    form: await superValidate(zod(tenantFormSchema)),
    // Flag to indicate lazy loading
    lazy: true,
    // Return a promise that resolves with the actual data
    tenantsPromise: loadTenantsData(locals),
    propertiesPromise: loadPropertiesData(locals)
  };
};

// Separate function to load tenants data
async function loadTenantsData(locals: any) {
  const tenantsResult = await locals.supabase
    .from('tenants')
    .select(`
      *,
      lease_tenants:lease_tenants!left(
        lease:leases!left(
          *,
          location:rental_unit!left(
            id,
            name,
            number,
            base_rate,
            property:properties!left(id,name)
          )
        )
      )
    `)
    .is('deleted_at', null) // Only load non-deleted tenants
    .order('name');

  if (tenantsResult.error) {
    console.error('Error loading tenants:', tenantsResult.error);
    throw error(500, 'Failed to load tenants');
  }

  // The query now returns lease_tenants[], we need to flatten it to match TenantResponse
  const tenants = tenantsResult.data.map((tenant: any) => {
    const lease = tenant.lease_tenants[0]?.lease ?? null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lease_tenants, ...rest } = tenant;
    return { ...rest, lease };
  }) as TenantResponse[];

  return tenants;
}

// Separate function to load properties data
async function loadPropertiesData(locals: any) {
  const propertiesResult = await locals.supabase
    .from('properties')
    .select('id, name')
    .eq('status', 'ACTIVE')
    .order('name');

  return propertiesResult.data || [];
}

// Base tenant insert type from database
type TenantInsertBase = {
  name: string;
  contact_number: string | null;
  email: string | null;
  tenant_status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLACKLISTED';
  emergency_contact: EmergencyContact | null;
  profile_picture_url?: string | null;
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

    console.log('🔄 Create action - Received form data:', form.data);

    // Use the helper function to parse emergency contact
    const parsedEmergencyContact = parseEmergencyContactFromForm(form.data);
    console.log('🔍 Create - Parsed emergency contact:', parsedEmergencyContact);

    // Check for duplicate email if provided (excluding soft-deleted tenants)
    console.log('🔍 Email check - form.data.email:', form.data.email);
    console.log('🔍 Email check - typeof:', typeof form.data.email);
    console.log('🔍 Email check - length:', form.data.email?.length);
    console.log('🔍 Email check - trimmed:', form.data.email?.trim());
    
    if (form.data.email && form.data.email.trim() !== '') {
      console.log('🔍 Email check - Checking for duplicates with email:', form.data.email);
      
      const existingTenant = await supabase
        .from('tenants')
        .select('id')
        .eq('email', form.data.email.trim())
        .is('deleted_at', null)
        .single();

      console.log('🔍 Email check - Query result:', existingTenant);
      
      if (existingTenant.data) {
        console.log('🔍 Email check - Duplicate found!');
        form.errors.email = ['A tenant with this email already exists'];
        return fail(400, { form, message: 'Duplicate email found: A tenant with this email already exists' });
      }
    } else {
      console.log('🔍 Email check - Skipping duplicate check (empty or null email)');
    }

    const insertData: TenantInsert = {
      name: form.data.name,
      contact_number: form.data.contact_number || null,
      email: form.data.email && form.data.email.trim() !== '' ? form.data.email : null,
      tenant_status: form.data.tenant_status || 'PENDING',
      emergency_contact: parsedEmergencyContact,
      profile_picture_url: form.data.profile_picture_url || null
    };

    console.log('🔄 Create action - Sending to database:', insertData);

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

    console.log('✅ Create action - Successfully created tenant');
    return { form };
  },

  update: async ({ request, locals: { supabase } }: RequestEvent) => {
    const form = await superValidate(request, zod(tenantFormSchema));
    if (!form.valid) {
      console.error('Form validation failed:', form.errors);
      return fail(400, { form });
    }

    console.log('🔄 Update action - Received form data:', form.data);

    // Use the helper function to parse emergency contact
    const parsedEmergencyContact = parseEmergencyContactFromForm(form.data);
    console.log('🔍 Update - Parsed emergency contact:', parsedEmergencyContact);

    // Check for duplicate email, excluding current tenant and soft-deleted tenants
    console.log('🔍 Update Email check - form.data.email:', form.data.email);
    console.log('🔍 Update Email check - form.data.id:', form.data.id);
    
    if (form.data.email && form.data.email.trim() !== '') {
      console.log('🔍 Update Email check - Checking for duplicates with email:', form.data.email);
      
      const existingTenant = await supabase
        .from('tenants')
        .select('id')
        .eq('email', form.data.email.trim())
        .neq('id', form.data.id)
        .is('deleted_at', null)
        .single();

      console.log('🔍 Update Email check - Query result:', existingTenant);
      
      if (existingTenant.data) {
        console.error('Duplicate email found:', form.data.email);
        form.errors.email = ['A tenant with this email already exists'];
        return fail(400, { form, message: 'Duplicate email found: A tenant with this email already exists' });
      }
    } else {
      console.log('🔍 Update Email check - Skipping duplicate check (empty or null email)');
    }

    const updateData: TenantUpdate = {
      name: form.data.name,
      contact_number: form.data.contact_number || null,
      email: form.data.email && form.data.email.trim() !== '' ? form.data.email : null,
      tenant_status: form.data.tenant_status,
      emergency_contact: parsedEmergencyContact,
      updated_at: new Date().toISOString(),
      profile_picture_url: form.data.profile_picture_url || null
    };

    console.log('🔄 Update action - Sending to database:', updateData);

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

    console.log('✅ Update action - Successfully updated tenant');
    return { form };
  },

  delete: async ({ request, locals: { supabase } }: RequestEvent) => {
    const formData = await request.formData();
    const id = formData.get('id');
    const reason = formData.get('reason') || 'User initiated deletion';

    if (!id || typeof id !== 'string') {
      return fail(400, { message: 'Invalid tenant ID' });
    }

    const tenantId = parseInt(id, 10);
    if (isNaN(tenantId)) {
      return fail(400, { message: 'Invalid tenant ID format' });
    }

    // Get tenant details for confirmation message
    const { data: tenant, error: fetchError } = await supabase
      .from('tenants')
      .select('name, email, contact_number')
      .eq('id', tenantId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !tenant) {
      return fail(404, { message: 'Tenant not found or already deleted' });
    }

    // Soft delete by setting deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('tenants')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    if (deleteError) {
      console.error('Error soft deleting tenant:', deleteError);
      if (deleteError.message?.includes('Policy check failed')) {
        return fail(403, { message: 'You do not have permission to delete tenants' });
      }
      return fail(500, { message: 'Failed to delete tenant' });
    }

    return { 
      success: true, 
      message: `Tenant "${tenant.name}" has been successfully archived. All data has been preserved for audit purposes.`
    };
  }
};