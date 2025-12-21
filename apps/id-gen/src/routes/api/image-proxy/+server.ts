import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const imageUrl = url.searchParams.get('url');

	if (!imageUrl) {
		throw error(400, 'Missing url parameter');
	}

	// Validate URL format
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(imageUrl);
	} catch {
		throw error(400, 'Invalid URL');
	}

	// Only allow our R2 domain to prevent abuse
	if (parsedUrl.hostname !== 'assets.kanaya.app') {
		throw error(403, 'Forbidden domain');
	}

	try {
		const response = await fetch(imageUrl);

		if (!response.ok) {
			throw error(response.status, 'Failed to fetch image');
		}

		const contentType = response.headers.get('content-type') || 'application/octet-stream';

		// Copy relevant headers and ensure CORS is set
		return new Response(response.body, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': response.headers.get('cache-control') || 'public, max-age=31536000'
			}
		});
	} catch (err) {
		console.error('Image proxy error:', err);
		const msg = err instanceof Error ? err.message : 'Unknown proxy error';
		console.error('Image proxy error:', msg);
		return new Response(
			JSON.stringify({ error: msg, stack: err instanceof Error ? err.stack : undefined }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
