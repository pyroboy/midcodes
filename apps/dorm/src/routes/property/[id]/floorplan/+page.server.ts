import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { floorLayoutItems } from '$lib/server/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	const propertyId = parseInt(params.id, 10);
	if (isNaN(propertyId)) throw error(400, 'Invalid property ID');

	return { propertyId };
};

export const actions: Actions = {
	upsertItem: async ({ request, locals }) => {
		if (!locals.user) throw error(401, 'Unauthorized');

		const data = await request.formData();
		const id = data.get('id') ? parseInt(data.get('id') as string, 10) : null;
		const floorId = parseInt(data.get('floor_id') as string, 10);
		const rentalUnitId = data.get('rental_unit_id')
			? parseInt(data.get('rental_unit_id') as string, 10)
			: null;
		const itemType = data.get('item_type') as string;
		const gridX = parseInt(data.get('grid_x') as string, 10);
		const gridY = parseInt(data.get('grid_y') as string, 10);
		const gridW = parseInt(data.get('grid_w') as string, 10);
		const gridH = parseInt(data.get('grid_h') as string, 10);
		const label = (data.get('label') as string) || null;
		const color = (data.get('color') as string) || null;

		if (id) {
			const [updated] = await db
				.update(floorLayoutItems)
				.set({
					floorId,
					rentalUnitId,
					itemType: itemType as any,
					gridX,
					gridY,
					gridW,
					gridH,
					label,
					color,
					updatedAt: new Date()
				})
				.where(and(eq(floorLayoutItems.id, id), isNull(floorLayoutItems.deletedAt)))
				.returning();
			return { item: updated };
		} else {
			const [inserted] = await db
				.insert(floorLayoutItems)
				.values({
					floorId,
					rentalUnitId,
					itemType: itemType as any,
					gridX,
					gridY,
					gridW,
					gridH,
					label,
					color
				})
				.returning();
			return { item: inserted };
		}
	},

	batchWalls: async ({ request, locals }) => {
		if (!locals.user) throw error(401, 'Unauthorized');

		const data = await request.formData();
		const payload = JSON.parse(data.get('payload') as string);
		const { add, removeIds } = payload as {
			add: { floor_id: number; grid_x: number; grid_y: number; grid_w: number; grid_h: number; label?: string | null }[];
			removeIds: number[];
		};

		const results: any[] = [];

		// Batch insert new walls
		if (add.length > 0) {
			const inserted = await db.insert(floorLayoutItems).values(
				add.map((w: any) => ({
					floorId: w.floor_id,
					itemType: 'WALL' as const,
					gridX: w.grid_x,
					gridY: w.grid_y,
					gridW: w.grid_w,
					gridH: w.grid_h,
					label: w.label ?? null
				}))
			).returning();
			results.push(...inserted);
		}

		// Batch soft-delete removed walls
		if (removeIds.length > 0) {
			for (const id of removeIds) {
				await db.update(floorLayoutItems)
					.set({ deletedAt: new Date(), updatedAt: new Date() })
					.where(eq(floorLayoutItems.id, id));
			}
		}

		return { items: results, removed: removeIds.length };
	},

	deleteItem: async ({ request, locals }) => {
		if (!locals.user) throw error(401, 'Unauthorized');

		const data = await request.formData();
		const id = parseInt(data.get('id') as string, 10);
		if (isNaN(id)) throw error(400, 'Invalid item ID');

		await db
			.update(floorLayoutItems)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(eq(floorLayoutItems.id, id));

		return { deleted: true };
	}
};
