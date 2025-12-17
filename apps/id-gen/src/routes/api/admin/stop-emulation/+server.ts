import { json, type RequestHandler } from '@sveltejs/kit';
import {
	checkRateLimit,
	createRateLimitResponse,
	RateLimitConfigs
} from '$lib/utils/rate-limiter';
import { validateCSRFFromRequest, csrfErrorResponse } from '$lib/server/csrf';
import { logRoleEmulationStop } from '$lib/server/audit';

export const POST: RequestHandler = async ({ locals, request, cookies }) => {
	// SECURITY: Validate CSRF token
	const csrfCheck = validateCSRFFromRequest(request, (name) => cookies.get(name));
	if (!csrfCheck.valid) {
		return csrfErrorResponse(csrfCheck.error || 'CSRF validation failed');
	}

	const { user } = locals;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = user.id;

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
	
	const emulatedRoleData = cookies.get('role_emulation');
	if (!emulatedRoleData) {
		return json({ message: 'No role emulation active' });
	}

	// Remove emulation cookie
	cookies.delete('role_emulation', { path: '/' });

	// SECURITY: Log admin action to audit trail
	await logRoleEmulationStop(userId, request, locals.org_id);

	return json({ success: true, message: 'Role emulation stopped - reload the page for changes to take effect' });
};
