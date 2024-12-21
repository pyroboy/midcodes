import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { supabase } from '$lib/supabaseClient';
import { propertySchema, type PropertyWithCounts, preparePropertyData } from './formSchema';

export const load = async () => {
  // Get properties with floor and room counts
  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      *,
      floors:floors(count),
      rooms:rooms(count)
    `)
    .order('name');

  if (error) {
    console.error('Error loading properties:', error);
    return {
      form: await superValidate(zod(propertySchema)),
      properties: []
    };
  }

  // Transform the data to include counts
  const propertiesWithCounts: PropertyWithCounts[] = properties.map(property => ({
    ...property,
    floor_count: property.floors?.[0]?.count ?? 0,
    room_count: property.rooms?.[0]?.count ?? 0
  }));

  const form = await superValidate(zod(propertySchema));

  return {
    form,
    properties: propertiesWithCounts
  };
};

export const actions = {
  create: async ({ request }) => {
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

  update: async ({ request }) => {
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

  delete: async ({ request }) => {
    const form = await superValidate(request, zod(propertySchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    // Check for existing floors/rooms
    const { data: floors } = await supabase
      .from('floors')
      .select('id')
      .eq('property_id', form.data.id)
      .limit(1);

    if (floors && floors.length > 0) {
      return fail(400, {
        form,
        error: 'Cannot delete property with existing floors/rooms. Please delete them first.'
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
