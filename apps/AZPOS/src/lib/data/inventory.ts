import { derived } from 'svelte/store';
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';
import type {
	InventoryItem,
	InventoryItemWithDetails,
	InventoryMovement,
	CreateInventoryMovement,
	InventoryFilters,
	InventoryValuation,
	CreateStockCount,
	InventoryAlert,
	StockCount
} from '$lib/types/inventory.schema';

// Telefunc helper (following TanStack/Telefunc guidelines)
async function callTelefunc<T = unknown>(
	functionName: string,
	args: unknown[] = []
): Promise<T> {
	const res = await fetch('/api/telefunc', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ telefuncName: functionName, telefuncArgs: args })
	});
	if (!res.ok) {
		throw new Error(`Telefunc call failed: ${res.status} ${res.statusText}`);
	}
	const { ret } = await res.json();
	return ret;
}

// Dynamic import wrappers for Telefunc functions (avoids SSR import issues)
const onGetInventoryItems = async (filters?: InventoryFilters): Promise<InventoryItemWithDetails[]> => {
	console.log('🚀 [DATA HOOK] Calling telefunc onGetInventoryItems with filters:', filters);
	const result = await callTelefunc<InventoryItemWithDetails[]>('onGetInventoryItems', [filters]);
	console.log('✅ [DATA HOOK] Telefunc returned', result.length, 'inventory items');
	return result;
};

const onCreateInventoryMovement = async (movementData: CreateInventoryMovement): Promise<InventoryMovement> => {
	return callTelefunc<InventoryMovement>('onCreateInventoryMovement', [movementData]);
};

const onGetInventoryMovements = async (productId?: string, locationId?: string): Promise<InventoryMovement[]> => {
	return callTelefunc<InventoryMovement[]>('onGetInventoryMovements', [productId, locationId]);
};

const onGetInventoryValuation = async (): Promise<InventoryValuation> => {
	return callTelefunc<InventoryValuation>('onGetInventoryValuation');
};

const onCreateStockCount = async (countData: CreateStockCount): Promise<StockCount> => {
	return callTelefunc<StockCount>('onCreateStockCount', [countData]);
};

const onGetInventoryAlerts = async (): Promise<InventoryAlert[]> => {
	return callTelefunc<InventoryAlert[]>('onGetInventoryAlerts');
};

// Query keys for consistent cache management
const inventoryQueryKeys = {
	all: ['inventory'] as const,
	items: () => [...inventoryQueryKeys.all, 'items'] as const,
	itemsList: (filters?: InventoryFilters) => [...inventoryQueryKeys.items(), filters] as const,
	movements: () => [...inventoryQueryKeys.all, 'movements'] as const,
	movementsList: (productId?: string, locationId?: string) =>
		[...inventoryQueryKeys.movements(), productId, locationId] as const,
	valuation: () => [...inventoryQueryKeys.all, 'valuation'] as const,
	alerts: () => [...inventoryQueryKeys.all, 'alerts'] as const,
	counts: () => [...inventoryQueryKeys.all, 'counts'] as const
};

export function useInventory(filters?: InventoryFilters) {
	const queryClient = useQueryClient();

// Query to fetch inventory items with filters
const inventoryQuery = createQuery<InventoryItemWithDetails[]>({
	queryKey: inventoryQueryKeys.itemsList(filters),
	queryFn: () => {
		console.log('🔄 [TANSTACK QUERY] Starting inventory items query with filters:', filters);
		try {
			const result = onGetInventoryItems(filters);
			console.log('✅ [TANSTACK QUERY] Inventory items query successful, count:', result.then((res) => res.entries.length) || 0);
			return result;
		} catch (error) {
			console.error('❌ [TANSTACK QUERY] Inventory items query failed:', error);
			throw error;
		}
	},
	staleTime: 1000 * 60 * 2, // 2 minutes where data is considered fresh
	gcTime: 1000 * 60 * 10, // 10 minutes before garbage collection
	enabled: browser // Only run on client-side
});

	// Query to fetch inventory valuation
	const valuationQuery = createQuery<InventoryValuation>({
		queryKey: inventoryQueryKeys.valuation(),
		queryFn: onGetInventoryValuation,
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 15, // 15 minutes
		enabled: browser // Only run on client-side
	});

	// Query to fetch inventory alerts
	const alertsQuery = createQuery<InventoryAlert[]>({
		queryKey: inventoryQueryKeys.alerts(),
		queryFn: onGetInventoryAlerts,
		staleTime: 1000 * 60 * 1, // 1 minute - alerts should be fresh
		gcTime: 1000 * 60 * 5, // 5 minutes
		enabled: browser // Only run on client-side
	});

	// Mutation to create inventory movement
	const createMovementMutation = createMutation({
		mutationFn: (movementData: CreateInventoryMovement) => onCreateInventoryMovement(movementData),
		onSuccess: (newMovement) => {
			// Invalidate and refetch inventory items
			queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.items() });
			queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.valuation() });
			queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.alerts() });

			// Invalidate movements for this product
			queryClient.invalidateQueries({
				queryKey: inventoryQueryKeys.movementsList(newMovement.product_id, newMovement.location_id)
			});
		},
		onError: (error) => {
			console.error('Failed to create inventory movement:', error);
		}
	});

	// Mutation to create stock count
	const createStockCountMutation = createMutation({
		mutationFn: (countData: CreateStockCount) => onCreateStockCount(countData),
		onSuccess: () => {
			// Invalidate all inventory-related queries
			queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.items() });
			queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.valuation() });
			queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.alerts() });
			queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.movements() });
			queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.counts() });
		},
		onError: (error) => {
			console.error('Failed to create stock count:', error);
		}
	});

	// Derived stores (following TanStack/Telefunc guidelines)
	const inventoryItems = derived(inventoryQuery, ($q) => $q.data ?? []);
	const valuation = derived(valuationQuery, ($q) => $q.data);
	const alerts = derived(alertsQuery, ($q) => $q.data ?? []);
	const isLoading = derived(inventoryQuery, ($q) => $q.isPending);
	const isError = derived(inventoryQuery, ($q) => $q.isError);
	const error = derived(inventoryQuery, ($q) => $q.error);

	return {
		// Svelte stores (access with $ prefix in components)
		inventoryItems,
		valuation,
		alerts,
		isLoading,
		isError,
		error,

		// Raw query objects (for advanced use cases)
		inventoryQuery,
		valuationQuery,
		alertsQuery,

		// Mutations
		createMovement: createMovementMutation.mutate,
		createStockCount: createStockCountMutation.mutate,

		// Mutation state getters
		isCreatingMovement: () => createMovementMutation.isPending,
		isCreatingStockCount: () => createStockCountMutation.isPending,

		createMovementError: () => createMovementMutation.error,
		createStockCountError: () => createStockCountMutation.error,

		// Utility functions
		refetch: () => queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.items() }),
		refetchValuation: () =>
			queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.valuation() }),
		refetchAlerts: () => queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.alerts() })
	};
}

// Hook for fetching inventory movements/history
export function useInventoryMovements(productId?: string, locationId?: string) {
	const queryClient = useQueryClient();

	const movementsQuery = createQuery<InventoryMovement[]>({
		queryKey: inventoryQueryKeys.movementsList(productId, locationId),
		queryFn: () => onGetInventoryMovements(productId, locationId),
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 15, // 15 minutes
		enabled: browser && !!(productId || locationId) // Only run on client-side and if we have filters
	});

	const getMovements = () => movementsQuery.data ?? [];
	const getIsLoading = () => movementsQuery.isPending;
	const getIsError = () => movementsQuery.isError;
	const getError = () => movementsQuery.error;

	return {
		movementsQuery,
		movements: getMovements,
		isLoading: getIsLoading,
		isError: getIsError,
		error: getError,
		refetch: () =>
			queryClient.invalidateQueries({
				queryKey: inventoryQueryKeys.movementsList(productId, locationId)
			})
	};
}

// Hook for optimistic inventory updates
export function useOptimisticInventoryUpdate() {
	const queryClient = useQueryClient();

	return {
		// Optimistically update inventory quantity in cache before server response
		updateQuantityOptimistic: (
			productId: string,
			locationId: string | undefined,
			newQuantity: number
		) => {
			// Update inventory items cache
			queryClient.setQueriesData<InventoryItem[]>(
				{ queryKey: inventoryQueryKeys.items() },
				(oldData) =>
					oldData?.map((item) =>
						item.product_id === productId && item.location_id === locationId
							? {
									...item,
									quantity_available: newQuantity,
									quantity_on_hand: newQuantity,
									last_movement_at: new Date().toISOString(),
									updated_at: new Date().toISOString()
								}
							: item
					) || []
			);
		},

		// Optimistically add movement to history
		addMovementOptimistic: (movement: Omit<InventoryMovement, 'id' | 'created_at'>) => {
			const optimisticMovement: InventoryMovement = {
				...movement,
				id: `temp-${Date.now()}`,
				created_at: new Date().toISOString()
			};

			queryClient.setQueriesData<InventoryMovement[]>(
				{ queryKey: inventoryQueryKeys.movementsList(movement.product_id, movement.location_id) },
				(oldData) => (oldData ? [optimisticMovement, ...oldData] : [optimisticMovement])
			);
		}
	};
}
