import { env as publicEnv } from '$env/dynamic/public';

export function getSupabaseStorageUrl(path: string | null): string | null {
	if (!path) return null;
    return `${publicEnv.PUBLIC_SUPABASE_URL}/storage/v1/object/public/rendered-id-cards/${path}`;
}

export function getPublicUrl(path: string | null): string | null {
	return getSupabaseStorageUrl(path);
}
