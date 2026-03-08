# WTFPOS — WTF! SAMGYUP POS Software

## Overview

A custom **samgyupsal (Korean BBQ) restaurant POS system** built for "WTF! Samgyupsal", a multi-branch restaurant business in the Philippines. The system handles cashiering, inventory (meat + pantry), expense recording, and analytics across two branches — **Alta Citta (Tagbilaran)** and **Alona Beach (Panglao)** — plus a central warehouse.

**Client:** WTF! Corporation (Christopher Samonte, CEO)
**Developer:** Arturo Jose T. Magno

---

## Why This App Is Location-Sourcing Centric

Every piece of data in this system — tables, orders, stock levels, waste logs, deliveries, reports, expenses — **belongs to a specific location**. This is the core architectural reality of running a multi-branch samgyupsal business:

- Meat stock and waste must be tracked **per location** (Tagbilaran and Panglao have separate kitchens and deliveries)
- Sales and revenue reports are **per branch** (the owner compares branches, not just views aggregate data)
- Staff and kitchen roles are **locked to their assigned location** — they cannot see or affect other branches
- The warehouse (`wh-tag`) is a separate inventory-only location with no POS or floor access
- Even elevated roles (owner, admin, manager) must always know **which location they are currently acting on** before reading or writing anything

**Consequence: `session.locationId` is the single most important piece of state in the entire app.**

This is why:
- `LocationBanner` is permanently mounted in the **root layout** (`+layout.svelte`) — it appears on every authenticated page, not just stock or reports
- The location switcher lives in both the sidebar footer and the banner — it is never buried
- All store reads and writes **must** filter by `session.locationId`
- The sidebar navigation is the persistent shell; the `LocationBanner` is the persistent context

---

## Tech Stack

| Layer         | Technology                                                       |
| ------------- | ---------------------------------------------------------------- |
| Framework     | **SvelteKit** (v2) + **Svelte 5** (runes: `$state`, `$derived`) |
| Styling       | **Tailwind CSS v3** + custom design tokens in `tailwind.config.js` |
| Type Safety   | **TypeScript 5**                                                 |
| State         | Svelte 5 runes (`$state`, `$derived`) in `.svelte.ts` store files |
| UI Components | Custom + **shadcn-svelte** (sidebar, sheet, tooltip, button)     |
| Icons         | `lucide-svelte` — import as `import { IconName } from 'lucide-svelte'` |
| Utils         | `date-fns`, `nanoid`                                             |
| Build         | Vite 5, `@sveltejs/adapter-node`                                 |
| Package Mgr   | **pnpm** (monorepo child at `apps/WTFPOS`)                       |

> **shadcn-svelte note:** Components live in `src/lib/components/ui/`. All `@lucide/svelte/icons/*` deep imports in generated shadcn files must be replaced with `lucide-svelte` named imports — the deep path ships raw `.svelte` files that Node can't execute outside Vite.

---

## Key Commands

```bash
pnpm dev          # Start dev server
pnpm check        # svelte-kit sync + svelte-check (type checking)
pnpm build        # Production build
pnpm lint         # Prettier + ESLint
pnpm format       # Auto-format
```

> Always run `pnpm check` after any change. The known pre-existing error in `vite.config.ts` (Vite version mismatch in monorepo) can be ignored — it does not affect builds.

---

## Project Structure

```
src/
├── app.css                          # Global CSS: Tailwind layers + POS component classes + sidebar CSS vars
├── app.html                         # HTML shell
├── lib/
│   ├── utils.ts                     # cn(), formatCountdown(), formatPeso()
│   ├── version.ts                   # App version + build date
│   ├── types.ts                     # Table, FloorElement, Order, KdsTicket, MenuItem, StockItem…
│   ├── db/
│   │   ├── index.ts                 # RxDB singleton (getDb), collection registration, migrations
│   │   ├── schemas.ts               # All 17 RxDB collection schemas + version numbers
│   │   ├── seed.ts                  # Initial seed data (tables, menu items, stock items)
│   │   └── seed-history.ts          # Historical order/expense seed for reports dev
│   ├── stores/
│   │   ├── session.svelte.ts        # Auth: userName, role, locationId, isLocked + ROLE_NAV_ACCESS
│   │   ├── sync.svelte.ts           # createRxStore() bridge — RxDB → Svelte 5 $state
│   │   ├── pos.svelte.ts            # Re-export shim (legacy) — real logic split into stores/pos/
│   │   ├── pos/                     # POS domain sub-stores
│   │   │   ├── orders.svelte.ts     # Order CRUD, takeout, void, checkout lifecycle
│   │   │   ├── tables.svelte.ts     # Table status, open/close, transfer, merge
│   │   │   ├── kds.svelte.ts        # KDS ticket creation, bump, refuse, history
│   │   │   ├── menu.svelte.ts       # Menu item reads + availability toggle
│   │   │   ├── payments.svelte.ts   # Payment processing, split bill, sub-bills
│   │   │   ├── utils.ts             # calculateOrderTotals(), discount math
│   │   │   ├── item.utils.ts        # deriveOrderItemProps(), item state helpers
│   │   │   ├── payment.utils.ts     # calculateLeftoverPenalty(), VAT helpers
│   │   │   └── label.utils.ts       # getOrderLabel() — table/takeout display labels
│   │   ├── stock.svelte.ts          # Inventory, deliveries, waste, deductions, adjustments
│   │   ├── floor-layout.svelte.ts   # Read-only floor tables/elements for POS floor plan
│   │   ├── floor-editor.svelte.ts   # Floor editor state: drag, resize, select, canvas config
│   │   ├── reports.svelte.ts        # Report queries: sales, expenses, meat, x-read, z-read
│   │   ├── expenses.svelte.ts       # Expense CRUD + category helpers
│   │   ├── audit.svelte.ts          # Audit log store (RxDB backed)
│   │   ├── audit.utils.ts           # log() helper writers for common audit actions
│   │   ├── expenses.utils.ts        # Expense category definitions + formatting
│   │   ├── alert.svelte.ts          # In-app alert banner state (AlertBanner)
│   │   ├── bluetooth-scale.svelte.ts # Web Bluetooth scale connection + weight stream
│   │   ├── hardware.svelte.ts       # Hardware registry (scale, future printer/scanner)
│   │   ├── connection.svelte.ts     # Network online/offline monitor
│   │   ├── device.svelte.ts         # Device heartbeat + registration in RxDB
│   │   ├── db-health.svelte.ts      # RxDB health check + emergency reset trigger
│   │   └── admin-guard.svelte.ts    # Admin-change confirmation modal state
│   └── components/
│       ├── AppSidebar.svelte        # Collapsible left sidebar (icon-rail desktop / Sheet mobile)
│       ├── MobileTopBar.svelte      # Mobile-only top bar with hamburger (md:hidden)
│       ├── TopBar.svelte            # DEPRECATED — do not use in new pages
│       ├── SubNav.svelte            # Tab-style sub-navigation for section pages
│       ├── TableCard.svelte         # Floor table status card with countdown
│       ├── ConnectionStatus.svelte  # Floating online/offline pill (root layout)
│       ├── DbHealthBanner.svelte    # Floating DB health warning + reset button (root layout)
│       ├── AlertBanner.svelte       # Dismissable in-app alert banner
│       ├── HardwareStatus.svelte    # Bluetooth scale + hardware connection indicator
│       ├── NoSaleModal.svelte       # No-sale drawer open confirmation
│       ├── ExpensesModal.svelte     # Quick expense entry modal
│       ├── AdminChangeGuardModal.svelte  # Confirmation guard for admin destructive actions
│       ├── PhotoCapture.svelte      # Camera/file receipt photo capture
│       ├── BluetoothWeightInput.svelte   # Weight input wired to Bluetooth scale
│       ├── BluetoothScalePairModal.svelte # BT scale pairing flow
│       ├── BluetoothScaleStatus.svelte   # Scale connection status badge
│       ├── BluetoothScaleSimulator.svelte # Dev-only scale simulator
│       ├── pos/
│       │   ├── FloorPlan.svelte          # SVG floor plan canvas (reads floor-layout store)
│       │   ├── OrderSidebar.svelte       # Right-side active order panel
│       │   ├── AddItemModal.svelte        # Full-screen menu item picker
│       │   ├── CheckoutModal.svelte       # Payment entry + receipt flow
│       │   ├── ReceiptModal.svelte        # Printed receipt preview
│       │   ├── PaxModal.svelte            # Pax entry on table open
│       │   ├── PaxChangeModal.svelte      # Pax change (manager PIN required)
│       │   ├── PackageChangeModal.svelte  # Package upgrade/change
│       │   ├── VoidModal.svelte           # Item void with reason
│       │   ├── ManagerPinModal.svelte     # 4-digit manager PIN gate
│       │   ├── TransferTableModal.svelte  # Move order to another table
│       │   ├── MergeTablesModal.svelte    # Merge two table orders
│       │   ├── SplitBillModal.svelte      # Bill splitting UI
│       │   ├── LeftoverPenaltyModal.svelte # AYCE leftover penalty entry
│       │   ├── OrderHistoryModal.svelte   # Closed order history browser
│       │   ├── NewTakeoutModal.svelte     # Create takeout order
│       │   ├── TakeoutQueue.svelte        # Takeout orders queue panel
│       │   ├── RefillPanel.svelte         # Refill request panel (AYCE sides)
│       │   └── AllBranchesDashboard.svelte # Owner 'all' location overview
│       ├── kitchen/
│       │   ├── KdsHistoryModal.svelte     # Bumped ticket history viewer
│       │   ├── RefuseReasonModal.svelte   # Kitchen refuse item with reason
│       │   └── YieldCalculatorModal.svelte # Meat yield / portion calculator
│       ├── stock/
│       │   ├── LocationBanner.svelte      # ← Always-visible location context (root layout)
│       │   ├── LocationSelectorModal.svelte
│       │   ├── InventoryTable.svelte      # Full inventory data table
│       │   ├── InventoryItemCard.svelte   # Card view for mobile inventory
│       │   ├── InventoryItemRow.svelte    # Row view for desktop inventory
│       │   ├── InventoryEditModal.svelte  # Edit stock item details
│       │   ├── InventoryToolbar.svelte    # Search/filter/sort toolbar
│       │   ├── InventoryActionModal.svelte # Quick adjust/restock modal
│       │   ├── AllLocationsInventory.svelte # Cross-branch inventory view (owner)
│       │   ├── ReceiveDelivery.svelte     # Delivery receive form
│       │   ├── WasteLog.svelte            # Waste entry + history
│       │   ├── StockCounts.svelte         # AM10/PM4/PM10 count entry
│       │   ├── StockLevelBar.svelte       # Visual stock level indicator
│       │   ├── StockHealthStrip.svelte    # Health strip across stock items
│       │   ├── VarianceBar.svelte         # Count vs. expected variance bar
│       │   ├── ProgressRing.svelte        # Circular progress ring (stock %)
│       │   ├── QuickNumberInput.svelte    # Numpad-style quick number entry
│       │   ├── ProteinDonutChart.svelte   # Protein category donut chart
│       │   ├── ProteinGroupHeader.svelte  # Group header for protein sections
│       │   └── CategoryIcon.svelte        # Stock category icon resolver
│       ├── floor-editor/
│       │   ├── TableSVG.svelte            # SVG table shape renderer (editor mode)
│       │   ├── FloorElementSVG.svelte     # SVG wall/furniture/label renderer
│       │   └── ChairEditorModal.svelte    # Chair configuration modal
│       ├── reports/
│       │   ├── MeatSalesCard.svelte       # Per-cut meat sales summary card
│       │   ├── MeatFlowBar.svelte         # Meat in/out flow bar chart
│       │   ├── MeatOntologyGraph.svelte   # Meat type hierarchy graph
│       │   └── LocationMeatCard.svelte    # Per-location meat card (branch comparison)
│       └── ui/                            # shadcn-svelte generated components (sidebar, sheet, button…)
└── routes/
    ├── +page.svelte                 # LOGIN screen — no sidebar, no LocationBanner
    ├── +layout.svelte               # Root layout (see Layout Architecture below)
    ├── pos/+page.svelte             # POS floor plan + order sidebar
    ├── expenses/+page.svelte        # Quick expense entry page
    ├── dashboard/+page.svelte       # Stub dashboard (Phase 3)
    ├── test-db/+page.svelte         # Dev RxDB health + data inspector
    ├── kitchen/
    │   ├── +layout.svelte           # Kitchen sub-nav
    │   ├── +page.svelte             # Redirect → kitchen/orders
    │   ├── orders/+page.svelte      # KDS queue (active tickets)
    │   ├── all-orders/+page.svelte  # All open orders list view
    │   └── weigh-station/+page.svelte # Bluetooth scale + meat weighing
    ├── stock/
    │   ├── +layout.svelte           # Stock tab nav
    │   ├── +page.svelte             # Redirect → stock/inventory
    │   ├── inventory/+page.svelte   # Inventory list (card + table views)
    │   ├── deliveries/+page.svelte  # Receive deliveries + delivery log
    │   ├── transfers/+page.svelte   # Inter-branch stock transfers
    │   ├── counts/+page.svelte      # AM/PM stock counts
    │   ├── waste/+page.svelte       # Waste log entry
    │   └── receive/+page.svelte     # Receive delivery (alternate entry)
    ├── reports/
    │   ├── +layout.svelte           # Reports grouped tab nav
    │   ├── +page.svelte             # Redirect → reports/x-read
    │   ├── x-read/+page.svelte      # BIR X-Reading (mid-day)
    │   ├── eod/+page.svelte         # Z-Reading / End-of-Day close
    │   ├── expenses-daily/+page.svelte   # Daily expense breakdown
    │   ├── expenses-monthly/+page.svelte # Monthly expense summary
    │   ├── sales-summary/+page.svelte    # Sales by category/package
    │   ├── best-sellers/+page.svelte     # Top menu items by volume
    │   ├── voids-discounts/+page.svelte  # Void + discount audit
    │   ├── profit-gross/+page.svelte     # Gross profit report
    │   ├── profit-net/+page.svelte       # Net profit report
    │   ├── peak-hours/+page.svelte       # Hourly traffic heatmap
    │   ├── staff-performance/+page.svelte # Sales per cashier
    │   ├── table-sales/+page.svelte      # Per-table revenue
    │   ├── meat-report/+page.svelte      # Meat usage vs. sales (ontology)
    │   └── branch-comparison/+page.svelte # Cross-branch side-by-side
    └── admin/
        ├── +layout.svelte           # Admin tab nav
        ├── +page.svelte             # Redirect → admin/users
        ├── users/+page.svelte       # User management
        ├── menu/+page.svelte        # Menu item CRUD
        ├── logs/+page.svelte        # Audit log viewer
        ├── floor-editor/+page.svelte # Visual floor plan editor
        └── devices/+page.svelte     # Registered device list + heartbeat
```

---

## Layout Architecture

The root layout (`+layout.svelte`) is the single shell for all authenticated pages:

```
<ConnectionStatus />          ← floating pill, always rendered (fixed position)
<DbHealthBanner />            ← floating warning banner (fixed), emergency DB reset
{#if showSidebar}
  <SidebarProvider>
    <AppSidebar />            ← collapsible left rail (desktop) / Sheet drawer (mobile)
    <SidebarInset>
      <MobileTopBar />        ← md:hidden — brand + hamburger for mobile
      <LocationBanner />      ← ALWAYS VISIBLE on all authenticated pages
      {children}              ← page/section content
    </SidebarInset>
  </SidebarProvider>
{:else}
  {children}                  ← login page only
{/if}
```

Root layout also mounts a **dev error overlay** (DEV mode only) that captures `window.error` and `unhandledrejection` events and shows them in a fixed panel — useful during development.

On `onMount`, the root layout initialises three global monitors:
- `initConnectionMonitor()` — tracks network online/offline
- `initDeviceHeartbeat()` — registers + pings device record in RxDB
- `initDbHealthCheck()` — polls RxDB health, triggers banner on failure

**Rules:**
- The login page (`/`) opts out of the sidebar via `showSidebar = page.url.pathname !== '/'`
- Section layouts (`kitchen`, `stock`, `reports`, `admin`) use `h-full` not `h-screen` — height is managed by `SidebarInset`
- **Never add `TopBar` to new pages** — it is deprecated. Navigation lives in `AppSidebar`
- **Never add `LocationBanner` to individual section layouts** — it lives in root layout only
- **Never add `ConnectionStatus` or `DbHealthBanner` to page components** — they live in root layout only

---

## Location / Branch Architecture

| Location ID | Display Name              | Type        |
| ----------- | ------------------------- | ----------- |
| `tag`       | Alta Citta (Tagbilaran)   | `retail`    |
| `pgl`       | Alona Beach (Panglao)     | `retail`    |
| `wh-tag`    | Tagbilaran Central Warehouse | `warehouse` |
| `all`       | All Locations             | `retail`    |

**Warehouse locations** hide `/pos` and `/kitchen` routes — they are inventory-only.

**Location scoping rules (non-negotiable):**
1. Every list/query of tables, orders, stock, reports **must** filter by `session.locationId`
2. Every new record created **must** include `locationId: session.locationId`
3. When `session.locationId === 'all'`, show aggregate data or a cross-branch view — never silently filter to one branch
4. `isWarehouseSession()` from `session.svelte.ts` gates POS/floor access
5. Location changes are immediate — `session.locationId = id` triggers reactive updates everywhere via `$derived`

---

## Roles & Access Control

| Role      | Location Switch | Admin Access | Nav Items                           |
| --------- | --------------- | ------------ | ----------------------------------- |
| `owner`   | ✅ Free          | ✅ Yes       | POS, Kitchen, Stock, Reports, Admin |
| `admin`   | ✅ Free          | ✅ Yes       | POS, Kitchen, Stock, Reports, Admin |
| `manager` | ✅ Free          | ❌ No        | POS, Kitchen, Stock, Reports        |
| `staff`   | ❌ Locked        | ❌ No        | POS only                            |
| `kitchen` | ❌ Locked        | ❌ No        | Kitchen, Stock                      |

- `ROLE_NAV_ACCESS` in `session.svelte.ts` is the single source of truth for nav filtering
- `ELEVATED_ROLES = ['owner', 'admin', 'manager']` — can switch locations
- `ADMIN_ROLES = ['owner', 'admin']` — can access `/admin`
- **Manager PIN `1234`** — required for sensitive operations (cancellations, pax changes, refunds, void)

---

## Design System

### Color Tokens (`tailwind.config.js`)

| Token               | Value     | Usage                    |
| ------------------- | --------- | ------------------------ |
| `accent`            | `#EA580C` | Primary brand orange     |
| `accent-dark`       | `#C2410C` | Hover states             |
| `accent-light`      | `#FFF7ED` | Badges, soft backgrounds |
| `surface`           | `#FFFFFF` | Cards, panels            |
| `surface-secondary` | `#F9FAFB` | Page background          |
| `border`            | `#E5E7EB` | Borders, dividers        |
| `status-green`      | `#10B981` | Active, success          |
| `status-yellow`     | `#F59E0B` | Warning                  |
| `status-red`        | `#EF4444` | Danger, critical         |
| `status-purple`     | `#8B5CF6` | Owner/admin badges       |

shadcn-svelte also requires these (already in `tailwind.config.js`):

| Token            | Resolves to                          |
| ---------------- | ------------------------------------ |
| `background`     | `var(--background, #ffffff)`         |
| `sidebar`        | `var(--sidebar, #ffffff)`            |
| `sidebar-accent` | `var(--sidebar-accent, #FFF7ED)`     |

CSS vars are defined in `app.css` under `:root`.

### Reusable CSS Classes (`app.css`)

- `.pos-card` — rounded card with border
- `.btn-primary` / `.btn-secondary` / `.btn-danger` / `.btn-success` / `.btn-ghost`
- `.badge-orange` / `.badge-green` / `.badge-yellow` / `.badge-red`
- `.pos-input` — form input with focus ring
- `.topbar` — DEPRECATED

### Typography

- **Primary font:** Inter
- **Mono font:** JetBrains Mono (prices, timers, codes)

### Touch Targets

All `<button>`, `[role='button']`, and `<a>` have `min-height: 44px` — POS runs on touchscreens.

---

## Development Rules

### Svelte 5 Runes
- Always use `$state()`, `$derived()`, `$effect()` — no legacy `writable`/`readable` stores
- Store files use `.svelte.ts` extension (required for rune context)
- Access store values as `store.value` when using `createRxStore()` bridge
- Use `onclick` not `on:click` (Svelte 5 event syntax)

### TypeScript
- All components use `<script lang="ts">`
- Explicit types for all props and derived values — no `any`
- Union/tag types must be explicitly annotated before assignment (TS narrows to `string` otherwise)

### Styling
- Use `cn()` from `$lib/utils` for all conditional class merging — never string concatenation
- Tailwind CSS v3 only — no v4 syntax
- Use design token classes (`bg-accent`, `text-status-green`) not raw hex values in templates
- Exception: use explicit `bg-white` when shadcn CSS vars haven't resolved (e.g., Sheet overlays)
- `class:` directives cannot use Tailwind `/` opacity modifiers — use `cn()` ternary instead

### Components
- No new external component libraries — shadcn-svelte is the only one
- shadcn components in `src/lib/components/ui/` are owned code — modify freely
- All `@lucide/svelte/icons/*` deep imports in shadcn files → replace with `lucide-svelte` named imports
- New page sections: use `h-full flex flex-col` not `h-screen`

### Navigation & Layout
- New pages/sections: **never** add `<TopBar />` — deprecated
- **Never** add `<LocationBanner />` to section layouts — root layout only
- `AppSidebar` handles both desktop (icon-rail) and mobile (Sheet drawer)
- `MobileTopBar` (`md:hidden`) provides the hamburger trigger on small screens

### Location Scoping
- Every store read returning a list: **filter by `session.locationId`** unless showing `all`
- Every new record: include `locationId: session.locationId` at creation
- Use `isWarehouseSession()` to gate retail-only UI (floor plan, POS, KDS)
- Per-branch color coding: use the `LOCATION_COLORS` map pattern (see `AppSidebar.svelte`)

### Icons
```ts
// Correct
import { ShoppingCart, ChefHat, Package } from 'lucide-svelte';

// Wrong — ships raw .svelte files, breaks Node ESM loader
import ShoppingCart from '@lucide/svelte/icons/shopping-cart';
```

### Packages & Tooling
- Package manager: **pnpm** always — never `npm`, `yarn`, or `npx`
- Use `pnpm dlx` for one-off CLI tools
- Playwright tests: always `pnpm exec playwright`
- Run `pnpm check` after every change — 0 new errors required

---

## Current Phase

```
╔══════════════════════════════════════════════════════════════╗
║  PHASE 1 — LOCAL-FIRST FOUNDATION                  (ACTIVE) ║
║                                                              ║
║  Data:       RxDB + IndexedDB only (fully offline)          ║
║  Cross-branch: SSE kitchen aggregate (read-only, owner)     ║
║  Hardware:   Bluetooth scale (partial)                       ║
║                                                              ║
║  NOT YET ACTIVE:                                            ║
║  • Phase 2 — LAN multi-device replication                   ║
║  • Phase 3 — Neon cloud DB + Ably real-time                 ║
║  • Phase 4 — Full offline-first + conflict resolution       ║
╚══════════════════════════════════════════════════════════════╝
```

Do not implement Phase 2+ features unless the user explicitly triggers a phase change.
Read `skills/architecture/references/PHASE_ROADMAP.md` before starting any phase transition.

---

## Skill Router — Which Skill to Use

Read the matching skill **before** implementing anything in that domain.
Every skill has its own **Human in the Loop** gates and **Self-Improvement Protocol**.

### By task type

| Task | Skill to read first |
|---|---|
| Add/modify RxDB collection, schema, migration, store helper | `skills/rxdb/SKILL.md` |
| Debug RxDB error (SC34, SC36, DXE1, COL12, 409) | `skills/rxdb/SKILL.md` |
| Any cross-layer architectural decision | `skills/architecture/SKILL.md` |
| Moving to a new phase (LAN sync, Neon, Ably) | `skills/architecture/SKILL.md` → **ask user first** |
| Cloud analytics, Neon DB, Drizzle, SQL reports | `skills/neon/SKILL.md` |
| Real-time events, replace SSE, cross-device push | `skills/ably/SKILL.md` |
| Bluetooth scale, GATT, weight parsing, hardware | `skills/bluetooth/SKILL.md` |
| E2E tests, browser automation, UI interaction | `.claude/skills/playwright-cli/SKILL.md` |
| UX audit, design review, usability check, layout assessment | `skills/ux-audit/SKILL.md` |
| Generate role scenarios, implementation assessment, user journeys | `skills/user-scenarios/SKILL.md` |
| Maturity check, PRD alignment, feature completeness, progress report | `skills/check-maturity/SKILL.md` |

### By technology keyword

| Keyword heard | Skill |
|---|---|
| "database", "collection", "schema", "migration", "seed", "offline" | rxdb |
| "sync", "replication", "LAN", "multi-device", "conflict" | rxdb (RXDB_REPLICATION_GUIDE) |
| "how should we…", "what's the best approach", "which phase" | architecture |
| "Neon", "PostgreSQL", "Drizzle", "SQL", "analytics", "cloud backup" | neon |
| "Ably", "real-time", "pub/sub", "channels", "replace SSE", "live" | ably |
| "Bluetooth", "scale", "weight", "GATT", "hardware", "printer" | bluetooth |
| "UX", "usability", "layout", "design review", "audit", "heuristic", "accessibility check" | ux-audit |
| "user scenarios", "create scenarios", "generate scenarios", "role journeys", "as manager", "as staff" | user-scenarios |
| "maturity", "PRD alignment", "how complete", "how mature", "what's missing", "progress report", "readiness" | check-maturity |

### Skill file locations

```
skills/
├── rxdb/           SKILL.md + references/ (RXDB_GUIDE, SCHEMA_VALIDATION, REPLICATION)
├── architecture/   SKILL.md + references/ (ARCHITECTURE_MAP, PHASE_ROADMAP)
├── neon/           SKILL.md + references/ (NEON_GUIDE, NEON_RXDB_BRIDGE)
├── ably/           SKILL.md + references/ (ABLY_WTFPOS_CHANNELS)
├── bluetooth/      SKILL.md + references/ (WEB_BLUETOOTH_GUIDE)
├── ux-audit/       SKILL.md + references/ (DESIGN_BIBLE)
├── user-scenarios/ SKILL.md + references/ (SCENARIO_CONTEXT) + scenarios/ (generated output)
└── check-maturity/ SKILL.md + references/ (MATURITY_FRAMEWORK) + reports/ (generated output)
```

> **Self-Improvement rule:** When the user corrects something a skill states, update the skill
> file immediately before continuing. Use Context7 (`resolve-library-id` + `get-library-docs`)
> to re-fetch library docs when an API may have changed.

---

## RxDB (Local-First Database)

All data is persisted in **RxDB v16** using IndexedDB (Dexie) in the browser. Before doing ANY RxDB work, read the relevant guide:

| Guide | When to read |
|---|---|
| `skills/rxdb/SKILL.md` | Quick reference — workflows, patterns, collection table |
| `skills/rxdb/references/RXDB_GUIDE.md` | Any RxDB work — the 15 core rules |
| `skills/rxdb/references/RXDB_SCHEMA_VALIDATION_GUIDE.md` | Schema errors (SC34, SC36, SC38, DXE1, etc.) |
| `skills/rxdb/references/RXDB_REPLICATION_GUIDE.md` | Multi-device sync, `updatedAt` requirements |

### RxDB Collections (current schema versions)

| Collection       | Schema v | Primary Key  | Notes                                          |
|------------------|----------|--------------|------------------------------------------------|
| `tables`         | 3        | `id`         | Per-location; holds live session + order state |
| `floor_elements` | 2        | `id`         | Walls, dividers, furniture for floor editor    |
| `orders`         | 6        | `id`         | Dine-in + takeout; includes sub-bills          |
| `menu_items`     | 1        | `id`         | Global (no locationId) — shared across branches |
| `stock_items`    | 3        | `id`         | Per-location meat + pantry items               |
| `deliveries`     | 3        | `id`         | Delivery batches with batch/expiry tracking    |
| `waste`          | 3        | `id`         | Waste log entries                              |
| `deductions`     | 2        | `id`         | Auto-deductions tied to order items            |
| `adjustments`    | 3        | `id`         | Manual stock add/deduct adjustments            |
| `stock_counts`   | 2        | `stockItemId`| AM10/PM4/PM10 count slots — one doc per item  |
| `devices`        | 1        | `id`         | Device heartbeat registry                      |
| `expenses`       | 3        | `id`         | Per-location cash/card expenses                |
| `kds_tickets`    | 5        | `id`         | Kitchen display tickets; `bumpedAt` = history  |
| `x_reads`        | 2        | `id`         | BIR X-Reading snapshots                        |
| `z_reads`        | 0        | `id`         | EOD Z-Readings (business date close)           |
| `audit_logs`     | 0        | `id`         | Immutable action log; `meta` is JSON string    |
| `kitchen_alerts` | 0        | `id`         | Refuse/out-of-stock alerts from kitchen        |

> **Schema version bumps** require a migration strategy in `db/index.ts`. Never bump without a migration.

**Non-negotiable rules (always apply):**
- **NEVER** use `.patch()` or `.modify()` — always use `incrementalPatch` / `incrementalModify`
- **Every write** must include `updatedAt: new Date().toISOString()`
- **Guard** all `getDb()` calls with `if (!browser) return`
- **Read from `doc`** inside `incrementalModify`, never from Svelte store state
- **Use `nanoid()`** for primary keys — never sequential IDs
- **Schema version bumps** require migration strategies in `db/index.ts`
- **Every record** must include `locationId` — this enforces branch scoping at the data layer

Key files: `src/lib/db/index.ts` (singleton + migrations), `src/lib/db/schemas.ts` (all 17 schemas), `src/lib/db/seed.ts` (initial seed), `src/lib/db/seed-history.ts` (dev history seed), `src/lib/stores/sync.svelte.ts` (`createRxStore()` bridge).

---

## Philippine-Specific Context

- Currency: **Philippine Peso (₱ / PHP)** — formatted via `formatPeso()` in `utils.ts`
- Locale: `en-PH`
- Discount types: **Senior Citizen (20%)**, **PWD (20%)** — with pro-rata application for AYCE
- Payment methods: **Cash**, **GCash**, **Maya** (local e-wallets)
- Tax: **VAT** (12%)
- Compliance: **BIR** (Bureau of Internal Revenue) X-Readings, Z-Readings

---

## Browser Automation (playwright-cli)

Use `playwright-cli` for interactive browser automation, UI verification, screenshots, and data extraction.
Use `pnpm exec playwright test` for running E2E test suites (`.spec.ts` files).

**Interactive automation (playwright-cli):**
```bash
playwright-cli open http://localhost:5173
playwright-cli snapshot                    # get page state with element refs
playwright-cli click e3                    # click element by ref
playwright-cli fill e5 "text"             # fill input by ref
playwright-cli type "search query"         # type text
playwright-cli press Enter                 # press key
playwright-cli screenshot                  # save screenshot
playwright-cli eval "document.title"       # run JS in page
playwright-cli mousewheel 0 100            # scroll
playwright-cli close                       # close browser
```

**E2E test runner:**
```bash
pnpm exec playwright test e2e/admin-floor.spec.ts              # run specific test file
pnpm exec playwright test e2e/admin-floor.spec.ts --headed     # run with visible browser
pnpm exec playwright test --grep "rotation" --reporter=line    # filter by test name
```

| Guide | When to read |
|---|---|
| `.claude/skills/playwright-cli/SKILL.md` | Quick reference — commands, sessions, snapshots |
| `.claude/skills/playwright-cli/references/test-generation.md` | Generating Playwright tests |
| `.claude/skills/playwright-cli/references/running-code.md` | Running arbitrary Playwright code |
| `.claude/skills/playwright-cli/references/session-management.md` | Managing browser sessions |
| `.claude/skills/playwright-cli/references/storage-state.md` | Cookies, localStorage, sessionStorage |
| `.claude/skills/playwright-cli/references/request-mocking.md` | Mocking network requests |
| `.claude/skills/playwright-cli/references/tracing.md` | Tracing for debugging |
| `.claude/skills/playwright-cli/references/video-recording.md` | Recording video of sessions |

---

## E2E Testing Conventions

### Preferences
- **Timeout:** `test.setTimeout(15_000)` — 15 seconds max per test. No long timeouts.
- **Headed vs headless:** Always **ask the user** whether to run headed or headless before executing tests.
- **Runner:** `pnpm exec playwright test <file> [--headed]`

### Patterns
- **Login helper:** `loginAsOwner(page)` — navigates to `/`, fills credentials, waits for `/pos`.
- **SVG text clicks:** Use `{ force: true }` — SVG `<text>` elements have `pointer-events: none`.
- **Location switching:** Click "Change Location" → wait for modal → click branch button → `waitForTimeout(500)`.
- **Element dropdowns:** Target `.shadow-xl.py-1` for the floor editor element type dropdown.
- **All-locations view:** Owner starts at `locationId: 'all'` — verify via `text=ALL BRANCHES`.
- **POS propagation tests:** Save in floor editor → navigate to `/pos` → switch branch → verify SVG attributes.

### File naming
- `e2e/admin-floor.spec.ts` — Floor editor UI tests
- `e2e/admin-floor-allview.spec.ts` — All-locations view + cross-component propagation tests

---

## PRD Reference

The full Product Requirements Document is at `PRD2.md` in the project root. It covers all 4 modules:

1. **Module 1:** Core Samgyup POS & System Foundation (cashiering, table management, KDS, payments)
2. **Module 2:** Stock Management (end-to-end meat tracking, waste, counts, variance)
3. **Module 3:** Multi-Branch Analytics & Reporting Dashboard (11 report types + expense management)
4. **Module 4:** Administration & System Logs (user management, audit logs)
