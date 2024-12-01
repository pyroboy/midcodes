// routes/api/role-emulation/+server.ts
import { error, json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { handleRoleEmulation } from '$lib/auth/roleEmulation'
import type { UserRole } from '$lib/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

type RoleEmulationLocals = Partial<Record<string, string>> & {
    user: { id: string }
    supabase: SupabaseClient
}

export async function POST({ request, locals }: RequestEvent<RoleEmulationLocals>) {
    try {
        const body = await request.json()
    const { targetRole, durationHours = 4 } = body as { targetRole: UserRole; durationHours?: number }

        if (!locals.user) {
            throw error(401, 'Unauthorized')
        }

        const result = await handleRoleEmulation({
            userId: locals.user.id,
            targetRole,
            durationHours,
            supabase: locals.supabase
        })

        return json(result)
    } catch (err) {
        if (err instanceof Error) {
            throw error(500, err.message)
        }
        throw error(500, 'An unexpected error occurred')
    }
}