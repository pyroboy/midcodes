import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { floorSchema } from './formSchema';
import type { Actions, PageServerLoad, RequestEvent } from './$types';
import type {  FloorWithProperty, Property } from './formSchema';

export const load: PageServerLoad = async ({ locals }) => {
  // console.log('🔄 Starting server-side load function for floors');

  const { user, permissions } = await locals.safeGetSession();
  const hasAccess = permissions.includes('properties.create');

  if (!hasAccess) {
    throw error(401, 'Unauthorized');
  }


  try {
    const [floorsResult, propertiesResult] = await Promise.all([
      locals.supabase
        .from('floors')
        .select(`
          id,
          property_id,
          floor_number,
          wing,
          status,
          created_at,
          updated_at,
          property:properties!floors_property_id_fkey(
            id,
            name
          )
        `)
        .order('property_id, floor_number') ,
      
      locals.supabase
        .from('properties')
        .select('id, name')
        .eq('status', 'ACTIVE')
        .order('name')
    ]);



    if (floorsResult.error) {
      console.error('Error loading floors:', floorsResult.error);
      throw error(500, 'Failed to load floors');
    }

    if (propertiesResult.error) {
      console.error('Error loading properties:', propertiesResult.error);
      throw error(500, 'Failed to load properties');
    }


    const form = await superValidate(zod(floorSchema));

    return {
      form,
      floors: floorsResult.data as unknown as FloorWithProperty[],
      properties: propertiesResult.data as Property[]
    };
  } catch (err) {
    console.error('Unexpected error in load function:', err);
    throw error(500, 'An unexpected error occurred while loading data');
  }
};


// Declare - Actions


export const actions: Actions = {
  create: async ({ request, locals: { supabase } }: RequestEvent) => {
    const form = await superValidate(request, zod(floorSchema));

    if (!form.valid) {
      console.error('Form validation failed:', form.errors);
      return fail(400, { form });
    }

    // Check for duplicate floor number in the same property
    const { data: existingFloor, error: checkError } = await supabase
      .from('floors')
      .select('id')
      .eq('property_id', form.data.property_id)
      .eq('floor_number', form.data.floor_number)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking for duplicate floor:', checkError);
      return fail(500, {
        form,
        error: 'Failed to check for duplicate floor'
      });
    }

    if (existingFloor) {
      console.log('❌ Duplicate floor number detected');
      form.errors.floor_number = ['This floor number already exists for this property'];
      return fail(400, { form });
    }

    console.log('Creating floor with data:', form.data);

    const { error: insertError } = await supabase
      .from('floors')
      .insert({
        property_id: form.data.property_id,
        floor_number: form.data.floor_number,
        wing: form.data.wing || null,
        status: form.data.status || 'ACTIVE'
      });

    if (insertError) {
      console.error('❌ Error creating floor:', insertError);
      return fail(500, { form });
    }

    return { form };
  },

  update: async ({ request, locals: { supabase } }: RequestEvent) => {
    const form = await superValidate(request, zod(floorSchema));

    if (!form.valid) {
      console.error('Form validation failed:', form.errors);
      return fail(400, { form });
    }

    // Check for duplicate floor number in the same property (excluding current floor)
    const { data: existingFloor, error: checkError } = await supabase
      .from('floors')
      .select('id')
      .eq('property_id', form.data.property_id)
      .eq('floor_number', form.data.floor_number)
      .neq('id', form.data.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking for duplicate floor:', checkError);
      return fail(500, {
        form,
        error: 'Failed to check for duplicate floor'
      });
    }

    if (existingFloor) {
      console.log('❌ Duplicate floor number detected');
      form.errors.floor_number = ['This floor number already exists for this property'];
      return fail(400, { form });
    }

    console.log('Updating floor with data:', form.data);

    const { error: updateError } = await supabase
      .from('floors')
      .update({
        property_id: form.data.property_id,
        floor_number: form.data.floor_number,
        wing: form.data.wing || null,
        status: form.data.status || 'ACTIVE'
      })
      .eq('id', form.data.id);

    if (updateError) {
      console.error('❌ Error updating floor:', updateError);
      return fail(500, { form });
    }

    return { form };
  },

  delete: async ({ request, locals: { supabase } }: RequestEvent) => {
    const data = await request.formData();
    const id = data.get('id');

    if (!id) {
      return fail(400, { message: 'No floor ID provided' });
    }

    const { error: deleteError } = await supabase
      .from('floors')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error deleting floor:', deleteError);
      return fail(500, { message: 'Failed to delete floor' });
    }

    return { success: true };
  }
};