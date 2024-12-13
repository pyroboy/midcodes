// src/routes/meters/+page.server.ts

import { superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/db/db';
import { meters, readings, locations } from '$lib/db/schema';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const schema = z.object({
  locationId: z.number().int().optional(),
  meterType: z.enum(['ELECTRICITY', 'WATER', 'GAS']),
//   meterNumber: z.string().min(1, 'Meter number is required'),
  meterName: z.string().min(1, 'Meter name is required'),
  meterFloorLevel: z.number().int().min(0, 'Meter floor level must be 0 or greater'),
});

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod(schema));
  
    const allLocations = await db.select().from(locations);
    const metersWithReadings = await db
      .select({
        id: meters.id,
        locationId: meters.locationId,
        meterType: meters.meterType,
        meterName: meters.meterName,
        meterFloorLevel: meters.meterFloorLevel,
        meterActive: meters.meterActive,
        // meterNumber: meters.meterNumber,
        createdAt: meters.createdAt,
        updatedAt: meters.updatedAt,
        readingsCount: db.fn.count(readings.id).as('readingsCount'),
        latestReading: db.fn.max(readings.readingValue).as('latestReading'),
      })
      .from(meters)
      .leftJoin(readings, db.raw(`${meters.id} = ${readings.meterId}`))
      .groupBy(meters.id)
      .orderBy(db.raw('createdAt DESC'));
  
    return { form, locations: allLocations, meters: metersWithReadings };
  };

export const actions: Actions = {
  create: async (event: RequestEvent) => {
    const form = await superValidate(event.request, zod(schema));

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
        // meterNumber: form.data.meterNumber,
      }).returning();

      console.log("Meter saved successfully:", savedMeter);
      return { form };
    } catch (err) {
      console.error("Error in create action:", err);
      return fail(500, { form, error: err instanceof Error ? err.message : 'Failed to add meter' });
    }
  },

  update: async (event: RequestEvent) => {
    const updateSchema = schema.extend({ id: z.number() });
    const form = await superValidate(event.request, zod(updateSchema));

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

  delete: async (event: RequestEvent) => {
    const deleteSchema = z.object({ id: z.number() });
    const form = await superValidate(event.request, zod(deleteSchema));

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
  }
};