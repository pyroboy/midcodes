---
description: ## 1. Purpose   This document gives the **only** canonical instructions for:   • Server-side Telefunc functions   • Client-side data-layer hooks (TanStack Query + Svelte stores)   • The `callTelefunc` communication helper 
---



## 1. Purpose  
This document gives the **only** canonical instructions for:  
• Server-side Telefunc functions  
• Client-side data-layer hooks (TanStack Query + Svelte stores)  
• The `callTelefunc` communication helper  

---

## 2. Directory & File Conventions

| Layer              | Directory pattern                         | File pattern            | Allowed extensions              |
| ------------------ | ----------------------------------------- | ----------------------- | ------------------------------- |
| Server Telefuncs   | `src/lib/server/telefuncs/`               | `[feature].telefunc.ts` | `.ts` only                      |
| Data-layer hooks   | `src/lib/data/`                           | `[feature].ts`          | `.ts` only !!!! NOT `svelte.ts` |
| Zod / Type schemas | `src/lib/types/`                          | `[feature].schema.ts`   | `.ts` only                      |
| Components / Pages | `src/lib/components/…`  &  `src/routes/…` | `*.svelte`              | `.svelte` only                  |

---

## 3. Server-Side Telefunc Functions (`*.telefunc.ts`)

Rules  
1. Export every function with the prefix `on` → `onGetProducts`, `onCreateOrder`, …  
2. Use Supabase client with RLS.  
3. Validate input via Zod schemas imported from `src/lib/types/*.schema.ts`.  
4. Obtain auth context via `getContext()`.  
5. Return **strongly-typed** data (do **not** return Svelte stores or reactive objects).

Example skeleton:

```ts
// src/lib/server/telefuncs/product.telefunc.ts
import { getContext } from 'telefunc';
import type { ProductFilters, PaginatedProducts } from '$lib/types/product.schema';

export async function onGetProducts(filters?: ProductFilters): Promise<PaginatedProducts> {
  const { user } = getContext();
  if (!user) throw new Error('Not authenticated');

  // … business logic & DB calls …
  return { products: [], total: 0 };
}
```

---

## 4. Client-Side Data-Layer (`src/lib/data/*.ts`)

### 4.1 Absolute Rules  
- **DO** use TanStack Query’s `createQuery` & `createMutation`.  
- **DO** return **Svelte stores** created with `derived`.  
- **DO NOT** use Svelte 5 runes (`$state`, `$derived`, `$effect`) inside this layer.  
- **DO** export hooks named `use[Feature]` (camel-case).  
- **DO** define stable query keys via `const queryKeys = { … }`.

### 4.2 Mandatory Helper  
Place the following **exact** `callTelefunc` helper **once** in any data-layer file that needs it (or in a shared util). It must throw on non-2xx responses:

```ts
async function callTelefunc<T = unknown>(
  functionName: string,
  args: any[] = []
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
```

### 4.3 Template for a Data Hook

```ts
// src/lib/data/product.ts
import { derived } from 'svelte/store';
import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import type { Product, ProductFilters, PaginatedProducts } from '$lib/types/product.schema';

// 1. Query key factory
const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...productQueryKeys.lists(), filters] as const,
  detail: (id: string) => [...productQueryKeys.all, 'detail', id] as const
};

// 2. Hook
export function useProducts(filters?: ProductFilters) {
  const queryClient = useQueryClient();

  const productsQuery = createQuery<PaginatedProducts>({
    queryKey: productQueryKeys.list(filters),
    queryFn: () => callTelefunc('onGetProducts', [filters]),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 3,
    retryDelay: 1000
  });

  // 3. Derived stores (only these are returned)
  const products   = derived(productsQuery, ($q) => $q.data?.products ?? []);
  const isLoading  = derived(productsQuery, ($q) => $q.isPending);
  const isError    = derived(productsQuery, ($q) => $q.isError);
  const error      = derived(productsQuery, ($q) => $q.error);

  return { products, isLoading, isError, error, productsQuery };
}
```

---

## 5. Component Layer (`.svelte` files only)

- Import data hooks: `import { useProducts } from '$lib/data/product';`  
- Destructure return: `const { products, isLoading } = useProducts();`  
- Access stores via `$` prefix: `$products`, `$isLoading`, etc.  
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`) **only for local component state / side-effects**, **never** for data coming from hooks.

Example:

```svelte
<script lang="ts">
  import { useProducts } from '$lib/data/product';

  let search = $state('');
  const { products, isLoading } = useProducts();

  const filtered = $derived(
    $products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  );
</script>

{#if $isLoading}
  <p>Loading…</p>
{:else}
  <!-- render $filtered -->
{/if}
```

---


- Use **prefetchQuery** in `+layout.ts` or `+page.ts` for every route that should be **fully SSR-hydrated**.