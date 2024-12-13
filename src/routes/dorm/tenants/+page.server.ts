// src/routes/tenants/+page.server.ts

import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { tenantSchema } from './schema';

export const load: PageServerLoad = async ({ locals }) => {
    const { supabase } = locals;
    const form = await superValidate(zod(tenantSchema));

    // Get tenants with their lease information
    const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
            *,
            lease_tenants (
                *,
                lease:leases (
                    *,
                    room:rooms (*)
                )
            )
        `);

    if (tenantsError) {
        throw error(500, 'Error fetching tenants');
    }

    // Get all rooms for the form
    const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*');

    if (roomsError) {
        throw error(500, 'Error fetching rooms');
    }

    // Get all leases for the form
    const { data: leases, error: leasesError } = await supabase
        .from('leases')
        .select(`
            *,
            room:rooms (*),
            lease_tenants (
                tenant:tenants (*)
            )
        `)
        .order('start_date', { ascending: false });

    if (leasesError) {
        throw error(500, 'Error fetching leases');
    }

    return { form, tenants, rooms, leases };
};

export const actions: Actions = {
    create: async ({ request, locals }) => {
        const form = await superValidate(request, zod(tenantSchema));
        if (!form.valid) return fail(400, { form });

        const { supabase } = locals;

        try {
            const { data: tenant, error: insertError } = await supabase
                .from('tenants')
                .insert({
                    name: form.data.name,
                    contact_number: form.data.contact_number,
                    email: form.data.email
                })
                .select()
                .single();

            if (insertError) throw insertError;

            return { form };
        } catch (err) {
            console.error(err);
            return fail(500, { 
                form, 
                error: err instanceof Error ? err.message : 'Failed to add tenant' 
            });
        }
    },

    update: async ({ request, locals }) => {
        const form = await superValidate(request, zod(tenantSchema));
        if (!form.valid) return fail(400, { form });

        const { supabase } = locals;

        try {
            const { error: updateError } = await supabase
                .from('tenants')
                .update({
                    name: form.data.name,
                    contact_number: form.data.contact_number,
                    email: form.data.email
                })
                .eq('id', form.data.id);

            if (updateError) throw updateError;

            return { form };
        } catch (err) {
            console.error(err);
            return fail(500, { 
                form, 
                error: err instanceof Error ? err.message : 'Failed to update tenant' 
            });
        }
    },

    delete: async ({ request, locals }) => {
        const form = await superValidate(request, zod(tenantSchema));
        if (!form.valid) return fail(400, { form });

        const { supabase } = locals;

        try {
            // First delete all lease_tenant relationships
            const { error: deleteLeaseTenantsError } = await supabase
                .from('lease_tenants')
                .delete()
                .eq('tenant_id', form.data.id);

            if (deleteLeaseTenantsError) throw deleteLeaseTenantsError;

            // Then delete the tenant
            const { error: deleteTenantError } = await supabase
                .from('tenants')
                .delete()
                .eq('id', form.data.id);

            if (deleteTenantError) throw deleteTenantError;

            return { form };
        } catch (err) {
            console.error(err);
            return fail(500, { 
                form, 
                error: err instanceof Error ? err.message : 'Failed to delete tenant' 
            });
        }
    }
};
