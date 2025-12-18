import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { templates, idcards } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, org_id } = locals;

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	// Fetch all templates with Drizzle
	const templatesData = await db.select({
		id: templates.id,
		name: templates.name,
		front_background: templates.frontBackground,
		back_background: templates.backBackground,
		front_background_low_res: templates.frontBackgroundLowRes,
		back_background_low_res: templates.backBackgroundLowRes
	})
		.from(templates)
		.where(eq(templates.orgId, org_id!));

	// Fetch all idcards with Drizzle
	const idcardsData = await db.select({
		id: idcards.id,
		front_image: idcards.frontImage,
		back_image: idcards.backImage,
		front_image_low_res: idcards.frontImageLowRes,
		back_image_low_res: idcards.backImageLowRes
	})
		.from(idcards)
		.where(eq(idcards.orgId, org_id!));

	const templatesToOptimize = (templatesData || []).filter((t: any) => 
		(t.front_background && !t.front_background_low_res) || 
		(t.back_background && !t.back_background_low_res)
	).map((t: any) => ({ ...t, type: 'template' }));

	const idcardsToOptimize = (idcardsData || []).filter((c: any) => 
		(c.front_image && !c.front_image_low_res) || 
		(c.back_image && !c.back_image_low_res)
	).map((c: any) => ({ ...c, type: 'idcard', name: `ID Card ${c.id.slice(0,8)}` }));

	const allToOptimize = [...templatesToOptimize, ...idcardsToOptimize];

	return {
		stats: {
			totalTemplates: templatesData?.length || 0,
			totalCards: idcardsData?.length || 0,
			optimizedTemplates: (templatesData?.length || 0) - templatesToOptimize.length,
			optimizedCards: (idcardsData?.length || 0) - idcardsToOptimize.length,
			needsOptimization: allToOptimize.length
		},
		itemsToOptimize: allToOptimize
	};
};

export const actions: Actions = {
	// Upload thumbnail server-side using R2
	uploadThumbnail: async ({ request, locals }) => {
		const { session } = locals;
		
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}
		
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const path = formData.get('path') as string;
		// const bucket = formData.get('bucket') as string; // R2 uses singular bucket usually, but path can imply folder.
		
		if (!file || !path) {
			return { success: false, message: 'Missing file or path' };
		}
		
		// Convert File to ArrayBuffer for server-side upload
		const arrayBuffer = await file.arrayBuffer();
		
        // Use R2
        try {
            const { uploadToR2 } = await import('$lib/server/s3');
            await uploadToR2(path, Buffer.from(arrayBuffer), file.type || 'image/jpeg');
            
            return { success: true, path: path };
        } catch (uploadError: any) {
			console.error('Upload error:', uploadError);
			return { success: false, message: uploadError.message };
        }
	},

	updateLowRes: async ({ request, locals }) => {
		const formData = await request.formData();
		
		const id = formData.get('id') as string;
		const type = formData.get('type') as string;
		const front_low = formData.get('front_low_res') as string;
		const back_low = formData.get('back_low_res') as string;

		if (!id || !type) return { success: false, message: 'Missing ID or Type' };

		try {
			if (type === 'template') {
				const updates: any = {};
				if (front_low) updates.frontBackgroundLowRes = front_low;
				if (back_low) updates.backBackgroundLowRes = back_low;
				
				await db.update(templates)
					.set(updates)
					.where(eq(templates.id, id));
			} else {
				const updates: any = {};
				if (front_low) updates.frontImageLowRes = front_low;
				if (back_low) updates.backImageLowRes = back_low;
				
				await db.update(idcards)
					.set(updates)
					.where(eq(idcards.id, id));
			}
			
			return { success: true };
		} catch (dbError: any) {
			return { success: false, message: dbError.message };
		}
	}
};
