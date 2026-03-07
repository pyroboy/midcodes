---
name: ably
description: >
  Ably real-time pub/sub integration for WTFPOS. Use when the user wants to add real-time
  cross-device events, replace the SSE kitchen aggregate with Ably channels, implement live
  KDS ticket updates, add cross-branch alerts for managers, implement device presence, or
  set up push notifications for stock alerts. Also triggers on "real-time", "Ably", "pub/sub",
  "channels", "push events", "live updates", "replace SSE", or "cross-device notifications".
  IMPORTANT: Ably replaces SSE kitchen aggregation from Phase 1.
  Current phase: PREPARATION ONLY.
---

# Ably — WTFPOS Real-Time Event Bus

Ably is the pub/sub platform connecting POS tablets, kitchen displays, and owner devices
with real-time events.

**Status: PREPARATION MODE.** Ably is not yet connected. SSE is the Phase 1 bridge.

## Full Reference

- **Full skill:** `skills/ably/SKILL.md`
- **Channel design:** `skills/ably/references/ABLY_WTFPOS_CHANNELS.md`

## What Ably Replaces (Phase 3)

| Phase 1 (SSE — delete) | Phase 3 (Ably — add) |
|---|---|
| `/api/sse/kitchen-orders` | Ably channel `wtfpos:<loc>:kitchen` |
| `/api/sse/aggregate` | Ably channel `wtfpos:all:kitchen` |
| `/api/events/kitchen-push` | Ably publish in RxDB subscription |
| `EventSource` in all-orders | `ably.channels.subscribe()` |

## Human in the Loop Gate

- **Phase activation** — Ably implementation requires explicit Phase 3 trigger from user
