import type { MapMarker } from '$lib/types';

let center = $state<[number, number]>([10.3157, 123.8854]);
let zoom = $state(12);
let markers = $state<MapMarker[]>([]);
let selectedMarkerId = $state<string | null>(null);

export const mapStore = {
	get center() { return center; },
	get zoom() { return zoom; },
	get markers() { return markers; },
	get selectedMarkerId() { return selectedMarkerId; },

	setCenter(c: [number, number]) { center = c; },
	setZoom(z: number) { zoom = z; },
	setMarkers(m: MapMarker[]) { markers = m; },
	selectMarker(id: string | null) { selectedMarkerId = id; },
	reset() {
		center = [10.3157, 123.8854];
		zoom = 12;
		markers = [];
		selectedMarkerId = null;
	}
};
