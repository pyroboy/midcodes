
import { json, type RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SERVICE_ROLE } from '$env/static/private';
import {
	checkRateLimit,
	createRateLimitResponse,
	RateLimitConfigs
} from '$lib/utils/rate-limiter';
import { validateCSRFFromRequest, csrfErrorResponse } from '$lib/server/csrf';
import { invalidateUserPermissionCache } from '$lib/services/permissions';
import { logRoleEmulationStop } from '$lib/server/audit';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SERVICE_ROLE);

export const POST: RequestHandler = async ({ locals, request, cookies }) => {
	// SECURITY: Validate CSRF token
	const csrfCheck = validateCSRFFromRequest(request, (name) => cookies.get(name));
	if (!csrfCheck.valid) {
		return csrfErrorResponse(csrfCheck.error || 'CSRF validation failed');
	}

	const session = await locals.safeGetSession();
	if (!session.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = session.user.id;

	// SECURITY FIX: Apply rate limiting to admin endpoints
	const rateLimitResult = checkRateLimit(
		request,
		RateLimitConfigs.ADMIN,
		'admin:stop-emulation',
		userId
	);

	if (rateLimitResult.limited) {
		return createRateLimitResponse(rateLimitResult.resetTime);
	}
	
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

	// SECURITY: Invalidate permission cache when role changes
	invalidateUserPermissionCache(userId);

	// SECURITY: Force session refresh to rotate session token after privilege change
	try {
		await locals.supabase.auth.refreshSession();
	} catch (refreshError) {
		console.warn('Session refresh after emulation stop failed (non-critical):', refreshError);
	}

	// SECURITY: Log admin action to audit trail
	await logRoleEmulationStop(userId, request, appMetadata.org_id);

	return json({ success: true, message: 'Session refreshed - reload the page for changes to take effect' });
};
