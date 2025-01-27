import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole, EventStatus } from './types';

export const AUTHORIZED_ROLES = ['Admin', 'TabulationHead'] as const;

export const ROLE_STATUS_PERMISSIONS: Record<UserRole, readonly EventStatus[]> = {
    Admin: ['nodata', 'forReview', 'approved', 'locked', 'locked_published'],
    TabulationHead: ['nodata', 'forReview', 'approved'] as const
};

export async function checkAuthorization(
    supabase: SupabaseClient,
    userId: string | null
): Promise<{ authorized: boolean; role?: UserRole }> {
    if (!userId) return { authorized: false };

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error || !profile) return { authorized: false };

    const authorized = AUTHORIZED_ROLES.includes(profile.role as UserRole);
    return { authorized, role: profile.role as UserRole };
}