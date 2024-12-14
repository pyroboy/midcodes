import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { zod } from 'sveltekit-superforms/adapters';
import { db } from '$lib/db/db';
import { properties } from '$lib/db/schema';

const propertySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Property name is required'),
  address: z.string().min(1, 'Address is required'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.number().optional(),
  updatedBy: z.number().optional()
});

export const load = async () => {
  const propertyList = await db
    .select()
    .from(properties)
    .orderBy('name');

  const form = await superValidate(zod(propertySchema));

  return {
    form,
    properties: propertyList
  };
};

export const actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, zod(propertySchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db.insert(properties).values({
        name: form.data.name,
        address: form.data.address,
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
    const form = await superValidate(request, zod(propertySchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db
        .update(properties)
        .set({
          name: form.data.name,
          address: form.data.address,
          description: form.data.description,
          status: form.data.status,
        })
        .where(db.raw(`${properties.id} = ${form.data.id}`));

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  },

  delete: async ({ request }) => {
    const form = await superValidate(request, zod(propertySchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db
        .delete(properties)
        .where(db.raw(`${properties.id} = ${form.data.id}`));

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form });
    }
  }
};
