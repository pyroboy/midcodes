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

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SERVICE_ROLE);

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

	const session = await locals.safeGetSession();
	if (!session.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = session.user.id;

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

	// Get current user's actual role to verify they're super_admin
	const { data: userData, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);

	if (fetchError || !userData || !userData.user) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	const appMetadata = userData.user.app_metadata || {};
	const currentRole = appMetadata.role || userData.user.user_metadata?.role;

	// Only super_admin can start emulation
	if (currentRole !== 'super_admin') {
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

	// Set emulation in app_metadata
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + 24); // Emulation expires in 24 hours

	const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
		app_metadata: {
			...appMetadata,
			role_emulation: {
				active: true,
				emulated_role: targetRole,
				original_role: currentRole,
				expires_at: expiresAt.toISOString(),
				started_at: new Date().toISOString()
			}
		}
	});

	if (updateError) {
		console.error('Failed to start role emulation:', updateError);
		return json({ error: 'Failed to start emulation' }, { status: 500 });
	}

	// SECURITY: Invalidate permission cache when role changes
	invalidateUserPermissionCache(userId);

	return json({
		success: true,
		emulating: targetRole,
		expiresAt: expiresAt.toISOString()
	});
};

// GET endpoint to retrieve available roles for emulation
export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.safeGetSession();
	if (!session.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = session.user.id;

	// SECURITY FIX: Verify role from database, not from JWT/locals
	// Fetch actual user metadata from Supabase Admin to prevent tampering
	const { data: userData, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);

	if (fetchError || !userData || !userData.user) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	const appMetadata = userData.user.app_metadata || {};
	const currentRole = appMetadata.role || userData.user.user_metadata?.role;
	const roleEmulation = appMetadata.role_emulation;

	// Only super_admin can access emulation features
	// Use the role from database, not from JWT
	const isSuperAdmin = currentRole === 'super_admin';

	if (!isSuperAdmin) {
		return json({ error: 'Only super administrators can emulate roles' }, { status: 403 });
	}

	return json({
		availableRoles: EMULATABLE_ROLES.map((role) => ({
			value: role,
			label: role
				.split('_')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')
		})),
		currentEmulation: roleEmulation?.active
			? {
					emulatedRole: roleEmulation.emulated_role,
					originalRole: roleEmulation.original_role
				}
			: null
	});
};
