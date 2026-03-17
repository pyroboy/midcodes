TanStack Query Svelte 5 Docs


# Overview

The @tanstack/svelte-query package offers a 1st-class API for using TanStack Query via Svelte.

[

## Example


Include the QueryClientProvider near the root of your project:

svelte

```
<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import Example from './lib/Example.svelte'

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <Example />
</QueryClientProvider>
```

Then call any function (e.g. createQuery) from any component:

svelte

```
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery({
    queryKey: ['todos'],
    queryFn: () => fetchTodos(),
  })
</script>

<div>
  {#if $query.isLoading}
    <p>Loading...</p>
  {:else if $query.isError}
    <p>Error: {$query.error.message}</p>
  {:else if $query.isSuccess}
    {#each $query.data as todo}
      <p>{todo.title}</p>
    {/each}
  {/if}
</div>
```

[



## Available Functions


Svelte Query offers useful functions and components that will make managing server state in Svelte apps easier.
```
- createQuery
- createQueries
- createInfiniteQuery
- createMutation
- useQueryClient
- useIsFetching
- useIsMutating
- useHydrate
- <QueryClientProvider>
- <HydrationBoundary>
```


## Important Differences between Svelte Query & React Query

Svelte Query offers an API similar to React Query, but there are some key differences to be mindful of.

- Many of the functions in Svelte Query return a Svelte store. To access values on these stores reactively, you need to prefix the store with a $.
- If your query or mutation depends on variables, you must use a store for the options. 
  
  # SSR and SvelteKit

## Setup


SvelteKit defaults to rendering routes with SSR. Because of this, you need to disable the query on the server. Otherwise, your query will continue executing on the server asynchronously, even after the HTML has been sent to the client.

The recommended way to achieve this is to use the browser module from SvelteKit in your QueryClient object. This will not disable queryClient.prefetchQuery(), which is used in one of the solutions below.

**src/routes/+layout.svelte**

svelte

```
<script lang="ts">
  import { browser } from '$app/environment'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })
</script>

<QueryClientProvider client={queryClient}>
  <slot />
</QueryClientProvider>
```

[

## Prefetching data

Svelte Query supports two ways of prefetching data on the server and passing that to the client with SvelteKit.

[

### Using initialData


Together with SvelteKit's [load](https://kit.svelte.dev/docs/load), you can pass the data loaded server-side into createQuery's' initialData option:

**src/routes/+page.ts**

ts

```
export async function load() {
  const posts = await getPosts()
  return { posts }
}
```

**src/routes/+page.svelte**

svelte

```
<script>
  import { createQuery } from '@tanstack/svelte-query'
  import type { PageData } from './$types'

  export let data: PageData

  const query = createQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
    initialData: data.posts,
  })
</script>
```

Pros:

- This setup is minimal and this can be a quick solution for some cases
- Works with both +page.ts/+layout.ts and +page.server.ts/+layout.server.ts load functions

Cons:

- If you are calling createQuery in a component deeper down in the tree you need to pass the initialData down to that point
- If you are calling createQuery with the same query in multiple locations, you need to pass initialData to all of them
- There is no way to know at what time the query was fetched on the server, so dataUpdatedAt and determining if the query needs refetching is based on when the page loaded instead

[

### Using prefetchQuery


Svelte Query supports prefetching queries on the server. Using this setup below, you can fetch data and pass it into QueryClientProvider before it is sent to the user's browser. Therefore, this data is already available in the cache, and no initial fetch occurs client-side.

**src/routes/+layout.ts**

ts

```
import { browser } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'

export async function load() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  return { queryClient }
}
```

**src/routes/+layout.svelte**

svelte

```
<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import type { LayoutData } from './$types'

  export let data: LayoutData
</script>

<QueryClientProvider client={data.queryClient}>
  <slot />
</QueryClientProvider>
```

**src/routes/+page.ts**

ts

```
export async function load({ parent, fetch }) {
  const { queryClient } = await parent()

  // You need to use the SvelteKit fetch function here
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: async () => (await fetch('/api/posts')).json(),
  })
}
```

**src/routes/+page.svelte**

svelte

```
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  // This data is cached by prefetchQuery in +page.ts so no fetch actually happens here
  const query = createQuery({
    queryKey: ['posts'],
    queryFn: async () => (await fetch('/api/posts')).json(),
  })
</script>
```

Pros:

- Server-loaded data can be accessed anywhere without prop-drilling
- No initial fetch occurs client-side once the page is rendered, as the query cache retains all information about the query was made including dataUpdatedAt

Cons:

- Requires more files for initial setup
- Will not work with +page.server.ts/+layout.server.ts load functions (however, APIs which are used with TanStack Query need to be fully exposed to the browser anyway)
  
  # Reactivity

Svelte uses a compiler to build your code which optimizes rendering. By default, components run once, unless they are referenced in your markup. To be able to react to changes in options you need to use stores

# svelte/store


```
import {
	derived,
	fromStore,
	get,
	readable,
	readonly,
	toStore,
	writable
} from 'svelte/store';
```

## derived[](https://svelte.dev/docs/svelte/svelte-store#derived)

Derived value store by synchronizing one or more readable stores and applying an aggregation function over its input values.

```
function derived<S extends Stores, T>(
	stores: S,
	fn: (
		values: StoresValues<S>,
		set: (value: T) => void,
		update: (fn: Updater<T>) => void
	) => Unsubscriber | void,
	initial_value?: T | undefined
): Readable<T>;
```

```
function derived<S extends Stores, T>(
	stores: S,
	fn: (values: StoresValues<S>) => T,
	initial_value?: T | undefined
): Readable<T>;
```

## fromStore[](https://svelte.dev/docs/svelte/svelte-store#fromStore)

```
function fromStore<V>(store: Writable<V>): {
	current: V;
};
```

```
function fromStore<V>(store: Readable<V>): {
	readonly current: V;
};
```

## get[](https://svelte.dev/docs/svelte/svelte-store#get)

Get the current value from a store by subscribing and immediately unsubscribing.

```
function get<T>(store: Readable<T>): T;
```

## readable[](https://svelte.dev/docs/svelte/svelte-store#readable)

Creates a `Readable` store that allows reading by subscription.

```
function readable<T>(
	value?: T | undefined,
	start?: StartStopNotifier<T> | undefined
): Readable<T>;
```

## readonly[](https://svelte.dev/docs/svelte/svelte-store#readonly)

Takes a store and returns a new one derived from the old one that is readable.

```
function readonly<T>(store: Readable<T>): Readable<T>;
```

## toStore[](https://svelte.dev/docs/svelte/svelte-store#toStore)

```
function toStore<V>(
	get: () => V,
	set: (v: V) => void
): Writable<V>;
```

```
function toStore<V>(get: () => V): Readable<V>;
```

## writable[](https://svelte.dev/docs/svelte/svelte-store#writable)

Create a `Writable` store that allows both updating and reading by subscription.

```
function writable<T>(
	value?: T | undefined,
	start?: StartStopNotifier<T> | undefined
): Writable<T>;
```

## Readable[](https://svelte.dev/docs/svelte/svelte-store#Readable)

Readable interface for subscribing.

```
interface Readable<T> {…}
```

```
subscribe(this: void, run: Subscriber<T>, invalidate?: () => void): Unsubscriber;
```

- `run` subscription callback
- `invalidate` cleanup callback

Subscribe on value changes.

## StartStopNotifier[](https://svelte.dev/docs/svelte/svelte-store#StartStopNotifier)

Start and stop notification callbacks. This function is called when the first subscriber subscribes.

```
type StartStopNotifier<T> = (
	set: (value: T) => void,
	update: (fn: Updater<T>) => void
) => void | (() => void);
```

## Subscriber[](https://svelte.dev/docs/svelte/svelte-store#Subscriber)

Callback to inform of a value updates.

```
type Subscriber<T> = (value: T) => void;
```

## Unsubscriber[](https://svelte.dev/docs/svelte/svelte-store#Unsubscriber)

Unsubscribes from value updates.

```
type Unsubscriber = () => void;
```

## Updater[](https://svelte.dev/docs/svelte/svelte-store#Updater)

Callback to update a value.

```
type Updater<T> = (value: T) => T;
```

## Writable[](https://svelte.dev/docs/svelte/svelte-store#Writable)

Writable interface for both updating and subscribing.

```
interface Writable<T> extends Readable<T> {…}
```

```
set(this: void, value: T): void;
```

- `value` to set

Set value and inform subscribers.

```
update(this: void, updater: Updater<T>): void;
```

- `updater` callback

  # Reactivity Continuation


In the below example, the refetchInterval option is set from the variable intervalMs, which is bound to the input field. However, as the query is not able to react to changes in intervalMs, refetchInterval will not change when the input value changes.

svelte

```
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const endpoint = 'http://localhost:5173/api/data'

  let intervalMs = 1000

  const query = createQuery({
    queryKey: ['refetch'],
    queryFn: async () => await fetch(endpoint).then((r) => r.json()),
    refetchInterval: intervalMs,
  })
</script>

<input type="number" bind:value={intervalMs} />
```

To solve this, we can convert intervalMs into a writable store. The query options can then be turned into a derived store, which will be passed into the function with true reactivity.

svelte

```
<script lang="ts">
  import { derived, writable } from 'svelte/store'
  import { createQuery } from '@tanstack/svelte-query'

  const endpoint = 'http://localhost:5173/api/data'

  const intervalMs = writable(1000)

  const query = createQuery(
    derived(intervalMs, ($intervalMs) => ({
      queryKey: ['refetch'],
      queryFn: async () => await fetch(endpoint).then((r) => r.json()),
      refetchInterval: $intervalMs,
    })),
  )
</script>

<input type="number" bind:value={$intervalMs} />
```


#### svelte store TYPES

```
import type {
  DefaultError,
  DefinedQueryObserverResult,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  MutateFunction,
  Mutation,
  MutationFilters,
  MutationObserverOptions,
  MutationObserverResult,
  MutationState,
  OmitKeyof,
  Override,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { Readable } from 'svelte/store'

/** Allows a type to be either the base object or a store of that object */
export type StoreOrVal<T> = T | Readable<T>

/** Options for createBaseQuery */
export type CreateBaseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>

/** Result from createBaseQuery */
export type CreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = Readable<QueryObserverResult<TData, TError>>

/** Options for createQuery */
export type CreateQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>

/** Result from createQuery */
export type CreateQueryResult<
  TData = unknown,
  TError = DefaultError,
> = CreateBaseQueryResult<TData, TError>

/** Options for createInfiniteQuery */
export type CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

/** Result from createInfiniteQuery */
export type CreateInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = Readable<InfiniteQueryObserverResult<TData, TError>>

/** Options for createBaseQuery with initialData */
export type DefinedCreateBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = Readable<DefinedQueryObserverResult<TData, TError>>

/** Options for createQuery with initialData */
export type DefinedCreateQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedCreateBaseQueryResult<TData, TError>

/** Options for createMutation */
export type CreateMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TContext>,
  '_defaulted'
>

export type CreateMutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = (
  ...args: Parameters<MutateFunction<TData, TError, TVariables, TContext>>
) => void

export type CreateMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = MutateFunction<TData, TError, TVariables, TContext>

export type CreateBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  { mutate: CreateMutateFunction<TData, TError, TVariables, TContext> }
> & {
  mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TContext>
}

/** Result from createMutation */
export type CreateMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TContext = unknown,
> = Readable<CreateBaseMutationResult<TData, TError, TVariables, TContext>>

/** Options for useMutationState */
export type MutationStateOptions<TResult = MutationState> = {
  filters?: MutationFilters
  select?: (
    mutation: Mutation<unknown, DefaultError, unknown, unknown>,
  ) => TResult
}
```

[

## Functions

createInfiniteQuery
Function: createInfiniteQuery()
ts

function createInfiniteQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(options, queryClient?): CreateInfiniteQueryResult<TData, TError>
Type Parameters
• TQueryFnData

• TError = Error

• TData = InfiniteData<TQueryFnData, unknown>

• TQueryKey extends readonly unknown[] = readonly unknown[]

• TPageParam = unknown

Parameters
options
StoreOrVal<CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, TPageParam>>

queryClient?
QueryClient

Returns
CreateInfiniteQueryResult<TData, TError>



___

createMutation
Function: createMutation()
ts

function createMutation<TData, TError, TVariables, TContext>(
  options,
  queryClient?,
): CreateMutationResult<TData, TError, TVariables, TContext>
Type Parameters
• TData = unknown

• TError = Error

• TVariables = void

• TContext = unknown

Parameters
options
StoreOrVal<CreateMutationOptions<TData, TError, TVariables, TContext>>

queryClient?
QueryClient

Returns
CreateMutationResult<TData, TError, TVariables, TContext>

___


createQueries

```
Function: createQueries()
ts

function createQueries<T, TCombinedResult>(
  __namedParameters,
  queryClient?,
): Readable<TCombinedResult>
Type Parameters
• T extends any[]

• TCombinedResult = T extends [] ? [] : T extends [Head] ? [GetCreateQueryResult<Head>] : T extends [Head, ...Tails[]] ? [...Tails[]] extends [] ? [] : [...Tails[]] extends [Head] ? [GetCreateQueryResult<Head>, GetCreateQueryResult<Head>] : [...Tails[]] extends [Head, ...Tails[]] ? [...Tails[]] extends [] ? [] : [...Tails[]] extends [Head] ? [GetCreateQueryResult<Head>, GetCreateQueryResult<Head>, GetCreateQueryResult<Head>] : [...Tails[]] extends [Head, ...Tails[]] ? [...(...)[]] extends [] ? [] : ... extends ... ? ... : ... : [...{ [K in (...)]: (...) }[]] : [...{ [K in string | number | symbol]: GetCreateQueryResult<Tails[K<(...)>]> }[]] : { [K in string | number | symbol]: GetCreateQueryResult<T[K<K>]> }

Parameters
__namedParameters
combine
(result) => TCombinedResult

queries
| StoreOrVal<[...(T extends [] ? [] : T extends [Head] ? [GetQueryObserverOptionsForCreateQueries<Head>] : T extends [Head, ...Tails[]] ? [...Tails[]] extends [] ? [] : [...Tails[]] extends [Head] ? [GetQueryObserverOptionsForCreateQueries<(...)>, GetQueryObserverOptionsForCreateQueries<(...)>] : [...(...)[]] extends [(...), ...(...)[]] ? (...) extends (...) ? (...) : (...) : (...) extends (...) ? (...) : (...) : readonly unknown[] extends T ? T : T extends QueryObserverOptionsForCreateQueries<(...), (...), (...), (...)>[] ? QueryObserverOptionsForCreateQueries<(...), (...), (...), (...)>[] : QueryObserverOptionsForCreateQueries<(...), (...), (...), (...)>[])[]]> | StoreOrVal<[...{ [K in string | number | symbol]: GetQueryObserverOptionsForCreateQueries<T[K<K>]> }[]]>

queryClient?
QueryClient

Returns
Readable<TCombinedResult>
```

___


createQuery
```
Function: createQuery()
Call Signature
ts

function createQuery<TQueryFnData, TError, TData, TQueryKey>(
  options,
  queryClient?,
): DefinedCreateQueryResult<TData, TError>
Type Parameters
• TQueryFnData = unknown

• TError = Error

• TData = TQueryFnData

• TQueryKey extends readonly unknown[] = readonly unknown[]

Parameters
options
StoreOrVal<DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>>

queryClient?
QueryClient

Returns
DefinedCreateQueryResult<TData, TError>

Defined in
packages/svelte-query/src/createQuery.ts:15

Call Signature
ts

function createQuery<TQueryFnData, TError, TData, TQueryKey>(
  options,
  queryClient?,
): CreateQueryResult<TData, TError>
Type Parameters
• TQueryFnData = unknown

• TError = Error

• TData = TQueryFnData

• TQueryKey extends readonly unknown[] = readonly unknown[]

Parameters
options
StoreOrVal<UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>>

queryClient?
QueryClient

Returns
CreateQueryResult<TData, TError>

Defined in
packages/svelte-query/src/createQuery.ts:27

Call Signature
ts

function createQuery<TQueryFnData, TError, TData, TQueryKey>(
  options,
  queryClient?,
): CreateQueryResult<TData, TError>
Type Parameters
• TQueryFnData = unknown

• TError = Error

• TData = TQueryFnData

• TQueryKey extends readonly unknown[] = readonly unknown[]

Parameters
options
StoreOrVal<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>>

queryClient?
QueryClient

Returns
CreateQueryResult<TData, TError>
```


___
getIsRestoringContext
```
Function: getIsRestoringContext()
ts

function getIsRestoringContext(): Readable<boolean>
Retrieves a isRestoring from Svelte's context

Returns
Readable<boolean>
```

___

getQueryClientContext
```
Function: getQueryClientContext()
ts

function getQueryClientContext(): QueryClient
Retrieves a Client from Svelte's context

Returns
QueryClient
```
___

infiniteQueryOptions
```
Function: infiniteQueryOptions()
ts

function infiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(
  options,
): CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey,
  TPageParam
>
Type Parameters
• TQueryFnData

• TError = Error

• TData = InfiniteData<TQueryFnData, unknown>

• TQueryKey extends readonly unknown[] = readonly unknown[]

• TPageParam = unknown

Parameters
options
CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, TPageParam>

Returns
CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, TPageParam>
```

___
queryOptions
```
Function: queryOptions()
Call Signature
ts

function queryOptions<TQueryFnData, TError, TData, TQueryKey>(
  options,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object
Type Parameters
• TQueryFnData = unknown

• TError = Error

• TData = TQueryFnData

• TQueryKey extends readonly unknown[] = readonly unknown[]

Parameters
options
DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>

Returns
DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object

Defined in
packages/svelte-query/src/queryOptions.ts:31

Call Signature
ts

function queryOptions<TQueryFnData, TError, TData, TQueryKey>(
  options,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object
Type Parameters
• TQueryFnData = unknown

• TError = Error

• TData = TQueryFnData

• TQueryKey extends readonly unknown[] = readonly unknown[]

Parameters
options
UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>

Returns
UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object

```

___

setIsRestoringContext
```
Function: setIsRestoringContext()
ts

function setIsRestoringContext(isRestoring): void
Sets a isRestoring on Svelte's context

Parameters
isRestoring
Readable<boolean>

Returns
void
```

___

useHydrate
```
Function: useHydrate()
ts

function useHydrate(state?, options?, queryClient?): void
Parameters
state?
unknown

options?
HydrateOptions

queryClient?
QueryClient

Returns
void
```

___

useIsFetching
```
Function: useIsFetching()
ts

function useIsFetching(filters?, queryClient?): Readable<number>
Parameters
filters?
QueryFilters<readonly unknown[]>

queryClient?
QueryClient

Returns
Readable<number>
```

___

useIsMutating
```
Function: useIsMutating()
ts

function useIsMutating(filters?, queryClient?): Readable<number>
Parameters
filters?
MutationFilters<unknown, Error, unknown, unknown>

queryClient?
QueryClient

Returns
Readable<number>
```

___

useIsRestoring
```
Function: useIsRestoring()
ts

function useIsRestoring(): Readable<boolean>
Returns
Readable<boolean>
```

___

useMutationState
```
Function: useMutationState()
ts

function useMutationState<TResult>(options, queryClient?): Readable<TResult[]>
Type Parameters
• TResult = MutationState<unknown, Error, unknown, unknown>

Parameters
options
MutationStateOptions<TResult> = {}

queryClient?
QueryClient

Returns
Readable<TResult[]>
```

___

useMutationState
```
Function: useMutationState()
ts

function useMutationState<TResult>(options, queryClient?): Readable<TResult[]>
Type Parameters
• TResult = MutationState<unknown, Error, unknown, unknown>

Parameters
options
MutationStateOptions<TResult> = {}

queryClient?
QueryClient

Returns
Readable<TResult[]>
```

___

useQueryClient
```
Function: useQueryClient()
ts

function useQueryClient(queryClient?): QueryClient
Parameters
queryClient?
QueryClient

Returns
QueryClient
```


### USAGE GUIDE

___


|Function / Component|Goes in …|Typical use-case|
|:--|:--|:--|
|`QueryClientProvider`|`src/routes/+layout.svelte`|Wraps the whole app so every page / component can read the same `QueryClient`.|
|`createQuery`|Any `.svelte` file|Fetch and cache single endpoint data (posts, user profile, etc.).|
|`createQueries`|Any `.svelte` file|Need to fire off several parallel queries (e.g. dashboard stats).|
|`createInfiniteQuery`|Any `.svelte` file|Paginated / infinite scroll feeds (blog list, social timeline).|
|`createMutation`|Any `.svelte` file|POST/PUT/DELETE calls triggered by user action (forms, buttons).|
|`useQueryClient`|Any `.svelte` file|Inside components that need to `invalidateQueries()` or `setQueryData()` (after mutation, optimistic update).|
|`useIsFetching`|Any `.svelte` file|Show global “syncing” spinner.|
|`useIsMutating`|Any `.svelte` file|Disable submit button while any mutation is in flight.|
|`useHydrate`|`src/routes/+layout.svelte` OR `+page.svelte`|**Only** when you are **not** using the `prefetchQuery` pattern in a `load()` function and instead want to hydrate client-side from serialized JSON.|
|`<HydrationBoundary>`|Rarely needed in SvelteKit; only if you embed an island / micro-frontend that has its own separate hydration boundary.|
|`queryOptions`|`src/lib/queries.ts`|Central factory for reusable query option objects.|
|`infiniteQueryOptions`|`src/lib/queries.ts`|Same as above, but for infinite queries.|

---

### Server-side patterns


|Item|Goes in …|Purpose|
|:--|:--|:--|
|`QueryClient` instantiation|`+layout.ts` (universal) or `+layout.server.ts`|Create once per request so `prefetchQuery()` can run on the server.|
|`queryClient.prefetchQuery()`|`+page.ts` / `+layout.ts` `load()`|Populate cache before HTML is sent, avoids client fetch round-trip.|
|`initialData`|`+page.svelte`|Quick-and-dirty SSR when you don’t want to set up a full `load()` file.|

---

### Quick rule of thumb

- Anything that **reads** data belongs in components (`createQuery`, `createInfiniteQuery`, etc.).
    
- Anything that **sets up the cache** or **runs before render** belongs in `load()` functions (`prefetchQuery`, `QueryClient` creation).
    
- `QueryClientProvider` is always in the root layout so every component can reach the same cache.