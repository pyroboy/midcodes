import { createQuery, createMutation, useQueryClient, type QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';
import { callTelefunc } from '$lib/data/helper/calltelefunc';
import type {
    EnhancedReturnRecord,
    NewReturnInput,
    UpdateReturnStatusInput,
    ReturnFilters,
    ReturnStats
} from '$lib/types/returns.schema';

// Query Keys
const keys = {
    all: ['returns'] as const,
    lists: () => [...keys.all, 'list'] as const,
    list: (filters?: ReturnFilters) => [...keys.lists(), filters] as const,
    details: () => [...keys.all, 'detail'] as const,
    detail: (id: string) => [...keys.details(), id] as const,
    stats: () => [...keys.all, 'stats'] as const
};

// Cache Update Utility
const updateReturnInLists = (queryClient: QueryClient, updatedReturn: EnhancedReturnRecord, filters?: ReturnFilters) => {
    queryClient.setQueryData<EnhancedReturnRecord[]>(keys.list(filters), (oldData) => 
        oldData ? oldData.map(returnRecord => 
            returnRecord.id === updatedReturn.id ? updatedReturn : returnRecord
        ) : oldData
    );
    queryClient.setQueryData(keys.detail(updatedReturn.id), updatedReturn);
};

// Main Returns Hook
export function useReturns(filters?: ReturnFilters) {
    const queryClient = useQueryClient();

    const returnsQuery = createQuery({
        queryKey: keys.list(filters),
        queryFn: () => callTelefunc<EnhancedReturnRecord[]>('onGetReturns', filters ? [filters] : []),
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes
        enabled: browser
    });

    const statsQuery = createQuery({
        queryKey: keys.stats(),
        queryFn: () => callTelefunc<ReturnStats>('onGetReturnStats'),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000,   // 15 minutes
        enabled: browser
    });

    // Mutations with shared success logic
    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: keys.lists() });
        queryClient.invalidateQueries({ queryKey: keys.stats() });
    };

    const createReturnMutation = createMutation({
        mutationFn: (data: NewReturnInput) => callTelefunc<EnhancedReturnRecord>('onCreateReturn', [data]),
        onSuccess: (newReturn) => {
            invalidateAll();
            queryClient.setQueryData<EnhancedReturnRecord[]>(keys.list(filters), (oldData) =>
                oldData ? [newReturn, ...oldData] : [newReturn]
            );
        },
        onError: (error) => {
            console.error('Failed to create return:', error);
        }
    });

    const updateStatusMutation = createMutation({
        mutationFn: (data: UpdateReturnStatusInput) => callTelefunc<EnhancedReturnRecord>('onUpdateReturnStatus', [data]),
        onSuccess: (updatedReturn) => {
            updateReturnInLists(queryClient, updatedReturn, filters);
            queryClient.invalidateQueries({ queryKey: keys.stats() });
        },
        onError: (error) => {
            console.error('Failed to update return status:', error);
        }
    });

    const deleteMutation = createMutation({
        mutationFn: (returnId: string) => callTelefunc<void>('onDeleteReturn', [returnId]),
        onSuccess: (_, returnId) => {
            queryClient.setQueryData<EnhancedReturnRecord[]>(keys.list(filters), (oldData) => 
                oldData ? oldData.filter(returnRecord => returnRecord.id !== returnId) : oldData
            );
            queryClient.removeQueries({ queryKey: keys.detail(returnId) });
            queryClient.invalidateQueries({ queryKey: keys.stats() });
        },
        onError: (error) => {
            console.error('Failed to delete return:', error);
        }
    });

    return {
        // Queries
        returnsQuery,
        statsQuery,
        
        // Mutations
        createReturn: createReturnMutation.mutate,
        updateStatus: updateStatusMutation.mutate,
        deleteReturn: deleteMutation.mutate,
        
        // Mutation objects
        createReturnMutation,
        updateStatusMutation,
        deleteMutation,
        
        // Utilities
        refetch: () => queryClient.invalidateQueries({ queryKey: keys.lists() }),
        refetchStats: () => queryClient.invalidateQueries({ queryKey: keys.stats() })
    };
}

// Single Return Hook
export function useReturn(returnId: string) {
    const queryClient = useQueryClient();

    const query = createQuery({
        queryKey: keys.detail(returnId),
        queryFn: () => callTelefunc<EnhancedReturnRecord | null>('onGetReturnById', [returnId]),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 15 * 60 * 1000,   // 15 minutes
        enabled: browser && !!returnId
    });

    return {
        query,
        refetch: () => queryClient.invalidateQueries({ queryKey: keys.detail(returnId) })
    };
}

// Optimistic Updates Hook
export function useOptimisticReturnUpdate() {
    const queryClient = useQueryClient();

    return {
        updateStatus: (returnId: string, newStatus: EnhancedReturnRecord['status'], adminNotes?: string) => {
            const timestamp = new Date().toISOString();
            
            const updateListFn = (oldData: EnhancedReturnRecord[] | undefined) => 
                oldData ? oldData.map(returnRecord => 
                    returnRecord.id === returnId ? {
                        ...returnRecord,
                        status: newStatus,
                        admin_notes: adminNotes || returnRecord.admin_notes,
                        updated_at: timestamp
                    } : returnRecord
                ) : oldData;

            const updateDetailFn = (oldData: EnhancedReturnRecord | undefined) => 
                oldData?.id === returnId ? {
                    ...oldData,
                    status: newStatus,
                    admin_notes: adminNotes || oldData.admin_notes,
                    updated_at: timestamp
                } : oldData;

            queryClient.setQueriesData({ queryKey: keys.lists() }, updateListFn);
            queryClient.setQueriesData({ queryKey: keys.details() }, updateDetailFn);
        }
    };
}