import type { Actions, PageServerLoad } from './$types';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { locationSchema } from '$lib/db/zodschema';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/db/db';
import { locations, type Locations ,tenants} from '$lib/db/schema';

export const load: PageServerLoad = async () => {
    const locationForm = await superValidate(zod(locationSchema));
    
    const countLocations = await db.select({
        id: locations.id,
        locationName: locations.locationName,
        locationFloorLevel: locations.locationFloorLevel,
        locationCapacity: locations.locationCapacity,
        locationStatus: locations.locationStatus,
        locationRentRate: locations.locationRentRate,
        tenantCount: sql<number>`count(${tenants.id})`.as('tenant_count'),
    })
    .from(locations)
    .leftJoin(tenants, eq(locations.id, tenants.locationId))
    .groupBy(locations.id)
    .orderBy(locations.id);

    return { locationForm, countLocations };
};

export const actions: Actions = {
    create: async ({ request }) => {
        const locationForm = await superValidate(request, zod(locationSchema));
        console.log('create', locationForm);
        
        if (!locationForm.valid) return fail(400, { locationForm });
        
        try {
            await db.insert(locations).values({
              ...locationForm.data,

                createdBy: 1, // Replace with actual user ID
            });
            return message(locationForm, { text: 'Location created successfully!' });
        } catch (error) {
            console.error(error);
            return message(locationForm, { text: 'Failed to create location.', status: 500 });
        }
    },
    update: async ({ request }) => {
        const locationForm = await superValidate(request, zod(locationSchema));
        console.log('update', locationForm);
        
        if (!locationForm.valid) return fail(400, { locationForm });
        
        try {
            const { id, ...updateData } = locationForm.data as Locations;
            await db.update(locations).set(updateData).where(eq(locations.id, id));
            return message(locationForm, { text: 'Location updated successfully!' });
        } catch (error) {
            console.error(error);
            return message(locationForm, { text: 'Failed to update location.', status: 500 });
        }
    },
    delete: async ({ request }) => {
        const data = await request.formData();
        const id = Number(data.get('id'));

        if (!id) {
            return fail(400, { message: 'Invalid location ID' });
        }

        try {
            await db.delete(locations).where(eq(locations.id, id));
            return { success: true };
        } catch (error) {
            console.error(error);
            return fail(500, { message: 'Failed to delete location' });
        }
    }
};