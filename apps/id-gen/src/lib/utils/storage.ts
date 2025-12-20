import { env } from '$env/dynamic/public';

/**
 * Generates the public URL for an asset stored in R2.
 * @param path The file path/key (e.g., "my-image.png")
 * @param bucket Optional bucket/folder name (e.g., "templates", "rendered-id-cards").
 *               If provided, it will be prepended to the path if not already present.
 */
export function getStorageUrl(path: string, bucket: string = 'templates'): string {
	if (!path) return '';

	// Check if it's already a full URL
	if (path.startsWith('http')) return path;

	// Use R2 Public Domain from environment
	const domain = (env as any).PUBLIC_R2_PUBLIC_DOMAIN || 'assets.kanaya.app';

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
 */
export function getProxiedUrl(pathOrUrl: string | null, bucket?: string): string | null {
	if (!pathOrUrl) return null;

	// Resolve full URL
	const fullUrl = getStorageUrl(pathOrUrl, bucket);

	// Check if this is a URL that needs proxying (R2 or our custom domain)
	if (
		fullUrl.includes('.r2.dev') ||
		fullUrl.includes('r2.cloudflarestorage.com') ||
		fullUrl.includes('assets.kanaya.app')
	) {
		return `/api/image-proxy?url=${encodeURIComponent(fullUrl)}`;
	}
	return fullUrl;
}

// Legacy alias for backwards compatibility during migration
export const getSupabaseStorageUrl = getStorageUrl;
