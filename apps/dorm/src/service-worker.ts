/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

const CACHE_NAME = `dorm-cache-${version}`;
const IMAGE_CACHE = 'dorm-images-v1';

// Static assets to precache (SvelteKit build output + static files)
const PRECACHE = [...build, ...files];

// ─── Install: precache static assets ────────────────────────────────────────
sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => sw.skipWaiting())
	);
});

// ─── Activate: clean old caches, keep image cache ──────────────────────────
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME && key !== IMAGE_CACHE)
					.map((key) => caches.delete(key))
			)
		).then(() => sw.clients.claim())
	);
});

// ─── Fetch: route-based caching strategies ──────────────────────────────────
sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Skip non-GET requests
	if (event.request.method !== 'GET') return;

	// Strategy 1: Cloudinary images → cache-first, cache forever
	if (url.hostname === 'res.cloudinary.com') {
		event.respondWith(
			caches.open(IMAGE_CACHE).then(async (cache) => {
				const cached = await cache.match(event.request);
				if (cached) return cached;

				try {
					const response = await fetch(event.request);
					if (response.ok) {
						cache.put(event.request, response.clone());
					}
					return response;
				} catch {
					// Offline and not cached — return transparent 1x1 placeholder
					return new Response(
						Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0)),
						{ headers: { 'Content-Type': 'image/gif' } }
					);
				}
			})
		);
		return;
	}

	// Strategy 2: API calls (RxDB pull, auth) → network-only, never cache
	if (url.pathname.startsWith('/api/')) return;

	// Strategy 3: Static assets from precache → cache-first
	if (PRECACHE.includes(url.pathname)) {
		event.respondWith(
			caches.match(event.request).then((cached) => cached || fetch(event.request))
		);
		return;
	}

	// Strategy 4: Navigation/page requests → network-first with offline fallback
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request).catch(() =>
				caches.match(event.request).then((cached) => cached || caches.match('/'))
			).then((r) => r || fetch(event.request))
		);
		return;
	}
});
