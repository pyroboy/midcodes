import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	// TODO: Connect to Neon DB when env vars are configured
	// For now return demo data
	return {
		inquiries: [
			{
				id: 'demo-1',
				fb_id: 'user-1',
				status: 'pending',
				concept: 'Japanese dragon sleeve with cherry blossoms',
				placement: 'Left arm',
				size: 'Full sleeve',
				reference_image_url: null,
				quoted_price: null,
				scheduled_at: null,
				gcal_event_id: null,
				created_at: new Date().toISOString()
			},
			{
				id: 'demo-2',
				fb_id: 'user-2',
				status: 'approved',
				concept: 'Minimalist geometric wolf',
				placement: 'Right forearm',
				size: 'Medium (15x10cm)',
				reference_image_url: null,
				quoted_price: '8500',
				scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
				gcal_event_id: null,
				created_at: new Date().toISOString()
			},
			{
				id: 'demo-3',
				fb_id: 'user-3',
				status: 'pending',
				concept: 'Traditional Filipino sun with script',
				placement: 'Upper back',
				size: 'Large (25x20cm)',
				reference_image_url: null,
				quoted_price: null,
				scheduled_at: null,
				gcal_event_id: null,
				created_at: new Date().toISOString()
			},
			{
				id: 'demo-4',
				fb_id: 'user-1',
				status: 'completed',
				concept: 'Blackwork mandala',
				placement: 'Right shoulder',
				size: 'Medium (12x12cm)',
				reference_image_url: null,
				quoted_price: '6000',
				scheduled_at: new Date(Date.now() - 86400000 * 7).toISOString(),
				gcal_event_id: null,
				created_at: new Date(Date.now() - 86400000 * 14).toISOString()
			},
			{
				id: 'demo-5',
				fb_id: 'user-4',
				status: 'cancelled',
				concept: 'Watercolor phoenix',
				placement: 'Rib cage',
				size: 'Large',
				reference_image_url: null,
				quoted_price: '12000',
				scheduled_at: null,
				gcal_event_id: null,
				created_at: new Date(Date.now() - 86400000 * 5).toISOString()
			}
		]
	};
};
