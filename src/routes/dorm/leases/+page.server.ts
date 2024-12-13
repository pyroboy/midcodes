// src/routes/leases/+page.server.ts

import { superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/db/db';
import { leases, leaseTenants, tenants, locations } from '$lib/db/schema';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import _ from 'lodash';
import { leaseHooks } from '$lib/server/leaseHooks';


const schema = z.object({
    leaseType: z.string(),
    leaseStatus: z.string(),
    leaseStartDate: z.date(),
    leaseEndDate: z.date(),
    locationId: z.number(),
    tenantIds: z.array(z.number()).min(1, 'At least one tenant must be selected'),
  });

let allLocations: any[] = [];

export const load: PageServerLoad = async () => {
  const form = await superValidate(zod(schema));
  const allTenants = await db.select().from(tenants);
  const allLocations = await db.select().from(locations);
  const allLeases = await db.query.leases.findMany({
    with: {
      leaseTenants: {
        with: {
          tenant: true,
        },
      },
      location: true,
    },
  });

  return { form, tenants: allTenants, locations: allLocations, leases: allLeases };
};

export const actions: Actions = {
  create: async (event) => {
    const form = await superValidate(event.request, zod(schema));

    if (!form.valid) {
      return fail(400, { form });
    }
    
    try {
      const result = await db.transaction(async (tx) => {
        const selectedLocation:typeof locations = allLocations.find(location => location.id === form.data.locationId);
        const selectedLocationName = selectedLocation?.locationName || 'Unknown Location';
        let leaseName = '';

        console.log("form.data.leaseType", form.data.leaseType);
        if (form.data.leaseType === 'BEDSPACER') {
          const tenant = await tx.query.tenants.findFirst({
            where: eq(tenants.id, form.data.tenantIds[0])
          });
          leaseName = `BedSpacer-${selectedLocationName} - Floor ${selectedLocation?.locationFloorLevel} - ${tenant?.tenantName}`;
        } else {
          leaseName = `PrivateRoom-${selectedLocationName} - Floor ${selectedLocation?.locationFloorLevel} - (${form.data.tenantIds.length} Tenants)`;
        }

        await leaseHooks.beforeSave(form.data, tx);
        const { leaseName: _, ...rest } = form.data;
        const [savedLease] = await tx.insert(leases).values({
          leaseName,
          ...rest,
          createdBy: 1,
        }).returning();

        await tx.insert(leaseTenants).values(
          form.data.tenantIds.map(tenantId => ({
            leaseId: savedLease.id,
            tenantId,
          }))
        );

        // Execute after save hook
        await leaseHooks.afterSave(savedLease, tx);

        return savedLease;
      });

      console.log("Lease saved successfully:", result);
      return { form };
    } catch (err) {
      console.error("Error in create action:", err);
      return fail(500, { form, error: err instanceof Error ? err.message : 'Failed to add lease' });
    }
  },

  update: async (event: RequestEvent) => {
    const form = await superValidate(event.request, zod(schema));
    if (!form.valid) return fail(400, { form });

    try {
      await db.transaction(async (tx) => {
        const selectedLocation:typeof locations = allLocations.find(location => location.id === form.data.locationId);
        const selectedLocationName = selectedLocation?.locationName || 'Unknown Location';
        let leaseName = '';

        console.log("form.data.leaseType", form.data.leaseType);
        if (form.data.leaseType === 'BEDSPACER') {
          const tenant = await tx.query.tenants.findFirst({
            where: eq(tenants.id, form.data.tenantIds[0])
          });
          leaseName = `BedSpacer-${selectedLocationName} - Floor ${selectedLocation?.locationFloorLevel} - ${tenant?.tenantName}`;
        } else {
          leaseName = `PrivateRoom-${selectedLocationName} - Floor ${selectedLocation?.locationFloorLevel} - (${form.data.tenantIds.length} Tenants)`;
        }
        const { leaseName: _, ...rest } = form.data;
        await tx.update(leases)
          .set({
            leaseName,
          ...rest,
            updatedAt: new Date(),
            updatedBy: 1, // Replace with actual user ID
          })
          .where(eq(leases.id, form.data.id!));

        // Update lease-tenant associations
        await tx.delete(leaseTenants).where(eq(leaseTenants.leaseId, form.data.id!));
        await tx.insert(leaseTenants).values(
          form.data.tenantIds.map(tenantId => ({
            leaseId: form.data.id!,
            tenantId,
          }))
        );
      });

      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form, error: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
  },

  delete: async (event: RequestEvent) => {
    const form = await superValidate(event.request, zod(schema));
    if (!form.valid) return fail(400, { form });

    try {
      await db.transaction(async (tx) => {
        await tx.delete(leaseTenants).where(eq(leaseTenants.leaseId, form.data.id!));
        await tx.delete(leases).where(eq(leases.id, form.data.id!));
      });
      return { form };
    } catch (err) {
      console.error(err);
      return fail(500, { form, error: 'Failed to delete lease' });
    }
  }
};