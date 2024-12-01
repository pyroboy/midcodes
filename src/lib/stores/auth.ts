import { writable } from 'svelte/store'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '$lib/supabaseClient'
import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import type { UserRole } from '$lib/types/database'
import { jwtDecode } from "jwt-decode"

interface RoleEmulationClaim {
    active: boolean
    original_role: UserRole
    emulated_role: UserRole
    expires_at: string
    session_id: string
}

interface UserProfile {
    id: string
    email: string
    role: UserRole
    org_id: string | null
    created_at: string
    updated_at: string
}

interface RoleState {
    baseRole: UserRole | null
    currentRole: UserRole | null
    isEmulating: boolean
    emulationExpiry: string | null
    sessionId: string | null
    orgId: string | null
}

export const user = writable<User | null>(null)
export const session = writable<Session | null>(null)
export const profile = writable<UserProfile | null>(null)
export const roleState = writable<RoleState>({
    baseRole: null,
    currentRole: null,
    isEmulating: false,
    emulationExpiry: null,
    sessionId: null,
    orgId: null
})
export const isLoggingOut = writable<boolean>(false)

const extractRoleFromJWT = (accessToken: string): Partial<RoleState> => {
    try {
        const decoded: any = jwtDecode(accessToken)
        const roleEmulation = decoded['role_emulation'] as RoleEmulationClaim || {}
        
        return {
            baseRole: roleEmulation.original_role || decoded.role || null,
            currentRole: roleEmulation.active ? roleEmulation.emulated_role : decoded.role || null,
            isEmulating: roleEmulation.active || false,
            emulationExpiry: roleEmulation.expires_at || null,
            sessionId: roleEmulation.session_id || null,
            orgId: decoded.org_id || null,
        }
    } catch (error) {
        console.error('Error decoding JWT:', error)
        return {}
    }
}

const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single()

    if (error) {
        console.error('Error loading profile:', error)
        return null
    }

    return data
}

const refreshSession = async () => {
    try {
        const { data: { session: newSession }, error } = 
            await supabase.auth.refreshSession()
        
        if (error) throw error
        if (!newSession) throw new Error('No session after refresh')
        
        session.set(newSession)
        user.set(newSession.user)
        
        const userProfile = await loadUserProfile(newSession.user.id)
        if (!userProfile) throw new Error('Failed to load user profile after refresh')
        
        profile.set(userProfile)
        
        const roleEmulation = extractRoleFromJWT(newSession.access_token)
        roleState.set({
            baseRole: userProfile.role,
            currentRole: roleEmulation.currentRole || userProfile.role,
            isEmulating: roleEmulation.isEmulating || false,
            emulationExpiry: roleEmulation.emulationExpiry || null,
            sessionId: roleEmulation.sessionId || null,
            orgId: userProfile.org_id
        })
        
        return { success: true, session: newSession }
    } catch (error) {
        console.error('Session refresh error:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'An unknown error occurred' 
        }
    }
}

if (browser) {
    const REFRESH_INTERVAL = 10 * 60 * 1000

    const refreshInterval = setInterval(async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
            await refreshSession()
        }
    }, REFRESH_INTERVAL)

    window.addEventListener('beforeunload', () => clearInterval(refreshInterval))

    supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (currentSession) {
            session.set(currentSession)
            user.set(currentSession.user)

            const userProfile = await loadUserProfile(currentSession.user.id)
            if (userProfile) {
                profile.set(userProfile)
                const roleEmulation = extractRoleFromJWT(currentSession.access_token)
                roleState.set({
                    baseRole: userProfile.role,
                    currentRole: roleEmulation.currentRole || userProfile.role,
                    isEmulating: roleEmulation.isEmulating || false,
                    emulationExpiry: roleEmulation.emulationExpiry || null,
                    sessionId: roleEmulation.sessionId || null,
                    orgId: userProfile.org_id
                })
            }
        } else {
            auth.clearSession()
        }
    })
}

export const auth = {
    extractRoleFromJWT,
    loadUserProfile,
    refreshSession,
    
    signIn: async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            
            if (error) throw error
            if (!data.session) throw new Error('No session after sign in')
            
            await refreshSession()
            return { success: true, data }
        } catch (error) {
            console.error('Sign in error:', error)
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'An unknown error occurred' 
            }
        }
    },

    signOut: async () => {
        try {
            isLoggingOut.set(true)
            auth.clearSession()
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            await goto('/auth')
        } catch (error) {
            console.error('Error during sign out:', error)
            throw error
        } finally {
            isLoggingOut.set(false)
        }
    },

    startRoleEmulation: async (targetRole: UserRole, durationHours = 4) => {
        try {
            const response = await fetch('/api/role-emulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetRole, durationHours })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to start role emulation')
            }

            await refreshSession()
            return { success: true }
        } catch (error) {
            console.error('Role emulation error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            }
        }
    },

    stopRoleEmulation: async () => {
        try {
            const response = await fetch('/api/role-emulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reset: true })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to stop role emulation')
            }

            await refreshSession()
            return { success: true }
        } catch (error) {
            console.error('Stop role emulation error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unknown error occurred'
            }
        }
    },

    clearSession: () => {
        session.set(null)
        user.set(null)
        profile.set(null)
        roleState.set({
            baseRole: null,
            currentRole: null,
            isEmulating: false,
            emulationExpiry: null,
            sessionId: null,
            orgId: null
        })
    },

    resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
    },

    updatePassword: async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
    }
}