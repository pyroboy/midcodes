# UX Audit: Kitchen Header — Kitchen Role @ Alta Citta

**Date:** 2026-03-21
**Page:** `/kitchen/*` layout header (SubNav + Focus Badge + BT Scale)
**Role:** Kitchen (Lito Paglinawan — Stove focus)
**Branch:** Alta Citta (Tagbilaran) — `tag`
**Viewport:** 1024x768 (tablet) + 375x667 (mobile)
**Theme:** Light
**Snapshots Used:** 7

---

## A. Text Layout Map

### Tablet (1024x768) — Full Header Stack

```
┌──────────────────────────────────────────────────────────────────────┐
│ ┌────┐                                                              │
│ │ W! │  [Kitchen icon] Kitchen   [Stock icon] Stock   ── [L] avatar │ ← AppSidebar (collapsed rail, 48px wide)
│ └────┘                                                              │
├──────────────────────────────────────────────────────────────────────┤
│ ◎ ALTA CITTA (TAGBILARAN)                               ● Live     │ ← StatusBar (root layout) — h≈40px
├══════════════════════════════════════════════════════════════════════┤ ← border-b #1 (layout wrapper)
│ 🧾All Orders │ 📋Dispatch │ ⚖️Weigh Station │ 🍳Stove ┃ 🍳Stove Station ┃ ⚡BT Scale │
├──────────────────────────────────────────────────────────────────────┤ ← border-b #2 (SubNav inner)
│                                                                      │
│                        PAGE CONTENT AREA                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Header zones (left to right on kitchen nav bar):**
- **Zone 1 — SubNav tabs**: 4 links (All Orders, Dispatch, Weigh Station, Stove) — scrollable on overflow
- **Zone 2 — Focus Badge**: "🍳 Stove Station" pill — `hidden md:flex` (desktop only)
- **Zone 3 — BT Scale**: Bluetooth scale status button — `hidden sm:block` (hidden on xs)

**Total fixed header height** (above page content):
- MobileTopBar: 0px (hidden on md+)
- StatusBar: ~40px
- Kitchen SubNav bar: ~44px
- **Total: ~84px** of 768px viewport = **10.9% of screen** consumed by header

### Mobile (375x667) — Collapsed Header

```
┌────────────────────────────┐
│ W!  WTF! SAMGYUP           │ ← MobileTopBar (hamburger + brand)
├────────────────────────────┤
│ ◎ ALTA CITTA (TAGBILARAN)  ● Live │ ← StatusBar
├════════════════════════════┤
│ 🧾All Orders │ 📋Dispatch │ ⚖️Weigh Station │ 🍳Stove │ ← SubNav (scrollable)
├────────────────────────────┤
│                            │
│      PAGE CONTENT          │
│                            │
└────────────────────────────┘
```

**Mobile header total:** MobileTopBar (~48px) + StatusBar (~40px) + SubNav (~44px) = **~132px of 667px = 19.8%**

**Hidden on mobile:** Focus Badge (md:flex), BT Scale (sm:block)

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|-----------|---------|----------|----------------|
| 1 | **Hick's Law** (choice count) | **PASS** | 4 sub-nav tabs — within 4±1 optimal range. Focus badge adds context, not choice. | — |
| 2 | **Miller's Law** (chunking) | **PASS** | Header chunks into 3 clear zones: nav tabs / focus badge / BT status. Gestalt proximity groups them visually. | — |
| 3 | **Fitts's Law** (touch targets) | **CONCERN** | SubNav links have `min-height:44px` (meets minimum), but padding is tight at `px-2.5 sm:px-3`. On mobile with 4 tabs, tap zones are narrow (~80px per tab). BT Scale button is 56x56px (good). | Increase `px-3` to `px-4` on sm+ for more generous tap zones. |
| 4 | **Jakob's Law** (conventions) | **PASS** | Tab bar with underline indicator is standard pattern. Active tab uses accent orange underline — conventional. | — |
| 5 | **Doherty Threshold** (400ms) | **PASS** | RxDB local-first means tab switches are instant (no network round-trip). Verified <100ms transitions. | — |
| 6 | **Visibility of Status** | **CONCERN** | Focus badge ("Stove Station") is hidden on mobile (`hidden md:flex`). Kitchen user on a phone/small tablet has no indication of their station assignment. BT Scale also hidden on xs. | Show a compact version of focus badge on mobile (icon-only pill, or fold into SubNav active tab). |
| 7 | **Gestalt: Proximity** | **CONCERN** | Double `border-b` creates ambiguous grouping. The kitchen layout wrapper (line 53) has `border-b border-border` AND SubNav (line 14) has its own `border-b border-border`. This creates a 2px combined border that looks like a visual artifact, not intentional separation. | Remove `border-b` from either the wrapper div or the SubNav component to eliminate the double border. |
| 8 | **Gestalt: Common Region** | **PASS** | SubNav, badge, and BT Scale are enclosed in the same `bg-surface` container — they read as one bar. | — |
| 9 | **Visual Hierarchy L1** (primary) | **PASS** | Location name "ALTA CITTA (TAGBILARAN)" is largest text in header area (heading level 2, font-bold). Correctly signals "where am I." | — |
| 10 | **Visual Hierarchy L2** (secondary) | **CONCERN** | Active tab (orange underline + orange text) competes with the Focus Badge pill (also colored, with border). Two orange-adjacent elements create visual noise in the same row. When on Stove tab, both "🍳 Stove" (active tab) and "🍳 Stove Station" (badge) show the same emoji+label — redundant. | When active tab matches focus, hide the badge or dim it to avoid echo. |
| 11 | **WCAG: Contrast** | **PASS** | Gray-500 inactive tabs on white surface = 4.6:1 (AA pass). Orange accent text on white = 4.6:1 (AA pass). Focus badge colors all have sufficient contrast per pre-computed Design Bible ratios. | — |
| 12 | **WCAG: Touch Target** | **CONCERN** | SubNav links meet 44px height but lack the 8px minimum spacing between targets (only `gap-0.5` = 2px). Adjacent taps could hit the wrong tab, especially on greasy kitchen tablets. | Increase `gap-0.5` to `gap-2` (8px) in SubNav for proper inter-target spacing. |
| 13 | **Consistency: Internal** | **CONCERN** | The kitchen header uses a **different nav pattern** than all other sections. POS uses no sub-nav (single page). Stock uses a sub-nav. Reports uses tabs. The SubNav component is shared, but the kitchen adds extra elements (badge + BT) that push the pattern. The StatusBar + SubNav double-bar creates more vertical chrome than any other section. | Not a blocker, but document the pattern so new sections follow the same sub-nav + utility-right convention. |
| 14 | **Consistency: External** | **PASS** | Tab bar with underline indicator matches Material/iOS tab conventions. BT Scale uses standard Bluetooth icon. | — |

**Verdict Summary:** 7 PASS, 6 CONCERN, 0 FAIL

---

## C. "Best Day Ever" — Lito's Friday Night Rush

> Lito clocks in at 5:30 PM, taps his name on the login screen, and lands on **Stove**. The orange "Stove" tab tells him he's in the right place. He glances at the header — "ALTA CITTA" with the green "Live" badge. Good, the system is connected.
>
> Three tables open in quick succession. The dispatch page starts pinging — he can hear the audio chimes through the kitchen speaker. He taps **Dispatch** to see the big picture: T3 and T4 both need meat weighed and dishes cooking. The "→ Weigh Station" links on each card tell him Benny (the butcher) hasn't weighed yet.
>
> Back on **Stove**, dishes start appearing. The header is always there — he can flick between tabs with one thumb. During the 8 PM peak, he checks **Weigh Station** to see if Benny's backed up. The "Stove Station" badge in the corner reminds him this is *his* primary station, not the weigh station — a subtle "you're visiting, not reassigned" cue.
>
> At 9 PM, a takeout order comes in. He finishes the dishes, taps "ALL DONE + Print Chit" on the stove page. The chit prints. Done.
>
> The one frustration: on his older 8-inch tablet, the "Stove Station" badge disappears entirely. He doesn't *need* it for function, but newer kitchen staff sometimes forget which station they're assigned to and end up bumping tickets meant for dispatch. The badge would help if it showed on smaller screens.

---

## D. Recommendations

### [01] Double border on kitchen nav bar

**What:** The kitchen layout wrapper (`+layout.svelte:53`) applies `border-b border-border`, and the SubNav component (`SubNav.svelte:14`) also applies `border-b border-border`. This creates a visually doubled border — 2 stacked 1px lines with identical color.

**How to reproduce:** Open any `/kitchen/*` page at 1024x768. Look at the bottom edge of the sub-nav bar. Compare to the stock section's SubNav — the double line is visible.

**Why this breaks:** Gestalt proximity — the doubled border creates ambiguous separation that doesn't exist elsewhere. It adds visual noise in an area the kitchen user glances at hundreds of times per shift.

**Ideal flow:** Single clean 1px border at the bottom of the header bar, consistent with how SubNav renders in other sections.

**The staff story:** Lito doesn't consciously notice the double line, but it contributes to the header feeling "heavier" than the stock section's cleaner look. Over an 8-hour shift, every pixel of unnecessary visual weight adds to cognitive fatigue.

---

### [02] Focus badge redundancy when active tab matches station

**What:** When Lito (Stove focus) is on the Stove tab, the header shows both "🍳 Stove" (active tab, orange underline) AND "🍳 Stove Station" (focus badge pill). Same emoji, same word, same area.

**How to reproduce:** Login as Lito (kitchen/stove focus), land on `/kitchen/stove`. Observe both orange-underlined "🍳 Stove" tab and "🍳 Stove Station" badge in the same row.

**Why this breaks:** Visual hierarchy L2 — two competing orange-adjacent signals in the same visual band. The badge's purpose is to remind "this is your home station" — but when you're already *on* that station, it's echo, not information.

**Ideal flow:** Badge appears when visiting a *different* station (e.g., Lito is on Dispatch but his home is Stove — badge reminds him). When on home station, badge is hidden or dimmed to reduce noise.

**The staff story:** New hire Corazon (Dispatch focus) navigates to Weigh Station to check meat progress. The "📋 Dispatch / Expo" badge reminds her she's visiting, not reassigned. That's useful. But when she's on her own Dispatch page, seeing both "📋 Dispatch" tab and "📋 Dispatch / Expo" badge is just... echo.

---

### [03] Sub-nav tab spacing too tight for kitchen environment

**What:** SubNav uses `gap-0.5` (2px) between tab links. WCAG and the Design Bible specify 8px minimum spacing between adjacent touch targets. Kitchen tablets get greasy — imprecise taps are common.

**How to reproduce:** Open `/kitchen/dispatch` at 1024x768. Inspect the nav element — `gap: 0.125rem` (2px) between links.

**Why this breaks:** Fitts's Law + WCAG touch target spacing — adjacent 44px-tall links with only 2px gap means a slightly off-target tap hits the wrong station. In a kitchen during rush hour, this causes navigation mistakes.

**Ideal flow:** 8px gap between tabs, or use padding to create implicit spacing (increase `px-2.5` to `px-4` on the links themselves).

**The staff story:** During the 7 PM rush, Lito's hands are slightly greasy from checking a dish. He taps "Dispatch" but his thumb lands on the edge and triggers "Weigh Station" instead. He has to tap back — 2 seconds lost, 2 unnecessary page loads, and a flash of wrong content that momentarily confuses his mental model.

---

### [04] Focus badge and BT Scale hidden on mobile — station identity lost

**What:** Focus badge uses `hidden md:flex` (hidden below 768px). BT Scale uses `hidden sm:block` (hidden below 640px). On phones or 7-8" tablets in portrait, the kitchen user loses both station identity and scale status.

**How to reproduce:** Resize to 375x667 mobile viewport. Navigate to any kitchen page. Focus badge and BT Scale disappear entirely from the header.

**Why this breaks:** Visibility of Status — the user's station assignment is a critical piece of operational context. New kitchen staff rely on it to know their responsibility. BT Scale connection status is essential for the butcher at the weigh station.

**Ideal flow:** On mobile, show an icon-only version of the focus badge (just the emoji in a small circle), and show a BT icon-only indicator (dot green/gray) without the "BT Scale" text label.

**The staff story:** Benny (butcher) uses a 7-inch tablet at the weigh station. In portrait mode, he can't see whether his Bluetooth scale is connected without opening a menu. He only discovers it's disconnected when he tries to weigh meat — adding 15-20 seconds of reconnection time during a rush.

---

### [05] Mobile header consumes 19.8% of viewport

**What:** On 375x667 mobile, the header stack (MobileTopBar 48px + StatusBar 40px + SubNav 44px) totals ~132px — nearly 1/5 of screen height. This leaves only ~535px for actual kitchen content (dispatch cards, meat queue, etc.).

**How to reproduce:** Login as kitchen role on 375x667 viewport. Observe that 3 header rows consume the top fifth of the screen before any content appears.

**Why this breaks:** POS-specific pattern: "Speed over beauty" — every pixel of content area matters when displaying dispatch cards or weigh station panels. 19.8% header is high for a glance-heavy operational screen.

**Ideal flow:** On mobile kitchen views, consider collapsing StatusBar into MobileTopBar (location name left, Live dot right) to save one row (~40px). This would bring header to ~92px (13.8% — closer to the 10% ideal).

**The staff story:** On her phone (used as a secondary display), Corazon can only see 2 dispatch cards at a time in the remaining 535px. She scrolls constantly during the dinner rush. If the header were 40px shorter, she'd see a third card peek above the fold — enough to know at a glance whether a new order just landed.

---

### [06] SubNav active state lacks sufficient affordance on mobile

**What:** On mobile (375px), the active tab indicator is a 2px orange underline on text that's `text-xs` (12px). The underline is the sole differentiator — no background change, no bold weight change beyond `font-medium`.

**How to reproduce:** Open any kitchen page at 375x667. Observe the active tab — a thin orange line under small text. Compare to inactive tabs (gray text, no underline).

**Why this breaks:** Glanceable status (Design Bible 7.1) — kitchen staff should understand their current location in <2 seconds from arm's length (50cm). A 2px underline on 12px text at 50cm viewing distance is hard to distinguish.

**Ideal flow:** Add a subtle background tint (`bg-accent/5` or `bg-orange-50`) to the active tab on mobile, making it a filled pill rather than relying solely on the underline.

**The staff story:** From across the prep counter (~80cm), Lito can see the tablet screen but can't tell which tab is active — the orange underline is invisible at that distance. He walks over to check. Adding a background tint would make the active tab visible from 1-2 meters away.

---

## E. Structural Proposals

### [SP-01] Unified Kitchen Header Component

**Current:** The kitchen header is assembled from 3 separate concerns in the layout file — SubNav (shared component), Focus Badge (inline conditional), BT Scale (imported component) — glued together with flexbox. The double-border issue and badge redundancy stem from this ad-hoc assembly.

**Proposal:** Extract a `KitchenHeader.svelte` component that owns the entire bar:
- Receives `links`, `kitchenFocus`, `btScaleState` as props
- Internally manages the SubNav rendering (without the extra border-b)
- Handles the "hide badge when on home station" logic
- Provides responsive variants (icon-only badge on mobile, icon-only BT on xs)

**Tradeoff:** More components, but encapsulates the kitchen-specific header logic that's currently leaking between layout and SubNav. Makes future additions (e.g., volume control, order count badge) cleaner.

---

**Overall Assessment:** The kitchen header is functional and well-structured. No FAIL verdicts — all issues are CONCERN-level polish items. The double border ([01]) and tab spacing ([03]) are the quickest wins. The badge redundancy ([02]) and mobile visibility ([04]) are higher-impact but require more design thought. The mobile viewport issue ([05]) is a broader structural consideration that may warrant a dedicated mobile kitchen layout pass.
