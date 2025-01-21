import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { floorSchema, deleteFloorSchema } from './formSchema';
import type { Actions, PageServerLoad } from './$types';
import type { Database } from '$lib/database.types';

type DBFloor = Database['public']['Tables']['floors']['Row'];
type DBProperty = Database['public']['Tables']['properties']['Row'];

type FloorsResponse = DBFloor & {
  property: Pick<DBProperty, 'id' | 'name'> | null;
  rental_unit: Array<{
    id: number;
    number: number;
  }> | null;
};

export const load: PageServerLoad = async ({ locals }) => {
  console.log('🔄 Starting server-side load function');
  
  const { user, decodedToken } = await locals.safeGetSession();

  if (!user) {
    throw error(401, 'Unauthorized');
  }

  console.log('📊 Initiating database queries for floors and properties');
  const startTime = performance.now();
  
  const [floorsResult, propertiesResult] = await Promise.all([
    locals.supabase
      .from('floors')
      .select(`
        *,
        property:properties(
          id,
          name
        ),
        rental_unit:rental_unit(
          id,
          number
        )
      `)
      .order('property_id, floor_number'),
    
    locals.supabase
      .from('properties')
      .select('id, name')
      .order('name')
  ]);

  // If access is denied by RLS, handle it
  if (floorsResult.error) {
    console.error('Floors query error:', {
      error: floorsResult.error,
      message: floorsResult.error.message,
      details: floorsResult.error.details,
      hint: floorsResult.error.hint,
      code: floorsResult.error.code
    });
  }

  const queryTime = performance.now() - startTime;
  console.log('🏢 Database query results:', {
    floorsCount: floorsResult.data?.length || 0,
    propertiesCount: propertiesResult.data?.length || 0,
    queryExecutionTime: `${queryTime.toFixed(2)}ms`
  });

  const floors = (floorsResult.data as FloorsResponse[] || []).map(floor => {
    return {
      ...floor,
      property: floor.property ? {
        id: floor.property.id,
        name: floor.property.name
      } : {
        id: floor.property_id,
        name: 'Unknown Property'
      },
      rental_unit: (floor.rental_unit || []).map(unit => ({
        ...unit,
        number: unit.number.toString()
      }))
    };
  });




  const properties = propertiesResult.data || [];
  const form = await superValidate(zod(floorSchema));

  return {
    form,
    floors,
    properties,

  };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase } }) => {
    console.log('➕ Starting floor creation process');
    const form = await superValidate(request, zod(floorSchema));
    if (!form.valid) {return fail(400, { form });}
    const { error } = await supabase
      .from('floors')
      .insert({
        property_id: form.data.property_id,
        floor_number: form.data.floor_number,
        wing: form.data.wing || null,
        status: form.data.status
      } satisfies Database['public']['Tables']['floors']['Insert']);

    if (error) {
      if (error.message?.includes('Policy check failed')) {
        return fail(403, { form, message: 'You do not have permission to create floors' });
      }
      return fail(500, { form, message: 'Failed to create floor' });
    }
    return { form };
  },

  update: async ({ request, locals: { supabase } }) => {

    const form = await superValidate(request, zod(floorSchema));

    if (!form.valid) {return fail(400, { form });}

      const { error } = await supabase
        .from('floors')
        .update({
          property_id: form.data.property_id,
          floor_number: form.data.floor_number,
          wing: form.data.wing || null,
          status: form.data.status,
          updated_at: new Date().toISOString()
        } satisfies Database['public']['Tables']['floors']['Update'])
        .eq('id', form.data.id);

      if (error) {
        if (error.message?.includes('Policy check failed')) {
          return fail(403, { form, message: 'You do not have permission to update floors' });
        }
          return fail(500, { form, message: 'Failed to update floor' });
      }

      return { form };
 
  },

  delete: async ({ request, locals: { supabase } }) => {

    const deleteForm = await superValidate(request, zod(deleteFloorSchema));


    if (!deleteForm.valid) {
      return fail(400, { 
        message: 'Invalid delete request',
        errors: deleteForm.errors 
      });
    }

      const { error } = await supabase
        .from('floors')
        .delete()
        .eq('id', deleteForm.data.id);

      if (error) {
        console.error('❌ Error deleting floor:', error);
        // Handle RLS policy failure
        if (error.message?.includes('Policy check failed')) {
          return fail(403, { message: 'You do not have permission to delete floors' });
        }
        return fail(500, { message: 'Failed to delete floor' });

      }


      return { success: true };

  }
};