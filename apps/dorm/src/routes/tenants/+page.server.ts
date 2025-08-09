import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import {
	tenantFormSchema,
	tenantResponseSchema,
	type EmergencyContact,
	parseEmergencyContactFromForm
} from './formSchema';
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
		.select(
			`
      *,
      lease_tenants:lease_tenants!left(
        lease:leases!left(
          id,
          name,
          start_date,
          end_date,
          status,
          rental_unit:rental_unit_id(
            id,
            name,
            number,
            base_rate,
            property:properties!rental_unit_property_id_fkey(id, name)
          )
        )
      )
    `
		)
		.is('deleted_at', null) // Only load non-deleted tenants
		.order('name');

	if (tenantsResult.error) {
		console.error('Error loading tenants:', tenantsResult.error);
		throw error(500, 'Failed to load tenants');
	}

	// Process all leases for each tenant (not just the first one)
	const tenants = tenantsResult.data.map((tenant: any) => {
		// Extract all leases for this tenant
		const leases = tenant.lease_tenants
			?.map((lt: any) => lt.lease)
			.filter((lease: any) => lease !== null)
			.map((lease: any) => ({
				id: lease.id,
				name: lease.name,
				start_date: lease.start_date,
				end_date: lease.end_date,
				status: lease.status,
				rental_unit: lease.rental_unit ? {
					id: lease.rental_unit.id,
					name: lease.rental_unit.name,
					number: lease.rental_unit.number,
					property: lease.rental_unit.property
				} : null
			})) || [];
		
		// For backward compatibility, set the primary lease (first active lease or first lease)
		const primaryLease = leases.find((l: any) => l.status === 'ACTIVE') || leases[0] || null;
		
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { lease_tenants, ...rest } = tenant;
		return { 
			...rest, 
			leases,
			lease: primaryLease // backward compatibility
		};
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
				return fail(400, {
					form,
					message: 'Duplicate email found: A tenant with this email already exists'
				});
			}
		} else {
			console.log('🔍 Email check - Skipping duplicate check (empty or null email)');
		}

		// Safeguard: prevent exact-name duplicates without distinct contact details (case-insensitive)
		const normalizedName = form.data.name.trim();
		const normalizedEmail = form.data.email?.trim().toLowerCase() || null;
		const normalizedContact = form.data.contact_number?.trim() || null;

		const possibleDuplicates = await supabase
			.from('tenants')
			.select('id, name, email, contact_number')
			.ilike('name', normalizedName)
			.is('deleted_at', null);

		if (possibleDuplicates.data && possibleDuplicates.data.length > 0) {
			const conflict = possibleDuplicates.data.find((t) => {
				const tEmail = (t.email || '').trim().toLowerCase() || null;
				const tContact = (t.contact_number || '').trim() || null;
				const sameEmail = normalizedEmail && tEmail ? normalizedEmail === tEmail : !normalizedEmail && !tEmail;
				const sameContact = normalizedContact && tContact ? normalizedContact === tContact : !normalizedContact && !tContact;
				// Duplicate if name matches and there is no distinguishing contact detail
				return sameEmail || sameContact;
			});

			if (conflict) {
				form.errors.name = ['A tenant with this name already exists without distinct contact details'];
				return fail(400, { form, message: 'Duplicate tenant: provide distinct email or contact number' });
			}
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

		const { error: insertError } = await supabase.from('tenants').insert(insertData);

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
				return fail(400, {
					form,
					message: 'Duplicate email found: A tenant with this email already exists'
				});
			}
		} else {
			console.log('🔍 Update Email check - Skipping duplicate check (empty or null email)');
		}

		// Safeguard: prevent exact-name duplicates without distinct contact details (exclude self, case-insensitive)
		const normalizedNameU = form.data.name.trim();
		const normalizedEmailU = form.data.email?.trim().toLowerCase() || null;
		const normalizedContactU = form.data.contact_number?.trim() || null;

		const possibleDuplicatesU = await supabase
			.from('tenants')
			.select('id, name, email, contact_number')
			.ilike('name', normalizedNameU)
			.neq('id', form.data.id)
			.is('deleted_at', null);

		if (possibleDuplicatesU.data && possibleDuplicatesU.data.length > 0) {
			const conflict = possibleDuplicatesU.data.find((t) => {
				const tEmail = (t.email || '').trim().toLowerCase() || null;
				const tContact = (t.contact_number || '').trim() || null;
				const sameEmail = normalizedEmailU && tEmail ? normalizedEmailU === tEmail : !normalizedEmailU && !tEmail;
				const sameContact = normalizedContactU && tContact ? normalizedContactU === tContact : !normalizedContactU && !tContact;
				return sameEmail || sameContact;
			});

			if (conflict) {
				form.errors.name = ['A tenant with this name already exists without distinct contact details'];
				return fail(400, { form, message: 'Duplicate tenant: provide distinct email or contact number' });
			}
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
