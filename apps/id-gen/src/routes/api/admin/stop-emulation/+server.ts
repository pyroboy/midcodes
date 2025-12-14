
import { json, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SERVICE_ROLE } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SERVICE_ROLE);

export const POST: RequestHandler = async ({ locals }) => {
	const session = await locals.safeGetSession();
	if (!session.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = session.user.id;
	
	// Double check if the user is actually emulating
	// We trust the locals.roleEmulation causing the UI to show the button, 
	// but here we should verify the user actually HAS app_metadata.role_emulation
	
	const { data: user, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
	
	if (fetchError || !user || !user.user) {
		return json({ error: 'User not found' }, { status: 404 });
	}
	
	const appMetadata = user.user.app_metadata || {};
	
	if (!appMetadata.role_emulation) {
		return json({ message: 'No role emulation active' });
	}

	// Remove role_emulation from app_metadata
	const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
		app_metadata: {
			...appMetadata,
			role_emulation: null
		}
	});

	if (updateError) {
		console.error('Failed to clear role emulation:', updateError);
		return json({ error: 'Failed to update user' }, { status: 500 });
	}

	return json({ success: true });
};
