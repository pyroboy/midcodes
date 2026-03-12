# Data Analytics & Reporting Bible

> A universal standards reference for data analysis, reporting, and dashboard design — grounded in cognitive science, visualization theory, and expert frameworks.

**Purpose:** Just as the Design Bible governs UX audits with testable rules, this document governs what to report, how to compute it, and how to present it. Every chart, KPI card, and data table should be auditable against these standards.

**How to use this document:** Each section states the principle, cites the original research, provides actionable rules, and lists anti-patterns. When reviewing or building a report, use the checklist in Section 10 as a pass/fail gate.

---

## Table of Contents

1. [Foundations of Data Communication](#1-foundations-of-data-communication)
2. [Cognitive Science of Data Perception](#2-cognitive-science-of-data-perception)
3. [Information Hierarchy & Data Importance](#3-information-hierarchy--data-importance)
4. [Visual Encoding & Chart Selection](#4-visual-encoding--chart-selection)
5. [Dashboard & Report Structure](#5-dashboard--report-structure)
6. [Data Integrity & Trust](#6-data-integrity--trust)
7. [Comparison & Context Frameworks](#7-comparison--context-frameworks)
8. [Operational Reporting Patterns](#8-operational-reporting-patterns)
9. [Accessibility & Inclusivity in Data](#9-accessibility--inclusivity-in-data)
10. [Anti-Patterns & Common Mistakes](#10-anti-patterns--common-mistakes)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Master Bibliography](#12-master-bibliography)

---

## 1. Foundations of Data Communication

### 1.1 Purpose of Data Reporting

Data reporting exists to **inform decisions, not to display numbers.** A report that presents data without enabling action is decoration. Every metric on a dashboard must answer one question: *"So what do I do differently because of this number?"* If the answer is "nothing," the metric does not belong on the dashboard.

> "The greatest value of a picture is when it forces us to notice what we never expected to see."
> — John Tukey, *Exploratory Data Analysis* (1977)

### 1.2 The Audience Spectrum

Different users need different views of the same data. Design for the audience, not for the data.

| Audience | Needs | View Type | Example |
|----------|-------|-----------|---------|
| **Executive / Owner** | High-level health, trend direction, exceptions | Glanceable KPIs, trend arrows, traffic lights | "Revenue up 12% vs last week" |
| **Operational / Manager** | Shift performance, resource allocation, immediate action items | Mid-detail with drill-down, exception flags | "Table T5 has been open for 3 hours" |
| **Analytical / Admin** | Root cause analysis, pattern discovery, full data access | Detailed tables, filters, export capability | "Void rate by cashier by day of week" |

**Source:** Stephen Few, *Information Dashboard Design* (2006, 2013 2nd ed).

### 1.3 The "So What?" Test

Every visualization must pass Cole Nussbaumer Knaflic's "So What?" test: after looking at a chart, the audience should immediately understand **why they should care.** If the reaction is "so what?", the chart lacks:

- **Context** — a number without comparison is meaningless
- **A clear takeaway** — the insight should be in the title, not hidden in the data
- **A call to action** — what should the reader do next?

**Rule:** Use **action titles**, not descriptive titles. "Weekend sales outperform weekdays by 23%" beats "Sales by Day of Week." The title states the insight; the chart proves it.

**Source:** Cole Nussbaumer Knaflic, *Storytelling with Data* (2015).

### 1.4 Storytelling with Data — The 6 Lessons

Knaflic's framework treats data visualization as a communication act, not a technical exercise:

1. **Understand the context** — Who is your audience? What do they need to know? What action should result?
2. **Choose an appropriate visual** — Match the chart type to the message (line for trends, bar for comparison, table for lookup).
3. **Eliminate clutter** — Remove gridlines, borders, legends (label directly), and decorative elements that add cognitive load without adding information.
4. **Focus attention** — Use pre-attentive attributes (color, size, position) strategically to draw the eye to the single most important finding.
5. **Think like a designer** — Affordances, accessibility, alignment, white space.
6. **Tell a story** — Narrative arc with setup, conflict, and resolution.

**The Big Idea formula:** `[Situation] + [Complication] + [Proposed Resolution]` — you should be able to explain your entire report in one sentence using this structure.

**Source:** Cole Nussbaumer Knaflic, *Storytelling with Data* (2015, Wiley).

---

## 2. Cognitive Science of Data Perception

### 2.1 Pre-Attentive Attributes

Pre-attentive processing occurs within 200-250 milliseconds — before conscious attention engages. The visual system detects certain features automatically, without serial scanning. A red dot among blue dots "pops out" instantly regardless of how many blue dots surround it.

Christopher Healey's research (1993, NC State) established that these visual features activate dedicated neural pathways operating in parallel: **color (hue)**, **size**, **orientation**, **shape**, **length**, **width**, **curvature**, **enclosure**, **intensity/luminance**, **motion**, and **density**.

**Critical limitation:** Pre-attentive advantage disappears for **conjunctions** of two features (e.g., "find the red circle among red squares and blue circles"). This forces slow, serial scanning.

**Feature hierarchy:** Luminance dominates hue, which dominates texture, which dominates curvature. Stronger features can mask weaker ones.

#### Application Rules

| Rule | Rationale |
|------|-----------|
| Use **color hue** as the primary differentiator for categorical data | Strongest pre-attentive channel for nominal distinctions |
| Use **size or length** for quantitative magnitude | Naturally encodes "more vs. less" |
| Use **position** (spatial placement) as the most precise quantitative channel | Most accurately decoded attribute |
| Limit to **one pre-attentive channel per data dimension** | Encoding different dimensions on the same channel creates confusion |
| Reserve **motion** (blinking, pulsing) for alerts only | Most attention-grabbing feature — overuse causes habituation |
| Use no more than **5-7 distinct hues** in a single view | Beyond this, the pre-attentive system cannot reliably distinguish categories |

#### Anti-Patterns

- Rainbow color palettes with 12+ hues — exceeds discriminability limits
- Using shape alone to distinguish more than 4-5 categories — shape is a weak pre-attentive feature
- Decorative variation — different colors/sizes for aesthetic reasons without data meaning. Every visual difference implies a data difference to the pre-attentive system.

**Sources:** Christopher Healey, "Harnessing Preattentive Processes for Multivariate Data Visualization" (1993); Anne Treisman, Feature Integration Theory (1980); Colin Ware, *Information Visualization: Perception for Design* (2004).

---

### 2.2 Miller's Law — The 7±2 Rule

George A. Miller (1956) demonstrated that human working memory can hold approximately **7 ± 2 chunks** of information simultaneously. The key insight is not the number 7 — it is the concept of **chunking**: the largest meaningful unit a person can recognize as a single item.

Modern research by Nelson Cowan (2001) revised the estimate downward to approximately **4 chunks** when rehearsal is prevented. This tighter bound makes the design implications urgent: if a dashboard presents 12 ungrouped KPI cards, users lose track of earlier values as they scan later ones.

#### Application Rules

- **Limit top-level KPI cards to 4-6 per view.** Group them logically so each group functions as one chunk.
- **Use visual grouping** (proximity, borders, shared background) to turn multiple items into a single perceptual chunk. Five sales numbers under a "Sales Today" heading = one chunk, not five.
- **Navigation menus: 5-7 top-level items maximum.** Sub-items live in expandable groups.
- **Chart legends: no more than 5-7 entries.** If more categories exist, use small multiples or progressive disclosure.

#### Anti-Patterns

- "Wall of numbers" dashboards — 15+ ungrouped KPI cards with no visual hierarchy
- Deep, flat navigation with 10+ top-level menu items
- Dense tables without row grouping or section headers

**Sources:** George A. Miller, "The Magical Number Seven, Plus or Minus Two" (1956, *Psychological Review*); Nelson Cowan, "The Magical Number 4 in Short-Term Memory" (2001, *Behavioral and Brain Sciences*).

---

### 2.3 Cognitive Load Theory

John Sweller's Cognitive Load Theory (1988) explains how finite working memory constrains information processing. Three types of load compete for the same limited pool:

| Load Type | Definition | Dashboard Implication | Designer Control |
|-----------|------------|----------------------|------------------|
| **Intrinsic** | Inherent complexity of the information | A multi-branch P&L report is intrinsically complex | Low — can simplify through progressive disclosure |
| **Extraneous** | Unnecessary effort imposed by poor design | Chartjunk, inconsistent colors, split-attention | High — aggressively minimize |
| **Germane** | Productive effort building understanding | Recognizing trends, forming mental models | High — promote through good design |

**The goal:** Minimize extraneous load so that freed cognitive capacity shifts to germane processing.

#### Application Rules

- **Remove chartjunk ruthlessly.** 3D effects, decorative gradients, unnecessary gridlines are all extraneous load.
- **Limit to 4-6 visualizations per view.** Self-contained views with focused analytical purpose.
- **Progressive disclosure** manages intrinsic load. Summary KPIs → drill-down for detail.
- **Maintain consistent encoding** across all reports. Same colors for same categories, same axis orientation. Inconsistency forces re-learning (extraneous load).
- **Co-locate labels and data.** Distance between related elements creates the **split-attention effect**.
- **Use familiar chart types** (bar, line, area). Novel charts impose extraneous load because users must first learn the encoding.
- **Add contextual annotations** — trend arrows, benchmarks, headline takeaways. These scaffold germane processing.

#### Anti-Patterns

- **Split-attention effect:** Chart on one screen, legend on another.
- **Redundancy overload:** Chart AND full data table AND text summary all visible simultaneously.
- **Decorative complexity:** 3D bars, skeuomorphic gauges, animated transitions with no analytical purpose.
- **Inconsistent visual language:** Blue for "Branch A" on one report, blue for "Expenses" on another.

**Source:** John Sweller, "Cognitive Load During Problem Solving: Effects on Learning" (1988, *Cognitive Science*).

---

### 2.4 Decision Fatigue

Roy Baumeister's Strength Model of Self-Control (1998) posits that all decision-making draws from a single, depletable pool of mental energy. Like a muscle, the decision-making faculty degrades with repeated use.

**Research evidence:**
- Israeli judges' parole approval rates dropped from ~65% to near 0% before breaks, resetting after eating (Danziger et al., 2011)
- Physicians prescribe antibiotics more frequently later in the day (Linder et al., 2014)
- The pattern is consistent: decision quality peaks at the start of a work period and degrades with each subsequent decision

**Dashboard implication:** By the time a restaurant manager reaches the end-of-day report, their decision capacity may already be depleted. If the dashboard demands further decisions (which date range? which filter? which branch?), it compounds fatigue rather than providing answers.

#### Application Rules

- **Present conclusions, not just data.** "Revenue is 8% above target" rather than raw numbers requiring mental arithmetic.
- **Smart defaults over blank canvases.** Default to the most useful date range, current branch, and most relevant metrics. No configuration required to see data.
- **Use color-coded status indicators** (green/yellow/red) to pre-digest performance — the fatigued user can absorb traffic lights without analytical effort.
- **Limit actionable items** per report view to the top 3-5. If everything is flagged, nothing is.
- **Design for end-of-shift scanning.** The most important dashboard (EOD report, Z-reading) is viewed when fatigue is highest. It should be the simplest view, not the most complex.

#### Anti-Patterns

- Configuration-heavy dashboards requiring multiple selections before showing data
- Equal visual weight on all metrics — no hierarchy means the user must decide what matters
- Modal interruptions ("Are you sure?" / "Select report type") that introduce micro-decisions

**Sources:** Roy F. Baumeister et al., "Ego Depletion: Is the Active Self a Limited Resource?" (1998, *JPSP*); Danziger, Levav & Avnaim-Pesso, "Extraneous Factors in Judicial Decisions" (2011, *PNAS*).

*Note: The ego depletion model has faced replication challenges (Hagger et al., 2016). The behavioral phenomenon of decision quality degradation remains empirically supported even as the underlying mechanism is debated.*

---

### 2.5 Dual-Process Theory (Kahneman)

Daniel Kahneman's framework divides cognition into two modes:

| | System 1 | System 2 |
|---|----------|----------|
| **Speed** | Fast, automatic | Slow, deliberate |
| **Effort** | Effortless | Effortful |
| **Nature** | Pattern recognition, intuition | Calculation, logical reasoning |
| **Dashboard role** | Glanceable KPIs, status colors, trend arrows | Drill-down tables, variance analysis, comparisons |
| **Depletion** | Always available | Easily exhausted |

Users operate in System 1 by default — they glance, scan, and form impressions. They shift to System 2 only when something triggers deliberate analysis: an anomaly, an unfamiliar pattern, or a specific question.

#### Application Rules

- **Top layer = System 1.** KPI cards: large number, color (green/red), direction arrow (up/down), brief label. No calculation required.
- **Drill-down layer = System 2.** Detailed tables, date-range comparisons, variance breakdowns. Gated behind an explicit user action.
- **Visual encoding over textual encoding** for System 1. A green upward arrow is processed faster than "Revenue increased by 12%."
- **Provide comparison benchmarks** within System 1 elements. "₱42,350 vs. ₱39,200 target" requires less System 2 than the number alone.
- **Anomaly highlighting** triggers System 2 selectively. A red KPI card signals "this deserves your deliberate attention."

#### Anti-Patterns

- Forcing System 2 for routine checks (user must mentally subtract two numbers to determine if they're on track)
- Overwhelming System 1 with detail (50-row table with no summary)
- No pathway from System 1 to System 2 (KPI shows "red" but no drill-down to understand why)

**Source:** Daniel Kahneman, *Thinking, Fast and Slow* (2011, Farrar, Straus and Giroux); building on Tversky & Kahneman, "Judgment under Uncertainty: Heuristics and Biases" (1974, *Science*).

---

### 2.6 Gestalt Principles Applied to Data

The Gestalt psychologists (Wertheimer, Koffka, Kohler, 1920s) described how the visual system automatically organizes elements into groups and patterns. Six principles are directly applicable to dashboards:

| Principle | Definition | Dashboard Application |
|-----------|------------|----------------------|
| **Proximity** | Close elements = same group | Related KPI cards placed together with whitespace between groups |
| **Similarity** | Shared visual properties = same category | Same color for Branch A across all reports |
| **Enclosure** | Shared boundary = unit | Card borders, background bands group related metrics |
| **Connection** | Linked elements = related | Line charts, flow diagrams exploit this (strongest grouping force) |
| **Figure-Ground** | Foreground separates from background | Data elements must contrast clearly against dashboard background |
| **Continuity** | Smooth paths = group | Trend lines, time-series axes |

#### Application Rules

- **Use proximity to create logical groups.** More whitespace between unrelated groups than within groups.
- **Use enclosure (cards, background bands) to reinforce groups.** Light background behind "Sales Metrics" vs different background behind "Expense Metrics."
- **Maintain consistent color across views.** If Branch A is orange in the sales report, it must be orange everywhere. Inconsistency breaks similarity.
- **Separate groups with whitespace, not only borders.** Whitespace costs zero visual weight. Borders add clutter.

#### Anti-Patterns

- Uniform spacing between all elements — destroys proximity grouping
- Inconsistent color mapping between reports — breaks similarity
- Cluttered backgrounds (heavy gridlines, textures) — reduces figure-ground separation

**Sources:** Max Wertheimer, "Studies on the Theory of Gestalt" (1923); Stephen Palmer, "Common Region: A New Principle of Perceptual Grouping" (1992, *Cognitive Psychology*).

---

### 2.7 Change Blindness

Change blindness is the failure to detect significant changes when the change coincides with a visual interruption — a page refresh, screen transition, or eye movement. Ronald Rensink's experiments (1997) showed participants failed to notice large objects changing color across images separated by a brief blank.

**Mechanism:** The visual system does not maintain a pixel-perfect scene representation. Motion detection — the primary change-detection tool — requires temporal continuity. Page refreshes destroy the motion signal.

**Dashboard danger:** A KPI updating from "₱38,000" to "₱42,000" during a refresh goes unnoticed unless the user happens to be looking at that specific element at that moment.

#### Application Rules

- **Animate value changes.** Brief highlight, number counting up/down, or subtle pulse when a KPI updates.
- **Transition between states** instead of instant swaps when switching filters or date ranges.
- **Provide explicit change indicators.** Delta labels ("+₱4,000 vs. yesterday"), trend arrows, "updated 2 min ago" timestamps.
- **Reduce display density.** Fewer simultaneous metrics = higher probability the user notices the one that changed.

#### Anti-Patterns

- Silent data updates with no visual indicator
- Full-page refreshes that redraw everything — all motion signals destroyed
- Dense monitoring walls with 20+ metrics updating independently
- Relying on users to remember previous values

**Source:** Ronald A. Rensink, J. Kevin O'Regan & James J. Clark, "To See or Not to See: The Need for Attention to Perceive Changes in Scenes" (1997, *Psychological Science*).

---

### 2.8 F-Pattern and Z-Pattern Eye Scanning

Eye-tracking research by the Nielsen Norman Group (Jakob Nielsen, 2006) revealed predictable scanning patterns:

**F-Pattern** (text-heavy pages, content-rich dashboards):
1. Horizontal scan across the top (F's top bar)
2. Shorter horizontal scan below (F's lower bar)
3. Vertical scan down the left edge (F's stem)

**Z-Pattern** (card-based layouts, summary dashboards):
1. Top-left → Top-right (first sweep)
2. Diagonal to bottom-left
3. Bottom-left → Bottom-right (second sweep)

**Four key positions in Z-pattern:**

| Position | Location | Content Priority |
|----------|----------|-----------------|
| **Primary Optical Area** | Top-left | Most critical KPI (scanning starts here) |
| **Strong Fallow Area** | Top-right | Second most important metric |
| **Weak Fallow Area** | Bottom-left | Secondary/contextual information |
| **Terminal Area** | Bottom-right | Calls to action, conclusions |

#### Application Rules

- **Place the single most important KPI in the top-left.** Every scanning pattern begins here.
- **Secondary metrics in the top-right.** Z-pattern's second fixation point.
- **Conclusions or calls to action in the bottom-right.** Terminal area.
- **Do not put critical information in the bottom-left.** Weakest position in both patterns.
- **Front-load headings.** "Revenue Today: ₱42,350" scans better than "Today's Total Revenue Amount: ₱42,350."
- **Use visual hierarchy to break the F-pattern.** Bold headings, color-coded sections, and card enclosures redirect the eye into intentional Z-pattern scanning.

**Sources:** Jakob Nielsen, "F-Shaped Pattern For Reading Web Content" (2006, Nielsen Norman Group); Edmund C. Arnold, *Designing the Total Newspaper* (1981) (Gutenberg Diagram).

---

### 2.9 Cross-Cutting Synthesis

These cognitive principles are not independent — they reinforce and constrain each other:

| Interaction | Implication |
|-------------|-------------|
| Miller's Law + Gestalt Proximity | Chunking is achieved through visual grouping — use proximity and enclosure to turn 12 items into 3 groups of 4 |
| Pre-attentive Attributes + Cognitive Load | Color/size encoding reduces extraneous load by making relationships visible without conscious effort |
| Decision Fatigue + Dual-Process Theory | Fatigued users default entirely to System 1 — the dashboard must work at the glanceable level |
| Change Blindness + Pre-attentive Motion | Motion is the strongest pre-attentive feature and the primary antidote to change blindness |
| F/Z-Pattern + Gestalt Figure-Ground | Visual hierarchy converts default F-pattern scanning into intentional, guided scanning |
| Cognitive Load + Miller's Law | Reducing extraneous load frees working memory, effectively increasing chunks the user can process |
| Gestalt Similarity + Pre-attentive Color | Consistent color encoding leverages both — pre-attentive pop-out AND perceptual grouping |
| Decision Fatigue + Cognitive Load | Every unnecessary interaction is both a decision AND extraneous load — both theories demand its elimination |

---

## 3. Information Hierarchy & Data Importance

### 3.1 Shneiderman's Visual Information Seeking Mantra

> **"Overview first, zoom and filter, then details-on-demand."**

Ben Shneiderman (1996) presented this in a paper that contained no data tables, no graphs, and no study participants — just an idea repeated ten times like a mantra. Despite being an opinion piece, it has accumulated over 8,000 citations and remains the foundational principle for interactive data visualization design.

**The mantra maps to dashboard architecture:**
- **Overview** = KPI cards + sparklines + traffic lights → "Is everything OK?"
- **Zoom** = Date picker + range slider → narrow the scope
- **Filter** = Dropdowns + toggles → isolate categories
- **Details-on-demand** = Modal/drawer with full record → investigate specifics

#### Application Rules

- The overview is the most important view. It must answer "Is everything OK?" within 3 seconds.
- Each drill-down level must maintain context (breadcrumbs, persistent summary strips).
- Provide escape hatches — "reset filters" in one action.
- Progressive disclosure, not progressive loading. Overview data loads immediately; detail loads on interaction.

#### Anti-Patterns

- Detail table as the default landing view (skipping overview)
- Requiring filter configuration before any data appears ("blank state" dashboards)
- Overloading the overview with so many metrics it becomes a detail view in disguise

**Source:** Ben Shneiderman, "The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations" (1996, IEEE).

---

### 3.2 Metric Classification Framework

Not all metrics are equal. Classify every metric before putting it on a dashboard:

| Category | Definition | Example | Dashboard Placement |
|----------|------------|---------|-------------------|
| **North Star** | The one number defining success | Weekly active paying customers | Top-left, largest, always visible |
| **Health Metrics** | Are things running normally? | Uptime, error rate, stock level | Traffic light indicators |
| **Diagnostic Metrics** | What went wrong and where? | Error by endpoint, waste by cut | Drill-down / detail views |
| **Vanity Metrics** | Looks good, drives no action | Total lifetime orders, page views | **Exclude from dashboards** |

**North Star Metric properties (Amplitude framework):**
1. Reflects customer value realization, not just usage
2. Represents the product strategy (someone reading it should understand the mission)
3. Is a **leading indicator** of future revenue (not revenue itself)
4. Is measurable at a frequency that enables iteration (weekly, not annually)

**North Star categories by business type:**

| Business Type | NSM Category | Example |
|---------------|-------------|---------|
| Attention (streaming, social) | Time spent | Weekly listening hours (Spotify) |
| Transaction (e-commerce, restaurant) | Volume of value exchanged | Nightly covers served per branch |
| Productivity (SaaS, tools) | Tasks completed efficiently | Reports generated per manager per week |

**Source:** Sean Ellis (GrowthHackers, 2010s); Amplitude product analytics team.

---

### 3.3 Andy Grove's Indicator Pairs

Andy Grove observed that organizations inevitably optimize whatever they measure — often destructively. His solution: **every metric must be paired with a counter-metric** that measures the side effect of optimizing the first.

> "You will probably steer it where you are looking." — Andy Grove

**Common pairs:**

| Primary Metric | Counter-Metric | Why |
|----------------|----------------|-----|
| Revenue | Profit margin | Revenue without margin = selling at a loss |
| Deals closed | Customer retention | Closing bad-fit customers destroys LTV |
| Tickets resolved | Customer satisfaction | Fast resolution without quality = churn |
| Features shipped | Bug rate | Speed without quality = tech debt |
| Speed of service | Quality of service | Fast but wrong orders = waste + complaints |
| Inventory level | Stockout incidents | Low stock saves money but loses sales |
| Orders per cashier | Void/error rate | Speed incentives cause mistakes |

#### Application Rules

- **No KPI should appear alone.** Display pairs adjacently — two cards side by side, or primary metric with sub-metric.
- **Set thresholds on both metrics.** Green on "orders served" + red on "void rate" should trigger alarm, not celebration.
- **Apply to team goals.** OKRs must include a counter-metric key result.

**Source:** Andrew S. Grove, *High Output Management* (1983, Random House).

---

### 3.4 Leading vs. Lagging Indicators

| | Leading | Lagging |
|---|---------|---------|
| **Definition** | Predicts future outcomes | Measures past results |
| **Timing** | Before the outcome | After the outcome |
| **Actionability** | High — you can still change the outcome | Low — the outcome already happened |
| **Examples** | Active covers right now, meat stock level, reservation count | Monthly revenue, quarterly profit, customer lifetime value |
| **Risk** | Harder to measure accurately | Easy to measure but too late to act on |

**Rule:** Dashboards for **operators** (managers, staff) should prioritize leading indicators — they can still act. Dashboards for **analysts** (owner, admin) should balance both, using lagging indicators to validate whether leading indicator strategies worked.

---

### 3.5 Actionable vs. Vanity Metrics (Kaushik)

Avinash Kaushik's framework distinguishes between metrics that make you feel good and metrics that make you act differently:

**Vanity metrics:** Large numbers that impress in presentations but drive no decisions. "Total lifetime orders: 45,000" tells you nothing about today's performance.

**Actionable metrics:** Reveal what needs to change. "Average order value dropped 15% this week vs. last week" implies investigating the menu mix or discount usage.

#### Rules

- Every metric must answer: *"So what do I do differently?"*
- Use **rates, not totals.** Conversion rate, not conversions. Per-visit economics, not aggregate revenue.
- **Segment everything.** An average across all traffic is almost always misleading.
- **Kill reports nobody reads.** If a report has been generated weekly for 6 months with no resulting action, delete it.

**Source:** Avinash Kaushik, *Web Analytics 2.0* (2009) and Occam's Razor blog (2006-present).

---

## 4. Visual Encoding & Chart Selection

### 4.1 Tufte's Core Principles

Edward Tufte's central thesis: graphical excellence consists of complex ideas communicated with clarity, precision, and efficiency.

**Data-Ink Ratio:**
```
Data-ink ratio = 1 - (proportion of graphics that can be erased without loss of data-information)
```
Every pixel that does not communicate data should be questioned. This does not mean strip everything — it means every visual element must earn its place.

**Lie Factor:**
```
Lie Factor = (size of effect shown in graphic) / (size of effect in data)
```
A factor of 1.0 is honest. Tufte documented a graph where a 53% numerical change was depicted as a 783% graphical change — a lie factor of 14.8.

**Chartjunk:** Visual elements that do not contribute to understanding — 3D effects, gradient fills, moire patterns, decorative clip-art.

**Small Multiples:** Series of the same small chart repeated across a grid, each showing a different slice of data. Enable comparison through consistent scales and spatial layout.

**Sparklines:** "Small, intense, simple, word-sized graphics with typographic resolution" — tiny inline charts embedded in text or tables to show trend without breaking prose.

**Six principles of graphical integrity:**
1. Representation of numbers must be directly proportional to quantities represented
2. Clear, detailed labeling
3. Label important events in the data
4. Show data variation, not design variation
5. In time-series of money, use deflated and standardized units
6. Information-carrying dimensions ≤ dimensions in the data

#### Actionable Rules

- Remove gridlines, borders, backgrounds, and legends replaceable by direct labels
- Default to 2D — never 3D unless the third dimension encodes real data
- Bar charts must start y-axis at zero (or clearly mark truncation)
- Small multiples instead of animation or overcrowded single charts
- Embed sparklines in tables for dense trend display
- Calculate lie factor for any change chart — keep between 0.95 and 1.05

**Source:** Edward Tufte, *The Visual Display of Quantitative Information* (1983, 2nd ed 2001).

---

### 4.2 Bertin's Retinal Variables

Jacques Bertin (1967) was the first to systematically classify visual properties into **retinal variables** — properties the eye processes at the retinal level without eye movement:

| Variable | Selective | Ordered | Quantitative | Best For |
|----------|-----------|---------|--------------|----------|
| **Position** (x, y) | Yes | Yes | Yes | All data types (most powerful) |
| **Size** | Yes | Yes | Yes | Quantitative magnitude |
| **Value** (lightness) | Yes | Yes | No | Sequential / ordinal data |
| **Color** (hue) | Yes | No | No | Categorical distinctions only |
| **Shape** | No | No | No | Nominal (max 5-7 shapes) |
| **Orientation** | Partial | No | No | Nominal (weak channel) |
| **Texture** | Yes | Yes | No | Ordinal |

**Key insight:** Color hue has **no natural order.** Using a rainbow scale for sequential data violates this property. Only position, size, and value (lightness) can encode magnitude.

**Source:** Jacques Bertin, *Semiology of Graphics* (1967/1983, University of Wisconsin Press).

---

### 4.3 Cleveland & McGill's Perception Ranking

William Cleveland and Robert McGill (1984) empirically ranked how accurately people decode different visual encodings, from most to least accurate:

```
1. Position along a common scale     ← most accurate (dot plot, shared axis)
2. Position on non-aligned scales    ← small multiples
3. Length                            ← bar chart
4. Angle / Slope                     ← pie chart, line slope
5. Area                              ← bubble chart, treemap
6. Volume / Density / Saturation     ← 3D charts, heatmaps
7. Color hue                         ← categorical maps (least accurate)
```

#### Implications

- For precise comparisons: bar charts (length) or dot plots (position on common scale)
- Avoid pie charts when comparing magnitudes — angle/area rank poorly
- Bubble charts (area encoding): always include numeric labels
- Heatmaps (color saturation): for pattern detection, not precise reading — pair with data table
- Line charts work because slope (rank 4) is acceptable for trend detection, and points share a common x-axis (rank 1)

**Source:** Cleveland & McGill, "Graphical Perception: Theory, Experimentation, and Application" (1984, *JASA*).

---

### 4.4 Chart Selection Decision Framework

Chart selection is driven by the **question**, not the data:

| Question Type | Best Chart Types | Avoid |
|---------------|-----------------|-------|
| **Comparison** (how do values differ?) | Bar chart, dot plot, lollipop | Pie chart |
| **Trend** (how does it change over time?) | Line chart, area chart, sparkline | Bar chart (for continuous time) |
| **Relationship** (do variables correlate?) | Scatter plot, bubble chart | Line chart |
| **Distribution** (what's the shape?) | Histogram, box plot, violin plot | Pie chart, bar chart |
| **Part-to-whole** (fraction of total?) | Stacked bar, 100% bar, donut (2-3 slices only) | Pie chart with 4+ slices |
| **Ranking** (what's the order?) | Horizontal bar (sorted), lollipop | Vertical bar (labels truncate) |
| **KPI vs. Target** | Bullet chart, progress bar | Gauge/dial (wastes space) |

**When to use a table instead of a chart:**
- Audience needs exact values
- Many dimensions to display simultaneously
- Dataset is small (< 20 rows)
- Precision matters more than pattern recognition

**Sources:** Andrew Abela, "Chart Suggestions — A Thought Starter" (2006); Stephen Few, *Show Me the Numbers* (2004, 2nd ed 2012); Data Visualisation Catalogue (Severino Ribecca).

---

### 4.5 The Case Against Pie Charts

Stephen Few wrote: "Of all the graphs that play major roles in the lexicon of quantitative communication, the pie chart is by far the least effective."

**The problem:** Humans are poor at comparing angles and areas (ranked 4th and 5th by Cleveland & McGill). We cannot accurately judge whether a 23% slice is larger than 19% without labels — defeating the purpose of a visual encoding.

**When pie charts are acceptable:**
- 2-3 categories only
- Proportional differences are large and obvious (e.g., 70%/30%)
- Primary message is part-to-whole, not comparison

**When they fail:**
- More than 3-4 slices
- Slices of similar size
- Comparing across multiple pies
- Showing change over time

**Better alternatives:** Horizontal bar charts (use length, rank 3), 100% stacked bars, or a single large-number KPI card for a key proportion.

**Source:** Stephen Few, "Save the Pies for Dessert" (2007, Perceptual Edge white paper).

---

### 4.6 Color Theory for Data Visualization

Color in data serves three distinct purposes, each requiring a different palette type:

| Palette Type | Purpose | Structure | Example Use |
|-------------|---------|-----------|-------------|
| **Sequential** | Low → High | Single hue, varying lightness | Revenue heatmap, stock level |
| **Diverging** | Negative ← Midpoint → Positive | Two hues from neutral center | Profit/loss, variance from target |
| **Categorical** | Distinct groups | Maximum hue separation | Branch comparison, payment methods |

**Colorblind safety (non-negotiable):**
- ~8% of males, ~0.5% of females have some form of color vision deficiency
- Most common: red-green confusion (deuteranopia, protanopia)
- **Never rely on red-green distinction as the sole differentiator**
- Safe diverging pair: **blue-orange**
- Test: if it works in grayscale, it works for most CVD

**Safe combinations:** Blue + Orange, Blue + Brown/Gold, Purple + Yellow, Dark blue + Light blue

**Dangerous combinations:** Red + Green, Red + Brown, Orange + Green, Pink + Gray

**Source:** Cynthia Brewer, ColorBrewer (2002, Penn State); colorbrewer2.org.

---

### 4.7 Honest Charts — Avoiding Deception

Two essential references on data honesty:

**Darrell Huff, *How to Lie with Statistics* (1954):**
- **Truncated axes ("Gee-Whiz Graphs"):** Starting y-axis above zero makes small changes appear dramatic. Revenue going from ₱1M to ₱1.05M (5%) looks like a doubling when axis starts at ₱990K.
- **Area distortion with pictograms:** Scaling width AND height causes area to grow quadratically — a 2x value appears 4x as large.
- **Cherry-picked timeframes:** Selecting a start date at an anomalous dip makes normal performance look like dramatic growth.

**Alberto Cairo, *How Charts Lie* (2019) — five ways charts deceive:**
1. **Poorly designed** — bad chart type, truncated axes, misleading color
2. **Dubious data** — biased, incomplete, or fabricated source data
3. **Insufficient data** — single data point without context
4. **Concealed uncertainty** — point estimates without error bars or confidence intervals
5. **Suggested misleading patterns** — spurious correlations from dual-axis charts

**Cairo's critical reading framework:** Who made this chart? What data does it show? What data is missing? Are the scales honest? What is the chart trying to make me feel?

#### Rules

- Bar charts must start at zero. Line charts may start above zero if clearly labeled with axis break symbol.
- Never scale pictograms in two dimensions — use length only.
- Always show uncertainty: error bars, confidence intervals, range bands.
- Normalize appropriately: per capita, per unit, inflation-adjusted, seasonally adjusted.
- Avoid dual-axis charts — use two stacked charts sharing the x-axis instead.

---

### 4.8 Munzner's Visualization Analysis Framework

Tamara Munzner (2014) provides a rigorous four-level **nested model** for visualization design:

```
Level 1: DOMAIN SITUATION     → Who are the users? What problems do they face?
Level 2: DATA/TASK ABSTRACTION → What data types? What tasks (lookup, compare, summarize)?
Level 3: VISUAL ENCODING      → Which marks (points, lines, areas) and channels (position, color)?
Level 4: ALGORITHM            → How is it computed and rendered efficiently?
```

**Key principles:**
- **Expressiveness:** The encoding should express all of, and only, the information in the data. Ordered data requires ordered channels; categorical requires identity channels.
- **Effectiveness:** Most important attributes encoded with most effective channels (follows Cleveland & McGill ranking).
- An upstream error cascades to all downstream levels. Wrong user understanding (Level 1) → wrong abstraction (Level 2) → wrong encoding (Level 3) → useless visualization.

**Rule:** Before choosing a chart type, explicitly answer: **What** (data abstraction), **Why** (task abstraction), **How** (visual idiom) — in that order.

**Source:** Tamara Munzner, *Visualization Analysis and Design* (2014, AK Peters / CRC Press).

---

## 5. Dashboard & Report Structure

### 5.1 Anatomy of a Report Page

Every report page should follow this vertical structure:

```
┌──────────────────────────────────────────┐
│  CONTEXT BAR                             │  ← Branch, date range, filters, "Live" indicator
├──────────────────────────────────────────┤
│  KPI SUMMARY ROW (4-6 cards max)         │  ← System 1: glanceable health
├──────────────────────────────────────────┤
│  PRIMARY VISUALIZATION                   │  ← The main chart answering the page's question
├──────────────────────────────────────────┤
│  DETAIL TABLE                            │  ← System 2: drill-down data
├──────────────────────────────────────────┤
│  FOOTNOTES / METADATA                    │  ← Source, generation time, methodology notes
└──────────────────────────────────────────┘
```

### 5.2 KPI Card Design Standards

**Anatomy of a KPI card:**

```
┌─────────────────────┐
│  Label              │  ← "Net Revenue"
│  ₱42,350            │  ← Large number (primary value)
│  ▲ +12.3% vs LW    │  ← Trend indicator + comparison
│  ▔▔▁▁▂▂▃▅▆█       │  ← Optional sparkline
└─────────────────────┘
```

| Element | Rule |
|---------|------|
| **Max per row** | 4-6 KPI cards (Miller's Law) |
| **Primary value** | Large font (24-36px), monospace/tabular numerals |
| **Comparison** | Always vs. same-length prior period; null if no prior data |
| **Trend indicator** | Arrow (▲/▼) + percentage + color (green=favorable, red=unfavorable) |
| **Status variant** | Green/Yellow/Red only when thresholds are defined |
| **Sparkline** | Optional — last 7-14 data points for trend context |

**Source:** Stephen Few, *Information Dashboard Design* (2006, 2013 2nd ed).

### 5.3 Progressive Disclosure

Based on Shneiderman's mantra, structure information in layers:

```
Summary → Chart → Table → Raw Data
```

- **Summary** (System 1): KPI cards visible on landing
- **Chart** (System 1→2 bridge): visual pattern, answering "what happened?"
- **Table** (System 2): detailed breakdown, answering "where exactly?"
- **Raw data** (System 2): individual records, accessible via export or modal

Each layer is gated behind an explicit user action. Never force all layers simultaneously.

### 5.4 Empty States and Zero-Data Handling

When a report has no data for the selected period:

| State | Display |
|-------|---------|
| **No data** | Dashed border box + icon + "No orders recorded for this period" |
| **Loading** | Skeleton placeholders matching final layout (no layout shift) |
| **Error** | Red banner with error message + retry button |
| **Partial data** | Show what exists + warning: "Data incomplete — 3 of 8 hours reported" |

**Never:** Show zeros when the real state is "no data." Zero ≠ null ≠ missing (see Section 6).

### 5.5 Real-Time vs. Periodic Reports

| Dimension | Real-Time | Periodic |
|-----------|-----------|----------|
| Update frequency | Seconds to minutes | End of shift / day / week |
| Use case | Kitchen queue, active tables, current stock | Sales summary, expense report, variance |
| Decision type | Tactical ("fire now") | Strategic ("hire more staff for Fridays") |
| Cognitive load | High (constant monitoring) | Low (periodic review) |
| Data freshness | Critical — stale data = wrong action | Acceptable — yesterday's summary is fine |

**Rule:** Always display a data freshness indicator: "Last updated: 2:45 PM" or "Live" with animated pulse dot.

---

## 6. Data Integrity & Trust

### 6.1 The Six Data Quality Dimensions (DAMA-DMBOK)

| Dimension | Definition | Dashboard Implication |
|-----------|------------|----------------------|
| **Accuracy** | Value matches reality | Spot-check reports against known-good data |
| **Completeness** | All required values present | Flag incomplete records; don't silently exclude |
| **Consistency** | Values agree across systems | Same location taxonomy everywhere |
| **Timeliness** | Data is current enough for the decision | Show "last updated" timestamp |
| **Validity** | Value conforms to business rules | Enforce constraints at write time |
| **Uniqueness** | Each entity represented once | Deduplicate before aggregation |

**Source:** DAMA International, *DAMA-DMBOK* (2009, 2nd ed 2017).

### 6.2 Null vs. Zero vs. Missing

These are **three different states** and must be handled differently:

| State | Meaning | Display | Aggregation |
|-------|---------|---------|-------------|
| **Null** | Unknown — we don't know the value | "N/A" or "—" | Exclude from both numerator and denominator |
| **Zero** | Measured and the value is zero | "0" or "₱0.00" | Include normally |
| **Missing** | The record that should exist does not | "No data" or warning indicator | Flag the aggregation as incomplete |

**Example:** A stock count of zero means "we counted and there's nothing." A null stock count means "nobody counted today." A missing stock record means "this item doesn't exist in the system."

**Rule:** Treating nulls as zeros inflates denominators in averages. Ignoring missing records understates totals. Handle each explicitly.

### 6.3 Rounding Rules

- **Round at the last step**, not during intermediate calculations
- **Banker's rounding** (round half to even) prevents systematic bias
- **Display precision by context:**

| Context | Precision | Example |
|---------|-----------|---------|
| Currency | 2 decimal places | ₱1,234.56 |
| Large currency aggregates | Nearest thousand with "K" | ₱123K |
| Percentages | 0-1 decimal place | 12.3% |
| Weights (grams) | Whole numbers | 2,450g |
| Weights (kilograms) | 1-2 decimal places | 2.45kg |
| Counts | Whole numbers | 42 orders |

### 6.4 Timestamp and Timezone Consistency

- **Store** all timestamps in UTC (ISO 8601: `YYYY-MM-DDTHH:mm:ssZ`)
- **Display** in local timezone only at the point of rendering
- Include timezone in user-facing timestamps when ambiguity is possible
- **"Today"** must be defined consistently: midnight-to-midnight in local time

### 6.5 Immutable vs. Mutable Reports

| Type | When | Examples |
|------|------|---------|
| **Immutable** (sealed) | Compliance, regulatory, auditable | Z-Reading, X-Reading, audit log |
| **Mutable** (live) | Operational monitoring, ongoing periods | Active orders, today's revenue, current stock |

**Rule:** Once a Z-Reading is issued, the day is sealed. No retroactive changes. Immutable reports must include a sequential, non-resettable counter.

### 6.6 Conformed Dimensions (Kimball)

When combining data from different domains (orders + inventory + expenses), shared dimensions must use **identical definitions**:

- **Date dimension** must be identical across all fact tables
- **Location IDs** must resolve to the same entities everywhere
- **Product hierarchies** must be centrally maintained

Without conformed dimensions, "revenue by location" and "expenses by location" cannot be reliably compared.

**Source:** Ralph Kimball, *The Data Warehouse Toolkit* (1996, 3rd ed 2013).

---

## 7. Comparison & Context Frameworks

### 7.1 The Four Types of Comparison

Every data visualization is fundamentally a comparison. There are exactly four types:

| Type | Question | Best Chart | Example |
|------|----------|-----------|---------|
| **Over Time** | How has this changed? | Line chart (continuous), bar (discrete) | Revenue trend, daily covers |
| **Across Categories** | How do groups differ? | Horizontal bar (sorted), grouped bar | Branch comparison, item ranking |
| **To a Target** | Are we on track? | Bullet graph, progress bar | Revenue vs. budget |
| **To a Distribution** | Is this normal or unusual? | Box plot, histogram, percentile bands | Today's revenue vs. 30-day distribution |

**Rule:** The most effective dashboard widgets combine two types — e.g., a line chart (time) with a target line (benchmark), or a bar chart (categories) with distribution whiskers.

### 7.2 Variance Analysis

| Format | Answers | Use When |
|--------|---------|----------|
| **Absolute** (actual − expected) | "How much did we miss by?" | Scale matters: "₱50K short on rent" |
| **Percentage** ((actual − expected) / expected) | "How significant is the miss?" | Comparing across different magnitudes: "5% over on food cost" |

**Rule:** Show both. "₱12,500 more (+8.3%)" is more informative than either alone.

**Direction matters:** Define "favorable" per metric. Under-budget on costs = green. Under-target on revenue = red.

### 7.3 Why Averages Lie

The arithmetic mean obscures vastly different distributions. Two datasets can have identical means but completely different shapes.

**Practical hierarchy for central tendency:**
1. Show the **median** for "typical" values (resistant to outliers)
2. Show **percentiles** (P10, P90) for range context
3. Show the **mean** only when the distribution is roughly symmetric
4. Show the **full distribution** (histogram/box plot) when shape matters

**Rule:** Order values, session durations, and transaction sizes are almost always right-skewed. The mean will overstate the typical case. Use medians.

**Source:** John Tukey, *Exploratory Data Analysis* (1977, Addison-Wesley).

### 7.4 No Lonely Numbers (Rosling)

Hans Rosling's cardinal rule: **never show a lonely number.** Every number needs at least one other for comparison — a rate, a per-capita figure, a prior-period value, or a benchmark.

"47 incidents" is meaningless without knowing if last month had 12 or 200.

**Rules:**
- **Use rates, not totals.** Revenue per customer, waste per kg purchased.
- **Apply the 80/20 rule.** Identify which 20% of items drive 80% of the result. Highlight those; summarize the rest.
- **Show the distribution, not just extremes.** The Gap Instinct thrives on showing best/worst without the middle.
- **Be skeptical of dramatic numbers.** First question: "compared to what?" Second: "is this per capita or absolute?"

**Source:** Hans Rosling, *Factfulness* (2018, Flatiron Books).

---

## 8. Operational Reporting Patterns

### 8.1 Shift-Based Reporting

Restaurant operations revolve around shifts, not calendar days.

**X-Reading (Mid-Shift Snapshot):**
- Captures register state without closing the business day
- Non-destructive: can be run multiple times per shift
- Shows: transaction count, gross sales, discounts, voids, cash in drawer

**Z-Reading (End-of-Day Close):**
- Closes the business day and seals data
- Destructive: once issued, the day is sealed for tax purposes
- Must include: gross, net, VAT breakdown, void summary, discount summary, payment method breakdown

**Shift handoff report:**
- Cash count (expected vs actual variance)
- Open orders carried over
- Outstanding issues (86'd items, equipment problems)

### 8.2 Exception-Based Reporting

Instead of showing everything, show **only what is abnormal.** Assumes everything else is fine.

**Origin:** The Andon board from Toyota's production system — green (normal), yellow (attention), red (critical). Workers pull the cord only when something deviates.

#### Rules

- **Every metric needs a threshold before earning traffic-light coloring.** No threshold = no color.
- **Yellow = trending toward red.** It is an early warning, not "kind of bad."
- **Default state is absence.** The best exception dashboard shows nothing when everything is fine.
- **Alert fatigue:** If >15-20% of metrics are yellow/red, thresholds are too tight. Recalibrate.
- **Escalation:** Red should trigger notification, not just a color on a dashboard nobody watches.
- **Pair with drill-down.** The flag says WHAT is wrong; the detail view explains WHY.

### 8.3 Trend Detection

**Moving Averages:**

| Type | Behavior | Use Case |
|------|----------|----------|
| **Simple (SMA)** | Average of last N periods | 7-day SMA smooths daily volatility |
| **Weighted (WMA)** | Recent periods weighted more | Last week matters more than 4 weeks ago |
| **Exponential (EMA)** | Exponentially decaying weights | Reacts faster to recent changes |

**Seasonality patterns to detect:**
- **Day-of-week:** Friday/Saturday peaks, Monday/Tuesday troughs
- **Monthly:** Paycheck cycles (15th and 30th spikes)
- **Annual:** Holiday seasons (Christmas, Holy Week, summer tourism)
- **Detection method:** Compare to same period last year/month/week, not just previous period

**Anomaly detection (simple):** Flag values >2 standard deviations from trailing 30-day average of the same weekday.

### 8.4 Drill-Down Paths

Effective operational reports follow progressive disclosure:

```
Level 0: KPI Summary     "Today's revenue: ₱85,000 (+12% vs last Tuesday)"
  │
  ▼
Level 1: Category        "Dine-in: ₱62K │ Takeout: ₱23K"
  │
  ▼
Level 2: Segment         "Unlimited: ₱48K (77%) │ A-la-carte: ₱14K (23%)"
  │
  ▼
Level 3: Detail          "Table T3: ₱4,200 │ 4 pax │ 2hr 15min │ Cashier: Maria"
```

Each level answers the natural "why?" from the level above. Users should never leave the current view to get the next level.

### 8.5 Inventory Flow Accounting

```
Opening Stock (AM count)
  + Deliveries received
  + Transfers in (from warehouse/other branch)
  − Sales deductions (automatic, from POS)
  − Waste logged
  − Transfers out (to other branch)
  = Expected Closing Stock
  vs.
  Actual Closing Stock (PM count)
  = Variance (shrinkage, counting error, or unlogged waste)
```

**Key metrics:**

| Metric | Formula | Alert Threshold |
|--------|---------|----------------|
| Yield rate | Portions served / theoretical portions from raw weight | < 85% |
| Waste % | Waste weight / (Opening + Deliveries) | > 8% |
| Variance % | (Expected − Actual) / Expected | > 5% |
| Days of stock | Current stock / avg daily usage | < 2 days |

---

## 9. Accessibility & Inclusivity in Data

### 9.1 WCAG 2.1 for Charts and Dashboards

| Criterion | Level | Requirement |
|-----------|-------|-------------|
| **1.4.1 Use of Color** | A | Color must not be the only means of conveying information |
| **1.4.3 Contrast (Minimum)** | AA | Text: **4.5:1** contrast ratio (3:1 for large text 18pt+) |
| **1.4.11 Non-text Contrast** | AA | Graphical objects: **3:1** against adjacent colors |
| **2.4.7 Focus Visible** | AA | Visible focus indicator on all interactive chart elements |
| **1.3.1 Info and Relationships** | A | Chart structure must be programmatically determinable |
| **1.1.1 Non-text Content** | A | Every chart needs alt text |
| **2.1.1 Keyboard** | A | All chart interactions must work without a mouse |

### 9.2 Colorblind-Safe Design

**Prevalence:** ~8% of males, ~0.5% of females. Most common: red-green confusion (deuteranopia, protanopia).

**Rule:** Never encode meaning with color alone. Every color distinction needs a redundant channel:

| Color Channel | Redundant Backup |
|---------------|------------------|
| Hue (red vs green) | Shape, pattern, label text |
| Hue (series identity) | Direct labels on lines, small multiples |
| Hue (status: good/bad) | Icons (✓/✕), text labels ("On Track"/"Alert") |
| Saturation (intensity) | Size, opacity variation with labels |

**Grayscale test:** If your chart is readable in grayscale, it works for most CVD.

**Testing tools:**
- **Chrome DevTools** → Rendering → Emulate vision deficiencies
- **Viz Palette** (projects.susielu.com/viz-palette)
- **Sim Daltonism** (macOS real-time overlay)

**Source:** Cynthia Brewer, ColorBrewer (2002); colorbrewer2.org.

### 9.3 Screen Reader Compatibility

- Use `<svg>` over `<canvas>` — SVG carries ARIA attributes; canvas is a black box
- Add `role="img"` + `aria-label` to chart containers
- Use `aria-describedby` linking to longer text descriptions
- Announce live data changes with `aria-live="polite"`
- Provide "Show as Table" toggle for every chart

**Alt text rules:**
- State the chart type: "Bar chart showing..."
- Describe the key insight, not every data point
- Include critical numbers if they are the point
- Under ~150 characters for simple charts; use `aria-describedby` for complex ones

### 9.4 Font and Number Legibility

**Tabular numerals are mandatory for data tables.** Proportional numerals misalign columns because "1" is narrower than "0."

```css
.report-numbers {
  font-variant-numeric: tabular-nums lining-nums;
}
```

| Context | Minimum | Recommended |
|---------|---------|-------------|
| Body text | 14px | 16px |
| Data table cells | 12px | 14px |
| Chart axis labels | 11px | 12-14px |
| KPI headline numbers | 24px | 28-36px |
| Annotation text | 10px | 11-12px |

**Always use lining figures** (uniform height, on baseline) for data. Oldstyle figures (varying height, descenders) are for body prose only.

### 9.5 Cultural and Locale Considerations

| Locale | Date Format | Number: 1,234.56 | Currency |
|--------|------------|-------------------|----------|
| en-PH (Philippines) | Mar 12, 2026 | 1,234.56 | ₱1,234.56 |
| en-US | Mar 12, 2026 | 1,234.56 | $1,234.56 |
| de-DE | 12.03.2026 | 1.234,56 | 1.234,56 € |
| ja-JP | 2026/03/12 | 1,234.56 | ¥1,235 |

**Rules:**
- Store dates as ISO 8601 internally
- Display as unambiguous format: "Mar 12, 2026" (not "03/12/2026")
- Always show 2 decimal places for monetary values
- Philippine week starts on Sunday
- Use ISO 4217 codes (PHP, USD) when multi-currency ambiguity is possible

### 9.6 Motion and Animation

- Respect `prefers-reduced-motion` CSS media query
- Provide controls to pause/stop auto-updating visualizations
- Never use flashing content (WCAG 2.3.1)
- Chart entry animations should be subtle and quick (< 300ms)

---

## 10. Anti-Patterns & Common Mistakes

### 10.1 Dashboard Sprawl

**What:** Creating dozens of reports nobody uses.
**Fix:** Audit usage. Zero views in 30 days → archive. Start with the 5 most important questions.

### 10.2 Vanity Metrics Front and Center

**What:** Prominently displaying numbers that always go up (total users, cumulative revenue).
**Fix:** Replace with actionable metrics. "Orders Today vs Same Day Last Week" not "Total Orders."

### 10.3 False Precision

**What:** 8 decimal places on a rough estimate.
**Fix:** Round to meaningful precision. Currency: 2 decimals. Large aggregates: nearest thousand with "K."

### 10.4 Misleading Axes

**Truncated Y-axis:** Values 98, 99, 100 starting at y=97 looks like a 3x difference.
**Dual-axis abuse:** Two y-axes with different scales — intersection point has zero meaning; creator can manipulate scales to suggest any correlation.

**Fix:** Always start bar charts at zero. Avoid dual axes — use two stacked charts instead.

### 10.5 Overloaded Charts (Spaghetti)

**What:** 10+ series on a single line chart.
**Fix:** Small multiples, highlight + gray, or heatmaps. Maximum 5-7 series per chart.

### 10.6 Ignoring Base Rates

**What:** "Void Rate: 15%" without mentioning it's 3 of 20 orders.
**Fix:** Always show both percentage and absolute count. Suppress % when sample < 30.

### 10.7 Survivorship Bias

**What:** Analyzing only successes, ignoring failures. "Average spend: ₱850" excluding voids and walkouts.
**Fix:** Track and report on failure populations. Include void counts, cancellation rates.

### 10.8 Chartjunk (Tufte)

**What:** 3D effects, gradients, background images, drop shadows.
**Fix:** Maximize data-ink ratio. Every element must earn its place. Never use 3D charts.

### 10.9 Rainbow Color Maps

**What:** Full-spectrum rainbow as sequential color scale.
**Problems:** No perceptual ordering, false edges at luminance transitions, CVD hostile, fails grayscale test.
**Fix:** Perceptually uniform palettes — Viridis, Plasma, Inferno, Cividis.

### 10.10 No Context

**What:** Showing a number without any comparison.
**Fix:** Every metric needs at least one companion: vs. prior period, vs. target, vs. distribution, per-unit normalized.

---

## 11. Pre-Ship Checklist

Use this checklist before releasing any report or dashboard.

### A. Data Accuracy

- [ ] Data comes from correct source, filtered by correct scope (location, date range)
- [ ] No off-by-one errors on date range boundaries
- [ ] SUM/AVG/COUNT operations correct — no double-counting from joins
- [ ] Monetary values rounded to 2 decimal places; no floating-point artifacts
- [ ] Nulls/missing values handled explicitly (shown as "N/A"), not silently treated as zero
- [ ] Timezone consistency — all timestamps use the same timezone
- [ ] Summary card totals match sum of detail table rows
- [ ] Empty state renders correctly (no broken layout or misleading zeros)

### B. Labeling and Context

- [ ] Every chart has a clear, descriptive title (preferably an action title stating the insight)
- [ ] Both axes labeled with units ("Revenue (PHP)", "Day of Week")
- [ ] Y-axis starts at zero for bar charts (or explicitly annotated if truncated)
- [ ] Legend present when multiple series exist; labels are human-readable
- [ ] Key data labels on important values (totals, peaks, current period)
- [ ] Comparison context provided (vs. last period, vs. target)
- [ ] Currency symbols on all monetary values
- [ ] Percentages shown with absolute counts ("15% (3 of 20)")
- [ ] Report generation timestamp displayed
- [ ] Branch/location indicator clearly shown

### C. Accessibility

- [ ] Text contrast: 4.5:1 ratio; graphical elements: 3:1 ratio
- [ ] Information not conveyed by color alone (patterns, shapes, labels, icons as backup)
- [ ] Tested with Chrome DevTools vision deficiency emulation (deuteranopia minimum)
- [ ] Charts have `aria-label` or `alt` describing the trend/insight
- [ ] "Show as Table" fallback exists for every chart
- [ ] Interactive elements reachable via Tab, activatable via Enter/Space
- [ ] Visible focus indicators on all interactive elements
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No text smaller than 11px; data table cells at least 12px
- [ ] `font-variant-numeric: tabular-nums lining-nums` on all numeric columns

### D. Visual Design

- [ ] No 3D effects, unnecessary gradients, background images, or decorative elements
- [ ] No more than 7 series on a single chart
- [ ] Colors match design system tokens — no ad-hoc hex values
- [ ] Sequential palette for ordered data (not rainbow); diverging for midpoint data
- [ ] Gridlines subtle (light gray) or removed if direct labels exist
- [ ] Responsive at mobile (320px+) and desktop widths
- [ ] Readable when printed in grayscale

### E. Actionability

- [ ] Passes the "So what?" test — viewer knows what to do next
- [ ] Drill-down available from summary metrics to detail
- [ ] Outliers/anomalies visually flagged
- [ ] Changes shown as both absolute and percentage
- [ ] Values crossing thresholds are marked
- [ ] Export available (CSV or clipboard)

### F. Performance

- [ ] Renders in under 2 seconds with typical data volume
- [ ] Handles 1,000+ records without freezing
- [ ] No layout shift after data loads (skeleton placeholders used)
- [ ] Repeated views of same date range don't re-query unnecessarily

---

## 12. Master Bibliography

### Books (ordered by influence)

| # | Author | Title | Year | Key Contribution |
|---|--------|-------|------|-----------------|
| 1 | Edward Tufte | *The Visual Display of Quantitative Information* | 1983, 2nd ed 2001 | Data-ink ratio, lie factor, chartjunk, small multiples, sparklines |
| 2 | Daniel Kahneman | *Thinking, Fast and Slow* | 2011 | System 1/System 2 dual-process theory |
| 3 | Stephen Few | *Information Dashboard Design* | 2006, 2nd ed 2013 | Dashboard anatomy, bullet graphs, single-screen principle |
| 4 | Stephen Few | *Show Me the Numbers* | 2004, 2nd ed 2012 | Table and chart design for quantitative data |
| 5 | Cole Nussbaumer Knaflic | *Storytelling with Data* | 2015 | 6-lesson framework, "So what?" test, action titles |
| 6 | Colin Ware | *Information Visualization: Perception for Design* | 2004, 4th ed 2021 | Perceptual science applied to visualization |
| 7 | Jacques Bertin | *Semiology of Graphics* | 1967/1983 | Retinal variables, visual variable taxonomy |
| 8 | Tamara Munzner | *Visualization Analysis and Design* | 2014 | Nested model, marks and channels, expressiveness/effectiveness |
| 9 | Alberto Cairo | *How Charts Lie* | 2019 | 5 ways charts deceive, critical chart reading |
| 10 | Darrell Huff | *How to Lie with Statistics* | 1954 | Truncated axes, area distortion, cherry-picked data |
| 11 | Hans Rosling | *Factfulness* | 2018 | No lonely numbers, proportional thinking, Gap Instinct |
| 12 | Andrew Grove | *High Output Management* | 1983 | Indicator pairs, counter-metrics |
| 13 | John Tukey | *Exploratory Data Analysis* | 1977 | Box plots, medians over means, visual exploration |
| 14 | Avinash Kaushik | *Web Analytics 2.0* | 2009 | Vanity vs actionable metrics, analytics hierarchy |
| 15 | Ralph Kimball | *The Data Warehouse Toolkit* | 1996, 3rd ed 2013 | Conformed dimensions, data quality |
| 16 | DAMA International | *DAMA-DMBOK* | 2009, 2nd ed 2017 | Six data quality dimensions |
| 17 | Cynthia Brewer | *Designing Better Maps* + ColorBrewer | 2002/2005 | Color palettes for data: sequential, diverging, categorical |

### Seminal Papers

| Author(s) | Title | Publication | Year |
|-----------|-------|-------------|------|
| George A. Miller | "The Magical Number Seven, Plus or Minus Two" | *Psychological Review* 63(2) | 1956 |
| Cleveland & McGill | "Graphical Perception: Theory, Experimentation, and Application" | *JASA* 79(387) | 1984 |
| Christopher Healey | "Harnessing Preattentive Processes for Multivariate Data Visualization" | Graphics Interface | 1993 |
| Anne Treisman | Feature Integration Theory | *Cognitive Psychology* 12(1) | 1980 |
| Ben Shneiderman | "The Eyes Have It: A Task by Data Type Taxonomy" | IEEE Visual Languages | 1996 |
| John Sweller | "Cognitive Load During Problem Solving" | *Cognitive Science* 12 | 1988 |
| Roy Baumeister et al. | "Ego Depletion: Is the Active Self a Limited Resource?" | *JPSP* 74(5) | 1998 |
| Nelson Cowan | "The Magical Number 4 in Short-Term Memory" | *Behavioral and Brain Sciences* 24 | 2001 |
| Ronald Rensink et al. | "To See or Not to See: The Need for Attention to Perceive Changes" | *Psychological Science* 8(5) | 1997 |
| Stephen Palmer | "Common Region: A New Principle of Perceptual Grouping" | *Cognitive Psychology* 24(3) | 1992 |
| Max Wertheimer | "Studies on the Theory of Gestalt" | *Psychologische Forschung* 4 | 1923 |
| Danziger, Levav & Avnaim-Pesso | "Extraneous Factors in Judicial Decisions" | *PNAS* 108(17) | 2011 |

### Industry References

| Author / Org | Title | URL / Location |
|-------------|-------|---------------|
| Jakob Nielsen | "F-Shaped Pattern For Reading Web Content" | Nielsen Norman Group (2006, updated 2017) |
| Stephen Few | "Save the Pies for Dessert" | Perceptual Edge (2007) |
| Andrew Abela | "Chart Suggestions — A Thought Starter" | extremepresentation.com (2006) |
| Cynthia Brewer | ColorBrewer 2.0 | colorbrewer2.org |
| W3C | WCAG 2.1 Guidelines | w3.org/WAI/WCAG21 |
| W3C WAI | Tables Tutorial | w3.org/WAI/tutorials/tables |
| Severino Ribecca | Data Visualisation Catalogue | datavizcatalogue.com |

---

> *This document is a living reference. Update it when new research is published, when user testing reveals violated assumptions, or when a team member says "the chart doesn't make sense." The best analytics bible is the one the team actually uses.*
