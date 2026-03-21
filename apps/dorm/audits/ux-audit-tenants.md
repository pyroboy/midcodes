# UX Audit: /tenants — Tenants Dashboard

**Date**: 2026-03-21
**Auditor**: Claude (automated UX audit)
**Route**: `/tenants`
**Components**: `+page.svelte`, `TenantCard.svelte`, `TenantTable.svelte`, `TenantFormModal.svelte`
**Viewports**: Desktop 1440×900, Mobile 375×812
**Data**: 95 tenants (47 active, 46 inactive, 2 pending, 0 blacklisted)

---

## Screenshots

| View | File |
|------|------|
| Desktop card view (1440×900) | `audit-tenants-desktop-1440.png` |
| Desktop full page | `audit-tenants-desktop-full.png` |
| Desktop list view | `audit-tenants-desktop-list.png` |
| Desktop create modal (top) | `audit-tenants-desktop-create-modal.png` |
| Mobile card view (375×812) | `audit-tenants-mobile-375.png` |
| Mobile full page | `audit-tenants-mobile-full.png` |
| Mobile create modal (top) | `audit-tenants-mobile-create-modal.png` |

---

## UXI Scoring

### D1: Task Efficiency (Weight: 20%) — Score: 6/10

**Evidence:**
- **Create tenant**: 1 click to open modal → fill ~8-15 fields → submit = 3+ clicks minimum. No pre-fill except status (PENDING default). Good.
- **Edit tenant**: 1 click (Edit button) → modal with pre-filled fields → submit = 2 clicks. Good.
- **Delete tenant**: 1 click (Delete) → confirmation dialog → confirm = 2 clicks. Appropriate safety.
- **Search**: type in search box, 300ms debounce. Good.
- **Filter by status**: 1 click on stat button. Excellent — dual-purpose KPI + filter.
- **View toggle**: persisted to localStorage. Good memory.
- **No keyboard shortcuts**: No Enter-to-submit shortcut documented. No auto-focus on first field in create modal.
- **Too many fields in create form**: For the common case (just name + contact), 15 fields is excessive. Most fields are optional but all visible simultaneously.

**Deductions**: No auto-focus, no keyboard shortcuts, high field count for common case.

### D2: Scroll & Density (Weight: 15%) — Score: 4/10

**Evidence:**
- **Card view on mobile**: Each card is ~400px tall (160px avatar + name + contact + lease info + buttons). 47 active tenants = ~18,800px of scrolling = **23 screenfuls** on mobile (812px viewport). This is the "Wall of Cards" problem from UX Bible 6.1.
- **Card view on desktop**: 4 columns × 12 rows (with pagination at 24) = 6 rows visible above fold ≈ 2-3 screenfuls. Acceptable.
- **List view on desktop**: Compact rows, ~10 visible above fold. Good density.
- **List view on mobile**: Not tested separately — table with horizontal scroll likely. Table headers use `text-xs sm:text-sm`, action buttons have `min-w-[44px] min-h-[44px]`. Functional.
- **Create modal**: Profile picture upload (large circle) + 4 sections × 2-4 fields each = ~1200px form height. On mobile (812px viewport - header) = **3-4 screenfuls**. No sticky submit button — CTA hidden below fold.
- **No input pairing on mobile**: Name and Status are on separate rows even though they could pair. Birthday uses 3 separate inputs (MM/DD/YYYY) — good compact pattern.
- **Pagination at 24**: Good cap on DOM nodes per UX Bible 6.6.

**Critical issues**: Cards too tall on mobile (160px avatar), modal CTA not sticky, no collapsible sections.

### D3: Information Architecture (Weight: 15%) — Score: 7/10

**Evidence:**
- **Stat buttons**: Clear labels (Active/Total/Inactive/Pending/Blacklisted) with counts. Double as filters. Excellent pattern.
- **Card info hierarchy**: Name → Contact (email, phone) → Lease info → Actions. Logical flow.
- **Status badge on card**: Positioned below avatar with icon + text. Clear but somewhat redundant when filtering by status (all cards show same badge).
- **Lease info on card**: Shows lease name + unit. Useful cross-reference.
- **List view columns**: Tenant | Contact | Status | Lease Info | Actions. Good column selection.
- **Mobile status abbreviations in table**: "ACT", "INA", "PEN", "BLK" — potentially confusing. "ACTIVE" would be clearer even if it wraps.
- **"Tenant List (47)" heading**: Redundant with stat buttons showing counts above. Minor noise.
- **Modal sections**: Profile Picture → Personal Info → Contact → Additional → Emergency Contact. Clear grouping with icons + headers + border separators.

**Minor issues**: Redundant count display, abbreviated status labels on mobile.

### D4: Input Quality (Weight: 15%) — Score: 6.5/10

**Evidence:**
- **Touch targets (cards)**: Edit/Delete buttons are `h-11` (44px) ✅. Stat filter buttons are `px-3 py-2` (~36px height) ❌ — below 44px minimum.
- **Touch targets (table)**: Action buttons have `min-w-[44px] min-h-[44px]` ✅.
- **Search input**: No `inputmode` specified (default text — correct for name search).
- **Phone field**: `type="tel"` ✅ but no `inputmode="tel"` explicitly set. The `type="tel"` should trigger phone keyboard.
- **Email field**: `type="email"` ✅.
- **Input font size**: Uses shadcn defaults — likely 14px on mobile ❌. If Input component doesn't override to 16px, iOS will zoom on focus.
- **No auto-focus**: Create modal doesn't auto-focus the "Full Name" field.
- **Tab order**: Follows DOM order (picture → name → status → birthday → address → email → phone → facebook → school → emergency). Logical but long.
- **Birthday input**: MM/DD/YYYY with 3 separate fields. No `inputmode="numeric"` visible on the birthday inputs (would need to check BirthdayInput component).
- **View toggle buttons**: `size="sm"` with `px-3` — likely 32px height, but desktop-only concern.
- **Textarea for address**: Uses `rows={2}` for home address, `rows={3}` for emergency address. Appropriate sizing.

**Deductions**: Stat buttons below 44px touch target, no auto-focus, potential iOS zoom issue.

### D5: Visual Hierarchy (Weight: 10%) — Score: 7/10

**Evidence:**
- **Card layout**: Clean design with rounded corners (`rounded-2xl`), subtle shadow, gradient background. Professional aesthetic.
- **Avatar prominence**: 160×160px avatar dominates each card. Good for recognition but excessive space.
- **Status badge colors**: Uses `getStatusClasses()` — consistent color coding (green/gray/yellow/red). Good semantic color use.
- **Section headers in modal**: Icon + bold text + border-bottom separator. Clear visual grouping. ✅
- **Typography scale**: Headings `text-2xl`, card names `text-2xl`, labels `text-sm`. Card names at `text-2xl` feel oversized for a list item.
- **Sticky header**: `sticky top-0 z-10 bg-white/80 backdrop-blur-md` — excellent implementation with blur effect.
- **Stat buttons**: Color-coded backgrounds (green-50, blue-50, gray-50, yellow-50, red-50) with active ring states. Clear visual feedback.
- **No `tabular-nums`**: Not applicable here (no monetary values), but counts in stat buttons would benefit from fixed-width digits.
- **Empty state**: Good — shows relevant icon (UserX for filtered empty, Users for truly empty) with CTA to add first tenant.

**Minor issues**: Oversized avatars and card names reduce scannability.

### D6: Progressive Disclosure (Weight: 10%) — Score: 4/10

**Evidence:**
- **Create modal shows ALL fields at once**: Profile picture + personal info + contact + additional info + emergency contact = ~15 fields visible immediately. No collapsible sections.
- **Emergency contact section**: All 5 fields (name, relationship, phone, email, address) always visible even though labeled "(All fields optional)". Should be collapsible.
- **Profile picture section**: Large upload zone always visible even though "(Optional)". Could be collapsed by default.
- **Additional Information section**: Just one field (School/Workplace). Could be merged into Personal Information.
- **Lease info on cards**: Shows up to 2 leases with "+N more" — good progressive disclosure.
- **No conditional fields**: All fields shown regardless of context. No smart showing/hiding based on tenant type.
- **Disclosure ratio**: ~15 fields visible at open / ~3 fields essential (name, status, contact) = 0.20 — very poor. Ideal is >0.5.

**Critical issue**: Form is a wall of inputs with no collapsible sections. Only name is required.

### D7: Feedback & Safety (Weight: 15%) — Score: 7.5/10

**Evidence:**
- **Submit button state**: Shows "Creating...", "Saving...", "Uploading Image...", "Creating & Uploading..." — context-aware loading text. ✅
- **Submit disabled**: `disabled={isSubmitting || uploadingImage}` — prevents double-submit. ✅
- **Delete confirmation**: AlertDialog with tenant name + active lease warning. Excellent safety. ✅
- **Unsaved changes guard**: Tracks form changes, shows "Unsaved Changes" dialog on close attempt. ✅
- **Scroll progress indicator**: Thin progress bar at top of modal showing scroll position. Nice touch.
- **Success feedback**: Toast messages ("Tenant updated", "Tenant created", "Tenant archived"). ✅
- **Optimistic updates**: Uses `bufferedMutation` — instant UI feedback with background sync. ✅ (Doherty threshold met)
- **Validation**: `validationMethod: 'onsubmit'` — no after-blur validation. ❌ Per UX Bible, after-blur validation gives +22% success rate.
- **Error display**: Red border + icon + message below each field. Clear and specific. ✅
- **No duplicate guard**: No check for creating a tenant with the same name. Minor concern.
- **Conflict handling**: Uses `CONFLICT_MESSAGE` for 409 responses. ✅

**Deductions**: No after-blur validation, no duplicate name guard.

---

## UXI Composite Score

```
UXI = (D1×0.20) + (D2×0.15) + (D3×0.15) + (D4×0.15) + (D5×0.10) + (D6×0.10) + (D7×0.15)
    = (6.0×0.20) + (4.0×0.15) + (7.0×0.15) + (6.5×0.15) + (7.0×0.10) + (4.0×0.10) + (7.5×0.15)
    = 1.20 + 0.60 + 1.05 + 0.975 + 0.70 + 0.40 + 1.125
    = 6.05
```

### **UXI: 6.05 — Grade C** (Acceptable — users can complete but feel friction)

---

## Issue Catalog

### P0 — Critical (blocks UXI above 6)

| # | Issue | Dimension | Fix |
|---|-------|-----------|-----|
| P0-1 | **Card avatar 160px is too large on mobile** — each card is ~400px tall, causing 23 screenfuls for 47 tenants | D2 | Reduce avatar to 64px on mobile, 80px on desktop. Use compact card rows on mobile per UX Bible 6.1 |
| P0-2 | **Create/Edit modal has no collapsible sections** — ~15 fields visible at once, 3-4 screenfuls on mobile | D6, D2 | Collapse "Profile Picture", "Additional Information", and "Emergency Contact" sections by default. Only show Personal Info + Contact open |
| P0-3 | **Submit button not visible on mobile** — CTA hidden below 3+ screenfuls of form | D2 | Add sticky footer with submit/cancel buttons on mobile (`position: sticky; bottom: 0`) |

### P1 — High

| # | Issue | Dimension | Fix |
|---|-------|-----------|-----|
| P1-1 | **Stat filter buttons below 44px touch target** — `px-3 py-2` ≈ 36px height | D4 | Add `min-h-[44px]` to stat buttons on mobile |
| P1-2 | **No auto-focus on create modal** — user must tap the Name field manually | D1 | Add `autofocus` to the Full Name input when modal opens |
| P1-3 | **Input font-size potentially <16px on mobile** — causes iOS Safari zoom on focus | D4 | Verify shadcn Input component uses `text-base` (16px) on mobile. If not, add `text-base sm:text-sm` |
| P1-4 | **No after-blur validation** — currently `validationMethod: 'onsubmit'` only | D7 | Switch to `validationMethod: 'oninput'` or implement after-blur for required fields (+22% success rate per Wroblewski) |
| P1-5 | **"Blacklisted" stat button gets clipped on mobile** — horizontal scroll with hidden scrollbar gives no scroll hint | D4, D3 | Ensure all stat buttons are visible or add a visible scroll indicator / truncate to icon-only on narrow screens |

### P2 — Medium

| # | Issue | Dimension | Fix |
|---|-------|-----------|-----|
| P2-1 | **Card names at `text-2xl` (24px) are oversized** — reduces scannability when scanning 24 cards per page | D5 | Reduce to `text-lg` (18px) or `text-xl` (20px) |
| P2-2 | **Redundant count display** — "Tenant List (47)" repeats the stat button count | D3 | Remove the count from the heading or remove the heading entirely (stat buttons already communicate this) |
| P2-3 | **Mobile status abbreviations** — "ACT", "INA", "PEN", "BLK" in table view are non-standard and unclear | D3 | Use full status text with wrapping, or use icon-only with tooltip on mobile |
| P2-4 | **"Additional Information" section has only 1 field** — wasteful section overhead | D6, D2 | Merge School/Workplace into "Personal Information" section |
| P2-5 | **No view toggle visible on mobile card view** — users can't discover list view exists | D1 | Ensure view toggle is visible and functional on mobile |
| P2-6 | **Delete button equally prominent as Edit** — both `w-full h-11` side by side. Destructive action should be de-emphasized | D7, D5 | Make Edit primary/full-width, Delete icon-only or smaller. Or use dropdown menu for secondary actions |

### P3 — Low

| # | Issue | Dimension | Fix |
|---|-------|-----------|-----|
| P3-1 | **No URL-based view mode persistence** — view mode (card/list) is localStorage only, not in URL | D1 | Consider adding `?view=list` URL param alongside localStorage |
| P3-2 | **Scroll progress bar in modal** is a nice touch but the bar is very thin (2px) — hard to notice | D7 | Increase to 3-4px or add a percentage indicator |
| P3-3 | **No tenant count in page title/tab** — browser tab just shows route name | D3 | Set `<title>Tenants (47) | Dorm</title>` |
| P3-4 | **Card hover effect** (`hover:shadow-md`) is desktop-only — no touch feedback on mobile | D7 | Add `active:scale-[0.98]` or `active:bg-slate-50` for tap feedback |
| P3-5 | **Stat button `hover:scale-105`** — scale transforms on buttons feel non-standard for a management app (Jakob's Law) | D5 | Remove `hover:scale-105`, rely on background color change only |

---

## Domain Pattern Compliance (UX Bible Section 6)

| Pattern | Status | Notes |
|---------|--------|-------|
| 6.1 Wall of Cards | ❌ Partially | Stat buttons as filters ✅, but cards are too large on mobile. No compact card rows. No severity gradient (N/A for tenants — no urgency signal needed) |
| 6.4 Cross-Screen Workflows | ⚠️ Partial | Desktop list view ✅, mobile card view ✅, but mobile list view needs work (table cramped on 375px). View toggle needs better mobile visibility |
| 6.5 Dashboard Scanning | ✅ Good | F-pattern: stat buttons across top (horizontal sweep), tenant names on left edge (vertical scan) |
| 6.6 Table→Card Conversion | ⚠️ Partial | Has both views ✅, pagination at 24 ✅. But card view doesn't follow "compact card rows" recommendation — full cards are used instead |

## Cognitive Psychology Compliance (UX Bible Section 7)

| Principle | Status | Notes |
|-----------|--------|-------|
| 7.1 Hick's Law | ⚠️ | 47 cards = ~5.5 bits of entropy. Stat filters reduce to ~2.3 bits ✅. But no search-as-you-type highlight, no category grouping |
| 7.2 Miller's Law | ✅ | Cards chunk info into 3 sections (identity/lease/actions). Modal groups into 5 sections with headers |
| 7.3 Fitts's Law | ⚠️ | Edit/Delete buttons are full-width in cards ✅ (easy target). But "Add Tenant" is small and far from content on desktop |
| 7.4 Jakob's Law | ✅ | Follows standard property management patterns: sidebar nav, status badges, profile cards, CRUD modals |
| 7.5 Doherty Threshold | ✅ | Optimistic updates via bufferedMutation — instant UI response. RxDB local reads are instant |
| 7.6 Serial Position | ⚠️ | Sorted alphabetically (not by relevance). "Add Tenant" in header (primacy) ✅, but no recency anchor |

---

## Recommended Fix Priority

1. **P0-1 + P0-2 + P0-3**: Fix mobile card size + add collapsible modal sections + sticky CTA → **UXI D2: 4→7, D6: 4→7** → projected UXI: ~7.1 (Grade B)
2. **P1-1 through P1-5**: Touch targets, auto-focus, iOS zoom, validation → **UXI D4: 6.5→8, D1: 6→7** → projected UXI: ~7.6
3. **P2-1 through P2-6**: Visual refinements → **UXI D5: 7→8, D3: 7→8** → projected UXI: ~8.0 (Grade A)

**Projected UXI after all P0+P1 fixes: ~7.6 (Grade B)**
**Projected UXI after all fixes: ~8.2 (Grade A)**
