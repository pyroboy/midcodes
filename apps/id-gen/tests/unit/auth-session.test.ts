import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUserPermissions, cleanupPermissionCache, clearPermissionCache } from '$lib/services/permissions';

// Mock Supabase client
const mockSupabaseClient = {
	from: vi.fn(() => ({
		select: vi.fn(() => ({
			in: vi.fn(() => Promise.resolve({
				data: [
					{ permission: 'read_templates' },
					{ permission: 'write_templates' },
					{ permission: 'read_idcards' }
				],
				error: null
			}))
		}))
	}))
};

describe('Authentication & Session Management', () => {
	beforeEach(() => {
		clearPermissionCache();
		vi.clearAllMocks();
	});

	afterEach(() => {
		clearPermissionCache();
	});

	describe('Permission Service', () => {
		it('should return empty array for undefined roles', async () => {
			const permissions = await getUserPermissions(undefined, mockSupabaseClient as any);
			expect(permissions).toEqual([]);
		});

		it('should return empty array for empty roles array', async () => {
			const permissions = await getUserPermissions([], mockSupabaseClient as any);
			expect(permissions).toEqual([]);
		});

		it('should fetch and return unique permissions for valid roles', async () => {
			const roles = ['id_gen_admin', 'id_gen_user'];
			const permissions = await getUserPermissions(roles, mockSupabaseClient as any);
			
			expect(permissions).toEqual(['read_templates', 'write_templates', 'read_idcards']);
			expect(mockSupabaseClient.from).toHaveBeenCalledWith('role_permissions');
		});

		it('should cache permissions for 5 minutes', async () => {
			const roles = ['id_gen_admin'];
			
			// First call
			await getUserPermissions(roles, mockSupabaseClient as any);
			// Second call should use cache
			await getUserPermissions(roles, mockSupabaseClient as any);
			
			// Should only call database once
			expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
		});

		it('should handle database errors gracefully', async () => {
			const errorClient = {
				from: vi.fn(() => ({
					select: vi.fn(() => ({
						in: vi.fn(() => Promise.resolve({
							data: null,
							error: { message: 'Database error' }
						}))
					}))
				}))
			};

			const permissions = await getUserPermissions(['admin'], errorClient as any);
			expect(permissions).toEqual([]);
		});

		it('should remove duplicates from permissions', async () => {
			const duplicateClient = {
				from: vi.fn(() => ({
					select: vi.fn(() => ({
						in: vi.fn(() => Promise.resolve({
							data: [
								{ permission: 'read_templates' },
								{ permission: 'read_templates' }, // duplicate
								{ permission: 'write_templates' }
							],
							error: null
						}))
					}))
				}))
			};

			const permissions = await getUserPermissions(['admin'], duplicateClient as any);
			expect(permissions).toEqual(['read_templates', 'write_templates']);
		});
	});

	describe('Cache Management', () => {
		it('should clear all cached permissions', () => {
			// This is mainly testing that the function exists and doesn't throw
			expect(() => clearPermissionCache()).not.toThrow();
		});

		it('should cleanup expired cache entries', () => {
			// This is mainly testing that the function exists and doesn't throw
			expect(() => cleanupPermissionCache()).not.toThrow();
		});
	});
});