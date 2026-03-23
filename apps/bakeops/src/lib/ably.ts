import Ably from 'ably';
import { getDb } from '$lib/db';

let client: Ably.Realtime | null = null;

export async function initAbly() {
	if (client) return client;

	// Get token from our API
	const res = await fetch('/api/ably-token');
	const tokenRequest = await res.json();

	client = new Ably.Realtime({ authCallback: async (_, cb) => {
		try {
			const r = await fetch('/api/ably-token');
			const t = await r.json();
			cb(null, t);
		} catch (e) {
			cb(e as Error, null);
		}
	}});

	// Activate the initial token
	client.auth.authorize(tokenRequest);

	const db = await getDb();

	// Subscribe to ingredient changes
	const ingredientsCh = client.channels.get('ingredients');
	ingredientsCh.subscribe((msg) => {
		const { event, data } = { event: msg.name, data: msg.data };
		if (event === 'ingredient:deleted') {
			db.ingredients.findOne(data.id).exec().then((doc: any) => doc?.remove());
		} else {
			db.ingredients.upsert(data);
		}
	});

	// Subscribe to recipe changes
	const recipesCh = client.channels.get('recipes');
	recipesCh.subscribe((msg) => {
		const { event, data } = { event: msg.name, data: msg.data };
		if (event === 'recipe:deleted') {
			db.recipes.findOne(data.id).exec().then((doc: any) => doc?.remove());
		} else {
			db.recipes.upsert(data);
		}
	});

	// Subscribe to batch changes
	const batchesCh = client.channels.get('batches');
	batchesCh.subscribe((msg) => {
		const { event, data } = { event: msg.name, data: msg.data };
		if (event === 'batch:deleted') {
			db.batches.findOne(data.id).exec().then((doc: any) => doc?.remove());
		} else {
			db.batches.upsert(data);
		}
	});

	return client;
}
