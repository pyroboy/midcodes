// src/routes/tenants/+page.server.ts

import { superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
// import { createInsertSchema } from 'drizzle-zod';
import { db } from '$lib/db/db';
import { tenants, locations, leaseTenants } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { tenantHooks } from '$lib/server/tenantHooks';

// const tenantSchema = createInsertSchema(tenants);

const schema = z.object({
  // ...tenantSchema.shape,
  mainleaseId: z.number().int().positive().optional(),
  id: z.number().optional(),
  tenantName: z.string().min(1, 'Name is required'),
  tenantContactNumber: z.string().optional(),
  locationId: z.number().int().positive().optional(),
});

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod(schema));
  const allTenants = await db.query.tenants.findMany({
    with: {
      location: true,
      leaseTenants: {
        with: {
          lease: true
        }
      }
    },
    limit: 100 // Add a limit to prevent performance issues with large datasets
  });

  const allLocations = await db.query.locations.findMany();

  const allLeases = await db.query.leases.findMany({
    with: {
      leaseTenants: {
        with: {
          tenant: true
        }
      }
    },
    orderBy: (leases, { desc }) => [desc(leases.leaseStartDate)]
  });

  return { form, tenants: allTenants, locations: allLocations, leases: allLeases };
};

export const actions: Actions = {
  create: async (event) => {
    const form = await superValidate(event, zod(schema));
    if (!form.valid) return fail(400, { form });

    try {
      const result = await db.transaction(async (tx) => {
        if (form.data.locationId) {
          const location = await tx.query.locations.findFirst({
            where: eq(locations.id, form.data.locationId)
          });
          if (!location) {
            throw new Error('Invalid location ID');
          }
        }

        const [savedTenant] = await tx.insert(tenants).values({
         ...form.data,
          createdBy: 1, // Replace with actual user ID
        }).returning();

        await tenantHooks.afterSave(savedTenant, tx);

        return savedTenant;
      });

      // form.data = {};
      return { form, success: true };
    } catch (err) {
      console.error(err);
      return fail(500, { form, error: err instanceof Error ? err.message : 'Failed to add tenant' });
    }
  },


  update: async (event: RequestEvent) => {
    const form = await superValidate(event.request, zod(schema));
    if (!form.valid) return fail(400, { form });

    try {
      await db.transaction(async (tx) => {
        const existingTenant = await tx.query.tenants.findFirst({
          where: eq(tenants.id, form.data.id!)
        });
        if (!existingTenant) {
          throw new Error('Tenant not found');
        }

        // Check if location exists
        if (form.data.locationId) {
          const location = await tx.query.locations.findFirst({
            where: eq(locations.id, form.data.locationId)
          });
          if (!location) {
            throw new Error('Invalid location ID');
          }
        }

        const [updatedTenant] = await tx.update(tenants)
          .set({
            tenantName: form.data.tenantName ?? existingTenant.tenantName,
            tenantContactNumber: form.data.tenantContactNumber ?? existingTenant.tenantContactNumber,
            locationId: form.data.locationId ?? existingTenant.locationId,
            updatedAt: new Date(),
            updatedBy: 1, // Replace with actual user ID
          })
          .where(eq(tenants.id, form.data.id!))
          .returning();
      });

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form, error: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const tenantId = Number(data.get('id'));

    if (!tenantId) {
      return fail(400, { error: 'Invalid tenant ID' });
    }

    try {
      await db.transaction(async (tx) => {
        // Delete associated lease-tenant relationships
        await tx.delete(leaseTenants).where(eq(leaseTenants.tenantId, tenantId));
        
        // Delete the tenant
        await tx.delete(tenants).where(eq(tenants.id, tenantId));
      });
      return { success: true };
    } catch (err) {
      console.error(err);
      return fail(500, { error: err instanceof Error ? err.message : 'Failed to delete tenant' });
    }
  }
}
