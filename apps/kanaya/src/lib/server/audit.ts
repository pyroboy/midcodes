/**
 * Admin Audit Logging
 * SECURITY: Tracks all admin actions for compliance and security monitoring
 */

import { db } from '$lib/server/db';
import { adminAudit } from '$lib/server/schema';

export interface AuditLogEntry {
	adminId: string;
	action: string;
	targetType: 'user' | 'organization' | 'template' | 'credit' | 'role' | 'settings' | 'system';
	targetId: string | null;
	metadata: Record<string, any>;
	ipAddress?: string | null;
	userAgent?: string | null;
	orgId?: string | null;
}

export type AuditAction =
	| 'role_emulation_start'
	| 'role_emulation_stop'
	| 'user_role_change'
	| 'user_created'
	| 'user_deleted'
	| 'user_suspended'
	| 'credit_adjustment'
	| 'credit_bypass_purchase'
	| 'template_created'
	| 'template_deleted'
	| 'template_modified'
	| 'org_settings_changed'
	| 'org_member_added'
	| 'org_member_removed'
	| 'org_created'
	| 'admin_access_granted'
	| 'admin_access_revoked'
	| 'sensitive_data_accessed'
	| 'bulk_operation'
	| 'export_data'
	| 'import_data';

/**
 * Log an admin action to the audit trail
 *
 * @param entry - The audit log entry details
 * @returns Success status
 */
export async function logAdminAction(
	entry: AuditLogEntry
): Promise<{ success: boolean; error?: string }> {
	try {
		await db.insert(adminAudit).values({
			adminId: entry.adminId,
			action: entry.action,
			targetType: entry.targetType,
			targetId: entry.targetId ?? null,
			metadata: entry.metadata,
			ipAddress: entry.ipAddress ?? null,
			userAgent: entry.userAgent ?? null,
			orgId: entry.orgId ?? (null as any), // Cast for potential type mismatch if orgId is null but marked notNull in schema temporarily
			createdAt: new Date()
		});

		console.log(
			`[AuditLog] ${entry.action} by ${entry.adminId} on ${entry.targetType}:${entry.targetId}`
		);
		return { success: true };
	} catch (err: any) {
		console.error('[AuditLog] Exception logging admin action:', err);
		return { success: false, error: err.message || 'Internal error' };
	}
}

/**
 * Helper to extract request metadata for audit logging
 */
export function extractRequestMetadata(request: Request): {
	ipAddress: string | null;
	userAgent: string | null;
} {
	return {
		ipAddress:
			request.headers.get('x-real-ip') ||
			request.headers.get('cf-connecting-ip') ||
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			null,
		userAgent: request.headers.get('user-agent')
	};
}

/**
 * Log role emulation start
 */
export async function logRoleEmulationStart(
	adminId: string,
	targetUserId: string,
	emulatedRole: string,
	originalRole: string,
	request: Request,
	orgId?: string
): Promise<void> {
	const { ipAddress, userAgent } = extractRequestMetadata(request);

	await logAdminAction({
		adminId,
		action: 'role_emulation_start',
		targetType: 'user',
		targetId: targetUserId,
		metadata: {
			emulated_role: emulatedRole,
			original_role: originalRole,
			started_at: new Date().toISOString()
		},
		ipAddress,
		userAgent,
		orgId
	});
}

/**
 * Log role emulation stop
 */
export async function logRoleEmulationStop(
	adminId: string,
	request: Request,
	orgId?: string
): Promise<void> {
	const { ipAddress, userAgent } = extractRequestMetadata(request);

	await logAdminAction({
		adminId,
		action: 'role_emulation_stop',
		targetType: 'user',
		targetId: adminId,
		metadata: {
			stopped_at: new Date().toISOString()
		},
		ipAddress,
		userAgent,
		orgId
	});
}

/**
 * Log credit adjustment
 */
export async function logCreditAdjustment(
	adminId: string,
	targetUserId: string,
	amount: number,
	reason: string,
	request: Request,
	orgId?: string
): Promise<void> {
	const { ipAddress, userAgent } = extractRequestMetadata(request);

	await logAdminAction({
		adminId,
		action: 'credit_adjustment',
		targetType: 'credit',
		targetId: targetUserId,
		metadata: {
			amount,
			reason,
			adjusted_at: new Date().toISOString()
		},
		ipAddress,
		userAgent,
		orgId
	});
}

/**
 * Log user role change
 */
export async function logUserRoleChange(
	adminId: string,
	targetUserId: string,
	oldRole: string,
	newRole: string,
	request: Request,
	orgId?: string
): Promise<void> {
	const { ipAddress, userAgent } = extractRequestMetadata(request);

	await logAdminAction({
		adminId,
		action: 'user_role_change',
		targetType: 'role',
		targetId: targetUserId,
		metadata: {
			old_role: oldRole,
			new_role: newRole,
			changed_at: new Date().toISOString()
		},
		ipAddress,
		userAgent,
		orgId
	});
}

/**
 * Log organization settings change
 */
export async function logOrgSettingsChange(
	adminId: string,
	orgId: string,
	changes: Record<string, { old: any; new: any }>,
	request: Request
): Promise<void> {
	const { ipAddress, userAgent } = extractRequestMetadata(request);

	await logAdminAction({
		adminId,
		action: 'org_settings_changed',
		targetType: 'organization',
		targetId: orgId,
		metadata: {
			changes,
			changed_at: new Date().toISOString()
		},
		ipAddress,
		userAgent,
		orgId
	});
}

/**
 * Log sensitive data access
 */
export async function logSensitiveDataAccess(
	adminId: string,
	dataType: string,
	recordId: string,
	request: Request,
	orgId?: string
): Promise<void> {
	const { ipAddress, userAgent } = extractRequestMetadata(request);

	await logAdminAction({
		adminId,
		action: 'sensitive_data_accessed',
		targetType: 'system',
		targetId: recordId,
		metadata: {
			data_type: dataType,
			accessed_at: new Date().toISOString()
		},
		ipAddress,
		userAgent,
		orgId
	});
}
