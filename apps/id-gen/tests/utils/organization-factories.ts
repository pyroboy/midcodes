/**
 * Organization Test Data Factories
 * 
 * Factory functions for creating consistent test data for organization-related tests.
 * Provides realistic test data with proper TypeScript types and relationships.
 */

import { faker } from '@faker-js/faker';
import { expect } from 'vitest';
import type { Database } from '$lib/types/database.types.js';
import type {
	OrganizationResponse,
	OrganizationCreation,
	OrganizationUpdate,
	OrgSettings,
	OrganizationStats,
	OrganizationMember,
	OrganizationLimits,
	OrganizationBilling
} from '$lib/schemas/organization.schema.js';

// Seed faker for consistent test data
faker.seed(12345);

// Helper to generate consistent UUIDs
const generateTestUUID = (prefix: string = 'test'): string => {
	return `${prefix}-${faker.string.uuid().slice(5)}`;
};

// Generate timestamp ranges
const generateDateRange = (daysAgo: number = 30) => {
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(endDate.getDate() - daysAgo);
	return { startDate, endDate };
};

/**
 * Organization Data Factories
 */
export const OrganizationFactory = {
	/**
	 * Create a complete organization response object
	 */
	createOrganization: (overrides: Partial<OrganizationResponse> = {}): OrganizationResponse => ({
		id: generateTestUUID('org'),
		name: faker.company.name(),
		created_at: faker.date.past().toISOString(),
		updated_at: faker.date.recent().toISOString(),
		...overrides
	}),

	/**
	 * Create organization creation data
	 */
	createOrganizationInput: (overrides: Partial<OrganizationCreation> = {}): OrganizationCreation => ({
		name: faker.company.name(),
		...overrides
	}),

	/**
	 * Create organization update data
	 */
	createOrganizationUpdate: (orgId?: string, overrides: Partial<OrganizationUpdate> = {}): OrganizationUpdate => ({
		id: orgId || generateTestUUID('org'),
		name: faker.company.name(),
		...overrides
	}),

	/**
	 * Create multiple organizations
	 */
	createOrganizations: (count: number = 3): OrganizationResponse[] => {
		return Array.from({ length: count }, (_, index) => 
			OrganizationFactory.createOrganization({
				name: `${faker.company.name()} ${index + 1}`
			})
		);
	},

	/**
	 * Create organization with specific patterns
	 */
	createOrganizationWithPattern: (pattern: 'tech' | 'education' | 'healthcare' | 'government'): OrganizationResponse => {
		const patterns = {
			tech: () => `${faker.hacker.noun().toUpperCase()} Technologies`,
			education: () => `${faker.location.city()} University`,
			healthcare: () => `${faker.location.city()} Medical Center`,
			government: () => `Department of ${faker.commerce.department()}`
		};

		return OrganizationFactory.createOrganization({
			name: patterns[pattern]()
		});
	}
};

/**
 * Organization Settings Factories
 */
export const OrgSettingsFactory = {
	/**
	 * Create organization settings
	 */
	createOrgSettings: (orgId?: string, overrides: Partial<OrgSettings> = {}): OrgSettings => ({
		org_id: orgId || generateTestUUID('org'),
		payments_enabled: faker.datatype.boolean(),
		payments_bypass: faker.datatype.boolean(),
		updated_by: generateTestUUID('user'),
		updated_at: faker.date.recent().toISOString(),
		...overrides
	}),

	/**
	 * Create default organization settings
	 */
	createDefaultOrgSettings: (orgId: string): OrgSettings => ({
		org_id: orgId,
		payments_enabled: false,
		payments_bypass: false,
		updated_by: generateTestUUID('admin'),
		updated_at: new Date().toISOString()
	}),

	/**
	 * Create premium organization settings
	 */
	createPremiumOrgSettings: (orgId: string): OrgSettings => ({
		org_id: orgId,
		payments_enabled: true,
		payments_bypass: false,
		updated_by: generateTestUUID('admin'),
		updated_at: new Date().toISOString()
	})
};

/**
 * Organization Statistics Factories
 */
export const OrgStatsFactory = {
	/**
	 * Create organization statistics
	 */
	createOrgStats: (orgId?: string, overrides: Partial<OrganizationStats> = {}): OrganizationStats => {
		const totalTemplates = faker.number.int({ min: 0, max: 100 });
		const totalCards = faker.number.int({ min: 0, max: 1000 });
		const activeUsers = faker.number.int({ min: 1, max: 50 });

		return {
			org_id: orgId || generateTestUUID('org'),
			total_templates: totalTemplates,
			total_id_cards: totalCards,
			active_users: activeUsers,
			templates_this_month: faker.number.int({ min: 0, max: Math.floor(totalTemplates / 2) }),
			cards_this_month: faker.number.int({ min: 0, max: Math.floor(totalCards / 4) }),
			storage_usage: {
				total_bytes: faker.number.int({ min: 1000000, max: 10000000000 }),
				templates_bytes: faker.number.int({ min: 100000, max: 1000000 }),
				cards_bytes: faker.number.int({ min: 500000, max: 5000000 }),
				formatted_size: `${faker.number.int({ min: 1, max: 1000 })} MB`
			},
			...overrides
		};
	},

	/**
	 * Create empty organization statistics
	 */
	createEmptyOrgStats: (orgId: string): OrganizationStats => ({
		org_id: orgId,
		total_templates: 0,
		total_id_cards: 0,
		active_users: 1, // At least one admin user
		templates_this_month: 0,
		cards_this_month: 0,
		storage_usage: {
			total_bytes: 0,
			templates_bytes: 0,
			cards_bytes: 0,
			formatted_size: '0 MB'
		}
	}),

	/**
	 * Create high-volume organization statistics
	 */
	createHighVolumeOrgStats: (orgId: string): OrganizationStats => ({
		org_id: orgId,
		total_templates: faker.number.int({ min: 500, max: 2000 }),
		total_id_cards: faker.number.int({ min: 10000, max: 100000 }),
		active_users: faker.number.int({ min: 100, max: 500 }),
		templates_this_month: faker.number.int({ min: 50, max: 200 }),
		cards_this_month: faker.number.int({ min: 1000, max: 5000 }),
		storage_usage: {
			total_bytes: faker.number.int({ min: 10000000000, max: 100000000000 }),
			templates_bytes: faker.number.int({ min: 1000000000, max: 5000000000 }),
			cards_bytes: faker.number.int({ min: 5000000000, max: 50000000000 }),
			formatted_size: `${faker.number.int({ min: 10, max: 100 })} GB`
		}
	})
};

/**
 * Organization Member Factories
 */
export const OrgMemberFactory = {
	/**
	 * Create organization member
	 */
	createOrgMember: (orgId?: string, overrides: Partial<OrganizationMember> = {}): OrganizationMember => ({
		id: generateTestUUID('user'),
		email: faker.internet.email(),
		role: faker.helpers.arrayElement(['org_admin', 'id_gen_admin', 'id_gen_user']),
		created_at: faker.date.past().toISOString(),
		updated_at: faker.date.recent().toISOString(),
		org_id: orgId || generateTestUUID('org'),
		context: null,
		...overrides
	}),

	/**
	 * Create multiple organization members
	 */
	createOrgMembers: (orgId: string, count: number = 5): OrganizationMember[] => {
		const roles = ['org_admin', 'id_gen_admin', 'id_gen_user'] as const;
		
		return Array.from({ length: count }, (_, index) => 
			OrgMemberFactory.createOrgMember(orgId, {
				email: `user${index + 1}@${faker.internet.domainName()}`,
				role: roles[index % roles.length]
			})
		);
	},

	/**
	 * Create organization admin
	 */
	createOrgAdmin: (orgId: string): OrganizationMember => 
		OrgMemberFactory.createOrgMember(orgId, {
			email: `admin@${faker.internet.domainName()}`,
			role: 'org_admin'
		}),

	/**
	 * Create super admin
	 */
	createSuperAdmin: (): OrganizationMember => 
		OrgMemberFactory.createOrgMember(undefined, {
			email: 'superadmin@system.com',
			role: 'super_admin' as any // Type assertion for super_admin
		})
};

/**
 * Organization Limits Factories
 */
export const OrgLimitsFactory = {
	/**
	 * Create organization limits
	 */
	createOrgLimits: (orgId?: string, overrides: Partial<OrganizationLimits> = {}): OrganizationLimits => ({
		org_id: orgId || generateTestUUID('org'),
		max_templates: faker.number.int({ min: 10, max: 100 }),
		max_users: faker.number.int({ min: 5, max: 50 }),
		max_storage_bytes: faker.number.int({ min: 1000000000, max: 10000000000 }),
		max_cards_per_month: faker.number.int({ min: 100, max: 10000 }),
		features: {
			custom_branding: faker.datatype.boolean(),
			advanced_templates: faker.datatype.boolean(),
			api_access: faker.datatype.boolean(),
			bulk_operations: faker.datatype.boolean(),
			export_formats: faker.helpers.arrayElements(['pdf', 'png', 'jpeg', 'svg'], { min: 1, max: 4 })
		},
		...overrides
	}),

	/**
	 * Create free tier limits
	 */
	createFreeTierLimits: (orgId: string): OrganizationLimits => ({
		org_id: orgId,
		max_templates: 5,
		max_users: 3,
		max_storage_bytes: 100000000, // 100MB
		max_cards_per_month: 100,
		features: {
			custom_branding: false,
			advanced_templates: false,
			api_access: false,
			bulk_operations: false,
			export_formats: ['png']
		}
	}),

	/**
	 * Create enterprise limits
	 */
	createEnterpriseLimits: (orgId: string): OrganizationLimits => ({
		org_id: orgId,
		max_templates: -1, // Unlimited
		max_users: -1, // Unlimited
		max_storage_bytes: -1, // Unlimited
		max_cards_per_month: -1, // Unlimited
		features: {
			custom_branding: true,
			advanced_templates: true,
			api_access: true,
			bulk_operations: true,
			export_formats: ['pdf', 'png', 'jpeg', 'svg']
		}
	})
};

/**
 * Organization Billing Factories
 */
export const OrgBillingFactory = {
	/**
	 * Create organization billing info
	 */
	createOrgBilling: (orgId?: string, overrides: Partial<OrganizationBilling> = {}): OrganizationBilling => ({
		org_id: orgId || generateTestUUID('org'),
		plan: faker.helpers.arrayElement(['free', 'starter', 'professional', 'enterprise']),
		billing_email: faker.internet.email(),
		payment_method: {
			type: faker.helpers.arrayElement(['credit_card', 'bank_transfer', 'invoice']),
			last_four: faker.finance.creditCardNumber().slice(-4),
			expires_at: faker.date.future().toISOString()
		},
		subscription: {
			status: faker.helpers.arrayElement(['active', 'canceled', 'past_due', 'trialing']),
			current_period_start: faker.date.past().toISOString(),
			current_period_end: faker.date.future().toISOString(),
			trial_end: faker.date.soon().toISOString()
		},
		...overrides
	}),

	/**
	 * Create free plan billing
	 */
	createFreePlanBilling: (orgId: string): OrganizationBilling => ({
		org_id: orgId,
		plan: 'free',
		billing_email: faker.internet.email()
		// No payment method or subscription for free plan
	}),

	/**
	 * Create active subscription billing
	 */
	createActiveSubscriptionBilling: (orgId: string, plan: 'starter' | 'professional' | 'enterprise' = 'professional'): OrganizationBilling => ({
		org_id: orgId,
		plan,
		billing_email: faker.internet.email(),
		payment_method: {
			type: 'credit_card',
			last_four: '4242',
			expires_at: faker.date.future().toISOString()
		},
		subscription: {
			status: 'active',
			current_period_start: faker.date.past({ years: 1 }).toISOString(),
			current_period_end: faker.date.future({ years: 1 }).toISOString()
		}
	})
};

/**
 * Mock Supabase Client Factory
 */
export const MockSupabaseFactory = {
	/**
	 * Create mock Supabase client with organization-specific methods
	 */
	createMockSupabaseClient: (customResponses: Record<string, any> = {}) => ({
		from: (table: string) => ({
			select: (columns: string = '*', options?: any) => ({
				eq: (column: string, value: any) => ({
					single: () => Promise.resolve({
						data: customResponses[`${table}_select_eq_single`] || null,
						error: customResponses[`${table}_select_eq_single_error`] || null
					}),
					order: (column: string, options?: any) => ({
						range: (from: number, to: number) => Promise.resolve({
							data: customResponses[`${table}_select_eq_order_range`] || [],
							error: customResponses[`${table}_select_eq_order_range_error`] || null,
							count: customResponses[`${table}_count`] || 0
						})
					}),
					...(options?.count === 'exact' && {
						[Symbol.asyncIterator]: () => Promise.resolve({
							count: customResponses[`${table}_count`] || 0
						})
					})
				}),
				ilike: (column: string, pattern: string) => ({
					order: (column: string, options?: any) => ({
						range: (from: number, to: number) => Promise.resolve({
							data: customResponses[`${table}_search`] || [],
							error: customResponses[`${table}_search_error`] || null,
							count: customResponses[`${table}_search_count`] || 0
						})
					})
				}),
				order: (column: string, options?: any) => ({
					range: (from: number, to: number) => Promise.resolve({
						data: customResponses[`${table}_select_order_range`] || [],
						error: customResponses[`${table}_select_order_range_error`] || null,
						count: customResponses[`${table}_count`] || 0
					})
				})
			}),
			insert: (data: any) => ({
				select: (columns?: string) => ({
					single: () => Promise.resolve({
						data: customResponses[`${table}_insert`] || data,
						error: customResponses[`${table}_insert_error`] || null
					})
				})
			}),
			update: (data: any) => ({
				eq: (column: string, value: any) => ({
					select: (columns?: string) => ({
						single: () => Promise.resolve({
							data: customResponses[`${table}_update`] || { ...data, updated_at: new Date().toISOString() },
							error: customResponses[`${table}_update_error`] || null
						})
					})
				})
			}),
			delete: () => ({
				eq: (column: string, value: any) => Promise.resolve({
					error: customResponses[`${table}_delete_error`] || null
				})
			})
		})
	}),

	/**
	 * Create mock request event
	 */
	createMockRequestEvent: (user: any, orgId?: string, supabaseOverrides: any = {}) => ({
		locals: {
			user,
			supabase: MockSupabaseFactory.createMockSupabaseClient(supabaseOverrides),
			org_id: orgId || user?.org_id
		}
	})
};

/**
 * Test Scenario Builders
 */
export const TestScenarioFactory = {
	/**
	 * Create complete organization test scenario
	 */
	createOrganizationScenario: (scenarioType: 'basic' | 'enterprise' | 'startup' = 'basic') => {
		const org = OrganizationFactory.createOrganization();
		const settings = OrgSettingsFactory.createOrgSettings(org.id);
		const stats = OrgStatsFactory.createOrgStats(org.id);
		const members = OrgMemberFactory.createOrgMembers(org.id, 5);
		const limits = scenarioType === 'enterprise' 
			? OrgLimitsFactory.createEnterpriseLimits(org.id)
			: OrgLimitsFactory.createFreeTierLimits(org.id);
		const billing = scenarioType === 'enterprise'
			? OrgBillingFactory.createActiveSubscriptionBilling(org.id, 'enterprise')
			: OrgBillingFactory.createFreePlanBilling(org.id);

		return {
			organization: org,
			settings,
			stats,
			members,
			limits,
			billing,
			adminUser: members.find(m => m.role === 'org_admin')!,
			regularUsers: members.filter(m => m.role !== 'org_admin')
		};
	},

	/**
	 * Create multi-organization test scenario
	 */
	createMultiOrgScenario: (orgCount: number = 3) => {
		return Array.from({ length: orgCount }, () => 
			TestScenarioFactory.createOrganizationScenario()
		);
	}
};

/**
 * Assertion Helpers
 */
export const OrganizationAssertions = {
	/**
	 * Assert organization structure is valid
	 */
	assertValidOrganization: (org: OrganizationResponse) => {
		expect(org).toBeDefined();
		expect(org.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		expect(org.name).toBeTruthy();
		expect(org.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		expect(org.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
	},

	/**
	 * Assert organization settings structure is valid
	 */
	assertValidOrgSettings: (settings: OrgSettings) => {
		expect(settings).toBeDefined();
		expect(settings.org_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		expect(typeof settings.payments_enabled).toBe('boolean');
		expect(typeof settings.payments_bypass).toBe('boolean');
		expect(settings.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
	},

	/**
	 * Assert organization statistics structure is valid
	 */
	assertValidOrgStats: (stats: OrganizationStats) => {
		expect(stats).toBeDefined();
		expect(stats.org_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		expect(typeof stats.total_templates).toBe('number');
		expect(typeof stats.total_id_cards).toBe('number');
		expect(typeof stats.active_users).toBe('number');
		expect(stats.storage_usage).toBeDefined();
		expect(typeof stats.storage_usage.total_bytes).toBe('number');
	}
};