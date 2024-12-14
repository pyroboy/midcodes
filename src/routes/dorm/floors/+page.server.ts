import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { zod } from 'sveltekit-superforms/adapters';
import { db } from '$lib/db/db';
import { floors, properties } from '$lib/db/schema';

const floorSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Floor name is required'),
  propertyId: z.number().min(1, 'Property is required'),
  floorNumber: z.number().min(0, 'Floor number must be 0 or greater'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.number().optional(),
  updatedBy: z.number().optional()
});

export const load = async () => {
  const [floorList, propertyList] = await Promise.all([
    db
      .select({
        id: floors.id,
        name: floors.name,
        propertyId: floors.propertyId,
        floorNumber: floors.floorNumber,
        description: floors.description,
        status: floors.status,
        propertyName: properties.name
      })
      .from(floors)
      .leftJoin(properties, db.raw(`${floors.propertyId} = ${properties.id}`))
      .orderBy('propertyName', 'floorNumber'),
    
    db
      .select()
      .from(properties)
      .where(db.raw(`${properties.status} = 'ACTIVE'`))
      .orderBy('name')
  ]);

  const form = await superValidate(zod(floorSchema));

  return {
    form,
    floors: floorList,
    properties: propertyList
  };
};

export const actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, zod(floorSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db.insert(floors).values({
        name: form.data.name,
        propertyId: form.data.propertyId,
        floorNumber: form.data.floorNumber,
        description: form.data.description,
        status: form.data.status,
      });

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  update: async ({ request }) => {
    const form = await superValidate(request, zod(floorSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db
        .update(floors)
        .set({
          name: form.data.name,
          propertyId: form.data.propertyId,
          floorNumber: form.data.floorNumber,
          description: form.data.description,
          status: form.data.status,
        })
        .where(db.raw(`${floors.id} = ${form.data.id}`));

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  delete: async ({ request }) => {
    const form = await superValidate(request, zod(floorSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db
        .delete(floors)
        .where(db.raw(`${floors.id} = ${form.data.id}`));

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  }
};
