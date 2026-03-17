import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { removeBackgroundWithRunware } from '$lib/server/runware';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Ensure user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { imageBase64 } = body;

		if (!imageBase64) {
			return json({ error: 'Missing imageBase64 in request body' }, { status: 400 });
		}

		// Validate it's a base64 image
		if (typeof imageBase64 !== 'string') {
			return json({ error: 'imageBase64 must be a string' }, { status: 400 });
		}

		console.log('[API:remove-background] Processing request for user:', locals.user.id);

		const result = await removeBackgroundWithRunware(imageBase64);

		if (!result.success) {
			console.error('[API:remove-background] Failed:', result.error);
			return json({ error: result.error }, { status: 500 });
		}

		console.log('[API:remove-background] Success, cost:', result.cost);

		return json({
			success: true,
			imageUrl: result.imageUrl,
			imageBase64: result.imageBase64,
			cost: result.cost
		});
	} catch (error) {
		console.error('[API:remove-background] Error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Internal server error' },
			{ status: 500 }
		);
	}
};
