import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { meterSchema } from './formSchema';
import type { Reading } from './types';

interface LatestReading {
  value: number;
  date: string;
}

interface MeterWithReading extends Record<string, any> {
  latest_reading?: LatestReading;
}

export const load = async ({ locals }) => {
  const session = await locals.safeGetSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  // Fetch all required data in parallel
  const [{ data: meters }, { data: properties }, { data: floors }, { data: rental_unit }, { data: readings }] = await Promise.all([
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
      .order('number'),
      
    locals.supabase
      .from('readings')
      .select('*')
      .order('reading_date', { ascending: false })
  ]);

  // Group latest readings by meter_id
  const latestReadings: Record<number, Reading> = {};
  if (readings) {
    readings.forEach((reading: Reading) => {
      if (!latestReadings[reading.meter_id] || 
          new Date(reading.reading_date) > new Date(latestReadings[reading.meter_id].reading_date)) {
        latestReadings[reading.meter_id] = reading;
      }
    });
  }

  // Attach readings to meters
  const metersWithReadings: MeterWithReading[] = meters ? meters.map((meter: Record<string, any>) => {
    const reading = meter.id ? latestReadings[meter.id] : undefined;
    if (reading) {
      return {
        ...meter,
        latest_reading: {
          value: reading.reading,
          date: reading.reading_date
        }
      };
    }
    return meter;
  }) : [];

  // Initialize form with empty data
  const form = await superValidate(zod(meterSchema));

  return {
    form,
    meters: metersWithReadings || [],
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
      
      // Prepare insertData with initial values
      let insertData = {
        name: form.data.name,
        location_type: form.data.location_type,
        property_id: form.data.property_id,
        floor_id: null as number | null,
        rental_unit_id: null as number | null,
        type: form.data.type,
        initial_reading: form.data.initial_reading,
        status: form.data.status,
        is_active: form.data.status === 'ACTIVE',
        notes: form.data.notes
      };
      
      // Set the correct location IDs based on location_type and handle hierarchy
      switch (location_type) {
        case 'PROPERTY':
          // For PROPERTY, we only need property_id
          if (!property_id) {
            console.log('❌ Missing property_id for PROPERTY location type');
            return fail(400, { form, message: 'Property ID is required for PROPERTY location type' });
          }
          break;
          
        case 'FLOOR':
          // For FLOOR, we need floor_id and property_id
          if (!floor_id) {
            console.log('❌ Missing floor_id for FLOOR location type');
            return fail(400, { form, message: 'Floor ID is required for FLOOR location type' });
          }
          
          // Set floor_id
          insertData.floor_id = floor_id;
          
          // If property_id is not provided, get it from the floor
          if (!property_id) {
            const { data: floorData, error: floorError } = await locals.supabase
              .from('floors')
              .select('property_id')
              .eq('id', floor_id)
              .single();
              
            if (floorError) {
              console.log('❌ Error fetching floor:', floorError);
              return fail(500, { form, message: 'Error fetching floor data' });
            }
            
            if (floorData && floorData.property_id) {
              insertData.property_id = floorData.property_id;
            } else {
              return fail(400, { form, message: 'Floor not found or has no associated property' });
            }
          }
          break;
          
        case 'RENTAL_UNIT':
          // For RENTAL_UNIT, we need rental_unit_id, floor_id, and property_id
          if (!rental_unit_id) {
            console.log('❌ Missing rental_unit_id for RENTAL_UNIT location type');
            return fail(400, { form, message: 'Rental unit ID is required for RENTAL_UNIT location type' });
          }
          
          // Set rental_unit_id
          insertData.rental_unit_id = rental_unit_id;
          
          // Get floor_id from rental_unit
          const { data: unitData, error: unitError } = await locals.supabase
            .from('rental_unit')
            .select('floor_id')
            .eq('id', rental_unit_id)
            .single();
            
          if (unitError) {
            console.log('❌ Error fetching rental unit:', unitError);
            return fail(500, { form, message: 'Error fetching rental unit data' });
          }
          
          if (!unitData || !unitData.floor_id) {
            return fail(400, { form, message: 'Rental unit not found or has no associated floor' });
          }
          
          // Set floor_id
          insertData.floor_id = unitData.floor_id;
          
          // If property_id is not provided, get it from the floor
          if (!property_id) {
            const { data: floorData, error: floorError } = await locals.supabase
              .from('floors')
              .select('property_id')
              .eq('id', unitData.floor_id)
              .single();
              
            if (floorError) {
              console.log('❌ Error fetching floor:', floorError);
              return fail(500, { form, message: 'Error fetching floor data' });
            }
            
            if (floorData && floorData.property_id) {
              insertData.property_id = floorData.property_id;
            } else {
              return fail(400, { form, message: 'Floor not found or has no associated property' });
            }
          }
          break;
          
        default:
          console.log('❌ Invalid location_type:', location_type);
          return fail(400, { form, message: 'Invalid location type' });
      }
      
      // Verify property_id is set
      if (!insertData.property_id) {
        console.log('❌ Missing property_id');
        return fail(400, { form, message: 'Property ID is required' });
      }
      
      // Validate the selected location exists and is active
      let locationValid = false;
      let locationQuery;
      
      switch (location_type) {
        case 'PROPERTY':
          locationQuery = locals.supabase
            .from('properties')
            .select('id')
            .eq('id', insertData.property_id)
            .eq('status', 'ACTIVE')
            .single();
          break;
        case 'FLOOR':
          if (insertData.floor_id) {
            locationQuery = locals.supabase
              .from('floors')
              .select('id')
              .eq('id', insertData.floor_id)
              .eq('status', 'ACTIVE')
              .single();
          }
          break;
        case 'RENTAL_UNIT':
          if (insertData.rental_unit_id) {
            locationQuery = locals.supabase
              .from('rental_unit')
              .select('id')
              .eq('id', insertData.rental_unit_id)
              .in('rental_unit_status', ['VACANT', 'OCCUPIED'])
              .single();
          }
          break;
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
        .eq('name', form.data.name)
        .eq('property_id', insertData.property_id);

      switch (location_type) {
        case 'FLOOR':
          if (insertData.floor_id) {
            duplicateQuery = duplicateQuery.eq('floor_id', insertData.floor_id);
          }
          break;
        case 'RENTAL_UNIT':
          if (insertData.rental_unit_id) {
            duplicateQuery = duplicateQuery.eq('rental_unit_id', insertData.rental_unit_id);
          }
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
      
      // Prepare clean update data with initial values
      let cleanUpdateData = {
        name: updateData.name,
        location_type: updateData.location_type,
        property_id: updateData.property_id,
        floor_id: null as number | null,
        rental_unit_id: null as number | null,
        initial_reading: updateData.initial_reading,
        type: updateData.type,
        status: updateData.status,
        is_active: updateData.status === 'ACTIVE',
        notes: updateData.notes
      };
      
      // Set the correct location IDs based on location_type and handle hierarchy
      switch (location_type) {
        case 'PROPERTY':
          // For PROPERTY, we only need property_id
          if (!property_id) {
            console.log('❌ Missing property_id for PROPERTY location type');
            return fail(400, { form, message: 'Property ID is required for PROPERTY location type' });
          }
          break;
          
        case 'FLOOR':
          // For FLOOR, we need floor_id and property_id
          if (!floor_id) {
            console.log('❌ Missing floor_id for FLOOR location type');
            return fail(400, { form, message: 'Floor ID is required for FLOOR location type' });
          }
          
          // Set floor_id
          cleanUpdateData.floor_id = floor_id;
          
          // If property_id is not provided, get it from the floor
          if (!property_id) {
            const { data: floorData, error: floorError } = await locals.supabase
              .from('floors')
              .select('property_id')
              .eq('id', floor_id)
              .single();
              
            if (floorError) {
              console.log('❌ Error fetching floor:', floorError);
              return fail(500, { form, message: 'Error fetching floor data' });
            }
            
            if (floorData && floorData.property_id) {
              cleanUpdateData.property_id = floorData.property_id;
            } else {
              return fail(400, { form, message: 'Floor not found or has no associated property' });
            }
          }
          break;
          
        case 'RENTAL_UNIT':
          // For RENTAL_UNIT, we need rental_unit_id, floor_id, and property_id
          if (!rental_unit_id) {
            console.log('❌ Missing rental_unit_id for RENTAL_UNIT location type');
            return fail(400, { form, message: 'Rental unit ID is required for RENTAL_UNIT location type' });
          }
          
          // Set rental_unit_id
          cleanUpdateData.rental_unit_id = rental_unit_id;
          
          // Get floor_id from rental_unit
          const { data: unitData, error: unitError } = await locals.supabase
            .from('rental_unit')
            .select('floor_id')
            .eq('id', rental_unit_id)
            .single();
            
          if (unitError) {
            console.log('❌ Error fetching rental unit:', unitError);
            return fail(500, { form, message: 'Error fetching rental unit data' });
          }
          
          if (!unitData || !unitData.floor_id) {
            return fail(400, { form, message: 'Rental unit not found or has no associated floor' });
          }
          
          // Set floor_id
          cleanUpdateData.floor_id = unitData.floor_id;
          
          // If property_id is not provided, get it from the floor
          if (!property_id) {
            const { data: floorData, error: floorError } = await locals.supabase
              .from('floors')
              .select('property_id')
              .eq('id', unitData.floor_id)
              .single();
              
            if (floorError) {
              console.log('❌ Error fetching floor:', floorError);
              return fail(500, { form, message: 'Error fetching floor data' });
            }
            
            if (floorData && floorData.property_id) {
              cleanUpdateData.property_id = floorData.property_id;
            } else {
              return fail(400, { form, message: 'Floor not found or has no associated property' });
            }
          }
          break;
          
        default:
          console.log('❌ Invalid location_type:', location_type);
          return fail(400, { form, message: 'Invalid location type' });
      }
      
      // Verify property_id is set
      if (!cleanUpdateData.property_id) {
        console.log('❌ Missing property_id');
        return fail(400, { form, message: 'Property ID is required' });
      }
      
      // Validate the selected location exists and is active
      let locationValid = false;
      let locationQuery;
      
      switch (location_type) {
        case 'PROPERTY':
          locationQuery = locals.supabase
            .from('properties')
            .select('id')
            .eq('id', cleanUpdateData.property_id)
            .eq('status', 'ACTIVE')
            .single();
          break;
        case 'FLOOR':
          if (cleanUpdateData.floor_id) {
            locationQuery = locals.supabase
              .from('floors')
              .select('id')
              .eq('id', cleanUpdateData.floor_id)
              .eq('status', 'ACTIVE')
              .single();
          }
          break;
        case 'RENTAL_UNIT':
          if (cleanUpdateData.rental_unit_id) {
            locationQuery = locals.supabase
              .from('rental_unit')
              .select('id')
              .eq('id', cleanUpdateData.rental_unit_id)
              .in('rental_unit_status', ['VACANT', 'OCCUPIED'])
              .single();
          }
          break;
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
        .eq('property_id', cleanUpdateData.property_id)
        .neq('id', id);

      switch (location_type) {
        case 'FLOOR':
          if (cleanUpdateData.floor_id) {
            duplicateQuery = duplicateQuery.eq('floor_id', cleanUpdateData.floor_id);
          }
          break;
        case 'RENTAL_UNIT':
          if (cleanUpdateData.rental_unit_id) {
            duplicateQuery = duplicateQuery.eq('rental_unit_id', cleanUpdateData.rental_unit_id);
          }
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
    try {
      // Check if the user is authenticated
      const session = await locals.safeGetSession();
      if (!session) {
        return fail(401, { message: 'Unauthorized' });
      }

      // Fetch user profile to check permissions
      const { data: profile, error: profileError } = await locals.supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return fail(500, { message: 'Error fetching user profile' });
      }

      // Restrict action to administrators
      const isAdminLevel = profile?.role === 'super_admin' || profile?.role === 'property_admin';
      if (!isAdminLevel) {
        console.error('Permission denied. User role:', profile?.role);
        return fail(403, { message: 'Only administrators can delete meters.' });
      }

      // Extract meter ID from the form data
      const formData = await request.formData();
      const id = formData.get('id');

      // Validate the meter ID
      if (!id || isNaN(Number(id))) {
        return fail(400, { message: 'Invalid meter ID' });
      }

      const meterId = Number(id);

      // Verify that the meter exists
      const { data: meter, error: meterError } = await locals.supabase
        .from('meters')
        .select('id')
        .eq('id', meterId)
        .single();

      if (meterError || !meter) {
        return fail(404, { message: 'Meter not found' });
      }

      // Check for existing readings
      const { data: readings, error: readingsError } = await locals.supabase
        .from('readings')
        .select('id')
        .eq('meter_id', meterId)
        .limit(1); // We only need to know if at least one reading exists

      if (readingsError) {
        console.error('Error checking readings:', readingsError);
        return fail(500, { message: 'Error checking meter readings' });
      }

      if (readings.length > 0) {
        // Archive the meter by setting status to 'INACTIVE'
        const { error: updateError } = await locals.supabase
          .from('meters')
          .update({ status: 'INACTIVE' })
          .eq('id', meterId);

        if (updateError) {
          console.error('Error updating meter:', updateError);
          return fail(500, { message: 'Error archiving meter' });
        }

        return { success: true, action: 'archived' };
      } else {
        // Delete the meter if no readings exist
        const { error: deleteError } = await locals.supabase
          .from('meters')
          .delete()
          .eq('id', meterId);

        if (deleteError) {
          console.error('Error deleting meter:', deleteError);
          return fail(500, { message: 'Error deleting meter' });
        }

        return { success: true, action: 'deleted' };
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      return fail(500, { message: 'An unexpected error occurred' });
    }
  }
};