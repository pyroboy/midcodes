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

  console.log('Session loaded, user authenticated:', session.user.id);

  // Create a form for superForm to use in the client, using batchReadingsSchema
  const form = await superValidate(zod(batchReadingsSchema));

  // Debug: Log the query we're about to execute
  console.log('Fetching properties with status ACTIVE...');
  
  // Get all active properties
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('status', 'ACTIVE')
    .order('name');
    
  console.log('Properties query result:', { properties, propertiesError });
  
  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError);
    throw error(500, `Error fetching properties: ${propertiesError.message}`);
  }

  // Debug: Log empty results even if no error
  if (!properties || properties.length === 0) {
    console.log('No properties returned from query. Trying without filter...');
    
    // Try fetching without the status filter to see if any properties exist
    const { data: allProperties, error: allPropertiesError } = await supabase
      .from('properties')
      .select('id, name')
      .order('name');
      
    console.log('All properties (without filter):', { allProperties, allPropertiesError });
  }

  // Get all meters for all properties
  console.log('Fetching meters...');
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

  console.log('Meters query result:', { metersCount: meters?.length || 0, metersError });

  if (metersError) {
    console.error('Error fetching meters:', metersError);
    throw error(500, `Error fetching meters: ${metersError.message}`);
  }

  // Get all readings
  console.log('Fetching readings...');
  let meterIds = meters?.map(m => m.id) || [];
  console.log(`Found ${meterIds.length} meter IDs for readings query`);
  
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
    .in('meter_id', meterIds.length > 0 ? meterIds : [0]); // Use [0] as fallback if no meters to avoid empty array error

  console.log('Readings query result:', { readingsCount: readings?.length || 0, readingsError });

  if (readingsError) {
    console.error('Error fetching readings:', readingsError);
    throw error(500, `Error fetching readings: ${readingsError.message}`);
  }

  // Get available reading dates
  console.log('Fetching reading dates...');
  const { data: availableReadingDates, error: datesError } = await supabase
    .from('readings')
    .select('reading_date')
    .in('meter_id', meterIds.length > 0 ? meterIds : [0])
    .order('reading_date');

  console.log('Reading dates result:', { datesCount: availableReadingDates?.length || 0, datesError });

  if (datesError) {
    console.error('Error fetching reading dates:', datesError);
    throw error(500, `Error fetching reading dates: ${datesError.message}`);
  }

  // Get tenant counts per rental_unit
  console.log('Fetching tenant counts...');
  const { data: tenantCounts, error: tenantsError } = await supabase
    .from('leases')
    .select(`
      rental_unit_id,
      tenants:lease_tenants (
        id
      )
    `)
    .eq('status', 'ACTIVE');

  console.log('Tenant counts result:', { tenantCountsCount: tenantCounts?.length || 0, tenantsError });

  if (tenantsError) {
    console.error('Error fetching tenant counts:', tenantsError);
    throw error(500, `Error fetching tenant counts: ${tenantsError.message}`);
  }

  // Process tenant counts
  const rental_unitTenantCounts = tenantCounts.reduce((acc, lease) => {
    if (!lease.rental_unit_id) return acc;
    acc[lease.rental_unit_id] = (lease.tenants?.length || 0);
    return acc;
  }, {} as Record<number, number>);

  // Get unique reading dates (ensure they are Date objects for comparison)
  const uniqueDates = [...new Set(availableReadingDates?.map(d => d.reading_date))].sort();

  console.log('Final data payload:', {
    propertiesCount: properties?.length || 0,
    metersCount: meters?.length || 0,
    readingsCount: readings?.length || 0,
    readingDatesCount: uniqueDates.length || 0,
    sampleProperties: properties?.slice(0, 3) || []
  });

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