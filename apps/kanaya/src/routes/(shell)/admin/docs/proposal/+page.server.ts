import { getAllTargets } from '$lib/remote/pipeline.remote';

export async function load() {
	const targets = await getAllTargets();
	return { targets };
}
