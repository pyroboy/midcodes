/**
 * Role Emulation Security Utilities
 * SECURITY: Provides functions for verifying role emulation state
 */

import type { GetSessionResult } from '$lib/types/auth';

export interface RoleEmulationState {
	active: boolean;
	emulatedRole: string | null;
	originalRole: string | null;
	expiresAt: string | null;
	startedAt: string | null;
}

/**
 * SECURITY: Verifies that role emulation is still valid (not expired)
 * Should be called before critical operations when emulation is active
 * 
 * @param roleEmulation - The role emulation state from session
 * @returns true if valid, throws error if expired
 */
export function verifyRoleEmulationActive(roleEmulation: RoleEmulationState | null | undefined): boolean {
	// No emulation active - always valid
	if (!roleEmulation?.active) {
		return true;
	}

	// Check expiration
	if (roleEmulation.expiresAt) {
		const expiresAt = new Date(roleEmulation.expiresAt);
		const now = new Date();
		
		if (now > expiresAt) {
			throw new Error('Role emulation has expired. Please refresh your session.');
		}
	}

	return true;
}

/**
 * SECURITY: Checks if role emulation is expired without throwing
 * Useful for conditional checks
 * 
 * @param roleEmulation - The role emulation state from session
 * @returns true if emulation is expired or needs refresh
 */
export function isRoleEmulationExpired(roleEmulation: RoleEmulationState | null | undefined): boolean {
	if (!roleEmulation?.active) {
		return false; // No emulation = not expired
	}

	if (!roleEmulation.expiresAt) {
		return false; // No expiration set
	}

	const expiresAt = new Date(roleEmulation.expiresAt);
	return new Date() > expiresAt;
}

/**
 * SECURITY: Checks if role emulation will expire soon (within specified minutes)
 * Useful for showing warnings to admins
 * 
 * @param roleEmulation - The role emulation state from session
 * @param withinMinutes - Minutes before expiration to consider "expiring soon"
 */
export function isRoleEmulationExpiringSoon(
	roleEmulation: RoleEmulationState | null | undefined,
	withinMinutes: number = 30
): boolean {
	if (!roleEmulation?.active || !roleEmulation.expiresAt) {
		return false;
	}

	const expiresAt = new Date(roleEmulation.expiresAt);
	const warningTime = new Date(expiresAt.getTime() - withinMinutes * 60 * 1000);
	
	return new Date() > warningTime;
}

/**
 * SECURITY: Validates role emulation for session and returns clean state
 * Ensures the emulation state is consistent and not expired
 */
export function validateRoleEmulation(session: GetSessionResult): {
	isEmulating: boolean;
	effectiveRole: string | null;
	isExpired: boolean;
	expiresAt: Date | null;
} {
	const roleEmulation = session.roleEmulation;
	
	if (!roleEmulation?.active) {
		return {
			isEmulating: false,
			effectiveRole: null,
			isExpired: false,
			expiresAt: null
		};
	}

	const isExpired = isRoleEmulationExpired(roleEmulation);
	
	return {
		isEmulating: !isExpired,
		effectiveRole: isExpired ? null : (roleEmulation.emulatedRole || null),
		isExpired,
		expiresAt: roleEmulation.expiresAt ? new Date(roleEmulation.expiresAt) : null
	};
}
