# Unit tests (cache utilities)

This folder includes unit tests for the caching utilities used by the `/all-ids` route.

## What’s covered

- Remote-function cache wrapper:
  - [`cachedRemoteFunctionCall()`](../../src/lib/remote/remoteFunctionCache.ts:85)
  - [`clearRemoteFunctionCacheByPrefix()`](../../src/lib/remote/remoteFunctionCache.ts:60)
  - [`clearRemoteFunctionCacheForScope()`](../../src/lib/remote/remoteFunctionCache.ts:80)

- All IDs snapshot cache:
  - [`readAllIdsCache()`](../../src/routes/all-ids/allIdsCache.ts:79)
  - [`writeAllIdsCache()`](../../src/routes/all-ids/allIdsCache.ts:103)
  - [`clearAllIdsCache()`](../../src/routes/all-ids/allIdsCache.ts:118)
  - [`isAllIdsCacheFresh()`](../../src/routes/all-ids/allIdsCache.ts:72)

## Running

From repo root:

```bash
pnpm -C apps/id-gen test:unit
```

Notes:
- Tests run in `jsdom` (configured in [`vitest.config.ts`](../../vitest.config.ts:1)).
- These cache modules use module-level in-memory Maps; tests isolate state via `vi.resetModules()` and clearing `sessionStorage` between cases.