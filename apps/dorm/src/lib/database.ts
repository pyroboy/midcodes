import { db } from '$lib/server/db';
import { templates } from '$lib/server/schema';
import { uploadToR2, getPublicUrl } from '$lib/server/s3';
import { eq } from 'drizzle-orm';
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

export async function saveTemplate(
	templateData: TemplateData,
	frontElements: TemplateElement[],
	backElements: TemplateElement[]
) {
	const allElements = [...frontElements, ...backElements];

	const [savedTemplate] = await db
		.insert(templates)
		.values({
			id: templateData.id,
			userId: templateData.user_id,
			orgId: templateData.org_id,
			name: templateData.name,
			frontBackground: templateData.front_background,
			backBackground: templateData.back_background,
			orientation: templateData.orientation,
			templateElements: allElements
		})
		.returning();

	if (!savedTemplate) throw new Error('No template data returned after insert');

	return { savedTemplate, elementData: allElements };
}

export async function fetchTemplateDetails(templateId: string): Promise<TemplateData> {
	const data = await db.query.templates.findFirst({
		where: eq(templates.id, templateId)
	});

	if (!data) throw new Error('Template not found');

	return {
		id: data.id,
		user_id: data.userId ?? '',
		org_id: data.orgId ?? null,
		name: data.name,
		front_background: data.frontBackground ?? '',
		back_background: data.backBackground ?? '',
		orientation: (data.orientation as 'landscape' | 'portrait') ?? 'landscape',
		template_elements: (data.templateElements as TemplateElement[]) ?? []
	};
}

export async function uploadImage(file: File, side: string, userId: string): Promise<string> {
	const fileExt = file.name.split('.').pop();
	const key = `templates/${userId}/${side}_${Date.now()}.${fileExt}`;

	const buffer = Buffer.from(await file.arrayBuffer());
	const publicUrl = await uploadToR2(key, buffer, file.type);

	return publicUrl;
}
