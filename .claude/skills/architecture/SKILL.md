---
name: architecture
description: >
  Master architecture oversight for WTFPOS. Use when making decisions that span multiple
  technology layers — RxDB, Neon, Ably, Bluetooth, offline sync, cross-device replication, or
  cross-branch data. Also triggers on "how should we...", "what's the best approach...",
  "how does X connect to Y", "which phase does this belong to", or when a new feature might
  affect the data sync strategy, real-time pipeline, or offline capabilities. This skill is
  the map; the other skills (rxdb, neon, ably, bluetooth) are the territory.
---

# WTFPOS — Architecture Oversight

**WTFPOS is a local-first, offline-capable, multi-branch restaurant POS where RxDB is the
operational truth, Neon is the analytical truth, and Ably is the real-time event bus.**

## Full Reference

- **Full skill:** `skills/architecture/SKILL.md`
- **Stack diagram:** `skills/architecture/references/ARCHITECTURE_MAP.md`
- **Phase roadmap:** `skills/architecture/references/PHASE_ROADMAP.md`

## Current Phase: 1 — Local-First Foundation

| Layer | Status |
|---|---|
| RxDB + IndexedDB | Implemented |
| Svelte 5 reactivity | Implemented |
| Branch isolation (`locationId`) | Implemented |
| Bluetooth scale | Partially implemented |
| SSE kitchen aggregate | Implemented (bridge) |
| LAN sync / Neon / Ably | Not started |

## Technology Decision Map

```
Store/read/mutate data              -> RxDB
Show data from another branch       -> SSE now / Ably in Phase 3
Analytics across branches           -> Neon (Phase 3)
Real-time push (KDS, alerts)        -> Ably (Phase 3) / SSE (bridge)
Offline capability                  -> RxDB local-first (works now)
Same-branch multi-device sync       -> RxDB LAN replication (Phase 2)
Hardware (scale, printer)           -> Web Bluetooth / Web USB
```

## Human in the Loop Gate

- **Phase transition** — STOP and ask before implementing any Phase 2+ feature
