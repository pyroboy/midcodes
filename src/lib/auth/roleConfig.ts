import { get } from 'svelte/store'

// Define all available user roles
export type UserRole =
  | 'super_admin'
  | 'org_admin'
  | 'user'
  | 'event_admin'
  | 'event_qr_checker'
  | 'property_admin'
  | 'property_manager'
  | 'property_accountant'
  | 'property_maintenance'
  | 'property_utility'
  | 'property_frontdesk'
  | 'property_tenant'
  | 'property_guest'
  | 'id_gen_admin'
  | 'id_gen_user';

export const PublicPaths = {
    auth: '/auth',
    error: '/error',
    home: '/',
    register: '/register',
    eventPattern: /\/EVNT-\d{4}-[A-Z0-9]{5}$/,
    constrack: '/constrack'
}

// Helper to check if a path is public
export function isPublicPath(path: string): boolean {
    if (path.startsWith(PublicPaths.auth) || path.startsWith(PublicPaths.constrack)) return true
    const eventUrlMatch = path.match(/^\/([^/]+)/)
    const eventUrl = eventUrlMatch ? eventUrlMatch[1] : null
    return !!(eventUrl && (
        path.endsWith(PublicPaths.register) || 
        PublicPaths.eventPattern.test(path)
    ))
}

// Helper to check path access
export function hasPathAccess(role: UserRole, path: string, originalRole?: UserRole): boolean {
    const roleConfig = RoleConfig[role]
    if (!roleConfig) return false

    // Debug logging
    // console.log('[Path Debug] Checking access:', {
    //     role,
    //     path,
    //     originalRole,
    //     allowedPaths: roleConfig.allowedPaths
    // })

    // 1. User is super_admin (original role)
    // 2. There's an active emulation session (originalRole exists)


    
    // Full access patterns
    if (roleConfig.allowedPaths.some(ap => ap.path === '*' || ap.path === '/**')) {
        return true
    }
    
    // Clean up path for matching
    const cleanPath = path.replace(/\/$/, '')
    
    // Check each allowed path pattern
    for (const allowedPath of roleConfig.allowedPaths) {
        const pattern = allowedPath.path.replace(/\/$/, '')
        
        // Convert path pattern to regex
        let regexPattern = pattern
            .replace(/\*\*/g, '.*')  // ** matches anything including /
            .replace(/\*/g, '[^/]+')  // Single * matches anything except /
        
        const regex = new RegExp('^' + regexPattern + '$')
        
        // Debug logging
        // console.log('[Path Debug] Pattern match:', {
        //     cleanPath,
        //     pattern,
        //     regexPattern,
        //     matches: regex.test(cleanPath)
        // })

        if (regex.test(cleanPath)) return true
    }
    
    return false
}

// Helper to get redirect path
export function getRedirectPath(role: UserRole, path: string, originalRole?: UserRole, context?: any): string | null {
    // console.log('\n[Redirect Check] ----------------');
    // console.log('1. Checking redirect for:', {
    //     role,
    //     path,
    //     originalRole,
    //     context
    // });

    const roleConfig = RoleConfig[role]
    if (!roleConfig) {
        console.log('2. No role config found - redirecting to auth');
        return PublicPaths.auth
    }
    
    // Don't redirect if user has access to the path
    const hasAccess = hasPathAccess(role, path, originalRole)
    // console.log('3. Path access check:', {
    //     hasAccess,
    //     path
    // });
    
    if (hasAccess) return null

    // Make sure the default redirect is accessible
    const defaultRedirect = roleConfig.defaultPath(context)
    console.log('4. Default redirect path:', defaultRedirect);
    
    if (!hasPathAccess(role, defaultRedirect, originalRole)) {
        console.log('5. No access to default redirect - sending to auth');
        return PublicPaths.auth
    }
    
    // Don't redirect to the same path (avoid loops)
    if (path === defaultRedirect) {
        console.log('6. Same path as default - avoiding loop');
        return PublicPaths.auth
    }
    
    console.log('7. Redirecting to default path');
    console.log('[Redirect Check End] ----------------\n');
    return defaultRedirect
}

// Function to check if a path is allowed for a role
export function isPathAllowedForRole(path: string, role: UserRole | null, originalRole?: UserRole): boolean {
    console.log('[RoleConfig] Checking path:', path, 'for role:', role, 'original role:', originalRole);
    
    // If no role, deny access
    if (!role) return false;
    
   
    const adminPath = `/midcodes`;

    // 1. User is super_admin (original role)
    // 2. There's an active emulation session (originalRole exists)
    if (path === adminPath && (originalRole === 'super_admin' || originalRole)) {
        console.log('[RoleConfig] Allowing admin path access');
        return true;
    }

    const roleConfig = RoleConfig[role];
    if (!roleConfig) return false;

    // Full access patterns
    if (roleConfig.allowedPaths.some((ap: AllowedPath) => ap.path === '*' || ap.path === '/**')) {
        return true;
    }
    
    // Clean up path for matching
    const cleanPath = path.replace(/\/$/, '')
    
    // Check each allowed path pattern
    for (const allowedPath of roleConfig.allowedPaths) {
        const pattern = allowedPath.path.replace(/\/$/, '')
        
        // Convert path pattern to regex
        let regexPattern = pattern
            .replace(/\*\*/g, '.*')  // ** matches anything including /
            .replace(/\*/g, '[^/]+')  // Single * matches anything except /
        
        const regex = new RegExp('^' + regexPattern + '$')
        
        // Debug logging
        // console.log('[Path Debug] Pattern match:', {
        //     cleanPath,
        //     pattern,
        //     regexPattern,
        //     matches: regex.test(cleanPath)
        // })

        if (regex.test(cleanPath)) return true
    }
    
    return false
}

export interface RoleConfiguration {
    allowedPaths: AllowedPath[];
    defaultPath: (context?: any) => string;
    isAdmin: boolean;
    label: string;
    requiresOrgId?: boolean;
    showInNav?: boolean;
    icon?: string;
}

export const RoleConfig: Record<UserRole, RoleConfiguration> = {
    super_admin: {
        allowedPaths: [{ path: '/**' }],
        defaultPath() {
            return '/';
        },
        isAdmin: true,
        label: 'Super Admin',
        requiresOrgId: true
    },
    org_admin: {
        allowedPaths: [{ path: '/**' }],
        defaultPath() {
            return '/';
        },
        isAdmin: true,
        label: 'Organization Admin',
        requiresOrgId: true
    },
    user: {
        allowedPaths: [
            { path: '/auth' },
            { path: '/profile' }
        ],
        defaultPath() {
            return '/profile';
        },
        isAdmin: false,
        label: 'Regular User',
        requiresOrgId: false
    },
    event_admin: {
        allowedPaths: [
            // { path: '/events', showInNav: true, label: 'Events' },
            { path: '/events/**' },
            { path: '/events/*/payments' },
            { path: '/events/*/qr-checker' },
            { path: '/events/*/name-tags' },
            { path: '/events/*/test' },
            { path: '/api/**' }
        ],
        defaultPath: (context?: any) => {
            console.log('[RoleConfig] event_admin defaultPath called');
            console.log('[RoleConfig] context received:', context);
            console.log('[RoleConfig] event_url from context:', context?.event_url);
            return `/events/${context?.event_url}`;
        },
        isAdmin: true,
        label: 'Event Admin',
        requiresOrgId: true
    },
    event_qr_checker: {
        allowedPaths: [
            { path: '/events/*/qr-checker' }
        ],
        defaultPath: (context?: any) => {
            console.log('defaultPath context:', context);
            return `/events/${context?.event_url}/qr-checker`;
        },
        isAdmin: false,
        label: 'Event QR Checker',
        requiresOrgId: true
    },
    property_admin: {
        allowedPaths: [
            { path: '/dorm', showInNav: true, label: 'Dormitory' },
            { path: '/dorm/overview/monthly', showInNav: true, label: 'Overview' },
            { path: '/dorm/properties', showInNav: true, label: 'Properties' },
            { path: '/dorm/floors', showInNav: true, label: 'Floors' },
            { path: '/dorm/rental_unit', showInNav: true, label: 'Rental_Units' },
            { path: '/dorm/tenants', showInNav: true, label: 'Tenants' },
            { path: '/dorm/leases', showInNav: true, label: 'Leases' },
            { path: '/dorm/payments', showInNav: true, label: 'Payments' },
            { path: '/dorm/transactions', showInNav: true, label: 'Transactions' },
            { path: '/dorm/meters', showInNav: true, label: 'Meters' },
            { path: '/dorm/readings', showInNav: true, label: 'Readings' },
            { path: '/dorm/utility-billings', showInNav: true, label: 'Utility Billings' },
            { path: '/dorm/expenses', showInNav: true, label: 'Expenses' },
            { path: '/dorm/budgets', showInNav: true, label: 'Budgets' },
            { path: '/dorm/accounts', showInNav: true, label: 'Accounts' },
            { path: '/dorm/**' }
        ],
        defaultPath() {
            return '/dorm';
        },
        isAdmin: true,
        label: 'Property Admin',
        requiresOrgId: true
    },
    property_manager: {
        allowedPaths: [
            { path: '/property/*/manage', showInNav: true, label: 'Property Management' }
        ],
        defaultPath() {
            return '/property';
        },
        isAdmin: false,
        label: 'Property Manager',
        requiresOrgId: true
    },
    property_accountant: {
        allowedPaths: [
            { path: '/property/*/accounting', showInNav: true, label: 'Property Accounting' }
        ],
        defaultPath() {
            return '/property';
        },
        isAdmin: false,
        label: 'Property Accountant',
        requiresOrgId: true
    },
    property_maintenance: {
        allowedPaths: [
            { path: '/property/*/maintenance', showInNav: true, label: 'Maintenance' }
        ],
        defaultPath() {
            return '/property';
        },
        isAdmin: false,
        label: 'Property Maintenance',
        requiresOrgId: true
    },
    property_utility: {
        allowedPaths: [
            { path: '/property/*/utility', showInNav: true, label: 'Utilities' }
        ],
        defaultPath() {
            return '/property';
        },
        isAdmin: false,
        label: 'Property Utility',
        requiresOrgId: true
    },
    property_frontdesk: {
        allowedPaths: [
            { path: '/property/*/frontdesk', showInNav: true, label: 'Front Desk' }
        ],
        defaultPath() {
            return '/property';
        },
        isAdmin: false,
        label: 'Property Front Desk',
        requiresOrgId: true
    },
    property_tenant: {
        allowedPaths: [
            { path: '/property/*/tenant', showInNav: true, label: 'Tenant Portal' }
        ],
        defaultPath() {
            return '/property';
        },
        isAdmin: false,
        label: 'Property Tenant',
        requiresOrgId: true
    },
    property_guest: {
        allowedPaths: [
            { path: '/property/*/guest', showInNav: true, label: 'Guest Portal' }
        ],
        defaultPath() {
            return '/property';
        },
        isAdmin: false,
        label: 'Property Guest',
        requiresOrgId: true
    },
    id_gen_admin: {
        allowedPaths: [
            { path: '/id-gen/templates', showInNav: true, label: 'Templates' },
            { path: '/id-gen/all-ids', showInNav: true, label: 'Generated IDs' },
            { path: '/id-gen' },
            { path: '/id-gen/**' },
        
            { path: '/id-gen/use-template/**' }
        ],
        defaultPath() {
            return '/id-gen';
        },
        isAdmin: true,
        label: 'ID Generator Admin',
        requiresOrgId: true
    },
    id_gen_user: {
        allowedPaths: [
            { path: '/id-gen/use-template', showInNav: true, label: 'Generate IDs' },
            { path: '/id-gen/use-template/**' }
        ],
        defaultPath() {
            return '/id-gen/use-template';
        },
        isAdmin: false,
        label: 'ID Generator User',
        requiresOrgId: true
    }
};

export interface AllowedPath {
    path: string;
    methods?: string[];
    showInNav?: boolean;
    label?: string;
}
