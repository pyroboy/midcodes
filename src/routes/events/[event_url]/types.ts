import type { Event } from '$lib/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface EventStatus {
    isActive: boolean;
    isRegistrationOpen: boolean;
    hasCapacity: boolean;
    registrationStartDate: Date;
    registrationEndDate: Date;
}

export interface EventStats {
    totalRegistrations: number;
    paidCount: number;
    totalRevenue: number;
    ticketTypeCounts: Record<string, number>;
    recentActivity: Array<{
        type: 'registration' | 'payment';
        description: string;
        timestamp: string;
    }>;
}

export interface PageData {
    supabase: SupabaseClient;
    session: any;
    user: any;
    profile: { role: any; org_id: any; } | null;
    role: any;
    org_id: any;
    organizations: any[];
    currentOrg: any | null;
    event: Event;
    eventStatus: EventStatus;
    stats: EventStats;
}
