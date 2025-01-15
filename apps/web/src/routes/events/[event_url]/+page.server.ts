import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Event, EventOtherInfo, EventTicketType, Attendee } from '$lib/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

interface EventStatus {
    isActive: boolean;
    isRegistrationOpen: boolean;
    hasCapacity: boolean;
    registrationStartDate: Date;
    registrationEndDate: Date;
}

interface EventStats {
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

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
    // Fetch event data
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select(`
            *,
            organizations(id, name)
        `)
        .eq('event_url', params.event_url)
        .single();

    if (eventError || !event) {
        throw error(404, 'Event not found');
    }

    const eventData = event as Event;
    const otherInfo = eventData.other_info as EventOtherInfo;

    // Check event status and dates
    const now = new Date();
    const regStartDate = otherInfo.startDate ? new Date(otherInfo.startDate) : new Date(0);
    const regEndDate = otherInfo.endDate ? new Date(otherInfo.endDate) : new Date(8640000000000000);
    
    const eventStatus: EventStatus = {
        isActive: true, // You might want to add a status field to your event table
        isRegistrationOpen: now >= regStartDate && now <= regEndDate,
        hasCapacity: await checkEventCapacity(supabase, eventData.id, otherInfo.capacity),
        registrationStartDate: regStartDate,
        registrationEndDate: regEndDate
    };

    // Fetch statistics
    const [
        registrationCount,
        paymentStats,
        ticketCounts,
        recentActivity
    ] = await Promise.all([
        getRegistrationCount(supabase, eventData.id),
        getPaymentStats(supabase, eventData.id),
        getTicketTypeCounts(supabase, eventData.id),
        getRecentActivity(supabase, eventData.id)
    ]);

    const stats: EventStats = {
        totalRegistrations: registrationCount,
        paidCount: paymentStats.paidCount,
        totalRevenue: paymentStats.totalRevenue,
        ticketTypeCounts: ticketCounts,
        recentActivity
    };

    return {
        event: eventData,
        eventStatus,
        stats
    };
};

async function checkEventCapacity(
    supabase: SupabaseClient,
    eventId: string,
    maxCapacity: number
): Promise<boolean> {
    const { count } = await supabase
        .from('attendees')
        .select('id', { count: 'exact' })
        .eq('event_id', eventId);
    
    return (count || 0) < maxCapacity;
}

async function getRegistrationCount(
    supabase: SupabaseClient,
    eventId: string
): Promise<number> {
    const { count } = await supabase
        .from('attendees')
        .select('id', { count: 'exact' })
        .eq('event_id', eventId);
    
    return count || 0;
}

async function getPaymentStats(
    supabase: SupabaseClient,
    eventId: string
): Promise<{ paidCount: number; totalRevenue: number }> {
    const { data } = await supabase
        .from('attendees')
        .select(`
            is_paid,
            ticket_info
        `)
        .eq('event_id', eventId);

    if (!data) return { paidCount: 0, totalRevenue: 0 };

    const paidCount = data.filter(item => item.is_paid).length;
    const totalRevenue = data.reduce((sum, item) => {
        if (item.is_paid && item.ticket_info?.price) {
            return sum + item.ticket_info.price;
        }
        return sum;
    }, 0);

    return { paidCount, totalRevenue };
}

async function getTicketTypeCounts(
    supabase: SupabaseClient,
    eventId: string
): Promise<Record<string, number>> {
    const { data } = await supabase
        .from('attendees')
        .select('ticket_info')
        .eq('event_id', eventId);

    return data?.reduce((acc: Record<string, number>, item: { ticket_info: { type?: string } }) => {
        const type = item.ticket_info?.type;
        if (type) {
            acc[type] = (acc[type] || 0) + 1;
        }
        return acc;
    }, {}) || {};
}

async function getRecentActivity(
    supabase: SupabaseClient,
    eventId: string
) {
    const { data: registrations } = await supabase
        .from('attendees')
        .select('basic_info, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(5);

    const { data: payments } = await supabase
        .from('attendees')
        .select('basic_info, payment_date')
        .eq('event_id', eventId)
        .not('payment_date', 'is', null)
        .order('payment_date', { ascending: false })
        .limit(5);

    const activity = [
        ...(registrations?.map((r: { basic_info: { firstName: string; lastName: string }; created_at: string }) => ({
            type: 'registration' as const,
            description: `${r.basic_info.firstName} ${r.basic_info.lastName} registered`,
            timestamp: r.created_at
        })) || []),
        ...(payments?.map((p: { basic_info: { firstName: string; lastName: string }; payment_date: string }) => ({
            type: 'payment' as const,
            description: `${p.basic_info.firstName} ${p.basic_info.lastName} completed payment`,
            timestamp: p.payment_date
        })) || [])
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

    return activity;
}
