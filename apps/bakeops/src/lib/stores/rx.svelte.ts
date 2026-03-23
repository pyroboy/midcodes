import { getDb } from '$lib/db';

interface RxStore<T> {
	items: T[];
	loading: boolean;
}

function createRxStore<T>(collectionName: string): RxStore<T> {
	let items = $state<T[]>([]);
	let loading = $state(true);

	if (typeof window !== 'undefined') {
		getDb().then((db) => {
			const col = (db as any)[collectionName];
			if (!col) return;

			col.find().$.subscribe((docs: any[]) => {
				items = docs.map((d: any) => d.toJSON());
				loading = false;
			});
		});
	}

	return {
		get items() { return items; },
		get loading() { return loading; }
	};
}

export const ingredientsStore = createRxStore<any>('ingredients');
export const recipesStore = createRxStore<any>('recipes');
export const batchesStore = createRxStore<any>('batches');

export async function upsertIngredient(data: any) {
	const db = await getDb();
	await db.ingredients.upsert(data);
}

export async function upsertRecipe(data: any) {
	const db = await getDb();
	await db.recipes.upsert(data);
}

export async function upsertBatch(data: any) {
	const db = await getDb();
	await db.batches.upsert(data);
}

export async function removeFromCollection(collection: string, id: string) {
	const db = await getDb();
	const doc = await (db as any)[collection].findOne(id).exec();
	if (doc) await doc.remove();
}
