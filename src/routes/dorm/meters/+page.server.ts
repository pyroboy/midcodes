// src/routes/dorm/meters/+page.server.ts

import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { meterSchema } from './formSchema';
import { supabase } from '$lib/supabase';
import { db } from '$lib/db/db';

const schema = z.object({
  locationId: z.number().int().optional(),
  meterType: z.enum(['ELECTRICITY', 'WATER', 'GAS']),
  meterName: z.string().min(1, 'Meter name is required'),
  meterFloorLevel: z.number().int().min(0, 'Meter floor level must be 0 or greater'),
});

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return fail(401, { message: 'Unauthorized' });
  }

  const [{ data: userRole }, { data: meters }, { data: locations }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single(),

    db
      .select({
        id: meters.id,
        locationId: meters.locationId,
        meterType: meters.meterType,
        meterName: meters.meterName,
        meterFloorLevel: meters.meterFloorLevel,
        meterActive: meters.meterActive,
        createdAt: meters.createdAt,
        updatedAt: meters.updatedAt,
        readingsCount: db.fn.count(readings.id).as('readingsCount'),
        latestReading: db.fn.max(readings.readingValue).as('latestReading'),
      })
      .from(meters)
      .leftJoin(readings, db.raw(`${meters.id} = ${readings.meterId}`))
      .groupBy(meters.id)
      .orderBy(db.raw('createdAt DESC')),

    db.select().from(locations),
  ]);

  const form = await superValidate(zod(schema));
  const isAdminLevel = ['super_admin', 'property_admin'].includes(userRole?.role || '');
  const isUtility = userRole?.role === 'property_utility';
  const isMaintenance = userRole?.role === 'property_maintenance';

  return {
    form,
    meters,
    locations,
    userRole: userRole?.role || 'user',
    isAdminLevel,
    isUtility,
    isMaintenance,
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_utility'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const form = await superValidate(request, zod(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const [savedMeter] = await db.insert(meters).values({
        locationId: form.data.locationId,
        meterName: form.data.meterName,
        meterFloorLevel: form.data.meterFloorLevel,
        meterType: form.data.meterType,
        meterActive: form.data.meterActive,
      }).returning();

      console.log("Meter saved successfully:", savedMeter);
      return { form };
    } catch (err) {
      console.error("Error in create action:", err);
      return fail(500, { form, error: err instanceof Error ? err.message : 'Failed to add meter' });
    }
  },

  update: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin', 'property_utility'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const updateSchema = schema.extend({ id: z.number() });
    const form = await superValidate(request, zod(updateSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db.update(meters)
        .set({
          locationId: form.data.locationId,
          meterName: form.data.meterName,
          meterFloorLevel: form.data.meterFloorLevel,
          meterType: form.data.meterType,
          meterActive: form.data.meterActive,
        })
        .where(db.raw(`${meters.id} = ${form.data.id}`));

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form, error: err instanceof Error ? err.message : 'Failed to update meter' });
    }
  },

  delete: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) {
      return fail(401, { message: 'Unauthorized' });
    }

    const { data: userRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!['super_admin', 'property_admin'].includes(userRole?.role || '')) {
      return fail(403, { message: 'Insufficient permissions' });
    }

    const deleteSchema = z.object({ id: z.number() });
    const form = await superValidate(request, zod(deleteSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db.delete(meters).where(db.raw(`${meters.id} = ${form.data.id}`));
      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form, error: 'Failed to delete meter' });
    }
  },
};