import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';
import type { Database } from '$lib/database.types';
import { batchReadingsSchema, meterReadingSchema } from './meterReadingSchema';
import type { z } from 'zod';

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

  // Get all meters 
  console.log('Fetching meters...');
  const { data: meters, error: metersError } = await supabase
    .from('meters')
    .select(`
      id,
      name,
      type,
      property_id,
      initial_reading,
      rental_unit(
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

  // Get all active leases with their tenants
  console.log('Fetching active leases with tenants...');
  const { data: leasesData, error: leasesError } = await supabase
    .from('leases')
    .select(`
      id,
      name,
      rental_unit_id,
      lease_tenants(
        tenants(
          id,
          full_name:name
        )
      )
    `)
    .eq('status', 'ACTIVE');

  const leases = leasesData?.map(lease => ({
    ...lease,
              tenants: lease.lease_tenants.filter(lt => lt.tenants !== null).map(lt => lt.tenants)
  }));

  if (leasesError) {
    console.error('Error fetching leases:', leasesError);
    throw error(500, `Error fetching leases: ${leasesError.message}`);
  }

  // Get last billed date for each lease-meter combination
  const { data: billings, error: billingsError } = await supabase
    .from('billings')
    .select('meter_id, lease_id, billing_date')
    .eq('type', 'UTILITY')
    .not('meter_id', 'is', null);

  if (billingsError) {
    console.error('Error fetching billings:', billingsError);
    return fail(500, { message: 'Failed to fetch billings' });
  }

  const meterLastBilledDates: Record<string, string> = {};
  const leaseMeterBilledDates: Record<string, string> = {};

  if (billings) {
    for (const billing of billings) {
      if (billing.meter_id) {
        const meterId = String(billing.meter_id);
        const newDate = billing.billing_date;

        // Update meterLastBilledDates
        if (!meterLastBilledDates[meterId] || new Date(newDate) > new Date(meterLastBilledDates[meterId])) {
          meterLastBilledDates[meterId] = newDate;
        }

        // Update leaseMeterBilledDates
        if (billing.lease_id) {
          const key = `${meterId}-${billing.lease_id}`;
          if (!leaseMeterBilledDates[key] || new Date(newDate) > new Date(leaseMeterBilledDates[key])) {
            leaseMeterBilledDates[key] = newDate;
          }
        }
      }
    }
  }

  // Get all readings with full data
  const { data: allReadings, error: allReadingsError } = await supabase
    .from('readings')
    .select('*');

  if (allReadingsError) {
    console.error('Error fetching all readings:', allReadingsError);
    throw error(500, `Error fetching all readings: ${allReadingsError.message}`);
  }

  const readingGroups = (allReadings || []).reduce((acc, reading) => {
    const date = reading.reading_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(reading);
    return acc;
  }, {} as Record<string, any[]>);

  const previousReadingGroups = Object.entries(readingGroups).map(([date, readings]) => ({
    date,
    readings
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Return all the data needed for the page
  return {
    form,
    properties,
    meters,
    readings,
    availableReadingDates: uniqueDates,
    rental_unitTenantCounts,
    leases,
    meterLastBilledDates,
    leaseMeterBilledDates,
    previousReadingGroups
  };
};

export const actions: Actions = {
  createUtilityBillings: async ({ request, locals: { supabase, safeGetSession } }) => {
    const session = await safeGetSession();
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const billingDataString = formData.get('billingData') as string;

    if (!billingDataString) {
      return fail(400, { error: 'Missing billingData' });
    }

    try {
      const billings: Array<{ lease_id: number; utility_type: string; billing_date: string; amount: number; notes: string; meter_id: number; lease: { name: string } }> = JSON.parse(billingDataString);

      // 1. Pre-emptive Duplicate Check
      const orFilters = billings
        .map(
          (b) =>
            `and(lease_id.eq.${b.lease_id},utility_type.eq.${b.utility_type},billing_date.eq.${b.billing_date},meter_id.eq.${b.meter_id})`
        )
        .join(',');

      const { data: existingBillings, error: checkError } = await supabase
        .from('billings')
        .select('lease_id')
        .or(orFilters);

      if (checkError) {
        console.error('Error checking for duplicates:', checkError);
        return fail(500, { error: 'Database error while checking for duplicates.' });
      }

      // 2. All-or-Nothing Logic
      if (existingBillings && existingBillings.length > 0) {
        const existingLeaseIds = new Set(existingBillings.map(eb => eb.lease_id));
        const conflictingLeases = billings
          .filter(b => existingLeaseIds.has(b.lease_id))
          .map(b => b.lease.name)
          .join(', ');
        return fail(409, { 
          error: `Duplicate billing detected. The following leases have already been billed for this period: ${conflictingLeases}. No new bills were created.`
        });
      }

      // 3. Transactional Data Insertion
      const billingsToCreate = billings.map(item => {
        const dueDate = new Date(item.billing_date);
        dueDate.setDate(dueDate.getDate() + 15); // Due 15 days from billing date
        return {
          lease_id: item.lease_id,
          type: 'UTILITY',
          utility_type: item.utility_type,
          amount: item.amount,
          balance: item.amount,
          status: 'PENDING',
          due_date: dueDate.toISOString().split('T')[0],
          billing_date: item.billing_date,
          notes: item.notes,
          meter_id: item.meter_id
        };
      });

      const { error: insertError } = await supabase.from('billings').insert(billingsToCreate);

      if (insertError) {
        console.error('Error creating billings:', insertError);
        // Check for unique constraint violation
        if (insertError.code === '23505') { // Unique violation error code in PostgreSQL
          return fail(409, { error: 'A billing for this period and lease already exists.' });
        }
        return fail(500, { error: 'Failed to create billings.' });
      }

      return { created: billingsToCreate.length, duplicates: [] };
    } catch (e: any) {
      return fail(400, { error: 'Invalid JSON format for billingData' });
    }
  },
  // Add batch readings with full data saving
  addBatchReadings: async ({ request, locals: { supabase, safeGetSession } }) => {
    /* 1. Validate the form once and only once. */
    const form = await superValidate(request, zod(batchReadingsSchema));
    console.log("form.dataAAAAAAAAAAAAAAAAA", form.data);
    if (!form.valid) {
      console.error('❌ Validation failed', form.errors);
      return fail(400, { form });
    }

    try {
      const session = await safeGetSession();
      if (!session) throw error(401, 'Unauthorized');

      // Manually parse the JSON string after successful validation
      const readings: z.infer<typeof meterReadingSchema>[] = JSON.parse(form.data.readings_json);
      const { cost_per_unit } = form.data;

      const meterIds = readings.map((r) => r.meter_id);
  
      const { data: meterData, error: meterError } = await supabase
        .from('meters')
        .select('id, name, rental_unit_id, type')
        .in('id', meterIds);
      if (meterError) return fail(500, { form, error: `Error fetching meter data: ${meterError.message}` });
  
      const meterNameMap = Object.fromEntries((meterData ?? []).map((m) => [m.id, m.name]));
  
      const { data: previousReadings, error: prevError } = await supabase
        .from('readings')
        .select('meter_id, reading, reading_date')
        .in('meter_id', meterIds)
        .order('reading_date', { ascending: false });
      if (prevError) return fail(500, { form, error: `Error fetching previous readings: ${prevError.message}` });
  
      const previousReadingMap: Record<number, number> = {};
      for (const r of previousReadings || []) {
        if (previousReadingMap[r.meter_id] === undefined) previousReadingMap[r.meter_id] = r.reading;
      }
  
      const readingsToInsert = readings
        .filter((r) => r.reading !== null)
        .map((r) => {
          const current = Number(r.reading);
          const previous = previousReadingMap[r.meter_id] ?? null;
          const consumption = previous !== null ? current - previous : null;
          const cost = consumption !== null && consumption > 0 ? consumption * cost_per_unit : null;
          return {
            meter_id: r.meter_id,
            reading: current,
            reading_date: r.reading_date,
            meter_name: meterNameMap[r.meter_id] || null,
            consumption,
            cost,
            cost_per_unit,
            previous_reading: previous
          };
        });
  
      if (readingsToInsert.length === 0) return fail(400, { form, error: 'No valid readings to insert' });
  
      const { data: newReadings, error: insertError } = await supabase
        .from('readings')
        .insert(readingsToInsert)
        .select();
      if (insertError) return fail(500, { form, error: `Failed to insert readings: ${insertError.message}` });
  
            return {
        form, // ← required by Superforms
        success: true,
        message: `Successfully added ${newReadings?.length ?? 0} readings`,
        readings: newReadings ?? []
      };
    } catch (err: any) {
      console.error('Error in addBatchReadings:', err);
      return fail(500, { form, error: err.message || 'An unexpected error occurred' });
    }
  }
};