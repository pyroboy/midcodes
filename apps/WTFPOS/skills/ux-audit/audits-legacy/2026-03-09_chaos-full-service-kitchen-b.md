# Kitchen-B UX Audit — Kuya Marc (Weigh Station) — Alta Citta Mid-Service Delivery
**Date:** 2026-03-09
**Agent:** Kitchen-B (Kuya Marc — second session)
**Role:** `kitchen` | **Location:** `tag` (Alta Citta, Tagbilaran)
**Pages audited:** `/kitchen/weigh-station`, `/kitchen/all-orders`
**Scenario:** Mid-service meat delivery at Alta Citta — logging portion weights from Bluetooth scale, using yield calculator, evaluating weighing UX under service pressure

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 0 of 10 issues resolved (P0: 0/2 · P1: 0/3 · P2: 0/5)

---

## Audit Environment Note

Session injection was challenged throughout this audit by concurrent agent sessions sharing the same browser sessionStorage. The `wtfpos_session` key was overwritten multiple times by parallel audit agents (Ate Rose / staff, Boss Chris / owner). This caused repeated redirects from `/kitchen/weigh-station` to `/pos` mid-session.

**This is itself a UX finding (P1):** In production with multiple device tabs open under different roles, the sessionStorage-based auth would be overwritten across same-origin tabs. The current auth design is single-tab only. See Section D below.

All source-code analysis was completed successfully via direct file reads.

---

## Step 1 — Weigh Station Initial State (S12)

**Snapshot:** `page-2026-03-08T21-23-19-439Z.yml`
**Auth confirmed at snapshot time:** `userName: Kuya Marc`, `role: kitchen`, `locationId: tag`
**URL confirmed:** `http://localhost:5173/kitchen/weigh-station`

### Layout observed (empty queue state):

```
+--sidebar-rail--+--W96-pending-panel--+--center-numpad--+--W72-dispatched--+
| [W!] toggle    | ALTA CITTA          |                 |                  |
| [Kitchen] nav  | (LocationBanner)    |                 |                  |
| [Stock] nav    |-Sub-nav: [All Orders][Order Queue][Weigh Station]---------|
| ---            |---------------------|-----------------|------------------|
| [K] avatar     | Pending Meat        |   ⚖️            | Dispatched       |
|                | 0 items waiting     |                 | 0 items · 0.0kg  |
|                |                     | Select a meat   | [Yield %] button |
|                | ✅ All clear        | order           |                  |
|                |                     | Choose from the |                  |
|                |                     | pending list on |                  |
|                |                     | the left        |                  |
|                |                     |                 | No items         |
|                |                     |                 | dispatched yet   |
+----------------+---------------------+-----------------+------------------+
```

### Observations:

**Accessibility for kitchen role:** The weigh station IS accessible to the `kitchen` role. The `kitchen/+layout.svelte` confirms the sub-nav includes "Weigh Station" for non-`all` locations. The kitchen layout correctly redirects `staff` role to `/pos` but allows `kitchen` role through.

**Location banner:** "ALTA CITTA (TAGBILARAN)" is correctly displayed in the blue banner. Access level is "Kitchen Ops" (per `LocationBanner.svelte` logic). The banner is read-only for kitchen (no "Change Location" button). Correct behavior.

**Weight display readability:** In the empty state, no weight display is shown — only the placeholder "Select a meat order" message with a large ⚖️ emoji. The weight display does not render until a meat item is selected from the left panel.

**Unit indicator:** When a meat item is selected and manual mode is active, the weight display shows `{value}g` with an explicit "g" unit suffix rendered in a smaller `text-2xl` span. The label above reads "Weight (grams)". This is explicit and unambiguous.

**Scale simulator:** The `BluetoothScaleSimulator` component exists and is fully functional (code-verified), but it is NOT surfaced on the weigh station page. The simulator is only accessible through `BluetoothScaleStatus`, which is only imported in the deprecated `TopBar.svelte`. Since `TopBar` is not used in the current layout, there is NO way for kitchen staff to access the scale simulator or the Bluetooth pairing UI from the weigh station. This is a critical gap (see Section C).

**Bluetooth connection status:** No persistent Bluetooth status indicator is visible on the weigh station page. The `btScale.connectionStatus` reactive state is read by the page component to show the Manual/Scale mode toggle, but this toggle only appears AFTER a meat item is selected AND the scale is already connected. Kitchen staff have no visual feedback about whether the scale is connected when they first arrive at the page.

---

## Step 2 — Bluetooth Scale Connect Flow

**Method:** Code analysis (live interaction blocked by session instability in concurrent audit environment)

### Connection architecture (from source):

The `BluetoothScaleStatus` component handles scan → pair → connect → simulator flow. It renders:
1. A Bluetooth icon button (toggles dropdown)
2. Dropdown with "Scan for Devices" → `BluetoothScalePairModal`
3. Once connected: live weight readout, preset weight buttons (100g / 250g / 500g / 1kg / 2kg), "Open Simulator" button, "Disconnect" button

### Critical gap — BluetoothScaleStatus is not mounted on kitchen pages:

`BluetoothScaleStatus` is imported in **`TopBar.svelte` only**, and `TopBar` is deprecated and not mounted anywhere in the current layout. The root layout (`+layout.svelte`) does not include `BluetoothScaleStatus`. The kitchen layout does not include it. The weigh station page does not include it.

**Result:** A kitchen worker arriving at the weigh station cannot:
- See whether the Bluetooth scale is connected
- Initiate a scan/pairing sequence
- Open the scale simulator for testing
- Use the preset weight simulation buttons

The only Bluetooth-related UI that appears on the weigh station page is the "Manual / Scale" mode toggle — but this toggle only renders when `btConnected === true`. If the scale was never connected (e.g., a fresh browser session), the toggle does not appear at all, and there is no guidance on how to connect.

### Connection flow intuitiveness:
- **For a non-tech-savvy kitchen worker:** No clear entry point. Zero affordance for "connect scale" on the weigh station page.
- **Disconnected error state:** No error state or instruction is shown when scale is disconnected during active weighing. The page silently falls back to manual mode.
- **Manager help:** Kitchen cannot pair the scale without manager help in the current build — not because of a PIN gate, but because the pairing UI does not exist on kitchen-accessible pages.

---

## Step 3 — Weight Input and Logging

**Method:** Code analysis of `weigh-station/+page.svelte`

### Three-panel layout:

**Left panel (w-96) — Pending Meat Orders:**
- Grouped by table/order
- Each group shows: table number, order ID, pax count, package name, suggested weight per meat (calculated as `SUGGESTED_GRAMS_PER_PAX * pax = 150g * pax`)
- Each meat item is a button with `min-height: 52px` — meets touch target minimum
- Selected item state shows `ring-2 ring-inset ring-accent` with accent orange highlight — highly visible
- No typeahead/search filter for item selection — however the pending list is KDS-derived (only unweighed pending meats), so the list is contextually filtered and unlikely to be long. This is acceptable.

**Center panel — Numpad + Weight Display:**
- 12-key numpad grid with `min-height: 72px` per key — well above 44px minimum
- Weight display: `text-6xl font-extrabold font-mono` at 72px minimum height — excellent readability at arm's length
- Unit label: explicit "g" at `text-2xl` size rendered inline
- Suggested weight shown: `~{suggestedPerMeat}g` in amber — useful contextual reference
- "C" (clear) and "DEL" (backspace) keys present — clears or corrects input without keyboard
- Max weight input: 5 characters (`weightInput.length < 5`) — max 99999g = 99.9kg — appropriate
- Input mode: numeric keyboard only (numpad), no physical keyboard required

**Dispatch button:**
- `min-height: 64px`, `py-5`, `text-xl font-extrabold`
- Background: `bg-status-green` (emerald) — high contrast against white page
- Disabled state: `opacity-30 pointer-events-none` when weight is empty/zero
- Label: "DISPATCH" in all-caps

**Stock display for selected item:** There is NO current stock level shown for the selected meat item when weighing. The item selector shows `quantity` (e.g., "2x") from the KDS ticket, but the actual current stock level (how much is in the freezer) is not surfaced. This is a missing context signal for kitchen staff.

**One-hand operation:** The numpad and DISPATCH button are in the center panel. After selecting an item from the left panel (right hand), weighing and dispatching can be done with the left hand on the numpad. This is workable but the layout is horizontal (3-column), which may require two-handed operation on a narrow display.

**Bluetooth scale mode (when connected):**
- Mode toggle: `Manual` / `Scale` — tab-style, `min-height: unset` (small but toggling is a one-time action)
- Live weight display: `text-6xl` in green (stable) / yellow (unstable) / gray (idle) — color-coded stability states
- Stability indicator: "~" prefix for unstable, "stable" / "unstable" labels
- Auto-fill: `BluetoothWeightInput` auto-fills `weightInput` when scale stabilizes — no confirmation step before auto-fill
- `BluetoothWeightInput` in the scale mode panel uses a standard `<input type="number">` — this is an auxiliary input, not the primary display

**Dispatch timing:** Select item (1 tap) → enter weight on numpad (3-4 taps) → DISPATCH (1 tap) = 5-6 actions. Target of <30 seconds per item is achievable.

---

## Step 4 — Yield Calculator Modal (S12)

**Method:** Code analysis of `YieldCalculatorModal.svelte`

### Modal structure:

- Full-screen overlay with dark theme (`bg-gray-900 border border-gray-700`)
- Header: "Yield Calculator" + ✕ close button (`text-xl hover:text-white`) — close button is small (text only), estimated ~24px, below 44px minimum
- Meat Cut dropdown (`<select>`) pre-filled with first meat item — native HTML select, acceptable for kitchen
- Raw Slab Weight (g): `BluetoothWeightInput` — keyboard-connected, auto-fills from scale
- Trimmed Usable Weight (g): `BluetoothWeightInput` — second input for trimmed weight
- Yield % result: `text-5xl font-black font-mono` — very prominent
- Color coding: green (≥80%), yellow (≥65%), red (<65%) — instant visual quality indicator
- Calculation: real-time `$derived` — updates on every keystroke, no submit needed (Doherty Threshold met)
- "Log Yield" button: `py-4 text-lg font-bold`, `w-full rounded-xl` — good touch target
- Gate: "Log Yield" requires Manager PIN via `ManagerPinModal` — creates friction for kitchen staff

### Issues identified:

1. **Manager PIN gate on yield logging** — Kitchen staff cannot log a yield without manager authorization. In a mid-service delivery scenario, the manager may not be present at the weigh station. This creates a workflow bottleneck for a routine kitchen task.

2. **Close button is text-only "✕"** — `class="text-gray-400 hover:text-white text-xl"` with no explicit `min-height` or `min-width`. This is below the 44px touch target minimum for damp/greasy kitchen hands.

3. **Both weight inputs are keyboard-dependent in baseline state** — `BluetoothWeightInput` shows a standard `<input type="number">` that requires keyboard entry when scale is not connected. There is no numpad in the yield calculator, unlike the main weigh station. Staff must use the software keyboard.

4. **No numpad in yield calculator** — Inconsistent with the main weigh station UX which has a custom numpad. The yield calculator relies on `<input type="number">` fields.

5. **Meat cut dropdown is not searchable** — Native `<select>` with potentially 80+ stock items. No typeahead. For a specific delivery, kitchen needs to scroll to find the correct cut.

---

## Step 5 — Navigation + All Orders View

**Method:** Code analysis of `kitchen/+layout.svelte`, snapshot of initial page load

### Sidebar navigation:

- Sidebar shows: "Kitchen" and "Stock" nav items — correct for kitchen role
- Sub-navigation within kitchen: "All Orders" | "Order Queue" | "Weigh Station"
- Active page highlight: SubNav component applies active state styling
- Back to KDS: 1 tap on "Order Queue" sub-nav link — immediate, no confirmation
- "Kitchen" main nav item links to `/kitchen` which redirects to `/kitchen/orders`

### All Orders view:

Not directly snapped in this session (due to session instability), but from prior audits: the `/kitchen/all-orders` view lists all open orders across tables with status indicators. Kitchen role can see all active orders per `session.locationId = 'tag'`.

### LocationBanner kitchen-role behavior:

- Banner is read-only for kitchen (no "Change Location" button)
- Shows "ALTA CITTA (TAGBILARAN)" with blue color scheme
- Access level: "Kitchen Ops" when on kitchen section, "View Only" on stock section
- Correct — kitchen staff are locked to `locationId: 'tag'`

---

## Section A — What Works Well

1. **Three-panel layout is well-conceived.** Pending (left) / Weighing (center) / Dispatched (right) maps cleanly to the physical workflow: look at queue → weigh → log. No cognitive load to understand the flow.

2. **Weight display is glanceable.** `text-6xl font-extrabold font-mono` at minimum 72px height is readable from 60cm arm's length. The "g" unit is always visible. The amber "Suggested: ~{n}g" reference is immediately useful.

3. **Numpad eliminates keyboard dependency** for the core weighing workflow. All 12 keys are 72px height. Damp-hand safe.

4. **DISPATCH button is prominent and safe.** 64px height, full-width, green color, disabled state prevents double-dispatch. Single confirmed action.

5. **Bluetooth stability color-coding is excellent.** Green (stable) / yellow (unstable) / gray (idle) with "~" prefix for unstable readings. Kitchen staff can see at a glance whether to wait before dispatching.

6. **Suggested weight per pax** (`~{pax * 150}g`) is shown contextually — kitchen gets a sanity check target before they weigh. This is a genuine operational aid.

7. **Dispatched log (right panel)** maintains a session log of all dispatched portions with table, cut name, weight, and time. Useful for end-of-service reconciliation.

8. **Yield calculator is real-time.** `$derived` math means kitchen sees `yieldPct` update on every keystroke — no "Calculate" button needed. Color feedback (green/yellow/red) is instant.

9. **Location reset on location change** — `$effect` in weigh station resets `dispatched`, `selectedItem`, and `weightInput` when `session.locationId` changes. Prevents ghost data from previous branch session.

---

## Section B — Friction Points (Moderate)

**B1 — No persistent Bluetooth connection status indicator on weigh station page**
When kitchen arrives at the page, there is no visual indicator of whether the scale is connected. The Manual/Scale mode toggle only appears if `btConnected === true`. If disconnected, the page shows no guidance. Kitchen staff have no way to know if the scale is expected to be working or if they need to do something.

**B2 — Yield calculator requires Manager PIN**
Logging a yield is a routine measurement record (gross weight → trimmed weight → yield%). It requires no financial authorization. Gating it behind a manager PIN creates unnecessary friction for an informational logging task. In a live delivery mid-service, the manager may be on the POS floor.

**B3 — No current stock level shown during weighing**
When kitchen selects a meat item to weigh (e.g., "Wagyu Beef"), there is no indication of how much Wagyu is currently in stock. A cook who has just received a delivery might weigh 2kg of Wagyu but not know that the system shows 0g remaining (because nothing was received yet). Stock context would help catch data entry errors.

**B4 — Yield calculator close button is below 44px**
The "✕" close button on `YieldCalculatorModal` is text-only, approximately 24px. With greasy hands, this is a difficult tap. The `ManagerPinModal` correctly uses a full-area close button — the yield calculator should match.

**B5 — Numpad input capped at 5 characters (99999g)**
99.999kg is the theoretical max. For a 500g beef slab, kitchen types "500" (3 chars). For 1.2kg, they type "1200" (4 chars). The 5-character limit is fine. However, there is no visual "max reached" feedback when the limit is hit — the numpad just stops appending silently.

---

## Section C — Critical Gaps (P0)

**C1 — P0: No Bluetooth pairing UI accessible from kitchen pages**

The `BluetoothScaleStatus` component (which contains the Scan / Pair / Simulator interface) is imported ONLY in the deprecated `TopBar.svelte`. `TopBar` is not mounted in the current layout.

**Impact:** Kitchen staff have zero mechanism to connect a Bluetooth scale. The "Scale" mode on the weigh station is unreachable in practice without pre-pairing the scale from a different device/session. The hardware integration is architecturally complete but UX-severed.

**Required fix:** Mount `BluetoothScaleStatus` (or a simplified "Connect Scale" button) within either:
- The `MobileTopBar` (mobile) / sidebar footer (desktop)
- The weigh station page itself (as a persistent header element)
- The kitchen `+layout.svelte` header strip

**C2 — P0: Scale simulator not accessible in kitchen context**

The `BluetoothScaleSimulator` component (used for dev/testing weight readings without a physical scale) is only accessible via `BluetoothScaleStatus` dropdown. Since `BluetoothScaleStatus` is not mounted on kitchen pages, the simulator cannot be opened from the weigh station. This blocks development testing and QA verification of the scale workflow.

---

## Section D — Weigh Station Specific Recommendations

### D1 — Add persistent Bluetooth status to weigh station page header (P0)

Mount a simplified `BluetoothScaleStatus` pill or "Connect Scale" button in the weigh station page's own header strip (between the sub-nav and the three-panel content area). This should show:
- Scale name + battery when connected (e.g., "OHAUS ST22E · 87%")
- "Connect Scale" CTA when disconnected

This makes the scale connection self-contained on the weigh station page — kitchen staff do not need to navigate away or call a manager.

### D2 — Remove Manager PIN gate from yield logging (P1)

Yield recording is an informational measurement log, not a financial transaction. It requires kitchen expertise (knowing the gross/trimmed weights), not manager authority. Remove the PIN gate from "Log Yield". If audit trail is needed, use `log.yieldRecorded()` with the logged-in `session.userName` as the author (this already happens after PIN verification — just move the log call before the PIN step and remove the PIN step entirely).

### D3 — Show current stock for selected item during weighing (P1)

In the center panel, after a meat item is selected, show a small stock context line:
```
Wagyu Beef — Selected
Stock on hand: 2.4 kg | Suggested: ~600g for 4 pax
```
This lets kitchen verify the delivery weight makes sense relative to the running stock balance.

### D4 — Add numpad to yield calculator modal (P1)

The yield calculator currently uses `<input type="number">` fields that require a software keyboard. Add the same numpad from the main weigh station page to the yield calculator, or at minimum use `BluetoothWeightInput` + a "Lock Weight" button so both raw and trimmed weights can be entered via the scale in sequence.

### D5 — Fix yield calculator close button touch target (P2)

Change the close button from `<button class="text-gray-400 hover:text-white text-xl">✕</button>` to a minimum 44×44px touch area. Match the pattern used in `ManagerPinModal` or other modals that use explicit `w-8 h-8` or `w-10 h-10` button sizes.

### D6 — Add "max input reached" feedback on numpad (P2)

When `weightInput.length >= 5`, show a brief visual pulse or shake on the display to indicate the limit is reached. Currently the keys simply stop appending silently. A kitchen worker tapping "6" after entering "12345" gets no feedback.

### D7 — Make yield calculator meat cut selector searchable (P2)

Replace the native `<select>` with a searchable dropdown (or filtered button list) for the meat cut field in the yield calculator. With 80+ potential stock items, scrolling a native select is slow and error-prone under service pressure.

### D8 — Persist dispatched log across page refreshes (P2)

The dispatched log (`let dispatched = $state([])`) is in-memory only. A page reload clears the entire session log. During a mid-service delivery, a kitchen worker refreshing the page loses all portion records. Even a 15-minute sessionStorage cache would be valuable.

---

## Summary — P0 / P1 / P2 Findings

### P0 — Blockers (must fix before production)

| ID | Finding | File(s) | Status |
|----|---------|---------|--------|
| C1 | `BluetoothScaleStatus` not mounted on any active layout — scale pairing is inaccessible from kitchen pages | `+layout.svelte`, `kitchen/+layout.svelte`, `BluetoothScaleStatus.svelte` | 🔴 OPEN |
| C2 | Scale simulator unreachable in kitchen context — blocks QA and development testing of scale workflow | `BluetoothScaleStatus.svelte`, `BluetoothScaleSimulator.svelte` | 🔴 OPEN |

### P1 — High Priority (blocks efficient kitchen ops)

| ID | Finding | File(s) | Status |
|----|---------|---------|--------|
| B2 | Yield logging requires Manager PIN — blocks kitchen-only routine measurement during delivery | `YieldCalculatorModal.svelte` | 🔴 OPEN |
| D3 | No current stock shown during weighing — missing sanity context when logging delivery weight | `weigh-station/+page.svelte` | 🔴 OPEN |
| D4 | No numpad in yield calculator — breaks consistency and forces software keyboard in greasy-hand context | `YieldCalculatorModal.svelte` | 🔴 OPEN |

### P2 — Polish / Improvement

| ID | Finding | File(s) | Status |
|----|---------|---------|--------|
| B1 | No persistent Bluetooth status on page load (before item selection) | `weigh-station/+page.svelte` | 🔴 OPEN |
| B4 | Yield calculator close button ~24px — below 44px touch target | `YieldCalculatorModal.svelte` | 🔴 OPEN |
| B5 | Silent max-input on numpad — no feedback when 5-char limit reached | `weigh-station/+page.svelte` | 🔴 OPEN |
| D7 | Native `<select>` for meat cut in yield calculator — not searchable for 80+ items | `YieldCalculatorModal.svelte` | 🔴 OPEN |
| D8 | Dispatched log is session-memory only — lost on page refresh | `weigh-station/+page.svelte` | 🔴 OPEN |

### Operational readiness verdict

The weigh station is **not ready for live mid-service delivery use** in its current state. The P0 blocker (no path to connect the Bluetooth scale from kitchen pages) means the core value proposition — hands-free weight capture from a Bluetooth scale — is architecturally severed from the kitchen UX.

The manual numpad fallback works well and could serve as a short-term workaround, but kitchen staff would have no guidance to know they should use manual mode, because the scale connection UI is absent.

Once P0 C1 is resolved (mounting `BluetoothScaleStatus` in an accessible location for kitchen), the page becomes functionally usable. The P1 items (Manager PIN on yield, missing stock context) would then become the primary friction points for a real service environment.

**Estimated fix effort:**
- C1+C2: Mount `BluetoothScaleStatus` in kitchen layout header — ~1-2 hours
- B2: Remove PIN gate from yield logging — ~30 minutes
- D3: Add stock context line — ~1 hour
- D4: Add numpad to yield calculator — ~2 hours
- B4+B5+D7+D8: Combined polish — ~3-4 hours
