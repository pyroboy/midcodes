import { writable, get } from 'svelte/store'
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
    original_org_id: string | null
    emulated_org_id: string | null
    expires_at: string
    session_id: string
    metadata: Record<string, unknown>
}

interface UserProfile {
    id: string
    email: string
    role: UserRole
    org_id: string | null
    created_at: string
    updated_at: string
}

type EmulationStatus = 'active' | 'ended'

export interface RoleState {
    baseRole: UserRole | null
    currentRole: UserRole | null
    emulatedRole: UserRole | null
    isEmulating: boolean
    status: EmulationStatus | null
    emulationExpiry: string | null
    sessionId: string | null
    originalOrgId: string | null
    emulatedOrgId: string | null
    metadata: Record<string, unknown> | null
    createdAt: string | null
}

export interface EmulationSession {
    id: string;
    user_id: string;
    original_role: UserRole;
    emulated_role: UserRole;
    status: 'active' | 'ended';
    expires_at: string;
    created_at: string;
    metadata: {
        created_by: string;
        created_at: string;
    };
}

// Private internal stores
const _user = writable<User | null>(null)
const _session = writable<Session | null>(null)
const _profile = writable<UserProfile | null>(null)
const _roleState = writable<RoleState>({
    baseRole: null,
    currentRole: null,
    emulatedRole: null,
    isEmulating: false,
    status: null,
    emulationExpiry: null,
    sessionId: null,
    originalOrgId: null,
    emulatedOrgId: null,
    metadata: null,
    createdAt: null
})
const _isLoggingOut = writable<boolean>(false)

// Public read-only stores
export const user = { subscribe: _user.subscribe }
export const session = { subscribe: _session.subscribe }
export const profile = { subscribe: _profile.subscribe }
export const roleState = { subscribe: _roleState.subscribe }
export const isLoggingOut = { subscribe: _isLoggingOut.subscribe }

const extractRoleFromJWT = (accessToken: string): Partial<RoleState> => {
    try {
        const decoded: any = jwtDecode(accessToken)
        console.log('[JWT Debug] Full decoded token:', decoded)
        console.log('[JWT Debug] App metadata:', decoded.app_metadata)
        
        // Access role_emulation through app_metadata
        const roleEmulation = decoded.app_metadata?.role_emulation 
            ? (decoded.app_metadata.role_emulation as RoleEmulationClaim) 
            : null
            
        console.log('[JWT Debug] Role emulation state:', {
            active: roleEmulation?.active,
            original_role: roleEmulation?.original_role,
            emulated_role: roleEmulation?.emulated_role,
            original_org_id: roleEmulation?.original_org_id,
            emulated_org_id: roleEmulation?.emulated_org_id,
            expires_at: roleEmulation?.expires_at,
            session_id: roleEmulation?.session_id
        })
        
        return {
            baseRole: roleEmulation?.original_role || decoded.role || null,
            currentRole: roleEmulation?.active ? roleEmulation.emulated_role : decoded.role || null,
            emulatedRole: roleEmulation?.active ? roleEmulation.emulated_role : null,
            isEmulating: roleEmulation?.active || false,
            status: roleEmulation?.active ? 'active' : null,
            emulationExpiry: roleEmulation?.expires_at || null,
            sessionId: roleEmulation?.session_id || null,
            originalOrgId: roleEmulation?.original_org_id || decoded.org_id || null,
            emulatedOrgId: roleEmulation?.active ? roleEmulation.emulated_org_id : null,
            metadata: roleEmulation?.metadata || null,
            createdAt: null
        }
    } catch (error) {
        console.error('[JWT Debug] Error extracting role from JWT:', error)
        return {
            baseRole: null,
            currentRole: null,
            emulatedRole: null,
            isEmulating: false,
            status: null,
            emulationExpiry: null,
            sessionId: null,
            originalOrgId: null,
            emulatedOrgId: null,
            metadata: null,
            createdAt: null
        }
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
        
        _session.set(newSession)
        _user.set(newSession.user)
        
        const userProfile = await loadUserProfile(newSession.user.id)
        if (!userProfile) throw new Error('Failed to load user profile after refresh')
        
        _profile.set(userProfile)
        
        // Check for active emulation session
        const { data: activeSession } = await supabase
            .from('role_emulation_sessions')
            .select('*')
            .eq('user_id', newSession.user.id)
            .eq('status', 'active')
            .single()

        console.log('[Role Emulation Debug] Active Session:', activeSession)
        
        const roleEmulation = extractRoleFromJWT(newSession.access_token)
        console.log('[Role Emulation Debug] JWT Role Data:', roleEmulation)

        _roleState.set({
            baseRole: userProfile.role,
            currentRole: activeSession?.emulated_role || userProfile.role,
            emulatedRole: activeSession?.emulated_role || null,
            isEmulating: !!activeSession,
            status: activeSession?.status || null,
            emulationExpiry: activeSession?.expires_at || null,
            sessionId: activeSession?.id || null,
            originalOrgId: activeSession?.original_org_id || userProfile.org_id || null,
            emulatedOrgId: activeSession?.emulated_org_id || null,
            metadata: activeSession?.metadata || null,
            createdAt: activeSession?.created_at || null
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

    // Initialize session state when the app loads
    console.log('[Auth Debug] Initializing auth state...')
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
        console.log('[Auth Debug] Initial session:', session)
        console.log('[Auth Debug] Session error:', error)
        
        if (error) {
            console.error('[Auth Debug] Error getting session:', error)
            return
        }
        
        if (session) {
            _session.set(session)
            _user.set(session.user)

            const userProfile = await loadUserProfile(session.user.id)
            console.log('[Auth Debug] Loaded user profile:', userProfile)
            
            if (userProfile) {
                _profile.set(userProfile)
                
                // Check for active emulation session
                const { data: activeSession, error: emulationError } = await supabase
                    .from('role_emulation_sessions')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('status', 'active')
                    .gt('expires_at', new Date().toISOString())
                    .single()

                if (emulationError && emulationError.code !== 'PGRST116') {
                    console.error('[Auth Debug] Error checking emulation:', emulationError)
                }

                console.log('[Auth Debug] Active emulation session:', activeSession)
                const roleEmulation = extractRoleFromJWT(session.access_token)
                console.log('[Auth Debug] Role emulation from JWT:', roleEmulation)
                
                const newRoleState: RoleState = {
                    baseRole: userProfile.role,
                    currentRole: activeSession?.emulated_role || userProfile.role,
                    emulatedRole: activeSession?.emulated_role || null,
                    isEmulating: !!activeSession,
                    status: activeSession ? ('active' as EmulationStatus) : null,
                    emulationExpiry: activeSession?.expires_at || null,
                    sessionId: activeSession?.id || null,
                    originalOrgId: activeSession?.original_org_id || userProfile.org_id || null,
                    emulatedOrgId: activeSession?.emulated_org_id || null,
                    metadata: activeSession?.metadata || null,
                    createdAt: activeSession?.created_at || null
                }
                
                console.log('[Auth Debug] Setting new role state:', newRoleState)
                _roleState.set(newRoleState)
            } else {
                console.log('[Auth Debug] No user profile found')
            }
        } else {
            console.log('[Auth Debug] No session found')
        }
    }).catch(error => {
        console.error('[Auth Debug] Error initializing auth state:', error)
    })

    const refreshInterval = setInterval(async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
            await refreshSession()
        }
    }, REFRESH_INTERVAL)

    window.addEventListener('beforeunload', () => clearInterval(refreshInterval))

    supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (currentSession) {
            _session.set(currentSession)
            _user.set(currentSession.user)

            const userProfile = await loadUserProfile(currentSession.user.id)
            if (userProfile) {
                _profile.set(userProfile)
                const roleEmulation = extractRoleFromJWT(currentSession.access_token)
                _roleState.set({
                    baseRole: userProfile.role,
                    currentRole: roleEmulation.currentRole || userProfile.role,
                    emulatedRole: roleEmulation.emulatedRole || userProfile.role,
                    isEmulating: roleEmulation.isEmulating || false,
                    status: roleEmulation.status || null,
                    emulationExpiry: roleEmulation.emulationExpiry || null,
                    sessionId: roleEmulation.sessionId || null,
                    originalOrgId: roleEmulation.originalOrgId || userProfile.org_id || null,
                    emulatedOrgId: roleEmulation.emulatedOrgId || null,
                    metadata: roleEmulation.metadata || null,
                    createdAt: null
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
            _isLoggingOut.set(true)
            
            // Clear all stores first
            auth.clearSession()
            _user.set(null)
            _session.set(null)
            _profile.set(null)
            _roleState.set({
                baseRole: null,
                currentRole: null,
                emulatedRole: null,
                isEmulating: false,
                status: null,
                emulationExpiry: null,
                sessionId: null,
                originalOrgId: null,
                emulatedOrgId: null,
                metadata: null,
                createdAt: null
            })

            // Call the server-side signout endpoint
            const response = await fetch('/auth/signout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Failed to sign out')
            }

            // Redirect to auth page
            await goto('/auth')
        } catch (error) {
            console.error('Error during sign out:', error)
            throw error
        } finally {
            _isLoggingOut.set(false)
        }
    },

    startRoleEmulation: async (targetRole: UserRole, durationHours = 4) => {
        try {
            const response = await fetch('/api/role-emulation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    emulatedRole: targetRole,
                    durationHours
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to start role emulation');
            }

            const result = await response.json();
            console.log('[Role Emulation] Start result:', result);

            // Refresh session to get updated JWT with new role claims
            await refreshSession();

            // Update role state with emulation data
            const currentProfile = get(_profile);
            if (currentProfile) {
                _roleState.set({
                    baseRole: currentProfile.role,
                    currentRole: targetRole,
                    emulatedRole: targetRole,
                    isEmulating: true,
                    status: 'active',
                    emulationExpiry: result.data?.expires_at || null,
                    sessionId: result.data?.id || null,
                    originalOrgId: currentProfile.org_id,
                    emulatedOrgId: null,
                    metadata: result.data?.metadata || null,
                    createdAt: result.data?.created_at || null
                });
            }

            return { success: true, data: result.data };
        } catch (error) {
            console.error('[Role Emulation] Start error:', error);
            throw error;
        }
    },

    stopRoleEmulation: async () => {
        try {
            const response = await fetch('/api/role-emulation', {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to stop role emulation');
            }

            // Refresh session to update role state
            await refreshSession();

            // Reset role state
            const currentProfile = get(_profile);
            if (currentProfile) {
                _roleState.set({
                    baseRole: currentProfile.role,
                    currentRole: currentProfile.role,
                    emulatedRole: null,
                    isEmulating: false,
                    status: null,
                    emulationExpiry: null,
                    sessionId: null,
                    originalOrgId: currentProfile.org_id,
                    emulatedOrgId: null,
                    metadata: null,
                    createdAt: null
                });
            }

            return { success: true };
        } catch (error) {
            console.error('[Role Emulation] Stop error:', error);
            throw error;
        }
    },

    checkActiveEmulation: async (): Promise<EmulationSession | null> => {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) return null;

        const { data: activeSession } = await supabase
            .from('role_emulation_sessions')
            .select('*')
            .eq('user_id', session.session.user.id)
            .eq('status', 'active')
            .single();

        return activeSession;
    },

    endEmulation: async (): Promise<void> => {
        const { error } = await supabase.functions.invoke('role-emulation', {
            method: 'DELETE'
        });

        if (error) {
            console.error('Failed to end role emulation:', error);
            throw error;
        }
    },

    clearSession: () => {
        _session.set(null)
        _user.set(null)
        _profile.set(null)
        _roleState.set({
            baseRole: null,
            currentRole: null,
            emulatedRole: null,
            isEmulating: false,
            status: null,
            emulationExpiry: null,
            sessionId: null,
            originalOrgId: null,
            emulatedOrgId: null,
            metadata: null,
            createdAt: null
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