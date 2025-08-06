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

  // Use Promise.all for parallel data fetching to improve performance
  console.log('Fetching all data in parallel...');
  
  const [
    propertiesResult,
    metersResult,
    readingsResult,
    billingsResult,
    availableReadingDatesResult,
    tenantCountsResult,
    leasesResult,
    allReadingsResult
  ] = await Promise.all([
    // Properties
    supabase
      .from('properties')
      .select('id, name')
      .eq('status', 'ACTIVE')
      .order('name'),
    
    // Meters with rental unit info
    supabase
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
      `),
    
    // All readings with meter info for billing period grouping
    supabase
      .from('readings')
      .select(`
        id,
        meter_id,
        reading,
        reading_date,
        rate_at_reading
      `)
      .order('reading_date', { ascending: true }),
    
    // Billings for last billed date tracking
    supabase
      .from('billings')
      .select('meter_id, lease_id, billing_date, amount')
      .eq('type', 'UTILITY')
      .not('meter_id', 'is', null),
    
    // Available reading dates
    supabase
      .from('readings')
      .select('reading_date')
      .order('reading_date'),
    
    // Tenant counts per rental unit
    supabase
      .from('leases')
      .select(`
        rental_unit_id,
        tenants:lease_tenants (
          id
        )
      `)
      .eq('status', 'ACTIVE'),
    
    // All leases with tenants and room info
    supabase
      .from('leases')
      .select(`
        id,
        name,
        rental_unit_id,
        status,
        rental_unit:rental_unit_id(
          id,
          name,
          number,
          type
        ),
        lease_tenants(
          tenants(
            id,
            full_name:name,
            tenant_status
          )
        )
      `),
    
    // All readings for backward compatibility
    supabase
      .from('readings')
      .select('*')
  ]);

  // Handle errors for each result
  const { data: properties, error: propertiesError } = propertiesResult;
  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError);
    throw error(500, `Error fetching properties: ${propertiesError.message}`);
  }

  const { data: meters, error: metersError } = metersResult;
  if (metersError) {
    console.error('Error fetching meters:', metersError);
    throw error(500, `Error fetching meters: ${metersError.message}`);
  }

  const { data: readings, error: readingsError } = readingsResult;
  if (readingsError) {
    console.error('Error fetching readings:', readingsError);
    throw error(500, `Error fetching readings: ${readingsError.message}`);
  }

  const { data: billings, error: billingsError } = billingsResult;
  if (billingsError) {
    console.error('Error fetching billings:', billingsError);
    throw error(500, `Error fetching billings: ${billingsError.message}`);
  }

  const { data: availableReadingDates, error: datesError } = availableReadingDatesResult;
  if (datesError) {
    console.error('Error fetching reading dates:', datesError);
    throw error(500, `Error fetching reading dates: ${datesError.message}`);
  }

  const { data: tenantCounts, error: tenantsError } = tenantCountsResult;
  if (tenantsError) {
    console.error('Error fetching tenant counts:', tenantsError);
    throw error(500, `Error fetching tenant counts: ${tenantsError.message}`);
  }

  const { data: leasesData, error: leasesError } = leasesResult;
  if (leasesError) {
    console.error('Error fetching leases:', leasesError);
    throw error(500, `Error fetching leases: ${leasesError.message}`);
  }

  const { data: allReadings, error: allReadingsError } = allReadingsResult;
  if (allReadingsError) {
    console.error('Error fetching all readings:', allReadingsError);
    throw error(500, `Error fetching all readings: ${allReadingsError.message}`);
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

  // Get meter data separately since there's no foreign key relationship
  const meterIds = [...new Set(readings?.map(r => r.meter_id) || [])];
  const { data: meterData, error: meterError } = await supabase
    .from('meters')
    .select(`
      id,
      name,
      type,
      property_id
    `)
    .in('id', meterIds.length > 0 ? meterIds : [0]);

  if (meterError) {
    console.error('Error fetching meter data:', meterError);
    throw error(500, `Error fetching meter data: ${meterError.message}`);
  }

  // Create a map of meter data for easy lookup
  const meterMap = new Map(meterData?.map(m => [m.id, m]) || []);

  // Join readings with meter data
  const readingsWithMeters = readings?.map(reading => ({
    ...reading,
    meters: meterMap.get(reading.meter_id) || null
  })) || [];

  // Group by meter_id
  const grouped = readingsWithMeters.reduce((acc, r) => {
    acc[r.meter_id] = [...(acc[r.meter_id] || []), r];
    return acc;
  }, {} as Record<number, typeof readingsWithMeters>);

  // Create a map of the LAST billing date for each meter
  const meterLastBilledDates: Record<string, string> = {};
  billings?.forEach(b => {
    const key = String(b.meter_id);
    // Ensure we are always storing the most recent billing date
    if (!meterLastBilledDates[key] || b.billing_date > meterLastBilledDates[key]) {
      meterLastBilledDates[key] = b.billing_date;
    }
  });

  // IMPLEMENT THE NEW MONTHLY BILLING PERIOD LOGIC
  const displayedReadings = [];

  console.log('Processing billing periods for meters:', Object.keys(grouped));
  console.log('Meter last billed dates:', meterLastBilledDates);

  // Process each meter's readings
  for (const [meterId, meterReadings] of Object.entries(grouped)) {
    const sorted = meterReadings.sort(
      (a, b) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime()
    );

    console.log(`Processing meter ${meterId} with new monthly logic:`, {
      totalReadings: sorted.length,
      readingDates: sorted.map(r => r.reading_date),
      lastBilledDate: meterLastBilledDates[meterId]
    });

    // 1. Group all readings by month (e.g., "2024-08", "2024-09")
    const readingsByMonth = sorted.reduce((acc, reading) => {
      const monthKey = reading.reading_date.slice(0, 7); // "YYYY-MM"
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(reading);
      return acc;
    }, {} as Record<string, typeof sorted>);

    console.log(`Meter ${meterId} readings by month:`, Object.keys(readingsByMonth));

    // 2. Get a sorted list of the months that have readings
    const sortedMonths = Object.keys(readingsByMonth).sort();

    // 3. Iterate through the months to create billing periods
    for (let i = 1; i < sortedMonths.length; i++) {
      const currentMonthKey = sortedMonths[i];
      const previousMonthKey = sortedMonths[i - 1];

      // Get the last reading from the previous month
      const prevMonthReadings = readingsByMonth[previousMonthKey];
      const prev = prevMonthReadings[prevMonthReadings.length - 1];

      // Get the last reading from the current month
      const currentMonthReadings = readingsByMonth[currentMonthKey];
      const curr = currentMonthReadings[currentMonthReadings.length - 1];

      // This check is to ensure we have both readings to compare
      if (prev && curr) {
        const daysDiff = (new Date(curr.reading_date).getTime() - new Date(prev.reading_date).getTime()) / (1000 * 60 * 60 * 24);
        const consumption = curr.reading - prev.reading;
        const cost = consumption * (curr.rate_at_reading || 0);

        displayedReadings.push({
          ...curr,
          previous_reading: prev.reading,
          previous_reading_date: prev.reading_date,
          consumption,
          cost,
          days_diff: Math.round(daysDiff),
          // The period is now the current month's key
          period: currentMonthKey, 
        });

        console.log(`✅ Generated period for ${currentMonthKey}. From ${prev.reading_date} to ${curr.reading_date} (${Math.round(daysDiff)} days).`);
      }
    }

    // Fallback: if only one reading exists, show it without consumption
    if (sorted.length === 1) {
      const r = sorted[0];
      displayedReadings.push({
        ...r,
        previous_reading: null,
        consumption: null,
        cost: null,
        days_diff: null,
        period: r.reading_date.slice(0, 7),
      });
      console.log(`📝 Single reading fallback for meter ${meterId}`);
    }
  }

  console.log(`Total billing periods found: ${displayedReadings.length}`);

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
    readingsCount: displayedReadings.length || 0,
    readingDatesCount: uniqueDates.length || 0,
    sampleProperties: properties?.slice(0, 3) || []
  });

  // Process leases data
  const leases = leasesData?.map(lease => ({
    ...lease,
    tenants: lease.lease_tenants.filter(lt => lt.tenants !== null).map(lt => lt.tenants),
    roomName: lease.rental_unit 
      ? `${(lease.rental_unit as any).name} (${(lease.rental_unit as any).type})` 
      : 'Unknown Room'
  }));

  // Get last billed date for each lease-meter combination with more accurate tracking
  const leaseMeterBilledDates: Record<string, string> = {};
  const meterBilledDates: Record<string, string[]> = {}; // Track all billing dates per meter

  if (billings) {
    for (const billing of billings) {
      if (billing.meter_id && billing.lease_id) {
        const key = `${billing.meter_id}-${billing.lease_id}`;
        const newDate = billing.billing_date;

        if (!leaseMeterBilledDates[key] || new Date(newDate) > new Date(leaseMeterBilledDates[key])) {
          leaseMeterBilledDates[key] = newDate;
        }

        // Track all billing dates for each meter
        const meterKey = String(billing.meter_id);
        if (!meterBilledDates[meterKey]) {
          meterBilledDates[meterKey] = [];
        }
        meterBilledDates[meterKey].push(newDate);
      }
    }
  }

  // Update meterLastBilledDates to only show dates where bills were actually created
  // This will be used to show "✓ Billed" indicator in the UI
  const actualBilledDates: Record<string, string[]> = {};
  for (const [meterKey, dates] of Object.entries(meterBilledDates)) {
    actualBilledDates[meterKey] = [...new Set(dates)].sort();
  }

  // Group readings by month instead of individual dates
  const readingGroups = (allReadings || []).reduce((acc, reading) => {
    const date = new Date(reading.reading_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // "2025-06"
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(reading);
    return acc;
  }, {} as Record<string, any[]>);

  const previousReadingGroups = Object.entries(readingGroups).map(([monthKey, readings]) => ({
    date: monthKey, // Use month key as date
    readings,
    monthName: new Date(monthKey + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) // "June 2025"
  })).sort((a, b) => new Date(b.date + '-01').getTime() - new Date(a.date + '-01').getTime());

  // Return all the data needed for the page
  return {
    form,
    properties,
    meters,
    readings: displayedReadings, // Use the new grouped readings
    availableReadingDates: uniqueDates,
    rental_unitTenantCounts,
    leases,
    meterLastBilledDates,
    leaseMeterBilledDates,
    actualBilledDates, // Add actual billed dates for accurate tracking
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

      // REMOVED: Pre-emptive duplicate check to eliminate race condition
      // The database unique constraint will handle this more reliably

      // Transactional Data Insertion
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
            rate_at_reading: cost_per_unit, // Updated to use new column name
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