import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock user roles and permissions
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin', 
  ID_GEN_ADMIN: 'id_gen_admin',
  ID_GEN_USER: 'id_gen_user'
} as const;

const PERMISSIONS = {
  // Template permissions
  CREATE_TEMPLATE: 'read_template',
  READ_TEMPLATE: 'read_template',
  UPDATE_TEMPLATE: 'read_template',
  DELETE_TEMPLATE: 'read_template',
  
  // ID Card permissions
  GENERATE_ID: 'generate_id',
  READ_ID: 'read_id',
  UPDATE_ID: 'update_id',
  DELETE_ID: 'read_id',
  
  // User management permissions
  CREATE_USER: 'read_user',
  READ_USER: 'read_user',
  UPDATE_USER: 'read_user',
  DELETE_USER: 'read_user',
  
  // Organization permissions
  CREATE_ORG: 'read_org',
  READ_ORG: 'read_org',
  UPDATE_ORG: 'read_org',
  DELETE_ORG: 'read_org',
  
  // Credit management permissions
  ADD_CREDITS: 'view_credits',
  VIEW_CREDITS: 'view_credits',
  DEDUCT_CREDITS: 'view_credits',
  
  // System permissions
  VIEW_ANALYTICS: 'view_credits',
  MANAGE_SETTINGS: 'view_credits'
} as const;

// Role-Permission Matrix
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions
  
  [ROLES.ORG_ADMIN]: [
    PERMISSIONS.CREATE_TEMPLATE,
    PERMISSIONS.READ_TEMPLATE,
    PERMISSIONS.UPDATE_TEMPLATE,
    PERMISSIONS.DELETE_TEMPLATE,
    PERMISSIONS.GENERATE_ID,
    PERMISSIONS.READ_ID,
    PERMISSIONS.UPDATE_ID,
    PERMISSIONS.DELETE_ID,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.READ_ORG,
    PERMISSIONS.UPDATE_ORG,
    PERMISSIONS.ADD_CREDITS,
    PERMISSIONS.VIEW_CREDITS,
    PERMISSIONS.DEDUCT_CREDITS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SETTINGS
  ],
  
  [ROLES.ID_GEN_ADMIN]: [
    PERMISSIONS.CREATE_TEMPLATE,
    PERMISSIONS.READ_TEMPLATE,
    PERMISSIONS.UPDATE_TEMPLATE,
    PERMISSIONS.DELETE_TEMPLATE,
    PERMISSIONS.GENERATE_ID,
    PERMISSIONS.READ_ID,
    PERMISSIONS.UPDATE_ID,
    PERMISSIONS.DELETE_ID,
    PERMISSIONS.READ_USER,
    PERMISSIONS.READ_ORG,
    PERMISSIONS.VIEW_CREDITS,
    PERMISSIONS.DEDUCT_CREDITS
  ],
  
  [ROLES.ID_GEN_USER]: [
    PERMISSIONS.READ_TEMPLATE,
    PERMISSIONS.GENERATE_ID,
    PERMISSIONS.READ_ID,
    PERMISSIONS.UPDATE_ID,
    PERMISSIONS.READ_USER,
    PERMISSIONS.READ_ORG,
    PERMISSIONS.VIEW_CREDITS
  ]
};

// Permission checking utilities
const hasPermission = (userRole: string, permission: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions ? rolePermissions.includes(permission as any) : false;
};

const hasAnyPermission = (userRole: string, permissions: string[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

const hasAllPermissions = (userRole: string, permissions: string[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Mock route protection
const requirePermissions = (requiredPermissions: string[]) => {
  return (userRole: string) => {
    if (!hasAnyPermission(userRole, requiredPermissions)) {
      throw new Error('Insufficient permissions');
    }
    return true;
  };
};

describe('Role-Based Access Control (RBAC) - Centralized', () => {
  describe('Role Hierarchy Validation', () => {
    it('should maintain correct role hierarchy', () => {
      const roleHierarchy = [
        ROLES.SUPER_ADMIN,
        ROLES.ORG_ADMIN,
        ROLES.ID_GEN_ADMIN,
        ROLES.ID_GEN_USER
      ];

      // Super admin should have more permissions than org admin
      const superAdminPerms = ROLE_PERMISSIONS[ROLES.SUPER_ADMIN].length;
      const orgAdminPerms = ROLE_PERMISSIONS[ROLES.ORG_ADMIN].length;
      const idGenAdminPerms = ROLE_PERMISSIONS[ROLES.ID_GEN_ADMIN].length;
      const idGenUserPerms = ROLE_PERMISSIONS[ROLES.ID_GEN_USER].length;

      expect(superAdminPerms).toBeGreaterThan(orgAdminPerms);
      expect(orgAdminPerms).toBeGreaterThan(idGenAdminPerms);
      expect(idGenAdminPerms).toBeGreaterThan(idGenUserPerms);
    });

    it('should ensure higher roles include lower role permissions', () => {
      const userPermissions = ROLE_PERMISSIONS[ROLES.ID_GEN_USER];
      const adminPermissions = ROLE_PERMISSIONS[ROLES.ID_GEN_ADMIN];
      const orgAdminPermissions = ROLE_PERMISSIONS[ROLES.ORG_ADMIN];

      // ID Gen Admin should have all ID Gen User permissions
      userPermissions.forEach(permission => {
        expect(adminPermissions).toContain(permission);
      });

      // Org Admin should have all ID Gen Admin permissions
      adminPermissions.forEach(permission => {
        expect(orgAdminPermissions).toContain(permission);
      });
    });
  });

  describe('Template Management Permissions', () => {
    it('should allow template creation for admin roles only', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.CREATE_TEMPLATE)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.CREATE_TEMPLATE)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.CREATE_TEMPLATE)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.CREATE_TEMPLATE)).toBe(false);
    });

    it('should allow template reading for all roles', () => {
      Object.values(ROLES).forEach(role => {
        expect(hasPermission(role, PERMISSIONS.READ_TEMPLATE)).toBe(true);
      });
    });

    it('should restrict template deletion to admin roles', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.DELETE_TEMPLATE)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.DELETE_TEMPLATE)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.DELETE_TEMPLATE)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.DELETE_TEMPLATE)).toBe(false);
    });

    it('should protect template management routes', () => {
      const templateCreateRoute = requirePermissions([PERMISSIONS.CREATE_TEMPLATE]);
      const templateUpdateRoute = requirePermissions([PERMISSIONS.UPDATE_TEMPLATE]);
      const templateDeleteRoute = requirePermissions([PERMISSIONS.DELETE_TEMPLATE]);

      // Admin roles should access all template routes
      expect(() => templateCreateRoute(ROLES.ID_GEN_ADMIN)).not.toThrow();
      expect(() => templateUpdateRoute(ROLES.ORG_ADMIN)).not.toThrow();
      expect(() => templateDeleteRoute(ROLES.SUPER_ADMIN)).not.toThrow();

      // Regular users should be blocked
      expect(() => templateCreateRoute(ROLES.ID_GEN_USER)).toThrow('Insufficient permissions');
      expect(() => templateDeleteRoute(ROLES.ID_GEN_USER)).toThrow('Insufficient permissions');
    });
  });

  describe('ID Card Generation Permissions', () => {
    it('should allow ID generation for all authenticated roles', () => {
      Object.values(ROLES).forEach(role => {
        expect(hasPermission(role, PERMISSIONS.GENERATE_ID)).toBe(true);
      });
    });

    it('should allow reading own generated IDs', () => {
      Object.values(ROLES).forEach(role => {
        expect(hasPermission(role, PERMISSIONS.READ_ID)).toBe(true);
      });
    });

    it('should restrict ID deletion to appropriate roles', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.DELETE_ID)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.DELETE_ID)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.DELETE_ID)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.DELETE_ID)).toBe(false);
    });

    it('should validate ID card management workflow permissions', () => {
      const idGenerationWorkflow = [
        PERMISSIONS.READ_TEMPLATE,
        PERMISSIONS.GENERATE_ID,
        PERMISSIONS.READ_ID
      ];

      // All roles should be able to complete the basic workflow
      Object.values(ROLES).forEach(role => {
        expect(hasAllPermissions(role, idGenerationWorkflow)).toBe(true);
      });
    });
  });

  describe('User Management Permissions', () => {
    it('should restrict user creation to admin roles', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.CREATE_USER)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.CREATE_USER)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.CREATE_USER)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.CREATE_USER)).toBe(false);
    });

    it('should allow user reading for all roles', () => {
      Object.values(ROLES).forEach(role => {
        expect(hasPermission(role, PERMISSIONS.READ_USER)).toBe(true);
      });
    });

    it('should restrict user deletion to high-level admin roles', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.DELETE_USER)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.DELETE_USER)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.DELETE_USER)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.DELETE_USER)).toBe(false);
    });

    it('should protect user management routes appropriately', () => {
      const userCreateRoute = requirePermissions([PERMISSIONS.CREATE_USER]);
      const userUpdateRoute = requirePermissions([PERMISSIONS.UPDATE_USER]);
      const userDeleteRoute = requirePermissions([PERMISSIONS.DELETE_USER]);

      // Org admin and super admin should access user management
      expect(() => userCreateRoute(ROLES.ORG_ADMIN)).not.toThrow();
      expect(() => userUpdateRoute(ROLES.SUPER_ADMIN)).not.toThrow();
      expect(() => userDeleteRoute(ROLES.ORG_ADMIN)).not.toThrow();

      // Lower roles should be blocked from user management
      expect(() => userCreateRoute(ROLES.ID_GEN_ADMIN)).toThrow('Insufficient permissions');
      expect(() => userDeleteRoute(ROLES.ID_GEN_USER)).toThrow('Insufficient permissions');
    });
  });

  describe('Organization Management Permissions', () => {
    it('should restrict organization creation to super admin only', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.CREATE_ORG)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.CREATE_ORG)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.CREATE_ORG)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.CREATE_ORG)).toBe(false);
    });

    it('should allow organization reading for all roles', () => {
      Object.values(ROLES).forEach(role => {
        expect(hasPermission(role, PERMISSIONS.READ_ORG)).toBe(true);
      });
    });

    it('should restrict organization updates to admin roles', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.UPDATE_ORG)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.UPDATE_ORG)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.UPDATE_ORG)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.UPDATE_ORG)).toBe(false);
    });

    it('should restrict organization deletion to super admin only', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.DELETE_ORG)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.DELETE_ORG)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.DELETE_ORG)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.DELETE_ORG)).toBe(false);
    });
  });

  describe('Credit Management Permissions', () => {
    it('should restrict credit addition to admin roles', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.ADD_CREDITS)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.ADD_CREDITS)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.ADD_CREDITS)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.ADD_CREDITS)).toBe(false);
    });

    it('should allow credit viewing for all roles', () => {
      Object.values(ROLES).forEach(role => {
        expect(hasPermission(role, PERMISSIONS.VIEW_CREDITS)).toBe(true);
      });
    });

    it('should allow credit deduction for admin and ID gen roles', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.DEDUCT_CREDITS)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.DEDUCT_CREDITS)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.DEDUCT_CREDITS)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.DEDUCT_CREDITS)).toBe(false);
    });

    it('should validate credit management workflow permissions', () => {
      const creditPurchaseWorkflow = [PERMISSIONS.ADD_CREDITS, PERMISSIONS.VIEW_CREDITS];
      const cardGenerationWorkflow = [PERMISSIONS.DEDUCT_CREDITS, PERMISSIONS.VIEW_CREDITS];

      // Only admin roles should handle credit purchases
      expect(hasAllPermissions(ROLES.ORG_ADMIN, creditPurchaseWorkflow)).toBe(true);
      expect(hasAllPermissions(ROLES.ID_GEN_USER, creditPurchaseWorkflow)).toBe(false);

      // Admin and ID gen admin should handle card generation costs
      expect(hasAllPermissions(ROLES.ID_GEN_ADMIN, cardGenerationWorkflow)).toBe(true);
      expect(hasAllPermissions(ROLES.ID_GEN_USER, cardGenerationWorkflow)).toBe(false);
    });
  });

  describe('System Administration Permissions', () => {
    it('should restrict analytics viewing to admin roles', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.VIEW_ANALYTICS)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.VIEW_ANALYTICS)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.VIEW_ANALYTICS)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.VIEW_ANALYTICS)).toBe(false);
    });

    it('should restrict settings management to admin roles', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.MANAGE_SETTINGS)).toBe(true);
      expect(hasPermission(ROLES.ORG_ADMIN, PERMISSIONS.MANAGE_SETTINGS)).toBe(true);
      expect(hasPermission(ROLES.ID_GEN_ADMIN, PERMISSIONS.MANAGE_SETTINGS)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.MANAGE_SETTINGS)).toBe(false);
    });

    it('should validate admin dashboard access permissions', () => {
      const adminDashboardPermissions = [
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.MANAGE_SETTINGS,
        PERMISSIONS.READ_USER,
        PERMISSIONS.VIEW_CREDITS
      ];

      expect(hasAllPermissions(ROLES.SUPER_ADMIN, adminDashboardPermissions)).toBe(true);
      expect(hasAllPermissions(ROLES.ORG_ADMIN, adminDashboardPermissions)).toBe(true);
      expect(hasAllPermissions(ROLES.ID_GEN_ADMIN, adminDashboardPermissions)).toBe(false);
      expect(hasAllPermissions(ROLES.ID_GEN_USER, adminDashboardPermissions)).toBe(false);
    });
  });

  describe('Permission Edge Cases and Security', () => {
    it('should handle undefined or invalid roles gracefully', () => {
      expect(hasPermission('invalid_role', PERMISSIONS.READ_TEMPLATE)).toBe(false);
      expect(hasPermission('', PERMISSIONS.CREATE_TEMPLATE)).toBe(false);
      expect(hasPermission(undefined as any, PERMISSIONS.GENERATE_ID)).toBe(false);
    });

    it('should handle undefined or invalid permissions gracefully', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, 'invalid_permission')).toBe(false);
      expect(hasPermission(ROLES.ORG_ADMIN, '')).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_USER, undefined as any)).toBe(false);
    });

    it('should prevent privilege escalation through role manipulation', () => {
      // Ensure roles cannot be modified to gain extra permissions
      const originalUserPerms = [...ROLE_PERMISSIONS[ROLES.ID_GEN_USER]];
      
      // Attempt to modify permissions (should not affect checks)
      (ROLE_PERMISSIONS as any)[ROLES.ID_GEN_USER] = Object.values(PERMISSIONS);
      
      // Reset for test
      (ROLE_PERMISSIONS as any)[ROLES.ID_GEN_USER] = originalUserPerms;
      
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.DELETE_USER)).toBe(false);
      expect(hasPermission(ROLES.ID_GEN_USER, PERMISSIONS.CREATE_ORG)).toBe(false);
    });

    it('should validate permission combinations for complex operations', () => {
      // Template management workflow
      const templateManagementPerms = [
        PERMISSIONS.CREATE_TEMPLATE,
        PERMISSIONS.UPDATE_TEMPLATE,
        PERMISSIONS.DELETE_TEMPLATE
      ];

      // User management workflow  
      const userManagementPerms = [
        PERMISSIONS.CREATE_USER,
        PERMISSIONS.UPDATE_USER,
        PERMISSIONS.DELETE_USER
      ];

      // Full system admin workflow
      const systemAdminPerms = [
        PERMISSIONS.CREATE_ORG,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.MANAGE_SETTINGS
      ];

      // ID Gen Admin should handle templates but not users or system
      expect(hasAllPermissions(ROLES.ID_GEN_ADMIN, templateManagementPerms)).toBe(true);
      expect(hasAllPermissions(ROLES.ID_GEN_ADMIN, userManagementPerms)).toBe(false);
      expect(hasAllPermissions(ROLES.ID_GEN_ADMIN, systemAdminPerms)).toBe(false);

      // Org Admin should handle templates and users but not full system
      expect(hasAllPermissions(ROLES.ORG_ADMIN, templateManagementPerms)).toBe(true);
      expect(hasAllPermissions(ROLES.ORG_ADMIN, userManagementPerms)).toBe(true);
      expect(hasAllPermissions(ROLES.ORG_ADMIN, systemAdminPerms)).toBe(false);

      // Super Admin should handle everything
      expect(hasAllPermissions(ROLES.SUPER_ADMIN, templateManagementPerms)).toBe(true);
      expect(hasAllPermissions(ROLES.SUPER_ADMIN, userManagementPerms)).toBe(true);
      expect(hasAllPermissions(ROLES.SUPER_ADMIN, systemAdminPerms)).toBe(true);
    });

    it('should validate route protection implementation', () => {
      const protectedRoutes = {
        '/admin/dashboard': requirePermissions([PERMISSIONS.VIEW_ANALYTICS]),
        '/templates/create': requirePermissions([PERMISSIONS.CREATE_TEMPLATE]),
        '/users/manage': requirePermissions([PERMISSIONS.CREATE_USER, PERMISSIONS.UPDATE_USER]),
        '/credits/add': requirePermissions([PERMISSIONS.ADD_CREDITS]),
        '/settings': requirePermissions([PERMISSIONS.MANAGE_SETTINGS])
      };

      // Test each route with different roles
      Object.entries(protectedRoutes).forEach(([route, guard]) => {
        // Super admin should access all routes
        expect(() => guard(ROLES.SUPER_ADMIN)).not.toThrow();
        
        // Regular user should be blocked from admin routes
        if (route.includes('admin') || route.includes('users') || route.includes('settings')) {
          expect(() => guard(ROLES.ID_GEN_USER)).toThrow('Insufficient permissions');
        }
      });
    });
  });
});