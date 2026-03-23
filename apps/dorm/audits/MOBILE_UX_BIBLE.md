# UX Bible — Unified Experience Index (UXI)

**Purpose**: Single scientific scoring framework for all dorm app UX audits. Applies to both desktop and mobile — each dimension has viewport-specific criteria. All thresholds cite quantitative research.

---

## 1. The 7 Dimensions

### D1: Task Efficiency (Weight: 20%)

How few interactions does the common case require? Combines click count, smart defaults, pre-fill, and remembered preferences.

| Score | Criteria | Research Basis |
|-------|----------|----------------|
| 10 | 1-2 clicks for common case. All fields pre-filled, user only confirms. | Pre-fill: 3x finish rate (Fenris); +25% completion (Google) |
| 8-9 | 2-3 clicks. Primary fields pre-filled, 1-2 need manual entry. Preferences remembered. | Autofill: 71% vs 59% completion (Zuko); +189% conversion (Formstack) |
| 6-7 | 4-5 clicks. Some defaults (date, name), amounts/selections need work. | |
| 4-5 | 6+ clicks. Only trivial defaults, most fields empty. | |
| 1-3 | Every field manual, no defaults, no memory of prior choices. | 4→3 fields = +50% conversion (HubSpot, n=40k) |

**What to audit**:
- Count clicks from intent to completion (e.g., "Make Payment" → "Submit")
- Check: are billings pre-selected? Amount auto-computed? Name pre-filled? Method remembered?
- Desktop: keyboard shortcuts, Tab flow, Enter-to-submit
- Mobile: tap count, sticky CTA reachability

### D2: Scroll & Density (Weight: 15%)

How compact is the form? How many screenfuls? Are fields grouped and paired efficiently?

| Score | Criteria | Research Basis |
|-------|----------|----------------|
| 10 | Form fits in 1 screenful (mobile) or 1 dialog (desktop). ≤4 effective fields. | 57% viewing time above fold (NNGroup); 4 fields +160% conversion (Formstack) |
| 8-9 | ~1.5 screenfuls mobile, CTA visible or sticky. 5-7 fields, grouped in 2 sections. Inputs paired where logical. | 74% viewing time in first 2 screenfuls (NNGroup) |
| 6-7 | 2 screenfuls, sticky CTA. 8-10 fields, grouped. | Sticky nav: 70% faster first click (Smashing Magazine) |
| 4-5 | 2-3 screenfuls, no sticky CTA. 11-15 fields, some grouping. | Each field beyond 8: -3-7% conversion (Baymard) |
| 1-3 | 3+ screenfuls, CTA hidden. 15+ fields, ungrouped. | Ungrouped: 42% one-try success vs 78% grouped (CHI study) |

**What to audit**:
- Measure `form height / viewport height` (mobile: 667px viewport, 267px with keyboard)
- Count effective fields (pre-filled = 0.5 weight)
- Check: are Amount+Reference paired? Paid By+Date paired? Sections visually grouped?
- Desktop: do 3-column layouts use proportional widths? Does dialog fit without scroll?
- Mobile: are billings collapsible? Is allocation in footer?

### D3: Information Architecture (Weight: 15%)

Is every displayed datum purposeful? Are labels clear? Is the mental model obvious?

| Score | Criteria | Research Basis |
|-------|----------|----------------|
| 10 | Zero redundancy. Every label self-explanatory. User never asks "what does this mean?" | Cognitive load theory: each redundant item adds processing cost |
| 8-9 | At most 1 intentional repetition (e.g., amount in form + footer). Labels clear to non-technical users. | Dual-coding: CTA mirrors form amount = acceptable |
| 6-7 | 2 redundant values. Some labels use developer terminology. | |
| 4-5 | 3+ redundancies. Labels like "Selected Amount" vs "Payment Amount" confuse. | |
| 1-3 | Same value shown 4+ times. Raw enum labels ("UTILITY", "PENDING"). | |

**What to audit**:
- Count how many times each monetary value appears on screen simultaneously
- Check: do labels match user's mental model? ("Total Due" not "Outstanding Total", "Paying" not "Payment Amount")
- Are status badges suppressed when all-same? (noise reduction)
- Desktop: is summary column additive (new info) or redundant?
- Mobile: does sticky footer duplicate the form, or serve as unique anchor?

### D4: Input Quality (Weight: 15%)

Touch targets, keyboard handling, font sizes, focus flow — the physical interaction layer.

| Score | Criteria | Research Basis |
|-------|----------|----------------|
| 10 | All targets ≥48dp. `inputmode` correct on all fields. Font ≥16px (no iOS zoom). Auto-focus first field. Logical Tab order. | Material Design 48dp; iOS zoom <16px (WebKit) |
| 8-9 | All targets ≥44px. `inputmode` on numeric fields. Font ≥16px. Good Tab order. | Apple HIG 44pt minimum |
| 6-7 | Most targets ≥44px. Some `inputmode`. Font ≥16px. | |
| 4-5 | Several targets 24-35px. No `inputmode`. Default keyboards everywhere. | WCAG AA minimum 24px |
| 1-3 | Targets below 24px, overlapping, or focus traps. iOS zoom issues. | Keyboard ≈ 60% mobile viewport (Smashing Magazine) |

**What to audit**:
- Measure all button/input heights (`min-h`, `h-`, `py-` classes)
- Check `inputmode` attributes: decimal for amounts, tel for phone, text for reference
- Verify input font ≥16px (prevents iOS Safari zoom)
- Test Tab order in both desktop and mobile
- Desktop: keyboard shortcuts (Enter to submit, Escape to close)
- Mobile: does virtual keyboard obscure critical info? Spacing between adjacent tappable elements?

**Key rules**:
- Amount: `inputmode="decimal"` → numpad with decimal point
- Phone: `inputmode="tel"` → phone dial pad
- Reference: `inputmode="text"` → full keyboard (alphanumeric)
- Checkbox visual: 20px mobile / 16px desktop, but tap area ≥44px via container padding

### D5: Visual Hierarchy (Weight: 10%)

Grouping, typography, layout proportions, responsive adaptation, aesthetic coherence.

| Score | Criteria | Research Basis |
|-------|----------|----------------|
| 10 | Clear section grouping with headers. Consistent typography scale. Responsive breakpoints well-tuned. `tabular-nums` on amounts. | White space between groups reduces perceived complexity (NNGroup) |
| 8-9 | Good grouping and hierarchy. Minor inconsistencies. Desktop/mobile layouts both considered. | |
| 6-7 | Visible structure but some areas feel cluttered or misaligned. | |
| 4-5 | Inconsistent spacing, mixed font sizes, no clear visual sections. | |
| 1-3 | No grouping, wall-of-inputs. Desktop layout breaks on mobile or vice versa. | Grouped 78% vs 42% one-try success (CHI) |

**What to audit**:
- Are form sections separated by headers, borders, or whitespace?
- Is the typography scale consistent? (labels `text-xs`, values `text-sm`, amounts `text-base tabular-nums`)
- Desktop: are column proportions intentional (e.g., `1fr/1.2fr/0.8fr`)?
- Mobile: do billings use compact rows? Are input pairs responsive?
- Are monetary values right-aligned with `tabular-nums`?
- Is `bg-primary/5` or similar used to highlight the key summary row?

### D6: Progressive Disclosure (Weight: 10%)

Hidden complexity. Only show what's needed for the current step.

| Score | Criteria | Research Basis |
|-------|----------|----------------|
| 10 | Only essential fields visible. Edge-case fields (SD warnings, notes) appear only when triggered. Collapsible sections. | 18% abandon "too long/complicated" (Baymard) |
| 8-9 | Collapsible detail sections. Common path is clean. Conditional fields work. | Accordions: "most useful design elements" on mobile (NNGroup) |
| 6-7 | Some progressive disclosure (e.g., collapsed billings). Some always-visible edge cases. | |
| 4-5 | All fields shown at once. Edge-case warnings always visible. | |
| 1-3 | Every possible field and warning shown simultaneously. | Multi-step: 52% vs 8% completion for long forms (Venture Harbour) |

**What to audit**:
- Count fields visible at open vs total interactable elements → `disclosure_ratio`
- Are billings collapsed on mobile after pre-selection?
- Are SD info/warning boxes conditional (only when SD method or billing selected)?
- Is reference field hidden or disabled for Cash?
- Is allocation preview collapsible on mobile?
- Desktop: is the 3rd column (summary) visible but not dominant?

### D7: Feedback & Safety (Weight: 15%)

Validation, loading states, success feedback, error prevention, and safety guards.

| Score | Criteria | Research Basis |
|-------|----------|----------------|
| 10 | After-blur validation. Loading spinner on submit. Rich success feedback (amount, method, count). Duplicate guard. Undo option. Submit disabled with reason shown. | Inline validation: +22% success, -42% time (Wroblewski) |
| 8-9 | Validation on submit with clear messages. Loading state. Success toast. Submit disabled with hint. | |
| 6-7 | Validation exists but generic. Loading state exists. Basic toast. | After-blur better than instant: fewer context-switch errors |
| 4-5 | Submit-only validation, no loading indicator. Basic error alert. | Instant validation: MORE errors (n=77, n=90 studies) |
| 1-3 | No validation, silent failures. No loading state. Double-submit possible. | |

**What to audit**:
- Is submit button disabled with reason text? (not just grayed out silently)
- Does submit show spinner + "Submitting..." text?
- Is there a duplicate payment guard? (check for recent similar payment)
- What does success look like? (toast with amount/method? transient badge on card?)
- Are error messages specific? ("Amount exceeds deposit" not "Invalid input")
- Desktop: can user press Enter to submit?
- Mobile: does confirmation use native `confirm()` or custom modal?

---

## 2. UXI Composite Score

```
UXI = (D1 × 0.20) + (D2 × 0.15) + (D3 × 0.15) + (D4 × 0.15) +
      (D5 × 0.10) + (D6 × 0.10) + (D7 × 0.15)
```

### Grade Scale

| UXI | Grade | Interpretation |
|-----|-------|----------------|
| 9.0-10.0 | A+ | Best-in-class — publish as case study |
| 8.0-8.9 | A | Excellent — minor polish opportunities |
| 7.0-7.9 | B | Good — some friction points to address |
| 6.0-6.9 | C | Acceptable — users can complete but feel friction |
| 5.0-5.9 | D | Below average — noticeable abandonment risk |
| <5.0 | F | Failing — redesign required |

### Dimension Cross-Reference

Every old metric maps to exactly one UXI dimension:

| Old General UX Metric | Old MSI Metric | → UXI Dimension |
|----------------------|----------------|------------------|
| Click count | — | **D1: Task Efficiency** |
| Common-case optimization | D6: Smart Defaults | **D1: Task Efficiency** |
| — | D1: Scroll Depth | **D2: Scroll & Density** |
| — | D2: Field Density | **D2: Scroll & Density** |
| Information density | D5: Info Redundancy | **D3: Information Architecture** |
| Cognitive load | — | **D3: Information Architecture** |
| — | D3: Touch Targets | **D4: Input Quality** |
| — | D4: Input Focus | **D4: Input Quality** |
| Visual clarity | — | **D5: Visual Hierarchy** |
| — | D7: Progressive Disclosure | **D6: Progressive Disclosure** |
| Error prevention | D8: Feedback | **D7: Feedback & Safety** |
| Feedback quality | — | **D7: Feedback & Safety** |

---

## 3. Input Standards

### Input Pairing Rules

**Safe to pair at ≥375px width:**
- Amount + Reference # (number + short text)
- First name + Last name (equal weight)
- City + Postal code (unequal but conventional)

**Safe to pair at ≥640px (sm: breakpoint):**
- Paid By + Date (text + date picker)
- Method + Reference (select + text)
- Start date + End date

**Never pair on mobile (<375px):**
- Any fields where either would be <140px wide
- Fields with long labels that would truncate
- Date pickers (calendar popover needs width)

### Height Standards

| Element | Mobile | Desktop | Notes |
|---------|--------|---------|-------|
| Text input | `h-10` (40px) | `h-8` (32px) | iOS zoom safe at 16px font |
| Button (primary) | `min-h-[44px]` | `h-8` (32px) | Apple HIG touch target |
| Button (secondary) | `min-h-[44px]` | `h-8` (32px) | No smaller on mobile |
| Checkbox | `h-5 w-5` (20px) | `h-4 w-4` (16px) | Tap area ≥44px via padding |
| Select/Dropdown | `h-10` (40px) | `h-8` (32px) | Native select on mobile |
| Method pill | `py-2.5 min-h-[44px]` | `py-1.5` | Pill group, not dropdown |

### Font Size Rules

| Element | Mobile | Desktop | Rationale |
|---------|--------|---------|-----------|
| Input text | 16px (1rem) | 14px (0.875rem) | <16px triggers iOS zoom |
| Label | 12px (0.75rem) | 12px | Consistent |
| Helper/error | 11-12px | 11px | Below input |
| Section header | 11px uppercase | 11px uppercase | Visual grouping |
| Amount display | 16-18px tabular-nums | 14-16px tabular-nums | Monetary emphasis |

---

## 4. Scroll Reduction Strategies (Priority Order)

| # | Strategy | Impact | Evidence |
|---|----------|--------|----------|
| 1 | Pre-fill everything possible | -3-5 effective fields | +25% completion (Google), 3x finish (Fenris) |
| 2 | Collapsible detail sections | -30-50% initial height | Most useful mobile pattern (NNGroup) |
| 3 | Pair related inputs | -40px per paired row | Conventional pairs don't increase errors |
| 4 | Sticky submit footer | CTA always visible | 70% faster first click (Smashing Magazine) |
| 5 | Progressive disclosure of edge cases | Remove rarely-needed fields | -18% abandonment (Baymard) |

---

## 5. Audit Checklist

### Must-have (Blocks UXI above 6)
- [ ] All touch targets ≥44px
- [ ] Input font-size ≥16px (no iOS zoom)
- [ ] Submit button visible (sticky footer or fits in viewport)
- [ ] Primary fields pre-filled where data exists
- [ ] `inputmode` set on numeric fields
- [ ] Loading state on submit button
- [ ] Submit disabled with visible reason text

### Should-have (Blocks UXI above 8)
- [ ] Related inputs paired on wider viewports
- [ ] Collapsible sections for non-primary content
- [ ] No redundant information (same value max 2× with purpose)
- [ ] After-blur validation on required fields
- [ ] Remembered preferences (last payment method)
- [ ] Duplicate submission guard
- [ ] Success feedback with transaction details

### Nice-to-have (UXI 9-10)
- [ ] Auto-focus first interactable field
- [ ] Keyboard dismissal on scroll
- [ ] Undo/receipt option after submit
- [ ] Field count ≤5 for common path
- [ ] Transient success indicator on source card/row

---

## 6. Rent Management Domain Patterns

These patterns are specific to dormitory/property management apps. They override generic form UX advice when there's a domain-specific need.

### 6.1 Lease List Scanning (The "Wall of Cards" Problem)

| Principle | Detail |
|-----------|--------|
| **Problem** | A property with 40 leases creates a wall of visually similar cards. When 37/40 are overdue, every card screams urgent — urgency signal is lost. |
| **Research** | NNGroup F-pattern eye-tracking: users scan top-left first, then sweep right, then down the left edge. Cards not on the left edge or top row get less attention. |
| **Fix: Severity gradient** | Use 4-tier color severity on left border + status dot: amber (<30d) → red-400 (30-90d) → red-600 (90-180d) → red-800 pulsing (180d+). This creates visual differentiation even when all cards are "overdue." |
| **Fix: Sort by urgency** | Sort by `daysOverdue` descending, not `updated_at`. Most critical leases appear first (F-pattern primacy). |
| **Fix: Summary cards as filters** | Clickable stat cards (Total/Paid/Pending/Partial/Overdue) act as both at-a-glance KPIs and filter toggles. Reduces cognitive load from scanning 40 cards to scanning 5 numbers. |

**Card vs. List on mobile** (NNGroup 2024):
- Cards are **less scannable** than lists — "the positioning of individual elements is fixed in size and more predictable in a vertical list"
- Cards take **more space** — "any given screen size can't show as many cards as a list view"
- Cards are **poor for comparison** — users look "back and forth multiple times"
- **Recommendation for lease lists**: Use compact card rows (not full cards) on mobile — one line per lease with status dot + name + balance. Expand on tap.

### 6.2 Payment Recording (The Primary Workflow)

| Principle | Detail |
|-----------|--------|
| **Context** | Recording a rent payment is the #1 task for property managers. It happens 40-100 times per month (once per lease). Speed and accuracy matter equally. |
| **Optimal flow** | 2 clicks: "Pay ₱X" → "Submit". All fields pre-filled from context (billings, amount, payer, date, last method). |
| **Pre-fill priority** | 1. Select all unpaid billings. 2. Auto-compute amount. 3. Pre-fill payer name from lease. 4. Default date to today. 5. Remember last payment method (localStorage). |
| **Research** | Baymard: avg checkout has 23.48 form elements, but ideal is 12-14. Most sites can achieve 20-60% reduction. A +35.26% conversion uplift is possible from checkout redesign alone. |
| **Duplicate guard** | Financial forms need extra safety — confirm if a similar amount was recorded for the same lease in the last 24h. |

### 6.3 Status Indicator Hierarchy

Status indicators are critical in rent management — a property manager glancing at a dashboard must instantly see which leases need attention.

**Severity color scale** (based on Carbon Design System + Astro UX DS + RAG pattern research):

| Level | Color | Border | Dot | When |
|-------|-------|--------|-----|------|
| Critical | `red-800` | `border-l-red-800` | `bg-red-700 animate-pulse` | 180+ days overdue |
| High | `red-600` | `border-l-red-600` | `bg-red-600` | 90-180 days overdue |
| Medium | `red-400` | `border-l-red-400` | `bg-red-400` | 30-90 days overdue |
| Low | `amber-500` | `border-l-amber-500` | `bg-amber-500` | <30 days overdue |
| Warning | `orange-400` | `border-l-orange-400` | `bg-orange-400` | Pending (not yet due) |
| Partial | `amber-400` | `border-l-amber-400` | `bg-amber-400` | Partially paid |
| Good | `green-500` | `border-l-green-500` | `bg-green-500` | Fully paid |

**Key rule**: Color must never be the sole indicator (WCAG). Always pair with text ("170d overdue"), icon, or position. The pulsing animation on 180d+ adds a non-color signal.

### 6.4 Cross-Screen Workflow Patterns

Property managers start on desktop (office) and check on mobile (walking the building or off-site). The app must support **sequential cross-device usage**.

| Pattern | Desktop Behavior | Mobile Behavior | Research |
|---------|-----------------|-----------------|----------|
| **Lease overview** | Full table with all columns, filters, bulk actions | Compact cards with status dot + name + balance, expandable detail | NNGroup: "lock headers, allow column subset" for mobile tables |
| **Payment recording** | 3-column modal (billings / form / summary) | Single column with collapsible billings, sticky footer | NNGroup: hiding navigation "cuts discoverability in half" — don't hide the CTA |
| **Billing review** | Side-by-side comparison, multi-select | Stacked cards, tap to expand | NNGroup: cards "poor for comparison" — offer sort/filter instead |
| **Reports/insights** | Full dashboard with charts | KPI cards only, charts on demand | <40% info density = 63% faster pattern recognition |

**Feature parity rule** (NNGroup): "Most companies have understood the need of delivering a decent mobile experience that is not reduced to 2-3 randomly picked pieces of content." All critical actions must be accessible on mobile — not just viewing.

### 6.5 Dashboard Scanning Patterns

**F-pattern** (NNGroup, 232 users, thousands of pages):
- Users read horizontally across the top first
- Then scan down the left side
- Then read horizontally again lower
- Total: 57% viewing time in first screenful

**Applied to dorm dashboard**:
- **Top row**: Summary stat cards (Total/Paid/Pending/Partial/Overdue) — catches the horizontal sweep
- **Left edge**: Lease names + status dots — catches the vertical scan
- **Right side**: Balance amounts — caught on the second horizontal sweep
- **Below fold**: Secondary info (dates, penalties) — gets only 26% of viewing time

### 6.6 Data Table → Card Conversion Rules

When converting desktop tables to mobile, follow these evidence-based rules:

| Rule | Detail | Source |
|------|--------|--------|
| **Prioritize columns** | Show only: status + name + primary amount on mobile. Hide: dates, notes, secondary amounts | NNGroup: "limit what's shown by default on small screens" |
| **Expand on tap** | Tap card to reveal full details (dates, penalty breakdown, allocations) | Progressive disclosure: -18% abandonment (Baymard) |
| **Lock identifiers** | Name + status always visible, even when scrolling horizontally | NNGroup: "leftmost column should be locked in place" |
| **25 rows optimal** | Paginate at 24-25 items per page for performance and scanability | Industry consensus for data-dense tables |
| **Cut-off hint** | Partially visible last card signals "scroll for more" | Gestalt closure principle |

### 6.7 Utility Billing Workflow

| Principle | Detail |
|-----------|--------|
| **Context** | Utility readings are entered in bulk (per meter, per floor). This is a data entry task, not a decision task. |
| **Speed rule** | Tab between fields, auto-advance on entry, numpad keyboard (`inputmode="decimal"`) |
| **Error prevention** | Flag readings that are lower than previous (meter rollback), highlight outliers (>2x previous) |
| **Mobile consideration** | Readings are often entered while walking the building with phone in hand — inputs must be large, keyboard must be numeric |

---

## 7. Cognitive Psychology Applied to Rent Management

### 7.1 Hick's Law — Choice Reduction

| Aspect | Dorm App Application |
|--------|---------------------|
| **Statement** | Decision time increases logarithmically with number of choices |
| **Applied** | 40 lease cards = ~5.3 bits of choice entropy. Filter by status (5 categories) reduces to ~2.3 bits → 57% faster scanning |
| **Check** | Count visible interactive elements per screen state. Flag >7 ungrouped choices at same hierarchy level |
| **Fix** | Summary stat cards as filters, search debounce (300ms), sort options |

### 7.2 Miller's Law — Chunking

| Aspect | Dorm App Application |
|--------|---------------------|
| **Statement** | Working memory holds 7 ± 2 chunks |
| **Applied** | Payment modal groups fields into 3 visual sections (Billings / Form / Summary). Lease cards chunk info into 3 rows (name+balance / tenants+status / actions) |
| **Check** | Count unchunked items in any list, panel, or card. Flag >7 |
| **Fix** | Section headers, visual separators, grouped stat cards |

### 7.3 Fitts's Law — Target Reachability

| Aspect | Dorm App Application |
|--------|---------------------|
| **Statement** | Time to reach target = f(distance / size). Bigger + closer = faster |
| **Applied** | "Make Payment" button is the primary action — it must be the largest, most reachable button on each lease card. Desktop: right-aligned, h-9. Mobile: full-width-ish, min-h-[44px] |
| **Check** | Measure touch targets (min 44px). Check distance between primary CTA and the data it acts on |
| **MIT Touch Lab** | Average fingertip pad is 10-14mm wide (Dandekar, Raju & Srinivasan, 2003). Targets below 9.6mm (~36px) show significantly higher error rates |

### 7.4 Jakob's Law — Conventions

| Aspect | Dorm App Application |
|--------|---------------------|
| **Statement** | Users expect your app to work like other apps they use |
| **Applied** | Property managers use Buildium, AppFolio, TenantCloud. Common patterns: left sidebar nav, status-colored cards, payment modals, summary dashboards. Follow these conventions. |
| **Check** | Compare layout patterns to leading property management tools |

### 7.5 Doherty Threshold — Responsiveness

| Aspect | Dorm App Application |
|--------|---------------------|
| **Statement** | Productivity soars when response time < 400ms (Doherty & Thadhani, IBM, 1982) |
| **Applied** | RxDB local-first reads are instant. Server writes use optimistic updates (appear instant, sync in background). Resync uses bgResync with 500ms debounce. |
| **Check** | Time every interaction from tap to visual feedback. Flag >400ms without loading indicator |

### 7.6 Serial Position Effect — Ordering

| Aspect | Dorm App Application |
|--------|---------------------|
| **Statement** | People remember first and last items best (primacy + recency) |
| **Applied** | Sort overdue leases first (most urgent = primacy). "Make Payment" button is last element in card row (recency). Sidebar nav: Dashboard first (most used), Settings last |

---

## Sources

| Source | Key Finding | Year |
|--------|-------------|------|
| NNGroup Eye-Tracking | 57% viewing time above fold, 74% in first 2 screenfuls; F-pattern across 232 users | 2018 |
| NNGroup Mobile Tables | Lock headers, allow column subset, hide less-critical columns on mobile | 2024 |
| NNGroup Cards vs Lists | Cards less scannable than lists, take more space, poor for comparison | 2024 |
| NNGroup Navigation Hiding | Hiding nav cuts discoverability "almost in half", increases task time | 2024 |
| NNGroup Feature Parity | "Content must be prioritized over chrome on mobile" — don't strip critical features | 2024 |
| HubSpot (n=40,000) | 4→3 fields = +50% conversion | 2019 |
| Baymard Institute | Each field beyond 8: -3-7% mobile conversion; avg checkout 23.48 elements, ideal 12-14; +35.26% conversion from checkout redesign; 20-60% field reduction possible; 17% abandon due to difficult checkout | 2024 |
| CHI Study | Grouped forms: 78% one-try success vs 42% ungrouped | 2020 |
| Luke Wroblewski | Inline validation: +22% success, -42% time, +31% satisfaction | 2009 |
| Google Chrome | Autofill: +25% completion, 30% faster | 2021 |
| Zuko Analytics | Autofill: 71% vs 59% completion | 2023 |
| Fenris | Pre-fill: 3x finish rate | 2022 |
| Venture Harbour | Multi-step: up to 300% conversion uplift | 2020 |
| Smashing Magazine | Sticky nav: 70% faster first click; keyboard ≈ 60% viewport | 2023 |
| Material Design | 48dp touch target, 56dp input height | 2023 |
| Apple HIG | 44pt minimum touch target | 2024 |
| WCAG 2.2 | 24px AA, 44px AAA touch targets | 2023 |
| Stripe | Mobile cart abandonment ≈79% vs desktop ≈67% | 2025 |
| Formstack | ≤4 fields: +160% conversion; social autofill: +189% | 2020 |
| MIT Touch Lab | Average fingertip 10-14mm; <9.6mm = significantly higher error rates | 2003 |
| Parhi, Karlson & Bederson | Targets below 9.2mm: significantly higher thumb error rates (MobileHCI '06) | 2006 |
| Doherty & Thadhani | <400ms response time → disproportionate productivity increase (IBM Systems Journal) | 1982 |
| Carbon Design System | Status color palette: severity scale from grey (off) to red (alert) | 2024 |
| Astro UX DS | Status system: severity levels with shape + color + text redundancy | 2024 |
| ScienceDirect | Dashboard info load: cognitive style affects hazard recognition speed vs accuracy | 2023 |
| UX Magazine | Dashboard <40% info density correlates with faster pattern recognition | 2024 |
| Buildium/AppFolio | Leading property management UX: centralized dashboards, mobile-first rent collection, tenant profiles | 2025 |
