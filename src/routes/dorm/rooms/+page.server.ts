import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { roomSchema } from './formSchema';
import { supabase } from '$lib/supabaseClient';

export const load = async ({ locals }) => {
  const [{ data: rooms, error: roomsError }, { data: properties, error: propertiesError }, { data: floors, error: floorsError }] = await Promise.all([
    supabase
      .from('rooms')
      .select(`
        *,
        property:properties(name),
        floor:floors(floor_number, wing)
      `)
      .order('property_id, floor_id, number'),
    
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

  // Handle any RLS or other database errors
  if (roomsError) throw fail(403, { message: roomsError.message });
  if (propertiesError) throw fail(403, { message: propertiesError.message });
  if (floorsError) throw fail(403, { message: floorsError.message });

  const form = await superValidate(zod(roomSchema));

  return {
    rooms,
    properties,
    floors,
    form,
    user: locals?.user
  };
};

export const actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, zod(roomSchema));
    
    if (!form.valid) {
      return fail(400, { form });
    }

    // Check if room number already exists in the same floor
    const { data: existingRoom } = await supabase
      .from('rooms')
      .select('id')
      .eq('floor_id', form.data.floor_id)
      .eq('number', form.data.number)
      .single();

    if (existingRoom) {
      return fail(400, {
        form,
        error: 'Room number already exists on this floor'
      });
    }

    const { error } = await supabase
      .from('rooms')
      .insert({
        property_id: form.data.property_id,
        floor_id: form.data.floor_id,
        name: form.data.name,
        number: form.data.number,
        room_status: form.data.room_status,
        capacity: form.data.capacity,
        base_rate: form.data.base_rate,
        type: form.data.type,
        amenities: form.data.amenities
      });

    if (error) {
      return fail(error.code === '42501' ? 403 : 500, { 
        form,
        error: error.message || 'Failed to create room'
      });
    }

    return { form };
  },

  update: async ({ request }) => {
    const form = await superValidate(request, zod(roomSchema));
    
    if (!form.valid || !form.data.id) {
      return fail(400, { form });
    }

    // Check if room number already exists in the same floor (excluding current room)
    const { data: existingRoom } = await supabase
      .from('rooms')
      .select('id')
      .eq('floor_id', form.data.floor_id)
      .eq('number', form.data.number)
      .neq('id', form.data.id)
      .single();

    if (existingRoom) {
      return fail(400, {
        form,
        error: 'Room number already exists on this floor'
      });
    }

    const { error } = await supabase
      .from('rooms')
      .update({
        property_id: form.data.property_id,
        floor_id: form.data.floor_id,
        name: form.data.name,
        number: form.data.number,
        room_status: form.data.room_status,
        capacity: form.data.capacity,
        base_rate: form.data.base_rate,
        type: form.data.type,
        amenities: form.data.amenities
      })
      .eq('id', form.data.id);

    if (error) {
      return fail(error.code === '42501' ? 403 : 500, { 
        form,
        error: error.message || 'Failed to update room'
      });
    }

    return { form };
  },

  delete: async ({ request }) => {
    const form = await superValidate(request, zod(roomSchema));
    
    if (!form.valid || !form.data.id) {
      return fail(400, { form });
    }

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', form.data.id);

    if (error) {
      return fail(error.code === '42501' ? 403 : 500, { 
        form,
        error: error.message || 'Failed to delete room'
      });
    }

    return { form };
  }
};