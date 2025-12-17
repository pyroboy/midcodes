import { error, json } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase, session, org_id } = locals;

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	// Fetch all templates
	const { data: templates } = await supabase
		.from('templates')
		.select('id, name, front_background, back_background, front_background_low_res, back_background_low_res')
		.eq('org_id', org_id);

	// Fetch all idcards
	const { data: idcards } = await supabase
		.from('idcards')
		.select('id, front_image, back_image, front_image_low_res, back_image_low_res')
		.eq('org_id', org_id);

	const templatesToOptimize = (templates || []).filter(t => 
		(t.front_background && !t.front_background_low_res) || 
		(t.back_background && !t.back_background_low_res)
	).map(t => ({ ...t, type: 'template' }));

	const idcardsToOptimize = (idcards || []).filter(c => 
		(c.front_image && !c.front_image_low_res) || 
		(c.back_image && !c.back_image_low_res)
	).map(c => ({ ...c, type: 'idcard', name: `ID Card ${c.id.slice(0,8)}` }));

	const allToOptimize = [...templatesToOptimize, ...idcardsToOptimize];

	return {
		stats: {
			totalTemplates: templates?.length || 0,
			totalCards: idcards?.length || 0,
			optimizedTemplates: (templates?.length || 0) - templatesToOptimize.length,
			optimizedCards: (idcards?.length || 0) - idcardsToOptimize.length,
			needsOptimization: allToOptimize.length
		},
		itemsToOptimize: allToOptimize
	};
};

export const actions: Actions = {
	// Upload thumbnail server-side (bypasses browser client auth issues)
	uploadThumbnail: async ({ request, locals }) => {
		const { supabase, session } = locals;
		
		if (!session) {
			return { success: false, message: 'Unauthorized' };
		}
		
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const path = formData.get('path') as string;
		const bucket = formData.get('bucket') as string;
		
		if (!file || !path || !bucket) {
			return { success: false, message: 'Missing file, path, or bucket' };
		}
		
		// Convert File to ArrayBuffer for server-side upload
		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		
		const { data, error: uploadError } = await supabase.storage
			.from(bucket)
			.upload(path, uint8Array, {
				contentType: file.type || 'image/jpeg',
				cacheControl: '3600',
				upsert: true
			});
		
		if (uploadError) {
			console.error('Upload error:', uploadError);
			return { success: false, message: uploadError.message };
		}
		
		return { success: true, path: data.path };
	},

	updateLowRes: async ({ request, locals }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		
		const id = formData.get('id') as string;
		const type = formData.get('type') as string;
		const front_low = formData.get('front_low_res') as string;
		const back_low = formData.get('back_low_res') as string;

		if (!id || !type) return { success: false, message: 'Missing ID or Type' };

		const updates: any = {};
		if (type === 'template') {
			if (front_low) updates.front_background_low_res = front_low;
			if (back_low) updates.back_background_low_res = back_low;
		} else {
			if (front_low) updates.front_image_low_res = front_low;
			if (back_low) updates.back_image_low_res = back_low;
		}

		const table = type === 'template' ? 'templates' : 'idcards';
		
		const { error: dbError } = await supabase
			.from(table)
			.update(updates)
			.eq('id', id);

		if (dbError) return { success: false, message: dbError.message };
		
		return { success: true };
	}
};
