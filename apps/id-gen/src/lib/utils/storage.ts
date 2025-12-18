import { env } from '$env/dynamic/public';

/**
 * Generates the public URL for an asset stored in R2.
 * @param path The file path/key (e.g., "my-image.png")
 * @param _bucket (Deprecated/Ignored) Kept for backwards compatibility.
 */
export function getStorageUrl(path: string, _bucket: string = 'templates'): string {
	if (!path) return '';
    
    // Check if it's already a full URL
    if (path.startsWith('http')) return path;

    // Use R2 Public Domain from environment
    const domain = (env as any).PUBLIC_R2_PUBLIC_DOMAIN;
    
    if (domain) {
        const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
        return `${baseUrl}/${path}`;
    }

	// Fallback to returning the path if no domain is configured
	return path;
}

// Legacy alias for backwards compatibility during migration
export const getSupabaseStorageUrl = getStorageUrl;


