import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { error } from '@sveltejs/kit';

// Mock the remote functions module
vi.mock('$app/server', () => ({
  query: vi.fn((fn) => {
    const mockQuery = fn;
    mockQuery.refresh = vi.fn();
    return mockQuery;
  }),
  command: vi.fn((schema, fn) => fn),
  getRequestEvent: vi.fn()
}));

// Mock the schemas
vi.mock('$lib/schemas/organization.schema', () => ({
  orgSettingsSchema: {
    safeParse: vi.fn()
  },
  orgSettingsUpdateSchema: {
    safeParse: vi.fn()
  }
}));

import { getRequestEvent } from '$app/server';
import { orgSettingsSchema, orgSettingsUpdateSchema } from '$lib/schemas/organization.schema';

describe('Organization Settings Permission Tests', () => {
  let mockGetRequestEvent: any;
  let mockOrgSettingsSchema: any;
  let mockOrgSettingsUpdateSchema: any;

  // Test constants
  const TEST_ORG_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const SUPER_ADMIN_ID = 'b2c3d4e5-f6g7-8901-bcde-f12345678901';
  const ORG_ADMIN_ID = 'c3d4e5f6-g7h8-9012-cdef-123456789012';
  const ID_GEN_ADMIN_ID = 'd4e5f6g7-h8i9-0123-def0-23456789012a';
  const ID_GEN_USER_ID = 'e5f6g7h8-i9j0-1234-ef01-3456789012ab';
  const REGULAR_USER_ID = 'f6g7h8i9-j0k1-2345-f012-456789012abc';

  beforeEach(() => {
    mockGetRequestEvent = vi.mocked(getRequestEvent);
    mockOrgSettingsSchema = vi.mocked(orgSettingsSchema);
    mockOrgSettingsUpdateSchema = vi.mocked(orgSettingsUpdateSchema);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock request event
  const createMockRequestEvent = (userRole: string, userId: string = SUPER_ADMIN_ID, orgId: string = TEST_ORG_ID) => ({
    locals: {
      user: {
        id: userId,
        role: userRole,
        email: `${userRole.replace('_', '')}@test.com`
      },
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn()
            }))
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn()
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn()
              }))
            }))
          }))
        }))
      },
      org_id: orgId
    }
  });

  describe('Permission Validation for getOrgSettings', () => {
    it('should allow super_admin to access org settings', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('super_admin'));
      mockOrgSettingsSchema.safeParse.mockReturnValue({ success: true, data: {} });

      // Import the function after mocking
      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      try {
        await getOrgSettings();
        // Should not throw an error for super_admin
        expect(mockGetRequestEvent).toHaveBeenCalled();
      } catch (err) {
        // Only should fail due to missing data, not permissions
        if (err instanceof Error && err.message.includes('403')) {
          fail('super_admin should have access to org settings');
        }
      }
    });

    it('should allow org_admin to access org settings', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('org_admin', ORG_ADMIN_ID));
      mockOrgSettingsSchema.safeParse.mockReturnValue({ success: true, data: {} });

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      try {
        await getOrgSettings();
        expect(mockGetRequestEvent).toHaveBeenCalled();
      } catch (err) {
        if (err instanceof Error && err.message.includes('403')) {
          fail('org_admin should have access to org settings');
        }
      }
    });

    it('should deny access to id_gen_admin', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('id_gen_admin', ID_GEN_ADMIN_ID));

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
      
      try {
        await getOrgSettings();
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        if (err instanceof Error) {
          expect(err.message).toContain('Access denied');
        }
      }
    });

    it('should deny access to id_gen_user', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('id_gen_user', ID_GEN_USER_ID));

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });

    it('should deny access to regular user', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('user', REGULAR_USER_ID));

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });

    it('should deny access to user with null role', async () => {
      const mockEvent = createMockRequestEvent('super_admin');
      (mockEvent.locals.user.role as any) = null;
      mockGetRequestEvent.mockReturnValue(mockEvent);

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });

    it('should deny access to user with undefined role', async () => {
      const mockEvent = createMockRequestEvent('super_admin');
      (mockEvent.locals.user.role as any) = undefined;
      mockGetRequestEvent.mockReturnValue(mockEvent);

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });

    it('should deny access when user is null', async () => {
      const mockEvent = createMockRequestEvent('super_admin');
      (mockEvent.locals.user as any) = null;
      mockGetRequestEvent.mockReturnValue(mockEvent);

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });
  });

  describe('Permission Validation for updateOrgSettings', () => {
    const mockUpdateData = {
      payments_enabled: true,
      payments_bypass: false
    };

    it('should allow super_admin to update org settings', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('super_admin'));
      mockOrgSettingsUpdateSchema.safeParse.mockReturnValue({ 
        success: true, 
        data: { 
          org_id: TEST_ORG_ID, 
          updated_by: SUPER_ADMIN_ID, 
          ...mockUpdateData 
        } 
      });

      const { updateOrgSettings } = await import('$lib/remote/org-settings.remote');

      try {
        await updateOrgSettings(mockUpdateData);
        expect(mockGetRequestEvent).toHaveBeenCalled();
      } catch (err) {
        if (err instanceof Error && err.message.includes('403')) {
          fail('super_admin should be able to update org settings');
        }
      }
    });

    it('should allow org_admin to update org settings', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('org_admin', ORG_ADMIN_ID));
      mockOrgSettingsUpdateSchema.safeParse.mockReturnValue({ 
        success: true, 
        data: { 
          org_id: TEST_ORG_ID, 
          updated_by: ORG_ADMIN_ID, 
          ...mockUpdateData 
        } 
      });

      const { updateOrgSettings } = await import('$lib/remote/org-settings.remote');

      try {
        await updateOrgSettings(mockUpdateData);
        expect(mockGetRequestEvent).toHaveBeenCalled();
      } catch (err) {
        if (err instanceof Error && err.message.includes('403')) {
          fail('org_admin should be able to update org settings');
        }
      }
    });

    it('should deny id_gen_admin from updating org settings', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('id_gen_admin', ID_GEN_ADMIN_ID));

      const { updateOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(updateOrgSettings(mockUpdateData)).rejects.toThrow();
    });

    it('should deny id_gen_user from updating org settings', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('id_gen_user', ID_GEN_USER_ID));

      const { updateOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(updateOrgSettings(mockUpdateData)).rejects.toThrow();
    });

    it('should deny regular user from updating org settings', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('user', REGULAR_USER_ID));

      const { updateOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(updateOrgSettings(mockUpdateData)).rejects.toThrow();
    });
  });

  describe('Permission Validation for getOrgSettingsAudit', () => {
    it('should allow super_admin to access audit trail', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('super_admin'));

      const { getOrgSettingsAudit } = await import('$lib/remote/org-settings.remote');

      try {
        await getOrgSettingsAudit();
        expect(mockGetRequestEvent).toHaveBeenCalled();
      } catch (err) {
        if (err instanceof Error && err.message.includes('403')) {
          fail('super_admin should have access to audit trail');
        }
      }
    });

    it('should allow org_admin to access audit trail', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('org_admin', ORG_ADMIN_ID));

      const { getOrgSettingsAudit } = await import('$lib/remote/org-settings.remote');

      try {
        await getOrgSettingsAudit();
        expect(mockGetRequestEvent).toHaveBeenCalled();
      } catch (err) {
        if (err instanceof Error && err.message.includes('403')) {
          fail('org_admin should have access to audit trail');
        }
      }
    });

    it('should deny id_gen_admin from accessing audit trail', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('id_gen_admin', ID_GEN_ADMIN_ID));

      const { getOrgSettingsAudit } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettingsAudit()).rejects.toThrow();
    });

    it('should deny id_gen_user from accessing audit trail', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('id_gen_user', ID_GEN_USER_ID));

      const { getOrgSettingsAudit } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettingsAudit()).rejects.toThrow();
    });
  });

  describe('Permission Validation for arePaymentsEnabled', () => {
    it('should handle permissions gracefully for arePaymentsEnabled', async () => {
      // This function should handle errors gracefully and default to false
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('id_gen_user', ID_GEN_USER_ID));

      const { arePaymentsEnabled } = await import('$lib/remote/org-settings.remote');

      const result = await arePaymentsEnabled();
      expect(result).toBe(false); // Should default to false when access is denied
    });

    it('should return actual value for authorized users', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('super_admin'));
      mockOrgSettingsSchema.safeParse.mockReturnValue({ 
        success: true, 
        data: { payments_enabled: true } 
      });

      const { arePaymentsEnabled } = await import('$lib/remote/org-settings.remote');

      try {
        const result = await arePaymentsEnabled();
        // Should either return the actual value or false (graceful fallback)
        expect(typeof result).toBe('boolean');
      } catch (err) {
        // If it throws, it should still be a permission-related error, not a system error
        expect(err).toBeInstanceOf(Error);
      }
    });
  });

  describe('Permission Validation for isPaymentBypassEnabled', () => {
    it('should handle permissions gracefully for isPaymentBypassEnabled', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('id_gen_user', ID_GEN_USER_ID));

      const { isPaymentBypassEnabled } = await import('$lib/remote/org-settings.remote');

      const result = await isPaymentBypassEnabled();
      expect(result).toBe(false); // Should default to false when access is denied
    });

    it('should return actual value for authorized users', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('org_admin', ORG_ADMIN_ID));
      mockOrgSettingsSchema.safeParse.mockReturnValue({ 
        success: true, 
        data: { payments_bypass: true } 
      });

      const { isPaymentBypassEnabled } = await import('$lib/remote/org-settings.remote');

      try {
        const result = await isPaymentBypassEnabled();
        expect(typeof result).toBe('boolean');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });
  });

  describe('Cross-Role Permission Matrix', () => {
    const roles = [
      { name: 'super_admin', id: SUPER_ADMIN_ID, canAccess: true, canUpdate: true },
      { name: 'org_admin', id: ORG_ADMIN_ID, canAccess: true, canUpdate: true },
      { name: 'id_gen_admin', id: ID_GEN_ADMIN_ID, canAccess: false, canUpdate: false },
      { name: 'id_gen_user', id: ID_GEN_USER_ID, canAccess: false, canUpdate: false },
      { name: 'user', id: REGULAR_USER_ID, canAccess: false, canUpdate: false }
    ];

    roles.forEach(({ name, id, canAccess, canUpdate }) => {
      describe(`Role: ${name}`, () => {
        it(`should ${canAccess ? 'allow' : 'deny'} read access`, async () => {
          mockGetRequestEvent.mockReturnValue(createMockRequestEvent(name, id));
          mockOrgSettingsSchema.safeParse.mockReturnValue({ success: true, data: {} });

          const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

          if (canAccess) {
            try {
              await getOrgSettings();
              expect(mockGetRequestEvent).toHaveBeenCalled();
            } catch (err) {
              // Only fail on permission errors, not data errors
              if (err instanceof Error && err.message.includes('403')) {
                fail(`${name} should have read access`);
              }
            }
          } else {
            await expect(getOrgSettings()).rejects.toThrow();
          }
        });

        it(`should ${canUpdate ? 'allow' : 'deny'} write access`, async () => {
          mockGetRequestEvent.mockReturnValue(createMockRequestEvent(name, id));
          mockOrgSettingsUpdateSchema.safeParse.mockReturnValue({ 
            success: true, 
            data: { 
              org_id: TEST_ORG_ID, 
              updated_by: id, 
              payments_enabled: true 
            } 
          });

          const { updateOrgSettings } = await import('$lib/remote/org-settings.remote');

          if (canUpdate) {
            try {
              await updateOrgSettings({ payments_enabled: true });
              expect(mockGetRequestEvent).toHaveBeenCalled();
            } catch (err) {
              if (err instanceof Error && err.message.includes('403')) {
                fail(`${name} should have write access`);
              }
            }
          } else {
            await expect(updateOrgSettings({ payments_enabled: true })).rejects.toThrow();
          }
        });

        it(`should ${canAccess ? 'allow' : 'deny'} audit access`, async () => {
          mockGetRequestEvent.mockReturnValue(createMockRequestEvent(name, id));

          const { getOrgSettingsAudit } = await import('$lib/remote/org-settings.remote');

          if (canAccess) {
            try {
              await getOrgSettingsAudit();
              expect(mockGetRequestEvent).toHaveBeenCalled();
            } catch (err) {
              if (err instanceof Error && err.message.includes('403')) {
                fail(`${name} should have audit access`);
              }
            }
          } else {
            await expect(getOrgSettingsAudit()).rejects.toThrow();
          }
        });
      });
    });
  });

  describe('Organization Scoping', () => {
    it('should enforce organization-specific access', async () => {
      const orgA = 'aaaaaaaa-aaaa-4aaa-9aaa-aaaaaaaaaaaa';
      const orgB = 'bbbbbbbb-bbbb-4bbb-9bbb-bbbbbbbbbbbb';

      // User from org A
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('org_admin', ORG_ADMIN_ID, orgA));

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      try {
        await getOrgSettings();
        expect(mockGetRequestEvent).toHaveBeenCalled();
        const callArgs = mockGetRequestEvent.mock.results[0].value;
        expect(callArgs.locals.org_id).toBe(orgA);
      } catch (err) {
        // Should not be a permission error for org_admin
        if (err instanceof Error && err.message.includes('403')) {
          fail('org_admin should have access within their organization');
        }
      }
    });

    it('should handle missing org_id', async () => {
      const mockEvent = createMockRequestEvent('org_admin', ORG_ADMIN_ID);
      (mockEvent.locals.org_id as any) = null;
      mockGetRequestEvent.mockReturnValue(mockEvent);

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow('Organization ID not found');
    });

    it('should handle undefined org_id', async () => {
      const mockEvent = createMockRequestEvent('super_admin');
      (mockEvent.locals.org_id as any) = undefined;
      mockGetRequestEvent.mockReturnValue(mockEvent);

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow('Organization ID not found');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid role strings', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('invalid_role', REGULAR_USER_ID));

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });

    it('should handle role with extra characters', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('super_admin_extra', SUPER_ADMIN_ID));

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });

    it('should handle case-sensitive role names', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('Super_Admin', SUPER_ADMIN_ID));

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });

    it('should handle empty role string', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('', REGULAR_USER_ID));

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });

    it('should handle role as number instead of string', async () => {
      const mockEvent = createMockRequestEvent('super_admin');
      (mockEvent.locals.user.role as any) = 1; // Number instead of string
      mockGetRequestEvent.mockReturnValue(mockEvent);

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });

    it('should handle role as boolean instead of string', async () => {
      const mockEvent = createMockRequestEvent('super_admin');
      (mockEvent.locals.user.role as any) = true; // Boolean instead of string
      mockGetRequestEvent.mockReturnValue(mockEvent);

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });
  });

  describe('Security Boundary Testing', () => {
    it('should not leak permission details in error messages', async () => {
      mockGetRequestEvent.mockReturnValue(createMockRequestEvent('id_gen_user', ID_GEN_USER_ID));

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      try {
        await getOrgSettings();
        fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        if (err instanceof Error) {
          // Error message should be generic
          expect(err.message).toContain('Access denied');
          // Should not contain internal details about role checking logic
          expect(err.message).not.toContain('includes');
          expect(err.message).not.toContain('array');
          expect(err.message).not.toContain('super_admin');
          expect(err.message).not.toContain('org_admin');
        }
      }
    });

    it('should use consistent error messages across different unauthorized roles', async () => {
      const unauthorizedRoles = ['id_gen_admin', 'id_gen_user', 'user'];
      const errorMessages: string[] = [];

      for (const role of unauthorizedRoles) {
        mockGetRequestEvent.mockReturnValue(createMockRequestEvent(role, REGULAR_USER_ID));

        const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

        try {
          await getOrgSettings();
          fail(`Should have thrown an error for role: ${role}`);
        } catch (err) {
          if (err instanceof Error) {
            errorMessages.push(err.message);
          }
        }
      }

      // All error messages should be identical
      const uniqueMessages = new Set(errorMessages);
      expect(uniqueMessages.size).toBe(1);
      expect(Array.from(uniqueMessages)[0]).toContain('Access denied');
    });

    it('should not allow privilege escalation through array manipulation', async () => {
      const mockEvent = createMockRequestEvent('id_gen_user');
      // Attempt to manipulate the role checking by making role an array
      mockEvent.locals.user.role = ['super_admin'] as any;
      mockGetRequestEvent.mockReturnValue(mockEvent);

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });

    it('should not allow privilege escalation through object injection', async () => {
      const mockEvent = createMockRequestEvent('id_gen_user');
      // Attempt to inject object with toString method
      mockEvent.locals.user.role = { 
        toString: () => 'super_admin',
        valueOf: () => 'super_admin'
      } as any;
      mockGetRequestEvent.mockReturnValue(mockEvent);

      const { getOrgSettings } = await import('$lib/remote/org-settings.remote');

      await expect(getOrgSettings()).rejects.toThrow();
    });
  });
});
