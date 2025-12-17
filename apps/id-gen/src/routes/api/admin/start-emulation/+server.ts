import { json, type RequestHandler } from '@sveltejs/kit';
import {
	checkRateLimit,
	createRateLimitResponse,
	RateLimitConfigs
} from '$lib/utils/rate-limiter';
import { validateCSRFFromRequest, csrfErrorResponse } from '$lib/server/csrf';
import { logRoleEmulationStart } from '$lib/server/audit';

// Available roles that can be emulated
const EMULATABLE_ROLES = [
	'org_admin',
	'id_gen_admin',
	'id_gen_encoder',
	'id_gen_printer',
	'id_gen_viewer',
	'id_gen_template_designer',
	'id_gen_auditor',
	'id_gen_accountant',
	'id_gen_user'
];

export const POST: RequestHandler = async ({ locals, request, cookies }) => {
	// SECURITY: Validate CSRF token
	const csrfCheck = validateCSRFFromRequest(request, (name) => cookies.get(name));
	if (!csrfCheck.valid) {
		return csrfErrorResponse(csrfCheck.error || 'CSRF validation failed');
	}

	const { session, user } = locals;
	if (!session || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = user.id;

	// SECURITY FIX: Apply rate limiting to admin endpoints
	const rateLimitResult = checkRateLimit(
		request,
		RateLimitConfigs.ADMIN,
		'admin:start-emulation',
		userId
	);

	if (rateLimitResult.limited) {
		return createRateLimitResponse(rateLimitResult.resetTime);
	}

	// Only super_admin can start emulation (check actual role)
	if (user.role !== 'super_admin') {
		return json({ error: 'Only super administrators can emulate roles' }, { status: 403 });
	}

	// Parse request body for target role
	let targetRole: string;
	try {
		const body = await request.json();
		targetRole = body.role;
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	if (!targetRole || !EMULATABLE_ROLES.includes(targetRole)) {
		return json(
			{ error: `Invalid role. Must be one of: ${EMULATABLE_ROLES.join(', ')}` },
			{ status: 400 }
		);
	}

	// Set emulation cookie
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + 24); // Emulation expires in 24 hours

	const emulationData = {
		active: true,
		emulated_role: targetRole,
		original_role: user.role,
		expires_at: expiresAt.toISOString(),
		started_at: new Date().toISOString()
	};

	cookies.set('role_emulation', JSON.stringify(emulationData), {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		expires: expiresAt
	});

	// SECURITY: Log admin action to audit trail
	await logRoleEmulationStart(userId, userId, targetRole, user.role, request, locals.org_id);

	return json({
		success: true,
		emulating: targetRole,
		expiresAt: expiresAt.toISOString(),
		message: 'Role emulation started - reload the page for changes to take effect'
	});
};

// GET endpoint to retrieve available roles for emulation
export const GET: RequestHandler = async ({ locals, cookies }) => {
	const { user } = locals;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Only super_admin can access emulation features
	// We check the ACTUAL role from locals (which should be super_admin even if emulating)
	if (user.role !== 'super_admin') {
		return json({ error: 'Only super administrators can emulate roles' }, { status: 403 });
	}

	const emulatedRoleData = cookies.get('role_emulation');
	let currentEmulation = null;
	if (emulatedRoleData) {
		try {
			const emulation = JSON.parse(emulatedRoleData);
			if (emulation.active && new Date(emulation.expires_at) > new Date()) {
				currentEmulation = {
					emulatedRole: emulation.emulated_role,
					originalRole: emulation.original_role
				};
			}
		} catch (e) {
			console.error('Failed to parse role emulation cookie');
		}
	}

	return json({
		availableRoles: EMULATABLE_ROLES.map((role) => ({
			value: role,
			label: role
				.split('_')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
		})),
		currentEmulation
	});
};
