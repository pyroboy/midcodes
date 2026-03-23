import { getDb } from '$lib/db';
import type { RxQuery } from 'rxdb';

export function createRxStore<T>(
	collectionName: string,
	queryFn?: (col: any) => RxQuery
) {
	let state = $state<T[]>([]);
	let loading = $state(true);
	let sub: any = null;

	async function init() {
		const db = await getDb();
		const col = db[collectionName];
		if (!col) {
			loading = false;
			return;
		}
		const query = queryFn ? queryFn(col) : col.find();
		sub = query.$.subscribe((docs: any[]) => {
			state = docs.map((d: any) => d.toJSON());
			loading = false;
		});
	}

	function destroy() {
		sub?.unsubscribe();
	}

	return {
		get items() { return state; },
		get loading() { return loading; },
		init,
		destroy
	};
}
