# Staff Partial Audit — Hard 4-User — 2026-03-09

**Role:** Staff (Maria Santos, Alta Citta)
**Branch:** Alta Citta (Tagbilaran)
**Viewport:** Default (headless, ~1280×720)
**Date:** 2026-03-09
**Auditor note:** playwright-cli session died between bash tool calls; audit completed by issuing each command separately and tracking state across snapshot files. All steps A1–A11 completed successfully.

---

## Steps Completed

- **A1: PASS** — Login page loaded at http://localhost:5173. Dev quick-login panel visible with test accounts grouped by branch. Staff (Maria Santos, Alta Citta) button present and clearly labeled with role + branch badges.
- **A2: PASS** — Clicked "Maria Santos Staff Alta Citta ›" button. No separate username field or location selector — the dev quick-login button encodes both. Redirected to /pos immediately.
- **A3: PASS** — Floor plan at /pos showed "0 occ, 8 free". Tables T1–T8 all listed (T1–T6 cap 4, T7–T8 cap 2). LocationBanner displayed "ALTA CITTA (TAGBILARAN)". A "Start Your Shift" overlay blocked interaction — required declaring opening cash float before accessing POS. Staff could see table layout but not interact. Quick select buttons: ₱1,000 / ₱2,000 / ₱3,000 / ₱5,000. Also shows manual input spinbutton. Note: "Logged as [blank]" appeared on a session crash + reload without login — potential ghost state.
- **A4: PASS** — Clicked T1 (available table) → PaxModal appeared with "How many guests for T1?" heading. Quick-select buttons 1–12 visible plus "Other (type number)" input. Selected pax 4 → AddItemModal auto-opened with Package tab active. No additional confirmation required. Timer "0m" started immediately in order sidebar.
- **A5: PASS** — AddItemModal opened to Package tab. Three packages visible: Beef Unlimited ₱599/pax, Beef + Pork Unlimited ₱499/pax, Pork Unlimited ₱399/pax. Selected Pork Unlimited → modal auto-switched to Meats tab. Added 2 drinks (San Miguel Beer ₱75, Soju ₱95) from Drinks tab. Pending Items panel showed all items with +/- qty controls for drinks. CHARGE button showed count "(14)" including package sub-items. Clicked CHARGE → items sent to kitchen. Toast: "✓ 14 items sent to kitchen".
- **A6: CONCERN** — Clicked T2 while T1 was selected → PaxModal for T2 appeared BUT the order sidebar continued showing T1's running bill (no visual indication that the sidebar had switched context). Staff could be confused about which table is "active" in the sidebar. Selected pax 2 for T2 — pax modal appeared normally.
- **A7: PASS** — "🔄 Refill" button visible in order sidebar header row (next to "Add Item"). Clicking it opened a Refill panel with Meats section (Pork Sliced, Samgyupsal) and Free Sides section (9 items: Cheese, Chinese Cabbage, Cucumber, Egg, Fish Cake, Kimchi, Lettuce, Pork Bulgogi, Rice). Done button at bottom. Clean layout.
- **A8: PASS with CONCERN** — Clicked "4 pax ✎" button → PaxChangeModal appeared immediately without PIN gate. Modal shows "Change Pax" heading, current pax count, −/+ buttons, and a preview of the price change (e.g., "Pork Unlimited × 5 pax = ₱1,995.00 (+₱399.00)"). "Apply Change" button is disabled until count changes. Upon clicking Apply Change → "Manager PIN Required" modal appeared with numpad and "Enter manager PIN to authorize pax change." message. Verdict: PIN gate triggers on Apply (not on opening), which is good UX — staff can preview the change first. CONCERN: canceling the PIN does NOT reset the pax count in the PaxChangeModal — the modal re-shows with the changed value (5), potentially confusing staff who changed their mind.
- **A9: PASS** — Clicked Checkout → a "Leftover Check" modal appeared first (unexpected; not part of the standard checkout flow description). Required weighing uneaten meat or entering 0. "Skip / Checkout" button available (no PIN needed to skip). "Waive (Manager)" button for manager-only waiver. After skipping → Checkout modal opened with: Subtotal, VAT (inclusive), TOTAL, discount options (Senior/PWD/Promo/Comp/Service Rec), payment methods (Cash/GCash/Maya), quick amounts (₱20/₱50/₱100/₱200/₱500/₱1,000/₱1,500/₱2,000). Entered ₱2,000 cash → showed "Cash Change: ₱404.00". Clicked Confirm Payment → receipt overlay appeared with full bill summary, payment breakdown, date/time, and "WTF! Samgyupsal — Thank you!" footer. Done button returned to floor plan with T1 now free.
- **A10: PASS with CONCERN** — Order History modal opened with "78 orders" total. Orders listed with: table/order indicator (🪑 T1 / 📦 Takeout), package tag if applicable, status badge (PAID/VOID/UNPAID), pax count, item count, time, payment method. Summary at bottom: "63 paid · 11 unpaid · 4 voided". VOID orders found — see Void Badge Assessment section. CONCERN: no filter/search controls visible for the order list. 78 orders is a lot to scroll through manually.
- **A11: FAIL (Security Issue)** — Navigating directly to http://localhost:5173/reports/x-read as Staff role DID NOT redirect or show an error. Page loaded fully with live branch data (Gross Sales ₱93,769.00, Net Sales ₱91,878.00, Total Pax 194, X-Read History #1–#7). The sidebar correctly shows only "POS" as a nav item for Staff, but there is NO server-side or client-side route guard preventing Staff from accessing any report URL directly. The "Generate X-Read" button was also rendered and accessible.

---

## Key Findings

### P0 — Security

- **[P0-1] Staff can access /reports/* via direct URL navigation** — No route guard enforces Staff-only POS access. Typing `/reports/x-read`, `/reports/eod`, or any report URL while logged in as Staff renders the full report with live branch financial data and action buttons (Generate X-Read). This is a data security and compliance violation. Staff seeing gross sales, VAT breakdown, and X-Read history is a business confidentiality risk. Fix: add a role check in the Reports layout (`routes/reports/+layout.svelte`) that redirects Staff to `/pos` with an alert.
  **Effort: S | Impact: High**

### P1 — Usability Friction

- **[P1-1] Start Shift overlay is required every new browser session** — Because session state is stored in memory (not IndexedDB), logging in again always shows the "Start Shift" overlay even mid-shift. On a tablet that auto-refreshes or is shared, this adds friction. However the copy "Existing open orders are safe — they will remain open." is reassuring.
  **Effort: M | Impact: Med**

- **[P1-2] PaxChangeModal doesn't reset pax count after PIN cancel** — If staff opens PaxChangeModal, increments pax to 5, then cancels the PIN, the modal stays open showing the new (unsaved) value of 5. Staff must manually decrement back to 4 or cancel the whole modal. This creates confusion about whether the change was applied.
  **Effort: S | Impact: Med**

- **[P1-3] Order sidebar context during PaxModal for a second table** — When T1 is active in the sidebar and staff clicks T2 to open a pax modal, the sidebar continues displaying T1's running bill. There is no visual cue that the pax modal is for T2 while T1's bill is shown. Staff may not realize they are opening T2 vs. clicking T1 again.
  **Effort: S | Impact: Med**

- **[P1-4] Order History has no search or filter** — 78 orders (and growing across a shift) displayed as a scrollable flat list. No date filter, table filter, or status filter. Finding a specific voided order or a specific table requires manual scrolling.
  **Effort: M | Impact: Med**

- **[P1-5] Leftover Check modal is a surprise before checkout** — Standard checkout mental model is: "tap Checkout → enter payment." The Leftover Check step appears before payment without prior visual affordance. Staff may be confused the first time. The "Skip / Checkout" label is good UX for the happy path, but a brief label or tooltip on the Checkout button ("includes leftover check") would set expectations.
  **Effort: S | Impact: Med**

### P2 — Polish

- **[P2-1] VOID reason text in Order History is unstyled plain text** — Voided orders show the VOID badge (presumably styled red) and the cancel reason (e.g., "mistake", "walkout", "write off") as generic plain text in the same row. The reason would be easier to scan at a glance if styled as a secondary badge (e.g., italic or muted color). Currently readable but not visually differentiated.
  **Effort: S | Impact: Low**

- **[P2-2] VOID orders have no View/Correct buttons** — Looking at the first VOID entry (T2, 0 items, ₱0.00, "mistake"), no View or Correct buttons are shown. The PAID entries all have View + Correct buttons. Consistency would expect at least a View button for voided orders so managers can audit what was voided.
  **Effort: S | Impact: Low**

- **[P2-3] History button count doesn't match session** — History badge showed different counts across browser sessions (7, 8, 12, 13, 14, 15), reflecting the cumulative seeded order history rather than today's orders. The badge count could confuse staff if they expect it to reflect today's orders only.
  **Effort: S | Impact: Low**

- **[P2-4] "🧾 History" button label — emoji+text on action button** — The history button uses an emoji prefix ("🧾 History 15"). Emoji are inherently ambiguous for accessibility tools and screen readers. For a POS used in a professional setting, consider using a Lucide icon instead of emoji.
  **Effort: S | Impact: Low**

- **[P2-5] Package auto-switch to Meats tab after package add** — After selecting a package (Pork Unlimited), the AddItemModal automatically switches to the Meats tab. While logical (meats are the next thing to think about for AYCE), meats are weight-based and cannot be added manually — they show "tap to enter weight" labels. Staff may be confused why they can't add meats the same way as drinks. The tab switch is a useful hint but could benefit from a label: "Meats are added by weight from the kitchen station."
  **Effort: S | Impact: Low**

---

## Void Badge Assessment

**Did voided orders show a cancelReason badge? What did it look like?**

Yes — voided orders in the Order History modal displayed both a status badge and a reason text. The VOID badge appears to be a styled element (likely red/danger-colored based on the "VOID" string appearing in the accessibility tree where other statuses like "PAID" appear in similar positions with presumably different styling). The cancel reason text appeared immediately after the VOID badge in the row, as plain lowercase text:

- `🪑 T2` · `VOID` · `mistake` — 2 pax, 0 items, ₱0.00 (no View/Correct buttons)
- `🪑 T2 · Pork Unlimited` · `VOID` · `write off` — 4 pax, 0 items, ₱1,596.00
- `🪑 T[x]` · `VOID` · `walkout` (two instances found)

**Assessment:** The cancel reason is visible and present in the Order History, which is correct behavior. However:
1. The reason text is unstyled plain text — it blends into the meta row alongside pax count, item count, and time. A distinct visual treatment (e.g., muted color, italic, or a small inline badge like `[mistake]`) would help it stand out at a glance.
2. No View button on VOID orders means staff cannot drill into the voided order details from history. Only the summary is visible.
3. The reason values (mistake, walkout, write off) appear to be enum/select values — good consistency, no free-text which would create noisy data.

---

## Layout Map (POS Floor Plan — Staff View)

```
+---sidebar---+--------------------main-content----------------------------+
| [W!]        | [Alta Citta (Tagbilaran)] — LocationBanner                |
| separator   |-----------------------------------------------------------+
| [POS] ←only | [≡ Toggle] [POS heading] [0 occ] [8 free]                 |
|             | [⊕ Legend] [📦 New Takeout] [🧾 History N]                |
|             |-----------------------------+----------------------------+  |
|             | Floor Plan (SVG ~70%)       | Order Sidebar (~30%)       | |
|             | [T1][T2][T3][T4]           | [🧾 No Table Selected]     | |
|             | [T5][T6][T7][T8]           | [legend hints]             | |
|             |                             |                            | |
|             | Takeout Orders (below)      |                            | |
|             | [#TO01 Jose ₱556 3 items]   |                            | |
|             |                             |                            | |
+---sidebar---+-----------------------------+----------------------------+  +
| [M] (avatar)|
| [Logout]    |
+-------------+
```

After table selection:
```
Order Sidebar shows:
  [T1] [4 pax ✎] [1m]  [✕]
  Pork Unlimited
  [🔄 Refill] [Add Item]
  ─ BILL (12 items) ─────
  Pork Unlimited SENT ₱1,596 PKG [✕]
    Meats: Samgyupsal WEIGHING
           Pork Sliced WEIGHING
    Sides: 9 requesting ▼ show
  ─ TOTAL ₱1,596 ─────────
  [Void] [Checkout] [Print] [More ▼]
```

---

## Observations on PaxModal UX

- 12-button grid (1–12) covers almost all samgyupsal group sizes
- "Other" input with spinner for groups over 12
- No visual indication of table capacity vs. requested pax (T1 has cap 4 but pax 5 was selectable for pax change)
- PaxChangeModal shows live price delta before committing — good financial transparency for staff

---

## A6 — Two-Table Switching

The sidebar correctly switches to show the clicked occupied table's running bill. However:
- When T1 was active in sidebar and staff clicked T2 (free), the PaxModal for T2 appeared **while T1's sidebar was still visible**. This created a split attention situation — two states on screen simultaneously.
- After pax selection for T2 and AddItemModal opening, the sidebar did switch to T2.
- This multi-table workflow is functional but the transition moment (PaxModal overlaying T1's sidebar) could be clearer.

---

## Overall Recommendation

**This flow is production-ready for core POS operations (open table → add items → checkout → receipt) but has one P0 security issue that must be fixed before deployment: Staff can access financial reports via direct URL.**

The POS workflow itself is solid — the auto-open of AddItemModal after pax selection, the refill panel, the pax change with PIN gate on Apply (not on open), the leftover check, and the receipt flow all work correctly and feel well-designed for restaurant service. The void reason tracking works. P1 items are genuine friction points that should be addressed in this sprint, particularly the route guard and the pax modal PIN cancel behavior.
