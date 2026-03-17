# UX Audit — Dorm App (All Interfaces)

**Date:** 2026-03-17
**App:** DormAdmin Suite (`apps/dorm/`)
**Viewport:** 1440x900 (desktop) + 375x812 (mobile)
**Method:** Playwright snapshots + source code analysis
**Pages Audited:** Auth (login/register/forgot-password), Dashboard, Tenants, Properties, Leases, Payments, Layout/Sidebar

---

## A. Text Layout Maps

### Auth Page (Desktop — 1440x900)

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────┐  ┌─────────────────────────────────┐ │
│ │                         │  │                                 │ │
│ │   [Unsplash Hero BG]   │  │   "Welcome back"        (h1)   │ │
│ │   + dark overlay        │  │   subtitle              (p)    │ │
│ │                         │  │                                 │ │
│ │   ┌─ Logo ──────────┐  │  │   [ Login | Create Account ]   │ │
│ │   │ 🏢 DormAdmin    │  │  │   ────────────────────────────  │ │
│ │   └─────────────────┘  │  │   Email Address         [____]  │ │
│ │                         │  │   Password  Forgot pw?  [____]  │ │
│ │                         │  │                                 │ │
│ │                         │  │   [ ████ Sign In ████ ]        │ │
│ │                         │  │                                 │ │
│ │   ┌─ Testimonial ────┐ │  │   Terms · Privacy              │ │
│ │   │ "This platform…" │ │  │                                 │ │
│ │   │ — Sofia Davis     │ │  │                                 │ │
│ │   └──────────────────┘ │  │                                 │ │
│ └─────────────────────────┘  └─────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
         ~50% width                      ~50% width
```

### Auth Page (Mobile — 375x812)

```
┌───────────────────────┐
│  (hero panel hidden)  │
│                       │
│  "Welcome back" (h1)  │
│  subtitle             │
│                       │
│  [ Login | Register ] │
│  ───────────────────  │
│  Email      [______]  │
│  Password   [______]  │
│  Forgot password?     │
│                       │
│  [ ██ Sign In ██ ]   │
│                       │
│  Terms · Privacy      │
└───────────────────────┘
```

### Dashboard (from source)

```
┌────┬───────────────────────────────────────────────┐
│ S  │                                               │
│ I  │  "Welcome to Dorm Management"                 │
│ D  │   subtitle text                               │
│ E  │                                               │
│ B  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ A  │  │Props │ │Tennt │ │Lease │ │Paymnt│  4-col  │
│ R  │  │  --  │ │  --  │ │  --  │ │  --  │  grid   │
│    │  └──────┘ └──────┘ └──────┘ └──────┘        │
│ N  │                                               │
│ A  │  Quick Actions:                               │
│ V  │  [+ Add Property] [+ Add Tenant] [+ Lease]   │
│    │                                               │
│    │                                               │
└────┴───────────────────────────────────────────────┘
```

### Tenants Page (from source)

```
┌────┬───────────────────────────────────────────────┐
│    │ ┌─sticky header──────────────────────────────┐│
│ S  │ │ "Tenants Dashboard"                        ││
│ I  │ │ [Active:12] [Total:15] [Inactive] [Pend]  ││
│ D  │ │ [🔍 Search...] [Status ▼] [▦ ▤] [+Add]   ││
│ E  │ └───────────────────────────────────────────┘│
│ B  │                                               │
│ A  │ Active Filter: ACTIVE (12 of 15) [Show All]  │
│ R  │                                               │
│    │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│    │ │Tenant│ │Tenant│ │Tenant│ │Tenant│  4-col  │
│    │ │Card 1│ │Card 2│ │Card 3│ │Card 4│  grid   │
│    │ └──────┘ └──────┘ └──────┘ └──────┘        │
│    │ ┌──────┐ ┌──────┐ ...                       │
└────┴───────────────────────────────────────────────┘
```

### Leases Page (from source)

```
┌────┬───────────────────────────────────────────────┐
│    │ ┌─sticky header with scrollable cards────────┐│
│ S  │ │ [Total] [Paid✓] [Pending⏰] [Partial⚠] [Overdue⚠]│
│ I  │ │  w-20   w-20    w-20+amt    w-20+amt   w-20+amt │
│ D  │ └───────────────────────────────────────────┘│
│ E  │                                               │
│ B  │ [🖨 Print All]  [+ Add Lease]                │
│ A  │                                               │
│ R  │ Filter: PENDING (3 of 12) [Show All]         │
│    │                                               │
│    │ ┌─glass card─────────────────────────────────┐│
│    │ │ Lease list items...                        ││
│    │ └───────────────────────────────────────────┘│
└────┴───────────────────────────────────────────────┘
```

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | **Hick's Law** (fewer choices = faster decisions) | CONCERN | Dashboard has 15+ sidebar items visible at once. Lease filter cards crowd the header. No progressive disclosure. |
| 2 | **Miller's Law** (7±2 chunks) | CONCERN | Sidebar nav shows 4 categories × 3-4 items = ~14 links. Lease header shows 5 metric cards in a row. Tenants page has 5 status filter badges + search + dropdown + view toggle + add button. |
| 3 | **Fitts's Law** (target size & distance) | CONCERN | Lease summary cards shrink to `w-20` (80px) on mobile with `text-[10px]` labels — very small touch targets. Delete uses browser `confirm()` — no custom dialog. |
| 4 | **Jakob's Law** (match user expectations) | PASS | Standard SaaS layout: sidebar + content area. Tab-based auth. Card grids. Filter badges. Follows established patterns. |
| 5 | **Doherty Threshold** (<400ms response) | PASS | SvelteKit preloading on hover, skeleton loading states, client-side caching with TTL. Lazy loading with progress indicator. |
| 6 | **Visibility of System Status** | FAIL | Registration form shows **no feedback** on submit (no error, no success, no loading indicator visible in snapshot). Dashboard metrics display `--` permanently. Payment modal shows "temporarily disabled" with no timeline. |
| 7 | **Gestalt: Proximity** | PASS | Related items grouped well: form fields, metric cards, action buttons. Status badges form a clear group. |
| 8 | **Gestalt: Similarity** | PASS | Consistent card styles across pages. Status colors (green/yellow/red) used uniformly. Badge patterns reused. |
| 9 | **Visual Hierarchy** | CONCERN | Dashboard hero text is large but metric cards all show `--`, making the whole section feel empty/broken. Leases page header metric cards compete with action buttons for attention. |
| 10 | **Information Density** | CONCERN | Payment cards show 6+ fields (amount, method, date, unit, floor, wing, type, utility type) — high density. Lease header tries to show 5 cards with amounts in a narrow scrollable strip. |
| 11 | **WCAG: Color Contrast** | CONCERN | Status text at `text-[10px]` on colored backgrounds (e.g., `bg-green-100` with small green text) likely fails 4.5:1 ratio. CSP blocks the auth hero image, leaving a broken/invisible left panel. |
| 12 | **WCAG: Keyboard/Focus** | CONCERN | Minimal explicit ARIA attributes found. Relies on semantic HTML (good baseline) but filter badges are `<button>` with no `aria-pressed` state. No skip-to-content link. |
| 13 | **Consistency: Internal** | CONCERN | Delete confirmation uses browser `confirm()` on some pages but custom dialogs on others. Properties page uses 2-column form layout; other pages use modals. Payment revert uses browser `prompt()` — inconsistent with the rest of the app. |
| 14 | **Consistency: External** | PASS | shadcn-svelte provides industry-standard components. Auth page follows the common split-screen SaaS pattern. |

### Verdict Summary
- **PASS:** 6
- **CONCERN:** 7
- **FAIL:** 1

---

## C. Best Day Ever — Property Manager Narrative

> *It's Monday morning. Maria opens DormAdmin Suite to check on weekend activity. She logs in — the split-screen auth page looks professional, though the left panel's background image doesn't load (CSP blocks Unsplash). She enters her credentials and signs in.*
>
> *The dashboard greets her with "Welcome to Dorm Management" but all four metric cards show "--". She frowns — she has 3 properties and 47 tenants, but the dashboard doesn't reflect this. She clicks through to Tenants.*
>
> *The tenants page is much better — a sticky header with color-coded status badges shows her counts at a glance. She filters to ACTIVE tenants and the grid updates. The search works. She needs to add a new tenant and clicks the gradient blue button.*
>
> *Later, she checks lease payments. The header metric cards are small and she has to squint at the amounts — the `₱` values in tiny text. She wants to record a payment but clicks the card and sees "Payment editing functionality is temporarily disabled." She sighs and opens a spreadsheet instead.*
>
> *She tries to delete an old property listing. A plain browser `confirm()` dialog appears — jarring compared to the polished UI. She clicks OK and it works, but the experience feels inconsistent.*
>
> *On her phone during lunch, she checks the auth page — it adapts well, hiding the hero panel. But the lease status cards are tiny (80px wide with 10px text) and hard to tap accurately.*

---

## D. Prioritized Recommendations

### P0 — Critical (fix before next release)

| # | Issue | Effort | Impact | Details |
|---|-------|--------|--------|---------|
| P0-1 | **Registration gives no feedback** | S | High | After clicking "Create Account", no loading spinner, error, or success message is visible. Users don't know if registration worked. Add loading state + toast/inline message. |
| P0-2 | **CSP blocks auth hero image** | S | High | `img-src` policy doesn't allow `unsplash.com`. Either self-host the image or add `https://images.unsplash.com` to CSP `img-src`. Currently the left panel renders broken. |
| P0-3 | **CSP blocks Vite HMR websocket** | S | Med | `connect-src` uses `ws://localhost:*` but Vite connects via `ws://127.0.0.1:*`. Add `ws://127.0.0.1:*` to dev CSP or use `ws://*:5173` in dev mode. |
| P0-4 | **Dashboard metrics show "--" permanently** | M | High | All 4 metric cards (Properties, Tenants, Leases, Payments) display `--` instead of actual counts. Either wire up real data or remove the cards. Showing empty metrics undermines trust. |
| P0-5 | **Payment editing "temporarily disabled"** | M | High | Users can click payment cards expecting to edit, but get a dead-end message. Either implement editing or remove the clickable affordance and show a clear "view-only" state. |

### P1 — Important (next sprint)

| # | Issue | Effort | Impact | Details |
|---|-------|--------|--------|---------|
| P1-1 | **Replace browser `confirm()`/`prompt()` with custom dialogs** | M | Med | Properties deletion, tenant deletion, and payment revert use native browser dialogs. These are inconsistent with the polished shadcn UI and can't be styled or branded. Use `AlertDialog` from shadcn-svelte. |
| P1-2 | **Lease header cards too small on mobile** | S | Med | `w-20` (80px) cards with `text-[10px]` labels are below comfortable touch/read size. Use horizontal scroll with `min-w-[100px]` and `text-xs` minimum. |
| P1-3 | **Properties page uses 2-column layout inconsistently** | M | Med | Properties has a side-by-side list+form layout while Tenants/Leases/Payments use modal forms. Pick one pattern. Modal is more consistent with the rest of the app. |
| P1-4 | **No `aria-pressed` on filter badges** | S | Med | Status filter badges (Tenants, Leases) are clickable `<button>` elements acting as toggles but lack `aria-pressed` attribute. Screen readers can't convey active state. |
| P1-5 | **Sidebar navigation overload** | M | Med | 14 links across 4 categories shown simultaneously. Consider collapsible category groups (accordion pattern) or highlighting the most-used items. |
| P1-6 | **No skip-to-content link** | S | Low | Keyboard users must tab through the entire sidebar to reach main content. Add a visually-hidden skip link. |

### P2 — Nice to Have (backlog)

| # | Issue | Effort | Impact | Details |
|---|-------|--------|--------|---------|
| P2-1 | **Auth heading says "Welcome back" on registration tab** | S | Low | The h1 "Welcome back" and subtitle "Enter your credentials" don't change when switching to "Create Account" tab. Should say "Create your account" or similar. |
| P2-2 | **No i18n framework** | L | Low | All strings hardcoded in English. If multi-language support is planned, set up a framework early. Not urgent if English-only. |
| P2-3 | **Dead links: /terms and /privacy** | S | Low | Auth page links to `/terms` and `/privacy` routes that likely don't exist. Either create placeholder pages or remove the links. |
| P2-4 | **Payment card information density** | M | Low | Payment cards show 6+ fields. Consider a summary view with expandable details, or a table layout for scan-ability. |
| P2-5 | **Testimonial quote is placeholder** | S | Low | "Sofia Davis, Senior Property Manager" is a generic placeholder. Either use a real testimonial or remove the section. |
| P2-6 | **3D Property Viewer feature-flagged off** | — | — | Feature exists in code but is disabled. No UX impact currently, but consider removing dead code if not planned for near future. |

---

## Summary

| Metric | Value |
|--------|-------|
| Pages audited | 8 (auth login/register/forgot-pw, dashboard, tenants, properties, leases, payments) |
| PASS | 6/14 principles |
| CONCERN | 7/14 principles |
| FAIL | 1/14 principles (Visibility of System Status) |
| P0 issues | 5 |
| P1 issues | 6 |
| P2 issues | 6 |

**Overall Assessment:** The dorm app has a solid design foundation — shadcn-svelte components provide consistency, responsive breakpoints are thoughtful, and the tenants page demonstrates excellent filter/search patterns. However, several high-impact issues undermine the experience: the dashboard shows placeholder data (`--`), registration gives zero feedback, CSP misconfiguration breaks the auth hero panel, and native browser dialogs clash with the polished UI. Fixing the 5 P0 items would significantly improve first impressions and daily usability.
