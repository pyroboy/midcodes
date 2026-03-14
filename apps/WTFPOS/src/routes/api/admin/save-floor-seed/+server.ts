import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { getCollectionStore } from '$lib/server/replication-store';

/**
 * DEV-ONLY: Export current tables + floor_elements from the server store
 * into src/lib/db/floor-seed.json so new seeds start with the designed layout.
 */
export async function POST() {
	if (!dev) {
		return json({ error: 'Only available in dev mode' }, { status: 403 });
	}

	try {
		const tablesStore = getCollectionStore('tables');
		const elementsStore = getCollectionStore('floor_elements');

		if (!tablesStore) {
			return json({ error: 'Tables collection not found in server store' }, { status: 500 });
		}

		// Pull all docs via replication pull (no checkpoint = from start, large batch)
		const tablesPull = tablesStore.pull(null, 10000);
		const elementsPull = elementsStore?.pull(null, 10000);

		const allTables = tablesPull.documents.filter((d: any) => !d._deleted);
		const allElements = (elementsPull?.documents ?? []).filter((d: any) => !d._deleted);

		// Strip runtime state — seed should start clean
		const tables = allTables.map((d: any) => ({
			id: d.id,
			locationId: d.locationId,
			number: d.number,
			label: d.label,
			zone: d.zone ?? 'main',
			capacity: d.capacity,
			x: d.x,
			y: d.y,
			width: d.width ?? 112,
			height: d.height ?? 112,
			borderRadius: d.borderRadius,
			borderWidth: d.borderWidth,
			rotation: d.rotation ?? 0,
			color: d.color,
			opacity: d.opacity,
			chairLayout: d.chairLayout,
			status: 'available',
			sessionStartedAt: null,
			elapsedSeconds: null,
			currentOrderId: null,
			billTotal: null,
			updatedAt: new Date().toISOString()
		}));

		const floorElements = allElements.map((d: any) => ({
			id: d.id,
			locationId: d.locationId,
			type: d.type,
			shape: d.shape ?? 'rect',
			x: d.x,
			y: d.y,
			width: d.width,
			height: d.height,
			label: d.label ?? '',
			color: d.color,
			opacity: d.opacity,
			rotation: d.rotation ?? 0,
			gridSize: d.gridSize,
			updatedAt: new Date().toISOString()
		}));

		// Remove undefined values so the JSON is clean
		const clean = (obj: any) => JSON.parse(JSON.stringify(obj));

		const seedData = { tables: clean(tables), floorElements: clean(floorElements) };
		const outPath = resolve('src/lib/db/floor-seed.json');
		writeFileSync(outPath, JSON.stringify(seedData, null, '\t') + '\n', 'utf-8');

		return json({
			success: true,
			tables: tables.length,
			floorElements: floorElements.length,
			path: 'src/lib/db/floor-seed.json'
		});
	} catch (err) {
		console.error('[save-floor-seed] Error:', err);
		return json({ error: String(err) }, { status: 500 });
	}
}
