import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import type {  PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { propertySchema, preparePropertyData } from './formSchema';

export const load: PageServerLoad = async ({ locals }) => {
  const { permissions } = await locals.safeGetSession();
  const hasAccess: boolean = permissions.includes('properties.create');
  if (!hasAccess) {
    throw error(401, 'Unauthorized');
  }
  const protertiesResult = await locals.supabase
    .from('properties')
    .select('*')
    .order('name');
  
  if (protertiesResult.error) {
    console.error('Error loading properties:', protertiesResult.error);
    return {
      form: await superValidate(zod(propertySchema)),
      properties: []
    };
  }
  const form = await superValidate(zod(propertySchema));
  return {
    form,
    properties: protertiesResult.data ?? []
  };
  // Returns { form, properties } which become available in $page.data
};
export const actions = {
  
  create: async ({ request, locals: { supabase } }) => {
    const form = await superValidate(request, zod(propertySchema));

    if (!form.valid) {return fail(400, { form });}

    // remove id, created_at, updated_at
    const { id, created_at, updated_at, ...propertyData } = form.data;
    const { error } = await supabase
      .from('properties')
      .insert(propertyData);

    if (error) {
      if (error.message?.includes('Policy check failed')) {
        return fail(403, { form, message: 'You do not have permission to create properties' });
      }
      return fail(500, {  form,  message: 'Failed to create property'  });
    }

    return { form };
  },
  update: async ({ request, locals: { supabase } }: RequestEvent) => {

    const form = await superValidate(request, zod(propertySchema));

    if (!form.valid) {return fail(400, { form }); }

    const propertyData = preparePropertyData(form.data);

    const { error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', form.data.id);

    if (error) {
      console.error('Error updating property:', error);
      return fail(500, { 
        form, 
        error: 'Failed to update property' 
      });
    }

    return { form };
  },

  delete: async ({ request, locals: { supabase } }: RequestEvent) => {
    const data = await request.formData();
    const id = data.get('id');

    if (!id) {
      return fail(400, { 
        form: null,
        error: 'Property ID is required' 
      });
    }

    try {
        const { error: deleteError } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Delete error details:', {
                message: deleteError.message,
                code: deleteError.code,
                details: deleteError.details,
                hint: deleteError.hint
            });
            throw deleteError;
        }

        return { success: true };

    } catch (error: any) {
        console.error('Delete error full details:', error);
        
        // Handle specific PostgreSQL error codes
        switch (error?.code) {
            case '23503':  // foreign key violation
                return fail(400, {
                    error: 'Cannot delete property because it has units or leases attached to it'
                });
            case '42501':  // permission denied
                return fail(403, {
                    error: 'You do not have permission to delete this property'
                });
            default:
                return fail(500, {
                    error: error.message || 'Failed to delete property'
                });
        }
    }
  }
};