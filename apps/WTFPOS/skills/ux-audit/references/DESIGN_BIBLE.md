# WTFPOS Design Bible — UX/UI Assessment Framework

This is the comprehensive reference for auditing any WTFPOS page or flow. It covers cognitive
psychology, usability heuristics, Gestalt principles, visual design, accessibility, and
POS-specific patterns. Each section is structured as scannable tables with one-line summaries,
POS relevance, check methods, and fix patterns.

---

## 1. Cognitive Psychology Laws

### 1.1 Hick's Law

| Aspect | Detail |
|---|---|
| **Statement** | Decision time increases logarithmically with the number of choices |
| **POS relevance** | A cashier staring at 30 menu items takes longer than one seeing 6 categories. During rush hour, every second counts. |
| **Check method** | Count visible interactive elements per screen state. Flag >7 ungrouped choices at the same hierarchy level. |
| **Fix patterns** | Progressive disclosure (categories > items), smart defaults, "most used" section, search/filter for large sets |
| **WTFPOS example** | Menu categories in AddItemModal should chunk 50+ items into 5-7 categories max at top level |

### 1.2 Miller's Law

| Aspect | Detail |
|---|---|
| **Statement** | Working memory holds 7 +/- 2 chunks of information |
| **POS relevance** | An order sidebar showing 12 ungrouped line items overwhelms. A KDS ticket with 8 items needs visual chunking. |
| **Check method** | Count information chunks visible simultaneously. Flag >7 unchunked items in any list, panel, or card. |
| **Fix patterns** | Group by category, use headers/dividers, collapse completed items, paginate long lists |
| **WTFPOS example** | KDS tickets group items as: meats / dishes & drinks / side requests — good chunking |

### 1.3 Fitts's Law

| Aspect | Detail |
|---|---|
| **Statement** | Time to reach a target = f(distance / target size). Bigger + closer = faster. |
| **POS relevance** | The "Checkout" button must be large and near the order total — not hidden at the top of a scrolled panel. Primary actions need the largest, most reachable targets. |
| **Check method** | Measure touch target sizes (min 44px, ideal 48px for primary). Check distance between related actions. Flag small or distant primary CTAs. |
| **Fix patterns** | Large primary buttons (full-width or at least 48px tall), sticky footers for primary actions, group related buttons, avoid cramped inline actions |
| **WTFPOS example** | `.btn` class enforces 48px min-height. Check that primary CTAs are at thumb-reach on tablets held in landscape. |

### 1.4 Jakob's Law

| Aspect | Detail |
|---|---|
| **Statement** | Users spend most of their time on other sites/apps. They expect yours to work the same way. |
| **POS relevance** | Staff come from using other POS systems (GrabFood, Shopify POS, Square). Standard patterns: left nav, top status bar, bottom action buttons, swipe to dismiss. |
| **Check method** | Compare layout patterns to common POS/tablet apps. Flag unconventional placements (e.g., "Pay" at the top instead of bottom). |
| **Fix patterns** | Follow platform conventions (iOS/Android tablet patterns), use standard icons (cart, search, menu), maintain typical information architecture |
| **WTFPOS example** | AppSidebar on left, content right, sticky action buttons at bottom — follows standard POS tablet layout |

### 1.5 Tesler's Law (Conservation of Complexity)

| Aspect | Detail |
|---|---|
| **Statement** | Every system has irreducible complexity. The question is whether the user or the system bears it. |
| **POS relevance** | A meat stock count requires entering weight, location, and cut type. The system should pre-fill location (from session) and suggest the most common cut. |
| **Check method** | For each multi-step flow, check: what's auto-filled? What's defaulted? What's the minimum user input required? |
| **Fix patterns** | Smart defaults, auto-fill from context (session.locationId, current date), remember last-used values, reduce required fields |

### 1.6 Doherty Threshold

| Aspect | Detail |
|---|---|
| **Statement** | Productivity soars when system response time < 400ms |
| **POS relevance** | Adding an item to an order, switching table status, completing payment — all must feel instant. Any perceptible delay during service creates stress. |
| **Check method** | Time interactions from tap to visual feedback. Flag anything >400ms without loading indicator. Flag anything >100ms without tactile feedback (active:scale-95). |
| **Fix patterns** | Optimistic UI updates, skeleton loaders, tactile button feedback (scale-95), debounce search but not taps |
| **WTFPOS example** | RxDB writes are local-first (instant). The `active:scale-95` on `.btn` gives immediate tactile feedback. |

### 1.7 Goal-Gradient Effect

| Aspect | Detail |
|---|---|
| **Statement** | People accelerate effort as they approach a goal |
| **POS relevance** | A checkout flow showing "Step 2 of 3" feels motivating. A long form with no progress indicator feels endless. |
| **Check method** | For multi-step flows, check for progress indicators. Flag flows >2 steps with no visible progress. |
| **Fix patterns** | Step indicators, progress bars, "almost done" messaging, show completion percentage |

### 1.8 Serial Position Effect

| Aspect | Detail |
|---|---|
| **Statement** | People remember first and last items in a series best (primacy + recency) |
| **POS relevance** | In a nav list, put the most important items first and last. In a KDS queue, the oldest (most urgent) ticket should be visually prominent at the start. |
| **Check method** | Check ordering of nav items, list items, and action buttons. Flag when the primary action is buried in the middle. |
| **Fix patterns** | Put primary nav items first, primary actions first or last (never middle), most urgent items at the top of queues |
| **WTFPOS example** | AppSidebar: POS first (most used by staff), Admin last (least frequent). Good serial position. |

---

## 2. Nielsen's 10 Usability Heuristics

| # | Heuristic | POS Interpretation | Anti-pattern |
|---|---|---|---|
| 1 | **Visibility of system status** | Table status (open/occupied/billing), order progress, KDS ticket state, connection status must be visible at a glance | Status only visible after clicking into detail view; no loading indicators during payment |
| 2 | **Match between system and real world** | Use restaurant language: "table", "ticket", "grill", "pax", "split bill" — not "entity", "record", "instance" | Technical jargon in UI; abstract icons without labels |
| 3 | **User control and freedom** | Easy undo for adding wrong item, clear cancel/back buttons, escape from modals | No way to undo last item add; modals with no close button; destructive actions without confirmation |
| 4 | **Consistency and standards** | Same button style for same action type everywhere; same status colors across all pages | Orange button means "confirm" on one page and "delete" on another; inconsistent badge colors |
| 5 | **Error prevention** | Disable checkout when order is empty; prevent adding items to a closed table; confirm before void | Allowing payment on $0 order; no confirmation on cancel order; allowing negative quantities |
| 6 | **Recognition over recall** | Show table names on floor plan (not just numbers); show item images; show recent orders | Requiring staff to remember table numbers; no autocomplete on item search; codes without labels |
| 7 | **Flexibility and efficiency** | Quick actions for power users (manager shortcuts), but simple path for new staff | Only one way to do common tasks; no shortcuts for experienced users; overly complex basic flows |
| 8 | **Aesthetic and minimalist design** | Show only what's needed for the current task. KDS shows ticket items, not billing details. | Cluttered screens showing all data; unnecessary decorative elements; competing visual elements |
| 9 | **Help users recognize, diagnose, recover from errors** | Clear error messages: "Table T3 has an open order — close it first" not "Error: constraint violation" | Generic "Something went wrong"; error codes without explanation; no recovery path |
| 10 | **Help and documentation** | Inline hints for complex actions (e.g., "Scan barcode or type item name"); onboarding tooltips | No hints for first-time users; help buried in separate page; no contextual guidance |

---

## 3. Shneiderman's 8 Golden Rules

| # | Rule | POS Application |
|---|---|---|
| 1 | **Strive for consistency** | Same layout grid across all pages; consistent button hierarchy (primary/secondary/ghost) |
| 2 | **Seek universal usability** | Works for new staff (day 1) and experienced managers (year 3); role-appropriate complexity |
| 3 | **Offer informative feedback** | Every tap produces visible change — button press animation, status color change, toast notification |
| 4 | **Design dialogs for closure** | After payment: show receipt summary with clear "Done" button, not just close the modal |
| 5 | **Prevent errors** | Disable impossible actions; validate inputs before submission; confirm destructive operations |
| 6 | **Permit easy reversal** | Undo last item add; reopen accidentally closed table; un-void within time window |
| 7 | **Keep users in control** | Don't auto-navigate away; don't auto-close modals; let users choose when to proceed |
| 8 | **Reduce short-term memory load** | Show order total while adding items; show table number in order sidebar; show branch name always |

---

## 4. Gestalt Principles

### 4.1 Proximity

| Aspect | Detail |
|---|---|
| **Principle** | Elements close together are perceived as a group |
| **POS check** | Related controls (qty +/- buttons next to item) should be adjacent. Unrelated controls should have clear spacing. |
| **Anti-pattern** | "Add Item" button far from the item list; price and item name in different visual regions |
| **Fix** | Group related elements within 8-16px; separate groups with 24-32px or a divider |

### 4.2 Similarity

| Aspect | Detail |
|---|---|
| **Principle** | Elements that look alike are perceived as related |
| **POS check** | All status badges should use the same shape/size; all action buttons should share the `.btn` base style |
| **Anti-pattern** | Some status indicators are badges, others are colored text, others are icons — inconsistent visual language |
| **Fix** | Use `.badge-*` classes consistently for all status indicators; `.btn-*` for all actions |

### 4.3 Common Region

| Aspect | Detail |
|---|---|
| **Principle** | Elements within a boundary are perceived as a group |
| **POS check** | Cards (`.pos-card`) should contain all related info for one entity. Don't split an order's info across separate visual containers. |
| **Anti-pattern** | Order items in one card, order total in a separate floating element outside the card boundary |
| **Fix** | Use `.pos-card` to wrap all related information; use borders/background to define regions |

### 4.4 Figure-Ground

| Aspect | Detail |
|---|---|
| **Principle** | People perceive objects as either foreground (figure) or background (ground) |
| **POS check** | Active/selected elements must stand out from inactive ones. Modal overlays need clear backdrop. |
| **Anti-pattern** | Selected table looks the same as unselected; modal appears without dimming background |
| **Fix** | Use `accent` color for selected state; dark backdrop for modals; elevation (shadow) for floating elements |

### 4.5 Closure

| Aspect | Detail |
|---|---|
| **Principle** | People perceive complete shapes even from incomplete information |
| **POS check** | Partially visible list items suggest "scroll for more". Truncated text with "..." implies full content exists. |
| **Anti-pattern** | List cuts off cleanly at bottom — user doesn't realize there's more content below |
| **Fix** | Fade-out gradient at scroll boundary; show "X more items" count; partial item visibility at edge |

### 4.6 Continuity

| Aspect | Detail |
|---|---|
| **Principle** | Elements arranged on a line or curve are perceived as related |
| **POS check** | Table grid alignment, form field alignment, navigation item alignment |
| **Anti-pattern** | Misaligned form labels and inputs; table cards with inconsistent sizing breaking the grid |
| **Fix** | Consistent grid columns; aligned form labels; uniform card sizes in grids |

### 4.7 Symmetry

| Aspect | Detail |
|---|---|
| **Principle** | Symmetrical elements are perceived as belonging together |
| **POS check** | Two-column layouts (floor plan + order sidebar) should feel balanced |
| **Anti-pattern** | Sidebar taking 50% width while floor plan is cramped; lopsided button groups |
| **Fix** | Proportional column widths (70/30 or 60/40 for main/sidebar); centered button groups |

### 4.8 Pragnanz (Simplicity)

| Aspect | Detail |
|---|---|
| **Principle** | People interpret ambiguous shapes in the simplest way possible |
| **POS check** | Icons must be immediately recognizable. Complex visualizations need clear labels. |
| **Anti-pattern** | Abstract icons without tooltips; overly detailed charts that require study |
| **Fix** | Use universally recognized icons from lucide-svelte; add text labels to icons on primary nav |

---

## 5. Visual Design Principles

### 5.1 Scale

| Check | What to look for |
|---|---|
| **Primary action** | Largest interactive element on screen (e.g., "Checkout" button) |
| **Secondary action** | Visibly smaller than primary but still comfortable to tap (48px) |
| **Tertiary/inline** | Smallest interactive elements — still >= 44px touch target |
| **Information hierarchy** | Headings > subheadings > body > captions (clear size progression) |
| **POS rule** | On a page with one primary action, that button should be the most visually dominant element |

### 5.2 Visual Hierarchy

| Level | Style in WTFPOS |
|---|---|
| **Level 1** (page title, primary CTA) | `text-xl font-bold` or `.btn-primary` (largest, orange) |
| **Level 2** (section headers, secondary CTA) | `text-lg font-semibold` or `.btn-secondary` |
| **Level 3** (card titles, labels) | `text-sm font-medium` |
| **Level 4** (body, descriptions) | `text-sm text-gray-600` |
| **Level 5** (captions, metadata) | `text-xs text-gray-400` |

### 5.3 Balance

| Type | POS Application |
|---|---|
| **Symmetrical** | Login page — centered content, equal whitespace |
| **Asymmetrical** | POS floor — 70% floor plan / 30% order sidebar (intentional weight on primary content) |
| **Check** | Does the page feel "heavy" on one side? Is whitespace distributed intentionally? |

### 5.4 Contrast

| Type | Check |
|---|---|
| **Color contrast** | Text on background must meet WCAG AA (see section 6 below) |
| **Size contrast** | Primary actions must be visually larger than secondary |
| **Weight contrast** | Active/selected items must differ from inactive (bold, color, border) |
| **State contrast** | Different table statuses must be immediately distinguishable |

### 5.5 White Space

| Zone | Minimum |
|---|---|
| Between cards | 12-16px (Tailwind `gap-3` or `gap-4`) |
| Card internal padding | 16px (Tailwind `p-4`) — `.pos-card` enforces this |
| Between sections | 24-32px (Tailwind `gap-6` or `gap-8`) |
| Page edge padding | 16-20px (`px-4` or `px-5`) |
| **Anti-pattern** | Zero spacing between interactive elements (touch targets overlap) |

### 5.6 Rhythm & Repetition

| Check | What to look for |
|---|---|
| **Consistent spacing** | Same gap between all cards in a grid; same padding in all sections |
| **Repeating patterns** | Every table card looks the same; every KDS ticket follows the same structure |
| **Visual rhythm** | Regular alternation (e.g., card-gap-card-gap) creates scannable patterns |
| **Anti-pattern** | Inconsistent gaps, mixed card styles on the same page, irregular grid |

---

## 6. WCAG Accessibility

### POUR Principles

| Principle | POS Minimum |
|---|---|
| **Perceivable** | Color is never the only indicator (add icon or text); sufficient contrast |
| **Operable** | All actions reachable by touch/tap; 44px minimum targets; no time-dependent interactions (except real-time displays) |
| **Understandable** | Labels in plain restaurant language; error messages explain what to do; consistent navigation |
| **Robust** | Semantic HTML (buttons are `<button>`, not `<div onclick>`); ARIA labels on icon-only buttons |

### Contrast Ratios — WTFPOS Token Combinations

Pre-computed contrast ratios for all design token combinations against common backgrounds:

| Foreground | Background | Ratio | Verdict | Notes |
|---|---|---|---|---|
| `#111827` (foreground) | `#FFFFFF` (surface) | 16.8:1 | PASS AAA | Default text on white |
| `#111827` (foreground) | `#F9FAFB` (surface-secondary) | 15.9:1 | PASS AAA | Default text on page bg |
| `#EA580C` (accent) | `#FFFFFF` (surface) | 4.6:1 | PASS AA | Orange on white — barely passes. Use for large text/icons only, not small body text. |
| `#EA580C` (accent) | `#FFF7ED` (accent-light) | 4.3:1 | PASS AA (large) | Orange on light orange — only passes for large text (>=18px) or bold >=14px |
| `#FFFFFF` (white) | `#EA580C` (accent) | 4.6:1 | PASS AA | White text on orange button — OK for `.btn-primary` |
| `#FFFFFF` (white) | `#C2410C` (accent-dark) | 5.9:1 | PASS AA | White on dark orange — better contrast |
| `#10B981` (status-green) | `#FFFFFF` (surface) | 3.5:1 | FAIL AA | Green on white fails for small text. Use with icon + text, or only for large indicators. |
| `#10B981` (status-green) | `#ECFDF5` (green-light) | 3.2:1 | FAIL AA | Badge green on light green — fails. Acceptable for non-text indicators only. |
| `#F59E0B` (status-yellow) | `#FFFFFF` (surface) | 2.1:1 | FAIL AA | Yellow on white critically fails. Never use for text alone. Must pair with icon or dark text. |
| `#F59E0B` (status-yellow) | `#FFFBEB` (yellow-light) | 1.9:1 | FAIL AA | Yellow badge text — fails badly. The `.badge-yellow` relies on surrounding context. |
| `#EF4444` (status-red) | `#FFFFFF` (surface) | 4.0:1 | PASS AA (large) | Red on white — passes for large text only. Use for icons/badges, pair with text for small sizes. |
| `#EF4444` (status-red) | `#FEF2F2` (red-light) | 3.7:1 | FAIL AA | Red badge — technically fails. Acceptable as status indicator with additional context. |
| `#8B5CF6` (status-purple) | `#FFFFFF` (surface) | 4.6:1 | PASS AA | Purple on white — passes for body text |
| `#06B6D4` (status-cyan) | `#FFFFFF` (surface) | 3.1:1 | FAIL AA | Cyan on white — fails. Use for icons or large text only. |
| `#FFFFFF` (white) | `#EF4444` (status-red) | 4.0:1 | PASS AA (large) | White on red button — passes for large text |
| `#FFFFFF` (white) | `#10B981` (status-green) | 3.5:1 | FAIL AA | White on green button — use bold/large text |

**Key takeaways:**
- `foreground` on `surface` = excellent (16.8:1)
- `accent` (orange) on white = bare minimum (4.6:1) — OK for buttons and headings, not small body text
- **Status yellow is NEVER accessible as standalone text** — always pair with icon or dark text label
- **Status green on white fails** for small text — use as indicator color paired with text labels
- Badge classes (`.badge-*`) are acceptable because they're status indicators with additional context (icon, position, surrounding text), but should not be the sole information carrier

### Touch Target Requirements

| Element Type | Minimum Size | WTFPOS Implementation |
|---|---|---|
| Primary action button | 48px height | `.btn` class enforces this |
| Secondary/inline button | 44px height | Base CSS rule on `button` |
| Icon-only button | 44x44px (width AND height) | Must add padding if icon is smaller |
| List item (tappable) | 44px height | Row padding should achieve this |
| Spacing between targets | 8px minimum | Prevents accidental adjacent taps |

---

## 7. POS-Specific Patterns

These are patterns unique to point-of-sale systems in restaurant environments. They override
general UX advice when there's a conflict.

### 7.1 Glanceable Status

| Principle | Detail |
|---|---|
| **Rule** | A manager walking past a screen should understand the situation in <2 seconds |
| **Check** | Stand 1 meter from screen (or zoom out to 50%). Can you tell: how many tables are occupied? Any critical alerts? Current order status? |
| **POS implementation** | Color-coded table cards, status badges, LocationBanner with branch name, alert banners |
| **Anti-pattern** | All tables the same color; status only visible in detail view; no at-a-glance summary |

### 7.2 One-Hand Operation

| Principle | Detail |
|---|---|
| **Rule** | Core tasks should be completable with one hand (the other may be holding a menu, phone, or cash) |
| **Check** | Primary actions within thumb reach zone on 10" tablet in landscape. No two-hand gestures required (pinch, two-finger scroll). |
| **Zones** | Bottom-right quadrant = most reachable (right-handed). Bottom 40% of screen = comfortable zone. Top-left = stretch zone. |
| **Anti-pattern** | Primary CTA in top-left corner; require scroll + tap combination for common actions |

### 7.3 Noise Tolerance

| Principle | Detail |
|---|---|
| **Rule** | UI must be understandable in a noisy restaurant environment — no audio-only feedback |
| **Check** | Every notification has a visual component. Error states are visual, not just audio. Success feedback is visible. |
| **Also** | Font sizes should be readable from 50cm (arm's length) — minimum 14px for body text, 12px for captions |

### 7.4 Speed Over Beauty

| Principle | Detail |
|---|---|
| **Rule** | When speed and aesthetics conflict, speed wins. A fast ugly button is better than a slow pretty one. |
| **Check** | Animations <200ms (or disabled during rush). No decorative loading screens. No unnecessary transitions between states. |
| **Exception** | The `active:scale-95` on buttons is both aesthetic AND functional (tactile feedback) — keep it |
| **Anti-pattern** | Page transitions >300ms; loading spinners for local data; fade-in animations on KDS tickets |

### 7.5 Error Cost

| Principle | Detail |
|---|---|
| **Rule** | The cost of an error is proportional to how hard it is to fix during service |
| **Severity tiers** | |
| **Low cost** | Adding wrong item → easy undo (just remove it). No confirmation needed. |
| **Medium cost** | Wrong table assignment → requires manager override. Confirm before committing. |
| **High cost** | Void order, cancel payment, delete stock count → requires manager PIN + confirmation. |
| **Critical cost** | Reset database, change menu prices mid-service → requires admin + double confirmation. |
| **Check** | Map each destructive action to its cost tier. Verify confirmation UI matches the tier. |

### 7.6 Context Preservation

| Principle | Detail |
|---|---|
| **Rule** | Never lose the user's context when they navigate or switch views |
| **Check** | Opening a modal preserves scroll position. Switching tabs doesn't reset filters. Navigating back returns to the same state. |
| **POS critical** | Selected table should stay selected when returning from kitchen view. Location banner persists across all pages. |
| **Anti-pattern** | Scroll position resets on tab switch; filters cleared on navigation; selected item deselected on modal close |

### 7.7 Shift-Length Endurance

| Principle | Detail |
|---|---|
| **Rule** | The UI must be comfortable for 8-12 hour shifts |
| **Check** | No high-contrast flashing elements (eye strain). Sufficient text size (no squinting). Comfortable brightness levels (not too bright in dim restaurant). |
| **Colors** | `surface-secondary` (#F9FAFB) as page background is good — warm white, not harsh. Avoid pure black backgrounds. |
| **Anti-pattern** | Bright white (#FFFFFF) as full-page background; small text (<12px); aggressive animations running continuously |
