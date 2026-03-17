---
name: network-expert
description: >
  Network topology and synchronization expert for WTFPOS. Use this skill when evaluating network
  architecture decisions — LAN replication, SSE vs Ably, offline-first guarantees, cross-branch
  connectivity, device sync health, connection monitoring, or bandwidth/latency planning. Also
  triggers on "network", "topology", "sync", "replication", "SSE", "offline", "LAN", "WiFi",
  "latency", "bandwidth", "connection", "cross-branch", "device sync", "server restart recovery",
  "multiplexed stream", or "conflict resolution". This skill is the network lens; architecture
  is the full-stack lens.
version: 2.0.0
---

# WTFPOS — Network Expert

This skill is the authority on **how data moves** between devices, branches, and cloud services in WTFPOS. It answers:

- **What protocol should I use for this feature?**
- **Will this work offline?**
- **What happens when the server restarts?**
- **How do devices discover and sync with each other?**
- **What are the latency/bandwidth implications?**
- **How robust is our current setup? Where do we improve?**

## References

| File | When to Read |
|------|-------------|
| `references/NETWORK_TOPOLOGY.md` | Current topology diagrams, protocol details, decision rules |
| `references/NETWORKING_BIBLE.md` | Deep knowledge base — device identity, IP detection, DHCP, WiFi, SSE, real-time, sync, cloud, robustness, grading rubric |

Read `NETWORKING_BIBLE.md` before implementing any network-related feature. It contains expert best practices, industry sources (Martin Fowler, AWS, Google SRE, Toast POS, Fresh KDS), and a **grading rubric** that scores WTFPOS's current implementation across 7 categories.

---

## The Network in One Sentence

**WTFPOS is a star-topology system where each branch's main tablet is the hub, all other devices are thin-client browsers syncing via LAN replication (HTTP pull/push + multiplexed SSE), with cross-branch visibility via SSE aggregate (Phase 1) migrating to Ably pub/sub (Phase 2).**

---

## Quick Decision Matrix

| Question | Answer |
|----------|--------|
| Can this feature work offline? | If it reads/writes RxDB locally — **yes**. If it needs another branch's data — **no** (internet required). |
| Should I use SSE or Ably? | Phase 1 = SSE. Phase 2+ = Ably. Never mix both for the same use case. |
| Should I poll or push? | **Always push.** Polling wastes LAN bandwidth and battery. Use SSE stream or Ably subscribe. |
| Can I open another SSE connection? | **No.** HTTP/1.1 limits to ~6 per host. Use the existing multiplexed stream at `/api/replication/stream`. |
| Where does data live? | RxDB (operational truth, local) → Neon (analytical truth, cloud, Phase 2). Never reverse this. |
| What if the main tablet crashes? | Other tablets operate locally. On restart, clients detect empty server and re-push all data. |
| Can two branches sync directly? | **No.** Branches are blind to each other. Cross-branch = cloud only (Neon merge). |
| Do branches need to know about each other? | **No.** Each branch uploads to Neon independently. Owner queries Neon for cross-branch views. |
| When do I add Ably? | **Only after Neon is working**, and only if the owner needs instant cross-branch alerts. It's a luxury, not a requirement. |

---

## Core Principle: Branches Are Blind

Tagbilaran and Panglao **never exchange data directly**. Each operates as a fully independent POS. Cross-branch visibility only exists in the cloud (Neon), queried by the owner.

```
TAGBILARAN ──► NEON ◄── PANGLAO       (data merges in the cloud)
                 │
           OWNER DEVICE                (queries Neon for both)
```

---

## Network Layers (Fastest to Slowest)

```
Layer 0: LOCAL          0ms        IndexedDB read/write (no network)
Layer 1: LAN SYNC       100-500ms  Replication pull/push over WiFi
Layer 2: LAN BROADCAST  ~3s        Kitchen SSE (debounced push)
Layer 3: CROSS-BRANCH   3-5s       SSE aggregate (Phase 1 only, replaced by Layer 4)
Layer 4: CLOUD MERGE    5-15 min   Each branch → Neon (blind batch sync, Phase 2)
Layer 5: REAL-TIME ALERTS 100-300ms Ably one-way publish (Phase 2b, optional luxury)
```

**Rule:** Every feature must work at Layer 0. Layers 1-5 are enhancements, never requirements.

---

## Current Topology (Phase 1)

| Aspect | Implementation |
|--------|---------------|
| **Intra-branch sync** | HTTP pull/push + multiplexed SSE (16 collections) |
| **Kitchen real-time** | SSE with 3s debounce (same-branch only) |
| **Cross-branch view** | SSE aggregate proxy (owner only, internet required) |
| **Device monitoring** | RxDB `devices` collection + 30s heartbeat |
| **Sync verification** | `SyncStatusBanner` polls `/api/replication/status` every 60s |
| **Conflict resolution** | Last-write-wins on `updatedAt` (no CRDT) |
| **Security** | None on LAN (trusted WiFi assumption) |

---

## Key Files

| File | What It Does |
|------|-------------|
| `src/lib/db/replication.ts` | Client replication: SSE stream handler, pull/push, conflict tracking |
| `src/lib/server/replication-store.ts` | Server in-memory store: Map + binary-search index |
| `src/routes/api/replication/stream/+server.ts` | Multiplexed SSE for all 16 collections |
| `src/routes/api/replication/[collection]/pull/+server.ts` | Paginated pull endpoint |
| `src/routes/api/replication/[collection]/push/+server.ts` | Batch push with conflict detection |
| `src/routes/api/replication/status/+server.ts` | Health check (doc counts per collection) |
| `src/lib/stores/kitchen-push.ts` | Debounced kitchen snapshot broadcaster |
| `src/lib/server/kitchen-sse.ts` | In-memory SSE broadcaster |
| `src/routes/api/sse/kitchen-orders/+server.ts` | Same-branch KDS SSE endpoint |
| `src/routes/api/sse/aggregate/+server.ts` | Cross-branch SSE proxy (owner) |
| `src/lib/stores/connection.svelte.ts` | Online/offline state monitor |
| `src/lib/stores/device.svelte.ts` | Device registry + heartbeat |
| `src/lib/components/SyncStatusBanner.svelte` | Sync verification UI |

---

## Offline Tiers

| Tier | Connectivity | What Works | What Doesn't |
|------|-------------|------------|-------------|
| **Tier 1** | No network at all | POS, KDS (local), stock, payments | Nothing syncs |
| **Tier 2** | WiFi LAN only | + multi-device sync, same-branch KDS | No cross-branch |
| **Tier 3** | LAN + Internet | + owner cross-branch view, cloud sync | Nothing missing |

---

## Human in the Loop Gates

Before making network architecture changes, **always ask the user**:

1. **Adding a new real-time channel** — "Is this same-branch only or cross-branch? Should it work offline?"
2. **Changing replication behavior** — "Have you read RXDB_REPLICATION_GUIDE.md? Does this affect the recovery sequence?"
3. **Removing SSE endpoints** — "Is Ably fully tested? Is there a fallback for LAN-only operation?"
4. **Adding internet-dependent features** — "This breaks the offline contract. Is that acceptable for this feature?"
5. **Modifying the in-memory store** — "Server restart will lose this data. Is that acceptable?"

---

## Self-Improvement Protocol

When the user corrects a network assumption or a protocol choice fails:
1. Update `references/NETWORK_TOPOLOGY.md` with the correction
2. If the correction affects the decision matrix, update this SKILL.md
3. If a new protocol or endpoint is added, add it to the file manifest
4. Re-verify the offline tier matrix still holds
