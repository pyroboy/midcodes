import { supabase } from './supabaseClient';
import type { TemplateData } from './stores/templateStore';
import { uploadFile, deleteFile, getSupabaseStorageUrl } from './utils/supabase';

export async function uploadImage(file: File, path: string, userId?: string): Promise<string> {
	try {
		const finalPath = userId ? `${userId}/${path}` : path;
		const result = await uploadFile('templates', finalPath, file);
		// Return the full URL instead of just the path
		return getSupabaseStorageUrl(result.path, 'templates');
	} catch (error) {
		console.error('Error uploading image:', error);
		throw error;
	}
}

export async function deleteTemplate(id: string) {
	const { error } = await supabase.from('templates').delete().match({ id });

	if (error) throw error;
}

export async function saveTemplate(template: TemplateData) {
	// Convert TemplateData to database schema format
	const dbTemplate = {
		...template,
		template_elements: template.template_elements as any // Convert to Json type for database
	};
	
	const { data, error } = await supabase.from('templates').upsert(dbTemplate).select();

	if (error) throw error;
	return data[0];
}

export async function getTemplate(id: string) {
	const { data, error } = await supabase.from('templates').select('*').eq('id', id).single();

	if (error) throw error;
	return data;
}

export async function listTemplates() {
	const { data, error } = await supabase
		.from('templates')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data;
}
