import type { UserRole } from './database'
import type { Session } from '@supabase/supabase-js'

// types/roleEmulation.ts
export type EmulationStatus = 'active' | 'expired'

export interface RoleEmulationSession {
    id: string
    user_id: string
    emulated_role: UserRole
    original_role: UserRole
    session_context: Record<string, unknown>
    expires_at: string
    created_at: string
    status?: EmulationStatus
}

export interface RoleEmulationClaim {
    active: boolean
    original_role: UserRole
    emulated_role: UserRole
    expires_at: string
    session_id: string
}

export interface RoleEmulationData {
    targetRole: UserRole
    durationHours: number
    status?: string
}

export interface EmulatedProfile {
    id: string
    email: string
    role: UserRole
    org_id: string | null
    created_at: string
    updated_at: string
    originalRole: UserRole
    isEmulated: boolean
}

export interface ProfileData {
    id: string
    role: UserRole
    email: string
    full_name?: string
    organization_id?: string
}

export interface LocalsSession extends Session {
    role_emulation?: RoleEmulationData
}

export interface SessionInfo {
    session: LocalsSession | null
    user: any | null
    profile: ProfileData | EmulatedProfile | null
    roleEmulation: RoleEmulationClaim | null
}