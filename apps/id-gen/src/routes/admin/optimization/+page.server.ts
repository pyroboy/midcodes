import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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

export const actions = {
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
		
		// updates.updated_at = new Date().toISOString(); // idcards might not have updated_at or handle it differently

		const table = type === 'template' ? 'templates' : 'idcards';
		
		const { error } = await supabase
			.from(table)
			.update(updates)
			.eq('id', id);

		if (error) return { success: false, message: error.message };
		
		return { success: true };
	}
};
