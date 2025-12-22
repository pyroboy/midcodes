import { env } from '$env/dynamic/public';

// Get R2 domain from env with fallback
const R2_DOMAIN = (env as any).PUBLIC_R2_PUBLIC_DOMAIN || 'assets.kanaya.app';

/**
 * Extracts the real URL from a corrupted path that has embedded proxy paths.
 * Returns null if the path is not corrupted.
 */
function extractRealUrlFromCorrupted(pathOrUrl: string): string | null {
	if (pathOrUrl.includes('/api/image-proxy?url=')) {
		try {
			const proxyMatch = pathOrUrl.match(/\/api\/image-proxy\?url=(.+)$/);
			if (proxyMatch && proxyMatch[1]) {
				// Decode the extracted URL (may be encoded multiple times)
				let extractedUrl = proxyMatch[1];
				// Decode until we get a clean URL
				while (extractedUrl.includes('%')) {
					const decoded = decodeURIComponent(extractedUrl);
					if (decoded === extractedUrl) break; // No more decoding needed
					extractedUrl = decoded;
				}
				console.warn('[storage] Extracted real URL from corrupted path:', extractedUrl);
				return extractedUrl;
			}
		} catch (e) {
			console.error('[storage] Failed to extract real URL from corrupted path:', e);
		}
	}
	return null;
}

/**
 * Generates the public URL for an asset stored in R2.
 * @param path The file path/key (e.g., "my-image.png")
 * @param bucket Optional bucket/folder name (e.g., "templates", "cards").
 *               If provided, it will be prepended to the path if not already present.
 */
export function getStorageUrl(path: string, bucket: string = 'templates'): string {
	if (!path) return '';

	// Blob URLs and data URLs should be returned as-is
	if (path.startsWith('blob:') || path.startsWith('data:')) return path;

	// Check for corrupted URLs with embedded proxy paths
	const extractedUrl = extractRealUrlFromCorrupted(path);
	if (extractedUrl) {
		// If the extracted URL is a full URL, return it
		if (extractedUrl.startsWith('http')) return extractedUrl;
		// If it's a blob/data URL, return it directly
		if (extractedUrl.startsWith('blob:') || extractedUrl.startsWith('data:')) return extractedUrl;
		// Otherwise, process it as a relative path
		path = extractedUrl;
	}

	// Check if it's already a full URL
	if (path.startsWith('http')) return path;

	// Use R2 Public Domain from environment
	const domain = R2_DOMAIN;

	let finalPath = path;
	// Prepend bucket/folder if not already present
	if (bucket && !path.startsWith(bucket + '/') && !path.startsWith('/' + bucket + '/')) {
		// Remove leading slash if present
		const cleanPath = path.startsWith('/') ? path.substring(1) : path;
		finalPath = `${bucket}/${cleanPath}`;
	} else if (path.startsWith('/')) {
		finalPath = path.substring(1);
	}

	if (domain) {
		const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
		return `${baseUrl}/${finalPath}`;
	}

	// Fallback to returning the path if no domain is configured
	return finalPath;
}

/**
 * Helper to route R2 URLs through our proxy to avoid CORS issues.
 * Uses `getStorageUrl` internally to resolve the full URL first if needed.
 * Also handles corrupted URLs that already contain embedded proxy paths.
 */
export function getProxiedUrl(pathOrUrl: string | null, bucket?: string){
	if (!pathOrUrl) return null;

	// Blob URLs are local and don't need proxying - return as-is
	if (pathOrUrl.startsWith('blob:')) return pathOrUrl;

	// Data URLs are already embedded and don't need proxying
	if (pathOrUrl.startsWith('data:')) return pathOrUrl;

	// Local proxy paths (starting with /api/image-proxy) should be returned as-is
	if (pathOrUrl.startsWith('/api/image-proxy')) return pathOrUrl;

	// Local paths (starting with /) should be returned as-is
	if (pathOrUrl.startsWith('/')) return pathOrUrl;

	// Skip localhost/127.0.0.1 URLs - these are local and shouldn't be proxied
	if (pathOrUrl.includes('localhost') || pathOrUrl.includes('127.0.0.1')) {
		console.log('[getProxiedUrl] Skipping localhost URL:', pathOrUrl);
		return pathOrUrl;
	}

	// Check if the URL is corrupted (contains embedded api/image-proxy path)
	// This can happen if a proxy URL was accidentally saved to the database
	const extractedUrl = extractRealUrlFromCorrupted(pathOrUrl);
	if (extractedUrl) {
		// If extracted URL is a blob or localhost URL, return it directly
		if (extractedUrl.startsWith('blob:') || extractedUrl.includes('localhost') || extractedUrl.includes('127.0.0.1')) {
			return extractedUrl;
		}
		// Proxy the extracted clean URL
		return `/api/image-proxy?url=${encodeURIComponent(extractedUrl)}`;
	}

	// Full URLs starting with http should be checked for R2 domain
	if (pathOrUrl.startsWith('http')) {
		// Use configured domain instead of hardcoded value
		if (pathOrUrl.includes(R2_DOMAIN)) {
			return `/api/image-proxy?url=${encodeURIComponent(pathOrUrl)}`;
		}
		return pathOrUrl;
	}

	// Relative paths need to be resolved to full R2 URLs
	const fullUrl = getStorageUrl(pathOrUrl, bucket);

	// Route through proxy to avoid CORS issues with canvas/Three.js texture loading
	if (fullUrl.includes(R2_DOMAIN)) {
		return `/api/image-proxy?url=${encodeURIComponent(fullUrl)}`;
	}

	return fullUrl;
}

// Legacy alias for backwards compatibility during migration
export const getSupabaseStorageUrl = getStorageUrl;
