import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { error } from '@sveltejs/kit'
import type { UserRole } from '$lib/types/database'
import type { RoleEmulationSession } from '$lib/types/roleEmulation'

interface RoleEmulationParams {
    userId: string
    targetRole: UserRole
    durationHours: number
    supabase: SupabaseClient
    metadata?: Record<string, unknown>
}

export async function handleRoleEmulation({ 
    userId, 
    targetRole, 
    durationHours, 
    supabase,
    metadata = {}
}: RoleEmulationParams): Promise<RoleEmulationSession> {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + durationHours)

    // Expire any active sessions
    await supabase
        .from('auth.role_emulation_sessions')
        .update({ status: 'expired' })
        .eq('user_id', userId)
        .eq('status', 'active')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    if (!profile) {
        throw error(404, 'User profile not found')
    }

    // Generate a secure session ID
    const sessionId = crypto.randomUUID()

    const { data: session, error: sessionError } = await supabase
        .from('auth.role_emulation_sessions')
        .insert({
            id: sessionId,
            user_id: userId,
            original_role: profile.role,
            emulated_role: targetRole,
            expires_at: expiresAt.toISOString(),
            session_context: {
                source: 'web_interface',
                timestamp: new Date().toISOString(),
                ...metadata
            }
        })
        .select()
        .single()

    if (sessionError) {
        throw error(500, 'Failed to create emulation session')
    }

    return session
}

export class RoleEmulationService {
    private supabase: SupabaseClient

    constructor(supabaseKey: string) {
        this.supabase = createClient(PUBLIC_SUPABASE_URL, supabaseKey)
    }

    async getCurrentEmulation(userId: string): Promise<RoleEmulationSession | null> {
        const { data: session } = await this.supabase
            .from('auth.role_emulation_sessions')
            .select('*')
            .eq('user_id', userId)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        return session
    }

    async startEmulation(userId: string, targetRole: UserRole, metadata: Record<string, unknown> = {}) {
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 4)

        const { data: profile } = await this.supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()

        if (!profile) {
            throw error(404, 'User profile not found')
        }

        // Generate a secure session ID
        const sessionId = crypto.randomUUID()

        const { data: session, error: sessionError } = await this.supabase
            .from('auth.role_emulation_sessions')
            .insert({
                id: sessionId,
                user_id: userId,
                original_role: profile.role,
                emulated_role: targetRole,
                expires_at: expiresAt.toISOString(),
                session_context: {
                    source: 'web_interface',
                    timestamp: new Date().toISOString(),
                    ...metadata
                }
            })
            .select()
            .single()

        if (sessionError) {
            throw error(500, 'Failed to create emulation session')
        }

        return session
    }
}
