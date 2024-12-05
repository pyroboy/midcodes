import type { UserRole } from '$lib/types/database'
import { config } from '$lib/stores/config'
import { get } from 'svelte/store'

// Define public paths that don't require authentication
export const PublicPaths = {
    auth: '/auth',
    register: '/register',
    eventPattern: /\/EVNT-\d{4}-[A-Z0-9]{5}$/
}

// Helper to check if a path is public
export function isPublicPath(path: string): boolean {
    if (path.startsWith(PublicPaths.auth)) return true
    
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
        
        // Direct child match (for single *)
        if (pattern.endsWith('/*')) {
            const prefix = pattern.slice(0, -1)
            if (cleanPath === prefix || cleanPath.startsWith(prefix + '/')) {
                return true
            }
        }
        
        // Deep match (for **)
        if (pattern.includes('**')) {
            const regex = new RegExp(
                '^' + pattern
                    .replace(/\*\*/g, '.*')
                    .replace(/\*/g, '[^/]*')
                    + '(/.*)?$'
            )
            if (regex.test(cleanPath)) return true
        }
    }
    
    return false
}

// Helper to get redirect path
export function getRedirectPath(role: UserRole, path: string, originalRole?: UserRole): string | null {
    const roleConfig = RoleConfig[role]
    if (!roleConfig) return PublicPaths.auth
    
    // Don't redirect if user has access to the path
    if (hasPathAccess(role, path, originalRole)) return null

    // Make sure the default redirect is accessible
    const defaultRedirect = roleConfig.defaultRedirect
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
        defaultRedirect: `/${get(config).adminUrl}`,
        isAdmin: true
    },
    org_admin: {
        allowedPaths: [{ path: '/**' }],
        defaultRedirect: '/rat',
        isAdmin: true
    },
    event_admin: {
        allowedPaths: [
            { path: `/${get(config).adminUrl}` },
            { path: '/rat/**' },
            { path: '/events' },
            { path: '/events/**' },
            { path: '/api/**' }
        ],
        defaultRedirect: '/rat',
        isAdmin: true
    },
    event_qr_checker: {
        allowedPaths: [
            { path: '/**/qr-checker' }
        ],
        defaultRedirect: '/**/qr-checker',
        isAdmin: false
    },
    user: {
        allowedPaths: [
            { path: '/auth' },
            { path: '/profile' }
        ],
        defaultRedirect: '/profile',
        isAdmin: false
    }
}

interface RoleConfigType {
    allowedPaths: AllowedPath[]
    defaultRedirect: string
    isAdmin: boolean
}

interface AllowedPath {
    path: string
    methods?: string[]
}
