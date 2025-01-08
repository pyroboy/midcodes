import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { checkAccess } from '$lib/utils/roleChecks';
import { rental_unitSchema } from './formSchema';

interface DatabaseFloor {
  id: number;
  property_id: number;
  floor_number: number;
  wing?: string;
}

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  const {  user, profile } = await safeGetSession();

  const hasAccess = checkAccess(profile?.role, 'admin');
  if (!hasAccess) {
    throw redirect(302, '/unauthorized');
  }

  console.log('[DEBUG] Loading initial data for rental_unit page');
  const [rental_unitResponse, propertiesResponse, floorsResponse] = await Promise.all([
    supabase
      .from('rental_unit')
      .select(`
        *,
        property:properties(name),
        floor:floors(floor_number, wing)
      `)
      .order('property_id, floor_id, number'),
    
    supabase
      .from('properties')
      .select('id, name')
      .order('name'),

    supabase
      .from('floors')
      .select(`
        id,
        property_id,
        floor_number,
        wing,
        property:properties!inner(id, name)
      `)
      .order('property_id, floor_number')
  ]);

  console.log('[DEBUG] Floors data loaded:', floorsResponse.data);
  console.log('[DEBUG] Properties data loaded:', propertiesResponse.data);

  const { data: rental_unit, error: rental_unitError } = rental_unitResponse;
  const { data: properties, error: propertiesError } = propertiesResponse;
  const { data: floors, error: floorsError } = floorsResponse;

  if (rental_unitError) throw fail(403, { message: rental_unitError.message });
  if (propertiesError) throw fail(403, { message: propertiesError.message });
  if (floorsError) throw fail(403, { message: floorsError.message });

  const form = await superValidate(zod(rental_unitSchema));

  return {
    rental_unit,
    properties,
    floors: floors as DatabaseFloor[],
    form,
    user
  };
}

export const actions: Actions = {
  create: async ({ request, locals: { supabase } }: RequestEvent) => {
    console.log('[DEBUG] Create rental_unit action triggered');
    const form = await superValidate(request, zod(rental_unitSchema));
    console.log('[DEBUG] Form data received:', form.data);
    console.log('[DEBUG] Form validation status:', form.valid);
    
    if (!form.valid) {
      console.error('[DEBUG] Form validation failed:', form.errors);
      return fail(400, {
        form,
        message: 'Please check the form for errors',
        errors: form.errors
      });
    }

    if (!form.data.property_id || !form.data.floor_id) {
      console.error('[DEBUG] Missing required fields:', {
        property_id: form.data.property_id,
        floor_id: form.data.floor_id
      });
      console.log('[DEBUG] Current form data:', form.data);
      return fail(400, {
        form,
        message: 'Property and Floor selection are required',
        errors: {
          property_id: !form.data.property_id ? 'Property is required' : undefined,
          floor_id: !form.data.floor_id ? 'Floor is required' : undefined
        }
      });
    }

    const existingRental_UnitResponse = await supabase
      .from('rental_unit')
      .select('id')
      .eq('floor_id', form.data.floor_id)
      .eq('number', form.data.number)
      .single();

    if (existingRental_UnitResponse.data) {
      return fail(400, {
        form,
        message: 'Rental_unit number already exists on this floor'
      });
    }

    const insertResponse = await supabase
      .from('rental_unit')
      .insert({
        property_id: form.data.property_id,
        floor_id: form.data.floor_id,
        name: form.data.name,
        number: form.data.number,
        rental_unit_status: form.data.rental_unit_status,
        capacity: form.data.capacity,
        base_rate: form.data.base_rate,
        type: form.data.type,
        amenities: form.data.amenities
      })
      .select();

    if (insertResponse.error) {
      if (insertResponse.error.code === '23505') {
        return fail(400, {
          form,
          message: 'Rental_unit number already exists on this floor'
        });
      }

      if (insertResponse.error.code === '23502') {
        return fail(400, {
          form,
          message: 'Required fields are missing'
        });
      }

      return fail(500, { 
        form,
        message: insertResponse.error.message || 'Failed to create rental_unit'
      });
    }

    const newForm = await superValidate(zod(rental_unitSchema));
    return { 
      form: newForm,
      message: 'Rental_unit created successfully'
    };
  },

  update: async ({ request, locals: { supabase } }: RequestEvent) => {
    const form = await superValidate(request, zod(rental_unitSchema));
    
    if (!form.valid || !form.data.id) {
      return fail(400, { 
        form,
        message: 'Please check the form for errors'
      });
    }

    if (!form.data.property_id || !form.data.floor_id) {
      return fail(400, {
        form,
        message: 'Property and Floor selection are required'
      });
    }

    const existingRental_UnitResponse = await supabase
      .from('rental_unit')
      .select('id')
      .eq('floor_id', form.data.floor_id)
      .eq('number', form.data.number)
      .neq('id', form.data.id)
      .single();

    if (existingRental_UnitResponse.data) {
      return fail(400, {
        form,
        message: 'Rental_unit number already exists on this floor'
      });
    }

    const updateResponse = await supabase
      .from('rental_unit')
      .update({
        property_id: form.data.property_id,
        floor_id: form.data.floor_id,
        name: form.data.name,
        number: form.data.number,
        rental_unit_status: form.data.rental_unit_status,
        capacity: form.data.capacity,
        base_rate: form.data.base_rate,
        type: form.data.type,
        amenities: form.data.amenities
      })
      .eq('id', form.data.id)
      .select();

    if (updateResponse.error) {
      if (updateResponse.error.code === '23505') {
        return fail(400, {
          form,
          message: 'Rental_unit number already exists on this floor'
        });
      }

      if (updateResponse.error.code === '23502') {
        return fail(400, {
          form,
          message: 'Required fields are missing'
        });
      }

      return fail(updateResponse.error.code === '42501' ? 403 : 500, { 
        form,
        message: updateResponse.error.message || 'Failed to update rental_unit'
      });
    }

    return { 
      form,
      message: 'Rental_unit updated successfully'
    };
  },

  delete: async ({ request, locals: { supabase } }: RequestEvent) => {
    const formData = await request.formData();
    const id = formData.get('id');
    
    if (!id) {
      return fail(400, {
        message: 'Rental_unit ID is required'
      });
    }

    const rental_unitId = parseInt(id.toString(), 10);
    if (isNaN(rental_unitId)) {
      return fail(400, {
        message: 'Invalid rental_unit ID'
      });
    }

    const deleteResponse = await supabase
      .from('rental_unit')
      .delete()
      .eq('id', rental_unitId);

    if (deleteResponse.error) {
      console.error('Delete error:', deleteResponse.error);
      return fail(deleteResponse.error.code === '42501' ? 403 : 500, {
        message: deleteResponse.error.message || 'Failed to delete rental_unit'
      });
    }

    return {
      message: 'Rental_unit deleted successfully'
    };
  }
};