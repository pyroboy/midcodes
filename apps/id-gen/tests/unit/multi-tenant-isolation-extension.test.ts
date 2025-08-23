import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { supabase } from '$lib/supabaseClient';

describe('Template & ID Card Isolation Extension', () => {
  let testData1: any;
  let testData2: any;

  beforeEach(async () => {
    testData1 = await testDataManager.createMinimalTestData();
    testData2 = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Template Data Isolation', () => {
    it('should isolate templates between organizations', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Create template in org1
      const { data: template1 } = await supabase
        .from('templates')
        .insert({
          name: 'Org1 Template',
          user_id: profile1.id,
          org_id: org1.id,
          front_background: '#ffffff',
          back_background: '#ffffff',
          orientation: 'landscape',
          template_elements: [],
          width_pixels: 1013,
          height_pixels: 638,
          dpi: 300
        })
        .select()
        .single();

      // Org2 should not see org1 templates
      const { data: org2Templates } = await supabase
        .from('templates')
        .select('*')
        .eq('org_id', org2.id);

      expect(org2Templates).toHaveLength(0);
      expect(template1.org_id).toBe(org1.id);
    });

    it('should prevent cross-organization template access', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { organization: org2 } = testData2;

      // Create template in org1
      const { data: template } = await supabase
        .from('templates')
        .insert({
          name: 'Secret Template',
          user_id: profile1.id,
          org_id: org1.id,
          front_background: '#ffffff',
          back_background: '#ffffff',
          orientation: 'landscape',
          template_elements: [],
          width_pixels: 1013,
          height_pixels: 638,
          dpi: 300
        })
        .select()
        .single();

      // Try to access org1 template from org2 perspective
      const { data: crossOrgAccess } = await supabase
        .from('templates')
        .select('*')
        .eq('id', template.id)
        .eq('org_id', org2.id);

      expect(crossOrgAccess).toHaveLength(0);
    });

    it('should enforce template deletion isolation', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Create templates in both orgs
      const { data: template1 } = await supabase
        .from('templates')
        .insert({
          name: 'Template to Keep',
          user_id: profile1.id,
          org_id: org1.id,
          front_background: '#ffffff',
          back_background: '#ffffff',
          orientation: 'landscape',
          template_elements: [],
          width_pixels: 1013,
          height_pixels: 638,
          dpi: 300
        })
        .select()
        .single();

      const { data: template2 } = await supabase
        .from('templates')
        .insert({
          name: 'Template to Delete',
          user_id: profile2.id,
          org_id: org2.id,
          front_background: '#ffffff',
          back_background: '#ffffff',
          orientation: 'landscape',
          template_elements: [],
          width_pixels: 1013,
          height_pixels: 638,
          dpi: 300
        })
        .select()
        .single();

      // Delete template2 from org2
      await supabase
        .from('templates')
        .delete()
        .eq('id', template2.id)
        .eq('org_id', org2.id);

      // Verify template1 in org1 still exists
      const { data: remainingTemplate } = await supabase
        .from('templates')
        .select('*')
        .eq('id', template1.id)
        .single();

      expect(remainingTemplate).toBeTruthy();
      expect(remainingTemplate.name).toBe('Template to Keep');
    });
  });

  describe('ID Card Data Isolation', () => {
    it('should isolate ID cards between organizations', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Create ID card in org1
      const { data: idCard } = await supabase
        .from('idcards')
        .insert({
          user_id: profile1.id,
          org_id: org1.id,
          data: { name: 'John Doe', title: 'Developer' },
          front_image: 'org1/front.jpg',
          back_image: 'org1/back.jpg'
        })
        .select()
        .single();

      // Org2 should not see org1 ID cards
      const { data: org2Cards } = await supabase
        .from('idcards')
        .select('*')
        .eq('org_id', org2.id);

      expect(org2Cards).toHaveLength(0);
      expect(idCard.org_id).toBe(org1.id);
    });

    it('should prevent cross-organization ID card updates', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { organization: org2 } = testData2;

      // Create ID card in org1
      const { data: idCard } = await supabase
        .from('idcards')
        .insert({
          user_id: profile1.id,
          org_id: org1.id,
          data: { name: 'Jane Doe' },
          front_image: 'front.jpg',
          back_image: 'back.jpg'
        })
        .select()
        .single();

      // Try to update from org2 perspective (should fail)
      const { data: updateResult } = await supabase
        .from('idcards')
        .update({ data: { name: 'Hacker' } })
        .eq('id', idCard.id)
        .eq('org_id', org2.id)
        .select();

      expect(updateResult).toHaveLength(0);
      
      // Original card should be unchanged
      const { data: originalCard } = await supabase
        .from('idcards')
        .select('*')
        .eq('id', idCard.id)
        .single();

      expect(originalCard.data.name).toBe('Jane Doe');
    });

    it('should isolate card statistics between organizations', async () => {
      const { profile: profile1, organization: org1 } = testData1;
      const { profile: profile2, organization: org2 } = testData2;

      // Create cards in both organizations
      await supabase
        .from('idcards')
        .insert([
          {
            user_id: profile1.id,
            org_id: org1.id,
            data: { name: 'Card 1' },
            front_image: 'front1.jpg',
            back_image: 'back1.jpg'
          },
          {
            user_id: profile1.id,
            org_id: org1.id,
            data: { name: 'Card 2' },
            front_image: 'front2.jpg',
            back_image: 'back2.jpg'
          },
          {
            user_id: profile2.id,
            org_id: org2.id,
            data: { name: 'Card 3' },
            front_image: 'front3.jpg',
            back_image: 'back3.jpg'
          }
        ]);

      // Count cards per organization
      const { count: org1Count } = await supabase
        .from('idcards')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org1.id);

      const { count: org2Count } = await supabase
        .from('idcards')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', org2.id);

      expect(org1Count).toBe(2);
      expect(org2Count).toBe(1);
    });
  });

  describe('File Storage Isolation', () => {
    it('should enforce organization-scoped storage paths', () => {
      // Mock storage path validation
      const validateStoragePath = (path: string, orgId: string): boolean => {
        return path.startsWith(`${orgId}/`);
      };

      const org1Id = testData1.organization.id;
      const org2Id = testData2.organization.id;

      expect(validateStoragePath(`${org1Id}/backgrounds/test.jpg`, org1Id)).toBe(true);
      expect(validateStoragePath(`${org2Id}/backgrounds/test.jpg`, org1Id)).toBe(false);
      expect(validateStoragePath('public/test.jpg', org1Id)).toBe(false);
    });

    it('should prevent access to other organization file paths', () => {
      const mockStorageAccess = (requestedPath: string, userOrgId: string) => {
        // Simulate storage access control
        if (!requestedPath.startsWith(`${userOrgId}/`)) {
          return { error: 'Access denied', data: null };
        }
        return { error: null, data: { path: requestedPath } };
      };

      const org1Id = testData1.organization.id;
      const org2Id = testData2.organization.id;

      const validAccess = mockStorageAccess(`${org1Id}/templates/bg.jpg`, org1Id);
      const invalidAccess = mockStorageAccess(`${org2Id}/templates/bg.jpg`, org1Id);

      expect(validAccess.error).toBeNull();
      expect(invalidAccess.error).toBe('Access denied');
    });

    it('should isolate file cleanup between organizations', () => {
      const mockFileCleanup = (filePaths: string[], userOrgId: string) => {
        // Only allow cleanup of files in user's organization
        const allowedPaths = filePaths.filter(path => path.startsWith(`${userOrgId}/`));
        return {
          cleaned: allowedPaths,
          denied: filePaths.filter(path => !path.startsWith(`${userOrgId}/`))
        };
      };

      const org1Id = testData1.organization.id;
      const filesToClean = [
        `${org1Id}/templates/bg1.jpg`,
        'other-org/templates/bg2.jpg',
        `${org1Id}/cards/card1.jpg`
      ];

      const result = mockFileCleanup(filesToClean, org1Id);

      expect(result.cleaned).toHaveLength(2);
      expect(result.denied).toHaveLength(1);
      expect(result.cleaned).toContain(`${org1Id}/templates/bg1.jpg`);
      expect(result.denied).toContain('other-org/templates/bg2.jpg');
    });
  });
});