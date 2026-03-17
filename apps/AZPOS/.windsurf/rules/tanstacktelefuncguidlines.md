---
trigger: always_on
---

### **SvelteKit Architecture: A Server-Centric Data Layer Guide**

This guide provides the canonical instructions for building a modern, scalable, and type-safe data layer in SvelteKit applications. The architecture establishes the server as the single source of truth, using a clear pattern for server functions, data-access hooks, and component consumption.

-----

### **The Stack**

  * **SvelteKit 5**: The core application framework.
  * **TanStack Query**: Manages server state on the client (caching, refetching, mutations).
  * **Telefunc**: Creates a zero-API, type-safe bridge between client and server.
  * **Zod**: Defines data schemas for validation and type inference.
  * **Supabase**: The backend, providing the database, authentication, and Role-Based Access Control (RBAC) via Row Level Security (RLS).

-----

### **1. Core Principles**

This architecture is built on a few key ideas:

  * **Server is the Single Source of Truth**: Your Supabase database holds the real state. The client is a reactive view into that state.
  * **Clear Separation of Concerns**:
      * **UI Components (`.svelte`)**: Only responsible for displaying data and managing local UI state using Svelte 5 Runes.
      * **Data Access Layer (`/lib/data`)**: Manages *how* and *when* to fetch server data using TanStack Query. It exposes this data to components via classic Svelte stores (`derived`). **Svelte 5 Runes are forbidden in this layer.**
      * **Server API (`/lib/server/telefuncs`)**: Contains the actual business logic and database operations, fully secured on the server.
  * **End-to-End Type Safety**: Zod schemas defined once are used for database validation, API contracts, and client-side type-checking.
  * **Secure by Default**: All sensitive logic and data access rules (RBAC) live on the server, inaccessible from the client's browser.

-----

### **2. Directory & File Conventions**

This structure organizes your application for clarity and scalability.

#### **Folder Layout**

```
src/
├── lib/
│ ├── components/       # Dumb UI components
│ │
│ ├── data/             # CLIENT: Data-access hooks (TanStack Query + Svelte Stores)
│ │ ├── product.ts
│ │ └── user.ts
│ │
│ ├── server/           # SERVER-ONLY CODE
│ │ ├── db.ts           # Supabase client instance
│ │ └── telefuncs/      # SERVER: Business logic & DB operations
│ │     ├── product.telefunc.ts
│ │     └── user.telefunc.ts
│ │
│ └── types/            # SHARED: Zod schemas and TypeScript types
│     ├── product.schema.ts
│     └── user.schema.ts
│
├── routes/
│ ├── products/
│ │ ├── +page.svelte    # Consumes `useProducts()` from /data/product.ts
│ │ └── +page.ts        # (Optional) For prefetching data via SSR
│ └── ...
│
└── app.d.ts
```

#### **Convention Rules**

| Layer | Directory Pattern | File Pattern | Allowed Extensions |
| :--- | :--- | :--- | :--- |
| Server Telefuncs | `src/lib/server/telefuncs/` | `[feature].telefunc.ts` | `.ts` only |
| Data-layer hooks | `src/lib/data/` | `[feature].ts` | `.ts` only (NOT `.svelte.ts`) |
| Zod / Type schemas | `src/lib/types/` | `[feature].schema.ts` | `.ts` only |
| Components / Pages | `src/lib/components/…` & `src/routes/…` | `*.svelte` | `.svelte` only |

-----

### **3. The Implementation Playbook**

Let's build a `product` feature following these rules step-by-step.

#### **Step 1: Define the Schema (The "What")**

Create the single source of truth for your product data's shape and validation rules.

  * **File**: `src/lib/types/product.schema.ts`
  * **Action**: Use Zod to define schemas. Infer TypeScript types from them.

<!-- end list -->

```typescript
// src/lib/types/product.schema.ts
import { z } from 'zod';

// Schema for filtering products
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional()
});

// Full product schema matching the database
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number().positive()
  // ... other fields
});

// Schema for paginated API responses
export const paginatedProductsSchema = z.object({
  products: z.array(productSchema),
  total: z.number()
});

// Export the inferred types
export type Product = z.infer<typeof productSchema>;
export type ProductFilters = z.infer<typeof productFiltersSchema>;
export type PaginatedProducts = z.infer<typeof paginatedProductsSchema>;
```

#### **Step 2: Implement the Server Telefunc (The "How")**

Write the secure, server-side function to fetch data.

  * **File**: `src/lib/server/telefuncs/product.telefunc.ts`
  * **Rules**:
    1.  Export functions prefixed with `on`.
    2.  Validate inputs with the Zod schema.
    3.  Use `getContext()` for authentication and authorization.
    4.  Return plain, strongly-typed data.

<!-- end list -->

```typescript
// src/lib/server/telefuncs/product.telefunc.ts
import { getContext } from 'telefunc';
import { createSupabaseClient } from '$lib/server/db';
import { productFiltersSchema, type PaginatedProducts, type ProductFilters } from '$lib/types/product.schema';

export async function onGetProducts(filters?: ProductFilters): Promise<PaginatedProducts> {
  const { user } = getContext();
  if (!user) throw new Error('Not authenticated');

  // Validate input from the client
  const validatedFilters = productFiltersSchema.parse(filters || {});

  const supabase = createSupabaseClient();
  // ... business logic & DB calls using validatedFilters ...
  // RLS in Supabase automatically ensures the user can only see products they have access to.

  const data = { products: [], total: 0 }; // Placeholder for DB result
  return data;
}
```

#### **Step 3: Create the Data Layer Hook (The "Where")**

This file provides the client-side mechanism to access server state. It bridges Telefunc and the UI.

  * **File**: `src/lib/data/product.ts`
  * **Rules**:
    1.  Use `createQuery` and `createMutation` from TanStack Query.
    2.  **Do not** use Svelte 5 Runes (`$state`, `$derived`).
    3.  Return classic **Svelte stores** created with `derived` from `'svelte/store'`.
    4.  Export hooks named `use[Feature]`.

First, define this mandatory `callTelefunc` helper. It makes the communication explicit.

```typescript
// Place this helper in the file or a shared util
async function callTelefunc<T = unknown>(functionName: string, args: any[] = []): Promise<T> {
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
```

Now, create the hook itself.

```typescript
// src/lib/data/product.ts
import { derived } from 'svelte/store';
import { createQuery } from '@tanstack/svelte-query';
import type { Product, ProductFilters, PaginatedProducts } from '$lib/types/product.schema';

// 1. Stable query key factory for cache management
const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...productQueryKeys.lists(), filters] as const
};

// 2. The data-access hook
export function useProducts(filters?: ProductFilters) {
  const productsQuery = createQuery<PaginatedProducts>({
    queryKey: productQueryKeys.list(filters),
    queryFn: () => callTelefunc<PaginatedProducts>('onGetProducts', [filters]),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // 3. Create and return derived Svelte stores (NO SVELTE 5 RUNES HERE)
  const products = derived(productsQuery, ($q) => $q.data?.products ?? []);
  const isLoading = derived(productsQuery, ($q) => $q.isPending);
  const isError = derived(productsQuery, ($q) => $q.isError);
  const error = derived(productsQuery, ($q) => $q.error);

  return { products, isLoading, isError, error };
}
```

#### **Step 4: Consume in Components (The "View")**

Finally, use your hook in a Svelte component. This is the only layer where Svelte 5 Runes are used for local UI state.

  * **File**: `src/routes/products/+page.svelte`
  * **Action**: Import the hook, get the stores, and use the `$` prefix to access their values.

<!-- end list -->

```svelte
<script lang="ts">
  import { useProducts } from '$lib/data/product';

  // Local UI state is managed with Svelte 5 Runes.
  let searchTerm = $state('');

  // The hook returns Svelte stores, NOT runes.
  const { products, isLoading, isError } = useProducts({ search: searchTerm });

  // Component-level derived state is great here.
  const productCount = $derived($products.length);
</script>

<h1>Products</h1>
<input type="search" placeholder="Filter products..." bind:value={searchTerm} />

{#if $isLoading}
  <p>Loading products...</p>
{:else if $isError}
  <p style="color: red;">An error occurred.</p>
{:else}
  <p>Showing {productCount} products.</p>
  <ul>
    {#each $products as product (product.id)}
      <li>{product.name} - ${product.price}</li>
    {/each}
  </ul>
{/if}
```

#### **Step 5: (Optional) Prefetch Data for SSR**

To ensure data is available on the initial server-side render, prefetch it in a `+page.ts` or `+layout.ts` file.

  * **File**: `src/routes/products/+page.ts`
  * **Action**: Import `prefetchQuery` and call it in the `load` function.

<!-- end list -->

```typescript
// src/routes/products/+page.ts
import type { PageLoad } from './$types';
import { QueryClient } from '@tanstack/svelte-query';
import { useProducts } from '$lib/data/product'; // The hook defines the query

export const load: PageLoad = async () => {
  const queryClient = new QueryClient();
  const initialFilters = { search: '' }; // Define initial state for SSR

  await queryClient.prefetchQuery(
    // Get the query options from the hook by calling it
    useProducts(initialFilters).productsQuery.options
  );

  return {
    // Return the dehydrated state to the client
    dehydratedState: dehydrate(queryClient),
  };
};
```

*Note: You would need to setup `HydrationBoundary` in your root layout to consume the `dehydratedState`.*