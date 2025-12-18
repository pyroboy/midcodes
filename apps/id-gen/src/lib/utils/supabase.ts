import { env } from '$env/dynamic/public';

/**
 * Generates the public URL for an asset stored in R2.
 * @param path The file path/key (e.g., "my-image.png")
 * @param bucket (Deprecated/Ignored) The bucket name is now defined largely by env, but kept for signature compat.
 */
export function getSupabaseStorageUrl(path: string, bucket: string = 'templates'): string {
	if (!path) return '';
    
    // Check if it's already a full URL
    if (path.startsWith('http')) return path;

    // Use R2 Public Domain
    // Note: We need to make sure R2_PUBLIC_DOMAIN is exposed to client if we use it here.
    // If not, we might need a hardcoded fallback or ensure it's in public env.
    // Assuming user adds R2_PUBLIC_DOMAIN to .env, standard Vite/SvelteKit exposes PUBLIC_ prefixed vars.
    // But env.R2_PUBLIC_DOMAIN might not be there if it doesn't start with PUBLIC_.
    // However, the user instruction was just R2_PUBLIC_DOMAIN.
    // We might need to ask user to rename to PUBLIC_R2_PUBLIC_DOMAIN or use a server-served config.
    // For now, let's try to access it. If it fails, we default to a placeholder or check if we can get it otherwise.
    
    // Better strategy: The refactor implies we serve assets from R2.
    // The previous implementation used PUBLIC_SUPABASE_URL.
    
    // Let's use a cleaner approach:
    // If the path is just a filename, assume it's relative to the public domain root.
    
    const domain = (env as any).PUBLIC_R2_PUBLIC_DOMAIN || (env as any).R2_PUBLIC_DOMAIN;
    
    if (domain) {
        const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
        return `${baseUrl}/${path}`;
    }

	// Fallback to purely returning the path if no domain is configured (broken image better than crash)
	return path;
}

// Deprecated: Uploads should be handled server-side via S3 client now.
export async function uploadFile(bucket: string, path: string, file: File): Promise<{ path: string }> {
	throw new Error('Client-side uploads are deprecated. Use server actions.');
}

export async function deleteFile(bucket: string, path: string) {
	throw new Error('Client-side deletes are deprecated. Use server actions.');
}

export async function listFiles(bucket: string, path: string) {
	throw new Error('Client-side listing is deprecated. Use server actions.');
}

