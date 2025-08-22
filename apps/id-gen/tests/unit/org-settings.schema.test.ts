import { describe, it, expect } from 'vitest';
import {
  orgSettingsSchema,
  orgSettingsUpdateSchema,
  type OrgSettings,
  type OrgSettingsUpdate
} from '$lib/schemas/organization.schema';

describe('Organization Settings Schema Validation', () => {
  // Test data constants
  const validOrgId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const validUserId = 'b2c3d4e5-f6g7-8901-bcde-f12345678901';
  const validTimestamp = '2024-08-22T10:00:00Z';

  describe('orgSettingsSchema', () => {
    it('should validate correct org settings data', () => {
      const validSettings: OrgSettings = {
        org_id: validOrgId,
        payments_enabled: true,
        payments_bypass: false,
        updated_by: validUserId,
        updated_at: validTimestamp
      };

      const result = orgSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.org_id).toBe(validOrgId);
        expect(result.data.payments_enabled).toBe(true);
        expect(result.data.payments_bypass).toBe(false);
        expect(result.data.updated_by).toBe(validUserId);
        expect(result.data.updated_at).toBe(validTimestamp);
      }
    });

    it('should validate settings with null updated_by', () => {
      const settingsWithNullUpdater = {
        org_id: validOrgId,
        payments_enabled: false,
        payments_bypass: true,
        updated_by: null,
        updated_at: validTimestamp
      };

      const result = orgSettingsSchema.safeParse(settingsWithNullUpdater);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.updated_by).toBeNull();
      }
    });

    it('should reject invalid org_id format', () => {
      const invalidOrgId = {
        org_id: 'not-a-valid-uuid',
        payments_enabled: true,
        payments_bypass: false,
        updated_by: validUserId,
        updated_at: validTimestamp
      };

      const result = orgSettingsSchema.safeParse(invalidOrgId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('org_id'))).toBe(true);
      }
    });

    it('should reject invalid updated_by UUID format', () => {
      const invalidUpdatedBy = {
        org_id: validOrgId,
        payments_enabled: true,
        payments_bypass: false,
        updated_by: 'not-a-valid-uuid',
        updated_at: validTimestamp
      };

      const result = orgSettingsSchema.safeParse(invalidUpdatedBy);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('updated_by'))).toBe(true);
      }
    });

    it('should reject invalid datetime format', () => {
      const invalidDateTime = {
        org_id: validOrgId,
        payments_enabled: true,
        payments_bypass: false,
        updated_by: validUserId,
        updated_at: 'not-a-valid-datetime'
      };

      const result = orgSettingsSchema.safeParse(invalidDateTime);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('updated_at'))).toBe(true);
      }
    });

    it('should reject missing required fields', () => {
      const missingFields = {
        org_id: validOrgId,
        // payments_enabled is missing
        payments_bypass: false,
        updated_by: validUserId,
        updated_at: validTimestamp
      };

      const result = orgSettingsSchema.safeParse(missingFields);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('payments_enabled'))).toBe(true);
      }
    });

    it('should reject non-boolean payment settings', () => {
      const nonBooleanSettings = {
        org_id: validOrgId,
        payments_enabled: 'true', // string instead of boolean
        payments_bypass: 1, // number instead of boolean
        updated_by: validUserId,
        updated_at: validTimestamp
      };

      const result = orgSettingsSchema.safeParse(nonBooleanSettings);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        expect(issues.some(issue => issue.path.includes('payments_enabled'))).toBe(true);
        expect(issues.some(issue => issue.path.includes('payments_bypass'))).toBe(true);
      }
    });

    it('should validate all possible boolean combinations', () => {
      const combinations = [
        { payments_enabled: true, payments_bypass: true },
        { payments_enabled: true, payments_bypass: false },
        { payments_enabled: false, payments_bypass: true },
        { payments_enabled: false, payments_bypass: false }
      ];

      combinations.forEach((combo, index) => {
        const settings = {
          org_id: validOrgId,
          ...combo,
          updated_by: validUserId,
          updated_at: validTimestamp
        };

        const result = orgSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.payments_enabled).toBe(combo.payments_enabled);
          expect(result.data.payments_bypass).toBe(combo.payments_bypass);
        }
      });
    });
  });

  describe('orgSettingsUpdateSchema', () => {
    it('should validate complete update data', () => {
      const validUpdate: OrgSettingsUpdate = {
        org_id: validOrgId,
        payments_enabled: true,
        payments_bypass: false,
        updated_by: validUserId
      };

      const result = orgSettingsUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.org_id).toBe(validOrgId);
        expect(result.data.payments_enabled).toBe(true);
        expect(result.data.payments_bypass).toBe(false);
        expect(result.data.updated_by).toBe(validUserId);
      }
    });

    it('should validate partial update with only payments_enabled', () => {
      const partialUpdate = {
        org_id: validOrgId,
        payments_enabled: true,
        updated_by: validUserId
        // payments_bypass is optional
      };

      const result = orgSettingsUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.payments_enabled).toBe(true);
        expect(result.data.payments_bypass).toBeUndefined();
      }
    });

    it('should validate partial update with only payments_bypass', () => {
      const partialUpdate = {
        org_id: validOrgId,
        payments_bypass: true,
        updated_by: validUserId
        // payments_enabled is optional
      };

      const result = orgSettingsUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.payments_bypass).toBe(true);
        expect(result.data.payments_enabled).toBeUndefined();
      }
    });

    it('should validate minimal update with only required fields', () => {
      const minimalUpdate = {
        org_id: validOrgId,
        updated_by: validUserId
        // both payment fields are optional
      };

      const result = orgSettingsUpdateSchema.safeParse(minimalUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.org_id).toBe(validOrgId);
        expect(result.data.updated_by).toBe(validUserId);
        expect(result.data.payments_enabled).toBeUndefined();
        expect(result.data.payments_bypass).toBeUndefined();
      }
    });

    it('should reject update without org_id', () => {
      const missingOrgId = {
        payments_enabled: true,
        payments_bypass: false,
        updated_by: validUserId
        // org_id is missing
      };

      const result = orgSettingsUpdateSchema.safeParse(missingOrgId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('org_id'))).toBe(true);
      }
    });

    it('should reject update without updated_by', () => {
      const missingUpdatedBy = {
        org_id: validOrgId,
        payments_enabled: true,
        payments_bypass: false
        // updated_by is missing
      };

      const result = orgSettingsUpdateSchema.safeParse(missingUpdatedBy);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('updated_by'))).toBe(true);
      }
    });

    it('should reject invalid UUID formats in update', () => {
      const invalidUUIDs = {
        org_id: 'invalid-org-id',
        updated_by: 'invalid-user-id',
        payments_enabled: true
      };

      const result = orgSettingsUpdateSchema.safeParse(invalidUUIDs);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        expect(issues.some(issue => issue.path.includes('org_id'))).toBe(true);
        expect(issues.some(issue => issue.path.includes('updated_by'))).toBe(true);
      }
    });

    it('should reject invalid data types in update', () => {
      const invalidTypes = {
        org_id: validOrgId,
        updated_by: validUserId,
        payments_enabled: 'invalid-boolean',
        payments_bypass: 123
      };

      const result = orgSettingsUpdateSchema.safeParse(invalidTypes);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        expect(issues.some(issue => issue.path.includes('payments_enabled'))).toBe(true);
        expect(issues.some(issue => issue.path.includes('payments_bypass'))).toBe(true);
      }
    });

    it('should handle edge case boolean values correctly', () => {
      const edgeCaseUpdate = {
        org_id: validOrgId,
        updated_by: validUserId,
        payments_enabled: false, // explicit false
        payments_bypass: true   // explicit true
      };

      const result = orgSettingsUpdateSchema.safeParse(edgeCaseUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.payments_enabled).toBe(false);
        expect(result.data.payments_bypass).toBe(true);
      }
    });
  });

  describe('Schema Type Consistency', () => {
    it('should ensure orgSettingsSchema and orgSettingsUpdateSchema are compatible', () => {
      // Create a full org settings object
      const fullSettings: OrgSettings = {
        org_id: validOrgId,
        payments_enabled: true,
        payments_bypass: false,
        updated_by: validUserId,
        updated_at: validTimestamp
      };

      // Validate with full schema
      const fullValidation = orgSettingsSchema.safeParse(fullSettings);
      expect(fullValidation.success).toBe(true);

      // Create update from same data (minus updated_at)
      const updateData: OrgSettingsUpdate = {
        org_id: fullSettings.org_id,
        payments_enabled: fullSettings.payments_enabled,
        payments_bypass: fullSettings.payments_bypass,
        updated_by: fullSettings.updated_by!
      };

      // Validate with update schema
      const updateValidation = orgSettingsUpdateSchema.safeParse(updateData);
      expect(updateValidation.success).toBe(true);

      // Ensure data consistency
      if (fullValidation.success && updateValidation.success) {
        expect(updateValidation.data.org_id).toBe(fullValidation.data.org_id);
        expect(updateValidation.data.payments_enabled).toBe(fullValidation.data.payments_enabled);
        expect(updateValidation.data.payments_bypass).toBe(fullValidation.data.payments_bypass);
        expect(updateValidation.data.updated_by).toBe(fullValidation.data.updated_by);
      }
    });

    it('should handle null vs undefined for optional fields correctly', () => {
      // Test null updated_by in full schema
      const settingsWithNull = {
        org_id: validOrgId,
        payments_enabled: true,
        payments_bypass: false,
        updated_by: null,
        updated_at: validTimestamp
      };

      const nullValidation = orgSettingsSchema.safeParse(settingsWithNull);
      expect(nullValidation.success).toBe(true);
      if (nullValidation.success) {
        expect(nullValidation.data.updated_by).toBeNull();
      }

      // Test undefined payments fields in update schema
      const updateWithUndefined = {
        org_id: validOrgId,
        updated_by: validUserId,
        payments_enabled: undefined,
        payments_bypass: undefined
      };

      const undefinedValidation = orgSettingsUpdateSchema.safeParse(updateWithUndefined);
      expect(undefinedValidation.success).toBe(true);
      if (undefinedValidation.success) {
        expect(undefinedValidation.data.payments_enabled).toBeUndefined();
        expect(undefinedValidation.data.payments_bypass).toBeUndefined();
      }
    });
  });

  describe('Real-world Data Scenarios', () => {
    it('should validate settings for organizations with different payment configurations', () => {
      const scenarios = [
        {
          name: 'Free tier organization',
          settings: {
            org_id: validOrgId,
            payments_enabled: false,
            payments_bypass: false,
            updated_by: null,
            updated_at: validTimestamp
          }
        },
        {
          name: 'Paid tier organization',
          settings: {
            org_id: validOrgId,
            payments_enabled: true,
            payments_bypass: false,
            updated_by: validUserId,
            updated_at: validTimestamp
          }
        },
        {
          name: 'Development organization with bypass',
          settings: {
            org_id: validOrgId,
            payments_enabled: false,
            payments_bypass: true,
            updated_by: validUserId,
            updated_at: validTimestamp
          }
        },
        {
          name: 'Premium organization with bypass enabled',
          settings: {
            org_id: validOrgId,
            payments_enabled: true,
            payments_bypass: true,
            updated_by: validUserId,
            updated_at: validTimestamp
          }
        }
      ];

      scenarios.forEach(({ name, settings }) => {
        const result = orgSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.payments_enabled).toBe(settings.payments_enabled);
          expect(result.data.payments_bypass).toBe(settings.payments_bypass);
        }
      });
    });

    it('should validate incremental updates for payment settings migration', () => {
      // Simulate a migration scenario where settings are updated step by step
      const baseUpdate = {
        org_id: validOrgId,
        updated_by: validUserId
      };

      // Step 1: Enable payments
      const step1 = { ...baseUpdate, payments_enabled: true };
      const step1Result = orgSettingsUpdateSchema.safeParse(step1);
      expect(step1Result.success).toBe(true);

      // Step 2: Disable bypass (if it was enabled)
      const step2 = { ...baseUpdate, payments_bypass: false };
      const step2Result = orgSettingsUpdateSchema.safeParse(step2);
      expect(step2Result.success).toBe(true);

      // Step 3: Combined update
      const step3 = { ...baseUpdate, payments_enabled: true, payments_bypass: false };
      const step3Result = orgSettingsUpdateSchema.safeParse(step3);
      expect(step3Result.success).toBe(true);

      // Verify all steps are valid
      expect(step1Result.success && step2Result.success && step3Result.success).toBe(true);
    });
  });

  describe('Database Constraint Simulation', () => {
    it('should validate UUID constraints that match database foreign keys', () => {
      // These should match actual UUID formats from the database
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000', // Version 1 UUID
        'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Version 4 UUID (random)
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'  // Version 1 UUID
      ];

      validUUIDs.forEach(uuid => {
        const settings = {
          org_id: uuid,
          payments_enabled: true,
          payments_bypass: false,
          updated_by: uuid,
          updated_at: validTimestamp
        };

        const result = orgSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      });
    });

    it('should reject malformed UUIDs that would fail database constraints', () => {
      const invalidUUIDs = [
        '550e8400-e29b-41d4-a716-44665544000',  // Too short
        '550e8400-e29b-41d4-a716-4466554400000', // Too long
        'g50e8400-e29b-41d4-a716-446655440000',  // Invalid character
        '550e8400e29b41d4a716446655440000',       // Missing hyphens
        '550e8400-e29b-41d4-a716',               // Incomplete
        ''                                        // Empty
      ];

      invalidUUIDs.forEach(uuid => {
        const settings = {
          org_id: uuid,
          payments_enabled: true,
          payments_bypass: false,
          updated_by: validUserId,
          updated_at: validTimestamp
        };

        const result = orgSettingsSchema.safeParse(settings);
        expect(result.success).toBe(false);
      });
    });

    it('should validate datetime formats compatible with PostgreSQL timestamps', () => {
      const validTimestamps = [
        '2024-08-22T10:00:00Z',           // ISO 8601 UTC
        '2024-08-22T10:00:00.000Z',       // ISO 8601 UTC with milliseconds
        '2024-08-22T10:00:00+00:00',      // ISO 8601 with timezone
        '2024-12-31T23:59:59.999Z'        // Edge case - end of year
      ];

      validTimestamps.forEach(timestamp => {
        const settings = {
          org_id: validOrgId,
          payments_enabled: true,
          payments_bypass: false,
          updated_by: validUserId,
          updated_at: timestamp
        };

        const result = orgSettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.updated_at).toBe(timestamp);
        }
      });
    });
  });
});
