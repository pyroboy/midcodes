// product.data.ts
// ---------------
// Svelte-query + Telefunc wrapper for all product-related data fetching
// Aligned with Supabase schema - accounts for database triggers and constraints
// 
// Database Schema Alignment:
// - products table: 29 columns with proper constraints
// - Triggers: update_products_updated_at (handles updated_at automatically)
// - Triggers: check_stock_alerts_trigger (creates alerts on stock changes)
// - RLS: Authenticated users have full access
// - Related tables: categories, suppliers, inventory_items, inventory_alerts

import { derived } from 'svelte/store';
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';

import type {
  Product,
  ProductInput,
  ProductFilters,
  ProductMeta,
  PaginatedProducts,
  BulkProductUpdate,
  StockAdjustment
} from '$lib/types/product.schema';

/* ------------------------------------------------------------------ */
/* 1.  Helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Normalizes `ProductFilters` so the same logical input always produces
 * the same query key (stable serialization, sorted keys/arrays, etc.).
 */
function normalizeFilters(
  filters?: ProductFilters | null
): Record<string, unknown> | null {
  if (!filters || typeof filters !== 'object') return null;

  const normalized: Record<string, unknown> = {};
  const keys = Object.keys(filters).sort();

  for (const key of keys) {
    const value = filters[key as keyof ProductFilters];

    // Keep null, 0, false, '' but drop undefined
    if (value !== undefined) {
      normalized[key] = Array.isArray(value) ? [...value].sort() : value;
    }
  }

  return Object.keys(normalized).length ? normalized : null;
}

/**
 * Thin wrapper around `/api/telefunc` so TanStack Query only sees
 * Promise-returning functions instead of Telefunc-specific shapes.
 */
async function callTelefunc(functionName: string, args: unknown[] = []) {
  const res = await fetch('/api/telefunc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telefuncName: functionName, telefuncArgs: args })
  });

  if (!res.ok) throw new Error(`Telefunc call failed: ${res.statusText}`);
  return (await res.json()).ret;
}

/* ------------------------------------------------------------------ */
/* 2.  Data-fetchers                                                  */
/* ------------------------------------------------------------------ */

async function fetchProducts(filters?: ProductFilters): Promise<PaginatedProducts> {
  console.log('📡 [TELEFUNC] Fetching products with filters:', filters);
  try {
    return await callTelefunc('onGetProducts', filters ? [filters] : []);
  } catch (error) {
    console.error('❌ [TELEFUNC] Product fetch failed:', error);
    // Handle database-specific errors
    if (error instanceof Error) {
      // Check for common Supabase/PostgreSQL errors
      if (error.message.includes('foreign key')) {
        throw new Error('Invalid category or supplier reference');
      }
      if (error.message.includes('unique constraint')) {
        throw new Error('Product SKU already exists');
      }
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* 3.  Query keys (single source of truth)                            */
/* ------------------------------------------------------------------ */

const productQueryKeys = {
  all:   ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list:  (filters?: ProductFilters | null) =>
    [...productQueryKeys.lists(), normalizeFilters(filters)] as const,
  details: () => [...productQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
  meta:   () => [...productQueryKeys.all, 'meta'] as const,
  // Related data that may be affected by product changes
  alerts: () => ['inventory_alerts'] as const,
  inventory: () => ['inventory_items'] as const
};

/* ------------------------------------------------------------------ */
/* 4.  Main hook: useProducts                                         */
/* ------------------------------------------------------------------ */

export function useProducts(filters?: ProductFilters) {
  const queryClient = useQueryClient();

  /* -------------------- Queries -------------------- */

  const productsQuery = createQuery<PaginatedProducts>({
    queryKey: productQueryKeys.list(filters),
    queryFn:  async () => {
      console.log('🔄 [TANSTACK] Starting product query with filters:', filters);
      try {
        const data = await fetchProducts(filters);
        console.log('✅ Product query OK, count:', data.products?.length ?? 0);
        return data;
      } catch (err) {
        console.error('🚨 Product query failed:', err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2,   // 2 min
    gcTime:    1000 * 60 * 10,  // 10 min
    enabled:   browser,
    retry: 3,
    retryDelay: 1000
  });

  const metaQuery = createQuery<ProductMeta>({
    queryKey: productQueryKeys.meta(),
    queryFn:  () => callTelefunc('onGetProductMeta'),
    staleTime: 1000 * 60 * 5,   // 5 min
    gcTime:    1000 * 60 * 15,  // 15 min
    enabled:   browser
  });

  /* -------------------- Mutations -------------------- */

  const createProductMutation = createMutation({
    mutationFn: async (data: ProductInput) => {
      try {
        return await callTelefunc('onCreateProduct', [data]);
      } catch (error) {
        console.error('❌ [MUTATION] Product creation failed:', error);
        // Handle database constraint errors
        if (error instanceof Error) {
          if (error.message.includes('unique constraint') && error.message.includes('sku')) {
            throw new Error('A product with this SKU already exists');
          }
          if (error.message.includes('foreign key') && error.message.includes('category_id')) {
            throw new Error('Invalid category selected');
          }
          if (error.message.includes('foreign key') && error.message.includes('supplier_id')) {
            throw new Error('Invalid supplier selected');
          }
        }
        throw error;
      }
    },
    onSuccess: (newProduct) => {
      // Invalidate related queries - database triggers may have created alerts
      queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.meta() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.alerts() });

      // Optimistic update for immediate UI feedback
      queryClient.setQueryData<PaginatedProducts>(
        productQueryKeys.list(filters),
        (old) => ({
          products: [newProduct, ...(old?.products ?? [])],
          pagination: {
            ...(old?.pagination ?? { page: 1, limit: 20, total_pages: 1, has_more: false }),
            total: (old?.pagination.total ?? 0) + 1
          }
        })
      );
    }
  });

  const updateProductMutation = createMutation({
    mutationFn: async ({ productId, productData }: { productId: string; productData: Partial<ProductInput> }) => {
      try {
        return await callTelefunc('onUpdateProduct', [productId, productData]);
      } catch (error) {
        console.error('❌ [MUTATION] Product update failed:', error);
        // Handle database constraint errors
        if (error instanceof Error) {
          if (error.message.includes('unique constraint') && error.message.includes('sku')) {
            throw new Error('A product with this SKU already exists');
          }
          if (error.message.includes('foreign key')) {
            throw new Error('Invalid category or supplier reference');
          }
        }
        throw error;
      }
    },
    onSuccess: (updated) => {
      updateProductInCache(updated);
      queryClient.invalidateQueries({ queryKey: productQueryKeys.meta() });
      
      // If stock_quantity was updated, check_stock_alerts_trigger may have fired
      // Invalidate alerts to reflect any new alerts created by the trigger
      queryClient.invalidateQueries({ queryKey: productQueryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.inventory() });
    }
  });

  const bulkUpdateMutation = createMutation({
    mutationFn: async (data: BulkProductUpdate) => {
      try {
        return await callTelefunc('onBulkUpdateProducts', [data]);
      } catch (error) {
        console.error('❌ [MUTATION] Bulk product update failed:', error);
        // Handle database constraint errors for bulk operations
        if (error instanceof Error) {
          if (error.message.includes('unique constraint')) {
            throw new Error('One or more products have duplicate SKUs');
          }
          if (error.message.includes('foreign key')) {
            throw new Error('One or more products have invalid category or supplier references');
          }
        }
        throw error;
      }
    },
    onSuccess: (updatedProducts) => {
      updatedProducts.forEach(updateProductInCache);
      queryClient.invalidateQueries({ queryKey: productQueryKeys.meta() });
      // Bulk updates may trigger stock alerts for multiple products
      queryClient.invalidateQueries({ queryKey: productQueryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.inventory() });
    }
  });

  const adjustStockMutation = createMutation({
    mutationFn: async (data: StockAdjustment) => {
      try {
        return await callTelefunc('onAdjustStock', [data]);
      } catch (error) {
        console.error('❌ [MUTATION] Stock adjustment failed:', error);
        // Handle stock adjustment specific errors
        if (error instanceof Error) {
          if (error.message.includes('check constraint')) {
            throw new Error('Invalid stock quantity - cannot be negative');
          }
          if (error.message.includes('not found')) {
            throw new Error('Product not found or has been archived');
          }
        }
        throw error;
      }
    },
    onSuccess: (updatedProduct) => {
      updateProductInCache(updatedProduct);
      // Stock adjustments WILL trigger check_stock_alerts_trigger
      // This is critical for inventory management
      queryClient.invalidateQueries({ queryKey: productQueryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.inventory() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.meta() });
    }
  });

  const deleteProductMutation = createMutation({
    mutationFn: async (id: string) => {
      try {
        return await callTelefunc('onDeleteProduct', [id]);
      } catch (error) {
        console.error('❌ [MUTATION] Product deletion failed:', error);
        // Handle deletion constraint errors
        if (error instanceof Error) {
          if (error.message.includes('foreign key') || error.message.includes('still referenced')) {
            throw new Error('Cannot delete product - it is referenced by orders, inventory, or other records');
          }
          if (error.message.includes('not found')) {
            throw new Error('Product not found or already deleted');
          }
        }
        throw error;
      }
    },
    onSuccess: (_, id) => {
      // Soft delete - update cache to reflect archived status
      queryClient.setQueryData<PaginatedProducts>(
        productQueryKeys.list(filters),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            products: old.products.map((p) =>
              p.id === id ? { ...p, is_archived: true, is_active: false } : p
            ),
            pagination: { ...old.pagination, total: old.pagination.total - 1 }
          };
        }
      );

      queryClient.setQueryData<Product | null>(
        productQueryKeys.detail(id),
        (old) => (old ? { ...old, is_archived: true, is_active: false } : old)
      );

      queryClient.invalidateQueries({ queryKey: productQueryKeys.meta() });
      // Deletion may affect inventory alerts and related data
      queryClient.invalidateQueries({ queryKey: productQueryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: productQueryKeys.inventory() });
    }
  });

  /* -------------------- Utility helpers -------------------- */

  function updateProductInCache(updated: Product) {
    // list caches
    queryClient.setQueriesData<PaginatedProducts>(
      { queryKey: productQueryKeys.lists() },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          products: old.products.map((p) => (p.id === updated.id ? updated : p))
        };
      }
    );

    // detail cache
    queryClient.setQueryData(productQueryKeys.detail(updated.id), updated);
  }

  /* -------------------- Return value -------------------- */

  return {
    // Reactive stores (use $ prefix in components)
    products:     derived(productsQuery, ($q) => $q.data?.products ?? []),
    activeProducts: derived(productsQuery, ($q) =>
      $q.data?.products?.filter((p) => p.is_active) ?? []
    ),
    isLoading:    derived(productsQuery, ($q) => $q.isPending),
    isError:      derived(productsQuery, ($q) => $q.isError),
    error:        derived(productsQuery, ($q) => $q.error),
    meta:         derived(metaQuery, ($q) => $q.data),

    // Raw queries (for advanced usage)
    productsQuery,
    metaQuery,

    // Mutations
    createProduct:   createProductMutation,
    updateProduct:   updateProductMutation,
    bulkUpdate:      bulkUpdateMutation,
    adjustStock:     adjustStockMutation,
    deleteProduct:   deleteProductMutation,

    // Manual refetch helpers
    refetch:     () => queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() }),
    refetchMeta: () => queryClient.invalidateQueries({ queryKey: productQueryKeys.meta() })
  };
}

/* ------------------------------------------------------------------ */
/* 5.  Single-product hook                                            */
/* ------------------------------------------------------------------ */

export function useProduct(productId: string) {
  const queryClient = useQueryClient();

  const productQuery = createQuery<Product | null>({
    queryKey: productQueryKeys.detail(productId),
    queryFn:  () => callTelefunc('onGetProductById', [productId]),
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 15,
    enabled:   browser && !!productId
  });

  return {
    productQuery,
    refetch: () => queryClient.invalidateQueries({ queryKey: productQueryKeys.detail(productId) })
  };
}

/* ------------------------------------------------------------------ */
/* 6.  Optimistic-update helper                                       */
/* ------------------------------------------------------------------ */

export function useOptimisticProductUpdate() {
  const queryClient = useQueryClient();

  return {
    updateProductOptimistic: (id: string, updates: Partial<Product>) => {
      const now = new Date().toISOString();

      queryClient.setQueriesData<PaginatedProducts>(
        { queryKey: productQueryKeys.lists() },
        (old) =>
          old && {
            ...old,
            products: old.products.map((p) =>
              p.id === id ? { ...p, ...updates, updated_at: now } : p
            )
          }
      );

      queryClient.setQueriesData<Product | null>(
        { queryKey: productQueryKeys.details() },
        (old) => (old?.id === id ? { ...old, ...updates, updated_at: now } : old)
      );
    },

    adjustStockOptimistic: (id: string, newQuantity: number) => {
      const now = new Date().toISOString();

      queryClient.setQueriesData<PaginatedProducts>(
        { queryKey: productQueryKeys.lists() },
        (old) =>
          old && {
            ...old,
            products: old.products.map((p) =>
              p.id === id ? { ...p, stock_quantity: newQuantity, updated_at: now } : p
            )
          }
      );

      queryClient.setQueriesData<Product | null>(
        { queryKey: productQueryKeys.details() },
        (old) => (old?.id === id ? { ...old, stock_quantity: newQuantity, updated_at: now } : old)
      );
    }
  };
}