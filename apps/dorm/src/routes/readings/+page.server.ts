import { superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { readingFormSchema, type Reading, type Meter, type meter_location_type, type utility_type, type meter_status } from './schema';
import { format } from 'date-fns';
import { zod } from 'sveltekit-superforms/adapters';

type PostgrestResponse = {
  id: number;
  name: string;
  type: utility_type;
  location_type: meter_location_type;
  property_id: number | null;
  floor_id: number | null;
  rental_unit_id: number | null;
  is_active: boolean;
  status: meter_status;
  initial_reading: number;
  unit_rate: number;
  notes: string | null;
  created_at: string;
  rental_unit: {
    id: number;
    number: string;
    floor: {
      id: number;
      floor_number: number;
      wing: string | null;
      property: {
        id: number;
        name: string;
      };
    };
  } | null;
}[];

const ADMIN_ROLES = ['super_admin', 'property_admin', 'property_manager'] as const;
const STAFF_ROLES = ['property_maintenance', 'property_utility', 'property_frontdesk'] as const;

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.safeGetSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  const userRole = userRoleData?.role;
  const isAdmin = ADMIN_ROLES.includes(userRole as typeof ADMIN_ROLES[number]);
  const isStaff = STAFF_ROLES.includes(userRole as typeof STAFF_ROLES[number]);
  const canEdit = isAdmin || isStaff;

  const { data: dbMeters, error: metersError } = await supabase
    .from('meters')
    .select(`
      id,
      name,
      type,
      location_type,
      property_id,
      floor_id,
      rental_unit_id,
      is_active,
      status,
      initial_reading,
      unit_rate,
      notes,
      created_at,
      rental_unit:rental_unit (
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
    .eq('is_active', true)
    .order('name') as { data: PostgrestResponse | null; error: any };

  if (metersError) {
    console.error('Error fetching meters:', metersError);
    return fail(500, { message: 'Failed to load meters' });
  }

  const meters: Meter[] = (dbMeters || []).map((meter) => ({
    id: meter.id,
    name: meter.name,
    type: meter.type,
    location_type: meter.location_type,
    property_id: meter.property_id,
    floor_id: meter.floor_id,
    rental_unit_id: meter.rental_unit_id,
    is_active: meter.is_active,
    status: meter.status,
    initial_reading: meter.initial_reading,
    unit_rate: meter.unit_rate,
    notes: meter.notes,
    created_at: meter.created_at,
    rental_unit: meter.rental_unit || undefined
  }));

  const { data: latestReading } = await supabase
    .from('readings')
    .select('reading_date')
    .order('reading_date', { ascending: false })
    .limit(1)
    .single();

  const latestOverallReadingDate = latestReading?.reading_date || format(new Date(), 'yyyy-MM-dd');

  const { data: previousReadings } = await supabase
    .from('readings')
    .select('*')
    .in(
      'meter_id',
      meters.map(m => m.id)
    )
    .order('reading_date', { ascending: false });

  const previousReadingsMap: Record<number, Reading> = {};
  if (previousReadings) {
    for (const reading of previousReadings) {
      if (!previousReadingsMap[reading.meter_id]) {
        previousReadingsMap[reading.meter_id] = reading;
      }
    }
  }

  const schema = readingFormSchema(previousReadingsMap, latestOverallReadingDate);
  const form = await superValidate(zod(schema));

  return {
    meters,
    form,
    canEdit,
    latestOverallReadingDate,
    previousReadings: previousReadingsMap
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const session = await locals.safeGetSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    const userRole = userRoleData?.role;
    const isAdmin = ADMIN_ROLES.includes(userRole as typeof ADMIN_ROLES[number]);
    const isStaff = STAFF_ROLES.includes(userRole as typeof STAFF_ROLES[number]);
    const canEdit = isAdmin || isStaff;

    if (!canEdit) {
      return fail(403, { message: 'You do not have permission to add readings' });
    }

    const { data: previousReadings } = await supabase
      .from('readings')
      .select('*')
      .order('reading_date', { ascending: false });

    const previousReadingsMap: Record<number, Reading> = {};
    if (previousReadings) {
      for (const reading of previousReadings) {
        if (!previousReadingsMap[reading.meter_id]) {
          previousReadingsMap[reading.meter_id] = reading;
        }
      }
    }

    const { data: latestReading } = await supabase
      .from('readings')
      .select('reading_date')
      .order('reading_date', { ascending: false })
      .limit(1)
      .single();

    const latestOverallReadingDate = latestReading?.reading_date || format(new Date(), 'yyyy-MM-dd');

    const schema = readingFormSchema(previousReadingsMap, latestOverallReadingDate);
    const form = await superValidate(request, zod(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const { reading_date, readings } = form.data;

    const { error: insertError } = await supabase.from('readings').insert(
      readings.map((r) => ({
        meter_id: r.meter_id,
        reading: r.reading_value,
        reading_date
      }))
    );

    if (insertError) {
      console.error('Error inserting readings:', insertError);
      return fail(500, {
        form,
        message: 'Failed to save readings'
      });
    }

    return { form };
  }
};