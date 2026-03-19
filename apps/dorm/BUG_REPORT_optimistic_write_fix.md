# Bug Report: Stale `$formData` in superForm `onResult` + Missing `.returning()` on Server Creates

**Date:** 2026-03-19
**Severity:** Medium (data correctness / UX degradation)
**Status:** FIXED

---

## Summary

Two related bugs caused optimistic writes to fail silently on **create** actions across multiple pages. The UI would not update instantly after creating a new meter, rental unit, or (as a safety concern) property. Users had to wait for the next RxDB pull cycle or manually refresh.

---

## Root Cause

### Bug 1: `$formData` is stale in `onResult` when `resetForm: true`

superForm's `resetForm: true` option clears `$form` data **before** `onResult` fires. Any code reading `$form.id`, `$form.name`, etc. in `onResult` gets the reset (empty/default) values, not what the user submitted.

**Impact:** Even for **updates** (where `$form.id` was set before submit), the optimistic write received a reset/zeroed ID, causing it to either fail or write incorrect data.

### Bug 2: Server `create` actions don't return the new ID

Drizzle `db.insert(...).values(...)` without `.returning()` does not return the auto-incremented `id` from PostgreSQL. The client had no way to know the new record's ID for the optimistic write.

**Impact:** For **creates**, even if `$formData` weren't stale, there was no server-assigned ID available. The optimistic write was skipped entirely, falling through to a background resync (slower) or not happening at all.

---

## Affected Pages (before fix)

| Page | Component | Server File | Bug |
|------|-----------|-------------|-----|
| `/meters` | `meters/+page.svelte` | `meters/+page.server.ts` | Both bugs |
| `/locations` (meters tab) | `locations/MetersTab.svelte` | `locations/meters/+page.server.ts` | Both bugs |
| `/rental-unit` | `rental-unit/+page.svelte` | `rental-unit/+page.server.ts` | Bug 2 only (already had `savedFormData`) |
| `/locations` (units tab) | `locations/RentalUnitsTab.svelte` | `locations/units/+page.server.ts` | Bug 2 only (already had `savedFormData`) |
| `/properties` | `properties/+page.svelte` | *(server already had `.returning()`)* | Potential Bug 1 (fallback used `$formData`) |
| `/locations` (properties tab) | `locations/PropertiesTab.svelte` | *(server already had `.returning()`)* | Potential Bug 1 (fallback used `$formData`) |

### Pages NOT affected

- `floors/+page.svelte` / `locations/FloorsTab.svelte` — already fixed in prior commit
- `expenses/+page.svelte` — uses `resultData.expense` from server
- `budgets/+page.svelte` — uses `resultData.budget` from server
- `tenants/TenantFormModal.svelte` — custom submit handler
- `payments/PaymentForm.svelte` — no optimistic writes in `onResult`
- `transactions/TransactionFormModal.svelte` — no optimistic writes in `onResult`
- `leases/LeaseFormModal.svelte` — custom form, not using `resetForm`
- `penalties/+page.svelte` — no optimistic writes
- `utility-billings/+page.svelte` — no optimistic writes in `onResult`

---

## Fix Applied

### Server-side (4 files)

Added `.returning({ id: <table>.id })` to all `db.insert()` calls and set `form.data.id = inserted.id` so the new ID is returned in the form response.

**Files:**
- `src/routes/meters/+page.server.ts`
- `src/routes/locations/meters/+page.server.ts`
- `src/routes/rental-unit/+page.server.ts`
- `src/routes/locations/units/+page.server.ts`

### Client-side (6 files)

1. Added `savedFormData` / `savedEditMode` state variables (where missing)
2. Captured form data in `onSubmit` before superForm resets it
3. In `onResult`: prefer `serverData` from `result.data.form.data` (has new ID), fall back to `savedFormData`
4. Added `bgResync()` fallback if neither source has an ID
5. Imported `bgResync` from `$lib/db/optimistic-utils` where needed

**Files:**
- `src/routes/meters/+page.svelte`
- `src/routes/locations/MetersTab.svelte`
- `src/routes/rental-unit/+page.svelte`
- `src/routes/locations/RentalUnitsTab.svelte`
- `src/routes/properties/+page.svelte`
- `src/routes/locations/PropertiesTab.svelte`

---

## Pattern Reference

The correct optimistic write pattern for superForm with `resetForm: true`:

```typescript
let savedFormData: any = null;
let savedEditMode = false;

const { form, enhance, reset } = superForm(defaults(zod(schema)), {
  resetForm: true,
  onSubmit: () => {
    savedFormData = { ...$form };  // Capture BEFORE reset
    savedEditMode = editMode;
  },
  onResult: async ({ result }) => {
    if (result.type === 'success') {
      const serverData = (result as any).data?.form?.data;  // Has new ID from .returning()
      const fd = serverData ?? savedFormData;                // Fallback to captured data
      if (fd?.id) {
        await optimisticUpsert({ id: fd.id, ...fd });
      } else {
        bgResync('collection_name');  // Last resort
      }
      savedFormData = null;
    }
  }
});
```

Server create action must include:
```typescript
const [inserted] = await db.insert(table).values(data).returning({ id: table.id });
form.data.id = inserted.id;
return { form };
```

---

## Verification

- `pnpm check` — 0 errors, 0 warnings
- Manual testing required per entity: create/update/delete should show instant UI updates
