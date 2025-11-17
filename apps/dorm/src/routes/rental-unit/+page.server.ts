import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { rental_unitSchema } from './formSchema';
import type { Database } from '$lib/database.types';
import { cache, cacheKeys, CACHE_TTL } from '$lib/services/cache';

type DBRentalUnit = Database['public']['Tables']['rental_unit']['Row'];
type DBProperty = Database['public']['Tables']['properties']['Row'];
type DBFloor = Database['public']['Tables']['floors']['Row'];

export type RentalUnitResponse = DBRentalUnit & {
	property: Pick<DBProperty, 'id' | 'name'> | null;
	floor: Pick<DBFloor, 'id' | 'property_id' | 'floor_number' | 'wing'> | null;
};

// Separate async function for loading rental units data with caching
async function loadRentalUnitsData(locals: any) {
	const { user, permissions } = await locals.safeGetSession();
	const hasAccess = permissions.includes('properties.create');

	if (!hasAccess) {
		return { rentalUnits: [], properties: [], floors: [] };
	}

	// Check cache first
	const cacheKey = cacheKeys.rentalUnits();
	const cached = cache.get<any>(cacheKey);
	if (cached) {
		console.log('🎯 CACHE HIT: Returning cached rental units data');
		return cached;
	}

	console.log('💾 CACHE MISS: Fetching rental units from database');

	try {
		const [rentalUnitsResult, propertiesResult, floorsResult] = await Promise.all([
			locals.supabase
				.from('rental_unit')
				.select(
					`
          *,
          property:properties!rental_unit_property_id_fkey(id, name),
          floor:floors!rental_unit_floor_id_fkey(id, property_id, floor_number, wing)
        `
				)
				.order('property_id, floor_id, number'),

			locals.supabase.from('properties').select('id, name').eq('status', 'ACTIVE').order('name'),

			locals.supabase
				.from('floors')
				.select('id, property_id, floor_number, wing, status')
				.eq('status', 'ACTIVE')
				.order('property_id, floor_number')
		]);

		if (rentalUnitsResult.error) {
			console.error('Rental Units Query Error:', rentalUnitsResult.error);
			throw error(500, 'Failed to load rental units');
		}

		// Map the relationships manually
		const rentalUnits = (rentalUnitsResult.data || []).map((unit) => ({
			...unit,
			property: unit.property || null,
			floor: unit.floor || null
		}));

		const result = {
			rentalUnits,
			properties: propertiesResult.data || [],
			floors: floorsResult.data || []
		};

		// Cache the result
		cache.set(cacheKey, result, CACHE_TTL.MEDIUM);
		console.log('✅ Cached rental units data');

		return result;
	} catch (err) {
		console.error('Error in database queries:', err);
		return {
			rentalUnits: [],
			properties: [],
			floors: []
		};
	}
}

export const load: PageServerLoad = async ({ locals, depends }) => {
	// Set up cache invalidation dependency
	depends('app:rental-units');

	const { user, permissions } = await locals.safeGetSession();
	const hasAccess = permissions.includes('properties.create');

	if (!hasAccess) {
		throw error(401, 'Unauthorized');
	}

	const form = await superValidate(zod(rental_unitSchema));

	// Return minimal data for instant navigation with lazy loading
	return {
		form,
		rental_unit: [],
		rentalUnits: [],
		properties: [],
		floors: [],
		lazy: true,
		rentalUnitsPromise: loadRentalUnitsData(locals)
	};
};

export const actions: Actions = {
	create: async ({ request, locals: { supabase } }: RequestEvent) => {
		const form = await superValidate(request, zod(rental_unitSchema));

		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		// Check for duplicate rental unit number in the same property and floor
		const { data: existingUnit } = await supabase
			.from('rental_unit')
			.select('id')
			.eq('property_id', form.data.property_id)
			.eq('floor_id', form.data.floor_id || null)
			.eq('number', form.data.number)
			.maybeSingle();

		if (existingUnit) {
			form.errors.number = ['This unit number already exists on this floor'];
			return fail(400, { form });
		}

		const { error: insertError } = await supabase.from('rental_unit').insert({
			...form.data,
			floor_id: form.data.floor_id || null
		});

		if (insertError) {
			console.error('Error creating rental unit:', insertError);
			return fail(500, { form });
		}

		// Invalidate rental units cache
		cache.delete(cacheKeys.rentalUnits());
		console.log('🗑️ Invalidated rental units cache');

		return { form };
	},

	update: async ({ request, locals: { supabase } }: RequestEvent) => {
		const formData = await request.formData();
		const rawForm = await superValidate(formData, zod(rental_unitSchema));

		// Remove embedded objects before validation
		const { property, floor, ...updateData } = rawForm.data;

		// Validate only the update data
		const form = await superValidate(updateData, zod(rental_unitSchema));

		if (!form.valid) {
			console.error('Form validation failed:', form.errors);
			return fail(400, { form });
		}

		const { error: updateError } = await supabase
			.from('rental_unit')
			.update({
				...updateData,
				updated_at: new Date().toISOString()
			} satisfies Database['public']['Tables']['rental_unit']['Update'])
			.eq('id', form.data.id);

		if (updateError) {
			console.error('Error updating rental unit:', updateError);
			if (updateError.message?.includes('Policy check failed')) {
				form.errors._errors = ['You do not have permission to update rental units'];
				return fail(403, { form });
			}
			return fail(500, { form, message: 'Failed to update rental unit' });
		}

		// Invalidate rental units cache
		cache.delete(cacheKeys.rentalUnits());
		console.log('🗑️ Invalidated rental units cache');

		return { form };
	},

	delete: async ({ request, locals: { supabase } }: RequestEvent) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id || typeof id !== 'string') {
			return fail(400, { message: 'Invalid rental unit ID' });
		}

		const rentalUnitId = parseInt(id, 10);
		if (isNaN(rentalUnitId)) {
			return fail(400, { message: 'Invalid rental unit ID format' });
		}

		const { error: deleteError } = await supabase
			.from('rental_unit')
			.delete()
			.eq('id', rentalUnitId);

		if (deleteError) {
			console.error('Error deleting rental unit:', deleteError);
			if (deleteError.message?.includes('Policy check failed')) {
				return fail(403, { message: 'You do not have permission to delete rental units' });
			}
			if (deleteError.code === '23503') {
				return fail(400, {
					message: 'Cannot delete rental unit because it is referenced by other records'
				});
			}
			return fail(500, { message: 'Failed to delete rental unit' });
		}

		// Invalidate rental units cache
		cache.delete(cacheKeys.rentalUnits());
		console.log('🗑️ Invalidated rental units cache');

		return { success: true };
	}
};
