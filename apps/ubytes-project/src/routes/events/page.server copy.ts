import { fail } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { zod } from 'sveltekit-superforms/adapters'
import type { PageServerLoad, Actions } from './$types'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

const EVENT_STATUSES = ['nodata', 'forReview', 'approved', 'locked', 'locked_published'] as const
const USER_ROLES = ['Admin', 'TabulationHead'] as const
const EVENT_CATEGORIES = [
    'Athletics',
    'Academics & Literary',
    'Music',
    'Dances',
    'E-Sports',
    'MMUB',
    'Special'
] as const;

const EventStatus = z.enum(EVENT_STATUSES)
const UserRole = z.enum(USER_ROLES)
const EventCategory = z.enum(EVENT_CATEGORIES)

type EventStatus = typeof EVENT_STATUSES[number]
type UserRole = typeof USER_ROLES[number]
type EventCategory = typeof EVENT_CATEGORIES[number]

interface Event {
    id: string
    event_name: string
    medal_count: number | null
    category: EventCategory
    event_status: EventStatus
    updated_by: string
    created_at: string
    updated_at: string
}

interface LogChanges {
    previous?: Partial<Event>
    current?: Partial<Event>
}

const AUTHORIZED_ROLES = USER_ROLES

const ROLE_STATUS_PERMISSIONS: Record<UserRole, readonly EventStatus[]> = {
    Admin: EVENT_STATUSES,
    TabulationHead: ['nodata', 'forReview', 'approved'] as const
}

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
    }
}

function getStatusTransitionMessage(previousStatus: EventStatus, newStatus: EventStatus, eventName: string): string {
    const transitionMessages = createTransitionMessages()
    const baseMessage = transitionMessages[previousStatus]?.[newStatus]
    return baseMessage ? `${eventName}: ${baseMessage}` : 
           `Event "${eventName}" status changed from ${previousStatus} to ${newStatus}`
}

const eventSchema = z.object({
    id: z.string().optional(),
    event_name: z.string()
        .min(1, "Event name is required")
        .max(100, "Event name cannot exceed 100 characters"),
    medal_count: z.number()
        .int("Medal count must be a whole number")
        .min(0, "Medal count cannot be negative")
        .nullable(),
    category: EventCategory,
    event_status: EventStatus.default('nodata')
}).superRefine((data, ctx) => {
    if (data.event_status !== 'nodata' && data.medal_count === null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Medal count is required for non-nodata status",
            path: ["medal_count"]
        })
    }
})

const statusUpdateSchema = z.object({
    currentStatus: z.enum(EVENT_STATUSES),
    newStatus: z.enum(EVENT_STATUSES),
    userRole: z.enum(USER_ROLES)
}).superRefine((data, ctx) => {
    const allowedStatuses = ROLE_STATUS_PERMISSIONS[data.userRole as UserRole]
    if (!allowedStatuses?.includes(data.newStatus)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${data.userRole} is not authorized to set status to ${data.newStatus}`,
            path: ["newStatus"]
        })
    }
})

async function checkAuthorization(supabase: SupabaseClient, userId: string | null): Promise<{ authorized: boolean; role?: UserRole }> {
    if (!userId) return { authorized: false }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    if (error || !profile) return { authorized: false }
    
    const authorized = AUTHORIZED_ROLES.includes(profile.role as UserRole)
    return { authorized, role: profile.role as UserRole }
}

async function logActivity(
    supabase: SupabaseClient,
    userId: string | undefined | null,
    activity: string,
    changes?: LogChanges
) {
    let detailedActivity = activity

    if (changes?.previous?.event_status && changes?.current?.event_status && changes?.current?.event_name) {
        detailedActivity = getStatusTransitionMessage(
            changes.previous.event_status,
            changes.current.event_status,
            changes.current.event_name
        )
    }

    const logEntry = {
        user_id: userId || null,
        activity: detailedActivity,
        created_at: new Date().toISOString(),
        previous_data: changes?.previous || null,
        new_data: changes?.current || null
    }

    const { error } = await supabase
        .from('logging_activities')
        .insert(logEntry)

    if (error) console.error('Logging error:', error)
}

async function refreshMaterializedView(supabase: SupabaseClient) {
    console.log('Attempting to refresh materialized view...');
    const { error } = await supabase.rpc('refresh_medal_tally')
    if (error) {
        console.error('Failed to refresh materialized view:', error);
        throw new Error(`Could not refresh materialized view: ${error.message}`);
    }
    console.log('Successfully refreshed materialized view');
}

async function notifyMedalTallyUpdate(supabase: SupabaseClient) {
    console.log('Sending medal tally update notification...');
    const { error } = await supabase.rpc('notify_medal_tally_refresh');
    if (error) {
        console.error('Failed to notify medal tally update:', error);
        throw new Error('Failed to notify subscribers');
    }
    console.log('Successfully sent medal tally update notification');
}

async function shouldRefreshMedalTally(previousStatus: EventStatus, newStatus: EventStatus): Promise<boolean> {
    // Refresh when status changes to or from locked_published
    return previousStatus === 'locked_published' || newStatus === 'locked_published';
}
async function handleMedalTallyUpdate(
    supabase: SupabaseClient,
    eventName: string,
    previousStatus: EventStatus,
    newStatus: EventStatus,
    userId: string
) {
    const statusChange = `${previousStatus} → ${newStatus}`;
    console.log(`Medal tally update check for "${eventName}" (${statusChange})`);

    if (await shouldRefreshMedalTally(previousStatus, newStatus)) {
        try {
            console.log(`Refreshing medal tally for "${eventName}"...`);
            await refreshMaterializedView(supabase);
            console.log(`Successfully refreshed medal tally for "${eventName}"`);
        } catch (err) {
            console.error(`Failed to refresh medal tally for "${eventName}":`, err);
            throw new Error(`Failed to refresh medal tally: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    } else {
        console.log(`No medal tally update needed for status change: ${statusChange}`);
    }
}

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession()
    const form = await superValidate(zod(eventSchema))

    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

    if (eventsError) {
        await logActivity(supabase, session?.user.id, `Failed to fetch events`)
        return {
            form,
            events: [],
            error: 'Failed to load events'
        }
    }

    const { authorized, role } = session ? 
        await checkAuthorization(supabase, session.user.id) : 
        { authorized: false, role: undefined }

    const allowedStatuses = role ? ROLE_STATUS_PERMISSIONS[role] : []

    return { 
        form, 
        events,
        authorized,
        role,
        allowedStatuses
    }
}

export const actions: Actions = {
    create: async ({ request, locals: { supabase, safeGetSession } }) => {
        const form = await superValidate(request, zod(eventSchema))
        const { session } = await safeGetSession()

        if (!session || !(await checkAuthorization(supabase, session.user.id)).authorized) {
            await logActivity(supabase, session?.user.id, 'Unauthorized event creation')
            return fail(403, { form })
        }

        if (!form.valid) {
            await logActivity(supabase, session.user.id, 'Invalid event creation data')
            return fail(400, { form })
        }

        const newEvent: Partial<Event> = {
            event_name: form.data.event_name,
            medal_count: form.data.medal_count,
            category: form.data.category,
            updated_by: session.user.id,
            event_status: 'nodata'
        }

        const { data, error } = await supabase
            .from('events')
            .insert(newEvent)
            .select()
            .single()

        if (error) {
            await logActivity(supabase, session.user.id, `Failed to create event "${form.data.event_name}"`)
            return fail(500, { form })
        }

        await logActivity(
            supabase,
            session.user.id,
            `Created event "${form.data.event_name}"`,
            { current: data }
        )

        return { form }
    },

    update: async ({ request, locals: { supabase, safeGetSession } }) => {
        const form = await superValidate(request, zod(eventSchema));
        const { session } = await safeGetSession();
    
        if (!session) {
            await logActivity(supabase, null, 'Unauthorized event update');
            return fail(403, { 
                success: false,
                message: 'Unauthorized access',
                form 
            });
        }
    
        const authResult = await checkAuthorization(supabase, session.user.id);
        if (!authResult.authorized || !authResult.role) {
            await logActivity(supabase, session.user.id, 'Unauthorized event update');
            return fail(403, { 
                success: false,
                message: 'Insufficient permissions',
                form 
            });
        }
    
        if (!form.valid || !form.data.id) {
            console.log("Form validation status:", form.valid);
            console.log("Form data:", JSON.stringify(form.data));
            if (!form.data.id) {
                console.log("Error: Missing required field 'id'");
            }
            if (form.errors) {
                console.log("Validation errors:", form.errors);
            }
        
            await logActivity(supabase, session.user.id, `Invalid event update data: ${JSON.stringify(form.errors || 'Unknown error')}`);
            
            return fail(400, { 
                success: false,
                message: 'Invalid form data',
                form 
            });
        }
        
        const { data: existingEvent, error: fetchError } = await supabase
            .from('events')
            .select()
            .eq('id', form.data.id)
            .single();
    
        if (fetchError || !existingEvent) {
            await logActivity(supabase, session.user.id, 'Event not found');
            return fail(404, { 
                success: false,
                message: 'Event not found',
                form 
            });
        }
    
        const statusResult = statusUpdateSchema.safeParse({
            currentStatus: existingEvent.event_status,
            newStatus: form.data.event_status,
            userRole: authResult.role
        });
    
        if (!statusResult.success) {
            await logActivity(
                supabase,
                session.user.id,
                `Invalid status update for "${existingEvent.event_name}"`
            );
            return fail(400, { 
                success: false,
                message: 'Invalid status transition',
                form 
            });
        }
    
        try {
            const { data: updatedEvent, error: updateError } = await supabase
                .from('events')
                .update({
                    event_name: form.data.event_name,
                    category: form.data.category,
                    medal_count: form.data.medal_count,
                    event_status: form.data.event_status,
                    updated_by: session.user.id
                })
                .eq('id', form.data.id)
                .select()
                .single();
        
            if (updateError) {
                console.error('Database update error:', {
                    code: updateError.code,
                    message: updateError.message,
                    details: updateError.details,
                    hint: updateError.hint
                });
                throw updateError;
            }
        
            await logActivity(
                supabase,
                session.user.id,
                `Updated event "${existingEvent.event_name}"`,
                {
                    previous: existingEvent,
                    current: updatedEvent
                }
            );
        
            // Check if medal tally needs to be updated based on status change
            try {
                await handleMedalTallyUpdate(
                    supabase,
                    existingEvent.event_name,
                    existingEvent.event_status,
                    form.data.event_status,
                    session.user.id
                );
            } catch (err) {
                const medalTallyError = err instanceof Error ? err.message : 'Unknown error';
                console.error('Medal tally update failed:', {
                    error: err,
                    event: existingEvent.event_name,
                    statusTransition: `${existingEvent.event_status} → ${form.data.event_status}`
                });
                await logActivity(
                    supabase,
                    session.user.id,
                    `Event updated but medal tally refresh failed for "${existingEvent.event_name}". Error: ${medalTallyError}`
                );
                return fail(500, { 
                    success: false,
                    message: `Event was updated but medal tally refresh failed: ${medalTallyError}`,
                    form 
                });
            }
        
            return { 
                success: true,
                message: 'Event status updated successfully',
                form,
                data: updatedEvent
            };
        
        } catch (error) {
            const errorDetails = error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause
            } : error;
        
            console.error('Event update failed:', {
                error: errorDetails,
                event: existingEvent.event_name,
                formData: form.data,
                timestamp: new Date().toISOString()
            });
        
            const errorMessage = error instanceof Error 
                ? `Database error: ${error.message}` 
                : 'An unexpected error occurred while updating the event';
        
            // Create separate objects for event data and error logging
            const failedEventData: Partial<Event> = {
                ...form.data,
                event_name: form.data.event_name,
                category: form.data.category,
                medal_count: form.data.medal_count,
                event_status: form.data.event_status
            };
        
            await logActivity(
                supabase,
                session.user.id,
                `Failed to update "${existingEvent.event_name}" - ${errorMessage}`,
                {
                    previous: existingEvent,
                    current: failedEventData
                }
            );
        
            return fail(500, { 
                success: false,
                message: errorMessage,
                details: errorDetails,
                form 
            });
        }
    },

    delete: async ({ request, locals: { supabase, safeGetSession } }) => {
        const { session } = await safeGetSession()
        const formData = await request.formData()
        const id = formData.get('id')?.toString()

        if (!session) {
            await logActivity(supabase, null, 'Unauthorized event deletion')
            return fail(403, {})
        }

        const authResult = await checkAuthorization(supabase, session.user.id)
        if (!authResult.authorized || authResult.role !== 'Admin') {
            await logActivity(supabase, session.user.id, 'Unauthorized event deletion')
            return fail(403, {})
        }

        if (!id) {
            await logActivity(supabase, session.user.id, 'Invalid event deletion')
            return fail(400, {})
        }

        const { data: existingEvent } = await supabase
            .from('events')
            .select()
            .eq('id', id)
            .single()

        if (!existingEvent) {
            await logActivity(supabase, session.user.id, 'Event not found for deletion')
            return fail(404, {})
        }

        // Check if we need to refresh medal tally before deletion
        const needsRefresh = existingEvent.event_status === 'locked_published';

        const { error } = await supabase
            .from('events')
            .delete()
            .match({ id })

        if (error) {
            await logActivity(
                supabase, 
                session.user.id, 
                `Failed to delete "${existingEvent.event_name}"`
            )
            return fail(500, {})
        }

        await logActivity(
            supabase,
            session.user.id,
            `Deleted event "${existingEvent.event_name}"`,
            { previous: existingEvent }
        )

        // If the deleted event was published, refresh the medal tally
        if (needsRefresh) {
            try {
                console.log(`Refreshing medal tally after deleting published event "${existingEvent.event_name}"...`);
                await refreshMaterializedView(supabase);
                await notifyMedalTallyUpdate(supabase);
                console.log(`Successfully refreshed medal tally after deletion`);
            } catch (err) {
                console.error('Failed to refresh medal tally after deletion:', err);
                // We don't fail the delete operation if the refresh fails
                await logActivity(
                    supabase,
                    session.user.id,
                    `Event deleted but medal tally refresh failed for "${existingEvent.event_name}"`
                );
            }
        }

        return {}
    }
}