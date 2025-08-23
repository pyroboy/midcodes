/**
 * Organization Unit Tests (using real Supabase client)
 * 
 * Validates organization functionality including CRUD, permissions, search, and settings
 * against a real Supabase instance. Requires PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY
 * to be configured (tests/setup.ts provides defaults).
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
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

// Mock SvelteKit's error helper to throw Http-like errors
vi.mock('@sveltejs/kit', () => ({
	error: vi.fn((status: number, message: string) => {
		const err = new Error(message) as any;
		err.status = status;
		return err;
	})
}));

// Use the Vitest alias to the $app/server stub instead of inline mocking

// Real Supabase client used in tests
let supabase: ReturnType<typeof createClient>;

// Test IDs and helpers
const TEST_ORG_ID_1 = '11111111-1111-4111-9111-111111111111';
const TEST_ORG_ID_2 = '22222222-2222-4222-9222-222222222222';
const TEST_USER_SUPER = '33333333-3333-4333-9333-333333333333';
const TEST_USER_ORG_ADMIN = '44444444-4444-4444-9444-444444444444';

const uniqueName = (base: string) => `${base} ${Math.random().toString(36).slice(2, 8)}`;

function createRequestEvent(user: any, orgId?: string) {
	return {
		locals: {
			user,
			supabase,
			org_id: orgId ?? user?.org_id
		}
	};
}

// Import the functions to test after stubbing
let organizationFunctions: any;

async function cleanup() {
	// Best-effort cleanup of our test artifacts
	try {
		await supabase.from('org_settings').delete().in('org_id', [TEST_ORG_ID_1, TEST_ORG_ID_2]);
		await supabase.from('profiles').delete().in('id', [TEST_USER_SUPER, TEST_USER_ORG_ADMIN]);
		await supabase.from('organizations').delete().in('id', [TEST_ORG_ID_1, TEST_ORG_ID_2]);
	} catch {}
}

beforeEach(async () => {
	vi.clearAllMocks();

	// Initialize real Supabase client
	const url = process.env.PUBLIC_SUPABASE_URL || process.env.VITE_PUBLIC_SUPABASE_URL || '';
	const anon = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';
	supabase = createClient(url, anon);

	await cleanup();

	// Default request event (super_admin with org 1)
	const { setTestRequestEvent } = await import('$app/server');
	setTestRequestEvent(
		createRequestEvent(
			{ id: TEST_USER_SUPER, email: 'super@test.com', role: 'super_admin', org_id: TEST_ORG_ID_1 },
			TEST_ORG_ID_1
		)
	);

	// Import organization functions
	organizationFunctions = await import('$lib/remote/organization.remote.js');
});

afterEach(async () => {
	await cleanup();
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
		const name = uniqueName('Org');
		const result = await organizationFunctions.createOrganization({ name });
		expect(result.success).toBe(true);
		expect(result.organization).toBeDefined();
		expect(result.organization.name).toBe(name);
		// Verify org settings created (best-effort)
		const { data: settings } = await supabase.from('org_settings').select('*').eq('org_id', result.organization.id).maybeSingle();
		expect(settings?.org_id).toBe(result.organization.id);
	});

	test('createOrganization - duplicate name causes a failure', async () => {
		const name = uniqueName('DupOrg');
		await supabase.from('organizations').insert({ id: TEST_ORG_ID_2, name, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		await expect(organizationFunctions.createOrganization({ name })).rejects.toThrow();
	});

	test('getOrganization - success', async () => {
		// seed org and set it on event
		await supabase.from('organizations').insert({ id: TEST_ORG_ID_1, name: uniqueName('GetOrg'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		const { setTestRequestEvent } = await import('$app/server');
		setTestRequestEvent(createRequestEvent({ id: TEST_USER_SUPER, email: 'super@test.com', role: 'super_admin', org_id: TEST_ORG_ID_1 }, TEST_ORG_ID_1));
		const result = await organizationFunctions.getOrganization();
		expect(result?.id).toBe(TEST_ORG_ID_1);
	});

	test('getOrganization - not found throws', async () => {
		const { setTestRequestEvent } = await import('$app/server');
		setTestRequestEvent(createRequestEvent({ id: TEST_USER_SUPER, email: 'super@test.com', role: 'super_admin', org_id: TEST_ORG_ID_1 }, TEST_ORG_ID_1));
		await expect(organizationFunctions.getOrganization()).rejects.toThrow();
	});

	test('updateOrganization - success', async () => {
		const name = uniqueName('ToUpdate');
		await supabase.from('organizations').insert({ id: TEST_ORG_ID_1, name, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		const result = await organizationFunctions.updateOrganization({ id: TEST_ORG_ID_1, name: name + ' Updated' });
		expect(result.success).toBe(true);
		expect(result.organization?.name).toBe(name + ' Updated');
	});

	test('deleteOrganization - success', async () => {
		const name = uniqueName('ToDelete');
		const { data: inserted } = await supabase.from('organizations').insert({ name, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
		const result = await organizationFunctions.deleteOrganization(inserted!.id);
		expect(result.success).toBe(true);
		// Verify deletion
		const { data: after } = await supabase.from('organizations').select('id').eq('id', inserted!.id).maybeSingle();
		expect(after).toBeNull();
	});

	test('deleteOrganization - fails if org has users', async () => {
		// Seed org and one profile
		await supabase.from('organizations').insert({ id: TEST_ORG_ID_2, name: uniqueName('HasUsers'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		await supabase.from('profiles').insert({ id: TEST_USER_ORG_ADMIN, org_id: TEST_ORG_ID_2, email: 'user@test.com', role: 'org_admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		await expect(organizationFunctions.deleteOrganization(TEST_ORG_ID_2)).rejects.toThrow();
	});

});

describe('Organization Settings', () => {

	test('getOrganizationSettings - existing settings', async () => {
		await supabase.from('organizations').insert({ id: TEST_ORG_ID_1, name: uniqueName('Org'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		await supabase.from('org_settings').insert({ org_id: TEST_ORG_ID_1, payments_enabled: true, payments_bypass: false, updated_by: TEST_USER_SUPER, updated_at: new Date().toISOString() });
		const result = await organizationFunctions.getOrganizationSettings();
		expect(result.org_id).toBe(TEST_ORG_ID_1);
		expect(result.payments_enabled).toBe(true);
	});

	test('getOrganizationSettings - creates default when missing', async () => {
		await supabase.from('organizations').insert({ id: TEST_ORG_ID_1, name: uniqueName('Org'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		const result = await organizationFunctions.getOrganizationSettings();
		expect(result.org_id).toBe(TEST_ORG_ID_1);
		expect(result.payments_enabled).toBe(false);
	});

	test('updateOrganizationSettings - success', async () => {
		await supabase.from('organizations').insert({ id: TEST_ORG_ID_1, name: uniqueName('Org'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		await supabase.from('org_settings').insert({ org_id: TEST_ORG_ID_1, payments_enabled: false, payments_bypass: false, updated_by: TEST_USER_SUPER, updated_at: new Date().toISOString() });
		const result = await organizationFunctions.updateOrganizationSettings({ org_id: TEST_ORG_ID_1, payments_enabled: true, updated_by: TEST_USER_SUPER });
		expect(result.success).toBe(true);
		expect(result.settings?.payments_enabled).toBe(true);
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

		// No seeding required; ensure it returns structure for empty org
		await supabase.from('organizations').insert({ id: TEST_ORG_ID_1, name: uniqueName('StatsOrg'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		const result = await organizationFunctions.getOrganizationStats();
		expect(result.org_id).toBe(TEST_ORG_ID_1);
		expect(typeof result.total_templates).toBe('number');
		expect(typeof result.total_id_cards).toBe('number');
		expect(typeof result.active_users).toBe('number');
		expect(typeof result.templates_this_month).toBe('number');
		expect(typeof result.cards_this_month).toBe('number');
	});

});

describe('Organization Search', () => {

	test('searchOrganizations - basic search', async () => {
		const name1 = uniqueName('Org Search Test');
		const name2 = uniqueName('Org Search Another');
		await supabase.from('organizations').insert([
			{ id: TEST_ORG_ID_1, name: name1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
			{ id: TEST_ORG_ID_2, name: name2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
		]);
		const result = await organizationFunctions.searchOrganizations({ query: 'Org Search' });
		expect(result.total).toBeGreaterThanOrEqual(1);
		expect(result.organizations.some((o: any) => o.name.includes('Org Search'))).toBe(true);
	});

	test('searchOrganizations - with filters and sorting', async () => {
		const base = uniqueName('Filtered');
		await supabase.from('organizations').insert([
			{ name: base + ' A', created_at: '2024-06-01T00:00:00.000Z', updated_at: '2024-06-01T00:00:00.000Z' },
			{ name: base + ' B', created_at: '2024-07-01T00:00:00.000Z', updated_at: '2024-07-01T00:00:00.000Z' }
		]);
		const result = await organizationFunctions.searchOrganizations({
			query: base,
			limit: 10,
			offset: 0,
			sort_by: 'name',
			sort_order: 'asc',
			filters: { created_after: '2024-05-01T00:00:00.000Z', created_before: '2024-12-31T23:59:59.999Z' }
		});
		expect(result.total).toBeGreaterThanOrEqual(1);
		expect(result.organizations.every((o: any) => o.name.includes(base))).toBe(true);
	});

});

describe('Permission and Access Control', () => {

	test('requireSuperAdminPermissions - valid super admin', async () => {
		const { setTestRequestEvent } = await import('$app/server');
		setTestRequestEvent(createRequestEvent({ id: TEST_USER_SUPER, email: 'super@test.com', role: 'super_admin', org_id: TEST_ORG_ID_1 }, TEST_ORG_ID_1));
		const result = await organizationFunctions.createOrganization({ name: uniqueName('Perm') });
		expect(result.success).toBe(true);
	});

	test('requireSuperAdminPermissions - insufficient permissions', async () => {
		const { setTestRequestEvent } = await import('$app/server');
		setTestRequestEvent(createRequestEvent({ id: TEST_USER_ORG_ADMIN, email: 'admin@test.com', role: 'org_admin', org_id: TEST_ORG_ID_1 }, TEST_ORG_ID_1));
		await expect(organizationFunctions.createOrganization({ name: uniqueName('NoPerm') }))
			.rejects.toThrow('Super admin privileges required');
	});

	test('requireOrgAdminPermissions - valid org admin', async () => {
		const { setTestRequestEvent } = await import('$app/server');
		await supabase.from('organizations').insert({ id: TEST_ORG_ID_1, name: uniqueName('Org'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		setTestRequestEvent(createRequestEvent({ id: TEST_USER_ORG_ADMIN, email: 'admin@test.com', role: 'org_admin', org_id: TEST_ORG_ID_1 }, TEST_ORG_ID_1));
		const result = await organizationFunctions.getOrganizationSettings();
		expect(result.org_id).toBe(TEST_ORG_ID_1);
	});

	test('requireOrgAdminPermissions - insufficient permissions', async () => {
		const { setTestRequestEvent } = await import('$app/server');
		setTestRequestEvent(createRequestEvent({ id: TEST_USER_ORG_ADMIN, email: 'user@test.com', role: 'id_gen_user', org_id: TEST_ORG_ID_1 }, TEST_ORG_ID_1));
		await expect(organizationFunctions.getOrganizationSettings())
			.rejects.toThrow('Organization admin privileges required');
	});

	test('cross-organization access denied', async () => {
		const { setTestRequestEvent } = await import('$app/server');
		await supabase.from('organizations').insert([
			{ id: TEST_ORG_ID_1, name: uniqueName('Org1'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
			{ id: TEST_ORG_ID_2, name: uniqueName('Org2'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
		]);
		setTestRequestEvent(createRequestEvent({ id: TEST_USER_ORG_ADMIN, email: 'admin@test.com', role: 'org_admin', org_id: TEST_ORG_ID_1 }, TEST_ORG_ID_1));
		await expect(organizationFunctions.getOrganization(TEST_ORG_ID_2))
			.rejects.toThrow('Access denied to this organization');
	});

});

describe('Error Handling and Edge Cases', () => {

	test('missing organization ID', async () => {
		const { setTestRequestEvent } = await import('$app/server');
		setTestRequestEvent(createRequestEvent({ id: TEST_USER_ORG_ADMIN, email: 'admin@test.com', role: 'org_admin', org_id: undefined }, undefined));
		await expect(organizationFunctions.getOrganizationStats())
			.rejects.toThrow('Organization ID not found');
	});

	test('getOrganization throws when org missing', async () => {
		await expect(organizationFunctions.getOrganization()).rejects.toThrow();
	});

	test('invalid UUID format', async () => {
		await expect(organizationFunctions.getOrganization('invalid-uuid')).rejects.toThrow();
	});

	test('createOrganization duplicate eventually fails', async () => {
		const name = uniqueName('Dup');
		await supabase.from('organizations').insert({ id: TEST_ORG_ID_1, name, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
		await expect(organizationFunctions.createOrganization({ name })).rejects.toThrow();
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

describe.skip('Performance and Concurrency', () => {

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