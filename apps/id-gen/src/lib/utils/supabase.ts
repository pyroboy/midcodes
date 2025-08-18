import { supabase } from '$lib/supabaseClient';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export function getSupabaseStorageUrl(path: string, bucket: string = 'templates'): string {
	if (!path) return '';
	return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export async function uploadFile(bucket: string, path: string, file: File) {
	const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
		cacheControl: '3600',
		upsert: true
	});

	if (error) throw error;
	return data;
}

export async function deleteFile(bucket: string, path: string) {
	const { error } = await supabase.storage.from(bucket).remove([path]);
	if (error) throw error;
}

export async function listFiles(bucket: string, path: string) {
	const { data, error } = await supabase.storage.from(bucket).list(path);
	if (error) throw error;
	return data;
}
