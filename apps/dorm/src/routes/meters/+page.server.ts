import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { meterSchema } from './formSchema';

export const load = async ({ locals }) => {
  const session = await locals.safeGetSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  // Fetch all required data in parallel
  const [{ data: meters }, { data: properties }, { data: floors }, { data: rental_unit }] = await Promise.all([
    locals.supabase
    .from('meters')
    .select(`
      *
    `)
    .order('name'),
    
    locals.supabase
      .from('properties')
      .select('*')
      .order('name'),
    
    locals.supabase
      .from('floors')
      .select(`
        *,
        property:properties(
          id,
          name
        )
      `)
      .order('floor_number'),
    
    locals.supabase
      .from('rental_unit')
      .select(`
        *,
        floor:floors(
          id,
          floor_number,
          wing,
          property:properties(
            id,
            name
          )
        )
      `)
      .in('rental_unit_status', ['VACANT', 'OCCUPIED'])
      .order('number')
  ]);

  // Initialize form with empty data
  const form = await superValidate(zod(meterSchema));

  return {
    form,
    meters: meters || [],
    properties: properties || [],
    floors: floors || [],
    rental_unit: rental_unit || [],
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    console.log('🔄 Starting create action');
    
    try {
      const session = await locals.safeGetSession();
      if (!session) {
        console.log('❌ No session found');
        return fail(401, { message: 'Unauthorized' });
      }

      // Validate form data
      const form = await superValidate(request, zod(meterSchema));
      console.log('📝 Form data:', form.data);
      
      if (!form.valid) {
        console.log('❌ Form validation failed:', form.errors);
        return fail(400, { form });
      }

      // Check user permissions
      const { data: profile, error: profileError } = await locals.supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
        console.log('❌ Error fetching profile:', profileError);
        return fail(500, { form, message: 'Error fetching user profile' });
      }

      const isAdminLevel = profile?.role === 'super_admin' || profile?.role === 'property_admin';
      const isUtility = profile?.role === 'property_utility';

      if (!isAdminLevel && !isUtility) {
        console.log('❌ Permission denied. User role:', profile?.role);
        return fail(403, { form, message: 'Forbidden - Insufficient permissions' });
      }

      // Validate location constraints
      const { location_type, property_id, floor_id, rental_unit_id } = form.data;
      console.log('📍 Location data:', { location_type, property_id, floor_id, rental_unit_id });
      
      let locationValid = false;
      let locationQuery;
      
      switch (location_type) {
        case 'PROPERTY':
          if (!property_id) {
            console.log('❌ Missing property_id for PROPERTY location type');
            return fail(400, { form, message: 'Property ID is required for PROPERTY location type' });
          }
          locationQuery = locals.supabase
            .from('properties')
            .select('id')
            .eq('id', property_id)
            .eq('status', 'ACTIVE')
            .single();
          break;
        case 'FLOOR':
          if (!floor_id) {
            console.log('❌ Missing floor_id for FLOOR location type');
            return fail(400, { form, message: 'Floor ID is required for FLOOR location type' });
          }
          locationQuery = locals.supabase
            .from('floors')
            .select('id')
            .eq('id', floor_id)
            .eq('status', 'ACTIVE')
            .single();
          break;
        case 'RENTAL_UNIT':
          if (!rental_unit_id) {
            console.log('❌ Missing rental_unit_id for RENTAL_UNIT location type');
            return fail(400, { form, message: 'Rental unit ID is required for RENTAL_UNIT location type' });
          }
          locationQuery = locals.supabase
            .from('rental_unit')
            .select('id')
            .eq('id', rental_unit_id)
            .in('rental_unit_status', ['VACANT', 'OCCUPIED'])
            .single();
          break;
        default:
          console.log('❌ Invalid location_type:', location_type);
          return fail(400, { form, message: 'Invalid location type' });
      }

      if (locationQuery) {
        const { data, error: locationError } = await locationQuery;
        if (locationError) {
          console.log('❌ Location query error:', locationError);
          return fail(500, { form, message: 'Error validating location' });
        }
        locationValid = !!data;
      }

      if (!locationValid) {
        console.log('❌ Invalid location. Location not found or not active.');
        return fail(400, { 
          form, 
          message: 'Invalid location selected. Please check if the location exists and is active.' 
        });
      }

      // Check for duplicate meter names
      let duplicateQuery = locals.supabase
        .from('meters')
        .select('id')
        .eq('name', form.data.name);

      switch (location_type) {
        case 'PROPERTY':
          duplicateQuery = duplicateQuery.eq('property_id', property_id);
          break;
        case 'FLOOR':
          duplicateQuery = duplicateQuery.eq('floor_id', floor_id);
          break;
        case 'RENTAL_UNIT':
          duplicateQuery = duplicateQuery.eq('rental_unit_id', rental_unit_id);
          break;
      }

      const { data: existingMeter, error: duplicateError } = await duplicateQuery.maybeSingle();
      
      if (duplicateError) {
        console.log('❌ Error checking for duplicates:', duplicateError);
        return fail(500, { form, message: 'Error checking for duplicate meters' });
      }

      if (existingMeter) {
        console.log('❌ Duplicate meter found:', existingMeter);
        return fail(400, { 
          form, 
          message: 'A meter with this name already exists in this location.' 
        });
      }

      // Prepare data for insertion - FIXED to remove created_by and created_at fields
      const insertData = {
        name: form.data.name,
        location_type: form.data.location_type,
        property_id: form.data.location_type === 'PROPERTY' ? form.data.property_id : null,
        floor_id: form.data.location_type === 'FLOOR' ? form.data.floor_id : null,
        rental_unit_id: form.data.location_type === 'RENTAL_UNIT' ? form.data.rental_unit_id : null,
        type: form.data.type,
        status: form.data.status,
        is_active: form.data.status === 'ACTIVE',
        initial_reading: form.data.initial_reading,
        unit_rate: form.data.unit_rate,
        notes: form.data.notes
        // Removed created_by and created_at fields
      };
      
      console.log('📤 Inserting meter with data:', insertData);

      // Insert the meter
      const { error: insertError } = await locals.supabase
        .from('meters')
        .insert(insertData);

      if (insertError) {
        console.log('❌ Error inserting meter:', insertError);
        return fail(500, { form, message: `Database error: ${insertError.message}` });
      }

      console.log('✅ Meter created successfully');
      return { form };
      
    } catch (err) {
      console.error('❌ Unexpected error in create action:', err);
      return fail(500, { message: 'An unexpected error occurred' });
    }
  },

  update: async ({ request, locals }) => {
    console.log('🔄 Starting update action');
    
    try {
      const session = await locals.safeGetSession();
      if (!session) {
        console.log('❌ No session found');
        return fail(401, { message: 'Unauthorized' });
      }

      // Validate form data
      const form = await superValidate(request, zod(meterSchema));
      console.log('📝 Form data:', form.data);
      
      if (!form.valid) {
        console.log('❌ Form validation failed:', form.errors);
        return fail(400, { form });
      }

      // Check user permissions
      const { data: profile, error: profileError } = await locals.supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
        console.log('❌ Error fetching profile:', profileError);
        return fail(500, { form, message: 'Error fetching user profile' });
      }

      const isAdminLevel = profile?.role === 'super_admin' || profile?.role === 'property_admin';
      const isUtility = profile?.role === 'property_utility';

      if (!isAdminLevel && !isUtility) {
        console.log('❌ Permission denied. User role:', profile?.role);
        return fail(403, { form, message: 'Forbidden - Insufficient permissions' });
      }

      const { id, ...updateData } = form.data;
      if (!id) {
        console.log('❌ Missing meter ID for update');
        return fail(400, { form, message: 'Meter ID is required for updates.' });
      }

      // Check if meter exists
      const { data: meter, error: meterError } = await locals.supabase
        .from('meters')
        .select('id')
        .eq('id', id)
        .single();

      if (meterError) {
        console.log('❌ Error fetching meter:', meterError);
        return fail(500, { form, message: 'Error fetching meter information' });
      }

      if (!meter) {
        console.log('❌ Meter not found with ID:', id);
        return fail(404, { form, message: 'Meter not found.' });
      }

      // Validate location constraints
      const { location_type, property_id, floor_id, rental_unit_id } = updateData;
      console.log('📍 Location data:', { location_type, property_id, floor_id, rental_unit_id });
      
      let locationValid = false;
      let locationQuery;
      
      switch (location_type) {
        case 'PROPERTY':
          if (!property_id) {
            console.log('❌ Missing property_id for PROPERTY location type');
            return fail(400, { form, message: 'Property ID is required for PROPERTY location type' });
          }
          locationQuery = locals.supabase
            .from('properties')
            .select('id')
            .eq('id', property_id)
            .eq('status', 'ACTIVE')
            .single();
          break;
        case 'FLOOR':
          if (!floor_id) {
            console.log('❌ Missing floor_id for FLOOR location type');
            return fail(400, { form, message: 'Floor ID is required for FLOOR location type' });
          }
          locationQuery = locals.supabase
            .from('floors')
            .select('id')
            .eq('id', floor_id)
            .eq('status', 'ACTIVE')
            .single();
          break;
        case 'RENTAL_UNIT':
          if (!rental_unit_id) {
            console.log('❌ Missing rental_unit_id for RENTAL_UNIT location type');
            return fail(400, { form, message: 'Rental unit ID is required for RENTAL_UNIT location type' });
          }
          locationQuery = locals.supabase
            .from('rental_unit')
            .select('id')
            .eq('id', rental_unit_id)
            .in('rental_unit_status', ['VACANT', 'OCCUPIED'])
            .single();
          break;
        default:
          console.log('❌ Invalid location_type:', location_type);
          return fail(400, { form, message: 'Invalid location type' });
      }

      if (locationQuery) {
        const { data, error: locationError } = await locationQuery;
        if (locationError) {
          console.log('❌ Location query error:', locationError);
          return fail(500, { form, message: 'Error validating location' });
        }
        locationValid = !!data;
      }

      if (!locationValid) {
        console.log('❌ Invalid location. Location not found or not active.');
        return fail(400, { 
          form, 
          message: 'Invalid location selected. Please check if the location exists and is active.' 
        });
      }

      // Check for duplicate meter names
      let duplicateQuery = locals.supabase
        .from('meters')
        .select('id')
        .eq('name', updateData.name)
        .neq('id', id);

      switch (location_type) {
        case 'PROPERTY':
          duplicateQuery = duplicateQuery.eq('property_id', property_id);
          break;
        case 'FLOOR':
          duplicateQuery = duplicateQuery.eq('floor_id', floor_id);
          break;
        case 'RENTAL_UNIT':
          duplicateQuery = duplicateQuery.eq('rental_unit_id', rental_unit_id);
          break;
      }

      const { data: existingMeter, error: duplicateError } = await duplicateQuery.maybeSingle();
      
      if (duplicateError) {
        console.log('❌ Error checking for duplicates:', duplicateError);
        return fail(500, { form, message: 'Error checking for duplicate meters' });
      }

      if (existingMeter) {
        console.log('❌ Duplicate meter found:', existingMeter);
        return fail(400, { 
          form, 
          message: 'A meter with this name already exists in this location.' 
        });
      }

      // Prepare clean update data - FIXED to remove updated_by and updated_at fields
      const cleanUpdateData = {
        name: updateData.name,
        location_type: updateData.location_type,
        property_id: updateData.location_type === 'PROPERTY' ? updateData.property_id : null,
        floor_id: updateData.location_type === 'FLOOR' ? updateData.floor_id : null,
        rental_unit_id: updateData.location_type === 'RENTAL_UNIT' ? updateData.rental_unit_id : null,
        type: updateData.type,
        status: updateData.status,
        is_active: updateData.status === 'ACTIVE',
        initial_reading: updateData.initial_reading,
        unit_rate: updateData.unit_rate,
        notes: updateData.notes
        // Removed updated_by and updated_at fields
      };
      
      console.log('📤 Updating meter with data:', cleanUpdateData);

      // Update the meter
      const { error: updateError } = await locals.supabase
        .from('meters')
        .update(cleanUpdateData)
        .eq('id', id);

      if (updateError) {
        console.log('❌ Error updating meter:', updateError);
        return fail(500, { form, message: `Database error: ${updateError.message}` });
      }

      console.log('✅ Meter updated successfully');
      return { form };
      
    } catch (err) {
      console.error('❌ Unexpected error in update action:', err);
      return fail(500, { message: 'An unexpected error occurred' });
    }
  },

  delete: async ({ request, locals }) => {
    console.log('🔄 Starting delete action');
    
    try {
      const session = await locals.safeGetSession();
      if (!session) {
        console.log('❌ No session found');
        return fail(401, { message: 'Unauthorized' });
      }

      // Check user permissions
      const { data: profile, error: profileError } = await locals.supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
        console.log('❌ Error fetching profile:', profileError);
        return fail(500, { message: 'Error fetching user profile' });
      }

      const isAdminLevel = profile?.role === 'super_admin' || profile?.role === 'property_admin';
      if (!isAdminLevel) {
        console.log('❌ Permission denied. User role:', profile?.role);
        return fail(403, { message: 'Only administrators can delete meters.' });
      }

      const form = await superValidate(request, zod(meterSchema));
      if (!form.valid) {
        console.log('❌ Form validation failed:', form.errors);
        return fail(400, { form });
      }

      const { id } = form.data;
      if (!id) {
        console.log('❌ Missing meter ID for deletion');
        return fail(400, { form, message: 'Meter ID is required for deletion.' });
      }

      // Check if meter exists
      const { data: meter, error: meterError } = await locals.supabase
        .from('meters')
        .select('id')
        .eq('id', id)
        .single();

      if (meterError) {
        console.log('❌ Error fetching meter:', meterError);
        return fail(500, { form, message: 'Error fetching meter information' });
      }

      if (!meter) {
        console.log('❌ Meter not found with ID:', id);
        return fail(404, { form, message: 'Meter not found.' });
      }

      // Check for existing readings
      const { data: readings, error: readingsError } = await locals.supabase
        .from('readings')
        .select('id')
        .eq('meter_id', id)
        .limit(1);

      if (readingsError) {
        console.log('❌ Error checking for readings:', readingsError);
        return fail(500, { form, message: 'Error checking for meter readings' });
      }

      if (readings && readings.length > 0) {
        console.log('❌ Meter has existing readings, cannot delete');
        return fail(400, { 
          form, 
          message: 'Cannot delete meter with existing readings. Please archive it instead.' 
        });
      }

      // Delete the meter
      const { error: deleteError } = await locals.supabase
        .from('meters')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.log('❌ Error deleting meter:', deleteError);
        return fail(500, { form, message: `Database error: ${deleteError.message}` });
      }

      console.log('✅ Meter deleted successfully');
      return { form };
      
    } catch (err) {
      console.error('❌ Unexpected error in delete action:', err);
      return fail(500, { message: 'An unexpected error occurred' });
    }
  }
};