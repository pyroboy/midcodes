import type { PageServerLoad, Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	// TODO: Connect to Neon DB when env vars are configured
	// Demo data for now
	const demoInquiries: Record<string, any> = {
		'demo-1': {
			id: 'demo-1',
			fb_id: 'user-1',
			status: 'pending',
			concept: 'Japanese dragon sleeve with cherry blossoms',
			placement: 'Left arm',
			size: 'Full sleeve',
			reference_image_url: null,
			quoted_price: null,
			scheduled_at: null,
			created_at: new Date().toISOString()
		},
		'demo-2': {
			id: 'demo-2',
			fb_id: 'user-2',
			status: 'approved',
			concept: 'Minimalist geometric wolf',
			placement: 'Right forearm',
			size: 'Medium (15x10cm)',
			reference_image_url: null,
			quoted_price: '8500',
			scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
			created_at: new Date().toISOString()
		}
	};

	const demoUsers: Record<string, any> = {
		'user-1': { fb_id: 'user-1', name: 'Marco Reyes', phone_number: '0917-123-4567', created_at: new Date().toISOString() },
		'user-2': { fb_id: 'user-2', name: 'Jessa Santos', phone_number: '0918-234-5678', created_at: new Date().toISOString() }
	};

	const inquiry = demoInquiries[params.id];
	if (!inquiry) {
		throw error(404, 'Inquiry not found');
	}

	const user = demoUsers[inquiry.fb_id];

	return { inquiry, user };
};

export const actions: Actions = {
	approve: async ({ request, params }) => {
		// TODO: DB update when connected
		redirect(303, '/dashboard');
	},

	reject: async ({ params }) => {
		redirect(303, '/dashboard');
	},

	cancel: async ({ params }) => {
		redirect(303, '/dashboard');
	}
};
