import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
        throw error(400, 'Missing url parameter');
    }

    // Validate that we are only proxying our own R2 images to prevent abuse
    // Check against allowed domains from our config
    try {
        const u = new URL(imageUrl);
        const allowedHosts = ['.r2.dev', '.r2.cloudflarestorage.com'];
        if (!allowedHosts.some(host => u.hostname.endsWith(host))) {
            throw error(403, 'Forbidden domain');
        }
    } catch (e) {
        throw error(400, 'Invalid URL');
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
        throw error(500, 'Proxy error');
    }
};
