import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { rental_unitSchema } from './formSchema';
import type { Database } from '$lib/database.types';

type DBRentalUnit = Database['public']['Tables']['rental_unit']['Row'];
type DBProperty = Database['public']['Tables']['properties']['Row'];
type DBFloor = Database['public']['Tables']['floors']['Row'];

export type RentalUnitResponse = DBRentalUnit & {
  property: Pick<DBProperty, 'id' | 'name'> | null;
  floor: Pick<DBFloor, 'id' | 'floor_number' | 'wing'> | null;
};
export const load: PageServerLoad = async ({ locals }) => {
  console.log('🔄 Starting server-side load function for rental units');
  
  const { user, permissions } = await locals.safeGetSession();
  const hasAccess = permissions.includes('properties.create');
  
  if (!hasAccess) {
    throw error(401, 'Unauthorized');
  }

  console.log('📊 Initiating database queries');
  const startTime = performance.now();

  const [rentalUnitsResult, propertiesResult, floorsResult] = await Promise.all([
    locals.supabase
      .from('rental_unit')
      .select(`
        *,
        property:properties(id, name),
        floor:floors(id, floor_number, wing)
      `)
      .order('property_id, floor_id, number'),
    
    locals.supabase
      .from('properties')
      .select('id, name')
      .order('name'),
    
    locals.supabase
      .from('floors')
      .select('id, property_id, floor_number, wing')
      .order('property_id, floor_number')
  ]);

  const queryTime = performance.now() - startTime;
  console.log('🏢 Database queries completed:', {
    rentalUnitsCount: rentalUnitsResult.data?.length || 0,
    propertiesCount: propertiesResult.data?.length || 0,
    floorsCount: floorsResult.data?.length || 0,
    queryExecutionTime: `${queryTime.toFixed(2)}ms`
  });

  if (rentalUnitsResult.error) {
    console.error('Error loading rental units:', rentalUnitsResult.error);
    throw error(500, 'Failed to load rental units');
  }

  const rentalUnits = (rentalUnitsResult.data as RentalUnitResponse[] || []).map(unit => ({
    ...unit,
    property: unit.property || { id: unit.property_id, name: 'Unknown Property' },
    floor: unit.floor || { id: unit.floor_id, floor_number: 0, wing: null }
  }));

  const form = await superValidate(zod(rental_unitSchema));

  return {
    form,
    rentalUnits,
    properties: propertiesResult.data || [],
    floors: floorsResult.data || []
  };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase } }: RequestEvent) => {
    console.log('➕ Starting rental unit creation process');
    const form = await superValidate(request, zod(rental_unitSchema));

    if (!form.valid) {
      console.error('Form validation failed:', form.errors);
      return fail(400, { form });
    }

    // Check for duplicate rental unit number
    const existingUnit = await supabase
      .from('rental_unit')
      .select('id')
      .eq('floor_id', form.data.floor_id)
      .eq('number', form.data.number)
      .single();

    if (existingUnit.data) {
      return fail(400, {
        form,
        message: 'A rental unit with this number already exists on this floor'
      });
    }

    const { error: insertError } = await supabase
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
      } satisfies Database['public']['Tables']['rental_unit']['Insert']);

    if (insertError) {
      console.error('Error creating rental unit:', insertError);
      if (insertError.message?.includes('Policy check failed')) {
        return fail(403, { form, message: 'You do not have permission to create rental units' });
      }
      return fail(500, { form, message: 'Failed to create rental unit' });
    }

    return { form };
  },

  update: async ({ request, locals: { supabase } }: RequestEvent) => {
    const form = await superValidate(request, zod(rental_unitSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    // Check for duplicate rental unit number, excluding current unit
    const existingUnit = await supabase
      .from('rental_unit')
      .select('id')
      .eq('floor_id', form.data.floor_id)
      .eq('number', form.data.number)
      .neq('id', form.data.id)
      .single();

    if (existingUnit.data) {
      return fail(400, {
        form,
        message: 'A rental unit with this number already exists on this floor'
      });
    }

    const { error: updateError } = await supabase
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
        amenities: form.data.amenities,
        updated_at: new Date().toISOString()
      } satisfies Database['public']['Tables']['rental_unit']['Update'])
      .eq('id', form.data.id);

    if (updateError) {
      console.error('Error updating rental unit:', updateError);
      if (updateError.message?.includes('Policy check failed')) {
        return fail(403, { form, message: 'You do not have permission to update rental units' });
      }
      return fail(500, { form, message: 'Failed to update rental unit' });
    }

    return { form };
  },

  delete: async ({ request, locals: { supabase } }: RequestEvent) => {
    const formData = await request.formData();
    const id = formData.get('id');

    if (!id || typeof id !== 'string') {
      return fail(400, { message: 'Invalid rental unit ID' });
    }

    const rentalUnitId = parseInt(id, 10);
    if (isNaN(rentalUnitId)) {
      return fail(400, { message: 'Invalid rental unit ID format' });
    }

    const { error: deleteError } = await supabase
      .from('rental_unit')
      .delete()
      .eq('id', rentalUnitId);

    if (deleteError) {
      console.error('Error deleting rental unit:', deleteError);
      if (deleteError.message?.includes('Policy check failed')) {
        return fail(403, { message: 'You do not have permission to delete rental units' });
      }
      if (deleteError.code === '23503') {
        return fail(400, { message: 'Cannot delete rental unit because it is referenced by other records' });
      }
      return fail(500, { message: 'Failed to delete rental unit' });
    }

    return { success: true };
  }
};