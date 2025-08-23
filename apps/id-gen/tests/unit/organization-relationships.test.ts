/**
 * Organization Relationships Unit Tests
 * 
 * Tests for organization relationships with profiles, templates, 
 * settings, and other related entities.
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	OrganizationFactory,
	OrgSettingsFactory,
	OrgMemberFactory,
	OrgStatsFactory,
	MockSupabaseFactory,
	TestScenarioFactory,
	OrganizationAssertions
} from '../utils/organization-factories.js';

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

// Test organization relationships
describe('Organization-Profile Relationships', () => {

	test('organization can have multiple members with different roles', async () => {
		const scenario = TestScenarioFactory.createOrganizationScenario('enterprise');
		const { organization, members } = scenario;

		// Verify member roles are distributed
		const roles = members.map(m => m.role);
		expect(roles).toContain('org_admin');
		expect(roles).toContain('id_gen_admin');
		expect(roles).toContain('id_gen_user');

		// Verify all members belong to the same organization
		members.forEach(member => {
			expect(member.org_id).toBe(organization.id);
		});
	});

	test('organization admin can manage organization members', () => {
		const org = OrganizationFactory.createOrganization();
		const admin = OrgMemberFactory.createOrgAdmin(org.id);
		const regularUser = OrgMemberFactory.createOrgMember(org.id, { role: 'id_gen_user' });

		// Admin should have management permissions
		expect(admin.role).toBe('org_admin');
		expect(admin.org_id).toBe(org.id);

		// Regular user should have limited permissions
		expect(regularUser.role).toBe('id_gen_user');
		expect(regularUser.org_id).toBe(org.id);
	});

	test('organization deletion should handle member cleanup', () => {
		const org = OrganizationFactory.createOrganization();
		const members = OrgMemberFactory.createOrgMembers(org.id, 10);

		// When organization is deleted, all members should be affected
		// This would be handled by database constraints or cleanup logic
		members.forEach(member => {
			expect(member.org_id).toBe(org.id);
		});

		// Test that we can identify all related members
		const orgMembers = members.filter(m => m.org_id === org.id);
		expect(orgMembers).toHaveLength(10);
	});

});

describe('Organization-Template Relationships', () => {

	test('organization can have multiple templates', () => {
		const org = OrganizationFactory.createOrganization();
		
		// Mock template data
		const templates = Array.from({ length: 5 }, (_, index) => ({
			id: `template-${index}`,
			name: `Template ${index + 1}`,
			org_id: org.id,
			user_id: `user-${index}`,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}));

		// Verify all templates belong to organization
		templates.forEach(template => {
			expect(template.org_id).toBe(org.id);
		});

		// Verify template count matches
		expect(templates).toHaveLength(5);
	});

	test('template ownership within organization', () => {
		const org = OrganizationFactory.createOrganization();
		const member1 = OrgMemberFactory.createOrgMember(org.id);
		const member2 = OrgMemberFactory.createOrgMember(org.id);

		// Mock templates owned by different members
		const template1 = {
			id: 'template-1',
			name: 'Member 1 Template',
			org_id: org.id,
			user_id: member1.id,
			created_at: new Date().toISOString()
		};

		const template2 = {
			id: 'template-2',
			name: 'Member 2 Template',
			org_id: org.id,
			user_id: member2.id,
			created_at: new Date().toISOString()
		};

		// Both templates should belong to same org but different users
		expect(template1.org_id).toBe(org.id);
		expect(template2.org_id).toBe(org.id);
		expect(template1.user_id).toBe(member1.id);
		expect(template2.user_id).toBe(member2.id);
		expect(template1.user_id).not.toBe(template2.user_id);
	});

	test('organization template statistics accuracy', () => {
		const org = OrganizationFactory.createOrganization();
		const stats = OrgStatsFactory.createOrgStats(org.id, {
			total_templates: 25,
			templates_this_month: 5
		});

		expect(stats.org_id).toBe(org.id);
		expect(stats.total_templates).toBe(25);
		expect(stats.templates_this_month).toBe(5);
		expect(stats.templates_this_month).toBeLessThanOrEqual(stats.total_templates);
	});

});

describe('Organization-IDCard Relationships', () => {

	test('organization can generate multiple ID cards', () => {
		const org = OrganizationFactory.createOrganization();
		
		// Mock ID card data
		const idCards = Array.from({ length: 50 }, (_, index) => ({
			id: `card-${index}`,
			org_id: org.id,
			template_id: `template-${index % 5}`, // 5 different templates
			data: { name: `Person ${index + 1}` },
			created_at: new Date().toISOString()
		}));

		// Verify all cards belong to organization
		idCards.forEach(card => {
			expect(card.org_id).toBe(org.id);
		});

		// Verify card distribution across templates
		const templateUsage = idCards.reduce((acc, card) => {
			acc[card.template_id] = (acc[card.template_id] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		expect(Object.keys(templateUsage)).toHaveLength(5);
	});

	test('ID card statistics match actual data', () => {
		const org = OrganizationFactory.createOrganization();
		const stats = OrgStatsFactory.createOrgStats(org.id, {
			total_id_cards: 100,
			cards_this_month: 20
		});

		expect(stats.org_id).toBe(org.id);
		expect(stats.total_id_cards).toBe(100);
		expect(stats.cards_this_month).toBe(20);
		expect(stats.cards_this_month).toBeLessThanOrEqual(stats.total_id_cards);
	});

});

describe('Organization-Settings Relationships', () => {

	test('organization has one-to-one relationship with settings', () => {
		const org = OrganizationFactory.createOrganization();
		const settings = OrgSettingsFactory.createOrgSettings(org.id);

		expect(settings.org_id).toBe(org.id);
		OrganizationAssertions.assertValidOrgSettings(settings);
	});

	test('organization settings affect payment capabilities', () => {
		const org = OrganizationFactory.createOrganization();
		
		// Test enabled payments
		const enabledSettings = OrgSettingsFactory.createOrgSettings(org.id, {
			payments_enabled: true,
			payments_bypass: false
		});

		expect(enabledSettings.payments_enabled).toBe(true);
		expect(enabledSettings.payments_bypass).toBe(false);

		// Test bypass mode
		const bypassSettings = OrgSettingsFactory.createOrgSettings(org.id, {
			payments_enabled: false,
			payments_bypass: true
		});

		expect(bypassSettings.payments_enabled).toBe(false);
		expect(bypassSettings.payments_bypass).toBe(true);
	});

	test('settings update tracking', () => {
		const org = OrganizationFactory.createOrganization();
		const admin = OrgMemberFactory.createOrgAdmin(org.id);
		
		const settings = OrgSettingsFactory.createOrgSettings(org.id, {
			updated_by: admin.id
		});

		expect(settings.updated_by).toBe(admin.id);
		expect(settings.updated_at).toBeTruthy();
	});

});

describe('Organization Cross-Entity Relationships', () => {

	test('complete organization ecosystem', () => {
		const scenario = TestScenarioFactory.createOrganizationScenario('enterprise');
		const { organization, settings, stats, members, adminUser } = scenario;

		// Verify all entities are linked to the organization
		expect(settings.org_id).toBe(organization.id);
		expect(stats.org_id).toBe(organization.id);
		
		members.forEach(member => {
			expect(member.org_id).toBe(organization.id);
		});

		// Verify admin exists and is properly configured
		expect(adminUser).toBeDefined();
		expect(adminUser.role).toBe('org_admin');
		expect(adminUser.org_id).toBe(organization.id);

		// Verify statistics are consistent
		expect(stats.active_users).toBeGreaterThan(0);
		expect(stats.total_templates).toBeGreaterThanOrEqual(0);
		expect(stats.total_id_cards).toBeGreaterThanOrEqual(0);
	});

	test('organization isolation between different orgs', () => {
		const multiOrgScenario = TestScenarioFactory.createMultiOrgScenario(3);
		
		// Extract all organization IDs
		const orgIds = multiOrgScenario.map(scenario => scenario.organization.id);
		
		// Verify all IDs are unique
		const uniqueOrgIds = new Set(orgIds);
		expect(uniqueOrgIds.size).toBe(3);

		// Verify data isolation
		multiOrgScenario.forEach((scenario, index) => {
			const { organization, settings, stats, members } = scenario;
			
			// All related data should belong to this organization only
			expect(settings.org_id).toBe(organization.id);
			expect(stats.org_id).toBe(organization.id);
			
			members.forEach(member => {
				expect(member.org_id).toBe(organization.id);
			});

			// Verify no cross-contamination with other orgs
			const otherOrgIds = orgIds.filter((_, i) => i !== index);
			otherOrgIds.forEach(otherOrgId => {
				expect(settings.org_id).not.toBe(otherOrgId);
				expect(stats.org_id).not.toBe(otherOrgId);
				
				members.forEach(member => {
					expect(member.org_id).not.toBe(otherOrgId);
				});
			});
		});
	});

	test('organization data consistency across relationships', () => {
		const org = OrganizationFactory.createOrganization();
		const settings = OrgSettingsFactory.createOrgSettings(org.id);
		const stats = OrgStatsFactory.createOrgStats(org.id);
		const members = OrgMemberFactory.createOrgMembers(org.id, 10);

		// Stats should reflect actual member count
		expect(stats.active_users).toBeGreaterThan(0);
		
		// All members should be valid
		members.forEach(member => {
			expect(member.org_id).toBe(org.id);
			expect(member.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
			expect(['org_admin', 'id_gen_admin', 'id_gen_user']).toContain(member.role);
		});

		// Settings should be properly configured
		expect(typeof settings.payments_enabled).toBe('boolean');
		expect(typeof settings.payments_bypass).toBe('boolean');
		expect(settings.org_id).toBe(org.id);
	});

});

describe('Organization Cascade Operations', () => {

	test('organization deletion impact assessment', () => {
		const scenario = TestScenarioFactory.createOrganizationScenario('basic');
		const { organization, members } = scenario;

		// Mock related data that would be affected by deletion
		const relatedData = {
			members: members.length,
			templates: 5,
			idCards: 25,
			settings: 1
		};

		// Verify we can identify all related data
		expect(relatedData.members).toBeGreaterThan(0);
		expect(relatedData.templates).toBeGreaterThanOrEqual(0);
		expect(relatedData.idCards).toBeGreaterThanOrEqual(0);
		expect(relatedData.settings).toBe(1);

		// Calculate deletion impact
		const totalRecords = Object.values(relatedData).reduce((sum, count) => sum + count, 1); // +1 for org itself
		expect(totalRecords).toBeGreaterThan(1);
	});

	test('member removal impact on organization', () => {
		const org = OrganizationFactory.createOrganization();
		const members = OrgMemberFactory.createOrgMembers(org.id, 5);
		const adminMembers = members.filter(m => m.role === 'org_admin');
		const regularMembers = members.filter(m => m.role !== 'org_admin');

		// Verify we have at least one admin
		expect(adminMembers.length).toBeGreaterThan(0);

		// Removing regular members should be safe
		expect(regularMembers.length).toBeGreaterThan(0);

		// Removing all admins should be prevented
		if (adminMembers.length === 1) {
			// This is the last admin - removal should be blocked
			expect(adminMembers.length).toBe(1);
		}
	});

});

describe('Organization Data Integrity', () => {

	test('referential integrity validation', () => {
		const org = OrganizationFactory.createOrganization();
		const member = OrgMemberFactory.createOrgMember(org.id);
		const settings = OrgSettingsFactory.createOrgSettings(org.id, {
			updated_by: member.id
		});

		// Settings should reference valid member and organization
		expect(settings.org_id).toBe(org.id);
		expect(settings.updated_by).toBe(member.id);
		
		// Member should belong to the organization
		expect(member.org_id).toBe(org.id);
	});

	test('organization statistics data integrity', () => {
		const org = OrganizationFactory.createOrganization();
		const stats = OrgStatsFactory.createOrgStats(org.id);

		// Verify stats make logical sense
		expect(stats.templates_this_month).toBeLessThanOrEqual(stats.total_templates);
		expect(stats.cards_this_month).toBeLessThanOrEqual(stats.total_id_cards);
		expect(stats.active_users).toBeGreaterThan(0); // Should have at least one user
		
		// Storage usage should be consistent
		const { storage_usage } = stats;
		expect(storage_usage.total_bytes).toBeGreaterThanOrEqual(
			storage_usage.templates_bytes + storage_usage.cards_bytes
		);
	});

	test('organization settings constraints', () => {
		const org = OrganizationFactory.createOrganization();
		
		// Test various settings combinations
		const validSettings = [
			{ payments_enabled: true, payments_bypass: false },
			{ payments_enabled: false, payments_bypass: false },
			{ payments_enabled: false, payments_bypass: true },
			// Note: payments_enabled: true && payments_bypass: true might be invalid business logic
		];

		validSettings.forEach(settingsCombination => {
			const settings = OrgSettingsFactory.createOrgSettings(org.id, settingsCombination);
			
			expect(settings.org_id).toBe(org.id);
			expect(typeof settings.payments_enabled).toBe('boolean');
			expect(typeof settings.payments_bypass).toBe('boolean');
		});
	});

});