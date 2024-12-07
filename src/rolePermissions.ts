import { ADMIN_URL } from '$env/static/private'
import type { UserRole } from './types'

type AllowedPath = string | '*'

export const RoleConfig = {
  super_admin: {
    allowedPaths: ['*'] as AllowedPath[],
    defaultRedirect: `/${ADMIN_URL}`,
    isAdmin: true
  },
  org_admin: {
    allowedPaths: ['*'] as AllowedPath[],
    defaultRedirect: '/rat',
    isAdmin: true
  },
  id_gen_admin: {
    allowedPaths: ['/templates', '/all-ids'] as AllowedPath[],
    defaultRedirect: '/templates',
    isAdmin: true
  },
  event_admin: {
    allowedPaths: ['*'] as AllowedPath[],
    defaultRedirect: '/dashboard',
    isAdmin: true
  },
  event_qr_checker: {
    allowedPaths: ['/qr-checker'] as AllowedPath[],
    defaultRedirect: '/qr-checker',
    isAdmin: false
  },
  user: {
    allowedPaths: ['/dashboard', '/profile'] as AllowedPath[],
    defaultRedirect: '/dashboard',
    isAdmin: false
  }
} as const

export type RoleConfigType = typeof RoleConfig
export type AllowedPaths = RoleConfigType[UserRole]['allowedPaths'][number]
