import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { propertySchema, type PropertyData, preparePropertyData } from './formSchema';

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

    
    const form = await superValidate(request, zod(propertySchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    // Check for existing floors/rental_unit
    const { data: floors } = await supabase
      .from('floors')
      .select('id')
      .eq('property_id', form.data.id)
      .limit(1);

    if (floors && floors.length > 0) {
      return fail(400, {
        form,
        error: 'Cannot delete property with existing floors/rental_unit. Please delete them first.'
      });
    }

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', form.data.id);

    if (error) {
      console.error('Error deleting property:', error);
      return fail(500, { 
        form, 
        error: 'Failed to delete property' 
      });
    }

    return { form };
  }
};
