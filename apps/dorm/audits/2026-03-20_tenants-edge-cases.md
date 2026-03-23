# Edge Case Audit — `/tenants` Route

**Date**: 2026-03-20
**Auditor**: Claude (code-based analysis)
**Route**: `/tenants`
**Files Analyzed**: `+page.svelte`, `+page.server.ts`, `TenantCard.svelte`, `TenantTable.svelte`, `TenantFormModal.svelte`, `formSchema.ts`, `types.ts`
**Method**: Deep code trace — RxDB could not initialize in headless browser (COL23 license limit)

---

## A. Layout Map (from code structure)

```
┌─────────────────────────────────────────────────────────────┐
│ SIDEBAR │ MAIN CONTENT                                      │
│         │                                                   │
│         │ ┌─ Sticky Header ──────────────────────────────┐  │
│         │ │ "Tenants Dashboard"                          │  │
│         │ │ [Active] [Total] [Inactive] [Pending] [BLK]  │  │
│         │ │                              [+ Add Tenant]  │  │
│         │ └──────────────────────────────────────────────┘  │
│         │                                                   │
│         │ ┌─ Search/Filter Bar ──────────────────────────┐  │
│         │ │ [🔍 Search...] [Status ▼] [▦ Grid │ ☰ List] │  │
│         │ └──────────────────────────────────────────────┘  │
│         │                                                   │
│         │ ┌─ Tenant List ────────────────────────────────┐  │
│         │ │ "Tenant List (N)"                            │  │
│         │ │                                              │  │
│         │ │  LOADING: 5 skeleton cards                   │  │
│         │ │  EMPTY+FILTERS: "No tenants found" icon      │  │
│         │ │  EMPTY+NO FILTER: "No tenants" + [Add First] │  │
│         │ │  CARD VIEW: 1-4 col grid of TenantCards      │  │
│         │ │  LIST VIEW: TenantTable (sortable)           │  │
│         │ │                                              │  │
│         │ │  [← 1 2 ... N →] pagination (if >24)        │  │
│         │ └──────────────────────────────────────────────┘  │
│         │                                                   │
│         │ <TenantFormModal> (create/edit dialog)            │
│         │ <AlertDialog> (delete confirmation)              │
└─────────────────────────────────────────────────────────────┘
```

---

## B. Edge Case Scenarios Tested

### EC-1: RxDB store fails to initialize
| Field | Value |
|-------|-------|
| **Priority** | **P0** |
| **Scenario** | RxDB crashes (missing plugin, IndexedDB quota, browser incompatibility) |
| **Expected** | Graceful degradation with error state and retry option |
| **Actual (code)** | `isLoading` stays `true` forever — skeleton cards render indefinitely. No timeout, no error boundary, no retry button. User sees 5 skeleton cards with no explanation. |
| **Root cause** | `isLoading = $derived(!tenantsStore.initialized)` — if initialization fails, `initialized` never becomes `true`. No `error` state is checked from `tenantsStore`. |
| **Impact** | Page appears permanently broken with no actionable feedback |
| **Fix** | Check `tenantsStore.error` and show an error state with retry button after initialization failure |

### EC-2: Tenant name with only whitespace
| Field | Value |
|-------|-------|
| **Priority** | **P0** |
| **Scenario** | User creates tenant with name `"   "` (spaces only) |
| **Expected** | Validation error: "Name is required" |
| **Actual (code)** | Zod schema uses `z.string().min(1)` which passes for `"   "` (length 3). Server saves whitespace-only name. Initials extractor in TenantCard would generate empty initials (`"".split(" ").map(n => n[0])`) → likely shows `undefined` or crashes. |
| **Root cause** | Missing `.trim()` before `.min(1)` in `tenantFormSchema.name` |
| **Impact** | Corrupted data in DB, broken card rendering |
| **Fix** | Add `.trim()` transform before `.min(1)` in schema, or add `.refine(v => v.trim().length > 0)` |

### EC-3: Tenant name initials crash on single-character name
| Field | Value |
|-------|-------|
| **Priority** | **P1** |
| **Scenario** | Tenant name is a single letter like `"A"` or empty-ish after split |
| **Expected** | Shows "A" as initials |
| **Actual (code)** | `TenantCard.svelte:48-52` and `TenantTable.svelte:89-93` both do `.split(' ').map((n: string) => n[0]).join('').toUpperCase()`. If name is `""` after a bug, `.split(' ')` returns `[""]`, `n[0]` is `undefined`, `.join('')` produces `"undefined"`. |
| **Root cause** | No guard on empty name parts |
| **Impact** | "UNDEFINED" rendered as initials |
| **Fix** | Filter empty parts: `.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase() \|\| '?'` |

### EC-4: XSS via tenant name in delete confirmation
| Field | Value |
|-------|-------|
| **Priority** | **P1** |
| **Scenario** | Tenant name contains `<script>alert(1)</script>` or Svelte template injection |
| **Expected** | Name rendered as text, not HTML |
| **Actual (code)** | `+page.svelte:568`: `Are you sure you want to archive tenant "{tenantToDelete.name}"?` — Svelte's `{...}` interpolation auto-escapes HTML, so this is **safe** from XSS. However, very long names (255 chars) could overflow the dialog. |
| **Root cause** | N/A (XSS safe), but no length truncation in dialog |
| **Impact** | Low — visual overflow only |
| **Fix** | Truncate name in dialog: `{tenantToDelete.name.slice(0, 50)}{tenantToDelete.name.length > 50 ? '...' : ''}` |

### EC-5: Duplicate filter controls (status pills + dropdown)
| Field | Value |
|-------|-------|
| **Priority** | **P1** |
| **Scenario** | User clicks "Active" status pill, then selects "INACTIVE" from dropdown |
| **Expected** | One filter system overrides the other clearly |
| **Actual (code)** | Both filters apply simultaneously: `activeFilter` from pills AND `selectedStatus` from dropdown. The `$effect` at line 131 sets `activeFilter = 'all'` when `selectedStatus` changes, but both filters are checked in the loop (line 166-167). If `selectedStatus = "INACTIVE"` and `activeFilter = "all"`, it correctly filters by INACTIVE. But if user then clicks a pill, `selectedStatus` is cleared (line 199), causing a jarring double-state. |
| **Root cause** | Two independent filter mechanisms that partially override each other |
| **Impact** | Confusing UX — users can't predict which filter is "active" |
| **Fix** | Either remove the dropdown (pills cover all statuses) or make them mutually exclusive with clear visual state |

### EC-6: Pagination shows wrong range at boundary
| Field | Value |
|-------|-------|
| **Priority** | **P2** |
| **Scenario** | Exactly 24 tenants (1 full page) |
| **Expected** | No pagination shown, "Showing 1-24 of 24" |
| **Actual (code)** | `totalPages = Math.max(1, Math.ceil(24/24)) = 1`, `{#if totalPages > 1}` = false. Pagination is correctly hidden. **PASS.** |

### EC-7: Delete tenant with active leases
| Field | Value |
|-------|-------|
| **Priority** | **P1** |
| **Scenario** | User deletes a tenant who has active leases |
| **Expected** | Warning about active leases, maybe block deletion |
| **Actual (code)** | Warning is shown in AlertDialog (`+page.svelte:571-576`): "This tenant has N active lease(s) that will be preserved." But user can still proceed. Server does a soft-delete only (`deleted_at = now()`). Leases are preserved. The delete action (`+page.server.ts:258-310`) doesn't check for active leases at all — it just soft-deletes. |
| **Root cause** | No server-side guard against deleting tenants with active leases |
| **Impact** | Data integrity concern — active lease references a soft-deleted tenant |
| **Fix** | Either block server-side deletion when active leases exist (return 409), or auto-deactivate the tenant instead of soft-deleting |

### EC-8: Form modal — editing tenant while another user edits same tenant
| Field | Value |
|-------|-------|
| **Priority** | **P1** |
| **Scenario** | Two users open edit modal for same tenant, both submit |
| **Expected** | Second save fails with conflict message |
| **Actual (code)** | Optimistic locking is implemented via `_updated_at` hidden field and `optimisticLockUpdate()` in `+page.server.ts:235-238`. Returns 409 on conflict. `TenantFormModal.svelte:174` catches 409: `throw new Error(CONFLICT_MESSAGE)`. **PASS — properly implemented.** |

### EC-9: Profile picture upload fails mid-submission
| Field | Value |
|-------|-------|
| **Priority** | **P1** |
| **Scenario** | Image upload to `/api/upload-image` fails (network error, S3 down) |
| **Expected** | Error toast, form not submitted, user can retry |
| **Actual (code)** | `TenantFormModal.svelte:104-110`: `uploadProfilePicture()` is called first. If it throws, the `catch` at line 200 fires: `toast.error(...)`. But the modal is NOT closed (close happens at line 154-158, which is after upload). However, `isSubmitting` is set to `false` in `finally`, so user can retry. **Mostly correct**, but the `toast.success('Image uploaded successfully')` at line 108 fires even if the subsequent form submission fails. |
| **Root cause** | Success toast for image upload fires before form submission completes |
| **Impact** | Misleading — user sees "Image uploaded successfully" then potentially "Failed to create tenant" |
| **Fix** | Remove the intermediate `toast.success` for image upload; let the final success/error toast handle everything |

### EC-10: Search with special regex characters
| Field | Value |
|-------|-------|
| **Priority** | **P2** |
| **Scenario** | User types `"test (unit)"` or `"José"` in search |
| **Expected** | Literal string matching |
| **Actual (code)** | Search uses `.toLowerCase().includes(searchLower)` at line 165. This is **safe** — `String.includes()` does literal matching, not regex. Unicode names like "José" work correctly. **PASS.** |

### EC-11: View mode persistence across sessions
| Field | Value |
|-------|-------|
| **Priority** | **P2** |
| **Scenario** | User switches to list view, refreshes page |
| **Expected** | List view persists |
| **Actual (code)** | `viewMode` reads from `localStorage.getItem('tenants-view-mode')` on init (line 104-108). An `$effect` writes it back on change (line 124-128). **PASS — properly implemented.** |

### EC-12: Filter URL persistence — invalid filter value in URL
| Field | Value |
|-------|-------|
| **Priority** | **P2** |
| **Scenario** | User manually edits URL to `/tenants?filter=HACKED` |
| **Expected** | Falls back to default filter |
| **Actual (code)** | `initialFilter` is typed as `'all' | 'active' | ... | null` but `$page.url.searchParams.get('filter')` returns any string. The `as` cast at line 110 is a lie — TypeScript won't catch invalid values at runtime. If `activeFilter = "HACKED"`, the filter loop (line 167) compares `tenant.tenant_status !== "HACKED".toUpperCase()` which is always true — **all tenants get filtered out**, showing empty state. |
| **Root cause** | No runtime validation of URL search params |
| **Impact** | Blank page with confusing "No tenants found" when filter param is tampered |
| **Fix** | Validate `initialFilter` against allowed values: `const validFilters = ['all', 'active', 'inactive', 'pending', 'blacklisted']; const initialFilter = validFilters.includes(raw) ? raw : 'active';` |

### EC-13: TenantCard — profile picture fails to load
| Field | Value |
|-------|-------|
| **Priority** | **P2** |
| **Scenario** | Profile picture URL is valid but image 404s (S3 object deleted) |
| **Expected** | Fallback to initials |
| **Actual (code)** | `TenantCard.svelte:35-41` renders `<img>` with no `onerror` handler. If image fails, browser shows broken image icon. No fallback to initials avatar. Same issue in `TenantTable.svelte:81-85`. |
| **Root cause** | No `onerror` handler on `<img>` tags |
| **Impact** | Broken image icon instead of graceful fallback |
| **Fix** | Add `onerror` handler: `on:error={() => { tenant.profile_picture_url = null; }}` or use a wrapper component |

### EC-14: Delete confirmation — tenantToDelete nulled before dialog renders
| Field | Value |
|-------|-------|
| **Priority** | **P2** |
| **Scenario** | Race condition: `handleDeleteTenant` sets `tenantToDelete` and `showDeleteDialog`, but dialog hasn't rendered yet |
| **Expected** | Dialog shows tenant name |
| **Actual (code)** | `+page.svelte:216-219` sets both synchronously. Dialog content at line 567 has `{#if tenantToDelete}` guard. Since Svelte batches state updates, this should render correctly. **PASS — no race condition.** |

### EC-15: Mobile — sticky header overflow with many stat pills
| Field | Value |
|-------|-------|
| **Priority** | **P1** |
| **Scenario** | On mobile (320px viewport), 5 status pills + "Add Tenant" button in header |
| **Expected** | All controls accessible |
| **Actual (code)** | Pills are in a `flex overflow-x-auto flex-nowrap` container with hidden scrollbar (line 284). The container scrolls horizontally, but the hidden scrollbar means users don't know they can scroll. "Add Tenant" button is outside the scroll container, so it's always visible. However, on very small screens, the `flex-col sm:flex-row` header layout stacks vertically, which works. |
| **Root cause** | Hidden scrollbar on stat pills provides no scroll affordance |
| **Impact** | Users may not discover "Pending" and "Blacklisted" pills on small screens |
| **Fix** | Add scroll shadow/fade indicators, or collapse pills into a dropdown on mobile |

### EC-16: Form modal — emergency contact email validation allows partial input
| Field | Value |
|-------|-------|
| **Priority** | **P2** |
| **Scenario** | User types `"john@"` (incomplete email) in emergency contact email |
| **Expected** | Validation error |
| **Actual (code)** | Schema at `formSchema.ts:201-208` uses `.refine((val) => !val \|\| val.trim() === '' \|\| /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))`. The regex requires at least `x@y.z` format, so `"john@"` would fail. **PASS.** But `validationMethod: 'onsubmit'` means the error only shows on submit, not while typing. |

---

## C. Summary

| Priority | Count | Issues |
|----------|-------|--------|
| **P0** | 2 | EC-1 (RxDB init failure = permanent skeleton), EC-2 (whitespace-only name) |
| **P1** | 5 | EC-3 (initials crash), EC-5 (duplicate filters), EC-7 (delete with active leases), EC-9 (misleading upload toast), EC-15 (mobile pill scroll) |
| **P2** | 4 | EC-4 (long name overflow), EC-12 (invalid URL filter), EC-13 (broken profile pic), EC-16 (validation timing) |
| **PASS** | 5 | EC-6, EC-8, EC-10, EC-11, EC-14 |

---

## D. Prioritized Recommendations

| ID | Priority | Effort | Impact | Fix |
|----|----------|--------|--------|-----|
| EC-1 | **P0** | M | High | Add error state check: `{:else if tenantsStore.error}` with retry button after skeleton loading |
| EC-2 | **P0** | S | High | Add `.trim()` before `.min(1)` in `tenantFormSchema.name` and `tenantSchema.name` |
| EC-3 | **P1** | S | Med | Guard initials: `.split(' ').filter(Boolean).map(n => n[0])` in TenantCard + TenantTable |
| EC-7 | **P1** | M | High | Server: block soft-delete when tenant has ACTIVE leases (return 400 with message) |
| EC-5 | **P1** | M | Med | Remove status dropdown — stat pills already provide all 4 statuses + "All" |
| EC-9 | **P1** | S | Low | Remove intermediate `toast.success('Image uploaded successfully')` |
| EC-15 | **P1** | S | Med | Add gradient fade on scroll container edges as scroll affordance |
| EC-13 | **P2** | S | Med | Add `onerror` handler on profile `<img>` to fallback to initials |
| EC-12 | **P2** | S | Low | Validate URL filter param against allowed values before using |
| EC-4 | **P2** | S | Low | Truncate name in delete dialog to 50 chars |

---

## E. Files to Modify

| File | Fixes |
|------|-------|
| `+page.svelte` | EC-1 (error state), EC-5 (remove dropdown), EC-12 (validate filter), EC-15 (scroll affordance) |
| `formSchema.ts` | EC-2 (trim name) |
| `TenantCard.svelte` | EC-3 (initials guard), EC-13 (img onerror) |
| `TenantTable.svelte` | EC-3 (initials guard), EC-13 (img onerror) |
| `TenantFormModal.svelte` | EC-9 (remove upload toast) |
| `+page.server.ts` | EC-7 (active lease guard on delete) |
