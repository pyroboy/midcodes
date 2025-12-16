/**
 * Admin Audit Logging
 * SECURITY: Tracks all admin actions for compliance and security monitoring
 * 
 * This module provides comprehensive audit logging for:
 * - Role emulation start/stop
 * - User role modifications
 * - Credit adjustments
 * - Organization settings changes
 * - Template modifications by admins
 */

import { supabaseAdmin } from '$lib/server/supabase';

export interface AuditLogEntry {
	admin_id: string;
	action: string;
	target_type: 'user' | 'organization' | 'template' | 'credit' | 'role' | 'settings' | 'system';
	target_id: string | null;
	metadata: Record<string, any>;
	ip_address?: string | null;
	user_agent?: string | null;
	org_id?: string | null;
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
export async function logAdminAction(entry: AuditLogEntry): Promise<{ success: boolean; error?: string }> {
	try {
		// Note: admin_audit table will be created by migration 20241217_admin_audit_table.sql
		// TypeScript may show error until types are regenerated with `supabase gen types`
		const { error } = await supabaseAdmin.from('admin_audit' as any).insert({
			admin_id: entry.admin_id,
			action: entry.action,
			target_type: entry.target_type,
			target_id: entry.target_id,
			metadata: entry.metadata,
			ip_address: entry.ip_address || null,
			user_agent: entry.user_agent || null,
			org_id: entry.org_id || null,
			created_at: new Date().toISOString()
		} as any);

		if (error) {
			console.error('[AuditLog] Failed to log admin action:', error);
			return { success: false, error: error.message };
		}

		console.log(`[AuditLog] ${entry.action} by ${entry.admin_id} on ${entry.target_type}:${entry.target_id}`);
		return { success: true };
	} catch (err) {
		console.error('[AuditLog] Exception logging admin action:', err);
		return { success: false, error: 'Internal error' };
	}
}

/**
 * Helper to extract request metadata for audit logging
 */
export function extractRequestMetadata(request: Request): { ip_address: string | null; user_agent: string | null } {
	return {
		ip_address: request.headers.get('x-real-ip') || 
			request.headers.get('cf-connecting-ip') || 
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
			null,
		user_agent: request.headers.get('user-agent')
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
	const { ip_address, user_agent } = extractRequestMetadata(request);
	
	await logAdminAction({
		admin_id: adminId,
		action: 'role_emulation_start',
		target_type: 'user',
		target_id: targetUserId,
		metadata: {
			emulated_role: emulatedRole,
			original_role: originalRole,
			started_at: new Date().toISOString()
		},
		ip_address,
		user_agent,
		org_id: orgId
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
	const { ip_address, user_agent } = extractRequestMetadata(request);
	
	await logAdminAction({
		admin_id: adminId,
		action: 'role_emulation_stop',
		target_type: 'user',
		target_id: adminId,
		metadata: {
			stopped_at: new Date().toISOString()
		},
		ip_address,
		user_agent,
		org_id: orgId
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
	const { ip_address, user_agent } = extractRequestMetadata(request);
	
	await logAdminAction({
		admin_id: adminId,
		action: 'credit_adjustment',
		target_type: 'credit',
		target_id: targetUserId,
		metadata: {
			amount,
			reason,
			adjusted_at: new Date().toISOString()
		},
		ip_address,
		user_agent,
		org_id: orgId
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
	const { ip_address, user_agent } = extractRequestMetadata(request);
	
	await logAdminAction({
		admin_id: adminId,
		action: 'user_role_change',
		target_type: 'role',
		target_id: targetUserId,
		metadata: {
			old_role: oldRole,
			new_role: newRole,
			changed_at: new Date().toISOString()
		},
		ip_address,
		user_agent,
		org_id: orgId
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
	const { ip_address, user_agent } = extractRequestMetadata(request);
	
	await logAdminAction({
		admin_id: adminId,
		action: 'org_settings_changed',
		target_type: 'organization',
		target_id: orgId,
		metadata: {
			changes,
			changed_at: new Date().toISOString()
		},
		ip_address,
		user_agent,
		org_id: orgId
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
	const { ip_address, user_agent } = extractRequestMetadata(request);
	
	await logAdminAction({
		admin_id: adminId,
		action: 'sensitive_data_accessed',
		target_type: 'system',
		target_id: recordId,
		metadata: {
			data_type: dataType,
			accessed_at: new Date().toISOString()
		},
		ip_address,
		user_agent,
		org_id: orgId
	});
}
