import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { checkAccess } from '$lib/utils/roleChecks';
import { propertySchema, type PropertyData, preparePropertyData } from './formSchema';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  const {  user, profile } = await safeGetSession();

  const hasAccess = checkAccess(profile?.role, 'admin');
  if (!hasAccess) {
    throw redirect(302, '/unauthorized');
  }

  console.log('Starting properties load function');
  
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .order('name');
  
  console.log('Raw properties data:', properties);
  console.log('Query error if any:', error);

  if (error) {
    console.error('Error loading properties:', error);
    return {
      form: await superValidate(zod(propertySchema)),
      properties: []
    };
  }

  const form = await superValidate(zod(propertySchema));

  return {
    form,
    properties: properties ?? []
  };
};

export const actions = {
  create: async ({ request, locals: { supabase } }: RequestEvent) => {
    const form = await superValidate(request, zod(propertySchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const propertyData = preparePropertyData(form.data);

    const { error } = await supabase
      .from('properties')
      .insert(propertyData);

    if (error) {
      console.error('Error creating property:', error);
      return fail(500, { 
        form, 
        error: 'Failed to create property' 
      });
    }

    return { form };
  },
  update: async ({ request, locals: { supabase } }: RequestEvent) => {
    const form = await superValidate(request, zod(propertySchema));

    if (!form.valid) {
      return fail(400, { form });
    }

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
