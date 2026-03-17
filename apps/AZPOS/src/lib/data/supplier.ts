import { derived } from 'svelte/store';
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';

// Telefunc helper - must throw on non-2xx responses
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

import type {
	Supplier,
	SupplierInput,
	SupplierFilters,
	PaginatedSuppliers,
	SupplierStats,
	SupplierPerformance,
	SupplierProduct
} from '$lib/types/supplier.schema';

// Query keys for consistent cache management
const supplierQueryKeys = {
	all: ['suppliers'] as const,
	lists: () => [...supplierQueryKeys.all, 'list'] as const,
	list: (filters?: SupplierFilters) => [...supplierQueryKeys.lists(), filters] as const,
	details: () => [...supplierQueryKeys.all, 'detail'] as const,
	detail: (id: string) => [...supplierQueryKeys.details(), id] as const,
	stats: () => [...supplierQueryKeys.all, 'stats'] as const,
	performance: (id: string, period: string) =>
		[...supplierQueryKeys.all, 'performance', id, period] as const,
	products: (id: string) => [...supplierQueryKeys.all, 'products', id] as const
};

export function useSuppliers(filters?: SupplierFilters) {
	const queryClient = useQueryClient();

	// Query to fetch paginated suppliers with filters
	const suppliersQuery = createQuery<PaginatedSuppliers>({
		queryKey: supplierQueryKeys.list(filters),
		queryFn: () => callTelefunc('onGetSuppliers', [filters]),
		staleTime: 1000 * 60 * 2, // 2 minutes
		gcTime: 1000 * 60 * 10 // 10 minutes
	});

	// Query to fetch supplier statistics
	const statsQuery = createQuery<SupplierStats>({
		queryKey: supplierQueryKeys.stats(),
		queryFn: () => callTelefunc('onGetSupplierStats', []),
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 15 // 15 minutes
	});

	// Mutation to create a new supplier
	const createSupplierMutation = createMutation({
		mutationFn: (supplierData: SupplierInput) => callTelefunc<Supplier>('onCreateSupplier', [supplierData]),
		onSuccess: (newSupplier) => {
			// Invalidate and refetch suppliers list
			queryClient.invalidateQueries({ queryKey: supplierQueryKeys.lists() });
			queryClient.invalidateQueries({ queryKey: supplierQueryKeys.stats() });

			// Optimistically add the new supplier to cache
			queryClient.setQueryData<PaginatedSuppliers>(supplierQueryKeys.list(filters), (oldData) => {
				if (!oldData)
					return {
						suppliers: [newSupplier],
						pagination: { page: 1, limit: 20, total: 1, total_pages: 1, has_more: false }
					};
				return {
					...oldData,
					suppliers: [newSupplier, ...oldData.suppliers],
					pagination: {
						...oldData.pagination,
						total: oldData.pagination.total + 1
					}
				};
			});
		},
		onError: (error) => {
			console.error('Failed to create supplier:', error);
		}
	});

	// Mutation to update a supplier
	const updateSupplierMutation = createMutation({
		mutationFn: ({
			supplierId,
			supplierData
		}: {
			supplierId: string;
			supplierData: Partial<SupplierInput>;
		}) => callTelefunc<Supplier>('onUpdateSupplier', [supplierId, supplierData]),
		onSuccess: (updatedSupplier) => {
			// Update the specific supplier in all relevant queries
			queryClient.setQueryData<PaginatedSuppliers>(supplierQueryKeys.list(filters), (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					suppliers: oldData.suppliers.map((supplier) =>
						supplier.id === updatedSupplier.id ? updatedSupplier : supplier
					)
				};
			});

			// Update detail cache if it exists
			queryClient.setQueryData(supplierQueryKeys.detail(updatedSupplier.id), updatedSupplier);

			// Invalidate stats to get fresh calculations
			queryClient.invalidateQueries({ queryKey: supplierQueryKeys.stats() });
		},
		onError: (error) => {
			console.error('Failed to update supplier:', error);
		}
	});

	// Mutation to delete a supplier
	const deleteSupplierMutation = createMutation({
		mutationFn: (supplierId: string) => callTelefunc<void>('onDeleteSupplier', [supplierId]),
		onSuccess: (_, supplierId) => {
			// Update supplier to inactive in cache
			queryClient.setQueryData<PaginatedSuppliers>(supplierQueryKeys.list(filters), (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					suppliers: oldData.suppliers.map((supplier) =>
						supplier.id === supplierId ? { ...supplier, is_active: false } : supplier
					)
				};
			});

			// Update detail cache to show inactive status
			queryClient.setQueryData<Supplier>(supplierQueryKeys.detail(supplierId), (oldData) =>
				oldData ? { ...oldData, is_active: false } : oldData
			);

			// Invalidate stats
			queryClient.invalidateQueries({ queryKey: supplierQueryKeys.stats() });
		},
		onError: (error) => {
			console.error('Failed to delete supplier:', error);
		}
	});

	// Derived reactive stores (following code patterns)
	const suppliers = derived(suppliersQuery, ($q) => $q.data?.suppliers ?? []);
	const pagination = derived(suppliersQuery, ($q) => $q.data?.pagination);
	const stats = derived(statsQuery, ($q) => $q.data);

	// Derived filtered states
	const activeSuppliers = derived(suppliers, ($suppliers) => $suppliers.filter((s: Supplier) => s.is_active));
	const inactiveSuppliers = derived(suppliers, ($suppliers) => $suppliers.filter((s: Supplier) => !s.is_active));
	const suppliersWithProducts = derived(suppliers, ($suppliers) => 
		$suppliers.filter(() => {
			// This would need to be enhanced with actual product count data
			return true; // Placeholder
		})
	);

	// Loading and error states
	const isLoading = derived(suppliersQuery, ($q) => $q.isPending);
	const isError = derived(suppliersQuery, ($q) => $q.isError);
	const error = derived(suppliersQuery, ($q) => $q.error);

	const isStatsLoading = derived(statsQuery, ($q) => $q.isPending);
	const isStatsError = derived(statsQuery, ($q) => $q.isError);

	// Mutation loading states
	const isCreating = derived(createSupplierMutation, ($m) => $m.isPending);
	const isUpdating = derived(updateSupplierMutation, ($m) => $m.isPending);
	const isDeleting = derived(deleteSupplierMutation, ($m) => $m.isPending);

	// Mutation error states
	const createError = derived(createSupplierMutation, ($m) => $m.error);
	const updateError = derived(updateSupplierMutation, ($m) => $m.error);
	const deleteError = derived(deleteSupplierMutation, ($m) => $m.error);

	return {
		// Queries
		suppliersQuery,
		statsQuery,

		// Reactive data
		get suppliers() { return suppliers; },
		get pagination() { return pagination; },
		get stats() { return stats; },

		// Filtered data
		get activeSuppliers() { return activeSuppliers; },
		get inactiveSuppliers() { return inactiveSuppliers; },
		get suppliersWithProducts() { return suppliersWithProducts; },

		// Loading states
		get isLoading() { return isLoading; },
		get isError() { return isError; },
		get error() { return error; },
		get isStatsLoading() { return isStatsLoading; },
		get isStatsError() { return isStatsError; },

		// Mutations
		createSupplier: createSupplierMutation.mutate,
		updateSupplier: updateSupplierMutation.mutate,
		deleteSupplier: deleteSupplierMutation.mutate,

		// Mutation states
		get isCreating() { return isCreating; },
		get isUpdating() { return isUpdating; },
		get isDeleting() { return isDeleting; },

		// Mutation errors
		get createError() { return createError; },
		get updateError() { return updateError; },
		get deleteError() { return deleteError; },

		// Utility functions
		refetch: () => queryClient.invalidateQueries({ queryKey: supplierQueryKeys.lists() }),
		refetchStats: () => queryClient.invalidateQueries({ queryKey: supplierQueryKeys.stats() })
	};
}

// Hook for fetching a single supplier by ID
export function useSupplier(supplierId: string) {
	const queryClient = useQueryClient();

	const supplierQuery = createQuery<Supplier | null>({
		queryKey: supplierQueryKeys.detail(supplierId),
		queryFn: () => callTelefunc<Supplier | null>('onGetSupplierById', [supplierId]),
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 15, // 15 minutes
		enabled: !!supplierId
	});

	const supplier = derived(supplierQuery, ($q) => $q.data);
	const isLoading = derived(supplierQuery, ($q) => $q.isPending);
	const isError = derived(supplierQuery, ($q) => $q.isError);
	const error = derived(supplierQuery, ($q) => $q.error);

	return {
		supplierQuery,
		get supplier() { return supplier; },
		get isLoading() { return isLoading; },
		get isError() { return isError; },
		get error() { return error; },
		refetch: () => queryClient.invalidateQueries({ queryKey: supplierQueryKeys.detail(supplierId) })
	};
}

// Hook for fetching supplier performance metrics
export function useSupplierPerformance(supplierId: string, period: 'month' | 'quarter' | 'year') {
	const queryClient = useQueryClient();

	const performanceQuery = createQuery<SupplierPerformance>({
		queryKey: supplierQueryKeys.performance(supplierId, period),
		queryFn: () => callTelefunc<SupplierPerformance>('onGetSupplierPerformance', [supplierId, period]),
		staleTime: 1000 * 60 * 10, // 10 minutes
		gcTime: 1000 * 60 * 30, // 30 minutes
		enabled: !!supplierId
	});

	const performance = derived(performanceQuery, ($q) => $q.data);
	const isLoading = derived(performanceQuery, ($q) => $q.isPending);
	const isError = derived(performanceQuery, ($q) => $q.isError);
	const error = derived(performanceQuery, ($q) => $q.error);

	return {
		performanceQuery,
		get performance() { return performance; },
		get isLoading() { return isLoading; },
		get isError() { return isError; },
		get error() { return error; },
		refetch: () =>
			queryClient.invalidateQueries({
				queryKey: supplierQueryKeys.performance(supplierId, period)
			})
	};
}

// Hook for fetching supplier products
export function useSupplierProducts(supplierId: string) {
	const queryClient = useQueryClient();

	const productsQuery = createQuery<SupplierProduct[]>({
		queryKey: supplierQueryKeys.products(supplierId),
		queryFn: () => callTelefunc<SupplierProduct[]>('onGetSupplierProducts', [supplierId]),
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 15, // 15 minutes
		enabled: !!supplierId
	});

	const products = derived(productsQuery, ($q) => $q.data ?? []);
	const isLoading = derived(productsQuery, ($q) => $q.isPending);
	const isError = derived(productsQuery, ($q) => $q.isError);
	const error = derived(productsQuery, ($q) => $q.error);

	return {
		productsQuery,
		get products() { return products; },
		get isLoading() { return isLoading; },
		get isError() { return isError; },
		get error() { return error; },
		refetch: () =>
			queryClient.invalidateQueries({ queryKey: supplierQueryKeys.products(supplierId) })
	};
}

// Hook for optimistic supplier updates
export function useOptimisticSupplierUpdate() {
	const queryClient = useQueryClient();

	return {
		// Optimistically update supplier in cache before server response
		updateSupplierOptimistic: (supplierId: string, updates: Partial<Supplier>) => {
			// Update all relevant queries optimistically
			queryClient.setQueriesData<PaginatedSuppliers>(
				{ queryKey: supplierQueryKeys.lists() },
				(oldData) => {
					if (!oldData) return oldData;
					return {
						...oldData,
						suppliers: oldData.suppliers.map((supplier) =>
							supplier.id === supplierId
								? { ...supplier, ...updates, updated_at: new Date().toISOString() }
								: supplier
						)
					};
				}
			);

			// Update detail cache if it exists
			queryClient.setQueriesData<Supplier>({ queryKey: supplierQueryKeys.detail(supplierId) }, (oldData) =>
				oldData?.id === supplierId
					? { ...oldData, ...updates, updated_at: new Date().toISOString() }
					: oldData
			);
		},

		// Optimistically toggle supplier active status
		toggleActiveOptimistic: (supplierId: string, isActive: boolean) => {
			queryClient.setQueriesData<PaginatedSuppliers>(
				{ queryKey: supplierQueryKeys.lists() },
				(oldData) => {
					if (!oldData) return oldData;
					return {
						...oldData,
						suppliers: oldData.suppliers.map((supplier) =>
							supplier.id === supplierId
								? { ...supplier, is_active: isActive, updated_at: new Date().toISOString() }
								: supplier
						)
					};
				}
			);
		}
	};
}
