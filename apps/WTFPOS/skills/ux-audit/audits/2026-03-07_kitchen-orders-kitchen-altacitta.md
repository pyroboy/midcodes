# UX Audit Report: `/kitchen/orders` (+ `/kitchen/all-orders`) as Kitchen at Alta Citta

**Auditor:** Claude (ux-audit skill v1.0.0)
**Date:** 2026-03-07
**Page:** `/kitchen/orders` (Order Queue) + `/kitchen/all-orders`
**Role:** Kitchen (Pedro Cruz)
**Branch:** Alta Citta (Tagbilaran)
**Viewport:** 1024 x 768 (tablet landscape)
**States captured:** Order Queue (empty, 0 tickets), All Orders (populated, 23 orders with mixed statuses)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 10 issues resolved (P0: 0/2 · P1: 0/5 · P2: 0/3)

---

## A. Text Layout Map

### State 1: Order Queue — Empty (no active KDS tickets)

```
+--sidebar(~60px)--+-------------------main-content--------------------+
| [W! brand]       | [All Orders] [> Order Queue] [Weigh Station]      |
| Alta Citta       |---------------------------------------------------|
| 03:36 PM         | Kitchen Queue                                     |
| ----------       | [UNDO LAST]  [History 132]                        |
| [Kitchen]        |                                                   |
| [> Stock]        | +--summary-counters (3)--+                        |
| ----------       | | [0 Orders] [0 Tables] [0 Items] |               |
| Pedro Cruz       | +-------------------------+                        |
| kitchen          |                                                   |
| [Logout]         |           checkmark                               |
|                  |      No pending orders                             |
|                  |      New orders will appear                        |
|                  |       here automatically                           |
|                  |                                                   |
|                  |                                                   |
|                  |          (vast empty space)                        |
|                  |                                                   |
+--sidebar---------+--------------------------------------------------+
```

### State 2: All Orders — Populated (23 orders)

```
+--sidebar(~60px)--+-------------------main-content--------------------+
| [W! brand]       | [> All Orders] [Order Queue] [Weigh Station]      |
| Alta Citta       |---------------------------------------------------|
| 03:36 PM         | All Orders                           23 orders    |
| ----------       |                                                   |
| [Kitchen]        | +--status-filters-------------------------------------+
| [> Stock]        | | [All 23] [Open 1] [Pending 3] [Paid 17] [Cancel 2]|
| ----------       | +----------------------------------------------------+
| Pedro Cruz       | +--time-filters---------------------------------------+
| kitchen          | | [Today] [Last Hour] [Last 3 Hours] [All Time]     |
| [Logout]         | +----------------------------------------------------+
|                  |                                                   |
|                  | +--order-card-------------------------------------+ |
|                  | | #T5-IU8B  [PENDING]                             | |
|                  | | Table 5 . Opened just now                       | |
|                  | | 3 items . 3 pax . Beef Unlimited                | |
|                  | | P2,308.00                      3/3 served       | |
|                  | +------------------------------------------------+ |
|                  | +--order-card-------------------------------------+ |
|                  | | #TO-ILLO  [PAID]                                | |
|                  | | Pedro . Closed 09:54 PM                         | |
|                  | | 4 items . 1 pax               P1,023.00         | |
|                  | +------------------------------------------------+ |
|                  | ~~~~~~~~~~~~~~~fold (768px)~~~~~~~~~~~~~~~~~~~~~~~ |
|                  | #T2-YMQP [PAID] Table 2 . 09:41 PM . P1,650      |
|                  | #T6-LQCQ [PAID] Table 6 . 09:41 PM . P1,245      |
|                  | #T8-S4HA [CANCELLED] Table 8                      |
|                  | #TO-A-MV [PAID] Carmen . 09:28 PM . P612          |
|                  | #T3-DN2C [PENDING] Table 3 . just now . P1,704    |
|                  | #T4-8ECX [OPEN] Table 4 . just now . P3,086       |
|                  | ... (15 more orders below fold)                   |
+--sidebar---------+--------------------------------------------------+
```

**Key layout observations:**
- Order Queue is completely separate from All Orders -- queue only shows active KDS tickets
- When queue is empty, ~80% of screen is unused white space with a small centered empty state
- All Orders has two filter rows (status + time) taking ~80px before any order cards
- Order cards are information-dense: ID, status badge, table/name, time, items, pax, package type, total, served count
- 23 orders in a flat scrollable list -- no pagination, no grouping by time period
- Only ~2 order cards visible above fold due to filter rows + heading consuming top space

---

## B. Principle-by-Principle Assessment

| # | Principle | Verdict | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Hick's Law** (choice count) | **CONCERN** | All Orders: 5 status filter buttons + 4 time filter buttons = 9 filter options before seeing any data. Each order card is clickable but no clear visual hierarchy of which orders need attention. PENDING and OPEN orders are interleaved chronologically with PAID and CANCELLED -- the cook has to scan past closed orders to find actionable ones. | Default filter to "Open + Pending" for kitchen role -- these are the only actionable statuses. Push PAID/CANCELLED behind a toggle or secondary view. |
| 2 | **Miller's Law** (chunking) | **CONCERN** | Order cards contain 5-7 information chunks each: ID, status, table/name, time, item count, pax, package type, total, served count. At 23 orders in a flat list, there's no grouping -- all orders are in one stream. The status filter badges (All 23, Open 1, Pending 3, Paid 17, Cancelled 2) are good chunking of the overview. | Group orders by status rather than chronological: Active section (Open/Pending) at top, then Completed (Paid), then Cancelled at bottom. Or group by time: "Current Service" / "Earlier Today". |
| 3 | **Fitts's Law** (target size/distance) | **PASS** | Order cards are large tappable buttons spanning full width. Filter buttons are adequately sized. Sub-nav tabs (All Orders, Order Queue, Weigh Station) are well-spaced. The UNDO LAST button on Order Queue is positioned top-right near the heading -- visible but not accidentally tappable. | -- |
| 4 | **Jakob's Law** (conventions) | **PASS** | Order list with filter tabs follows standard kitchen/order management patterns (DoorDash merchant, Grab merchant, Toast KDS). Status badges with color coding (PENDING, PAID, OPEN, CANCELLED) match expectations. Time-based filtering is common in order management. | -- |
| 5 | **Doherty Threshold** (response time) | **PASS** | All data from RxDB -- instant rendering of 23 orders. Filter switching is client-side (no server round-trip). Tab navigation between All Orders / Order Queue / Weigh Station is instant. "New orders will appear here automatically" suggests reactive subscription. | -- |
| 6 | **Visibility of System Status** | **CONCERN** | Good: Summary counters (0 Orders, 0 Tables, 0 Items) on queue. Status badges on every order card. Filter buttons show counts (Open 1, Pending 3). "23 orders" total count. Bad: No LocationBanner on this page -- unlike `/pos` which had the full location context, the kitchen pages only show "Alta Citta (Tagbilaran)" in the sidebar header and a clock. There's no "last updated" or real-time indicator. The empty queue says "New orders will appear here automatically" but there's no pulsing dot or connection indicator to confirm live updates are working. | Add a real-time connection indicator (green dot + "Live" or pulsing dot) to confirm the auto-update is active. Pedro needs to trust that no orders are being missed. |
| 7 | **Gestalt: Proximity** | **PASS** | Filter buttons are grouped in two rows (status, time). Order cards are evenly spaced in a list. Within each card, related info is grouped: ID + status on one line, table + time on next, details on third, total on fourth. | -- |
| 8 | **Gestalt: Common Region** | **PASS** | Each order card is a distinct bounded region (button). Status filter buttons are visually grouped in a row. Time filter buttons in a separate row. The sub-nav is a clear horizontal band at the top. | -- |
| 9 | **Visual Hierarchy** (scale) | **CONCERN** | "Kitchen Queue" heading (h1) is the largest text, but on the empty queue it competes with the empty state message for attention. On All Orders, "All Orders" heading + "23 orders" subtitle is fine. But the order cards all have equal visual weight -- PENDING orders (#T5-IU8B needing action) look the same size as PAID orders (#TO-ILLO, done). The most actionable orders don't stand out from the historical noise. | Make OPEN/PENDING order cards visually larger, bolder, or elevated (shadow/border-accent) compared to PAID/CANCELLED. Urgent orders should dominate the visual field. |
| 10 | **Visual Hierarchy** (contrast) | **CONCERN** | Status badges have different text (PENDING, PAID, OPEN, CANCELLED) but from the DOM snapshot I can't verify if they use different background colors. If they do, the status differentiation is good. But the order total (P2,308.00) and served count (3/3 served) are at the same hierarchy level as other metadata -- the total should be more prominent for PENDING orders (that's what the kitchen cares about for meal prep). | Verify status badges use distinct colors (green for PAID, orange for PENDING, red for CANCELLED). Emphasize the served count ("3/3 served") for active orders -- that's the kitchen's primary metric. |
| 11 | **WCAG: Color Contrast** | **CONCERN** | Cannot fully assess without visual rendering, but based on the design system: if PENDING uses status-yellow (#F59E0B), it's 2.1:1 on white (FAIL AA). If OPEN uses status-green (#10B981), it's 3.5:1 (FAIL AA for small text). Status badges need to rely on text + color, not color alone. The served count "3/3 served" is a critical metric -- needs adequate contrast. | Ensure status badge text meets WCAG AA. If using colored badges, use dark text on light background (not light text on white). Add icons alongside status text (checkmark for PAID, clock for PENDING, X for CANCELLED). |
| 12 | **WCAG: Touch Targets** | **PASS** | Order cards are full-width tappable buttons (well above 48px height). Filter buttons are standard btn size. Sub-nav links are adequately sized with icon + text. The UNDO LAST button and History button are standard sized. | -- |
| 13 | **Consistency** (internal) | **CONCERN** | Order Queue and All Orders show fundamentally different views of the same data but share a sub-nav that doesn't explain the relationship. A cook might wonder: "Why does Order Queue show 0 orders but All Orders shows 23?" The queue shows *active KDS tickets* while All Orders shows *all historical orders* -- this distinction is not communicated. The Order Queue has summary counters (0 Orders, 0 Tables, 0 Items) but All Orders has status + time filters instead -- different UI patterns for sibling pages. | Add a subtitle or tooltip: "Order Queue: Active tickets awaiting kitchen action" vs "All Orders: Complete order history". Use consistent summary patterns across both views. |
| 14 | **Consistency** (design system) | **PASS** | Uses standard sub-nav pattern, card-based list, badge counters, button filters. Sidebar shows Kitchen + Stock nav appropriate for kitchen role. Clock displayed in sidebar. Follows app shell pattern. | -- |

---

## C. "Best Day Ever" Vision

It's 7 PM at Alta Citta. The dinner rush just started. Pedro is at the grill station with the kitchen tablet mounted on the wall at eye level, angled slightly so he can see it while flipping samgyupsal.

**The ideal:** Pedro glances up and sees 3 bright, bold ticket cards stacked by urgency. Table 5 at the top -- been waiting 4 minutes, needs Beef Unlimited first round. Table 3 next -- just came in, Pork Unlimited. The cards are color-coded: red-orange border for the oldest ticket, calm green for the newest. Each card shows just what Pedro needs: *table number, what meat, how many pax, how long they've been waiting*. He doesn't read the order total -- that's the cashier's problem. He doesn't see the 17 paid orders from earlier -- they're done, irrelevant. When Table 5's first round of beef goes out, he taps "Served" and the card pulses green, then fades to the served section. Satisfaction. The queue count drops from 3 to 2. He's winning.

**Where it falls short today:** Pedro opens the kitchen and sees... nothing. "No pending orders." The empty state is reassuring during downtime, but during rush, he'd switch to "All Orders" and see 23 orders in a flat list -- PAID, PENDING, CANCELLED all mixed together. He has to *filter* to find the 3 PENDING orders. He taps "Pending 3" and sees them, but they look the same as any other order card -- no urgency coloring based on wait time, no "this table has been waiting 4 minutes" highlight. The served count "3/3 served" tells him everything is delivered, but it's tucked into the bottom-right corner in regular-weight text.

The **disconnect** between Order Queue and All Orders is the biggest friction. The queue is for *active KDS work* but it's empty because there are no items pending kitchen action (all items are "served"). All Orders is the *history log* but Pedro uses it as his work queue because the actual queue is empty. These are two different tools solving different problems, but the sub-nav makes them look like tabs of the same thing.

**Emotional arc:** Pedro should feel *focused* (only see what needs my attention), *urgent-but-calm* (I know exactly what's next and how long they've waited), and *satisfied* (tapping "served" gives me a hit of progress). Today, he feels *confused* (which tab shows my real work?), *overwhelmed* (23 orders, most irrelevant), and *uncertain* (are all items really served, or did I miss something?).

---

## D. Prioritized Recommendations

| Priority | Issue | Fix | Effort | Impact | Status |
|---|---|---|---|---|---|
| **P0** | Relationship between Order Queue and All Orders is unclear -- cook doesn't know which view to use for active work | Add subtitle text: "Order Queue: Items needing kitchen action" and "All Orders: Full order history". Consider merging into one view with an "Active" section pinned at top. | S | High | 🔴 OPEN |
| **P0** | All Orders mixes actionable orders (OPEN, PENDING) with completed ones (PAID, CANCELLED) at equal visual weight -- active orders don't stand out | Make OPEN/PENDING cards visually dominant: accent border, larger text, or elevated card. Dim PAID/CANCELLED cards. Or: auto-filter to "Open + Pending" for kitchen role on load. | M | High | 🔴 OPEN |
| **P1** | No real-time connection indicator on Order Queue -- "orders will appear automatically" but no visible proof the live feed is working | Add a green pulsing dot or "Live" indicator next to the heading. If connection drops, show a red warning. Kitchen staff must trust the auto-update. | S | High | 🔴 OPEN |
| **P1** | No urgency/wait-time visualization on active orders -- Table 5 waiting 4 minutes looks identical to Table 3 just opened | Add wait-time color coding: <2 min = normal, 2-5 min = yellow border, >5 min = red border + pulse. Time is THE critical KDS metric. | M | High | 🔴 OPEN |
| **P1** | Empty queue state uses ~80% of screen as white space -- missed opportunity | In empty state, show useful secondary info: "Last order completed 2m ago" / today's stats (17 orders served, avg time) / stock alerts. Make downtime informative. | M | Med | 🔴 OPEN |
| **P1** | Served count "3/3 served" is small and bottom-right -- this is the kitchen's primary progress metric | Make served count larger and more prominent on active order cards. Consider a progress bar: 2/5 served = partially filled bar. | S | Med | 🔴 OPEN |
| **P1** | 9 filter buttons (5 status + 4 time) consume ~80px before any order data -- excessive for a cook who needs to glance quickly | Reduce to role-appropriate defaults: show "Active" (Open+Pending) by default. Collapse time filters behind a dropdown. Kitchen needs NOW, not "All Time". | M | Med | 🔴 OPEN |
| **P2** | No audio/haptic notification when new order arrives -- kitchen environment is noisy, cook may not be looking at screen | Add optional audio chime when a new ticket appears in the queue. Make it configurable (on/off, volume) in settings. | M | Med | 🔴 OPEN |
| **P2** | Order cards show total (P2,308.00) which is cashier info, not kitchen info -- adds visual noise for the cook | For kitchen role, de-emphasize or hide the order total. Emphasize: table number, meat type, pax count, wait time, served progress. | S | Low | 🔴 OPEN |
| **P2** | No grouping of orders by time period on All Orders -- 23 orders in flat list requires scrolling | Group by "Current Service" / "Earlier Today" / "Previous Days" with collapsible sections. | M | Low | 🔴 OPEN |

---

## Summary

| Verdicts | Count |
|---|---|
| PASS | 6 / 14 |
| CONCERN | 8 / 14 |
| FAIL | 0 / 14 |

**Overall assessment:** The kitchen pages have solid foundations -- card-based order list, status badges, filter controls, reactive RxDB data, and proper role-scoped navigation. The two P0s are: **confusing Queue vs All Orders relationship** (cook doesn't know which view is their "real" workspace) and **active orders drowning in historical noise** (PENDING cards look identical to PAID cards). The core theme is **kitchen-role optimization** -- the page was built with general order management in mind, but a cook at the grill station during rush hour needs an urgency-first, glanceable, wait-time-driven view with clear progress indicators. The data is all there; it just needs to be reshaped around the cook's mental model: "What's next? How long have they waited? What did I already serve?"
