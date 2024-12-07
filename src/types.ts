import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '$lib/types/database';
import type { RoleEmulationData, RoleEmulationClaim, ProfileData, LocalsSession } from '$lib/types/roleEmulation';

export type UserRole = 'super_admin' | 'org_admin' | 'id_gen_admin' | 'event_admin' | 'event_qr_checker' | 'user';

export interface SessionInfo {
    session: Session | null;
    user: User | null;
    profile: ProfileData | Profile | null;
    roleEmulation: RoleEmulationClaim | null;
}

export interface Locals {
    supabase: SupabaseClient;
    getSession: () => Promise<Session | null>;
    safeGetSession: () => Promise<SessionInfo>;
    session?: Session | null;
    user?: User | null;
    profile?: ProfileData | Profile | null;
}
