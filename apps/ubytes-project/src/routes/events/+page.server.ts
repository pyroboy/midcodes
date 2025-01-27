import { fail } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { zod } from 'sveltekit-superforms/adapters'
import type { PageServerLoad, Actions } from './$types'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js';

import { 
    EVENT_STATUSES, 
    EVENT_CATEGORIES,
    type EventStatus,
    type Event,
    type EventCategory
} from './types'

import {
    logActivity,
    logEventCreation,
    logEventUpdate,
    logEventDeletion,
    logAuthorizationFailure,
    logInvalidData,
    logDatabaseError
} from './logging'

import { 
    checkAuthorization,
    ROLE_STATUS_PERMISSIONS 
} from './authorization'


import { 
    refreshMaterializedView, 
    notifyMedalTallyUpdate, 
    handleMedalTallyUpdate ,
    shouldRefreshMedalTally  // Added this import
} from './updates';

interface ClearTabulationsResult {
    success: boolean;
    message: string;
    error?: string;
    deletedCount?: number;
}

async function clearTabulations(
    eventId: string,
    supabase: SupabaseClient,
    userId: string
): Promise<ClearTabulationsResult> {
    console.log('Starting clearTabulations for eventId:', eventId);

    // First verify the event
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('event_name, event_status')
        .eq('id', eventId)
        .single();

    if (eventError || !event) {
        return { 
            success: false, 
            message: 'Failed to fetch event details', 
            error: eventError?.message 
        };
    }

    // Execute raw delete query
    const { data: deleteResult, error: deleteError } = await supabase
        .rpc('clear_event_tabulations', {
            p_event_id: eventId
        });

    console.log('Delete operation result:', {
        result: deleteResult,
        error: deleteError
    });

    if (deleteError) {
        return { 
            success: false, 
            message: 'Failed to clear tabulations', 
            error: deleteError.message 
        };
    }

    // Update event status
    const { error: updateError } = await supabase
        .from('events')
        .update({ 
            event_status: 'nodata',
            updated_at: new Date().toISOString(),
            updated_by: userId,
            tie_groups: null,
            ranking_summary: null
        })
        .eq('id', eventId);

    if (updateError) {
        return { 
            success: false, 
            message: 'Failed to update event status', 
            error: updateError.message 
        };
    }

    // Log the operation
    await supabase
        .from('logging_activities')
        .insert({
            user_id: userId,
            activity: `Cleared tabulations for ${event.event_name}`,
            created_at: new Date().toISOString(),
            new_data: { 
                event_id: eventId,
                event_name: event.event_name
            }
        });

    return { 
        success: true,
        message: `Successfully cleared tabulations for ${event.event_name}`
    };
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
    category: z.enum(EVENT_CATEGORIES),
    event_status: z.enum(EVENT_STATUSES).default('nodata')
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
    userRole: z.enum(['Admin', 'TabulationHead'])
}).superRefine((data, ctx) => {
    const allowedStatuses = ROLE_STATUS_PERMISSIONS[data.userRole]
    if (!allowedStatuses?.includes(data.newStatus)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${data.userRole} is not authorized to set status to ${data.newStatus}`,
            path: ["newStatus"]
        })
    }
})

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession()
    const form = await superValidate(zod(eventSchema))

    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

    if (eventsError) {
        await logActivity(supabase, session?.user.id ?? null, `Failed to fetch events`)
        return { form, events: [], error: 'Failed to load events' }
    }

    const { authorized, role } = session ? 
        await checkAuthorization(supabase, session.user.id) : 
        { authorized: false, role: undefined }

    const allowedStatuses = role ? ROLE_STATUS_PERMISSIONS[role] : []

    return { form, events, authorized, role, allowedStatuses }
}

export const actions: Actions = {
    create: async ({ request, locals: { supabase, safeGetSession } }) => {
        const form = await superValidate(request, zod(eventSchema))
        const { session } = await safeGetSession()

        if (!session || !(await checkAuthorization(supabase, session.user.id)).authorized) {
            await logAuthorizationFailure(supabase, session?.user.id ?? null, 'event creation')
            return fail(403, { form })
        }

        if (!form.valid) {
            await logInvalidData(supabase, session.user.id, 'event creation', form.errors)
            return fail(400, { form })
        }

        const newEvent: Partial<Event> = {
            event_name: form.data.event_name,
            medal_count: form.data.medal_count,
            category: form.data.category as EventCategory,
            updated_by: session.user.id,
            event_status: 'nodata' as EventStatus
        }

        const { data, error } = await supabase
            .from('events')
            .insert(newEvent)
            .select()
            .single()

        if (error) {
            await logDatabaseError(supabase, session.user.id, 'event creation', error)
            return fail(500, { form })
        }

        await logEventCreation(supabase, session.user.id, form.data.event_name)
        return { form }
    },

    update: async ({ request, locals: { supabase, safeGetSession } }) => {
        const formData = await request.formData()
        const isStatusUpdate = formData.get('isStatusUpdate') === 'true'
        
        // Use formData directly with superValidate
        const form = await superValidate(formData, zod(eventSchema))
        const { session } = await safeGetSession()

        if (!session) {
            return fail(403, { 
                form,
                success: false,
                message: 'Unauthorized access'
            })
        }

        const authResult = await checkAuthorization(supabase, session.user.id)
        if (!authResult.authorized || !authResult.role) {
            await logAuthorizationFailure(supabase, session.user.id, isStatusUpdate ? 'status update' : 'event update')
            return fail(403, { 
                form,
                success: false,
                message: 'Insufficient permissions'
            })
        }

        if (!form.valid || !form.data.id) {
            console.log('Form validation failed:', form.errors) // Debug log
            await logInvalidData(supabase, session.user.id, isStatusUpdate ? 'status update' : 'event update', form.errors)
            return fail(400, { 
                form,
                success: false,
                message: 'Invalid form data'
            })
        }

        // Fetch existing event
        const { data: existingEvent, error: fetchError } = await supabase
            .from('events')
            .select()
            .eq('id', form.data.id)
            .single()

        if (fetchError || !existingEvent) {
            await logActivity(supabase, session.user.id, 'Event not found')
            return fail(404, { 
                form,
                success: false,
                message: 'Event not found'
            })
        }

        // Only validate status transition if it's a status update
        if (isStatusUpdate) {
            const statusResult = statusUpdateSchema.safeParse({
                currentStatus: existingEvent.event_status,
                newStatus: form.data.event_status,
                userRole: authResult.role
            })

            if (!statusResult.success) {
                await logActivity(supabase, session.user.id, `Invalid status transition: ${existingEvent.event_status} → ${form.data.event_status}`)
                return fail(400, { 
                    form,
                    success: false,
                    message: 'Invalid status transition'
                })
            }

            const needsMedalTallyUpdate = await shouldRefreshMedalTally(
                existingEvent.event_status,
                form.data.event_status
            )

            if (needsMedalTallyUpdate) {
                try {
                    await refreshMaterializedView(supabase)
                } catch (medalTallyError) {
                    console.error('Medal tally refresh error:', medalTallyError)
                    
                    const errorMessage = medalTallyError instanceof Error ? 
                        medalTallyError.message : 
                        'Failed to update medal tally'

                    await logActivity(
                        supabase,
                        session.user.id,
                        `Medal tally refresh failed: ${errorMessage}`
                    )

                    return fail(500, {
                        form,
                        success: false,
                        message: 'Permission denied: Cannot update medal tally',
                        error: errorMessage
                    })
                }
            }
        }

        try {
            // Prepare update data based on update type
            const updateData = isStatusUpdate ? 
                {
                    event_status: form.data.event_status,
                    updated_by: session.user.id,
                    updated_at: new Date().toISOString()
                } : 
                {
                    event_name: form.data.event_name,
                    category: form.data.category,
                    medal_count: form.data.medal_count,
                    event_status: existingEvent.event_status, // Keep existing status
                    updated_by: session.user.id,
                    updated_at: new Date().toISOString()
                }

            const { data: updatedEvent, error: updateError } = await supabase
                .from('events')
                .update(updateData)
                .eq('id', form.data.id)
                .select()
                .single()

            if (updateError) {
                console.error('Database update error:', updateError)
                throw updateError
            }

            if (!updatedEvent) {
                throw new Error('Failed to retrieve updated event data')
            }

            await logEventUpdate(supabase, session.user.id, existingEvent, updatedEvent)

            if (isStatusUpdate && updatedEvent.event_status === 'locked_published') {
                try {
                    await notifyMedalTallyUpdate(supabase)
                } catch (notifyError) {
                    console.warn('Medal tally notification failed:', notifyError)
                }
            }

            return {
                form,
                success: true,
                message: isStatusUpdate ? 'Status updated successfully' : 'Event details updated successfully',
                data: updatedEvent
            }

        } catch (error) {
            const dbError = error as { message?: string; code?: string }
            const errorMessage = dbError.message || 'An unexpected error occurred'

            console.error('Event update error:', {
                error,
                event: existingEvent.event_name,
                userId: session.user.id,
                timestamp: new Date().toISOString()
            })

            await logActivity(
                supabase,
                session.user.id,
                isStatusUpdate ? 
                    `Status update failed: ${errorMessage}` : 
                    `Event update failed: ${errorMessage}`
            )

            return fail(500, {
                form,
                success: false,
                message: `Database error: ${errorMessage}`,
                error: dbError.code ? `Error code: ${dbError.code}` : undefined
            })
        }
    },
    delete: async ({ request, locals: { supabase, safeGetSession } }) => {
        const { session } = await safeGetSession()
        const formData = await request.formData()
        const id = formData.get('id')?.toString()

        if (!session) {
            await logAuthorizationFailure(supabase, null, 'event deletion')
            return fail(403, {})
        }

        const authResult = await checkAuthorization(supabase, session.user.id)
        if (!authResult.authorized || authResult.role !== 'Admin') {
            await logAuthorizationFailure(supabase, session.user.id, 'event deletion')
            return fail(403, {})
        }

        if (!id) {
            await logInvalidData(supabase, session.user.id, 'event deletion', { id: 'Missing event ID' })
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

        // Clear tabulations first if they exist
        if (existingEvent.event_status !== 'nodata') {
            const clearResult = await clearTabulations(id, supabase, session.user.id)
            if (!clearResult.success) {
                await logActivity(
                    supabase, 
                    session.user.id, 
                    `Failed to clear tabulations before deletion: ${clearResult.error}`
                )
                return fail(500, { 
                    message: 'Failed to clear tabulations before deletion',
                    error: clearResult.error 
                })
            }
        }

        // After clearing tabulations, proceed with event deletion
        const { error: deleteError } = await supabase
            .from('events')
            .delete()
            .match({ id })

        if (deleteError) {
            await logDatabaseError(supabase, session.user.id, 'event deletion', deleteError)
            return fail(500, {})
        }

        await logEventDeletion(supabase, session.user.id, existingEvent)

        // Only refresh materialized view if event was published
        if (existingEvent.event_status === 'locked_published') {
            try {
                await refreshMaterializedView(supabase)
                await notifyMedalTallyUpdate(supabase)
            } catch (error) {
                await logActivity(
                    supabase,
                    session.user.id,
                    `Event deleted but medal tally refresh failed`
                )
            }
        }

        return {
            success: true,
            message: `Successfully deleted event: ${existingEvent.event_name}`
        }
    }
}