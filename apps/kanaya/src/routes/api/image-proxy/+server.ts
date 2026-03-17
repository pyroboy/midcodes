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
		console.log('[image-proxy] Fetching:', imageUrl);
		const response = await fetch(imageUrl);

		if (!response.ok) {
			console.error(
				'[image-proxy] Upstream error:',
				response.status,
				response.statusText,
				'for URL:',
				imageUrl
			);
			// Return error with CORS headers to avoid ORB blocking
			return new Response(`Failed to fetch image: ${response.status} ${response.statusText}`, {
				status: response.status,
				headers: {
					'Content-Type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'X-Error-URL': imageUrl
				}
			});
		}

		const contentType = response.headers.get('content-type') || 'application/octet-stream';
		console.log('[image-proxy] Success:', imageUrl, 'Content-Type:', contentType);

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
		console.error('[image-proxy] Error:', err, 'for URL:', imageUrl);
		const msg = err instanceof Error ? err.message : 'Unknown proxy error';
		// Return error with CORS headers to avoid ORB blocking
		return new Response(msg, {
			status: 500,
			headers: {
				'Content-Type': 'text/plain',
				'Access-Control-Allow-Origin': '*',
				'X-Error-URL': imageUrl
			}
		});
	}
};
