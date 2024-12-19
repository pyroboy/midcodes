import { superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { zod } from 'sveltekit-superforms/adapters';
import { readingFormSchema, type Reading } from './schema';
import { format } from 'date-fns';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  const userRole = userRoleData?.role;
  const isAdmin = userRole === 'super_admin' || userRole === 'property_admin';
  const isStaff = userRole === 'staff' || userRole === 'utility' || userRole === 'maintenance';
  const canEdit = isAdmin || isStaff;

  // Get active meters with room and property information
  const { data: meters, error: metersError } = await supabase
    .from('meters')
    .select(`
      id,
      name,
      type,
      active,
      room:rooms (
        id,
        number,
        floor:floors (
          id,
          floor_number,
          wing,
          property:properties (
            id,
            name
          )
        )
      )
    `)
    .eq('active', true)
    .order('name');

  if (metersError) {
    console.error('Error fetching meters:', metersError);
    return fail(500, { error: 'Failed to fetch meters' });
  }

  const meterTypes = [...new Set(meters.map(meter => meter.type))];

  // Get latest overall reading date
  const { data: overallPreviousReading } = await supabase
    .from('readings')
    .select('reading_date')
    .order('reading_date', { ascending: false })
    .limit(1)
    .single();

  // Get previous readings for each meter
  const { data: previousReadings } = await supabase
    .from('readings')
    .select('*')
    .in('meter_id', meters.map(meter => meter.id))
    .order('created_at', { ascending: false });

  // Create a map of meter_id to latest reading
  const previousReadingsMap = previousReadings?.reduce((acc, reading) => {
    if (!acc[reading.meter_id] || new Date(reading.created_at) > new Date(acc[reading.meter_id].created_at)) {
      acc[reading.meter_id] = reading;
    }
    return acc;
  }, {} as Record<number, Reading>) ?? {};

  const latestOverallReadingDate = overallPreviousReading?.reading_date || format(new Date(), 'yyyy-MM-dd');
  const schema = readingFormSchema(previousReadingsMap, latestOverallReadingDate);
  const form = await superValidate(zod(schema));

  return {
    form,
    meters,
    meterTypes,
    previousReadings: previousReadingsMap,
    overallPreviousReadingDate: overallPreviousReading?.reading_date,
    latestOverallReadingDate,
    canEdit
  };
};

export const actions: Actions = {
  create: async (event) => {
    const session = await event.locals.getSession();
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    const userRole = userRoleData?.role;
    if (!userRole || !(userRole === 'super_admin' || userRole === 'property_admin' || userRole === 'staff' || userRole === 'utility' || userRole === 'maintenance')) {
      return fail(403, { error: 'Insufficient permissions' });
    }

    // Get previous readings for validation
    const { data: previousReadings } = await supabase
      .from('readings')
      .select('*')
      .order('created_at', { ascending: false });

    const previousReadingsMap = previousReadings?.reduce((acc, reading) => {
      if (!acc[reading.meter_id] || new Date(reading.created_at) > new Date(acc[reading.meter_id].created_at)) {
        acc[reading.meter_id] = reading;
      }
      return acc;
    }, {} as Record<number, Reading>) ?? {};

    const { data: latestReading } = await supabase
      .from('readings')
      .select('reading_date')
      .order('reading_date', { ascending: false })
      .limit(1)
      .single();

    const latestOverallReadingDate = latestReading?.reading_date || format(new Date(), 'yyyy-MM-dd');
    const schema = readingFormSchema(previousReadingsMap, latestOverallReadingDate);
    const form = await superValidate(event, zod(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      // Insert all readings in a single batch
      const { error: insertError } = await supabase
        .from('readings')
        .insert(
          form.data.readings.map((reading) => ({
            meter_id: reading.meter_id,
            reading_date: form.data.reading_date,
            reading: reading.reading_value,
            created_at: new Date().toISOString()
          }))
        );

      if (insertError) {
        console.error('Error inserting readings:', insertError);
        return fail(500, { form, error: 'Failed to add readings' });
      }

      const newForm = await superValidate(zod(schema));
      return { form: newForm };
    } catch (err) {
      console.error('Error inserting readings:', err);
      return fail(500, { form, error: err instanceof Error ? err.message : 'Failed to add readings' });
    }
  }
};