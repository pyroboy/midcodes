import { derived } from 'svelte/store';
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';
import type {
	Category,
	CategoryTree,
	CategoryFilters,
	CategoryInput,
	CategoryStats,
	MoveCategory
} from '$lib/types/category.schema';

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

// Query keys for consistent cache management
const categoryQueryKeys = {
	all: ['categories'] as const,
	lists: () => [...categoryQueryKeys.all, 'list'] as const,
	list: (filters?: CategoryFilters) => [...categoryQueryKeys.lists(), filters] as const,
	tree: () => [...categoryQueryKeys.all, 'tree'] as const,
	stats: () => [...categoryQueryKeys.all, 'stats'] as const
};

export function useCategories(filters?: CategoryFilters) {
	const queryClient = useQueryClient();

	// Query to fetch categories with filters
	const categoriesQuery = createQuery<Category[]>({
		queryKey: categoryQueryKeys.list(filters),
		queryFn: () => callTelefunc<Category[]>('onGetCategories', [filters]),
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 15, // 15 minutes
		enabled: browser
	});

	// Query to fetch category tree
	const treeQuery = createQuery<CategoryTree[]>({
		queryKey: categoryQueryKeys.tree(),
		queryFn: () => callTelefunc<CategoryTree[]>('onGetCategoryTree', []),
		staleTime: 1000 * 60 * 10, // 10 minutes
		gcTime: 1000 * 60 * 30, // 30 minutes
		enabled: browser
	});

	// Query to fetch category stats
	const statsQuery = createQuery<CategoryStats>({
		queryKey: categoryQueryKeys.stats(),
		queryFn: () => callTelefunc<CategoryStats>('onGetCategoryStats', []),
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 15, // 15 minutes
		enabled: browser
	});

	// Mutation to create a new category
	const createCategoryMutation = createMutation({
		mutationFn: (categoryData: CategoryInput) => callTelefunc<Category>('onCreateCategory', [categoryData]),
		onSuccess: (newCategory) => {
			// Invalidate and refetch categories
			queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() });
			queryClient.invalidateQueries({ queryKey: categoryQueryKeys.tree() });
			queryClient.invalidateQueries({ queryKey: categoryQueryKeys.stats() });

			// Optimistically add the new category to cache
			queryClient.setQueryData<Category[]>(categoryQueryKeys.list(filters), (oldData) =>
				oldData ? [newCategory, ...oldData] : [newCategory]
			);
		},
		onError: (error) => {
			console.error('Failed to create category:', error);
		}
	});

	// Mutation to update a category
	const updateCategoryMutation = createMutation({
		mutationFn: ({ categoryId, categoryData }: { categoryId: string; categoryData: Partial<CategoryInput> }) =>
			callTelefunc<Category>('onUpdateCategory', [categoryId, categoryData]),
		onSuccess: (updatedCategory) => {
			// Update the specific category in all relevant queries
			queryClient.setQueryData<Category[]>(
				categoryQueryKeys.list(filters),
				(oldData) =>
					oldData?.map((category) =>
						category.id === updatedCategory.id ? updatedCategory : category
					) || []
			);

			// Invalidate tree and stats for fresh calculations
			queryClient.invalidateQueries({ queryKey: categoryQueryKeys.tree() });
			queryClient.invalidateQueries({ queryKey: categoryQueryKeys.stats() });
		},
		onError: (error) => {
			console.error('Failed to update category:', error);
		}
	});

	// Mutation to move a category
	const moveCategoryMutation = createMutation({
		mutationFn: (moveData: MoveCategory) => callTelefunc<Category>('onMoveCategory', [moveData]),
		onSuccess: () => {
			// Moving changes hierarchy, so invalidate all cached data
			queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
		},
		onError: (error) => {
			console.error('Failed to move category:', error);
		}
	});

	// Derived reactive stores (following code patterns)
	const categories = derived(categoriesQuery, ($q) => $q.data ?? []);
	const categoryTree = derived(treeQuery, ($q) => $q.data ?? []);
	const stats = derived(statsQuery, ($q) => $q.data);

	// Derived filtered states
	const activeCategories = derived(categories, ($categories) => $categories.filter((c: Category) => c.is_active));
	const rootCategories = derived(categories, ($categories) => $categories.filter((c: Category) => !c.parent_id));
	const categoriesWithProducts = derived(categories, ($categories) => $categories.filter((c: Category) => c.product_count > 0));

	// Create category map for quick lookups
	const categoryMap = derived(categories, ($categories) => Object.fromEntries($categories.map((c: Category) => [c.id, c])));
	const categoryNameMap = derived(categories, ($categories) => 
		Object.fromEntries($categories.map((c: Category) => [c.id, c.name]))
	);

	// Loading and error states
	const isLoading = derived(categoriesQuery, ($q) => $q.isPending);
	const isError = derived(categoriesQuery, ($q) => $q.isError);
	const error = derived(categoriesQuery, ($q) => $q.error);

	const isTreeLoading = derived(treeQuery, ($q) => $q.isPending);
	const isStatsLoading = derived(statsQuery, ($q) => $q.isPending);

	// Mutation states
	const isCreating = derived(createCategoryMutation, ($m) => $m.isPending);
	const isUpdating = derived(updateCategoryMutation, ($m) => $m.isPending);
	const isMoving = derived(moveCategoryMutation, ($m) => $m.isPending);

	const createError = derived(createCategoryMutation, ($m) => $m.error);
	const updateError = derived(updateCategoryMutation, ($m) => $m.error);
	const moveError = derived(moveCategoryMutation, ($m) => $m.error);

	return {
		// Queries
		categoriesQuery,
		treeQuery,
		statsQuery,

		// Reactive data
		get categories() { return categories; },
		get categoryTree() { return categoryTree; },
		get stats() { return stats; },

		// Filtered data
		get activeCategories() { return activeCategories; },
		get rootCategories() { return rootCategories; },
		get categoriesWithProducts() { return categoriesWithProducts; },

		// Utility maps
		get categoryMap() { return categoryMap; },
		get categoryNameMap() { return categoryNameMap; },

		// Loading states
		get isLoading() { return isLoading; },
		get isError() { return isError; },
		get error() { return error; },
		get isTreeLoading() { return isTreeLoading; },
		get isStatsLoading() { return isStatsLoading; },

		// Mutations
		createCategory: createCategoryMutation.mutate,
		updateCategory: updateCategoryMutation.mutate,
		moveCategory: updateCategoryMutation.mutate,

		// Mutation states
		get isCreating() { return isCreating; },
		get isUpdating() { return isUpdating; },
		get isMoving() { return isMoving; },

		get createError() { return createError; },
		get updateError() { return updateError; },
		get moveError() { return moveError; },

		// Utility functions
		refetch: () => queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() }),
		refetchTree: () => queryClient.invalidateQueries({ queryKey: categoryQueryKeys.tree() }),
		refetchStats: () => queryClient.invalidateQueries({ queryKey: categoryQueryKeys.stats() }),

		// Helper functions
		getCategoryById: (id: string) => categoryMap[id],
		getCategoryNameById: (id: string) => categoryNameMap[id] || 'Unknown Category'
	};
}

// Hook for optimistic category updates
export function useOptimisticCategoryUpdate() {
	const queryClient = useQueryClient();

	return {
		// Optimistically update category in cache before server response
		updateCategoryOptimistic: (categoryId: string, updates: Partial<Category>) => {
			// Update all relevant queries optimistically
			queryClient.setQueriesData<Category[]>(
				{ queryKey: categoryQueryKeys.lists() },
				(oldData) =>
					oldData?.map((category) =>
						category.id === categoryId
							? { ...category, ...updates, updated_at: new Date().toISOString() }
							: category
					) || []
			);
		}
	};
}
