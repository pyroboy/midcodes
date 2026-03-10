# UX Audit — Owner Expense Post-Correction Review (Tag Branch)
**Date:** 2026-03-09
**Role:** Boss Chris (owner)
**Location:** Alta Citta (Tagbilaran) — `tag`
**Scenario:** Post-correction review — Manager-B corrected Meat Procurement entry ₱55,000 → ₱5,500
**Viewport:** 1024×768 (tablet)
**Auditor:** Claude (automated, playwright-cli)

**Retrospective Update:** 2026-03-09 · post-fix-session review
**Fix Progress:** 4 of 15 issues resolved (P0: 1/3 · P1: 2/6 · P2: 1/6)

---

## A. Text Layout Map

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Sidebar Rail]  │  ALTA CITTA (TAGBILARAN)      [Change Location]    │
│  W!             │  ─────────────────────────────────────────────────  │
│  POS            │  Branch Reports  📍 Alta Citta (Tagbilaran)        │
│  Kitchen        │                                                      │
│  Stock          │  [Operations] [Expenses] [Revenue&Sales] [Profit.]  │
│  Reports ←      │  [Compare]                                           │
│  Admin          │  ─────────────────────────────────────────────────  │
│  ─────          │  [Today]  [This Week]  [This Month]                  │
│  B              │                                                      │
│  Logout         │  Tagbilaran Branch     Panglao Branch                │
│                 │  -₱210.00              ₱19,462.00                   │
│                 │  Net Profit            Net Profit                    │
│                 │  ─────────────────────────────────────────────────  │
│                 │  METRIC           TAGBILARAN   PANGLAO               │
│                 │  Gross Sales      ₱8,290       ₱21,040 ✓            │
│                 │  Net Sales        ₱8,290       ₱20,712 ✓            │
│                 │  Total Expenses   ₱8,500       ₱1,250  ✓            │
│                 │  Gross Profit     -₱210        ₱19,462 ✓            │ ← FOLD
│                 │  Net Profit       -₱210        ₱19,462 ✓            │
│                 │  Gross Margin     -2.5%         92.5%  ✓            │
│                 │  Net Margin       -2.5%         92.5%  ✓            │
│                 │  Total Pax        20            37     ✓            │
│                 │  Avg Ticket       ₱415          ₱560   ✓            │
└──────────────────────────────────────────────────────────────────────┘

X-READ PAGE (Step 3/4):
┌──────────────────────────────────────────────────────────────────────┐
│  Branch Reports  📍 Alta Citta (Tagbilaran)                          │
│  Mar 9, 2026   Live — shift still open       [Print] [Generate X-Read]│
│  ─────────────────────────────────────────────────────────────────── │
│  [Gross Sales ₱0] [Net Sales ₱0] [Total Pax 0] [Avg Ticket ₱0]     │
│  ─────────────────────────────────────────────────────────────────── │
│  Payment Breakdown (Live)    │  Order Status                         │
│   Cash ₱0 / GCash ₱0        │   Open: 0  Paid: 0  Voided: 0        │
│   Maya ₱0 / Credit/Debit ₱0 │                                        │
│  VAT Breakdown (12% inclusive)                                       │
│   Gross Sales         ₱0.00                                          │
│   VAT (12%)           ₱0.00                                          │
│   VAT-Exclusive Sales ₱0.00   ← BIR key figure, below fold          │
│  ─────────────────────────────────────────────────────────────────── │
│  X-Read History                                                       │
│   No X-Reads generated yet this shift.                               │
│   Click "Generate X-Read" to snapshot current totals.               │
│  X-Reads do NOT close the shift. Use End of Day report to finalize.  │
└──────────────────────────────────────────────────────────────────────┘

PROFIT-GROSS PAGE (Step 6):
┌──────────────────────────────────────────────────────────────────────┐
│  Branch Reports  📍 Alta Citta (Tagbilaran)                          │
│  [Today*] [This Week] [This Month]                                   │
│  ─────────────────────────────────────────────────────────────────── │
│  [Net Revenue ₱0] [Food COGS ₱0] [Gross Profit ₱0] [Margin 0.0%]   │
│  ─────────────────────────────────────────────────────────────────── │
│  COST COMPONENT           AMOUNT    % OF REVENUE                     │
│  No food expenses logged for this period.                            │
│  Total COGS               ₱0.00     0.0%                            │
│  Profit Waterfall: Revenue ₱0 → Food COGS −₱0 → = Gross Profit ₱0  │
│  Live from RxDB                                                       │
│  COGS = logged Meat Procurement + Produce & Sides expenses           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## B. Step-by-Step Findings

### Step 1 — Branch Comparison, Week Period
**Verdict: CONCERN**

**Observation:** Location context visible via "📍 Alta Citta (Tagbilaran)" subtext in the report header and LocationBanner shows "ALTA CITTA (TAGBILARAN)" — passes location clarity. Period buttons [Today/This Week/This Month] are top-positioned and accessible. However, Tagbilaran shows -₱13,966 net profit (week), heavily red. No visual warning treatment — the negative number is rendered identically to the positive Panglao number in font weight/color.

**Data (This Week):**
- Tagbilaran: Gross Sales ₱1,664 / Total Expenses ₱15,630 / Gross Profit **-₱13,966** / Margin -839.3%
- Panglao: Gross Sales ₱13,126 / Total Expenses ₱8,517 / Gross Profit ₱4,321 / Margin 32.9%

**Issues:**
- **P1** — Negative gross profit (-839.3%) shows no red/warning color treatment in comparison table cells. Owner may not notice severity at a glance.
- **P2** — Header card shows "Net Profit" label for the hero numbers, but the table also has both "Gross Profit" and "Net Profit" as separate rows with identical values — implying no distinction between the two metrics (no operating expenses or depreciation layer), which may confuse a financially-literate owner.
- **P2** — Period selector uses standard gray border buttons; no visual affordance indicating which is currently selected (no active state in the week view at initial load — defaults to week but no active indicator visible in snapshot).

---

### Step 2 — Today Period, Expense Impact Review
**Verdict: CONCERN**

**Observation:** Switching to Today correctly filters data. Tagbilaran today shows:
- Gross Sales: ₱8,290 / Total Expenses: **₱8,500** / Gross Profit: **-₱210** / Margin: -2.5%
- The corrected expense scenario (₱55,000 → ₱5,500 + ₱2,300 = ₱7,800 COGS) is not the data reflected here — actual data shows ₱8,500 total expenses (₱8,500 Meat Procurement "Pork belly delivery"). The ₱210 negative margin is very close to break-even.

**Issues:**
- **P1** — Negative gross profit (-₱210) in the hero card and comparison table receives no red color treatment. The -₱210 hero card text is visually identical to positive profit display. A small negative on a ₱8,290 revenue day is alarming — owner is operating at a loss.
- **P1** — "✓" checkmark on Panglao column cells (indicating Panglao is "winning") has no corresponding visual for Tagbilaran — there's no "losing" indicator (e.g., "↓" or red badge) to create the visual asymmetry that drives urgency.
- **P2** — The comparison uses "Gross Profit" = Revenue minus Total Expenses. This is technically Net Operating Profit, not standard accounting Gross Profit (which is Revenue minus COGS only). Labeling may confuse owner and create discrepancy vs. /reports/profit-gross page.

---

### Step 3 — X-Read for Tag Branch, BIR Compliance
**Verdict: PASS with concerns**

**Observation:**
- Location clearly shown: "📍 Alta Citta (Tagbilaran)" in report header, LocationBanner shows "ALTA CITTA (TAGBILARAN)". Owner knows this is tag.
- Gross Sales stat is the first and most prominent figure in the 4-stat grid — good hierarchy.
- VAT Breakdown section exists: shows Gross Sales / VAT (12%) / VAT-Exclusive Sales — the key BIR figure is present.
- Generate X-Read button is visible and enabled (session.locationId = 'tag', not 'all') — correct behavior.
- Page shows "Live — shift still open" status indicator — useful context.

**Issues:**
- **P1** — VAT Breakdown is placed inside "Payment Breakdown (Live)" section, subordinated visually. For BIR compliance purposes, VAT-Exclusive Sales (the figure BIR actually needs for VAT returns) should not live nested under a "payment" grouping — it belongs in its own dedicated BIR section alongside the 4-stat grid.
- **P2** — The 4-stat grid (Gross Sales, Net Sales, Total Pax, Avg Ticket) is missing: Void Count, Total Discounts (Senior/PWD), and Total Expenses. All three are BIR-relevant for O.R. compliance and daily reconciliation.
- **P2** — No link or cross-reference to the expenses report from the X-Read page. An owner reviewing X-Read to assess shift health cannot jump directly to expenses without navigating separately.

---

### Step 4 — X-Read BIR Compliance Deep Assessment
**Verdict: CONCERN**

**Observation:** Evaluating the page structure without generating an X-Read.

**BIR Sufficiency Assessment:**
| BIR Requirement | Present? | Notes |
|---|---|---|
| Gross Sales | ✅ | Prominent in 4-stat grid |
| Net Sales | ✅ | In 4-stat grid |
| VAT-Exclusive Sales | ✅ | In VAT Breakdown (nested) |
| VAT Amount | ✅ | In VAT Breakdown |
| Void Count | ❌ | Only voided orders count, no void amounts |
| Discount breakdown (Senior/PWD) | ❌ | Not present |
| Total expenses (COGS) | ❌ | No reference to expenses on this page |
| Payment method breakdown | ✅ | Cash/GCash/Maya/Credit-Debit |
| Opening/Closing OR numbers | ❌ | Not tracked (Phase 1 limitation) |

**The "X-Reads do NOT close the shift" note** appears as a single plain-text paragraph at the bottom of the page after the X-Read History section. It is informational but low-prominence — placed where users have already scrolled past the action area. An owner unfamiliar with BIR X-Read terminology may be anxious that generating one accidentally closes the business day.

**Issues:**
- **P0** — No void amount total on X-Read — BIR requires disclosure of cancelled transaction amounts, not just count.
- **P1** — VAT breakdown section is titled "VAT Breakdown (12% inclusive)" — the parenthetical "(12% inclusive)" is technically correct but could be misread as "12% is included in the displayed prices," which is different from "12% is included in Gross Sales and we're extracting it." Consider: "VAT Breakdown — 12% is embedded in Gross Sales."
- **P1** — The "X-Reads do NOT close the shift" note needs higher visual prominence — a colored info box (blue/neutral, not red) would reduce anxiety without alarming the user.
- **P2** — Discount totals (Senior Citizen 20%, PWD 20%) not surfaced on X-Read — needed for BIR compliance and for owner to validate cashier behavior.

---

### Step 5 — /reports/expenses-daily Navigation Test
**Verdict: FAIL**

**Observation:** Navigating to `http://localhost:5173/reports/expenses-daily` via Playwright's `goto` redirected to `/expenses` (the quick-entry expense page). The page at `/reports/expenses-daily` **does exist** with proper code — it renders a full analytics view with period breakdown (Today/Week/Month), expense category table with % of sales, net cash flow card, and a "Log New Expense" button. However, the Playwright session navigation landed at `/expenses` instead.

**Root cause hypothesis:** The sidebar's "Log Expense" quick-action link (`/expenses`) appears to have intercepted the navigation — possibly a preloading behavior in SvelteKit or a competing `goto()` triggered by a reactive `$effect`. The route at `/reports/expenses-daily` line 39-43 has a `$effect` that calls `goto('/reports/expenses-daily', ...)` when `?action=open` is in the URL — this should not trigger on a clean navigation, but warrants investigation.

**The actual /reports/expenses-daily page (from code review) has:**
- 4-stat summary grid: Total Sales / Total Expenses / Net Cash Flow (color-coded) / Expense Ratio
- Expense breakdown table: Category | Amount | % of Sales | Proportion bar
- "Log New Expense" button — doubles as an expense entry point (overlap with /expenses page)
- No link back to /expenses (the per-entry log)
- No edit/correct capability — read-only analytics

**Today's actual data at /expenses:** 1 expense: Meat Procurement ₱8,500.00 "Pork belly delivery" — only visible in the raw log, not the analytics breakdown.

**Issues:**
- **P0** — Route `/reports/expenses-daily` is silently navigating away to `/expenses` during normal use. Owner attempting to access the analytics view hits the data-entry page instead — goal failure.
- **P1** — Two separate expense pages exist (`/expenses` and `/reports/expenses-daily`) with overlapping functionality (both allow adding expenses) but different primary purposes. The information architecture is ambiguous: is `/expenses` the "operational" entry and `/reports/expenses-daily` the "analytical" view? If so, they should link to each other explicitly.
- **P1** — `/reports/expenses-daily` has no "Edit" or "Correct" affordance — owner who spots an error in the category breakdown has no path to fix it from the report. Must navigate back to `/expenses` manually.
- **P2** — Net Cash Flow card uses a red/green color distinction (`status-red` / `status-green`) — accessible per design system, but label "Net Cash Flow" is semantically different from "Gross Profit" — it's Revenue minus ALL Expenses, which is actually operating income. Inconsistent financial terminology across pages (branch-comparison calls this "Gross Profit", expenses-daily calls it "Net Cash Flow").

---

### Step 6 — /reports/profit-gross Gross Profit Report
**Verdict: CONCERN**

**Observation:** Page loads correctly at `/reports/profit-gross`. Location context is displayed ("📍 Alta Citta (Tagbilaran)"). Period defaults to "This Week" but Today data was checked. Today view shows:
- Net Revenue: ₱0.00 / Food COGS: ₱0.00 / Gross Profit: ₱0.00 / Margin: 0.0%
- "No food expenses logged for this period."
- "Profit Waterfall: Revenue ₱0 → Food COGS −₱0 → = Gross Profit ₱0"
- Footer note: "COGS = logged Meat Procurement + Produce & Sides expenses"

**Critical finding:** The ₱8,500 Meat Procurement expense visible in `/expenses` does NOT appear here as COGS. The profit-gross page shows ₱0 Food COGS for today, while branch-comparison shows ₱8,500 Total Expenses. This is a **data discrepancy** — either the COGS filter is not reading today's date correctly, or the "food expenses" filter is not matching today's data.

**Issues:**
- **P0** — COGS calculation shows ₱0 for today despite a ₱8,500 Meat Procurement expense existing in the data. This suggests a date-filtering bug in the profit-gross page's COGS derivation. Owner will see a misleadingly healthy ₱0 COGS / 0% margin, obscuring a real cost.
- **P1** — "Profit Waterfall" is a creative element but at ₱0/₱0/₱0, it communicates nothing. An empty-state message would be more useful: "No completed sales recorded today" or "No food expenses match today's date."
- **P1** — COGS is defined as "Meat Procurement + Produce & Sides expenses" (the footer note confirms this) but the branch-comparison page calculates Gross Profit as Revenue minus ALL expenses. The two pages are using different formulas for "Gross Profit" — an owner switching between them will get contradictory numbers for the same question.
- **P2** — No drill-down from the COGS table row to the underlying expense entries. Owner sees a category total but cannot click to see which specific purchases make up that COGS figure.

---

## C. Best Day Ever — Empathy Narrative

Boss Chris woke up earlier than usual. The correction from yesterday — Manager-B fixed that ₱55,000 typo in the meat procurement entry — should show up in the numbers today. He opens his tablet, the app loads instantly. Alta Citta is showing in the LocationBanner. He taps over to branch comparison, checks "Today."

The numbers load. Tagbilaran is red: -₱210. He leans forward. *Wait, is that still wrong?* He squints at the table. Total expenses ₱8,500. He remembers: the corrected amount was supposed to be ₱5,500. But the number here says ₱8,500. *Did the correction not save?* He navigates to the expense log — the actual `/expenses` page — and sees "Pork belly delivery: ₱8,500." The description matches a real delivery. So the correction did save ₱5,500 for the original entry, but there's another ₱8,500 entry for today's delivery. The numbers are actually correct.

He tries to cross-check via the gross profit report. He taps "Gross Profit" in the nav. It loads — and shows ₱0 for everything. *The data's broken.* He refreshes. Still ₱0. He doesn't know this is a COGS filter bug. He pulls out his phone to call Manager-B.

The app lost his trust at the last step.

---

## D. Recommendations

### P0 Issues (Fix before go-live)

| # | Issue | Location | Effort | Impact | Status |
|---|---|---|---|---|---|
| P0-1 | Void amount total absent from X-Read — BIR requires disclosure of cancelled transaction totals, not just order count | `/reports/x-read` | S | High | 🟢 FIXED |
| P0-2 | `/reports/expenses-daily` navigation redirecting to `/expenses` — route is unreachable from direct navigation in some contexts | `/reports/expenses-daily` | S | High | 🔴 OPEN |
| P0-3 | Profit-gross page shows ₱0 Food COGS today despite ₱8,500 Meat Procurement expense existing in RxDB — likely date-filter mismatch between `createdAt` vs. local date comparison | `/reports/profit-gross` | M | High | 🔴 OPEN |

### P1 Issues (Fix before first user training)

| # | Issue | Location | Effort | Impact | Status |
|---|---|---|---|---|---|
| P1-1 | Negative gross profit values in branch-comparison table and hero cards have no red color treatment — severity not communicated visually | `/reports/branch-comparison` | S | High | 🔴 OPEN |
| P1-2 | VAT Breakdown section nested inside Payment Breakdown — BIR's key figure (VAT-Exclusive Sales) should be promoted to top-level prominence near the 4-stat grid | `/reports/x-read` | S | Med | 🔴 OPEN |
| P1-3 | "X-Reads do NOT close the shift" is a single plain-text paragraph at page bottom — needs a styled info callout box for higher scan-path prominence | `/reports/x-read` | S | Med | 🟢 FIXED |
| P1-4 | "Gross Profit" means different things on different pages: branch-comparison = Revenue − All Expenses; profit-gross = Revenue − Food COGS only. Owner will get contradictory answers to the same question | Multiple | M | High | 🔴 OPEN |
| P1-5 | Discount totals (Senior Citizen, PWD) not surfaced on X-Read page — needed for BIR daily reconciliation | `/reports/x-read` | M | Med | 🔴 OPEN |
| P1-6 | No cross-link from X-Read → Expenses report or from profit-gross → expense entries — owner must navigate manually to triangulate financial picture | Multiple | S | Med | 🟢 FIXED |

### P2 Issues (Next iteration)

| # | Issue | Location | Effort | Impact | Status |
|---|---|---|---|---|---|
| P2-1 | Branch comparison table: ✓ checkmark on Panglao winner rows has no corresponding visual indicator on Tagbilaran loser rows — asymmetric visual treatment reduces urgency signal | `/reports/branch-comparison` | S | Low | 🔴 OPEN |
| P2-2 | Gross Profit and Net Profit rows in comparison table are always identical — either surface the distinction (operating costs layer) or merge the rows to reduce cognitive noise | `/reports/branch-comparison` | S | Low | 🔴 OPEN |
| P2-3 | Period selector button active state may not be visually distinct enough for high-ambient-light tablet use — verify active button contrast meets WCAG 3:1 for non-text elements | Multiple reports | S | Med | 🔴 OPEN |
| P2-4 | `/reports/expenses-daily` "Log New Expense" button duplicates entry capability already at `/expenses` — IA overlaps; consider making expenses-daily read-only and linking to `/expenses` for edits | `/reports/expenses-daily` | M | Low | 🔴 OPEN |
| P2-5 | Profit waterfall component shows no empty-state message when all values are ₱0 — three "₱0.00" rows in a visual waterfall suggest a loading error rather than no data | `/reports/profit-gross` | S | Low | 🟢 FIXED |
| P2-6 | COGS breakdown table has no drill-down to underlying expense entries — owner cannot trace aggregate to source without navigating away | `/reports/profit-gross` | L | Low | 🔴 OPEN |

---

## E. Key Findings Summary

| Step | Verdict | Primary Finding |
|---|---|---|
| 1 — Branch Comparison (Week) | CONCERN | Negative -839.3% margin with no visual warning treatment |
| 2 — Branch Comparison (Today) | CONCERN | -₱210 gross profit renders identically to positive numbers; ₱8,500 expenses reflect correctly |
| 3 — X-Read (Tag) | PASS+ | Location context clear, Generate enabled, VAT present but nested too deep |
| 4 — X-Read BIR Compliance | CONCERN | Missing void amounts, discount totals; "no close shift" note needs prominence boost |
| 5 — Expenses Daily Report | FAIL | Route navigates to /expenses instead of analytics view; two pages with overlapping purpose |
| 6 — Profit-Gross Report | CONCERN | ₱0 COGS despite real expenses — likely date-filter bug; financial terminology inconsistency |

**Top 3 Trust-Breaking Issues for Boss Chris:**
1. Profit-gross shows ₱0 when real costs exist — looks like a broken app
2. /reports/expenses-daily doesn't reliably load — goal failure when navigating from sidebar
3. Negative profit with no red coloring — owner's most important signal (branch losing money) is visually muted

**Terminology Consistency Gap (Architectural):**
The app uses "Gross Profit" to mean three different things across pages:
- `/reports/branch-comparison`: Revenue − Total Expenses (all categories)
- `/reports/profit-gross`: Revenue − Food COGS only (Meat + Produce)
- `/reports/expenses-daily`: "Net Cash Flow" = Revenue − Total Expenses

Before go-live, a single financial terminology decision needs to be made and applied consistently. Recommended: use standard accounting hierarchy (Gross Profit = Revenue − COGS; Operating Profit = Gross Profit − Operating Expenses; Net Profit = Operating Profit − Tax/Other).
