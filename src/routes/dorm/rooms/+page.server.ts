import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { roomSchema, type Floor } from './formSchema';
import { supabase } from '$lib/supabaseClient';
import { checkAccess } from '$lib/utils/roleChecks';

// Define expected database types that align with formSchema
interface DatabaseFloor extends Omit<Floor, 'wing'> {
  id: number;
  property_id: number;
  wing?: string; // Making wing explicitly optional to match formSchema
}

// Debug helper to log Supabase responses
const logSupabaseResponse = (operation: string, { data, error }: { data: any, error: any }) => {
  console.log(`[Supabase Debug] ${operation} response:`, {
    hasData: !!data,
    dataLength: Array.isArray(data) ? data.length : null,
    data,
    error,
    errorMessage: error?.message,
    errorCode: error?.code
  });
};

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
 
  const { session, user ,profile } = await safeGetSession();

  console.log('\n=== Load Function Start ===');
  
  // Authorization check logging
  {
    console.log('[Auth Debug] User details:', {
      role: profile?.role,
      id: user?.id,
      email: user?.email
    });
    
    console.log('[Auth Debug] Access check parameters:', {
      role: profile?.role,
      requiredLevel: 'admin'
    });
    
    const hasAccess = checkAccess(profile?.role, 'admin');
    console.log('[Auth Debug] Access check result:', { hasAccess });
    
    if (!hasAccess) {
      console.log('[Auth Debug] Access denied, redirecting to unauthorized');
      throw redirect(302, '/unauthorized');
    }
    console.log('[Auth Debug] Access granted, proceeding with data fetch');
  }

  console.log('[Query Debug] Starting Supabase queries');
  
  // Execute all queries with detailed logging
  const [roomsResponse, propertiesResponse, floorsResponse] = await Promise.all([
    supabase
      .from('rooms')
      .select(`
        *,
        property:properties(name),
        floor:floors(floor_number, wing)
      `)
      .order('property_id, floor_id, number')
      .then(response => {
        logSupabaseResponse('rooms', response);
        return response;
      }),
    
    supabase
      .from('properties')
      .select('id, name')
      .order('name')
      .then(response => {
        logSupabaseResponse('properties', response);
        return response;
      }),

    supabase
      .from('floors')
      .select('id, property_id, floor_number, wing')
      .order('property_id, floor_number')
      .then(response => {
        logSupabaseResponse('floors', response);
        return response as { 
          data: DatabaseFloor[] | null, 
          error: any 
        };
      })
  ]);

  const { data: rooms, error: roomsError } = roomsResponse;
  const { data: properties, error: propertiesError } = propertiesResponse;
  const { data: floors, error: floorsError } = floorsResponse;

  // Error handling with detailed logging
  console.log('[Error Debug] Checking for errors in responses');
  
  if (roomsError) {
    console.error('[Error Debug] Rooms query error:', {
      error: roomsError,
      code: roomsError.code,
      message: roomsError.message,
      details: roomsError.details
    });
    throw fail(403, { message: roomsError.message });
  }
  
  if (propertiesError) {
    console.error('[Error Debug] Properties query error:', {
      error: propertiesError,
      code: propertiesError.code,
      message: propertiesError.message,
      details: propertiesError.details
    });
    throw fail(403, { message: propertiesError.message });
  }
  
  if (floorsError) {
    console.error('[Error Debug] Floors query error:', {
      error: floorsError,
      code: floorsError.code,
      message: floorsError.message,
      details: floorsError.details
    });
    throw fail(403, { message: floorsError.message });
  }

  console.log('[Form Debug] Validating room schema');
  const form = await superValidate(zod(roomSchema));
  console.log('[Form Debug] Validation result:', {
    isValid: form.valid,
    hasErrors: !!form.errors,
    errorCount: Object.keys(form.errors || {}).length
  });

  const result = {
    rooms,
    properties,
    floors: floors as DatabaseFloor[], // Explicitly type the floors
    form,
    user:user
  };

  console.log('[Response Debug] Load function return value:', {
    hasRooms: !!rooms && Array.isArray(rooms),
    roomCount: rooms?.length,
    hasProperties: !!properties && Array.isArray(properties),
    propertyCount: properties?.length,
    hasFloors: !!floors && Array.isArray(floors),
    floorCount: floors?.length,
    hasForm: !!form,
    hasUser: !!result.user
  });

  console.log('=== Load Function End ===\n');
  return result;
}

// Actions with enhanced logging
export const actions: Actions = {
  create: async ({ request }: RequestEvent) => {
    console.log('\n=== Create Action Start ===');
    
    console.log('[Form Debug] Validating create request');
    const form = await superValidate(request, zod(roomSchema));
    
    console.log('[Form Debug] Create validation result:', {
      isValid: form.valid,
      hasErrors: !!form.errors,
      formData: form.data
    });
    
    if (!form.valid) {
      console.log('[Form Debug] Create validation failed');
      return fail(400, { form });
    }

    // Check for existing room
    console.log('[Query Debug] Checking for existing room:', {
      floor_id: form.data.floor_id,
      number: form.data.number
    });
    
    const existingRoomResponse = await supabase
      .from('rooms')
      .select('id')
      .eq('floor_id', form.data.floor_id)
      .eq('number', form.data.number)
      .single();
      
    logSupabaseResponse('check existing room', existingRoomResponse);

    if (existingRoomResponse.data) {
      console.log('[Error Debug] Room already exists');
      return fail(400, {
        form,
        error: 'Room number already exists on this floor'
      });
    }

    console.log('[Query Debug] Inserting new room:', form.data);
    const insertResponse = await supabase
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
      
    logSupabaseResponse('insert room', insertResponse);

    if (insertResponse.error) {
      console.error('[Error Debug] Room creation failed:', {
        error: insertResponse.error,
        code: insertResponse.error.code,
        message: insertResponse.error.message
      });
      
      return fail(insertResponse.error.code === '42501' ? 403 : 500, { 
        form,
        error: insertResponse.error.message || 'Failed to create room'
      });
    }

    console.log('[Success Debug] Room created successfully');
    console.log('=== Create Action End ===\n');
    return { form };
  },

  update: async ({ request }: RequestEvent) => {
    console.log('\n=== Update Action Start ===');
    
    console.log('[Form Debug] Validating update request');
    const form = await superValidate(request, zod(roomSchema));
    
    console.log('[Form Debug] Update validation result:', {
      isValid: form.valid,
      hasId: !!form.data.id,
      formData: form.data
    });
    
    if (!form.valid || !form.data.id) {
      console.log('[Form Debug] Update validation failed');
      return fail(400, { form });
    }

    // Check for existing room
    console.log('[Query Debug] Checking for conflicting room:', {
      floor_id: form.data.floor_id,
      number: form.data.number,
      excluding_id: form.data.id
    });
    
    const existingRoomResponse = await supabase
      .from('rooms')
      .select('id')
      .eq('floor_id', form.data.floor_id)
      .eq('number', form.data.number)
      .neq('id', form.data.id)
      .single();
      
    logSupabaseResponse('check existing room', existingRoomResponse);

    if (existingRoomResponse.data) {
      console.log('[Error Debug] Conflicting room exists');
      return fail(400, {
        form,
        error: 'Room number already exists on this floor'
      });
    }

    console.log('[Query Debug] Updating room:', {
      id: form.data.id,
      data: form.data
    });
    
    const updateResponse = await supabase
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
      
    logSupabaseResponse('update room', updateResponse);

    if (updateResponse.error) {
      console.error('[Error Debug] Room update failed:', {
        error: updateResponse.error,
        code: updateResponse.error.code,
        message: updateResponse.error.message
      });
      
      return fail(updateResponse.error.code === '42501' ? 403 : 500, { 
        form,
        error: updateResponse.error.message || 'Failed to update room'
      });
    }

    console.log('[Success Debug] Room updated successfully');
    console.log('=== Update Action End ===\n');
    return { form };
  },

  delete: async ({ request }: RequestEvent) => {
    console.log('\n=== Delete Action Start ===');
    
    console.log('[Form Debug] Validating delete request');
    const form = await superValidate(request, zod(roomSchema));
    
    console.log('[Form Debug] Delete validation result:', {
      isValid: form.valid,
      hasId: !!form.data.id,
      roomId: form.data.id
    });
    
    if (!form.valid || !form.data.id) {
      console.log('[Form Debug] Delete validation failed');
      return fail(400, { form });
    }

    console.log('[Query Debug] Deleting room:', { id: form.data.id });
    const deleteResponse = await supabase
      .from('rooms')
      .delete()
      .eq('id', form.data.id);
      
    logSupabaseResponse('delete room', deleteResponse);

    if (deleteResponse.error) {
      console.error('[Error Debug] Room deletion failed:', {
        error: deleteResponse.error,
        code: deleteResponse.error.code,
        message: deleteResponse.error.message
      });
      
      return fail(deleteResponse.error.code === '42501' ? 403 : 500, { 
        form,
        error: deleteResponse.error.message || 'Failed to delete room'
      });
    }

    console.log('[Success Debug] Room deleted successfully');
    console.log('=== Delete Action End ===\n');
    return { form };
  }
} 