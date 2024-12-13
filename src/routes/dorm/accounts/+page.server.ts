// src/routes/accounts/+page.server.ts

import { db } from '$lib/db/db';
import { accounts, leases } from '$lib/db/schema';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { eq } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { zod } from "sveltekit-superforms/adapters";

const accountInsertSchema = createInsertSchema(accounts,);

const leaseSelectSchema = createSelectSchema(leases);

export const load = async () => {
  const accountsData = await db.query.accounts.findMany({
    with: {
      lease: true
    }
  });

  const leasesData = await db.query.leases.findMany();

  const form = await superValidate(zod(accountInsertSchema));

  return {
    accounts: accountsData,
    leases: leasesData,
    form
  };
};

export const actions = {
  create: async ({ request }) => {
    const form = await superValidate(request, zod(accountInsertSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { id, ...accountData } = form.data;
      await db.insert(accounts).values(accountData);
    } catch (error) {
      console.error('Error creating account:', error);
      return fail(500, { form, error: 'Failed to create account' });
    }

    return { form };
  },

  update: async ({ request }) => {
    const form = await superValidate(request, zod(accountInsertSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const { id, ...updateData } = form.data;
      if (typeof id === 'number') {
        await db.update(accounts)
          .set(updateData)
          .where(eq(accounts.id, id));
      } else {
        throw new Error('Invalid ID for update operation');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      return fail(500, { form, error: 'Failed to update account' });
    }

    return { form };
  }
};