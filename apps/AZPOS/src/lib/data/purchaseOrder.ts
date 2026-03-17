import { createQuery, createMutation, useQueryClient, type QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';
import { callTelefunc } from '$lib/data/helper/calltelefunc';
import type {
    PurchaseOrder,
    CreatePurchaseOrder,
    UpdatePurchaseOrder,
    PurchaseOrderFilters,
    PaginatedPurchaseOrders,
    PurchaseOrderStats,
    ApprovePurchaseOrder,
    ReceiveItems
} from '$lib/types/purchaseOrder.schema';

// --- Query Keys ---
const keys = {
    all: ['purchaseOrders'] as const,
    lists: () => [...keys.all, 'list'] as const,
    list: (filters?: PurchaseOrderFilters) => [...keys.lists(), filters] as const,
    details: () => [...keys.all, 'detail'] as const,
    detail: (id: string) => [...keys.details(), id] as const,
    stats: () => [...keys.all, 'stats'] as const
};

// --- Cache Update Utilities ---
function updatePOInLists(queryClient: QueryClient, updatedPO: PurchaseOrder, filters?: PurchaseOrderFilters) {
    queryClient.setQueryData<PaginatedPurchaseOrders>(
        keys.list(filters),
        (oldData) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                purchase_orders: oldData.purchase_orders.map(po => 
                    po.id === updatedPO.id ? updatedPO : po
                )
            };
        }
    );
    queryClient.setQueryData(keys.detail(updatedPO.id), updatedPO);
}

// --- Data Hooks ---
export function usePurchaseOrders(filters?: PurchaseOrderFilters) {
    const queryClient = useQueryClient();
    
    console.log('🌍 [DATA HOOK] usePurchaseOrders - browser state:', browser);

    const purchaseOrdersQuery = createQuery({
        queryKey: keys.list(filters),
        queryFn: async () => {
            console.log('📡 [DATA HOOK] Query function executing - browser:', browser);
            console.log('🚀 [DATA HOOK] Calling telefunc onGetPurchaseOrders with filters:', filters);
            const result = await callTelefunc<PaginatedPurchaseOrders>('onGetPurchaseOrders', [filters]);
            console.log('✅ [DATA HOOK] Telefunc returned', result.purchase_orders.length, 'purchase orders');
            return result;
        },
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        enabled: browser && typeof window !== 'undefined' // Double check for client-side
    });

    const statsQuery = createQuery({
        queryKey: keys.stats(),
        queryFn: (): Promise<PurchaseOrderStats> => callTelefunc<PurchaseOrderStats>('onGetPurchaseOrderStats'),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15,
        enabled: browser
    });

    const createPOMutation = createMutation({
        mutationFn: (data: CreatePurchaseOrder) => callTelefunc<PurchaseOrder>('onCreatePurchaseOrder', [data]),
        onSuccess: (newPO: PurchaseOrder) => {
            queryClient.invalidateQueries({ queryKey: keys.lists() });
            queryClient.invalidateQueries({ queryKey: keys.stats() });
            
            queryClient.setQueryData<PaginatedPurchaseOrders>(
                keys.list(filters),
                (oldData) => oldData ? {
                    ...oldData,
                    purchase_orders: [newPO, ...oldData.purchase_orders],
                    pagination: { ...oldData.pagination, total: oldData.pagination.total + 1 }
                } : undefined
            );
        }
    });

    const updatePOMutation = createMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseOrder }) => 
            callTelefunc<PurchaseOrder>('onUpdatePurchaseOrder', [id, data]),
        onSuccess: (updatedPO: PurchaseOrder) => {
            updatePOInLists(queryClient, updatedPO, filters);
            queryClient.invalidateQueries({ queryKey: keys.stats() });
        }
    });

    const approvePOMutation = createMutation({
        mutationFn: (data: ApprovePurchaseOrder) => callTelefunc<PurchaseOrder>('onApprovePurchaseOrder', [data]),
        onSuccess: (updatedPO: PurchaseOrder) => {
            updatePOInLists(queryClient, updatedPO, filters);
            queryClient.invalidateQueries({ queryKey: keys.stats() });
        }
    });

    const receivePOMutation = createMutation({
        mutationFn: (data: ReceiveItems) => callTelefunc<PurchaseOrder>('onReceiveItems', [data]),
        onSuccess: (updatedPO: PurchaseOrder) => {
            updatePOInLists(queryClient, updatedPO, filters);
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: keys.stats() });
        }
    });

    return {
        purchaseOrdersQuery,
        statsQuery,
        createPurchaseOrder: createPOMutation.mutate,
        updatePurchaseOrder: updatePOMutation.mutate,
        approvePurchaseOrder: approvePOMutation.mutate,
        receiveItems: receivePOMutation.mutate,
        createMutation: createPOMutation,
        updateMutation: updatePOMutation,
        approveMutation: approvePOMutation,
        receiveMutation: receivePOMutation,
        refetch: () => queryClient.invalidateQueries({ queryKey: keys.lists() }),
        refetchStats: () => queryClient.invalidateQueries({ queryKey: keys.stats() })
    };
}

export function usePurchaseOrder(poId: string) {
    const queryClient = useQueryClient();

    const query = createQuery({
        queryKey: keys.detail(poId),
        queryFn: () => callTelefunc<PurchaseOrder | null>('onGetPurchaseOrderById', [poId]),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 15,
        enabled: browser && !!poId
    });

    return {
        query,
        refetch: () => queryClient.invalidateQueries({ queryKey: keys.detail(poId) })
    };
}

export function useOptimisticPurchaseOrderUpdate() {
    const queryClient = useQueryClient();

    return {
        updateStatus: (poId: string, newStatus: PurchaseOrder['status']) => {
            const updateListFn = (oldData: PaginatedPurchaseOrders | undefined) => 
                oldData ? {
                    ...oldData,
                    purchase_orders: oldData.purchase_orders.map(po => 
                        po.id === poId ? { ...po, status: newStatus, updated_at: new Date().toISOString() } : po
                    )
                } : oldData;

            const updateDetailFn = (oldData: PurchaseOrder | undefined) => oldData?.id === poId 
                ? { ...oldData, status: newStatus, updated_at: new Date().toISOString() }
                : oldData;

            queryClient.setQueriesData({ queryKey: keys.lists() }, updateListFn);
            queryClient.setQueriesData({ queryKey: keys.details() }, updateDetailFn);
        },

        updateReceivedQuantities: (poId: string, receivedItems: { product_id: string; quantity_received: number }[]) => {
            queryClient.setQueriesData({ queryKey: keys.lists() }, (oldData: PaginatedPurchaseOrders | undefined) => {
                if (!oldData) return oldData;
                
                return {
                    ...oldData,
                    purchase_orders: oldData.purchase_orders.map(po => {
                        if (po.id !== poId) return po;

                        const updatedItems = po.items.map(item => {
                            const receivedItem = receivedItems.find(ri => ri.product_id === item.product_id);
                            return receivedItem ? {
                                ...item,
                                quantity_received: (item.quantity_received || 0) + receivedItem.quantity_received
                            } : item;
                        });

                        return { ...po, items: updatedItems, updated_at: new Date().toISOString() };
                    })
                };
            });
        }
    };
}