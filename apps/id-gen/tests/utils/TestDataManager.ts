/**
 * Test Data Manager
 * 
 * Manages lifecycle of test data creation and cleanup for tests.
 * Provides consistent test data with proper relationships and cleanup.
 */

import { createClient } from '@supabase/supabase-js';
import { OrganizationFactory } from './organization-factories';
import type { Database } from '$lib/types/database.types.js';

// Create a privileged Supabase client for tests using the service role key.
// This bypasses RLS so tests can seed and clean up real data.
const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

function admin() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing Supabase test configuration. Set VITE_PUBLIC_SUPABASE_URL/PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or TEST_SUPABASE_SERVICE_ROLE_KEY) for tests.'
    );
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

type Profile = Database['public']['Tables']['profiles']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type Template = Database['public']['Tables']['templates']['Row'];

interface TestData {
  organization: Organization;
  profile: Profile;
  template?: Template;
}

class TestDataManager {
  private createdData: {
    organizationIds: string[];
    profileIds: string[];
    templateIds: string[];
  } = {
    organizationIds: [],
    profileIds: [],
    templateIds: []
  };

  /**
   * Create minimal test data with organization and profile
   */
  async createMinimalTestData(): Promise<TestData> {
    // Create organization data
    const orgData = OrganizationFactory.createOrganization();
    const organization: Organization = {
      id: orgData.id,
      name: orgData.name,
      created_at: orgData.created_at,
      updated_at: orgData.updated_at
    };

    const { error: orgError } = await admin()
      .from('organizations')
      .insert(organization);

    if (orgError) {
      throw new Error(`Organization insert failed: ${orgError.message}`);
    }
    this.createdData.organizationIds.push(organization.id);

    // Create profile data
    const { faker } = await import('@faker-js/faker');
    const profileId = faker.string.uuid();
    const profile: Profile = {
      id: profileId,
      org_id: organization.id,
      email: `test-${Date.now()}@example.com`,
      avatar_url: null,
      card_generation_count: 0,
      context: null,
      created_at: new Date().toISOString(),
      credits_balance: 5,
      remove_watermarks: false,
      role: 'user',
      template_count: 0,
      unlimited_templates: false,
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await admin()
      .from('profiles')
      .insert(profile);

    if (profileError) {
      throw new Error(`Profile insert failed: ${profileError.message}`);
    }
    this.createdData.profileIds.push(profile.id);

    // Maintain mock data for compatibility
    if (typeof globalThis !== 'undefined' && (globalThis as any).__mockUserData) {
      (globalThis as any).__mockUserData.set(profileId, {
        org_id: profile.org_id,
        email: profile.email,
        role: profile.role,
        context: profile.context,
        template_count: profile.template_count,
        unlimited_templates: profile.unlimited_templates,
        credits: profile.credits_balance,
        credits_balance: profile.credits_balance,
        card_generation_count: profile.card_generation_count,
        templates_created: profile.template_count,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        remove_watermarks: profile.remove_watermarks
      });
      if ((globalThis as any).__mockTransactions && !(globalThis as any).__mockTransactions.get(profileId)) {
        (globalThis as any).__mockTransactions.set(profileId, []);
      }
    }

    return { organization, profile };
  }

  /**
   * Create user with specific credit configuration
   */
  async createUserWithCredits(config: {
    credits_balance?: number;
    card_generation_count?: number;
    template_count?: number;
    unlimited_templates?: boolean;
    remove_watermarks?: boolean;
    avatar_url?: string | null;
  } = {}): Promise<TestData> {
    const testData = await this.createMinimalTestData();
    
    // Update profile with credit information (in DB)
    testData.profile.credits_balance = config.credits_balance ?? 5;
    testData.profile.card_generation_count = config.card_generation_count ?? 0;
    testData.profile.template_count = config.template_count ?? 0;
    testData.profile.unlimited_templates = config.unlimited_templates ?? false;
    testData.profile.remove_watermarks = config.remove_watermarks ?? false;
    testData.profile.avatar_url = config.avatar_url ?? null;
    testData.profile.updated_at = new Date().toISOString();

    const { error: updateErr } = await admin()
      .from('profiles')
      .update({
        credits_balance: testData.profile.credits_balance,
        card_generation_count: testData.profile.card_generation_count,
        template_count: testData.profile.template_count,
        unlimited_templates: testData.profile.unlimited_templates,
        remove_watermarks: testData.profile.remove_watermarks,
        avatar_url: testData.profile.avatar_url,
        updated_at: testData.profile.updated_at
      })
      .eq('id', testData.profile.id);
    if (updateErr) throw new Error(`Failed to update profile for test: ${updateErr.message}`);

    // Update mock data as well
      if (typeof globalThis !== 'undefined' && (globalThis as any).__mockUserData) {
        (globalThis as any).__mockUserData.set(testData.profile.id, {
          org_id: testData.profile.org_id,
          email: testData.profile.email,
          role: testData.profile.role,
          context: testData.profile.context,
          template_count: testData.profile.template_count,
          unlimited_templates: testData.profile.unlimited_templates,
          credits: testData.profile.credits_balance, // Note: use 'credits' key for compatibility
          credits_balance: testData.profile.credits_balance,
          card_generation_count: testData.profile.card_generation_count,
          templates_created: testData.profile.template_count, // Also provide as templates_created
          created_at: testData.profile.created_at,
          updated_at: testData.profile.updated_at,
          remove_watermarks: testData.profile.remove_watermarks
        });
        if ((globalThis as any).__mockTransactions && !(globalThis as any).__mockTransactions.get(testData.profile.id)) {
          (globalThis as any).__mockTransactions.set(testData.profile.id, []);
        }
      }

    return testData;
  }

  /**
   * Create user with avatar URL
   */
  async createUserWithAvatar(avatarUrl: string): Promise<TestData> {
    return this.createUserWithCredits({
      avatar_url: avatarUrl
    });
  }

  /**
   * Create user with watermarks removal enabled
   */
  async createUserWithWatermarkRemoval(): Promise<TestData> {
    return this.createUserWithCredits({
      remove_watermarks: true
    });
  }

  /**
   * Create premium user with both avatar and watermark removal
   */
  async createPremiumUser(avatarUrl?: string): Promise<TestData> {
    return this.createUserWithCredits({
      avatar_url: avatarUrl || `https://example.com/avatars/test-${Date.now()}.jpg`,
      remove_watermarks: true,
      unlimited_templates: true,
      credits_balance: 100
    });
  }

  /**
   * Create test template
   */
  async createTemplate(data: Partial<Template> = {}, userData?: TestData): Promise<TestData> {
    const testData = userData || await this.createMinimalTestData();
    
    const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const template: Template = {
      id: templateId,
      name: data.name || 'Test Template',
      org_id: testData.organization.id,
      user_id: testData.profile.id,
      front_background: data.front_background || '#ffffff',
      back_background: data.back_background || '#f0f0f0',
      orientation: data.orientation || 'landscape',
      template_elements: data.template_elements || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dpi: data.dpi || 300,
      width_pixels: data.width_pixels || 1013,
      height_pixels: data.height_pixels || 638,
      ...data
    };

    // Insert into DB
    const { error: tplErr } = await admin()
      .from('templates')
      .insert(template);
    if (tplErr) throw new Error(`Template insert failed: ${tplErr.message}`);

    this.createdData.templateIds.push(template.id);

    return { ...testData, template };
  }

  /**
   * Create test profiles for an organization
   */
  async createTestProfiles(orgId: string): Promise<Profile[]> {
    const profiles: Profile[] = [];
    
    for (let i = 0; i < 3; i++) {
      const profileId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;
      const profile: Profile = {
        id: profileId,
        org_id: orgId,
        email: `test-${Date.now()}-${i}@example.com`,
        avatar_url: null,
        card_generation_count: 0,
        context: null,
        created_at: new Date().toISOString(),
        credits_balance: i === 0 ? 50 : 100,
        remove_watermarks: false,
        role: 'user',
        template_count: 0,
        unlimited_templates: false,
        updated_at: new Date().toISOString()
      };
      
      // Insert into DB
      const { error: pErr } = await admin().from('profiles').insert(profile);
      if (pErr) throw new Error(`Profile insert failed: ${pErr.message}`);

      this.createdData.profileIds.push(profile.id);
      
      // Initialize mock data for this user
      if (typeof globalThis !== 'undefined' && (globalThis as any).__mockUserData) {
        (globalThis as any).__mockUserData.set(profileId, {
          org_id: orgId,
          template_count: profile.template_count,
          unlimited_templates: profile.unlimited_templates,
          credits_balance: profile.credits_balance,
          card_generation_count: profile.card_generation_count
        });
      }
      
      profiles.push(profile);
    }
    
    return profiles;
  }

  /**
   * Create test organization
   */
  async createTestOrganization(): Promise<Organization> {
    const orgData = OrganizationFactory.createOrganization();
    const organization: Organization = {
      id: orgData.id,
      name: orgData.name,
      created_at: orgData.created_at,
      updated_at: orgData.updated_at
    };
    
    const { error } = await admin().from('organizations').insert(organization);
    if (error) throw new Error(`Organization insert failed: ${error.message}`);

    this.createdData.organizationIds.push(organization.id);
    return organization;
  }

  /**
   * Create complete test data set with multiple templates and users
   */
  async seedCompleteTestData(): Promise<TestData & { templates: Template[], profiles: Profile[] }> {
    const baseData = await this.createMinimalTestData();
    
    // Create additional templates
    const templates: Template[] = [];
    for (let i = 0; i < 3; i++) {
      const templateData = await this.createTemplate({
        name: `Test Template ${i + 1}`,
        orientation: i % 2 === 0 ? 'landscape' : 'portrait'
      }, baseData);
      templates.push(templateData.template!);
    }
    
    // Create additional profiles
    const profiles: Profile[] = [baseData.profile];
    for (let i = 0; i < 2; i++) {
      const additionalUser = await this.createUserWithCredits({
        credits_balance: 10 + (i * 5),
        card_generation_count: i,
        template_count: i + 1
      });
      profiles.push(additionalUser.profile);
    }
    
    return {
      ...baseData,
      templates,
      profiles
    };
  }

  /**
   * Create performance test data with large datasets
   */
  async createPerformanceTestData(): Promise<TestData & { templates: Template[], profiles: Profile[] }> {
    const baseData = await this.createMinimalTestData();
    
    // Create many templates for performance testing
    const templates: Template[] = [];
    for (let i = 0; i < 10; i++) {
      const templateData = await this.createTemplate({
        name: `Performance Template ${i + 1}`,
        template_elements: Array.from({ length: 5 }, (_, j) => ({
          id: `element-${i}-${j}`,
          type: j % 2 === 0 ? 'text' : 'image',
          x: j * 50,
          y: j * 30,
          width: 100,
          height: 30,
          variableName: `field_${j}`,
          side: 'front'
        }))
      }, baseData);
      templates.push(templateData.template!);
    }
    
    // Create many profiles for performance testing
    const profiles: Profile[] = [baseData.profile];
    for (let i = 0; i < 20; i++) {
      const perfUser = await this.createUserWithCredits({
        credits_balance: Math.floor(Math.random() * 100),
        card_generation_count: Math.floor(Math.random() * 50),
        template_count: Math.floor(Math.random() * 5)
      });
      profiles.push(perfUser.profile);
    }
    
    return {
      ...baseData,
      templates,
      profiles
    };
  }

  /**
   * Get resource counts for cleanup verification
   */
  getResourceCounts(): { organizations: number, profiles: number, templates: number } {
    return {
      organizations: this.createdData.organizationIds.length,
      profiles: this.createdData.profileIds.length,
      templates: this.createdData.templateIds.length
    };
  }

  /**
   * Reset manager state without cleanup
   */
  reset(): void {
    this.createdData = {
      organizationIds: [],
      profileIds: [],
      templateIds: []
    };
  }

  /**
   * Clean up all created test data
   */
  async cleanupAll(): Promise<void> {
    try {
      // Clean up templates first (child tables)
      if (this.createdData.templateIds.length > 0) {
        const { error: templateError } = await admin()
          .from('templates')
          .delete()
          .in('id', this.createdData.templateIds);
        
        if (templateError) {
          console.warn('Template cleanup failed:', templateError.message);
        }
      }

      // Clean up profiles
      if (this.createdData.profileIds.length > 0) {
        const { error: profileError } = await admin()
          .from('profiles')
          .delete()
          .in('id', this.createdData.profileIds);
        
        if (profileError) {
          console.warn('Profile cleanup failed:', profileError.message);
        }
      }

      // Clean up organizations last (parent tables)
      if (this.createdData.organizationIds.length > 0) {
        const { error: orgError } = await admin()
          .from('organizations')
          .delete()
          .in('id', this.createdData.organizationIds);
        
        if (orgError) {
          console.warn('Organization cleanup failed:', orgError.message);
        }
      }

      // Clean up mock data
      if (typeof globalThis !== 'undefined' && (globalThis as any).__mockUserData) {
        const mockUserData = (globalThis as any).__mockUserData;
        this.createdData.profileIds.forEach(id => {
          mockUserData.delete(id);
        });
      }

      // Clean up deleted users tracking
      if (typeof globalThis !== 'undefined' && (globalThis as any).__deletedUsers) {
        const deletedUsers = (globalThis as any).__deletedUsers;
        this.createdData.profileIds.forEach(id => {
          deletedUsers.delete(id);
        });
      }

      // Reset tracking
      this.createdData = {
        organizationIds: [],
        profileIds: [],
        templateIds: []
      };
    } catch (error) {
      console.warn('Cleanup error:', error);
      // Reset tracking even if cleanup fails
      this.createdData = {
        organizationIds: [],
        profileIds: [],
        templateIds: []
      };
    }
  }
}

// Export singleton instance
export const testDataManager = new TestDataManager();

/**
 * Utility functions for test data management
 */
export const testDataUtils = {
  /**
   * Simulate database error by marking user as deleted
   * This ensures mock functions will return appropriate error responses
   */
  simulateUserDeletion: (userId: string) => {
    // Remove from mock data
    if (typeof globalThis !== 'undefined' && (globalThis as any).__mockUserData) {
      (globalThis as any).__mockUserData.delete(userId);
    }
    
    // Add to deleted users set
    if (typeof globalThis !== 'undefined' && (globalThis as any).__deletedUsers) {
      (globalThis as any).__deletedUsers.add(userId);
    }
  },
  
  /**
   * Restore user after simulated deletion
   */
  restoreUser: (userId: string, userData?: any) => {
    // Remove from deleted users set
    if (typeof globalThis !== 'undefined' && (globalThis as any).__deletedUsers) {
      (globalThis as any).__deletedUsers.delete(userId);
    }
    
    // Restore to mock data if provided
    if (userData && typeof globalThis !== 'undefined' && (globalThis as any).__mockUserData) {
      (globalThis as any).__mockUserData.set(userId, userData);
    }
  },
  
  /**
   * Sync database updates with mock data
   * This ensures mock functions reflect database changes made via Supabase client
   */
  syncDatabaseUpdate: (userId: string, updates: {
    template_count?: number;
    unlimited_templates?: boolean;
    remove_watermarks?: boolean;
    credits_balance?: number;
    card_generation_count?: number;
  }) => {
    if (typeof globalThis !== 'undefined' && (globalThis as any).__mockUserData) {
      const mockUserData = (globalThis as any).__mockUserData;
      const userData = mockUserData.get(userId);
      
      if (userData) {
        // Update mock data to match database changes
        if (updates.template_count !== undefined) {
          userData.template_count = updates.template_count;
          userData.templates_created = updates.template_count; // Keep both for compatibility
        }
        if (updates.unlimited_templates !== undefined) {
          userData.unlimited_templates = updates.unlimited_templates;
        }
        if (updates.remove_watermarks !== undefined) {
          userData.remove_watermarks = updates.remove_watermarks;
        }
        if (updates.credits_balance !== undefined) {
          userData.credits = updates.credits_balance;
          userData.credits_balance = updates.credits_balance;
        }
        if (updates.card_generation_count !== undefined) {
          userData.card_generation_count = updates.card_generation_count;
        }
        
        // Update timestamp
        userData.updated_at = new Date().toISOString();
        
        mockUserData.set(userId, userData);
      }
    }
  }
};
