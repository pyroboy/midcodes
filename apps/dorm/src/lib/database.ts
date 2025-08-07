import { supabase } from '$lib/supabaseClient';
import type { TemplateElement } from './types';

interface TemplateData {
	id: string;
	user_id: string;
	org_id: string | null;
	name: string;
	front_background: string;
	back_background: string;
	orientation: 'landscape' | 'portrait';
	template_elements: TemplateElement[];
}

// Update the fetchTemplateDetails function

// In src/lib/database.ts

export async function saveTemplate(
	templateData: TemplateData,
	frontElements: TemplateElement[],
	backElements: TemplateElement[]
) {
	const { data: savedTemplate, error: templateError } = await supabase
		.from('templates')
		.insert(templateData)
		.select()
		.single();

	if (templateError) throw templateError;
	if (!savedTemplate) throw new Error('No template data returned after insert');

	const elements = [...frontElements, ...backElements].map((el) => ({
		template_id: savedTemplate.id,
		// side: frontElements.includes(el) ? 'front' : 'back',
		...el
	}));

	const { data: elementData, error: elementError } = await supabase
		.from('template_elements')
		.insert(elements);

	if (elementError) throw elementError;

	return { savedTemplate, elementData };
}
export async function fetchTemplateDetails(templateId: string): Promise<TemplateData> {
	const { data, error } = await supabase
		.from('templates')
		.select(
			`
            *,
            template_elements (*)
        `
		)
		.eq('id', templateId)
		.single();

	if (error) throw error;
	if (!data) throw new Error('Template not found');

	return data as TemplateData;
}
export async function uploadImage(file: File, side: string, userId: string): Promise<string> {
	const fileExt = file.name.split('.').pop();
	const fileName = `${userId}/${side}_${Date.now()}.${fileExt}`;

	const { error: uploadError } = await supabase.storage.from('templates').upload(fileName, file);

	if (uploadError) throw uploadError;

	const { data: urlData } = supabase.storage.from('templates').getPublicUrl(fileName);

	return urlData.publicUrl;
}
