# Cache unit tests (id-gen)

These tests cover the caching utilities used by the `/all-ids` route:

- Remote function cache wrapper: [`cachedRemoteFunctionCall()`](../../src/lib/remote/remoteFunctionCache.ts:85)
- All IDs snapshot cache: [`readAllIdsCache()`](../../src/routes/all-ids/allIdsCache.ts:79)

## Running

From repo root:

```bash
pnpm -C apps/id-gen test:unit
```

This runs Vitest in jsdom (see [`vitest.config.ts`](../../vitest.config.ts:1)) and includes:

- [`remoteFunctionCache.test.ts`](./remoteFunctionCache.test.ts:1)
- [`allIdsCache.test.ts`](./allIdsCache.test.ts:1)

## Notes

- Tests mock [`browser`](../../src/lib/remote/remoteFunctionCache.ts:1) via `vi.doMock('$app/environment', ...)` before importing the module under test.
- The caches include module-level in-memory Maps, so tests use `vi.resetModules()` and `sessionStorage.clear()` to isolate state.