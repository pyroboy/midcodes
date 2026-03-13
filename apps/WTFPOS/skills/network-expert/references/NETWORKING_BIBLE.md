# WTFPOS — Networking Bible

> **Last updated:** 2026-03-13
> **Purpose:** Comprehensive networking knowledge base for building, grading, and improving the WTFPOS network stack.
> **Audience:** Claude (AI assistant), developer, system admin.

---

## Table of Contents

1. [Device Identity](#1-device-identity)
2. [IP Detection & Server Auto-Discovery](#2-ip-detection--server-auto-discovery)
3. [DHCP & IP Stability](#3-dhcp--ip-stability)
4. [WiFi & Physical Network](#4-wifi--physical-network)
5. [SSE (Server-Sent Events)](#5-sse-server-sent-events)
6. [Real-Time Patterns](#6-real-time-patterns)
7. [Sync & Replication](#7-sync--replication)
8. [Cloud Sync (Neon)](#8-cloud-sync-neon)
9. [Network Robustness](#9-network-robustness)
10. [Offline-First Architecture](#10-offline-first-architecture)
11. [Security](#11-security)
12. [Grading Rubric](#12-grading-rubric)

---

## 1. Device Identity

### 1.1 nanoid vs UUID v4 vs CUID2

| Property | nanoid (21) | UUID v4 | CUID2 |
|----------|------------|---------|-------|
| Length | 21 chars | 36 chars (with hyphens) | 24 chars |
| Entropy bits | 126 | 122 | Multi-source combined |
| URL-safe | Yes (A-Za-z0-9_-) | No (hyphens) | Yes |
| Bundle size | 130 bytes | 423 bytes | Larger |
| Speed | ~5.6M ops/sec | ~1.5M ops/sec | Slower (hashing) |
| Sortable | No | No | No (hashed) |

**For WTFPOS:** nanoid(16) is more than sufficient for <100 devices (96 bits = ~10^15 years at 1000 IDs/hour for 1% collision probability).

**Collision calculator:** https://zelark.github.io/nano-id-cc/

> **Sources:** [nanoid GitHub](https://github.com/ai/nanoid), [Nano ID Collision Calculator](https://zelark.github.io/nano-id-cc/), [CUID2 GitHub](https://github.com/paralleldrive/cuid2)

### 1.2 Persistence Strategies (Layered, Most to Least Durable)

1. **`navigator.storage.persist()`** — Request persistent storage so the browser won't evict IndexedDB. Chrome auto-grants for installed PWAs. Safari grants if user interacted in last 7 days.
2. **Store in both localStorage AND IndexedDB** — Same eviction fate, but belt-and-suspenders against partial corruption.
3. **Cookie backup** — `max-age=31536000`. Survives some scenarios where localStorage is cleared.
4. **Server-side mapping** — Store `{deviceId, userAgent, screenResolution}` on server for re-identification if ID is lost.

### 1.3 Safari ITP 7-Day Rule (Critical)

Safari deletes ALL script-writable storage (localStorage, IndexedDB, cookies set from JS, service workers) for origins with no user interaction in 7 days of **Safari use** (not calendar days).

**Mitigations:**
- Restaurant devices are used daily — timer resets on interaction
- **Home Screen PWA exemption:** Web apps added to iOS home screen have their own days-of-use counter. Apple stated they "do not expect" home screen web app data to be deleted.
- Call `navigator.storage.persist()` on init — once granted, eviction is prevented entirely.

**Known bug:** WebKit #266559 — Safari periodically erased storage for ALL websites regardless of interaction. Fixed but worth knowing.

> **Sources:** [MDN Storage Quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [WebKit Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/), [Dexie.js Issue #739](https://github.com/dfahlander/Dexie.js/issues/739)

### 1.4 Multi-Tab Identity

**Problem:** 3 tabs open = 3 device registrations if not handled.

**Solution: RxDB Leader Election.** RxDB has built-in leader election via `broadcast-channel`. Only one tab acts as leader for replication, heartbeats, etc. All tabs share the same IndexedDB instance = same device record.

**BroadcastChannel API** (fallback/supplement): Sends messages between all tabs on the same origin. Supported in all modern browsers (Chrome, Firefox, Safari 15.4+).

**SharedWorker** — NOT supported on Android Chrome or iOS Safari. Do not rely on it.

> **Sources:** [RxDB Leader Election](https://rxdb.info/leader-election.html), [MDN BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel), [broadcast-channel npm](https://github.com/pubkey/broadcast-channel)

### 1.5 Browser Fingerprinting (Not Recommended)

FingerprintJS open-source accuracy: **40-60%** — identical tablets of the same model produce identical fingerprints. Commercial version (99.5%) requires paid service. MAC addresses are randomized on modern iOS/Android. For a managed fleet, a stored nanoid with `persist()` is simpler and more reliable.

> **Sources:** [FingerprintJS GitHub](https://github.com/fingerprintjs/fingerprintjs), [Android MAC Randomization](https://source.android.com/docs/core/connect/wifi-mac-randomization-behavior)

---

## 2. IP Detection & Server Auto-Discovery

### 2.1 SvelteKit `event.getClientAddress()` Under adapter-node

Returns `req.socket.remoteAddress` directly from the Node.js TCP socket.

| Client location | Server listening on | Returns |
|----------------|-------------------|---------|
| Same machine via `localhost` | `0.0.0.0` (default) | `::1` or `::ffff:127.0.0.1` |
| Same machine via `127.0.0.1` | `0.0.0.0` | `::ffff:127.0.0.1` |
| Same machine via `localhost` | `127.0.0.1` (explicit) | `127.0.0.1` |
| LAN device (192.168.1.50) | `0.0.0.0` | `::ffff:192.168.1.50` |
| Same machine via LAN IP | `0.0.0.0` | `::ffff:192.168.1.100` (**looks like remote!**) |

**Critical gotcha — Node v17+:** `localhost` resolves to `::1` (IPv6) first, not `127.0.0.1`. Handle both.

**Critical gotcha — Same machine via LAN IP:** If the server's LAN IP is `192.168.1.100` and a browser on that same machine navigates to `http://192.168.1.100:3000`, `getClientAddress()` returns `::ffff:192.168.1.100` — **indistinguishable from a remote client.** Must compare against `os.networkInterfaces()`.

**Proxy headers:** If `ADDRESS_HEADER` env var is set (e.g., `X-Forwarded-For`), it reads from that header. For direct LAN, do NOT set this.

> **Sources:** [SvelteKit adapter-node docs](https://svelte.dev/docs/kit/adapter-node), [Node.js Issue #40537](https://github.com/nodejs/node/issues/40537), [Apify IPv4-mapped IPv6](https://blog.apify.com/ipv4-mapped-ipv6-in-nodejs/)

### 2.2 Robust `isSameMachine()` Check

```ts
import os from 'os';

function normalizeIp(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

function isLocalhost(ip: string): boolean {
  const n = normalizeIp(ip);
  return n === '127.0.0.1' || n === '::1' || ip === '::1';
}

function isSameMachine(requestIp: string): boolean {
  if (isLocalhost(requestIp)) return true;
  const normalized = normalizeIp(requestIp);
  const nets = os.networkInterfaces();
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces!) {
      if (iface.address === normalized) return true;
    }
  }
  return false;
}
```

### 2.3 Getting the Server's Own LAN IP

**Naive approach (fragile):** Filter `os.networkInterfaces()` for first non-internal IPv4. Fails with VMware/VPN adapters.

**Robust approach — UDP socket trick:**

```ts
import dgram from 'dgram';

function getDefaultIp(): Promise<string> {
  return new Promise((resolve) => {
    const sock = dgram.createSocket('udp4');
    // Use router IP for LAN-only (no internet needed)
    sock.connect(53, '192.168.1.1', () => {
      resolve(sock.address().address);
      sock.close();
    });
  });
}
```

Creates a UDP socket pointed at the router (doesn't send data). The OS reports which local address it would use. Sidesteps multi-interface ambiguity.

### 2.4 mDNS / Service Discovery

| Platform | .local resolution | Status |
|----------|------------------|--------|
| macOS/iOS | Full native (Bonjour) | Works perfectly |
| Windows 10+ | Built-in | Works |
| Linux | Requires Avahi + nss-mdns | Works after setup |
| Android <12 | Not supported | Broken |
| Android 12+ | Gradual rollout via Mainline | Unreliable in Chrome |

**Verdict:** Do NOT rely on mDNS for Android tablets. Use DHCP reservation for a stable IP and bookmark `http://192.168.1.10:3000`.

> **Sources:** [Esper Android mDNS](https://www.esper.io/blog/android-dessert-bites-26-mdns-local-47912385), [Google Issue Tracker](https://issuetracker.google.com/issues/140786115)

---

## 3. DHCP & IP Stability

### 3.1 DHCP Lease Behavior

**Renewal process (RFC 2131):**
- **T1 (50% of lease):** Device sends unicast DHCPREQUEST to original server
- **T2 (87.5% of lease):** If T1 failed, broadcasts DHCPREQUEST to any server
- **Expiry:** Device drops IP, restarts full DORA process

**Typical lease times:** Consumer routers default to 24 hours. ISP routers: 8-12 hours.

**How often IPs actually change:** On a small restaurant network (5-15 devices), IPs are extremely stable. They change when: (a) router reboots and loses lease table, (b) DHCP pool exhausted while device was offline, (c) MAC address changes (randomization).

**Recommendation:** Set DHCP lease to **7+ days** on the restaurant router. With few devices, short leases serve no purpose.

### 3.2 DHCP Reservation (Static DHCP)

Binds a MAC address to a fixed IP. The device still uses DHCP but always gets the same IP.

**Setup:**
1. Disable MAC randomization on the server tablet for the restaurant SSID
   - Android: Settings > WiFi > long-press > Advanced > Privacy > "Use device MAC"
   - iOS: Settings > WiFi > tap (i) > Private Wi-Fi Address > "Fixed" or Off
2. Note the device's factory MAC address
3. Create DHCP reservation on router binding that MAC to a fixed IP (e.g., `192.168.1.10`)
4. Reserve outside the dynamic pool range

**MAC randomization impact:**
- iOS 14+: Random MAC per WiFi network
- iOS 18+: **Rotating** MAC — changes every 2 weeks by default
- Android 10+: Random MAC per WiFi network
- Android 12+: Can re-randomize after 24h disconnection

> **Sources:** [Apple Wi-Fi Recommendations](https://support.apple.com/en-md/102766), [Android MAC Randomization](https://source.android.com/docs/core/connect/wifi-mac-randomization-behavior)

### 3.3 Tablet IP Stability Across Sleep/Wake

- **WiFi stays on during sleep:** DHCP lease maintained, IP unchanged
- **WiFi turns off during sleep:** Lease released, but router typically re-assigns same IP
- **Airplane mode toggle:** Full reconnect, usually gets same IP back
- **iOS known issue:** iPad may not release DHCP lease on sleep, then wake with stale IP while router assigned it elsewhere → IP conflict

**Recommendation:** On server tablet, disable battery optimization for WiFi. Keep WiFi always on. Client tablet IPs don't matter (they connect TO the server).

---

## 4. WiFi & Physical Network

### 4.1 Restaurant WiFi Interference

**Kitchen enemies of WiFi:**
- **Microwaves:** Operate at 2.45 GHz, directly overlap 2.4 GHz WiFi. ~1000x the wattage of a router. Kill 2.4 GHz within 10-15 feet.
- **Stainless steel surfaces:** Reflect and block signals. Kitchen = Faraday cage.
- **Induction cooktops, heat lamps:** Electromagnetic interference.
- **Steam/water/bodies:** Absorb 2.4 GHz signals.

**Toast explicitly forbids 2.4 GHz for POS devices.** Use **5 GHz only** for POS traffic.

### 4.2 Router Placement

- Place in the **dining area**, NOT the kitchen
- Mount **high** (ceiling or high shelf) — above head height
- **Central** relative to POS device locations
- At least **10-15 feet** from any microwave
- If kitchen KDS needs WiFi, consider a second AP or wired Ethernet

### 4.3 Dedicated POS Network

- Create a dedicated 5 GHz SSID (e.g., `WTF-POS`) for POS devices only
- Keep guest WiFi on separate 2.4 GHz SSID
- For PCI DSS compliance: network segmentation between POS and guest is mandatory
- Even without VLAN support, a separate SSID provides meaningful isolation

### 4.4 Hardware Recommendations

- Dual-band consumer router (TP-Link Archer, ASUS RT) is adequate for 5-10 devices
- Large restaurants: mesh system (TP-Link Deco, Ubiquiti UniFi)
- **UPS on the router is critical** — if router loses power, all POS communication stops

### 4.5 How Toast Does Networking

- Star topology centered on one WiFi router
- Fixed terminals (POS, KDS) via Ethernet for reliability
- Handhelds via WiFi (5 GHz only)
- One "local hub" device auto-selected as relay
- Network requirements: 15 Mbps down / 5 Mbps up dedicated to POS
- WiFi signal: at least -65 dBm everywhere devices are used
- Dedicated subnet: `192.168.192.0/24`

> **Sources:** [Toast Network Requirements](https://central.toasttab.com/s/article/Toast-Network-Requirements-Overview), [Toast Offline Mode](https://doc.toasttab.com/doc/platformguide/platformOfflineModeLocalSync.html)

---

## 5. SSE (Server-Sent Events)

### 5.1 EventSource Reconnection (Built-In)

- Default reconnect delay: **3 seconds** (server can override via `retry:` field)
- **`Last-Event-ID` header:** Browser remembers last received `id:` field. On reconnect, sends it as header. Server uses this to resume stream — no missed events.
- HTTP **204 No Content** = browser permanently stops reconnecting (intentional shutdown)
- Non-success status (500) = stops reconnecting
- Server unreachable = keeps retrying at `retry` interval indefinitely

### 5.2 Connection Limits

**HTTP/1.1:** Browsers enforce **6 concurrent connections per origin.** Each SSE holds one connection for its lifetime. 6 SSE connections = all connections consumed, no API calls possible.

**The limit is per browser, per origin** — all tabs to `http://192.168.1.100:3000` share the same pool.

**Solutions (ranked by practicality):**

1. **Single multiplexed SSE** (what WTFPOS does) — one stream, named events for routing
2. **SharedWorker + BroadcastChannel** — one worker opens SSE, broadcasts to all tabs
3. **HTTP/2** — multiplexes all streams over one TCP connection (100+ concurrent streams). SvelteKit adapter-node does NOT support HTTP/2 natively — needs reverse proxy (Caddy or Nginx).
4. **WebSocket** — 255 connections per host (Chromium) / 200 (Firefox)

**For WTFPOS:** Each physical device has 1 tab with 1 multiplexed SSE stream. 5 remaining connections for API calls. Sufficient for Phase 1.

### 5.3 Heartbeat Best Practices

**Why needed:** TCP keepalive default is **2 hours.** Reverse proxies (nginx) close idle connections after **60 seconds.** Mobile browsers/WiFi routers close even faster.

**Recommended interval:** **15-30 seconds.** Send as SSE comment (`:ping\n\n`) — browser silently ignores, no `onmessage` event.

**Server-side detection:** Listen for `req.on('close')` to detect disconnect. Track last successful heartbeat per client. Force-close after **60 seconds** of no I/O.

### 5.4 Memory Leak Prevention

1. **Always clean up on disconnect:** `req.on('close', () => { clearInterval(heartbeat); clients.delete(id); })`
2. **Handle backpressure:** Check `res.write()` return value. If `false`, buffer is full — wait for `drain` event or drop client.
3. **Zombie connections on WiFi:** Tablet loses connectivity without clean TCP FIN. Server holds response object forever. Solution: track last successful heartbeat, force-close after timeout.
4. **Use `Map<clientId, connection>`** — not arrays, not sets. Easy to look up, easy to delete.

### 5.5 Multiplexed SSE Pattern

```
event: order-update
data: {"orderId": "abc", "status": "bumped"}

event: table-status
data: {"tableId": "T3", "status": "occupied"}

event: stock-alert
data: {"itemId": "pork-belly", "level": "low"}
```

Client listens per event type:
```js
es.addEventListener('order-update', (e) => { ... });
es.addEventListener('table-status', (e) => { ... });
```

### 5.6 SSE on Mobile Browsers

| Platform | Behavior When Backgrounded |
|----------|---------------------------|
| **iOS Safari** | SSE killed ~1 minute after tab loses visibility. Auto-reconnects on return. |
| **iOS (plugged in)** | Killed ~5 minutes after visibility hidden. |
| **Chrome Android** | Background tab throttled after 10 seconds. Timers limited to 1x/minute after 5 min. |
| **Android Doze** | Extended screen-off restricts all network access. |

**Mitigations for POS tablets:**
- Keep screen on (kiosk mode, Guided Access on iPad)
- Use Page Visibility API to force reconnect on return:
  ```js
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && es.readyState === 2) {
      es = new EventSource('/api/events');
    }
  });
  ```
- Always assume SSE can drop. Design server to replay last state on reconnect.

> **Sources:** [MDN EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource), [HTML Living Standard SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html), [Chromium Tab Throttling](https://blog.chromium.org/2020/11/tab-throttling-and-more-performance.html)

---

## 6. Real-Time Patterns

### 6.1 Protocol Comparison for POS

| Technology | Direction | LAN Latency | Cloud Latency | Offline | Cost |
|------------|-----------|-------------|---------------|---------|------|
| **SSE** | Server→client | ~1-5ms | 50-100ms | Auto-reconnect | Free |
| **WebSocket** | Bidirectional | ~1-5ms | 44-87ms | Manual reconnect | Free |
| **Ably** | Bidirectional pub/sub | N/A (cloud-routed) | 50-150ms | Message backlog | $0-49.99/mo |
| **Pusher** | Bidirectional pub/sub | N/A (cloud-routed) | Similar | Basic reconnect | $49/mo+ |
| **Firebase RTDB** | Bidirectional sync | N/A (cloud-routed) | Similar | Built-in offline | Pay-per-use |

**Phase 1 (LAN):** SSE wins — unidirectional push is all KDS needs, zero cloud dependency, auto-reconnect.
**Phase 2+ (cross-branch):** Ably wins — 99.999% uptime SLA, message ordering, exactly-once semantics, presence API.

### 6.2 KDS Latency Requirements

**No formal industry standard in milliseconds.** All commercial KDS vendors describe orders appearing "instantly."

**Practical threshold:** Kitchen staff expect orders on screen within the time it takes to glance at the display. **Sub-1-second is the universal expectation.** Over 2-3 seconds feels broken.

**Fresh KDS** uses direct **TCP/UDP on LAN** — no cloud, no debounce, no batching. This is the benchmark.

### 6.3 Debounce vs Throttle for Kitchen Events

| Event Type | Pattern | Timing | Rationale |
|------------|---------|--------|-----------|
| New order sent to kitchen | **Immediate** | 0ms | Kitchen must see instantly |
| Order item modifications | **Throttle** | 200-500ms | Batch rapid edits |
| Bump/fulfill confirmation | **Immediate** | 0ms | Expediter needs instant feedback |
| Kitchen refuse notification | **Immediate** | 0ms | POS must know immediately |
| Timer color updates | **Throttle** | 1000ms | Visual, not data-critical |
| Device heartbeat | **Throttle** | 5000-15000ms | Background health |

**WTFPOS currently uses 3-second debounce for kitchen push.** This is too slow for critical events. Critical events (new orders, bumps, refuses) should fire immediately. Use debounce only for non-critical batch updates.

### 6.4 Ably Deep Dive

**Message ordering:** Guaranteed from any single publisher to all subscribers. Messages get assigned serial numbers. On reconnect, client passes last serial to resume exactly.

**Exactly-once:** At-least-once delivery + idempotent deduplication = exactly-once processing.

**Presence API:** Tracks connected clients per channel. Auto-emits `leave` after ~1 minute of disconnection. Carries arbitrary metadata (device type, role, location). Maps directly to WTFPOS device heartbeat.

**Token auth:** Client requests short-lived token from SvelteKit API → server generates via Ably key → client connects with token. Never expose API key in browser.

**Pricing for WTFPOS (2 branches, ~10 devices):**
- Free tier: 200 peak connections, 6M messages/month — sufficient for dev and early production
- Production: likely under $49.99/month at ~30K-120K messages/month

> **Sources:** [Ably Pub/Sub](https://ably.com/pubsub), [Ably Presence](https://ably.com/docs/presence-occupancy/presence), [Ably Pricing](https://ably.com/pricing), [Fresh KDS Local Network](https://fresh-technology.github.io/fresh.kds.docs.mobile-local-network-integration/docs/discovery/)

### 6.5 Event Design for POS

**Full event sourcing / CQRS is overkill.** Martin Fowler: "CQRS adds risky complexity for most systems."

**WTFPOS's current approach is pragmatically correct:** Direct state updates (RxDB `incrementalPatch`) + immutable `audit_logs` collection for event trail. This gives you the audit benefits of event sourcing without the complexity.

**Idempotent event handling:** Every event carries a unique ID. Before processing, check if already handled. RxDB's primary key uniqueness naturally prevents duplicate inserts.

### 6.6 Optimistic UI

RxDB's local-first model is **inherently optimistic**: writes go to IndexedDB immediately (0ms latency), UI reacts instantly via reactive queries. No server round-trip to wait for. In Phase 1, there is no remote server to reject the write, so rollback is unnecessary. In Phase 2+, RxDB's conflict handler serves as the rollback mechanism.

---

## 7. Sync & Replication

### 7.1 RxDB Replication Protocol

**Checkpoint-based pull/push:**
- `pull.handler(lastCheckpoint)` → returns docs after checkpoint + new checkpoint
- `push.handler(changeRows[])` → each row: `{ newDocumentState, assumedMasterState }` → returns conflicts
- `pull.stream$` → SSE/WebSocket observable for live changes
- `RESYNC` flag → triggers full checkpoint iteration on reconnect

**Conflict handling:** Detected server-side, resolved client-side. Default: master-wins (drops fork). Custom handlers can merge fields.

**Key config:**
- `retryTime`: 5000ms default
- `push.batchSize`: docs per push batch
- `live`: continuous vs one-shot

### 7.2 Conflict Resolution Strategies

| Strategy | How | Best For |
|----------|-----|----------|
| **Last-write-wins (LWW)** | Highest `updatedAt` wins | Simple fields (table status, display name) |
| **Field-level merge** | Compare changed fields, merge non-conflicting | Orders (merge items from both sides) |
| **Counter CRDTs** | Store deltas, not absolutes | Stock quantities, pax counts |
| **Append-only union** | Union both sets | Order items, audit logs (no conflicts possible) |
| **Business rule priority** | `void` > `active` > `open` | Status fields with hierarchy |
| **User-prompted** | Show both, let user choose | Rare high-stakes conflicts |

**For WTFPOS:** Field-level merge + business rules for orders/tables. Counter CRDTs for stock. LWW for config. Full OT/CRDTs unnecessary.

### 7.3 Sync State Machine

```
IDLE → PULLING → APPLYING REMOTE → RESOLVING CONFLICTS → PUSHING → HANDLING PUSH CONFLICTS → IDLE
  ↑                                                                                            │
  └──────────────── STREAMING (live mode, waits for next event) ◄──────────────────────────────┘
```

**"Fully synced" =** local checkpoint matches server's latest checkpoint AND local push queue is empty. Both conditions simultaneously.

### 7.4 Batch vs Real-Time Sync

| Data Type | Strategy | Interval |
|-----------|----------|----------|
| Active orders, KDS tickets | Real-time (stream) | Immediate |
| Stock counts, deliveries | Near-real-time batch | 5-15 seconds |
| Reports, audit logs | Batch | 30-60 seconds |
| Menu items, floor layout | On save only | Manual trigger |
| Historical archives | Batch | Hourly or daily |

### 7.5 Sync Queue & Retry (Outbox Pattern)

1. Write document to IndexedDB AND append to outbox in same transaction
2. Background worker drains outbox, sends to server
3. On success: remove from outbox
4. On failure: increment retry counter, apply exponential backoff (1s, 2s, 4s, 8s, cap 60s)
5. After max retries: mark `failed`, surface to user

**Idempotency keys:** Every write carries a unique ID. Server deduplicates. "Exactly-once delivery" is impossible; "at-least-once delivery + exactly-once processing" is achievable.

### 7.6 Data Integrity During Sync

- **Document checksums:** SHA-256 hash of content, server recomputes and rejects mismatches
- **Interrupted sync:** Checkpoints make pull safe (re-fetch from last committed). Outbox makes push safe (retry with idempotency key)
- **Periodic consistency checks:** Daily, hash all doc IDs + `updatedAt` values, compare client vs server. Mismatch = trigger full re-sync.

> **Sources:** [RxDB Replication](https://rxdb.info/replication.html), [RxDB CRDT](https://rxdb.info/crdt.html), [Ink & Switch Local-First](https://www.inkandswitch.com/local-first/), [Martin Kleppmann CRDTs](https://martin.kleppmann.com/2020/07/06/crdt-hard-parts-hydra.html), [PouchDB Conflicts Guide](https://pouchdb.com/guides/conflicts.html)

### 7.7 Data Mode Tiers (Thin-Client Architecture)

WTFPOS implements **4 data modes** that fundamentally change how each device interacts with the network. This is a sophisticated tiered architecture where device capabilities scale from full offline to streaming-only.

| Mode | Network Behavior | Offline Capability | Resource Footprint |
|------|-----------------|-------------------|-------------------|
| `full-rxdb` | All 17 collections synced via RxDB pull/push + SSE | Full R/W offline | High (full IndexedDB) |
| `selective-rxdb` | 6 critical collections synced, writes via HTTP | Read-only offline (6 collections) | Medium (partial IndexedDB) |
| `api-fetch` | No local DB, HTTP GET + SSE for reads, HTTP POST for writes | None | Low (no IndexedDB) |
| `sse-only` | SSE stream only, no persistence, no writes | None | Minimal |

**When to use which mode:**
- **`full-rxdb`**: Only for the server tablet — it IS the canonical data source
- **`selective-rxdb`**: Staff/kitchen tablets that need offline reads but can tolerate online-only writes
- **`api-fetch`**: Owner/admin accessing from any browser — no need to cache all data locally
- **`sse-only`**: Passive displays that only show real-time state (e.g., kitchen monitors)

**Trade-offs:**
| | full-rxdb | selective-rxdb | api-fetch | sse-only |
|---|---|---|---|---|
| Offline reads | ✓ All | ✓ 6 collections | ✗ | ✗ |
| Offline writes | ✓ | ✗ | ✗ | N/A |
| Write latency | ~0ms (local) | ~100ms (HTTP to server) | ~100ms (HTTP to server) | N/A |
| Write durability | Local-first (survives server crash) | Server-confirmed (lost if server crashes before write returns) | Server-confirmed | N/A |
| Startup time | Slow (sync all collections) | Medium (sync 6 collections) | Fast (single HTTP fetch) | Fastest (SSE connect only) |
| IndexedDB usage | ~50-500MB | ~5-50MB | 0 | 0 |

> **Industry context:** This tiered approach is similar to how Toast POS handles offline vs. online terminals — primary registers cache everything, secondary displays stream. The key innovation in WTFPOS is that the mode selection is automatic based on device identity and user role, requiring zero manual configuration.

> **Sources:** [Toast Network Requirements](https://central.toasttab.com/s/article/Toast-Network-Requirements-Overview), [RxDB Downsides of Offline First](https://rxdb.info/downsides-of-offline-first.html)

### 7.8 Thin-Client Write Pattern (HTTP-Direct vs RxDB-Push)

WTFPOS uses two distinct write paths depending on data mode:

**Path A: RxDB-Push (Server Tablet Only)**
```
App → RxDB.insert() → IndexedDB → background replication push → server in-memory store → SSE broadcast
```
- **Durability:** Immediate local persistence. Survives server crash.
- **Latency:** 0ms write, 100-500ms propagation to other devices.
- **Offline:** Writes queue locally, push when reconnected.

**Path B: HTTP-Direct (All Thin Clients)**
```
App → HTTP POST /api/collections/{col}/write → server validates → server in-memory store → SSE broadcast
```
- **Durability:** Synchronous server confirmation. Lost if server crashes between HTTP response and next client re-push.
- **Latency:** ~100ms (one LAN round-trip).
- **Offline:** Impossible — write fails without server.

**Why two paths?**
- RxDB replication is a background process with eventual consistency. For the server tablet (single source of truth), this is ideal — writes are instant and durable.
- For thin clients, relying on RxDB background push introduces a window where the write exists only locally. If the thin client crashes, the write is lost. HTTP-direct gives immediate server confirmation — the write either succeeds on the server or fails visibly.
- The `write-proxy.ts` abstraction ensures callers use the same `CollectionProxy` interface regardless of mode: `insert()`, `incrementalPatch()`, `incrementalModify()`, `remove()`.

> **Pattern name:** This is a variant of the [Command Pattern](https://refactoring.guru/design-patterns/command) where the write proxy decides the execution strategy based on device context.

---

## 8. Cloud Sync (Neon)

### 8.1 Architecture: Push-Only, One-Way, Location-Scoped

```
Branch Tablet (RxDB)
  → push-only replication (omit pull handler)
  → batched every 5 min or 100 changes
  → checkpoint-based delta sync
  → SvelteKit API: /api/sync/push
  → INSERT ... ON CONFLICT DO UPDATE WHERE EXCLUDED.updated_at > table.updated_at
  → Neon PostgreSQL (serverless, HTTP transport)
  → Owner queries via Drizzle ORM
```

**No pull handler needed.** Neon never writes back to branches. RxDB natively supports push-only replication.

### 8.2 Why Location Scoping Eliminates Conflicts

Each branch owns its own rows (partitioned by `locationId`). Orders from Tagbilaran never share primary keys with Panglao (nanoid). **Write conflicts are structurally impossible** for 95%+ of documents.

**Where conflicts can occur:** `menu_items` (global, no locationId) — use LWW with `updatedAt` guard.

### 8.3 Idempotent Upserts

```sql
INSERT INTO orders (id, location_id, status, total, updated_at)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (id) DO UPDATE SET
  location_id = EXCLUDED.location_id,
  status = EXCLUDED.status,
  total = EXCLUDED.total,
  updated_at = EXCLUDED.updated_at
WHERE EXCLUDED.updated_at > orders.updated_at;
```

Same document synced twice = no-op (idempotent). Older writes never overwrite newer.

### 8.4 Neon Transport

| Transport | Best For | API |
|-----------|----------|-----|
| **HTTP (`neon()` sql template)** | Single batch upserts, serverless | `const sql = neon(DATABASE_URL)` |
| **WebSocket (`Pool`/`Client`)** | Multi-query transactions | node-postgres compatible |

For WTFPOS sync: HTTP is ideal — each sync cycle is a single batch upsert.

### 8.5 Sync Scheduling

- On WiFi / 4G: sync every **5 minutes** or every **100 changes** (whichever first)
- On 3G: every 10 minutes or 100 changes
- On 2G / saveData: every 30 minutes or explicit user action
- Use `navigator.connection.effectiveType` (Chromium-only — fallback to timeout-based detection)

### 8.6 Data Archival & Pruning

RxDB **Cleanup Plugin** handles local pruning:
- `minimumDeletedTime`: Documents must be deleted for this long before physical removal (default: 1 month)
- `awaitReplicationsInSync`: Waits for all replications to complete before removing

**Retention policy:**

| Collection | Keep Locally | Archive to Cloud |
|-----------|-------------|-----------------|
| `orders` (closed) | 30 days | On close |
| `expenses` | 30 days | On creation |
| `kds_tickets` (bumped) | 7 days | On bump |
| `audit_logs` | 7 days | On creation |
| `stock_counts` | 30 days | On creation |

### 8.7 Sync Health Monitoring

| Metric | Alert Threshold |
|--------|----------------|
| `lastSuccessfulSync` | > 30 min ago |
| `pendingDocCount` | > 500 |
| `failureCount` (consecutive) | > 5 |
| `syncDurationMs` | > 10 seconds |
| `documentsPerSync` | Trending up = accumulation |

RxDB exposes: `replicationState.error$`, `replicationState.sent$`, `replicationState.active$`.

> **Sources:** [RxDB Cleanup Plugin](https://rxdb.info/cleanup.html), [Neon Serverless Driver](https://neon.com/docs/serverless/serverless-driver), [Neon Connection Pooling](https://neon.com/docs/connect/connection-pooling), [RxDB Supabase Plugin](https://rxdb.info/replication-supabase.html)

---

## 9. Network Robustness

### 9.1 Circuit Breaker Pattern

Wrap network calls in a circuit breaker (Martin Fowler):

| State | Behavior |
|-------|----------|
| **Closed** | Normal operation. Failures counted. |
| **Open** | All calls fail immediately (serve from local). Timeout starts. |
| **Half-Open** | Probe requests allowed. Success → Closed. Fail → Open. |

**Recommended config for LAN:**
- `timeout`: 2000-3000ms (LAN is fast when working)
- `errorThresholdPercentage`: 50%
- `resetTimeout`: 5-10 seconds (shorter than internet — LAN recovery is fast)
- `volumeThreshold`: 5 (don't trip on 1 failure)

**Library:** [Opossum](https://github.com/nodeshift/opossum) — works in both Node.js and browsers.

> **Source:** [Martin Fowler Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html)

### 9.2 Exponential Backoff with Jitter

**Why jitter:** Without it, all clients retry simultaneously after server restart (thundering herd).

**Full Jitter (AWS recommended):** `delay = random(0, min(cap, base * 2^attempt))`

| Parameter | LAN | Internet |
|-----------|-----|----------|
| Base interval | 200-500ms | 1000-2000ms |
| Multiplier | 2x | 2x |
| Max cap | 5-10 seconds | 30-60 seconds |
| Max retries | 5-8 | 3-5 |

> **Source:** [AWS Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)

### 9.3 Heartbeat Patterns

**Interval sweet spot:** 5-15 seconds for LAN POS.

**Timeout rule:** 2-3x heartbeat interval. With 10-second heartbeat, declare dead after 20-30 seconds (2-3 missed beats).

| Layer | Mechanism | Default | Recommendation |
|-------|-----------|---------|----------------|
| TCP keepalive | Kernel | 2 hours | Tune to 30s if used |
| Application heartbeat | App code | N/A | 10-15s for LAN |
| SSE comment | `:ping\n\n` | N/A | 15-30s |

**Process crash detection:** TCP keepalive still sends even if app is deadlocked. Application heartbeats stop when app freezes — better signal.

> **Sources:** [Martin Fowler HeartBeat](https://martinfowler.com/articles/patterns-of-distributed-systems/heartbeat.html), [Google SRE Book](https://sre.google/sre-book/monitoring-distributed-systems/)

### 9.4 Split-Brain Prevention

**The risk:** Two devices both think they're the server → dual-masters → data divergence.

**For a small restaurant LAN (2-5 devices), full Raft is overkill.** Pragmatic approach:

1. Designate one device as primary at boot (configured, not elected)
2. If primary unreachable, clients work offline-first (local RxDB)
3. When primary returns, sync resumes
4. **NEVER auto-promote a client to primary** — that is the path to split-brain

**Epoch/term numbers:** Every primary designation increments a monotonic term. If two claim leadership, higher term wins.

### 9.5 Graceful Degradation

**Three connectivity tiers:**

| Tier | Condition | Available | Disabled |
|------|-----------|-----------|----------|
| **Full** | Internet + LAN | Everything | Nothing |
| **LAN** | WiFi up, no internet | POS, KDS, local sync, local reports | Cross-branch, cloud sync |
| **Offline** | No WiFi, no internet | POS (local), receipts, stock entry | All sync, KDS to other devices |

**UI pattern:** Persistent pill/banner showing tier (green/yellow/red). Feature-level graying. Toast on transition. **Never block the user.**

**Implementation:** Derive `connectivityTier` from: `navigator.onLine` + heartbeat to LAN server + heartbeat to internet endpoint.

### 9.6 Connection Quality Monitoring

**Three layers of detection:**

1. **`navigator.onLine`** — Only detects physical disconnection. Returns `true` even on WiFi with no internet. **Unreliable as sole signal.**
2. **`navigator.connection`** — `effectiveType`, `rtt`, `downlink`. **Chromium-only** (no Safari, no Firefox).
3. **Application-level probing (most reliable):**

```
Every 10 seconds:
  1. Ping LAN server /health (timeout: 2000ms)
     Success → LAN up, record latency
     Fail → increment failure counter
  2. If LAN up, ping internet endpoint (timeout: 3000ms)
     Success → tier = 'full'
     Fail → tier = 'lan'
  3. If LAN down 3 consecutive → tier = 'offline'

Latency:
  < 50ms  → excellent (normal LAN)
  50-200ms → degraded (WiFi congestion)
  > 200ms → poor (treat as unreliable)
```

### 9.7 CAP Theorem for POS

**WTFPOS must choose Availability + Partition Tolerance (AP).**

- A cashier cannot be blocked from taking orders because the server is unreachable. That stops revenue.
- Two tablets taking orders during a partition > one tablet refusing to work.
- Slight inconsistency is acceptable and correctable after partition heals.

**Where to prioritize Consistency (CP):** Payment finalization and Z-reading (end-of-day close). Infrequent, high-stakes — can require connectivity.

> **Sources:** [Martin Fowler Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html), [AWS Backoff/Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/), [Google SRE](https://sre.google/sre-book/monitoring-distributed-systems/), [RxDB Downsides of Offline First](https://rxdb.info/downsides-of-offline-first.html)

---

## 10. Offline-First Architecture

### 10.1 The Seven Ideals (Ink & Switch)

1. No spinners — data is local, reads are instant
2. Your work is not trapped in one device
3. The network is optional — app works on an airplane
4. Seamless collaboration — multiple users can work on shared data
5. The Long Now — data outlives any service
6. Security and privacy by default
7. You own your data

**WTFPOS alignment:** Strong on 1, 3, 6, 7. Partial on 2 (LAN sync), 4 (basic conflict handling), 5 (need cloud archival).

### 10.2 The Offline Contract (Non-Negotiable)

> **Every POS operation — order creation, item addition, payment processing, KDS bump — MUST work with zero network.**

Neon and Ably are enhancement layers. Never dependencies.

### 10.3 Delivery Semantics

| Semantics | Guarantee | Use |
|-----------|-----------|-----|
| At-most-once | 0 or 1 delivery | Heartbeats (loss is okay) |
| At-least-once | 1+ deliveries | Order sync (duplicates handled via idempotency) |
| Exactly-once | Theoretically impossible | Achieved via at-least-once + dedup |

> **Source:** [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/)

---

## 11. Security

### 11.1 Current State (Phase 1)

| Aspect | Status | Risk |
|--------|--------|------|
| LAN encryption | None (HTTP) | Anyone on WiFi can see/modify traffic |
| Auth | Session in Svelte state | Page refresh = logged out |
| Manager PIN | `1234` hardcoded | Not per-user, not rotatable |
| Replication auth | None | Rogue device can push bad data |
| SSE auth | None | Any LAN device can subscribe |

### 11.2 Mitigations (Planned)

- Phase 2: Ably token auth for cross-branch channels
- Phase 2: Neon connection uses TLS (mandatory)
- Future: Device registration approval before replication access
- Future: Per-user manager PINs stored in `users` collection

### 11.3 Trusted WiFi Assumption

Phase 1 operates under a **trusted WiFi assumption** — the restaurant controls the router, uses WPA2/WPA3, and the POS SSID is not shared with guests. This is acceptable for a small business but should be hardened in Phase 2+.

---

## 12. Grading Rubric

Use this rubric to grade WTFPOS's current network implementation and identify improvement areas.

### Scoring: 0 (Not Started) → 1 (Basic) → 2 (Good) → 3 (Expert)

### A. Device Identity

| Criterion | 0 | 1 | 2 | 3 | WTFPOS Current |
|-----------|---|---|---|---|----------------|
| Unique ID generation | No ID | Sequential/timestamp | UUID/nanoid | nanoid + collision-safe length | **3** (nanoid(16) = 96-bit entropy, `dev-` prefix) |
| Persistence | None | localStorage only | localStorage + IndexedDB | + `persist()` + PWA | **3** (localStorage + `navigator.storage.persist()` + cookie backup with 1-year max-age) |
| Multi-tab safety | Duplicates | Manual dedup | BroadcastChannel | RxDB leader election | **3** (RxDB LeaderElection plugin — only leader tab runs heartbeat + replication) |
| Recovery on ID loss | Broken | New ID, lost history | New ID, re-register | Server re-identification | **3** (client-side hardware fingerprint match + server-side POST `/api/device/identify` re-identification) |

**Score: 12/12** *(was 8, +4 — fully maxed: nanoid(16), cookie backup, leader election, server re-identification)*

### B. Server Detection

| Criterion | 0 | 1 | 2 | 3 | WTFPOS Current |
|-----------|---|---|---|---|----------------|
| Server identification | Manual config | Login role | IP auto-detect | IP + `os.networkInterfaces()` | **3** (`/api/device/identify` uses `os.networkInterfaces()` + IPv6-mapped normalization) |
| Multi-tab on server | Creates duplicates | Shared localStorage | IP grouping | IP + leader election | **3** (shared localStorage device ID + IP-based server flag + RxDB leader election) |
| Split-brain prevention | None | Manual designation | Epoch/term | Consensus protocol | **2** (server epoch via `Date.now()` at startup, client compares via `SERVER_EPOCH_KEY` in localStorage) |
| Server restart recovery | Data lost | Manual re-push | Auto-detect + re-push | + generation tracking | **3** (`isServerStoreEmpty()` → `bumpSyncGeneration()` → full re-push) |

**Score: 11/12** *(was 9, +2 from leader election + server epoch tracking)*

### C. Network Robustness

| Criterion | 0 | 1 | 2 | 3 | WTFPOS Current |
|-----------|---|---|---|---|----------------|
| Connectivity detection | None | `navigator.onLine` | + LAN server probe | + quality tiers (full/lan/offline) | **3** (three-tier: probes `/api/replication/status` + gstatic.com, 60s interval, circuit-broken) |
| Retry logic | None | Fixed interval | Exponential backoff | + full jitter | **3** (`calculateBackoff()`: `min(base * 2^attempt, max) * random()`, per-collection tracking) |
| Circuit breaker | None | Basic timeout | Open/closed states | Full open/half-open/closed | **3** (`CircuitBreaker` class: closed→open→half-open→closed, used by replication + connectivity) |
| Graceful degradation UI | No indicator | Online/offline pill | + sync status banner | + feature-level degradation | **3** (three-tier pill + full status panel with per-collection sync, device identity, server hostname + data-mode-aware UI degradation) |

**Score: 12/12** *(was 4, +8 — fully maxed)*

### D. Sync & Replication

| Criterion | 0 | 1 | 2 | 3 | WTFPOS Current |
|-----------|---|---|---|---|----------------|
| LAN replication | None | Manual sync button | Checkpoint pull/push | + multiplexed SSE stream | **3** (checkpoint pull/push + multiplexed SSE for 17 collections + priority tiers + 4-mode thin-client architecture with automatic mode selection) |
| Conflict resolution | None | Last-write-wins | Field-level merge | + CRDTs for counters | **3** (field-level merge for 5 collections + CRDT `max()` for monotonic fields like `deliveries.usedQty`) |
| Sync health monitoring | None | Doc count comparison | + pending count + lag | + per-collection metrics | **3** (ConnectionStatus panel: per-collection local/server counts, synced/behind/ahead, 60s refresh) |
| Data integrity | None | updatedAt ordering | + checksums | + periodic full verification | **3** (djb2 checksums: server `CollectionStore.checksum()` + client `computeLocalChecksum()` + `verifyIntegrity()` per-collection comparison) |

**Score: 12/12** *(was 10, +2 — fully maxed: CRDT merge + djb2 checksum verification)*

### E. Real-Time

| Criterion | 0 | 1 | 2 | 3 | WTFPOS Current |
|-----------|---|---|---|---|----------------|
| Same-branch KDS | Manual refresh | Polling | SSE with debounce | SSE immediate + Last-Event-ID | **3** (smart debounce: critical changes push immediately, non-critical at 3s + Last-Event-ID) |
| Cross-branch view | None | Manual refresh | SSE aggregate | Ably pub/sub with presence | **2** (SSE aggregate proxy with per-branch connection events) |
| Event delivery | Fire-and-forget | At-most-once | At-least-once | + idempotent dedup | **2** (at-least-once via 50-event ring buffer + Last-Event-ID replay; POS→server still fire-and-forget) |
| Reconnection handling | None | Manual reload | Auto-reconnect | + state replay + Last-Event-ID | **3** (auto-reconnect + ring buffer replay via Last-Event-ID header) |

**Score: 10/12** *(was 5, +5 from smart debounce + Last-Event-ID + ring buffer)*

### F. Cloud Sync

| Criterion | 0 | 1 | 2 | 3 | WTFPOS Current |
|-----------|---|---|---|---|----------------|
| Cloud database | None | Manual export | Batch sync | Push-only with idempotent upserts | **0** (not started — Phase 2) |
| Sync scheduling | None | Manual trigger | Fixed interval | Adaptive (connection-aware) | **0** |
| Data archival | None | Manual cleanup | Time-based pruning | RxDB cleanup plugin + cloud confirm | **0** |
| Sync health dashboard | None | Last sync time | + pending count | + per-branch metrics | **0** |

**Score: 0/12** *(Phase 2 — not actionable yet)*

### G. Physical Network

| Criterion | 0 | 1 | 2 | 3 | WTFPOS Current |
|-----------|---|---|---|---|----------------|
| WiFi band | 2.4 GHz shared | 5 GHz shared | Dedicated POS SSID (5 GHz) | + VLAN separation | **?** (needs on-site audit) |
| Server IP stability | Random DHCP | Long lease | DHCP reservation | + MAC pinning + fallback | **?** (needs on-site audit) |
| Router resilience | No UPS | UPS on router | + UPS on server tablet | + cellular backup | **?** (needs on-site audit) |
| Documentation | None | IP written on paper | Admin guide | + automated discovery | **1** (`docs/SYSTEM_ADMIN_GUIDE.md` exists) |

**Score: ?/12 (needs physical audit, +1 for admin guide)**

---

### Overall Score Summary

| Category | Previous | Current | Max | Grade |
|----------|----------|---------|-----|-------|
| A. Device Identity | 6 | **12** | 12 | **Expert (maxed)** |
| B. Server Detection | 6 | **11** | 12 | Strong |
| C. Network Robustness | 4 | **12** | 12 | **Expert (maxed)** |
| D. Sync & Replication | 7 | **12** | 12 | **Expert (maxed)** |
| E. Real-Time | 5 | **10** | 12 | Strong |
| F. Cloud Sync | 0 | **0** | 12 | Not Started (Phase 2) |
| G. Physical Network | ? | **?** | 12 | Needs Audit |
| **Total (scored)** | **28/72** | **57/72** | **72** | **79% — Production-grade** |

### Remaining Improvements (Ordered by Impact)

1. **Split-brain prevention** (B3: 2→3) — consensus protocol for multi-server scenarios (currently epoch-based)
2. **Cross-branch real-time** (E2: 2→3) — Ably pub/sub replaces SSE aggregate proxy (Phase 2)
3. **Idempotent event dedup** (E3: 2→3) — dedup layer on POS→server fire-and-forget writes
4. **Start Neon cloud sync** (F*) — enables cross-branch reports and data archival (Phase 2)
5. **Physical network audit** (G*) — verify 5 GHz, DHCP reservation, UPS on-site
6. **Thin-client offline write queue** — selective-rxdb devices currently can't write offline. A local write queue with retry-on-reconnect would improve resilience (currently acceptable because LAN is reliable).
7. **Server-side observability dashboard** — client tracker data is logged but not exposed in admin UI. A device monitor page showing real-time connections, routes, and sync status would help ops.

---

## Master Source List

### Official Documentation
- [RxDB Replication](https://rxdb.info/replication.html)
- [RxDB CRDT Plugin](https://rxdb.info/crdt.html)
- [RxDB Leader Election](https://rxdb.info/leader-election.html)
- [RxDB Cleanup Plugin](https://rxdb.info/cleanup.html)
- [RxDB Downsides of Offline First](https://rxdb.info/downsides-of-offline-first.html)
- [MDN EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [MDN Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [MDN BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
- [MDN Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [HTML Living Standard: SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [Neon Serverless Driver](https://neon.com/docs/serverless/serverless-driver)
- [Neon Connection Pooling](https://neon.com/docs/connect/connection-pooling)
- [Ably Pub/Sub](https://ably.com/pubsub)
- [Ably Presence](https://ably.com/docs/presence-occupancy/presence)
- [Ably Token Auth](https://ably.com/docs/auth/token)
- [SvelteKit adapter-node](https://svelte.dev/docs/kit/adapter-node)
- [Node.js os.networkInterfaces()](https://nodejs.org/api/os.html)

### Architecture & Patterns
- [Martin Fowler: Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Martin Fowler: HeartBeat](https://martinfowler.com/articles/patterns-of-distributed-systems/heartbeat.html)
- [Martin Fowler: Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Martin Fowler: CQRS](https://martinfowler.com/bliki/CQRS.html)
- [AWS: Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Google SRE Book](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Ink & Switch: Local-First Software](https://www.inkandswitch.com/local-first/)
- [Martin Kleppmann: CRDTs Hard Parts](https://martin.kleppmann.com/2020/07/06/crdt-hard-parts-hydra.html)

### Industry POS References
- [Toast Network Requirements](https://central.toasttab.com/s/article/Toast-Network-Requirements-Overview)
- [Toast Offline Mode](https://doc.toasttab.com/doc/platformguide/platformOfflineModeLocalSync.html)
- [Fresh KDS Local Network Integration](https://fresh-technology.github.io/fresh.kds.docs.mobile-local-network-integration/docs/discovery/)
- [Square Offline Payments](https://squareup.com/us/en/payments/offline-payments-guide)

### Deep Dives
- [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/)
- [Apify: IPv4-mapped IPv6 in Node.js](https://blog.apify.com/ipv4-mapped-ipv6-in-nodejs/)
- [WebKit Storage Policy Updates](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [Raft Consensus Algorithm](https://raft.github.io/)
- [PouchDB Conflicts Guide](https://pouchdb.com/guides/conflicts.html)
- [Jared Forsyth: In Search of a Local-First Database](https://jaredforsyth.com/posts/in-search-of-a-local-first-database/)
- [Chromium Tab Throttling](https://blog.chromium.org/2020/11/tab-throttling-and-more-performance.html)
