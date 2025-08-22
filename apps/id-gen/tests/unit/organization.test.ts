/**
 * Organization Unit Tests
 * 
 * Comprehensive unit test suite for organization functionality including
 * CRUD operations, validation, permissions, and error handling.
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { error } from '@sveltejs/kit';
import type { Database } from '$lib/types/database.types.js';
import {
	organizationCreationSchema,
	organizationUpdateSchema,
	orgSettingsUpdateSchema,
	organizationSearchSchema,
	type OrganizationCreation,
	type OrganizationResponse,
	type OrganizationUpdate,
	type OrgSettings
} from '$lib/schemas/organization.schema.js';

// Mock SvelteKit modules
vi.mock('@sveltejs/kit', () => ({
	error: vi.fn((status: number, message: string) => {
		const err = new Error(message) as any;
		err.status = status;
		return err;
	})
}));

vi.mock('$app/server', () => ({
	query: vi.fn((fn) => fn),
	command: vi.fn((type, fn) => fn),
	getRequestEvent: vi.fn()
}));

// Mock organization remote module with flexible structure
const mockSupabase = {
	from: vi.fn()
};

// Test data factories
export const createMockOrganization = (overrides: Partial<OrganizationResponse> = {}): OrganizationResponse => ({
	id: '123e4567-e89b-12d3-a456-426614174000',
	name: 'Test Organization',
	created_at: '2024-01-01T00:00:00.000Z',
	updated_at: '2024-01-01T00:00:00.000Z',
	...overrides
});

export const createMockOrgSettings = (overrides: Partial<OrgSettings> = {}): OrgSettings => ({
	org_id: '123e4567-e89b-12d3-a456-426614174000',
	payments_enabled: false,
	payments_bypass: false,
	updated_by: '456e7890-e89b-12d3-a456-426614174001',
	updated_at: '2024-01-01T00:00:00.000Z',
	...overrides
});

export const createMockUser = (role: string = 'org_admin') => ({
	id: '456e7890-e89b-12d3-a456-426614174001',
	email: 'test@example.com',
	role,
	org_id: '123e4567-e89b-12d3-a456-426614174000'
});

export const createMockRequestEvent = (user: any, orgId?: string) => ({
	locals: {
		user,
		supabase: mockSupabase,
		org_id: orgId || user?.org_id
	}
});

// Import the functions to test after mocking
let organizationFunctions: any;

beforeEach(async () => {
	vi.clearAllMocks();
	
	// Mock getRequestEvent for each test
	const { getRequestEvent } = await import('$app/server');
	(getRequestEvent as any).mockReturnValue(createMockRequestEvent(createMockUser('super_admin')));
	
	// Import organization functions
	organizationFunctions = await import('$lib/remote/organization.remote.js');
});

afterEach(() => {
	vi.resetAllMocks();
});

describe('Organization Schema Validation', () => {
	
	test('organizationCreationSchema - valid data', () => {
		const validData: OrganizationCreation = {
			name: 'Test Organization'
		};

		const result = organizationCreationSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test('organizationCreationSchema - invalid data', () => {
		const invalidData = {
			name: '' // Empty name
		};

		const result = organizationCreationSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].message).toBe('Organization name is required');
	});

	test('organizationCreationSchema - name too long', () => {
		const invalidData = {
			name: 'a'.repeat(101) // Too long
		};

		const result = organizationCreationSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].message).toBe('Organization name must be less than 100 characters');
	});

	test('organizationCreationSchema - name trimming', () => {
		const dataWithSpaces = {
			name: '  Test Organization  '
		};

		const result = organizationCreationSchema.parse(dataWithSpaces);
		expect(result.name).toBe('Test Organization');
	});

	test('organizationUpdateSchema - valid partial update', () => {
		const validUpdate: OrganizationUpdate = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'Updated Organization Name'
		};

		const result = organizationUpdateSchema.safeParse(validUpdate);
		expect(result.success).toBe(true);
	});

	test('organizationUpdateSchema - missing required id', () => {
		const invalidUpdate = {
			name: 'Updated Name'
			// Missing id
		};

		const result = organizationUpdateSchema.safeParse(invalidUpdate);
		expect(result.success).toBe(false);
	});

	test('orgSettingsUpdateSchema - valid settings update', () => {
		const validSettings = {
			org_id: '123e4567-e89b-12d3-a456-426614174000',
			payments_enabled: true,
			updated_by: '456e7890-e89b-12d3-a456-426614174001'
		};

		const result = orgSettingsUpdateSchema.safeParse(validSettings);
		expect(result.success).toBe(true);
	});

	test('organizationSearchSchema - default values', () => {
		const searchData = {};

		const result = organizationSearchSchema.parse(searchData);
		expect(result.limit).toBe(20);
		expect(result.offset).toBe(0);
		expect(result.sort_by).toBe('created_at');
		expect(result.sort_order).toBe('desc');
	});

});

describe('Organization CRUD Operations', () => {

	test('createOrganization - success', async () => {
		const mockOrg = createMockOrganization();
		
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: null,
						error: { code: 'PGRST116' } // No rows found
					})
				})
			})
		});

		mockSupabase.from.mockReturnValueOnce({
			insert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: mockOrg,
						error: null
					})
				})
			})
		});

		mockSupabase.from.mockReturnValueOnce({
			insert: vi.fn().mockResolvedValue({ error: null })
		});

		const result = await organizationFunctions.createOrganization({
			name: 'Test Organization'
		});

		expect(result.success).toBe(true);
		expect(result.organization).toEqual(mockOrg);
		expect(result.message).toBe('Organization created successfully');
	});

	test('createOrganization - duplicate name error', async () => {
		const existingOrg = createMockOrganization();
		
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: existingOrg,
						error: null
					})
				})
			})
		});

		await expect(organizationFunctions.createOrganization({
			name: 'Test Organization'
		})).rejects.toThrow('Organization with this name already exists');
	});

	test('getOrganization - success', async () => {
		const mockOrg = createMockOrganization();
		
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: mockOrg,
						error: null
					})
				})
			})
		});

		const result = await organizationFunctions.getOrganization();
		expect(result).toEqual(mockOrg);
	});

	test('getOrganization - not found error', async () => {
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: null,
						error: { message: 'Not found' }
					})
				})
			})
		});

		await expect(organizationFunctions.getOrganization())
			.rejects.toThrow('Organization not found');
	});

	test('updateOrganization - success', async () => {
		const updatedOrg = createMockOrganization({ name: 'Updated Organization' });
		
		// Mock name conflict check
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					neq: vi.fn().mockReturnValue({
						single: vi.fn().mockResolvedValue({
							data: null,
							error: { code: 'PGRST116' }
						})
					})
				})
			})
		});

		// Mock update
		mockSupabase.from.mockReturnValueOnce({
			update: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					select: vi.fn().mockReturnValue({
						single: vi.fn().mockResolvedValue({
							data: updatedOrg,
							error: null
						})
					})
				})
			})
		});

		const result = await organizationFunctions.updateOrganization({
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'Updated Organization'
		});

		expect(result.success).toBe(true);
		expect(result.organization).toEqual(updatedOrg);
	});

	test('deleteOrganization - success', async () => {
		const mockOrg = createMockOrganization();
		
		// Mock organization fetch
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: mockOrg,
						error: null
					})
				})
			})
		});

		// Mock counts (empty organization)
		const mockCountQuery = {
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ count: 0 })
			})
		};
		
		mockSupabase.from.mockReturnValueOnce(mockCountQuery); // users
		mockSupabase.from.mockReturnValueOnce(mockCountQuery); // templates
		mockSupabase.from.mockReturnValueOnce(mockCountQuery); // cards

		// Mock settings deletion
		mockSupabase.from.mockReturnValueOnce({
			delete: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ error: null })
			})
		});

		// Mock organization deletion
		mockSupabase.from.mockReturnValueOnce({
			delete: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ error: null })
			})
		});

		const result = await organizationFunctions.deleteOrganization('123e4567-e89b-12d3-a456-426614174000');

		expect(result.success).toBe(true);
		expect(result.message).toContain('deleted successfully');
	});

	test('deleteOrganization - has active data error', async () => {
		const mockOrg = createMockOrganization();
		
		// Mock organization fetch
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: mockOrg,
						error: null
					})
				})
			})
		});

		// Mock counts (organization has users)
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ count: 5 }) // Has users
			})
		});

		await expect(organizationFunctions.deleteOrganization('123e4567-e89b-12d3-a456-426614174000'))
			.rejects.toThrow('Cannot delete organization with existing users');
	});

});

describe('Organization Settings', () => {

	test('getOrganizationSettings - existing settings', async () => {
		const mockSettings = createMockOrgSettings();
		
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: mockSettings,
						error: null
					})
				})
			})
		});

		const result = await organizationFunctions.getOrganizationSettings();
		expect(result).toEqual(mockSettings);
	});

	test('getOrganizationSettings - create default settings', async () => {
		const mockSettings = createMockOrgSettings();
		
		// Mock no existing settings
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: null,
						error: { code: 'PGRST116' }
					})
				})
			})
		});

		// Mock settings creation
		mockSupabase.from.mockReturnValueOnce({
			insert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: mockSettings,
						error: null
					})
				})
			})
		});

		const result = await organizationFunctions.getOrganizationSettings();
		expect(result).toEqual(mockSettings);
	});

	test('updateOrganizationSettings - success', async () => {
		const updatedSettings = createMockOrgSettings({ payments_enabled: true });
		
		mockSupabase.from.mockReturnValueOnce({
			update: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					select: vi.fn().mockReturnValue({
						single: vi.fn().mockResolvedValue({
							data: updatedSettings,
							error: null
						})
					})
				})
			})
		});

		const result = await organizationFunctions.updateOrganizationSettings({
			org_id: '123e4567-e89b-12d3-a456-426614174000',
			payments_enabled: true,
			updated_by: '456e7890-e89b-12d3-a456-426614174001'
		});

		expect(result.success).toBe(true);
		expect(result.settings).toEqual(updatedSettings);
	});

});

describe('Organization Statistics', () => {

	test('getOrganizationStats - success', async () => {
		// Mock all stat queries
		const mockStatQuery = {
			select: vi.fn().mockReturnValue({
				eq: vi.fn(() => ({
					gte: vi.fn(() => ({
						lt: vi.fn().mockResolvedValue({ count: 10 })
					})),
					mockResolvedValue: ({ count: 5 })
				}))
			})
		};

		// Mock templates count
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ count: 15 })
			})
		});

		// Mock cards count
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ count: 25 })
			})
		});

		// Mock active users count
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ count: 8 })
			})
		});

		// Mock this month templates
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					gte: vi.fn().mockReturnValue({
						lt: vi.fn().mockResolvedValue({ count: 3 })
					})
				})
			})
		});

		// Mock this month cards
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					gte: vi.fn().mockReturnValue({
						lt: vi.fn().mockResolvedValue({ count: 12 })
					})
				})
			})
		});

		const result = await organizationFunctions.getOrganizationStats();

		expect(result).toEqual({
			org_id: '123e4567-e89b-12d3-a456-426614174000',
			total_templates: 15,
			total_id_cards: 25,
			active_users: 8,
			templates_this_month: 3,
			cards_this_month: 12,
			storage_usage: {
				total_bytes: 0,
				templates_bytes: 0,
				cards_bytes: 0,
				formatted_size: '0 MB'
			}
		});
	});

});

describe('Organization Search', () => {

	test('searchOrganizations - basic search', async () => {
		const mockOrgs = [createMockOrganization(), createMockOrganization({ name: 'Another Org' })];
		
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				ilike: vi.fn().mockReturnValue({
					order: vi.fn().mockReturnValue({
						range: vi.fn().mockResolvedValue({
							data: mockOrgs,
							error: null,
							count: 2
						})
					})
				})
			})
		});

		const result = await organizationFunctions.searchOrganizations({
			query: 'Test'
		});

		expect(result.organizations).toEqual(mockOrgs);
		expect(result.total).toBe(2);
	});

	test('searchOrganizations - with filters and sorting', async () => {
		const mockOrgs = [createMockOrganization()];
		
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				ilike: vi.fn().mockReturnValue({
					gte: vi.fn().mockReturnValue({
						lte: vi.fn().mockReturnValue({
							order: vi.fn().mockReturnValue({
								range: vi.fn().mockResolvedValue({
									data: mockOrgs,
									error: null,
									count: 1
								})
							})
						})
					})
				})
			})
		});

		const result = await organizationFunctions.searchOrganizations({
			query: 'Test',
			limit: 10,
			offset: 0,
			sort_by: 'name',
			sort_order: 'asc',
			filters: {
				created_after: '2024-01-01T00:00:00.000Z',
				created_before: '2024-12-31T23:59:59.999Z'
			}
		});

		expect(result.organizations).toEqual(mockOrgs);
		expect(result.total).toBe(1);
	});

});

describe('Permission and Access Control', () => {

	test('requireSuperAdminPermissions - valid super admin', async () => {
		const { getRequestEvent } = await import('$app/server');
		(getRequestEvent as any).mockReturnValue(createMockRequestEvent(createMockUser('super_admin')));

		// This should not throw an error
		const result = await organizationFunctions.createOrganization({ name: 'Test' });
		// The test will fail if an error is thrown during permission check
	});

	test('requireSuperAdminPermissions - insufficient permissions', async () => {
		const { getRequestEvent } = await import('$app/server');
		(getRequestEvent as any).mockReturnValue(createMockRequestEvent(createMockUser('org_admin')));

		await expect(organizationFunctions.createOrganization({ name: 'Test' }))
			.rejects.toThrow('Super admin privileges required');
	});

	test('requireOrgAdminPermissions - valid org admin', async () => {
		const { getRequestEvent } = await import('$app/server');
		(getRequestEvent as any).mockReturnValue(createMockRequestEvent(createMockUser('org_admin')));

		const mockSettings = createMockOrgSettings();
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: mockSettings,
						error: null
					})
				})
			})
		});

		const result = await organizationFunctions.getOrganizationSettings();
		expect(result).toEqual(mockSettings);
	});

	test('requireOrgAdminPermissions - insufficient permissions', async () => {
		const { getRequestEvent } = await import('$app/server');
		(getRequestEvent as any).mockReturnValue(createMockRequestEvent(createMockUser('id_gen_user')));

		await expect(organizationFunctions.getOrganizationSettings())
			.rejects.toThrow('Organization admin privileges required');
	});

	test('cross-organization access denied', async () => {
		const { getRequestEvent } = await import('$app/server');
		(getRequestEvent as any).mockReturnValue(createMockRequestEvent(createMockUser('org_admin'), 'different-org-id'));

		await expect(organizationFunctions.getOrganization('123e4567-e89b-12d3-a456-426614174000'))
			.rejects.toThrow('Access denied to this organization');
	});

});

describe('Error Handling and Edge Cases', () => {

	test('missing organization ID', async () => {
		const { getRequestEvent } = await import('$app/server');
		(getRequestEvent as any).mockReturnValue(createMockRequestEvent(createMockUser('org_admin'), undefined));

		await expect(organizationFunctions.getOrganizationStats())
			.rejects.toThrow('Organization ID not found');
	});

	test('database connection error', async () => {
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: null,
						error: { message: 'Connection failed' }
					})
				})
			})
		});

		await expect(organizationFunctions.getOrganization())
			.rejects.toThrow('Organization not found');
	});

	test('invalid UUID format', async () => {
		await expect(organizationFunctions.getOrganization('invalid-uuid'))
			.rejects.toThrow();
	});

	test('organization creation with database error', async () => {
		// Mock successful name check
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: null,
						error: { code: 'PGRST116' }
					})
				})
			})
		});

		// Mock database error on insert
		mockSupabase.from.mockReturnValueOnce({
			insert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: null,
						error: { message: 'Database error' }
					})
				})
			})
		});

		await expect(organizationFunctions.createOrganization({ name: 'Test' }))
			.rejects.toThrow('Failed to create organization');
	});

});

describe('Data Validation and Integrity', () => {

	test('organization name with special characters', () => {
		const validData = {
			name: 'Test & Company LLC (2024)'
		};

		const result = organizationCreationSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test('organization name with unicode characters', () => {
		const validData = {
			name: 'Тест Организация 测试公司'
		};

		const result = organizationCreationSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	test('settings validation with boolean values', () => {
		const validSettings = {
			org_id: '123e4567-e89b-12d3-a456-426614174000',
			payments_enabled: true,
			payments_bypass: false,
			updated_by: '456e7890-e89b-12d3-a456-426614174001'
		};

		const result = orgSettingsUpdateSchema.safeParse(validSettings);
		expect(result.success).toBe(true);
	});

	test('search parameters validation', () => {
		const searchParams = {
			query: 'test',
			limit: 50,
			offset: 10,
			sort_by: 'name',
			sort_order: 'asc',
			filters: {
				created_after: '2024-01-01T00:00:00.000Z'
			}
		};

		const result = organizationSearchSchema.safeParse(searchParams);
		expect(result.success).toBe(true);
	});

	test('invalid search parameters', () => {
		const invalidParams = {
			limit: 200, // Too high
			sort_by: 'invalid_field'
		};

		const result = organizationSearchSchema.safeParse(invalidParams);
		expect(result.success).toBe(false);
	});

});

describe('Performance and Concurrency', () => {

	test('concurrent organization creation with same name', async () => {
		// This would be handled by database unique constraints
		// First call succeeds
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: null,
						error: { code: 'PGRST116' }
					})
				})
			})
		});

		// Second call finds existing organization
		mockSupabase.from.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: createMockOrganization(),
						error: null
					})
				})
			})
		});

		const promises = [
			organizationFunctions.createOrganization({ name: 'Duplicate Name' }),
			organizationFunctions.createOrganization({ name: 'Duplicate Name' })
		];

		// One should succeed, one should fail
		const results = await Promise.allSettled(promises);
		expect(results.some(r => r.status === 'fulfilled')).toBe(true);
		expect(results.some(r => r.status === 'rejected')).toBe(true);
	});

});