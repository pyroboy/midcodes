import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { formSchema, type FormData } from './schema';

const EVENT_STATUSES = ['nodata', 'forReview', 'approved', 'locked', 'locked_published'] as const;
type EventStatus = typeof EVENT_STATUSES[number];
type ActionType = 'create' | 'revertToReview' | 'approve' | 'updateApproved' | 'clear';

interface ActionConfig {
    newStatus: EventStatus;
    allowedStatuses: EventStatus[];
    activityPrefix: string;
    successMessage: (count: number, tieCount: number) => string;
}

const ACTION_CONFIGS: Record<Exclude<ActionType, 'clear'>, ActionConfig> = {
    create: {
        newStatus: 'forReview',
        allowedStatuses: ['nodata', 'forReview'],
        activityPrefix: 'Created',
        successMessage: (count, tieCount) => 
            `Successfully created ${count} rankings${tieCount ? ` with ${tieCount} tie groups` : ''}`
    },
    revertToReview: {
        newStatus: 'forReview',
        allowedStatuses: ['nodata', 'approved'],
        activityPrefix: 'Reverted',
        successMessage: (count) => 
            `Successfully reverted ${count} rankings to review status`
    },
    approve: {
        newStatus: 'approved',
        allowedStatuses: ['forReview'],
        activityPrefix: 'Approved',
        successMessage: (count, tieCount) => 
            `Successfully approved ${count} rankings${tieCount ? ` with ${tieCount} tie groups` : ''}`
    },
    updateApproved: {
        newStatus: 'approved',
        allowedStatuses: ['approved'],
        activityPrefix: 'Updated approved',
        successMessage: (count, tieCount) => 
            `Successfully updated ${count} approved rankings${tieCount ? ` with ${tieCount} tie groups` : ''}`
    }
};

function isEventStatus(value: string): value is EventStatus {
    return EVENT_STATUSES.includes(value as EventStatus);
}

async function logActivityWithChanges(
    supabase: SupabaseClient,
    userId: string,
    activity: string,
    validRankings: any[],
    departmentMap: Map<number, string>,
    event_id: string,
    tie_groups?: string
) {
    const tieGroupsCount = new Set(
        validRankings.filter(r => r.tie_group !== null).map(r => r.tie_group)
    ).size;

    const rankingsWithDepartments = validRankings.map(r => ({
        ...r,
        department: departmentMap.get(r.department_id) || 'Unknown'
    }));

    const logData = {
        event_id,
        rankings: rankingsWithDepartments,
        tie_groups,
        tieGroupsCount,
        rankingsCount: validRankings.length
    };

    const { error } = await supabase
        .from('logging_activities')
        .insert({
            user_id: userId,
            activity,
            created_at: new Date().toISOString(),
            new_data: logData
        });

    if (error) console.error(`Logging error for ${activity}:`, error);
    return logData;
}

async function handleRankingAction(
    actionType: Exclude<ActionType, 'clear'>,
    form: FormData,
    supabase: SupabaseClient,
    session: { user: { id: string } },
    config: ActionConfig
) {
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('event_name, event_status')
        .eq('id', form.event_id)
        .single();

    if (eventError) {
        return { error: `Failed to fetch event: ${eventError.message}` };
    }

    if (!event || !isEventStatus(event.event_status)) {
        return { error: `Event not found or invalid status: ${event?.event_status}` };
    }

    if (!config.allowedStatuses.includes(event.event_status)) {
        return { 
            error: `Cannot ${actionType} event in ${event.event_status} status. Allowed statuses: ${config.allowedStatuses.join(', ')}`
        };
    }

    const validRankings = form.rankings?.filter(r => r.department_id !== -1) ?? [];
    const departmentIds = validRankings.map(r => r.department_id);

    const { data: departmentDetails, error: deptError } = await supabase
        .from('departments')
        .select('id, department_acronym')
        .in('id', departmentIds);

    if (deptError) {
        return { error: `Failed to fetch departments: ${deptError.message}` };
    }

    const departmentMap = new Map(
        departmentDetails?.map(d => [d.id, d.department_acronym]) || []
    );

    const { error: updateError } = await supabase.rpc('update_rankings', {
        p_event_id: form.event_id,
        p_rankings: validRankings,
        p_tie_groups: form.tie_groups || '',
        p_updated_by: session.user.id,
        p_event_status: config.newStatus
    });

    if (updateError) {
        await logActivityWithChanges(
            supabase,
            session.user.id,
            `Failed to ${actionType} rankings for ${event.event_name}`,
            validRankings,
            departmentMap,
            form.event_id,
            form.tie_groups
        );
        
        return { error: `Database error: ${updateError.message}`, details: updateError };
    }

    const logData = await logActivityWithChanges(
        supabase,
        session.user.id,
        `${config.activityPrefix} rankings for ${event.event_name}`,
        validRankings,
        departmentMap,
        form.event_id,
        form.tie_groups
    );

    return { 
        success: true, 
        logData,
        message: config.successMessage(logData.rankingsCount, logData.tieGroupsCount)
    };
}

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
export const load: PageServerLoad = async ({ locals: { supabase } }) => {
    const form = await superValidate(zod(formSchema));
    
    const [events, departments, tabulations] = await Promise.all([
        supabase
            .from('events')
            .select('id, event_name, medal_count, category, event_status')
            .order('category')
            .order('event_name'),
            
        supabase
            .from('departments')
            .select('id, department_name, department_acronym, department_logo'),
            
        supabase
            .from('tabulations_view')  // Make sure this matches your view name
            .select('*')
            .order('updated_at', { ascending: false })
            .order('event_name')
            .order('rank')
    ]);

    return { 
        form, 
        events: events.data, 
        departments: departments.data, 
        tabulations: tabulations.data 
    };
};

export const actions: Actions = {
    async create({ request, locals: { supabase, safeGetSession } }) {
        const { session } = await safeGetSession();
        if (!session) return fail(403, { message: 'Not authorized' });

        try {
            const form = await superValidate(request, zod(formSchema));
            if (!form.valid) {
                return fail(400, { 
                    form,
                    message: 'Form validation failed',
                    serverError: JSON.stringify(form.errors)
                });
            }

            const result = await handleRankingAction(
                'create',
                form.data,
                supabase,
                session,
                ACTION_CONFIGS.create
            );

            if ('error' in result) {
                return fail(400, { form, message: result.error });
            }

            return { form, success: true, message: result.message };
        } catch (error) {
            return fail(500, { 
                message: 'Server error occurred',
                serverError: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    async revertToReview({ request, locals: { supabase, safeGetSession } }) {
        const { session } = await safeGetSession();
        if (!session) return fail(403, { message: 'Not authorized' });

        try {
            const form = await superValidate(request, zod(formSchema));
            if (!form.valid) {
                return fail(400, { 
                    form,
                    message: 'Form validation failed',
                    serverError: JSON.stringify(form.errors)
                });
            }

            const result = await handleRankingAction(
                'revertToReview',
                form.data,
                supabase,
                session,
                ACTION_CONFIGS.revertToReview
            );

            if ('error' in result) {
                return fail(400, { form, message: result.error });
            }

            return { form, success: true, message: result.message };
        } catch (error) {
            return fail(500, { 
                message: 'Server error occurred',
                serverError: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    async approve({ request, locals: { supabase, safeGetSession } }) {
        const { session } = await safeGetSession();
        if (!session) return fail(403, { message: 'Not authorized' });

        try {
            const form = await superValidate(request, zod(formSchema));
            if (!form.valid) {
                return fail(400, { 
                    form,
                    message: 'Form validation failed',
                    serverError: JSON.stringify(form.errors)
                });
            }

            const result = await handleRankingAction(
                'approve',
                form.data,
                supabase,
                session,
                ACTION_CONFIGS.approve
            );

            if ('error' in result) {
                return fail(400, { form, message: result.error });
            }

            return { form, success: true, message: result.message };
        } catch (error) {
            return fail(500, { 
                message: 'Server error occurred',
                serverError: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    async updateApproved({ request, locals: { supabase, safeGetSession } }) {
        const { session } = await safeGetSession();
        if (!session) return fail(403, { message: 'Not authorized' });

        try {
            const form = await superValidate(request, zod(formSchema));
            if (!form.valid) {
                return fail(400, { 
                    form,
                    message: 'Form validation failed',
                    serverError: JSON.stringify(form.errors)
                });
            }

            const result = await handleRankingAction(
                'updateApproved',
                form.data,
                supabase,
                session,
                ACTION_CONFIGS.updateApproved
            );

            if ('error' in result) {
                return fail(400, { form, message: result.error });
            }

            return { form, success: true, message: result.message };
        } catch (error) {
            return fail(500, { 
                message: 'Server error occurred',
                serverError: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },


    async clear({ request, locals: { supabase, safeGetSession } }) {
        const { session } = await safeGetSession();
        if (!session) return fail(403, { message: 'Not authorized' });

        try {
            const form = await superValidate(request, zod(formSchema));
            if (!form.valid) {
                return fail(400, { 
                    form,
                    message: 'Form validation failed',
                    serverError: JSON.stringify(form.errors)
                });
            }

            if (!form.data.event_id) {
                return fail(400, { form, message: 'No event selected' });
            }

            const result = await clearTabulations(
                form.data.event_id,
                supabase,
                session.user.id
            );

            if (!result.success) {
                return fail(400, { 
                    form,
                    message: result.message,
                    serverError: result.error
                });
            }

            // Fetch updated tabulations after clearing
            const { data: updatedTabulations } = await supabase
                .from('tabulations_view')
                .select('*')
                .order('updated_at', { ascending: false })
                .order('event_name')
                .order('rank');

            // Return both success message and updated data
            return { 
                form, 
                success: true, 
                message: result.message,
                tabulations: updatedTabulations
            };
        } catch (error) {
            return fail(500, { 
                message: 'Server error occurred',
                serverError: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
