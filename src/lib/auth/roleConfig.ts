import type { UserRole } from '$lib/types/database'

export interface AllowedPath {
    path: string
    methods?: string[]
}

interface RoleConfigType {
    allowedPaths: AllowedPath[]
    defaultRedirect: string
    isAdmin: boolean
}

export const RoleConfig: Record<UserRole, RoleConfigType> = {
    super_admin: {
        allowedPaths: [{ path: '/**' }],
        defaultRedirect: '/admin',
        isAdmin: true
    },
    org_admin: {
        allowedPaths: [{ path: '/**' }],  // Full access
        defaultRedirect: '/rat',
        isAdmin: true
    },
    event_admin: {
        allowedPaths: [
            { path: '/midcodes' },          // Base RAT path
            { path: '/rat/**' },       // All RAT subpaths
            { path: '/events' },       // Base events path
            { path: '/events/**' },    // All event subpaths
            { path: '/api/**' }        // API access
        ],
        defaultRedirect: '/rat',
        isAdmin: true
    },
    event_qr_checker: {
        allowedPaths: [
            { path: '/check/**' }
        ],
        defaultRedirect: '/check',
        isAdmin: false
    },
    user: {
        allowedPaths: [
            { path: '/profile/**' },
            { path: '/events/**', methods: ['GET'] }
        ],
        defaultRedirect: '/profile',
        isAdmin: false
    }
}
