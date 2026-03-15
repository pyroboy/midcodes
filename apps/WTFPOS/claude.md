# WTFPOS — WTF! SAMGYUP POS Software

## Overview

Custom **samgyupsal (Korean BBQ) restaurant POS** for "WTF! Samgyupsal" — a multi-branch business in **Bohol, Philippines**. Handles cashiering, inventory (meat + pantry), expense recording, and analytics across two retail branches + a warehouse.

**Client:** WTF! Corporation (Christopher Samonte, CEO)
**Developer:** Arturo Jose T. Magno

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **SvelteKit v2** + **Svelte 5** (runes: `$state`, `$derived`) |
| Styling | **Tailwind CSS v3** + custom tokens in `tailwind.config.js` |
| Type Safety | **TypeScript 5** |
| UI Components | Custom + **shadcn-svelte** (`src/lib/components/ui/`) |
| Icons | `lucide-svelte` — **never** use `@lucide/svelte/icons/*` deep imports |
| Database | **RxDB v16** + IndexedDB (Dexie) — local-first, offline-capable |
| Utils | `date-fns`, `nanoid` |
| Build | Vite 5, `@sveltejs/adapter-node` |
| Package Mgr | **pnpm** (monorepo child at `apps/WTFPOS`) |

---

## Key Commands

```bash
pnpm dev          # Start dev server
pnpm check        # svelte-kit sync + svelte-check (type checking)
pnpm build        # Production build
pnpm lint         # Prettier + ESLint
pnpm format       # Auto-format
```

> Always run `pnpm check` after any change. The known `vite.config.ts` error (monorepo version mismatch) can be ignored.

---

## Location Architecture (Non-Negotiable)

**`session.locationId` is the single most important piece of state in the entire app.**

| Location ID | Display Name | Type |
|-------------|-------------|------|
| `tag` | Alta Citta (Tagbilaran) | `retail` |
| `pgl` | Alona Beach (Panglao) | `retail` |
| `wh-tag` | Tagbilaran Central Warehouse | `warehouse` |
| `all` | All Locations (UI-only aggregate) | `retail` |

**Rules:**
1. Every list/query **must** filter by `session.locationId`
2. Every new record **must** include `locationId: session.locationId`
3. `locationId === 'all'` → show aggregate/cross-branch view, never silently filter to one branch
4. `isWarehouseSession()` gates POS/floor access — warehouse is inventory-only
5. `StatusBar` (location + live indicator) lives in **root layout only** — never add it to section layouts

---

## Roles & Access Control

| Role | Location Switch | Admin | Nav Items |
|------|----------------|-------|-----------|
| `owner` | Free | Yes | POS, Kitchen, Stock, Reports, Admin |
| `admin` | Free | Yes | POS, Kitchen, Stock, Reports, Admin |
| `manager` | Free | No | POS, Kitchen, Stock, Reports |
| `staff` | Locked | No | POS only |
| `kitchen` | Locked | No | Kitchen, Stock |

- `ROLE_NAV_ACCESS` in `session.svelte.ts` = single source of truth
- `ELEVATED_ROLES = ['owner', 'admin', 'manager']` — can switch locations
- `ADMIN_ROLES = ['owner', 'admin']` — can access `/admin`
- **Manager PIN `1234`** — required for cancellations, pax changes, refunds, void

---

## Layout Architecture

```
Root layout (+layout.svelte):
  <ConnectionStatus />       ← banners only (offline/KDS alerts), always rendered
  <DbHealthBanner />         ← floating warning (fixed), emergency DB reset
  {#if showSidebar}           ← false only for login page (/)
    <SidebarProvider>
      <AppSidebar />          ← collapsible left rail (desktop) / Sheet (mobile)
      <SidebarInset>
        <MobileTopBar />      ← md:hidden hamburger
        <StatusBar />         ← Location + Live status bar (sticky, authenticated pages)
        {children}
      </SidebarInset>
    </SidebarProvider>
  {/if}
```

**Rules:**
- **Never** add `TopBar` to new pages — deprecated
- **Never** add `StatusBar`, `ConnectionStatus`, or `DbHealthBanner` to page components — root layout only
- Section layouts use `h-full` not `h-screen` — height managed by `SidebarInset`

---

## Development Rules

### Svelte 5
- Use `$state()`, `$derived()`, `$effect()` — no legacy `writable`/`readable`
- Store files: `.svelte.ts` extension (required for rune context)
- `store.value` when using `createRxStore()` bridge
- `onclick` not `on:click` (Svelte 5 event syntax)

### Safari Import Order (Non-Negotiable)
Safari throws `"Cannot access 'component' before initialization"` when ES modules evaluate in the wrong order. `data-mode.svelte.ts` imports `session.svelte.ts` at module level, creating a circular chain through `create-store`.

**Rule:** In every `.svelte` or `.svelte.ts` file that imports from `$lib/stores/`, the **first** store import must be `session.svelte`:
```ts
import { session } from '$lib/stores/session.svelte'; // or bare: import '$lib/stores/session.svelte';
import { kdsTickets } from '$lib/stores/pos/kds.svelte'; // safe — session already loaded
```
This applies to routes, components, AND store files. Violating this order will work in Chrome but crash iPad/Safari.

### TypeScript
- `<script lang="ts">` on all components
- Explicit types — no `any`. Union types must be annotated before assignment

### Styling
- `cn()` from `$lib/utils` for conditional classes — never string concatenation
- Tailwind v3 only. Use design tokens (`bg-accent`, `text-status-green`) not raw hex
- `class:` directives can't use Tailwind `/` opacity — use `cn()` ternary
- Exception: `bg-white` when shadcn CSS vars haven't resolved (Sheet overlays)

### Icons
```ts
import { ShoppingCart } from 'lucide-svelte';        // Correct
import ShoppingCart from '@lucide/svelte/icons/...';  // WRONG — breaks Node
```

### Packages
- **pnpm** always — never `npm`, `yarn`, `npx` (use `pnpm dlx` for one-off tools)
- `pnpm exec playwright` for test runner
- `pnpm check` after every change — 0 new errors

---

## RxDB (Local-First Database)

Before ANY RxDB work, read: `skills/rxdb/SKILL.md` → references for detailed guides.

**Non-negotiable rules:**
- **NEVER** use `.patch()` or `.modify()` — always `incrementalPatch` / `incrementalModify`
- **Every write** must include `updatedAt: new Date().toISOString()`
- **Guard** all `getDb()` calls with `if (!browser) return`
- **Read from `doc`** inside `incrementalModify`, never from Svelte store state
- **Use `nanoid()`** for primary keys — never sequential IDs
- **Schema version bumps** require migration strategies in `db/index.ts`
- **Every record** must include `locationId`

Key files: `src/lib/db/index.ts` (singleton + migrations), `src/lib/db/schemas.ts` (all schemas), `src/lib/stores/sync.svelte.ts` (`createRxStore()` bridge).

---

## Server-Side Write Guards

12 guards across 2 layers prevent duplicates, invalid transitions, orphaned data, stock errors, and BIR compliance violations. Full documentation: `skills/network-expert/SKILL.md` § Server-Side Write Guards.

**Quick reference — valid state machines:**

Table: `available → occupied/maintenance`, `occupied → warning/critical/billing/available`, `warning → critical/billing/available`, `critical → billing/available`, `billing → available`, `maintenance → available`

Order: `open → pending_payment/paid/cancelled`, `pending_payment → paid/open/cancelled`, `paid/cancelled → terminal`

**Key files:** `src/routes/api/collections/[collection]/write/+server.ts` (9 guards), `src/routes/api/replication/[collection]/push/+server.ts` (6 filters), `src/lib/stores/guard.svelte.ts` (client store).

---

## Current Phase

```
PHASE 1 — LOCAL-FIRST + THIN CLIENT (ACTIVE)
  1 main tablet per branch runs node build
  All other devices = browsers on local WiFi
  RxDB + IndexedDB (fully offline), SSE for real-time

NOT YET: Phase 2 (Neon + Ably) · Phase 3 (hardware) · Phase 4 (resilience)
```

Do not implement Phase 2+ unless user explicitly triggers a phase change.

---

## Skill Router

Read the matching skill **before** implementing anything in that domain.

| Domain | Skill |
|--------|-------|
| RxDB collections, schemas, migrations, store helpers, RxDB errors | `skills/rxdb/SKILL.md` |
| Cross-layer architecture, phase transitions | `skills/architecture/SKILL.md` |
| Network, sync, LAN, write guards, race conditions, offline, backup | `skills/network-expert/SKILL.md` |
| Neon cloud DB, Drizzle, SQL, analytics | `skills/neon/SKILL.md` |
| Ably real-time, replace SSE, cross-device push | `skills/ably/SKILL.md` |
| Bluetooth scale, GATT, hardware | `skills/bluetooth/SKILL.md` |
| UX audit, design review, usability | `skills/ux-audit/SKILL.md` |
| Code viability pre-check | `skills/code-audit/SKILL.md` |
| Role scenarios, user journeys | `skills/user-scenarios/SKILL.md` |
| Maturity check, PRD alignment | `skills/check-maturity/SKILL.md` |
| Report/data/chart audit | `skills/report-audit/SKILL.md` |
| E2E tests, browser automation | `.claude/skills/playwright-cli/SKILL.md` |

---

## Philippine-Specific Context

- Currency: **₱ PHP** — `formatPeso()` in `utils.ts`
- Locale: `en-PH`
- Discounts: **Senior Citizen (20%)**, **PWD (20%)** — pro-rata for AYCE
- Payments: **Cash**, **GCash**, **Maya**
- Tax: **VAT 12%**
- Compliance: **BIR** X-Readings, Z-Readings

---

## PRD Reference

Full PRD at `PRD2.md`: Module 1 (POS/cashiering), Module 2 (stock management), Module 3 (analytics/reports), Module 4 (admin/audit logs).
