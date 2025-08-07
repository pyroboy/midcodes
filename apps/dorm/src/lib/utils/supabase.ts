import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export function getSupabaseStorageUrl(path: string | null): string | null {
	if (!path) return null;
	return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/rendered-id-cards/${path}`;
}

export function getPublicUrl(path: string | null): string | null {
	return getSupabaseStorageUrl(path);
}
