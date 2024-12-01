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
        allowedPaths: [
            { path: '/dashboard/**' },
            { path: '/events/**' },
            { path: '/settings/**' }
        ],
        defaultRedirect: '/dashboard',
        isAdmin: true
    },
    event_admin: {
        allowedPaths: [
            { path: '/events/**' },
            { path: '/dashboard/**' }
        ],
        defaultRedirect: '/dashboard',
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
