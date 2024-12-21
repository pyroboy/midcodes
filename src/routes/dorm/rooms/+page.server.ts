import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { roomSchema } from './formSchema';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
  const [{ data: rooms }, { data: properties }, { data: floors }] = await Promise.all([
    supabase
      .from('rooms')
      .select(`
        *,
        property:properties(name),
        floor:floors(floor_number, wing)
      `)
      .order('property_id, floor_id, room_number'),
    
    supabase
      .from('properties')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name'),

    supabase
      .from('floors')
      .select('id, property_id, floor_number, wing')
      .eq('status', 'ACTIVE')
      .order('property_id, floor_number')
  ]);

  const form = await superValidate(zod(roomSchema));

  return {
    form,
    rooms,
    properties,
    floors,
    user: locals.user
  };
};

export const actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, zod(roomSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .insert({
          property_id: form.data.property_id,
          floor_id: form.data.floor_id,
          room_number: form.data.room_number,
          room_status: form.data.room_status,
          capacity: form.data.capacity,
          rate: form.data.rate,
          description: form.data.description,
          amenities: form.data.amenities
        });

      if (error) throw error;
      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  update: async ({ request }) => {
    const form = await superValidate(request, zod(roomSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          property_id: form.data.property_id,
          floor_id: form.data.floor_id,
          room_number: form.data.room_number,
          room_status: form.data.room_status,
          capacity: form.data.capacity,
          rate: form.data.rate,
          description: form.data.description,
          amenities: form.data.amenities
        })
        .eq('id', form.data.id);

      if (error) throw error;
      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  delete: async ({ request }) => {
    const form = await superValidate(request, zod(roomSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', form.data.id);

      if (error) throw error;
      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  }
};