# Restaurant Environment Context

Physical constraints that override theoretical UX thresholds. Every audit finding should be
evaluated against these real-world conditions — a contrast ratio that passes WCAG in a lab
may fail in a dimly lit samgyupsal restaurant.

---

## Lighting Conditions

| Zone | Lighting | Lux estimate | UX impact |
|---|---|---|---|
| Dining floor | Warm dim ambient — low-hanging pendant lights over grills, no overhead fluorescent | ~150–250 lux | Contrast must exceed AA minimum; amber/yellow badges nearly invisible |
| Cashier station | Slightly brighter — near entry, overhead track light | ~300–400 lux | Adequate for reading, but tablet glare from overhead light is common |
| Kitchen / stove area | Bright task lighting above prep surfaces, but smoke/steam diffuse it | ~400–600 lux | High glare on wet tablets; screen brightness often maxed out |
| Dispatch station | Front of kitchen near the pass, beside cashier — slightly brighter due to pass-through lighting | ~350–500 lux | Less steam than stove area but still splashed; tablet competes for counter space |
| Weigh station | Same as kitchen — butcher area adjacent to stove | ~400–600 lux | Greasy screen film reduces effective contrast by ~15–20% |

**Audit rule:** If a contrast ratio is between 4.0:1 and 5.0:1 (borderline AA pass), treat it
as CONCERN in the dining floor and kitchen zones. Only ratios ≥5.5:1 are reliably readable
in all WTFPOS environments.

---

## Hands & Touch Conditions

| Role | Hand condition during use | UX impact |
|---|---|---|
| Staff (cashier) | Dry hands, but moving fast between handling cash/cards and tablet | Needs large touch targets; accidental taps from speed, not grease |
| Stove (Lito / Romy) | Wet, greasy, may have gloves on | 44px is a floor, not a target — 56px+ recommended. Gloved fingers hit ~20mm wide |
| Dispatch / Expo (Corazon / Nena) | Wet hands (produce washing, soup portioning); counter splashed with water/sauce | 56px minimum. Counter is cluttered — tablet shares space with containers and cutting boards. Dedicated `/kitchen/dispatch` interface combines sides plating with cross-station monitoring. |
| Butcher (weigh station) | Raw meat residue, wet, often wearing nitrile gloves | Absolute minimum 56px targets. PRD says "knuckle-sized buttons" — that's ~64px |
| Manager | Dry hands, but often holding a phone or clipboard in one hand | One-handed tablet use — primary actions must be reachable with thumb from tablet edge |
| Owner | Dry hands, reading more than tapping | Smaller targets OK for owner-only pages, but still ≥44px |

**Audit rule:** Kitchen and weigh station pages should be evaluated against a 56px minimum,
not 44px. The 44px floor applies to POS and reports. PRD explicitly requires "massive hit-areas"
and "knuckle-sized buttons" for the butcher interface.

---

## Viewing Distance

| Role | Typical distance from tablet | UX impact |
|---|---|---|
| Staff | 30–45cm (arm's length, standing at register) | Standard reading distance — 14px body text is fine |
| Kitchen | 60–90cm (tablet mounted on wall or shelf, cook glances while grilling) | Text must be ≥18px to be glanceable. Badges must use high-contrast fills, not subtle tints |
| Butcher | 30–45cm (standing at scale, tablet on counter) | Standard distance but greasy screen reduces clarity |
| Manager | 30–60cm (carrying tablet, checking between tasks) | May read at arm's length while walking — 16px minimum |
| Owner | 30–45cm (desk/seated review) | Standard reading distance |

**Audit rule:** Kitchen KDS pages should assume 60–90cm viewing distance. Any text below 18px
on KDS is a CONCERN. Status badges that rely on subtle color tints (opacity ≤10%) are
effectively invisible at 90cm through steam.

---

## Noise & Distraction Level

| Time | Noise level | UX impact |
|---|---|---|
| Pre-service (10am–4pm) | Low — prep work, quiet kitchen | Staff can focus, read detailed text |
| Early service (5pm–7pm) | Moderate — filling up, grill sizzle, conversation | Split attention — UI must communicate state at a glance |
| Peak rush (7pm–9:30pm) | High — full capacity, 15+ tables, shouting across kitchen, extractor fans, K-pop background music | **Zero tolerance for ambiguity.** If a button requires reading to understand, it's too slow. Icons + color coding mandatory. No time for reading error messages. |
| Post-rush (9:30pm–11pm) | Declining — final tables, cleanup starting | EOD/reports — staff is tired, cognitive load tolerance is low |

**Audit rule:** Any UI used during peak rush (POS floor, KDS, checkout) must pass the
"3-second glance test" — can the user understand the current state and next action within
3 seconds of looking at the screen? If explanation text is required, it's a FAIL.

---

## Hardware Context

| Device | Spec | Notes |
|---|---|---|
| POS tablets | 10–12" Android tablets (Samsung Galaxy Tab A series or similar) | 1920×1200 or 1280×800 resolution. Touch only, no stylus. Mounted on counter stand or handheld. |
| Stove tablet | Same tablet, wall-mounted or counter near stove/cooking area | Shows only dishes & drinks (`/kitchen/stove`). Plastic screen protector adds glare. Grease film over a shift. |
| Dispatch tablet | Same 10" tablet, on counter at front of kitchen near the pass | Uses `/kitchen/dispatch` — full expo dashboard with per-table station progress + sides queue. Beside cashier station for coordination. Screen gets splashed with water and sauce. |
| Weigh station tablet | Same tablet, on counter next to Bluetooth scale | Connected to BT scale. Shared space with cutting board — screen gets splashed. |
| Bluetooth scale | Generic kitchen scale with BLE GATT | Sends weight readings in grams. Latency ~200ms. Occasional disconnects during peak (BLE congestion from multiple devices). |
| Network | Local WiFi (no internet required for POS operations) | RxDB is offline-first. No loading spinners expected. If data takes >400ms, something is wrong. |

---

## Restaurant Layout (Both Branches)

```
Alta Citta (Tagbilaran) — ~30 seat capacity
┌────────────────────────────────────────┐
│ ENTRANCE                               │
│  ┌─────────┐  ┌──────────┐              │
│  │ CASHIER │  │ DISPATCH │ ← expo      │
│  │ STATION │  │ (tablet) │   tablet    │
│  └─────────┘  └──────────┘              │
│                                        │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐           │
│  │T1│ │T2│ │T3│ │T4│ │T5│  DINING    │
│  └──┘ └──┘ └──┘ └──┘ └──┘  FLOOR     │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                 │
│  │T6│ │T7│ │T8│ │T9│                  │
│  └──┘ └──┘ └──┘ └──┘                  │
│                                        │
│ ═══════════ KITCHEN PASS ═════════════ │
│  ┌─────────────────────────────┐       │
│  │ KITCHEN                     │       │
│  │  Stove tablet (🍳 dishes)   │       │
│  │  Weigh station + BT scale   │       │
│  └─────────────────────────────┘       │
└────────────────────────────────────────┘

Alona Beach (Panglao) — similar layout, slightly larger
```

**Key spatial facts:**
- Cashier cannot see kitchen KDS from register (wall/pass separates them)
- Kitchen staff cannot see floor status — they rely entirely on KDS tickets
- Manager moves between floor, kitchen, and back office (sometimes different floors)
- Owner is typically remote — reviewing reports on phone or personal tablet

---

## Shift Rhythms That Affect UX Tolerance

| Phase | Duration | Cognitive state | UX tolerance |
|---|---|---|---|
| Opening prep | 10am–3pm | Alert, focused, low pressure | High — can handle setup tasks, training, learning new features |
| Pre-service | 3pm–5pm | Building energy, mise en place | Medium — stock counts happen here, must be efficient |
| Early rush | 5pm–7pm | Ramping, first tables opening | Medium-low — speed matters, errors start having consequences |
| Peak rush | 7pm–9:30pm | Maximum stress, minimum patience | **Near-zero** — every extra tap costs real money and real frustration |
| Wind-down | 9:30pm–10:30pm | Fatigued, wanting to close out | Low — EOD reports must be simple, no cognitive puzzles |
| Close | 10:30pm–11pm | Tired, last stock count, Z-Read | Low — one-tap or auto-generated wherever possible |

**Audit rule:** Features used exclusively during peak rush (POS, KDS, checkout) must be
evaluated with near-zero tolerance for friction. Features used during prep (stock counts,
delivery receiving) can tolerate slightly more complexity. Features used at close (EOD,
Z-Read) should be as automated as possible — tired staff make mistakes.
