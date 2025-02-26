import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import type { Database } from '$lib/database.types';
import { batchReadingsSchema } from './meterReadingSchema';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const session = await safeGetSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  // Create a form for superForm to use in the client, using batchReadingsSchema
  const form = await superValidate(zod(batchReadingsSchema));

  // Get all active properties
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('status', 'ACTIVE')
    .order('name');
    
  if (propertiesError) throw error(500, `Error fetching properties: ${propertiesError.message}`);

  // Get all meters for all properties
  const { data: meters, error: metersError } = await supabase
    .from('meters')
    .select(`
      id,
      name,
      type,
      location_type,
      property_id,
      floor_id,
      rental_unit_id,
      rental_unit:rental_unit (
        id,
        name,
        number
      )
    `);

  if (metersError) throw error(500, `Error fetching meters: ${metersError.message}`);

  // Get all readings
  const { data: readings, error: readingsError } = await supabase
    .from('readings')
    .select(`
      id,
      meter_id,
      reading_date,
      reading,
      consumption,
      cost,
      cost_per_unit,
      previous_reading,
      meter_name
    `)
    .in('meter_id', meters?.map(m => m.id) || []);

  if (readingsError) throw error(500, `Error fetching readings: ${readingsError.message}`);

  // Get available reading dates
  const { data: availableReadingDates, error: datesError } = await supabase
    .from('readings')
    .select('reading_date')
    .in('meter_id', meters?.map(m => m.id) || [])
    .order('reading_date');

  if (datesError) throw error(500, `Error fetching reading dates: ${datesError.message}`);

  // Get tenant counts per rental_unit
  const { data: tenantCounts, error: tenantsError } = await supabase
    .from('leases')
    .select(`
      rental_unit_id,
      tenants:lease_tenants (
        id
      )
    `)
    .eq('status', 'ACTIVE');

  if (tenantsError) throw error(500, `Error fetching tenant counts: ${tenantsError.message}`);

  // Process tenant counts
  const rental_unitTenantCounts = tenantCounts.reduce((acc, lease) => {
    if (!lease.rental_unit_id) return acc;
    acc[lease.rental_unit_id] = (lease.tenants?.length || 0);
    return acc;
  }, {} as Record<number, number>);

  // Get unique reading dates (ensure they are Date objects for comparison)
  const uniqueDates = [...new Set(availableReadingDates?.map(d => d.reading_date))].sort();

  return {
    form,
    properties: properties || [],
    meters: meters || [],
    readings: readings || [],
    availableReadingDates: uniqueDates,
    rental_unitTenantCounts
  };
};

export const actions: Actions = {
  // Add batch readings with full data saving
  addBatchReadings: async ({ request, locals: { supabase, safeGetSession } }) => {
    try {
      // Ensure user is authenticated
      const session = await safeGetSession();
      if (!session) {
        throw error(401, 'Unauthorized');
      }

      // Get form data
      const formData = await request.formData();
      
      // Get the base data
      const property_id = formData.get('property_id');
      const type = formData.get('type');
      const cost_per_unit = parseFloat(formData.get('cost_per_unit') as string);
      
      // Get readings from the readings_json field
      const readingsJson = formData.get('readings_json');
      if (!readingsJson || typeof readingsJson !== 'string') {
        return fail(400, { error: 'No readings provided' });
      }
      
      // Parse the readings JSON
      let readings;
      try {
        readings = JSON.parse(readingsJson);
      } catch (e) {
        return fail(400, { error: 'Invalid readings format' });
      }
      
      if (!Array.isArray(readings) || readings.length === 0) {
        return fail(400, { error: 'No readings provided' });
      }
      
      // Get meter information for all meters involved
      const meterIds = readings.map(r => r.meter_id);
      const { data: meterData, error: meterError } = await supabase
        .from('meters')
        .select('id, name')
        .in('id', meterIds);
      
      if (meterError) {
        return fail(500, { error: `Error fetching meter data: ${meterError.message}` });
      }
      
      // Create a map of meter IDs to meter names
      const meterNameMap: Record<number, string> = {};
      meterData.forEach(meter => {
        meterNameMap[meter.id] = meter.name;
      });
      
      // Get previous readings for all meters to calculate consumption
      const { data: previousReadings, error: prevError } = await supabase
        .from('readings')
        .select('meter_id, reading, reading_date')
        .in('meter_id', meterIds)
        .order('reading_date', { ascending: false });
        
      if (prevError) {
        return fail(500, { error: `Error fetching previous readings: ${prevError.message}` });
      }
      
      // Create a map of meter IDs to their most recent reading
      const previousReadingMap: Record<number, number> = {};
      for (const reading of previousReadings || []) {
        // Only add the first (most recent) reading for each meter
        if (!previousReadingMap[reading.meter_id]) {
          previousReadingMap[reading.meter_id] = reading.reading;
        }
      }
      
      // Prepare data for insertion with all fields
      const readingsToInsert = readings
        .filter(reading => reading.reading !== null) // Skip null readings
        .map(reading => {
          const meterId = reading.meter_id;
          const currentReading = parseFloat(reading.reading);
          const previousReading = previousReadingMap[meterId] || null;
          const consumption = previousReading !== null ? currentReading - previousReading : null;
          const cost = consumption !== null && consumption > 0 ? consumption * cost_per_unit : null;
          
          return {
            meter_id: meterId,
            reading: currentReading,
            reading_date: reading.reading_date,
            meter_name: meterNameMap[meterId] || null,
            consumption: consumption,
            cost: cost,
            cost_per_unit: cost_per_unit, // Store as cost_per_unit for any utility type
            previous_reading: previousReading
          };
        });
      
      if (readingsToInsert.length === 0) {
        return fail(400, { error: 'No valid readings to insert' });
      }
      
      console.log('Inserting readings with data:', readingsToInsert);
      
      // Insert the readings into the database with all fields
      const { data: newReadings, error: insertError } = await supabase
        .from('readings')
        .insert(readingsToInsert)
        .select();
      
      if (insertError) {
        console.error('Error inserting readings:', insertError);
        return fail(500, { error: `Failed to insert readings: ${insertError.message}` });
      }
      
      // Return success response
      return {
        success: true,
        message: `Successfully added ${newReadings.length} readings`,
        readings: newReadings
      };
    } catch (error: any) {
      console.error('Error in addBatchReadings:', error);
      return fail(500, { error: error.message || 'An unexpected error occurred' });
    }
  }
};