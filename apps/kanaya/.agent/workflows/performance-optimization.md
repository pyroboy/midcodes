---
description: Performance optimization strategies for SvelteKit Remote Functions and page rendering
---

# Performance Optimization Workflow

This document captures performance optimization strategies, common pitfalls, and debugging techniques for the id-gen application using SvelteKit Remote Functions.

---

## 🐛 Critical Bug: Background Refresh Blocking Render

### Root Cause

When calling async functions inside `requestAnimationFrame` or `onMount`, even with `void` (fire-and-forget), immediate state changes can block Svelte's `tick()`:

```javascript
// ❌ BAD - Blocks render for duration of API call
requestAnimationFrame(() => {
  dataRows = cached.cards;
  initialLoading = false;
  tick().then(...);  // ← Waits for ALL state changes
  void loadData();   // ← Sets isRefreshing=true IMMEDIATELY
});
```

### Solution

Use `setTimeout(fn, 0)` to escape the current render cycle:

```javascript
// ✅ GOOD - Render completes first, then refresh
requestAnimationFrame(() => {
  dataRows = cached.cards;
  initialLoading = false;
  tick().then(...);  // ← Completes in ~30ms

  if (needsRefresh) {
    setTimeout(() => {
      void loadData();  // ← Runs AFTER render
    }, 0);
  }
});
```

**Impact**: 4,759ms → 27ms (175x faster)

---

## 🐛 Critical Bug #2: Synchronous Cache Writes Blocking Render

### Root Cause

`$effect` blocks that write to SessionStorage run during render. `JSON.stringify` on large data (72 cards with images/fields) takes 4.5 seconds!

```javascript
// ❌ BAD - Runs on EVERY state change, blocks render
$effect(() => {
	if (!browser || initialLoading) return;

	const snapshot = {
		cards: dataRows // 72 cards!
		// ...
	};

	writeAllIdsCache(snapshot); // JSON.stringify takes 4.5 seconds!
});
```

### Solution

1. **Only write when data actually changes** (not on every navigation)
2. **Debounce writes** - wait for activity to settle
3. **Use setTimeout** to escape the render cycle

```javascript
// ✅ GOOD - Debounced, only when data changes
let cacheNeedsWrite = $state(false);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Mark for write when data changes
$effect(() => {
  if (!browser || initialLoading) return;
  if (dataCachedAt) cacheNeedsWrite = true;
});

// Debounced write
$effect(() => {
  if (!browser || initialLoading || !cacheNeedsWrite) return;

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    writeAllIdsCache(snapshot);
    cacheNeedsWrite = false;
  }, 500);  // 500ms debounce
});
```

**Impact**: 4,500ms → 0ms during navigation (cache write happens AFTER render)

---

## 📋 Summary of Critical Performance Bugs

| Bug                         | Symptom                                 | Root Cause                                           | Solution                                           |
| --------------------------- | --------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| Background Refresh Blocking | Page freezes 4-5s on stale cache        | `void asyncFn()` sets state before `tick()` resolves | Use `setTimeout(fn, 0)` to escape render cycle     |
| Cache Write Blocking        | Page freezes 4-5s even with fresh cache | `JSON.stringify(big data)` in `$effect`              | Debounce + only write when data changes            |
| Individual Card Fetches     | N cards = N API calls                   | `SmartIDCard` fetches on mount                       | Use `getIDCards()` to batch fetch full data        |
| Auth Redundancy             | 2 API calls per request                 | Calling both `getUser()` and `getSession()`          | Use only `getSession()`, extract user from session |

---

## 📊 Performance Debugging Techniques

### 1. Add Granular Timing Logs

```javascript
const SCRIPT_START = performance.now();
console.log(`📜 SCRIPT START @ ${new Date().toISOString()}`);

onMount(() => {
	const mountStart = performance.now();
	console.log(`[T+0ms] onMount started`);

	// Track each phase
	console.log(`[T+${(performance.now() - mountStart).toFixed(1)}ms] Cache read...`);
	const cached = readCache();
	console.log(`[T+${(performance.now() - mountStart).toFixed(1)}ms] Cache complete`);

	// After data assignment
	dataRows = cached.cards;
	console.log(`[T+${(performance.now() - mountStart).toFixed(1)}ms] Data assigned`);

	// Wait for DOM update
	tick().then(() => {
		console.log(`[T+${(performance.now() - mountStart).toFixed(1)}ms] tick() complete`);
		console.log(`🎉 RENDER COMPLETE: ${(performance.now() - SCRIPT_START).toFixed(1)}ms`);
	});
});
```

### 2. Track Component Mount Counts

```javascript
// In module context (shared across instances)
let globalMountCount = 0;

// In component
onMount(() => {
	globalMountCount++;
	console.log(`[Component] #${globalMountCount} mounted`);
});
```

### 3. Log Derived Computation Triggers

```javascript
let filteredData = $derived.by(() => {
	const sliced = allData.slice(0, limit);
	console.log(`[DEBUG] filteredData: ${sliced.length} of ${allData.length}`);
	return sliced;
});
```

---

## 🚀 SvelteKit Remote Functions Best Practices

### 1. Use Full Data Fetching Over Lazy Loading

```javascript
// ❌ SLOW - Each component makes individual API call
const cardIDs = await getCardIDs(); // Returns just IDs
// Then each SmartIDCard calls getCardDetails(id) on mount

// ✅ FAST - One batch request with complete data
const cards = await getIDCards(); // Returns full card data
// Components render directly, no additional fetches
```

### 2. Parallel Remote Function Calls

```javascript
// ❌ SLOW - Sequential
const cards = await getCards();
const count = await getCount();
const templates = await getTemplates();

// ✅ FAST - Parallel
const [cards, count, templates] = await Promise.all([getCards(), getCount(), getTemplates()]);
```

### 3. Cache Remote Function Results

```javascript
import { cachedRemoteFunctionCall } from '$lib/remote/remoteFunctionCache';

const data = await cachedRemoteFunctionCall({
	scopeKey: `${userId}:${orgId}`,
	keyBase: 'all-ids:getCards',
	args: { offset: 0, limit: 20 },
	forceRefresh: false,
	fetcher: (args) => getCards(args),
	options: {
		ttlMs: 600_000, // 10 minutes
		staleWhileRevalidate: true
	}
});
```

### 4. Avoid Auth Redundancy in Hooks

```javascript
// ❌ SLOW - Two API calls per request
const [userResponse, sessionResponse] = await Promise.all([
	supabase.auth.getUser(), // Network call
	supabase.auth.getSession() // Network call
]);

// ✅ FAST - One API call, use session.user
const {
	data: { session }
} = await supabase.auth.getSession();
const user = session?.user; // Already included in session
```

---

## 📦 Caching Strategies

### 1. Cap Cache Size for SessionStorage

```javascript
const MAX_CACHED_CARDS = 200; // Prevent ~5MB limit overflow

// When writing cache
const cardsToCache = dataRows.slice(0, MAX_CACHED_CARDS);
const snapshot = {
	cards: cardsToCache,
	hasMore: dataRows.length > MAX_CACHED_CARDS || hasMore
	// ...
};
```

### 2. Scope Cache by User + Organization

```javascript
const scopeKey = `${userId}:${orgId}`;
const STORAGE_KEY = `idgen:cache:v1:${scopeKey}`;

// Clear on auth change
$effect(() => {
	if (lastScopeKey && lastScopeKey !== scopeKey) {
		clearCache(lastScopeKey);
	}
	lastScopeKey = scopeKey;
});
```

### 3. Stale-While-Revalidate Pattern

```javascript
onMount(() => {
	const cached = readCache();
	if (cached) {
		// Hydrate immediately
		dataRows = cached.cards;
		initialLoading = false;

		const isFresh = Date.now() - cached.cachedAt < TTL_MS;
		if (!isFresh) {
			// Refresh in background AFTER render
			setTimeout(() => {
				void loadFreshData({ background: true });
			}, 0);
		}
	} else {
		void loadFreshData();
	}
});
```

---

## 🎯 Virtual Rendering for Large Lists

### 1. Limit Visible Items

```javascript
const VISIBLE_LIMIT = 15;
let visibleStartIndex = $state(0);

let visibleCards = $derived(allCards.slice(0, visibleStartIndex + VISIBLE_LIMIT));
```

### 2. Progressive Loading with IntersectionObserver

```javascript
function intersectionObserver(node: HTMLElement) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMoreIfNeeded();
      }
    },
    { threshold: 0.1, rootMargin: '200px' }
  );
  observer.observe(node);
  return { destroy: () => observer.disconnect() };
}

// In template
{#if hasMore}
  <div use:intersectionObserver></div>
{/if}
```

---

## ⚠️ Common Pitfalls

### ❌ Don't: Mix sync and async state changes in rAF

```javascript
requestAnimationFrame(() => {
	data = cached; // Sync
	void fetchNew(); // Async but triggers sync state change
});
```

### ❌ Don't: Make API calls in each list item component

```javascript
// Each of 100 items calls API = 100 requests
{#each items as item}
  <ItemCard id={item.id} />  // onMount calls getDetails(id)
{/each}
```

### ❌ Don't: Use `transition-all` in frequently rendered components

```css
/* Expensive - forces recalculation of all properties */
.card {
	transition: all 0.2s;
}

/* Better - only transition what you need */
.card {
	transition:
		transform 0.2s,
		box-shadow 0.2s;
}
```

### ❌ Don't: Forget to close console.group()

```javascript
console.group('Loading');
// ... if error thrown here, group never closes
console.groupEnd();
```

### ❌ Don't: Write large data to cache in $effect without debounce

```javascript
// This runs on EVERY state change and blocks render
$effect(() => {
	sessionStorage.setItem(key, JSON.stringify(largeData));
});

// Better: Debounce and only write when needed
$effect(() => {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		sessionStorage.setItem(key, JSON.stringify(largeData));
	}, 500);
});
```

### ❌ Don't: Hydrate ALL cached cards on re-navigation

```javascript
// If cache has 72 cards from scrolling, ALL get hydrated
dataRows = cached.cards; // 72 cards!

// Better: Cap what's used for initial render
const INITIAL_HYDRATE_LIMIT = 30;
dataRows = cached.cards.slice(0, INITIAL_HYDRATE_LIMIT);
```

---

## 🔧 Quick Debugging Checklist

When page is slow:

1. **Add timing logs** at script start, onMount, cache read, data hydration, tick()
2. **Check if API calls are blocking** - look for matching times (API = render)
3. **Count component mounts** - are more mounting than expected?
4. **Check derived computations** - are they running too often?
5. **Verify virtualization** - are only visible items rendering?
6. **Test with minimal render** - replace complex component with simple div
7. **Disable background operations** - comment out refresh/prefetch calls

---

## 📈 Performance Targets

| Metric                  | Target       | Alert Threshold |
| ----------------------- | ------------ | --------------- |
| Cache read              | < 5ms        | > 50ms          |
| Metadata hydration      | < 1ms        | > 10ms          |
| tick() (with cache)     | < 50ms       | > 200ms         |
| Full page load (cached) | < 100ms      | > 500ms         |
| Background refresh      | Non-blocking | Blocks render   |

---

## 🧪 Testing Performance Fixes

1. Clear cache: `sessionStorage.clear()`
2. Load page → Note timing (cold start)
3. Navigate away
4. Navigate back → Note timing (cached)
5. Wait for cache to go stale (or reduce TTL)
6. Navigate back → Verify background refresh doesn't block

```javascript
// Temporarily reduce TTL for testing
const ALL_IDS_CACHE_TTL_MS = 10_000; // 10 seconds instead of 10 minutes
```
