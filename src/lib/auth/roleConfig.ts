import { config } from '$lib/stores/config'
import { get } from 'svelte/store'

// Define all available user roles
export type UserRole = 'super_admin' | 'org_admin' | 'id_gen_admin' | 'event_admin' | 'event_qr_checker' | 'user';

export const PublicPaths = {
    auth: '/auth',
    error: '/error',
    home: '/',
    register: '/register',
    eventPattern: /\/EVNT-\d{4}-[A-Z0-9]{5}$/,
    eventRegisterPattern: /^\/events\/[a-zA-Z0-9-]+\/register$/
}

// Helper to check if a path is public
export function isPublicPath(path: string): boolean {
    if (path.startsWith(PublicPaths.auth)) return true
    
    // Check for event registration path
    if (PublicPaths.eventRegisterPattern.test(path)) return true
    
    const eventUrlMatch = path.match(/^\/([^/]+)/)
    const eventUrl = eventUrlMatch ? eventUrlMatch[1] : null
    
    return !!(eventUrl && (
        path.endsWith(PublicPaths.register) || 
        PublicPaths.eventPattern.test(path)
    ))
}

// Helper to check path access
export function hasPathAccess(role: UserRole, path: string, originalRole?: UserRole): boolean {
    // Check if path is public first
    if (isPublicPath(path)) return true

    const roleConfig = RoleConfig[role]
    if (!roleConfig) return false

    // 1. User is super_admin (original role)
    // 2. There's an active emulation session (originalRole exists)
    if (path === `/${get(config).adminUrl}` && (originalRole === 'super_admin' || originalRole)) {
        return true
    }

    // Special case for super_admin role emulation
    if (path.startsWith('/admin') && originalRole === 'super_admin') {
        return true
    }
    
    // Full access patterns
    if (roleConfig.allowedPaths.some(ap => ap.path === '*' || ap.path === '/**')) {
        return true
    }
    
    // Clean up path for matching
    const cleanPath = path.replace(/\/$/, '')
    
    // Check each allowed path pattern
    for (const allowedPath of roleConfig.allowedPaths) {
        const pattern = allowedPath.path.replace(/\/$/, '')
        
        // Exact match
        if (cleanPath === pattern) return true
        
        // Convert path pattern to regex
        const regexPattern = pattern
            .replace(/\*/g, '[^/]+')  // Single * matches anything except /
            .replace(/\[\^\/\]\+\[\^\/\]\+/g, '.*')  // ** matches anything including /
        
        const regex = new RegExp('^' + regexPattern + '$')
        if (regex.test(cleanPath)) return true
    }
    
    return false
}

// Helper to get redirect path
export function getRedirectPath(role: UserRole, path: string, originalRole?: UserRole, context?: any): string | null {
    const roleConfig = RoleConfig[role]
    if (!roleConfig) return PublicPaths.auth
    
    // Don't redirect if user has access to the path
    if (hasPathAccess(role, path, originalRole)) return null

    // Make sure the default redirect is accessible
    const defaultRedirect = roleConfig.defaultPath(context)
    if (!hasPathAccess(role, defaultRedirect, originalRole)) {
        return PublicPaths.auth
    }
    
    // Don't redirect to the same path (avoid loops)
    if (path === defaultRedirect) {
        return PublicPaths.auth
    }

    return defaultRedirect
}

export const RoleConfig: Record<UserRole, RoleConfigType> = {
    super_admin: {
        allowedPaths: [{ path: '/**' }],
        defaultPath: () => `/${get(config).adminUrl}`,
        isAdmin: true,
        label: 'Super Admin'
    },
    org_admin: {
        allowedPaths: [{ path: '/**' }],
        defaultPath: () => `/${get(config).adminUrl}`,
        isAdmin: true,
        label: 'Organization Admin'
    },
    id_gen_admin: {
        allowedPaths: [
            { path: `/${get(config).adminUrl}` },
            { path: '/templates' },
            { path: '/templates/**' },
            { path: '/use-template' },
            { path: '/use-template/**' },
            { path: '/all-ids' },
            { path: '/api/**' }
        ],
        defaultPath: () => '/templates',
        isAdmin: true,
        label: 'ID Generator Admin'
    },
    event_admin: {
        allowedPaths: [
            { path: `/${get(config).adminUrl}` },
            { path: '/events' },
            { path: '/events/**' },
            { path: '/events/*/payments' },
            { path: '/events/*/qr-checker' },
            { path: '/events/*/ratpayment' },
            { path: '/events/*/name-tags' },
            { path: '/events/*/name-tag' },
            { path: '/events/*/test' },
            { path: '/api/**' }
        ],
        defaultPath: (context?: any) => {
            console.log('defaultPath context:', context);
            return `/events/${context?.event_url}`;
        },
        isAdmin: true,
        label: 'Event Admin'
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
        label: 'Event QR Checker'
    },
    user: {
        allowedPaths: [
            { path: '/auth' },
            { path: '/profile' }
        ],
        defaultPath: () => '/profile',
        isAdmin: false,
        label: 'Regular User'
    }
}

export interface RoleConfigType {
    allowedPaths: AllowedPath[]
    defaultPath: (context?: any) => string
    isAdmin: boolean
    label: string
}

export interface AllowedPath {
    path: string
    methods?: string[]
}
