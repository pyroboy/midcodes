/**
 * Test Data Manager
 * 
 * Manages lifecycle of test data creation and cleanup for tests.
 * Provides consistent test data with proper relationships and cleanup.
 */

import { supabase } from '$lib/supabaseClient';
import { OrganizationFactory } from './organization-factories';
import type { Database } from '$lib/types/database.types.js';

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
    
    this.createdData.organizationIds.push(organization.id);

    // Create profile data
    const profileId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    
    this.createdData.profileIds.push(profile.id);

    // Initialize mock data for this user
    if (typeof globalThis !== 'undefined' && (globalThis as any).__mockUserData) {
      (globalThis as any).__mockUserData.set(profileId, {
        template_count: profile.template_count,
        unlimited_templates: profile.unlimited_templates,
        credits_balance: profile.credits_balance,
        card_generation_count: profile.card_generation_count
      });
    }

    return {
      organization,
      profile
    };
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
    
    // Update profile with credit information
    testData.profile.credits_balance = config.credits_balance ?? 5;
    testData.profile.card_generation_count = config.card_generation_count ?? 0;
    testData.profile.template_count = config.template_count ?? 0;
    testData.profile.unlimited_templates = config.unlimited_templates ?? false;
    testData.profile.remove_watermarks = config.remove_watermarks ?? false;
    testData.profile.avatar_url = config.avatar_url ?? null;
    testData.profile.updated_at = new Date().toISOString();

    // Update mock data as well
    if (typeof globalThis !== 'undefined' && (globalThis as any).__mockUserData) {
      (globalThis as any).__mockUserData.set(testData.profile.id, {
        template_count: testData.profile.template_count,
        unlimited_templates: testData.profile.unlimited_templates,
        credits_balance: testData.profile.credits_balance,
        card_generation_count: testData.profile.card_generation_count
      });
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

    this.createdData.templateIds.push(template.id);

    return {
      ...testData,
      template
    };
  }

  /**
   * Clean up all created test data
   */
  async cleanupAll(): Promise<void> {
    try {
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