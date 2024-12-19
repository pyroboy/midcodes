// src/routes/dorm/meters/+page.server.ts

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { meterSchema } from './formSchema';
import { supabase } from '$lib/supabase';

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  // Get user role and check permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const isAdminLevel = profile?.role === 'super_admin' || profile?.role === 'property_admin';
  const isUtility = profile?.role === 'utility';
  const isMaintenance = profile?.role === 'maintenance';

  if (!isAdminLevel && !isUtility && !isMaintenance) {
    return fail(403, { message: 'Forbidden' });
  }

  const [{ data: meters }, { data: rooms }] = await Promise.all([
    supabase
      .from('meters')
      .select(`
        *,
        room:rooms(
          id,
          room_number,
          floor:floors(
            id,
            floor_number,
            wing,
            property:properties(
              id,
              name
            )
          )
        ),
        created_by_user:profiles!created_by(full_name),
        updated_by_user:profiles!updated_by(full_name),
        readings:readings(
          id,
          reading_value,
          reading_date
        )
      `)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('rooms')
      .select(`
        id,
        room_number,
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
      .eq('status', 'ACTIVE')
      .order('room_number')
  ]);

  const form = await superValidate(zod(meterSchema));

  return {
    form,
    meters,
    rooms,
    isAdminLevel,
    isUtility,
    isMaintenance
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const form = await superValidate(request, zod(meterSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAdminLevel = profile?.role === 'super_admin' || profile?.role === 'property_admin';
    const isUtility = profile?.role === 'utility';

    if (!isAdminLevel && !isUtility) {
      return fail(403, { message: 'Forbidden' });
    }

    const { error } = await supabase
      .from('meters')
      .insert({
        ...form.data,
        created_by: session.user.id,
        updated_by: null
      });

    if (error) {
      return fail(500, { form, message: error.message });
    }

    return { form };
  },

  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const form = await superValidate(request, zod(meterSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAdminLevel = profile?.role === 'super_admin' || profile?.role === 'property_admin';
    const isUtility = profile?.role === 'utility';

    if (!isAdminLevel && !isUtility) {
      return fail(403, { message: 'Forbidden' });
    }

    const { error } = await supabase
      .from('meters')
      .update({
        ...form.data,
        updated_by: session.user.id
      })
      .eq('id', form.data.id);

    if (error) {
      return fail(500, { form, message: error.message });
    }

    return { form };
  },

  delete: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const form = await superValidate(request, zod(meterSchema));

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAdminLevel = profile?.role === 'super_admin' || profile?.role === 'property_admin';

    if (!isAdminLevel) {
      return fail(403, { message: 'Forbidden' });
    }

    // Check if meter has readings
    const { data: readings } = await supabase
      .from('readings')
      .select('id')
      .eq('meter_id', form.data.id)
      .limit(1);

    if (readings && readings.length > 0) {
      return fail(400, { 
        form, 
        message: 'Cannot delete meter with existing readings. Please archive it instead.' 
      });
    }

    const { error } = await supabase
      .from('meters')
      .delete()
      .eq('id', form.data.id);

    if (error) {
      return fail(500, { form, message: error.message });
    }

    return { form };
  }
};