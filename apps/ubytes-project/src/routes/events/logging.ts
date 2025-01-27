import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventStatus, LogChanges, Event } from './types';

function createTransitionMessages(): Record<EventStatus, Record<EventStatus, string>> {
    return {
        nodata: {
            nodata: `Event remains in draft`,
            forReview: `Event submitted for review`,
            approved: `Event directly approved from draft`,
            locked: `Event locked from draft`,
            locked_published: `Event published directly from draft`
        },
        forReview: {
            nodata: `Event returned to draft for modifications`,
            forReview: `Event remains in review`,
            approved: `Event approved after review`,
            locked: `Event locked while under review`,
            locked_published: `Event published from review state`
        },
        approved: {
            nodata: `Event reverted to draft for major changes`,
            forReview: `Event sent back for additional review`,
            approved: `Event remains approved`,
            locked: `Event locked after approval`,
            locked_published: `Event published after approval`
        },
        locked: {
            nodata: `Event unlocked and returned to draft`,
            forReview: `Event unlocked for review`,
            approved: `Event unlocked and returned to approved state`,
            locked: `Event remains locked`,
            locked_published: `Event published from locked state`
        },
        locked_published: {
            nodata: `Event unpublished and returned to draft`,
            forReview: `Event unpublished and sent for review`,
            approved: `Event unpublished and returned to approved state`,
            locked: `Event unpublished but remains locked`,
            locked_published: `Event remains published`
        }
    };
}

export function getStatusTransitionMessage(previousStatus: EventStatus, newStatus: EventStatus, eventName: string): string {
    const transitionMessages = createTransitionMessages();
    const baseMessage = transitionMessages[previousStatus]?.[newStatus];
    return baseMessage ? `${eventName}: ${baseMessage}` : 
           `Event "${eventName}" status changed from ${previousStatus} to ${newStatus}`;
}

export async function logActivity(
    supabase: SupabaseClient,
    userId: string | undefined | null,
    activity: string,
    changes?: LogChanges
) {
    let detailedActivity = activity;

    if (changes?.previous?.event_status && changes?.current?.event_status && changes?.current?.event_name) {
        detailedActivity = getStatusTransitionMessage(
            changes.previous.event_status,
            changes.current.event_status,
            changes.current.event_name
        );
    }

    const logEntry = {
        user_id: userId || null,
        activity: detailedActivity,
        created_at: new Date().toISOString(),
        previous_data: changes?.previous || null,
        new_data: changes?.current || null
    };

    const { error } = await supabase
        .from('logging_activities')
        .insert(logEntry);

    if (error) console.error('Logging error:', error);
}

export async function logEventCreation(
    supabase: SupabaseClient,
    userId: string | null,
    eventName: string
) {
    await logActivity(supabase, userId, `Created event "${eventName}"`, {
        current: { event_name: eventName, event_status: 'nodata' }
    });
}

export async function logEventUpdate(
    supabase: SupabaseClient,
    userId: string,
    previousEvent: Event,
    updatedEvent: Event
) {
    await logActivity(
        supabase,
        userId,
        `Updated event "${previousEvent.event_name}"`,
        {
            previous: previousEvent,
            current: updatedEvent
        }
    );
}

export async function logEventDeletion(
    supabase: SupabaseClient,
    userId: string,
    deletedEvent: Event
) {
    await logActivity(
        supabase,
        userId,
        `Deleted event "${deletedEvent.event_name}"`,
        {
            previous: deletedEvent
        }
    );
}

export async function logAuthorizationFailure(
    supabase: SupabaseClient,
    userId: string | null,
    action: string
) {
    await logActivity(supabase, userId, `Unauthorized ${action}`);
}

export async function logInvalidData(
    supabase: SupabaseClient,
    userId: string,
    action: string,
    errors?: any
) {
    await logActivity(
        supabase,
        userId,
        `Invalid ${action} data: ${JSON.stringify(errors || 'Unknown error')}`
    );
}
export async function logDatabaseError(
    supabase: SupabaseClient,
    userId: string,
    action: string,
    error: any
) {
    const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
    } : error;

    const logEntry = {
        user_id: userId || null,
        activity: `Failed to ${action}: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
        created_at: new Date().toISOString(),
        previous_data: null,
        new_data: null,
        error_details: errorDetails
    };

    const { error: logError } = await supabase
        .from('logging_activities')
        .insert(logEntry);

    if (logError) console.error('Logging error:', logError);
}