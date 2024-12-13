import { superValidate, withFiles } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/db/db';
import { readings, meters } from '$lib/db/schema';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { createSchema, type Schema } from './schema';
import { format } from 'date-fns';

export const load: PageServerLoad = async () => {
  const allMeters = await db.query.meters.findMany({
    where: eq(meters.meterActive, true),
    orderBy: [desc(meters.meterFloorLevel), desc(meters.meterName)]
  });

  const meterTypes = [...new Set(allMeters.map(meter => meter.meterType))];

  const overallPreviousReading = await db.query.readings.findFirst({
    orderBy: [desc(readings.readingDate)],
  });

  const previousReadings = await Promise.all(
    allMeters.map(async (meter) => {
      const latestReading = await db.query.readings.findFirst({
        where: eq(readings.meterId, meter.id),
        orderBy: [desc(readings.createdAt)],
      });
      return {
        meterId: meter.id,
        latestReading
      };
    })
  );

  const previousReadingsMap = previousReadings.reduce((acc, curr) => {
    acc[curr.meterId] = curr.latestReading || {
      id: 0,
      meterId: curr.meterId,
      readingDate: '',
      readingValue: 0,
      createdAt: new Date(0) // Unix epoch
    };
    return acc;
  }, {} as Record<number, NonNullable<typeof readings.$inferSelect>>);

  const latestOverallReadingDate = overallPreviousReading?.readingDate || format(new Date(), 'yyyy-MM-dd');
  const schema = createSchema(previousReadingsMap, latestOverallReadingDate);
  const form = await superValidate(zod<Schema>(schema));

  return { 
    form, 
    meters: allMeters, 
    meterTypes,
    previousReadings: previousReadingsMap,
    overallPreviousReadingDate: overallPreviousReading?.readingDate,
    latestOverallReadingDate
  };
};

export const actions: Actions = {
  create: async (event) => {
    const previousReadings = await loadPreviousReadings();
    const latestOverallReadingDate = await getLatestOverallReadingDate();
    const schema = createSchema(previousReadings, latestOverallReadingDate);
    const form = await superValidate(event, zod<Schema>(schema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db.transaction(async (tx) => {
        for (const reading of form.data.readings) {
          await tx.insert(readings).values({
            meterId: reading.meterId,
            readingDate: form.data.readingDate,
            readingValue: reading.readingValue,
          });
        }
      });

      // Return a new, empty form after successful submission
      const newForm = await superValidate(zod<Schema>(schema));
      return { form: newForm };
    } catch (err) {
      console.error('Error inserting readings:', err);
      return fail(500, { form, error: err instanceof Error ? err.message : 'Failed to add readings' });
    }
  },
};

async function getLatestOverallReadingDate() {
  const overallPreviousReading = await db.query.readings.findFirst({
    orderBy: [desc(readings.readingDate)],
  });
  return overallPreviousReading?.readingDate || format(new Date(), 'yyyy-MM-dd');
}

async function loadPreviousReadings() {
  const allMeters = await db.query.meters.findMany({
    where: eq(meters.meterActive, true),
    orderBy: [desc(meters.meterFloorLevel), desc(meters.meterName)]
  });

  const previousReadings = await Promise.all(
    allMeters.map(async (meter) => {
      const latestReading = await db.query.readings.findFirst({
        where: eq(readings.meterId, meter.id),
        orderBy: [desc(readings.createdAt)],
      });
      return {
        meterId: meter.id,
        latestReading: latestReading || {
          id: 0,
          meterId: meter.id,
          readingDate: '',
          readingValue: 0,
          createdAt: new Date(0) // Unix epoch
        }
      };
    })
  );

  return previousReadings.reduce((acc, curr) => {
    acc[curr.meterId] = {
      readingValue: curr.latestReading.readingValue,
      readingDate: curr.latestReading.readingDate
    };
    return acc;
  }, {} as Record<number, { readingValue: number; readingDate: string }>);
}