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
      full_name: 'Test User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: null,
      role: 'user',
      credits: 5,
      credits_used: 0,
      templates_created: 0,
      unlimited_templates: false,
      unlimited_generations: false
    };
    
    this.createdData.profileIds.push(profile.id);

    return {
      organization,
      profile
    };
  }

  /**
   * Create user with specific credit configuration
   */
  async createUserWithCredits(config: {
    credits?: number;
    creditsUsed?: number;
    templatesCreated?: number;
    unlimited_templates?: boolean;
  } = {}): Promise<TestData> {
    const testData = await this.createMinimalTestData();
    
    // Update profile with credit information
    testData.profile.credits = config.credits ?? 5;
    testData.profile.credits_used = config.creditsUsed ?? 0;
    testData.profile.templates_created = config.templatesCreated ?? 0;
    testData.profile.unlimited_templates = config.unlimited_templates ?? false;
    testData.profile.updated_at = new Date().toISOString();

    return testData;
  }

  /**
   * Create test template
   */
  async createTemplate(data: Partial<Template> = {}, userData?: TestData): Promise<TestData> {
    const testData = userData || await this.createMinimalTestData();
    
    const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { data: template } = await supabase
      .from('templates')
      .insert({
        id: templateId,
        name: data.name || 'Test Template',
        org_id: testData.organization.id,
        user_id: testData.profile.id,
        front_background: data.front_background || '#ffffff',
        back_background: data.back_background || '#f0f0f0',
        orientation: data.orientation || 'landscape',
        template_elements: data.template_elements || [],
        created_at: new Date().toISOString(),
        dpi: data.dpi || 300,
        width_pixels: data.width_pixels || 1013,
        height_pixels: data.height_pixels || 638,
        ...data
      })
      .select()
      .single();

    if (!template) {
      throw new Error('Failed to create test template');
    }
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
      // Clean up templates
      if (this.createdData.templateIds.length > 0) {
        await supabase
          .from('templates')
          .delete()
          .in('id', this.createdData.templateIds);
      }

      // Clean up profiles
      if (this.createdData.profileIds.length > 0) {
        await supabase
          .from('profiles')
          .delete()
          .in('id', this.createdData.profileIds);
      }

      // Clean up organizations
      if (this.createdData.organizationIds.length > 0) {
        await supabase
          .from('organizations')
          .delete()
          .in('id', this.createdData.organizationIds);
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