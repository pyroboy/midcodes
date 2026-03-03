# WTFPOS — WTF! SAMGYUP POS Software

## Overview

A custom **samgyupsal (Korean BBQ) restaurant POS system** built for "WTF! Samgyupsal", a multi-branch restaurant business in the Philippines. The system handles cashiering, inventory (meat + pantry), expense recording, and analytics across two branches (Quezon City & Makati).

**Client:** WTF! Corporation (Christopher Samonte, CEO)
**Developer:** Arturo Jose T. Magno

---

## Tech Stack

| Layer          | Technology                                                      |
| -------------- | --------------------------------------------------------------- |
| Framework      | **SvelteKit** (v2) + **Svelte 5** (runes: `$state`, `$derived`) |
| Styling        | **Tailwind CSS v3** + custom design tokens in `tailwind.config.js` |
| Type Safety    | **TypeScript 5**                                                |
| State          | Svelte 5 runes (`$state`, `$derived`) in `.svelte.ts` store files |
| UI Components  | Custom — no component library (uses `clsx` + `tailwind-merge` via `cn()`) |
| Icons          | `lucide-svelte`                                                 |
| Utils          | `date-fns`, `nanoid`                                            |
| Build          | Vite 5, `@sveltejs/adapter-node`                               |
| Package Mgr    | **pnpm** (monorepo child at `apps/WTFPOS`)                      |

---

## Key Commands

```bash
pnpm dev          # Start dev server
pnpm check        # svelte-kit sync + svelte-check (type checking)
pnpm build        # Production build
pnpm lint         # Prettier + ESLint
pnpm format       # Auto-format
```

---

## Project Structure

```
src/
├── app.css                          # Global CSS: Tailwind layers + POS component classes
├── app.html                         # HTML shell
├── lib/
│   ├── utils.ts                     # cn(), formatCountdown(), formatPeso()
│   ├── types.ts                     # Table, MenuItem, Order, KdsTicket types
│   ├── stores/
│   │   ├── session.svelte.ts        # Auth state: userName, role, branch, isLocked
│   │   ├── pos.svelte.ts            # Tables, orders, menu items, payment logic
│   │   ├── stock.svelte.ts          # Inventory, receiving, waste, stock counts
│   │   ├── reports.svelte.ts        # Report data (sales, expenses, analytics)
│   │   └── audit.svelte.ts          # Audit log entries + helper writers
│   └── components/
│       ├── TopBar.svelte            # Global nav: Floor | Stock | Reports | Admin + branch selector
│       ├── SubNav.svelte            # Tab-style sub-navigation for section pages
│       ├── TableCard.svelte         # Floor table status card with countdown
│       └── stock/
│           ├── InventoryTable.svelte # Stock inventory grid with inline adjustments
│           ├── ReceiveDelivery.svelte# Delivery receiving form
│           ├── StockCounts.svelte   # Timed stock count form (10am/4pm/10pm)
│           └── WasteLog.svelte      # Waste/trimming log
└── routes/
    ├── +page.svelte                 # LOGIN screen (test accounts + PIN modal)
    ├── +layout.svelte               # Root layout
    ├── floor/+page.svelte           # Table floor map
    ├── register/+page.svelte        # POS register (menu + ticket)
    ├── kds/+page.svelte             # Kitchen Display System
    ├── dashboard/+page.svelte       # Owner dashboard
    ├── expenses/+page.svelte        # Expense tracker
    ├── stock/
    │   ├── +layout.svelte           # Stock sub-nav: Inventory | Receive | Waste | Counts
    │   ├── inventory/+page.svelte
    │   ├── receive/+page.svelte
    │   ├── waste/+page.svelte
    │   └── counts/+page.svelte
    ├── reports/
    │   ├── +layout.svelte           # Reports sub-nav with 11 report tabs
    │   ├── sales-summary/
    │   ├── best-sellers/
    │   ├── peak-hours/
    │   ├── eod/
    │   ├── meat-variance/
    │   ├── table-sales/
    │   ├── expenses-daily/
    │   ├── expenses-monthly/
    │   ├── profit-gross/
    │   ├── profit-net/
    │   └── branch-comparison/
    └── admin/
        ├── +layout.svelte           # Admin sub-nav: Users | Logs
        ├── users/+page.svelte       # User management (CRUD + branch assignment)
        └── logs/                    # Global audit log viewer
```

---

## Design System

### Color Tokens (defined in `tailwind.config.js`)

| Token                 | Value     | Usage                          |
| --------------------- | --------- | ------------------------------ |
| `accent`              | `#EA580C` | Primary brand orange           |
| `accent-dark`         | `#C2410C` | Hover states                   |
| `accent-light`        | `#FFF7ED` | Badges, soft backgrounds       |
| `surface`             | `#FFFFFF` | Cards, panels                  |
| `surface-secondary`   | `#F9FAFB` | Page background                |
| `border`              | `#E5E7EB` | Borders, dividers              |
| `status-green`        | `#10B981` | Active, success                |
| `status-yellow`       | `#F59E0B` | Warning                        |
| `status-red`          | `#EF4444` | Danger, critical               |
| `status-purple`       | `#8B5CF6` | Owner/admin badges             |

### Reusable CSS Classes (in `app.css`)

- `.pos-card` — rounded card with border
- `.btn-primary` / `.btn-secondary` / `.btn-danger` / `.btn-success` / `.btn-ghost` — button variants
- `.badge-orange` / `.badge-green` / `.badge-yellow` / `.badge-red` — status badges
- `.pos-input` — form input with focus ring
- `.topbar` — fixed top navigation bar

### Typography

- **Primary font:** Inter (Google Fonts)
- **Mono font:** JetBrains Mono

### Touch Targets

All `<button>`, `[role='button']`, and `<a>` elements have a `min-height: 44px` baseline for POS touchscreen usability.

---

## Roles & Access Control

| Role      | Branch Switching | Admin Access | Branch Dropdown Visible |
| --------- | ---------------- | ------------ | ----------------------- |
| `owner`   | ✅ Yes           | ✅ Yes       | ✅ Yes                  |
| `admin`   | ✅ Yes           | ✅ Yes       | ✅ Yes                  |
| `manager` | ✅ Yes           | ❌ No        | ✅ Yes                  |
| `staff`   | ❌ Locked        | ❌ No        | ❌ Hidden               |
| `kitchen` | ❌ Locked        | ❌ No        | ❌ Hidden               |

- **Elevated roles** (`owner`, `admin`, `manager`) can switch between branches freely.
- **Non-elevated roles** (`staff`, `kitchen`) are locked to their assigned branch via `session.isLocked`.
- The `setSession(userName, role, branchId)` function in `session.svelte.ts` enforces this.

---

## Branches

| Branch ID | Display Name         |
| --------- | -------------------- |
| `qc`      | Quezon City Branch   |
| `mkti`    | Makati Branch        |
| `all`     | All Branches (owner) |

---

## Data Architecture (Current State)

All data is currently **mock/in-memory** using Svelte 5 `$state` runes in store files. There is no backend or database connected yet. The stores simulate realistic restaurant data:

- **`pos.svelte.ts`** — tables, orders, menu items, payment processing
- **`stock.svelte.ts`** — meat/pantry inventory, deliveries, waste, stock counts
- **`reports.svelte.ts`** — pre-built report data for all 11 report types
- **`audit.svelte.ts`** — action logging with timestamped entries
- **`session.svelte.ts`** — current user, role, branch, lock state

---

## Philippine-Specific Context

- Currency: **Philippine Peso (₱ / PHP)** — formatted via `formatPeso()` in `utils.ts`
- Locale: `en-PH`
- Discount types: **Senior Citizen (20%)**, **PWD (20%)** — with pro-rata application for AYCE
- Payment methods: **Cash**, **GCash**, **Maya** (local e-wallets)
- Tax: **VAT** (12%)
- Compliance: **BIR** (Bureau of Internal Revenue) X-Readings, Z-Readings

---

## Important Patterns

1. **Svelte 5 Runes** — Use `$state()`, `$derived()`, `$effect()` everywhere. No legacy stores (`writable`, `readable`).
2. **`cn()` utility** — Always use `cn()` from `$lib/utils` for conditional class merging (clsx + twMerge).
3. **Component style** — Use `<script lang="ts">` with TypeScript. Use inline `onclick` handlers (Svelte 5 style), not `on:click`.
4. **Touch-first** — All interactive elements must have generous hit areas (min 44px height). Use `.no-select` on navigation.
5. **Branch scoping** — All data operations should respect `session.branch`. Filter by branch when displaying tables, orders, stock, and reports.
6. **Manager PIN** — Sensitive operations (cancellations, pax changes, refunds) require PIN `1234` (hardcoded for now).

---

## PRD Reference

The full Product Requirements Document is at `PRD2.md` in the project root. It covers all 4 modules:

1. **Module 1:** Core Samgyup POS & System Foundation (cashiering, table management, KDS, payments)
2. **Module 2:** Stock Management (end-to-end meat tracking, waste, counts, variance)
3. **Module 3:** Multi-Branch Analytics & Reporting Dashboard (11 report types + expense management)
4. **Module 4:** Administration & System Logs (user management, audit logs)
