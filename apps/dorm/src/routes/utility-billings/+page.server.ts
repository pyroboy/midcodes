import { error, fail, redirect, json } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import type { Database } from '$lib/database.types';
import { utilityBillingCreationSchema } from './meterReadingSchema';
import { meterReadingSchema, batchReadingsSchema } from './meterReadingSchema';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const session = await safeGetSession();
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  const form = await superValidate(zod(utilityBillingCreationSchema));
  const readingForm = await superValidate(zod(meterReadingSchema));

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
      reading
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
    readingForm,
    properties: properties || [],
    meters: meters || [],
    readings: readings || [],
    availableReadingDates: uniqueDates,
    rental_unitTenantCounts
  };
};

export const actions: Actions = {
  // Change the default action to a named action 'createBilling'
  createBilling: async ({ request, locals: { supabase, safeGetSession } }) => {
    const session = await safeGetSession();
    if (!session) {
      throw error(401, 'Unauthorized');
    }

    const form = await superValidate(request, zod(utilityBillingCreationSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    // Validate dates
    const startDate = new Date(form.data.start_date);
    const endDate = new Date(form.data.end_date);
    
    if (startDate >= endDate) {
      return fail(400, {
        form,
        error: 'Start date must be before end date'
      });
    }

    // Format meter billings data for the RPC call
    const formattedMeterBillings = form.data.meter_billings.map(billing => ({
      meter_id: billing.meter_id,
      start_reading: billing.start_reading,
      end_reading: billing.end_reading,
      consumption: billing.consumption,
      total_cost: billing.total_cost,
      tenant_count: billing.tenant_count,
      per_tenant_cost: billing.per_tenant_cost
    }));

    // Convert property_id to number if it's a string
    const propertyId = typeof form.data.property_id === 'string' 
      ? parseInt(form.data.property_id, 10)
      : form.data.property_id;

    // Call RPC to create utility billing
    const { data, error: billingError } = await supabase.rpc('create_utility_billing', {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
      p_type: form.data.type,
      p_cost_per_unit: form.data.cost_per_unit,
      p_property_id: propertyId,
      p_meter_billings: formattedMeterBillings
    });

    if (billingError) {
      console.error('Error creating utility billing:', billingError);
      return fail(500, {
        form,
        error: `Failed to create utility billing: ${billingError.message}`
      });
    }

    // Return success message
    return { 
      form,
      success: true,
      message: 'Utility billing created successfully'
    };
  },
  
  // Add individual reading
  addReading: async ({ request, locals: { supabase } }) => {
    try {
      // Parse the request body as JSON
      const data = await request.json();
      
      // Validate against schema
      const parsedData = meterReadingSchema.safeParse(data);
      if (!parsedData.success) {
        return json({ 
          error: 'Invalid data', 
          details: parsedData.error.format() 
        }, { status: 400 });
      }
      
      // Add reading to database
      const { data: newReading, error: readingError } = await supabase
        .from('readings')
        .insert({
          meter_id: parsedData.data.meter_id,
          reading: parsedData.data.reading,
          reading_date: parsedData.data.reading_date
        })
        .select();
      
      if (readingError) {
        return json({ 
          error: `Failed to add reading: ${readingError.message}` 
        }, { status: 500 });
      }
      
      // Return success
      return json({ success: true, reading: newReading });
    } catch (error: any) {
      console.error('Error adding reading:', error);
      return json({ 
        error: error.message || 'An unexpected error occurred' 
      }, { status: 500 });
    }
  },
  
  // Add batch readings
  addBatchReadings: async ({ request, locals }) => {
    try {
      // Extract form data from the request
      const formData = await request.formData();
      const readingDate = formData.get('readingDate');
      const costPerKwh = Number(formData.get('costPerKwh'));
      const currentReading = Number(formData.get('currentReading')); // Adjust based on your form structure

      // Basic validation
      if (!readingDate || isNaN(costPerKwh) || isNaN(currentReading)) {
        return fail(400, { message: 'Invalid input: All fields are required and must be valid.' });
      }

      // Assuming you're using Supabase (adjust if using a different DB)
      const { supabase } = locals; // Supabase client from locals, set up via hooks
      const newReading = {
        meter_name: 'dweqwe', // Replace with dynamic data from formData as needed
        reading_date: readingDate,
        current_reading: currentReading,
        cost_per_kwh: costPerKwh,
        consumption: currentReading, // Adjust logic if previous reading exists
        cost: currentReading * costPerKwh
      };

      // Insert into Supabase and await the result
      const { data, error } = await supabase
        .from('readings')
        .insert([newReading])
        .select();

      if (error) {
        return fail(500, { message: `Database error: ${error.message}` });
      }

      // Return a plain object for success
      return {
        success: true,
        message: `Successfully added ${data.length} reading(s)`,
        readings: data
      };
    } catch (err) {
      // Handle unexpected errors
      console.error('Error in addBatchReadings:', err);
      return fail(500, { message: 'Internal server error' });
    }
  }
};