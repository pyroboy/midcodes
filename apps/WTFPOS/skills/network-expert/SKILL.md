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
| `references/BACKUP_REGIMEN.md` | Backup strategy, disaster recovery, GFS rotation, cloud upload, BIR retention, encryption, restore procedures |

Read `NETWORKING_BIBLE.md` before implementing any network-related feature. It contains expert best practices, industry sources (Martin Fowler, AWS, Google SRE, Toast POS, Fresh KDS), and a **grading rubric** that scores WTFPOS's current implementation across 7 categories.

Read `BACKUP_REGIMEN.md` before implementing any backup, restore, or disaster recovery feature. It covers the 3-2-1-1-0 rule applied to WTFPOS, RxDB export/import patterns, compression/encryption, automated scheduling, cloud upload strategy for Philippine internet, and BIR 10-year retention requirements.

---

## The Network in One Sentence

**WTFPOS is a star-topology system where each branch's main tablet runs in `full-rxdb` mode as the hub; other devices operate in `selective-rxdb` (6 collections, staff/kitchen), `api-fetch` (no local DB, owner/admin), or `sse-only` (display-only) mode — all syncing via LAN replication (HTTP pull/push + multiplexed SSE) with automatic mode selection based on device identity and role.**

---

## Quick Decision Matrix

| Question | Answer |
|----------|--------|
| Can this feature work offline? | Depends on data mode: **full-rxdb** = full offline R/W. **selective-rxdb** = read-only offline (6 collections). **api-fetch** / **sse-only** = no offline. Cross-branch data always requires internet. |
| Should I use SSE or Ably? | Phase 1 = SSE. Phase 2+ = Ably. Never mix both for the same use case. |
| Should I poll or push? | **Always push.** Polling wastes LAN bandwidth and battery. Use SSE stream or Ably subscribe. |
| Can I open another SSE connection? | **No.** HTTP/1.1 limits to ~6 per host. Use the existing multiplexed stream at `/api/replication/stream`. |
| Where does data live? | RxDB (operational truth, local) → Neon (analytical truth, cloud, Phase 2). Never reverse this. |
| What if the main tablet crashes? | Other tablets operate locally. On restart, clients detect empty server and re-push all data. |
| How do I backup the server? | Read `BACKUP_REGIMEN.md`. Phase 1: automated local snapshots (node-cron, 4h interval, GFS rotation). Phase 2: + cloud upload to Backblaze B2. |
| What if ALL devices are lost? | Cloud backup (Phase 2) or air-gapped USB Drive B. Without either, seed data only. See disaster recovery scenarios in `BACKUP_REGIMEN.md`. |
| Can this device write offline? | Only in `full-rxdb` mode (server tablet). `selective-rxdb` clients need the server for writes. `api-fetch` and `sse-only` have no offline capability. |
| What data mode should this device use? | Server tablet → `full-rxdb`. Staff/kitchen thin client → `selective-rxdb`. Owner/admin on any browser → `api-fetch`. Passive kitchen display → `sse-only`. |
| What happens when a thin client writes? | HTTP POST to `/api/collections/[col]/write` → server confirms synchronously → SSE broadcasts change to all devices. |
| How does a device know if it's the server? | `GET /api/device/identify` checks client IP against `os.networkInterfaces()`. Loopback or matching local IP = server. |
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
| **Intra-branch sync** | HTTP pull/push + multiplexed SSE (17 collections) |
| **Kitchen real-time** | SSE with 3s debounce (same-branch only) |
| **Cross-branch view** | SSE aggregate proxy (owner only, internet required) |
| **Device monitoring** | RxDB `devices` collection + 30s heartbeat |
| **Sync verification** | `SyncStatusBanner` polls `/api/replication/status` every 60s |
| **Data modes** | 4 tiers: `full-rxdb` (server), `selective-rxdb` (staff/kitchen), `api-fetch` (owner/admin), `sse-only` (displays) |
| **Thin-client writes** | HTTP POST `/api/collections/[col]/write` with write-proxy routing |
| **Conflict resolution** | Field-level merge (5 collections) + CRDT `max()` for monotonic fields + LWW fallback |
| **Server observability** | In-memory client tracker + hooks middleware + selftest + client error log relay |
| **Security** | None on LAN (trusted WiFi assumption) |

---

## Key Files

| File | What It Does |
|------|-------------|
| `src/lib/db/replication.ts` | Client replication: SSE stream handler, pull/push, conflict tracking |
| `src/lib/server/replication-store.ts` | Server in-memory store: Map + binary-search index |
| `src/routes/api/replication/stream/+server.ts` | Multiplexed SSE for all 17 collections |
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
| `src/lib/stores/data-mode.svelte.ts` | 4 data modes + selection logic + mode helpers |
| `src/lib/stores/create-store.svelte.ts` | Universal store factory (RxDB vs server-store routing) |
| `src/lib/stores/server-store.svelte.ts` | SSE manager + bulk-read for api-fetch mode |
| `src/lib/db/write-proxy.ts` | Write routing: RxDB local vs HTTP POST per mode |
| `src/lib/server/client-tracker.ts` | In-memory client registry (IP, device type, routes) |
| `src/lib/server/epoch.ts` | Server epoch management (restart detection) |
| `src/lib/server/selftest.ts` | Server self-test on startup (9 collections) |
| `src/hooks.server.ts` | Per-request tracking + route logging middleware |
| `src/routes/api/collections/[collection]/read/+server.ts` | Bulk-read endpoint (thin client reads) |
| `src/routes/api/collections/[collection]/write/+server.ts` | Write endpoint (thin client writes) |
| `src/routes/api/device/identify/+server.ts` | Device identity + server detection + re-identification |
| `src/routes/api/device/route/+server.ts` | Route reporting via sendBeacon |
| `src/routes/api/device/clients/+server.ts` | Active client snapshot endpoint |
| `src/routes/api/replication/reset/+server.ts` | RESET_ALL broadcast + epoch bump |
| `src/routes/api/replication/client-log/+server.ts` | Client error log relay |
| `src/routes/api/replication/ping/+server.ts` | Diagnostic echo + store test |

---

## Offline Tiers

### By Data Mode

| Data Mode | Tier 1 (No network) | Tier 2 (LAN only) | Tier 3 (LAN + Internet) |
|-----------|---------------------|-------------------|------------------------|
| `full-rxdb` | Full R/W (all 17 collections) | + multi-device sync + KDS real-time | + owner cross-branch view |
| `selective-rxdb` | Read-only (6 cached collections) | + writes via HTTP + sync | + cross-branch (if role permits) |
| `api-fetch` | Nothing works | Reads + writes via HTTP + SSE | + cross-branch view |
| `sse-only` | Nothing works | Read-only via SSE stream | + cross-branch stream |

### By Connectivity

| Tier | Connectivity | full-rxdb | selective-rxdb | api-fetch | sse-only |
|------|-------------|-----------|----------------|-----------|----------|
| **Tier 1** | No network | Full POS operation | Read cached data | Nothing | Nothing |
| **Tier 2** | WiFi LAN only | + sync to all devices | + writes + sync | + reads/writes | + streaming |
| **Tier 3** | LAN + Internet | + cross-branch view | + cross-branch | + cross-branch | + cross-branch |

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
