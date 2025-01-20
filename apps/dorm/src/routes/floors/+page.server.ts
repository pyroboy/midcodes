import { fail, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { floorSchema, deleteFloorSchema, type Floor, type FloorWithProperty } from './formSchema';
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

  // console.log('👤 Session data:', { 
  //   userId: user?.id,
  //   email: user?.email,
  //   roles: decodedToken?.user_roles,
  //   timestamp: new Date().toISOString()
  // });

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
    const startTime = performance.now();

    const form = await superValidate(request, zod(floorSchema));
    console.log('📝 CREATE form validation:', {
      valid: form.valid,
      data: form.data,
      errors: form.errors
    });

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { error } = await supabase
        .from('floors')
        .insert({
          property_id: form.data.property_id,
          floor_number: form.data.floor_number,
          wing: form.data.wing || null,
          status: form.data.status
        } satisfies Database['public']['Tables']['floors']['Insert']);

      if (error) {
        // Handle RLS policy failure
        if (error.message?.includes('Policy check failed')) {
          return fail(403, { form, message: 'You do not have permission to create floors' });
        }
        throw error;
      }

      console.log('✅ Floor created successfully', {
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      
      return { form };
    } catch (err) {
      console.error('❌ Error creating floor:', err);
      return fail(500, { form, message: 'Failed to create floor' });
    }
  },

  update: async ({ request, locals: { supabase } }) => {
    console.log('🔄 Starting floor update process');
    const startTime = performance.now();

    const form = await superValidate(request, zod(floorSchema));
    console.log('📝 UPDATE form validation:', {
      valid: form.valid,
      data: form.data,
      errors: form.errors
    });

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
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
        // Handle RLS policy failure
        if (error.message?.includes('Policy check failed')) {
          return fail(403, { form, message: 'You do not have permission to update floors' });
        }
        throw error;
      }

      console.log('✅ Floor updated successfully', {
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      
      return { form };
    } catch (err) {
      console.error('❌ Error updating floor:', err);
      return fail(500, { form, message: 'Failed to update floor' });
    }
  },

  delete: async ({ request, locals: { supabase } }) => {
    console.log('🗑️ Starting floor deletion process');
    const startTime = performance.now();

    const deleteForm = await superValidate(request, zod(deleteFloorSchema));
    console.log('📝 DELETE form validation:', {
      valid: deleteForm.valid,
      data: deleteForm.data,
      errors: deleteForm.errors
    });

    if (!deleteForm.valid) {
      return fail(400, { 
        message: 'Invalid delete request',
        errors: deleteForm.errors 
      });
    }

    try {
      const { error } = await supabase
        .from('floors')
        .delete()
        .eq('id', deleteForm.data.id);

      if (error) {
        // Handle RLS policy failure
        if (error.message?.includes('Policy check failed')) {
          return fail(403, { message: 'You do not have permission to delete floors' });
        }
        throw error;
      }

      console.log('✅ Floor deleted successfully', {
        executionTime: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      
      return { success: true };
    } catch (err) {
      console.error('❌ Error deleting floor:', err);
      return fail(500, { message: 'Failed to delete floor' });
    }
  }
};