# RxDB Offline-First Architecture: Best Practices & Patterns

> **The One Rule That Governs Everything in This Document:**
> Every design decision, every sync strategy, every pattern described here exists to serve a single goal — **call the server less.** RxDB is not adopted because it is trendy. It is adopted because, when implemented correctly, it turns your serverless database into a sleeping giant that only wakes up when there is real work to do. Every unnecessary server round-trip is wasted money. Every idle compute hour you prevent is profit you keep.

This guide outlines the core strategies for implementing RxDB as a local-first database cache, specifically optimized for a SvelteKit and Neon serverless Postgres stack. The primary goal is to maximize UI speed and offline reliability while **strictly minimizing costly database compute hours and network egress.**

---

## Table of Contents

1. [The Economics That Drive Every Decision](#the-economics-that-drive-every-decision)
2. [Authority Topology: Who Is the Master?](#1-authority-topology-who-is-the-master)
3. [When to Use RxDB: The Architectural Decision Framework](#2-when-to-use-rxdb-the-architectural-decision-framework)
4. [The Three Fundamental Offline-First Patterns](#3-the-three-fundamental-offline-first-patterns)
5. [Cost-Saving Sync Strategies](#4-cost-saving-sync-strategies)
6. [Schema Design for Sync Efficiency](#5-schema-design-for-sync-efficiency)
7. [Handling the Initial Sync (The Bootstrap Problem)](#6-handling-the-initial-sync-the-bootstrap-problem)
8. [Client-Side Storage Limits and Cleanup](#7-client-side-storage-limits-and-cleanup)
9. [Security Considerations](#8-security-considerations)
10. [Summary: The Server-Savings Checklist](#9-summary-the-server-savings-checklist)

---

## The Economics That Drive Every Decision

Before touching a single line of code, you need to understand why local-first architecture is fundamentally an economic strategy.

### How Serverless Billing Works Against You

Neon (and most serverless Postgres providers) bill on two axes: **compute time** (measured in CU-hours) and **data transfer** (egress in GB). A traditional app where every button tap fires a `SELECT` or `INSERT` against the server is the worst possible architecture for this billing model. Consider: a single SvelteKit page that renders a product list, fetches pricing, and checks inventory could fire three separate queries. Multiply that by 50 concurrent users refreshing every few seconds, and your "scale-to-zero" database never actually scales to zero.

RxDB inverts this. By moving the read layer and the write buffer onto the client device, you collapse hundreds of individual server requests into a single, periodic batch sync. The server wakes up, processes a compressed payload of changes, and goes back to sleep. The cost difference between these two architectures is not incremental — it is often an order of magnitude.

### The Core Economic Principle

**Your server should only be involved when data needs to cross the boundary between devices.** If a user is entering data on a single device, that is a local operation. If a user needs to see what another device entered, that is a sync operation. RxDB handles the first case entirely on-device, and batches the second case into the smallest possible server interaction. Every design pattern in this document flows from this principle.

---

## 1. Authority Topology: Who Is the Master?

Before deciding _when_ and _how_ to sync, you must first resolve a more fundamental architectural question: **which node holds write authority?** In a distributed system with an RxDB client and a Neon server, the authority topology determines conflict behavior, data integrity guarantees, sync complexity, and — critically — how much work the server must do.

There are three viable topologies. Each carries distinct trade-offs in consistency, availability, server cost, and implementation complexity. The choice is not global — different collections within the same application can (and often should) use different topologies.

### Topology A: Server-Authoritative (Neon Is Master)

**Data flow direction:** Unidirectional. Neon → RxDB (pull-only). The client is a read replica.

**How it works:** Neon holds the single source of truth. RxDB pulls data via checkpoint-based delta sync and caches it locally for zero-latency reads. All write operations are submitted directly to Neon through standard SvelteKit API endpoints (server-side `+server.ts` handlers or form actions). RxDB never pushes data to the server — it only receives.

**Conflict probability:** Zero. Because only one node (Neon) accepts writes, there is no possibility of divergent state between devices. The replication is strictly unidirectional; the client is a downstream consumer, never a producer.

**When to use this topology:**
- **Reference data and catalog tables.** Product catalogs, configuration tables, pricing rules, lookup tables — any dataset that is authored by administrators and consumed read-only by end users. The cardinality of writers is exactly one (the admin panel or backend process), so multi-writer conflict is structurally impossible.
- **Data requiring strong transactional consistency.** Financial ledgers, sequential ID generators, inventory counts where overselling must be prevented — any domain where eventual consistency introduces unacceptable business risk. The server enforces ACID constraints that a client-side database cannot guarantee.
- **Computed or derived data.** Aggregated reports, calculated balances, analytics rollups — data that is produced by server-side processes and would be meaningless to "edit" on the client.

**Server cost profile:** Moderate. Every write still requires a server round-trip (the server must be awake for every mutation). However, the read layer is fully offloaded to RxDB, which eliminates the most frequent and repetitive server queries. For read-heavy, write-light collections, this topology dramatically reduces total server interaction.

**Architectural advantage:** Simplicity. No push handler, no conflict handler, no tombstone management on the client side for write operations. The RxDB implementation is strictly a pull-cache, which reduces the sync codebase by roughly half compared to a bidirectional setup.

### Topology B: Client-Authoritative (RxDB Is Master)

**Data flow direction:** Bidirectional, but the client is the primary write surface. RxDB → Neon (push), Neon → RxDB (pull for cross-device sync).

**How it works:** RxDB is the initial point of persistence for all write operations. Data is written to the local database first, producing an instant UI response. Changes are then pushed to Neon asynchronously via batched sync. Neon serves as the durable backup and the distribution hub for cross-device replication — when Device A pushes changes, Device B pulls them from Neon on its next sync cycle.

**Conflict probability:** Non-zero. Proportional to: `P(conflict) ≈ f(N_devices × W_rate × T_offline)` where `N_devices` is the number of concurrently active devices writing to the same collection, `W_rate` is the write frequency per device, and `T_offline` is the average duration between sync cycles. In practice, for single-device or low-concurrency workflows (one operator per terminal, one field worker per route), the conflict rate approaches zero. For multi-device collaborative editing, it rises and requires explicit resolution strategy.

**When to use this topology:**
- **Transactional data capture under unreliable connectivity.** Point-of-sale transactions, field inspection entries, survey responses, utility meter readings — any workflow where the user must be able to write data regardless of network state. The write must never fail due to connectivity; it must succeed locally and propagate later.
- **High-frequency write workflows.** Any feature where the user generates more than ~5 writes per minute. Each write hitting the server individually would produce excessive wake-ups. Client-authoritative batching consolidates these into periodic pushes.
- **Single-writer-per-record scenarios.** When the data model naturally partitions such that each record is owned by exactly one device or user (e.g., "this terminal's orders," "this inspector's reports"), the theoretical conflict probability drops to near-zero even with multiple devices in the system, because the write sets are disjoint.

**Server cost profile:** Lowest possible. The server is completely decoupled from the user's interaction loop. It only activates during push/pull sync events, which can be batched, debounced, and event-triggered. Between syncs, Neon can scale to zero.

**Conflict resolution requirement:** Mandatory. Even if conflicts are statistically rare, the system must define a deterministic resolution strategy. Options ranked by implementation complexity:

| Strategy | Mechanism | Data Loss Risk | Complexity |
|---|---|---|---|
| **Last-Write-Wins (LWW)** | Compare `updated_at` timestamps; newest write survives | Moderate — the losing write is silently discarded | Low |
| **Server-Wins (Default)** | RxDB's default handler; server state always takes priority on conflict | Moderate — client changes are discarded if server diverged | Lowest |
| **Field-Level Merge** | Compare individual fields; merge non-conflicting changes, flag conflicting fields | Minimal — only conflicting fields require resolution | Medium |
| **Application-Specific Logic** | Custom handler evaluating business rules (e.g., "higher quantity wins," "append-only merge") | Depends on implementation | Highest |

### Topology C: Hybrid / Per-Collection Authority (Recommended for Most Applications)

**Data flow direction:** Varies per collection. Some collections are server-authoritative (pull-only), others are client-authoritative (bidirectional).

**How it works:** The application partitions its data model into two classes:

1. **Server-owned collections** — reference data, configurations, admin-authored content. These use Topology A (pull-only). The client consumes but never mutates.
2. **Client-owned collections** — operational data, user-generated content, transactional records. These use Topology B (bidirectional with batched push).

This is not a compromise — it is the optimal architecture for most real-world systems. It applies the minimum necessary sync complexity to each data type, which directly minimizes both implementation effort and server cost.

**Example partition for a generic operational application:**

| Collection | Authority | Sync Direction | Rationale |
|---|---|---|---|
| `products` / `catalog` | Server (Neon) | Pull-only | Authored by admin; consumed by all clients read-only |
| `config` / `settings` | Server (Neon) | Pull-only | System configuration; no client mutation |
| `users` / `roles` | Server (Neon) | Pull-only | Authentication data; managed server-side |
| `transactions` / `orders` | Client (RxDB) | Bidirectional | High-frequency writes under variable connectivity |
| `inspections` / `readings` | Client (RxDB) | Bidirectional | Field data capture; must work offline |
| `tasks` / `work_orders` | Client (RxDB) | Bidirectional | Status updates from field devices |

**Server cost profile:** Optimal. Server-authoritative collections generate zero push traffic. Client-authoritative collections generate minimal, batched push traffic. The server's total active time is the absolute minimum required for data durability and cross-device distribution.

### Choosing Your Topology: The Authority Decision Matrix

The following matrix provides a quantitative framework for assigning authority to each collection. Score each dimension 0–2, sum the scores, and apply the threshold.

| Dimension | Score 0 | Score 1 | Score 2 |
|---|---|---|---|
| **Write origin** | Server/admin processes only | Mixed (admin + end-user) | End-user devices exclusively |
| **Connectivity reliability** | Always online (admin panel, internal tools) | Generally reliable with occasional drops | Frequently unreliable or fully offline |
| **Write frequency (per device)** | < 1 write/minute | 1–10 writes/minute | > 10 writes/minute |
| **Consistency requirement** | Strong (ACID required, zero tolerance for stale reads) | Moderate (seconds of staleness acceptable) | Eventual (minutes of divergence acceptable) |
| **Concurrent writers to same record** | Never (single-writer guarantee) | Rare (< 5% of records see multi-writer) | Frequent (collaborative editing, shared records) |

**Scoring thresholds:**
- **0–3 → Server-Authoritative (Topology A).** Low write frequency, high consistency needs, single write origin. The server can handle the write load directly, and the cost of doing so is justified by the consistency guarantee.
- **4–6 → Evaluate per-collection.** Mixed signals. Some dimensions favor client authority, others favor server authority. This is the most common range, and it typically resolves to Topology C (Hybrid) where the specific score breakdown determines the split.
- **7–10 → Client-Authoritative (Topology B).** High write frequency, unreliable connectivity, end-user write origin. The server cannot be in the critical write path without degrading UX and inflating costs.

---

## 2. When to Use RxDB: The Architectural Decision Framework

RxDB introduces non-trivial complexity — schema management, conflict resolution, sync logic, client-side storage lifecycle. That complexity is only justified when the measurable reduction in server resource consumption (CU-hours, egress GB, wake-up frequency) exceeds the marginal engineering cost of implementation and maintenance.

### The Six-Dimensional Evaluation

Before adding RxDB to any feature module, evaluate it against these six dimensions. Each dimension probes a specific axis of the cost-benefit equation. A feature must score favorably on at least three dimensions to justify RxDB adoption; scoring favorably on fewer than two is a strong contra-indication.

**Dimension 1: Read Multiplicity (R)**
_What is the ratio of read operations to unique data fetches for this feature?_

Quantify how many times the same data is read per session relative to how often that data changes. If a user's session involves loading a reference dataset N times but the dataset changes approximately once per day, the read multiplicity is N:1. RxDB eliminates all but the first fetch, converting an O(N) server cost into O(1). For features with R > 5:1, the server cost reduction is significant. For R > 20:1, it is substantial. Features with R ≈ 1:1 (each read fetches genuinely new data) gain no caching benefit from RxDB.

**Dimension 2: Write Latency Tolerance (W)**
_What is the maximum acceptable delay between a user's write action and that write being durably persisted on the server?_

This is not a binary online/offline question. It is a spectrum:
- **W < 100ms** — The write must be synchronously committed to the server before the UI can proceed. Examples: financial transfers, seat reservations, authentication state changes. RxDB cannot satisfy this — the server must be in the critical path.
- **W = 100ms – 5s** — The write can be optimistically applied to the UI, but must reach the server within seconds. RxDB can serve as a write-ahead buffer if the push cycle is very short, but the server cost savings are marginal.
- **W = 5s – 60s** — The write can be batched with other writes and pushed in a debounced or event-triggered cycle. This is the sweet spot for RxDB. The user perceives instant response, and the server receives consolidated payloads.
- **W > 60s** — The write can tolerate minutes or hours before reaching the server. This is the maximum cost-saving zone. The server wakes up infrequently, processes large batches, and sleeps.

Features in the W > 5s range are strong RxDB candidates. Features in the W < 100ms range are contra-indicated.

**Dimension 3: Network Reliability Coefficient (N)**
_What is the probability that the network is available at the moment the user needs to perform an operation?_

Express this as a reliability coefficient between 0.0 (always offline) and 1.0 (always online). For server-room admin panels, N ≈ 0.99. For mobile field workers in variable terrain, N might be 0.6–0.8. For embedded devices in basements or tunnels, N could drop below 0.5.

When N < 0.9, the expected failure rate of server-dependent operations becomes noticeable to users. At N < 0.7, it becomes operationally disruptive. RxDB's value proposition increases monotonically as N decreases, because it decouples the user's workflow from network availability entirely.

However — and this is critical — **RxDB delivers significant server cost savings even when N = 1.0 (perfect connectivity).** The cost argument is independent of the reliability argument. A feature can justify RxDB purely on read caching and write batching economics, with zero offline requirement.

**Dimension 4: Dataset Cardinality and Size (D)**
_How many documents does this feature's collection contain, and what is the average document size in bytes?_

RxDB must download the working dataset to the client. This creates two constraints:

- **Initial sync time.** The first-time bootstrap must complete within a tolerable user wait. For interactive applications, this ceiling is approximately 5-10 seconds. At typical broadband speeds (~10 Mbps effective), this limits the initial dataset to approximately 6-12 MB. On mobile networks (~2 Mbps effective), the practical limit drops to 1-2.5 MB.
- **Client storage capacity.** Browser IndexedDB storage varies: Chrome and Firefox typically allow 60% of available disk space (often 1-10 GB on modern devices); Safari restricts to approximately 1 GB and may evict data for sites unused for 7 days. OPFS and SQLite (via Capacitor/React Native) offer more predictable limits.

For collections exceeding approximately 50,000 documents or 100 MB total size, evaluate whether the full dataset can be scoped (filtered by user, branch, date range) to bring the client-relevant subset within practical bounds. If scoping is infeasible and the dataset is inherently large, server-side querying with pagination is the appropriate pattern.

**Dimension 5: Write Concurrency and Conflict Surface Area (C)**
_How many distinct devices or users may write to the same record concurrently?_

The conflict surface area determines the operational complexity of the sync layer:

- **C = 1 (single-writer guarantee):** The data model naturally partitions such that each record is exclusively owned by one device. Conflict resolution is structurally unnecessary. This is the ideal RxDB scenario — maximum cost savings with minimum complexity. Examples: one terminal's transactions, one inspector's readings, one user's personal notes.
- **C = 2–5 (low multi-writer):** Multiple writers may occasionally touch the same record. Last-write-wins or server-wins resolution handles this with acceptable data loss risk. Most operational applications fall here.
- **C > 5 (high multi-writer):** Many users frequently edit the same records (collaborative document editing, shared kanban boards). Conflict resolution becomes a primary engineering concern. CRDTs or field-level merge strategies may be required. The complexity cost is high, and the architecture should be carefully evaluated against server-side alternatives.

**Dimension 6: Data Sensitivity and Regulatory Classification (S)**
_Does this data fall under regulatory constraints (GDPR, HIPAA, PCI-DSS, etc.) or contain personally identifiable information that restricts client-side persistence?_

Replicating data to a client device means that data exists outside the controlled server environment. For data classified as sensitive, this creates compliance obligations: encryption at rest (RxDB supports this via plugins), device access controls, data retention policies, and audit logging. If the regulatory burden of client-side persistence exceeds the operational benefit of local-first, the data should remain server-side.

### The RxDB Adoption Scoring Matrix

| Dimension | Strong Candidate (2 pts) | Moderate (1 pt) | Contra-indicated (0 pts) |
|---|---|---|---|
| **R: Read Multiplicity** | R > 10:1 | R = 3:1 – 10:1 | R ≈ 1:1 |
| **W: Write Latency Tolerance** | W > 30s (batch-tolerant) | W = 5–30s (debounce-tolerant) | W < 5s (near-synchronous required) |
| **N: Network Reliability** | N < 0.7 (frequently offline) | N = 0.7–0.95 (occasionally unreliable) | N > 0.95 (reliably online) |
| **D: Dataset Size** | < 10 MB on client | 10–100 MB on client (scopeable) | > 100 MB (unscopeable) |
| **C: Write Concurrency** | C = 1 (single-writer) | C = 2–5 (low multi-writer) | C > 5 (high multi-writer) |
| **S: Data Sensitivity** | Non-sensitive, no regulatory constraints | Moderate sensitivity, encryption sufficient | Highly regulated, client storage restricted |

**Scoring thresholds:**
- **9–12 points → Strongly adopt RxDB.** The feature exhibits high read multiplicity, batch-tolerant writes, unreliable connectivity, manageable dataset size, low conflict surface, and no regulatory obstacles. The server cost reduction will be substantial.
- **5–8 points → Conditionally adopt.** Evaluate on a case-by-case basis. The benefit exists but may not justify the full RxDB stack. Consider a lightweight client cache (SvelteKit `load` with `stale-while-revalidate`) as a lower-complexity alternative for the weaker dimensions.
- **0–4 points → Do not adopt RxDB.** The feature does not exhibit the characteristics that generate server cost savings. Standard server-side rendering with SvelteKit is the appropriate pattern.

### Where RxDB Excels: Application Archetype Classification

Rather than enumerating specific products, the following classifies application archetypes by their structural properties — the same properties measured by the six-dimensional evaluation. Any application matching one of these archetypes is a high-probability RxDB candidate.

**Archetype 1: Transactional Data Capture Systems**
_Structural properties: High write frequency (W > 30s tolerance), low write concurrency (C = 1), reference data with extreme read multiplicity (R > 50:1), variable network reliability._

This archetype includes point-of-sale systems, ticket/order entry terminals, booking kiosks, and any interface where an operator repeatedly reads from a stable reference dataset (menu, catalog, price list) while generating a high volume of transactional records (orders, tickets, bookings). The reference data changes infrequently (daily or weekly updates), while transactional data is generated continuously during operating hours.

Server cost dynamics: Without RxDB, the reference dataset is fetched on every page load or search interaction — potentially hundreds of times per shift per device. With RxDB, it is fetched once (on initial sync) and updated only via delta pulls when changes occur. The transactional writes, which would individually wake the server per-keystroke in a traditional architecture, are batched into periodic pushes (per-transaction or per-session), reducing server wake-ups by 1-2 orders of magnitude.

**Archetype 2: Field Data Collection and Mobile Inspection Systems**
_Structural properties: Write-heavy with long offline intervals (W >> 60s), effectively single-writer (C = 1), small-to-medium reference datasets (D < 10 MB), network reliability N < 0.7._

This archetype encompasses utility meter reading, building/facility inspections, agricultural field surveys, environmental monitoring, insurance claims assessment, and any workflow where a mobile operator traverses physical space while recording structured observations. The defining characteristic is that the operator must continue working regardless of connectivity, and the data must not be lost between entry and eventual server sync.

Server cost dynamics: The server receives one consolidated push per collection session (e.g., one push containing all 20 readings for a building, one push containing all inspection items for a facility). Without RxDB, each individual entry would require a server round-trip — or, more likely, would fail silently due to poor connectivity, requiring re-entry. The server processes one batch instead of N individual writes, and the total active compute time per session is measured in milliseconds.

**Archetype 3: Distributed Operational Dashboards with Local Interactivity**
_Structural properties: Extreme read multiplicity (R > 100:1), infrequent writes (status updates, acknowledgments), medium datasets (D = 10–50 MB, scopeable by role/location), moderate network reliability._

This archetype includes task management boards for field teams, logistics tracking displays, warehouse management views, healthcare ward status boards, and any interface where multiple users observe a shared operational state and occasionally update their portion of it. The data is predominantly read, with writes limited to status transitions (e.g., "accepted," "in-progress," "completed").

Server cost dynamics: The operational dataset is pulled once and cached. Reactive RxDB queries keep the UI updated from the local store without server interaction. The infrequent writes (status changes) are small payloads pushed in batched cycles. Cross-device visibility is achieved through SSE-triggered delta pulls rather than continuous polling. The server's role is reduced to a brief intermediary during sync events.

**Archetype 4: Event Logging and Time-Series Capture**
_Structural properties: Append-only writes (no updates, no deletes), zero conflict surface (C = 0), high write velocity, no read-back requirement during capture._

This archetype includes IoT sensor data ingestion, application telemetry, incident logging, activity tracking, and any system where the client generates a stream of immutable records that must be durably captured and eventually transmitted to the server. The records are never read back on the originating device (or are read only for immediate confirmation), and they are never modified after creation.

Server cost dynamics: This is the most cost-efficient RxDB use case. Because writes are append-only and never conflict, the sync layer is maximally simple — push-only with no pull required (or pull-only for cross-device visibility). The server receives large batches of immutable records at infrequent intervals. No conflict resolution logic is needed. No tombstone management is needed. The implementation overhead is minimal.

**Archetype 5: Offline-Tolerant Collaboration Systems**
_Structural properties: Bidirectional read-write (R and W both significant), moderate write concurrency (C = 2–5), medium datasets, network reliability varies across users._

This archetype includes shared project management tools, collaborative checklists, team note-taking applications, and distributed content authoring systems. Multiple users read and write to overlapping datasets, but the write frequency and conflict probability remain manageable with standard resolution strategies (LWW or field-level merge).

Server cost dynamics: This is the highest-complexity RxDB use case, but it still delivers substantial server savings compared to a server-centric architecture. Instead of every user action generating a real-time server request, all interactions are local-first with periodic bidirectional sync. The conflict resolution overhead is non-zero but bounded — in most applications, actual conflicts represent less than 1-5% of sync operations.

### Where RxDB Is Contra-Indicated: Anti-Pattern Classification

**Anti-Pattern 1: Low-Frequency Read-Only Data Consumption**
A user accessing a dashboard once per day to view a pre-computed report. R ≈ 1:1, no writes, no offline requirement. The sync infrastructure cost exceeds the single server query it would eliminate.

**Anti-Pattern 2: Strong-Consistency Transactional Systems**
Financial transfers, real-time inventory reservation (where overselling is commercially unacceptable), live auction bidding. W < 100ms, C > 5. Eventual consistency introduces unacceptable business risk. The server must be the synchronous arbiter.

**Anti-Pattern 3: Large-Scale Analytical Datasets**
Historical transaction archives, log aggregation stores, data warehouse tables. D >> 100 MB. The dataset exceeds practical client storage limits. Server-side query with pagination is the only viable pattern.

**Anti-Pattern 4: Highly Regulated Data With Client-Storage Restrictions**
Medical records under HIPAA, payment card data under PCI-DSS, classified government data. S = maximum. Regulatory compliance may prohibit or severely constrain client-side persistence, making the RxDB approach legally untenable without extensive security infrastructure.

**Anti-Pattern 5: Ephemeral Session State**
Authentication tokens, UI component state, temporary form drafts, notification badges. The data has no durable value and no cross-device relevance. Persisting it in a sync-capable database wastes storage and complexity on data that should live in `sessionStorage` or component state.

---

## 3. The Three Fundamental Offline-First Patterns

Because the client (browser/device) and the server (Neon) are often disconnected — and because **the entire point is to keep them disconnected as much as possible to save server costs** — you cannot use standard SQL workflows. These three patterns prevent data loss, avoid infinite loops, and keep your sync logic predictable.

### A. The Tombstone Pattern (Soft Deletes)

**The Problem It Solves:** If you delete a row from Neon using a standard `DELETE` statement, RxDB has no way to know that record was intentionally removed. On the next sync, RxDB looks at its local copy, sees it still has the record, and assumes the server simply hasn't received it yet. It pushes the record back to Neon, resurrecting the deleted data. You now have a zombie record that cannot be killed.

**The Rule:** Every replicated table must have a `_deleted` boolean column (defaulting to `false`). You never physically remove rows from either side.

**The Workflow:**
1. A user "deletes" a record in the app. RxDB sets `_deleted: true` on the local document.
2. On the next batch sync, SvelteKit's push endpoint receives this change and updates the Neon row to `_deleted = true`.
3. Both databases permanently retain the row, but every query — both local RxDB queries and server-side Neon queries — filters with `WHERE _deleted = false` (or the RxDB equivalent selector).
4. Over time, a scheduled cleanup job can archive or physically remove tombstoned records that are older than a defined retention period (e.g., 90 days), but this is a background maintenance task, not part of the sync logic.

**Why This Saves Server Resources:** Without tombstones, deletions cause sync conflicts that require additional server round-trips to resolve. Tombstones make deletion state explicit and syncable, keeping the push/pull cycle clean and predictable — fewer retries, fewer wasted compute cycles.

### B. The Checkpoint Pattern (Delta Pulls)

**The Problem It Solves:** If RxDB pulled the entire database on every sync, you would burn through Neon's egress limits and compute hours almost immediately. A full table scan on every sync is the exact opposite of the "call the server less" principle.

**The Rule:** Every replicated table must have an `updated_at` timestamp column that updates automatically on every row change (via a Postgres trigger or application logic). The combination of `updated_at` and the primary key serves as the checkpoint.

**The Workflow:**
1. RxDB stores a local checkpoint — the `updated_at` and `id` of the last document it successfully received from the server.
2. When a sync pull is triggered, RxDB sends this checkpoint to SvelteKit: *"Give me everything newer than this."*
3. SvelteKit runs: `SELECT * FROM table WHERE updated_at > $checkpoint_time OR (updated_at = $checkpoint_time AND id > $checkpoint_id) ORDER BY updated_at, id LIMIT $batch_size`
4. Only the changed rows are returned. If nothing has changed, the response is an empty array and the server's work is negligible.
5. RxDB updates its local checkpoint to the newest document it received, ready for the next pull.

**Why This Saves Server Resources:** A delta pull transfers only the rows that changed since the last sync. For a system with 500 reference items where 3 were updated, the pull returns 3 rows instead of 500. The query itself is fast (indexed on `updated_at`) and the data transfer is minimal. Neon processes the request in milliseconds and can scale back to zero immediately.

### C. Last-Write-Wins (Conflict Resolution)

**The Problem It Solves:** When Device A edits a record while offline, and Device B edits the same record through a different path, a conflict exists when Device A reconnects and pushes its changes. Without a resolution strategy, you get data corruption or infinite push-reject loops — both of which waste server resources on failed operations.

**The Rule:** The server is the source of truth. The most recent change (by `updated_at` timestamp) takes priority. RxDB's default conflict handler favors the server's version, which is the safest default for most applications.

**The Workflow:**
1. Device A makes a change to a record while offline. The local `updated_at` is set to the time of the change.
2. Meanwhile, Device B (or a server process) updates the same record. Neon's `updated_at` reflects this newer change.
3. Device A reconnects and pushes its batch. SvelteKit's push endpoint compares timestamps.
4. If Device A's change is newer → SvelteKit applies the update to Neon.
5. If Neon's version is newer → SvelteKit rejects the push for that specific document and returns Neon's current version. RxDB's conflict handler on the client receives the server's version and updates the local state accordingly.

**Why This Saves Server Resources:** A clear conflict resolution strategy prevents retry storms. Without it, a rejected push might trigger another push, which gets rejected again, creating a loop of wasted requests. Last-write-wins resolves conflicts in a single round-trip: the client either succeeds or accepts the server's version. Done.

**When Last-Write-Wins Is Not Enough:** For some applications, you may need field-level merging (e.g., Device A changed the item name while Device B changed the price — both changes should be kept). RxDB supports custom conflict handlers for this. The implementation is more complex, but it still resolves in a single round-trip, maintaining server efficiency.

---

## 4. Cost-Saving Sync Strategies

The sync layer is where server costs are won or lost. Every configuration choice here directly impacts how often Neon wakes up, how long it stays awake, and how much data it transfers. **The goal is simple: maximize the time Neon spends at zero compute while ensuring data integrity.**

### Kill "Live" Sync — It Is the Most Expensive Setting You Can Enable

RxDB's replication supports a `live: true` mode that maintains a persistent connection to the server, streaming changes in real-time. **Never use this with a serverless database.** A persistent connection prevents Neon from scaling to zero. Even if no data is being transferred, the connection itself keeps the compute node alive, burning CU-hours 24/7. On Neon's pricing, a constantly-awake 0.25 CU instance costs roughly 187.5 CU-hours per month — that is your entire Free plan budget consumed by a single idle connection.

```javascript
// WRONG — keeps Neon awake permanently
replicateRxCollection({
  collection: myCollection,
  live: true,  // This prevents scale-to-zero
  // ...
});

// RIGHT — sync is triggered manually or on a schedule
replicateRxCollection({
  collection: myCollection,
  live: false,  // Neon can sleep between syncs
  // ...
});
```

### Batch Pushing: Bundle Changes, Minimize Wake-Ups

Instead of syncing after every individual write, accumulate changes locally and push them as a single batch. This is the highest-impact cost optimization available to you.

**Strategy 1: Manual Push (Recommended for Transactional Workflows)**
The user makes all their edits locally — adding items to a cart, filling out a form, completing a set of readings. The server is only contacted when they perform a deliberate action: clicking "Complete," "Submit," or "Sync Now." This gives you complete control over when Neon wakes up.

This is the most predictable model. An operational system processing 20 transactions per hour with manual sync on completion means Neon wakes up approximately 20 times per hour, processes a batch of records in each wake-up, and returns to sleep. Compare this to per-keystroke sync, which could mean hundreds of wake-ups per hour for the same 20 transactions.

**Strategy 2: Debounced Push (For Collaborative or Multi-Step Workflows)**
If manual triggering doesn't fit the UX (for example, a shared task board where users expect near-real-time updates), use a debounce timer. Collect all changes that occur within a window of inactivity (e.g., 10-30 seconds of no new writes) and push them as a single batch.

```javascript
// Pseudocode: debounced push
let pushTimer = null;
const DEBOUNCE_MS = 15000; // 15 seconds of inactivity

collection.$.subscribe(() => {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    triggerSync();  // Push all accumulated changes
  }, DEBOUNCE_MS);
});
```

The debounce window is a tuning parameter. Shorter windows mean more frequent (but smaller) server wake-ups. Longer windows mean fewer wake-ups but higher latency before other devices see the changes. For most operational apps, 10-30 seconds is the sweet spot.

**Strategy 3: Event-Driven Push (For Specific Trigger Points)**
Sync only when specific application events occur: the user navigates to a "summary" screen, the app transitions from background to foreground, or the device regains network connectivity. This is particularly effective for mobile apps where lifecycle events provide natural sync boundaries.

### Pull Strategies: Only Ask the Server When You Have a Reason

Pulls should be equally disciplined. The client should never poll the server on a fixed interval just to check if anything changed. Instead, pulls should be triggered by specific events.

**On App Open / Resume:** When the user opens the app or returns to it after backgrounding, trigger a checkpoint pull. This catches up with any changes that occurred while the app was closed.

**After a Successful Push:** Immediately after pushing local changes, pull any new data. This ensures the device has the most current state after a sync cycle.

**On Explicit User Action:** A "Refresh" button or pull-to-refresh gesture triggers a pull. This puts the user in control and avoids unnecessary background network activity.

**On Server Notification (see below):** When the server notifies the client that new data is available, the client performs a pull.

### Application-Level Broadcasting: The "Tap on the Shoulder"

When Device A pushes changes to the server, Device B needs to know that new data is available. The naive approach — having Device B poll the server every few seconds — defeats the purpose of the entire architecture.

**Do not use Postgres `LISTEN/NOTIFY`.** This feature requires an open database connection, which prevents Neon from scaling to zero. It is incompatible with serverless.

**Use Server-Sent Events (SSE) from SvelteKit instead.** The workflow:

1. Device A pushes a batch of changes to SvelteKit.
2. SvelteKit writes the changes to Neon, then immediately closes the database connection.
3. SvelteKit broadcasts a lightweight notification via SSE to all connected clients: `{ event: "sync", collection: "orders", timestamp: "..." }`
4. Device B receives the SSE message and triggers a checkpoint pull.
5. Neon wakes up briefly to serve Device B's delta pull, then goes back to sleep.

**The critical distinction:** The SSE connection is between the client and SvelteKit (your edge/serverless function layer), not between the client and Neon. SvelteKit can handle SSE connections without keeping a database connection open. Neon only wakes up for the actual data operations.

For environments where SSE is impractical (e.g., mobile apps that are frequently backgrounded), use silent push notifications to achieve the same "tap on the shoulder" effect.

### The Sync Lifecycle: Putting It All Together

Here is the complete lifecycle for a cost-optimized sync:

```
[User opens app]
  → RxDB loads from local storage (instant, zero server cost)
  → Trigger checkpoint pull (one small server query)
  → Neon wakes, serves delta, goes back to sleep

[User works in the app]
  → All reads come from RxDB (zero server cost)
  → All writes go to RxDB (zero server cost)
  → UI is instant, no spinners

[User clicks "Save" / "Complete" / debounce timer fires]
  → RxDB pushes batch to SvelteKit (one server request)
  → SvelteKit writes to Neon (one transaction)
  → SvelteKit notifies other clients via SSE
  → Neon goes back to sleep

[Other device receives SSE notification]
  → Triggers checkpoint pull (one small server query)
  → Neon wakes, serves delta, goes back to sleep

[User closes app]
  → Nothing happens. Server is asleep. Cost is zero.
```

In this model, Neon is awake for perhaps 30 seconds out of every hour. Compare that to a traditional app where Neon is awake for the entire duration of every user session.

---

## 5. Schema Design for Sync Efficiency

Your RxDB schema and the corresponding Neon table structure must be designed to support the three fundamental patterns (tombstones, checkpoints, last-write-wins) while keeping sync payloads as small as possible.

### Required Columns for Every Replicated Table

Every table that participates in RxDB sync must include:

| Column | Type | Purpose |
|---|---|---|
| `id` | `text` / `uuid` (primary key) | Unique identifier. Must be deterministically sortable. |
| `updated_at` | `timestamptz` | Checkpoint anchor. Updated on every change. Must be indexed. |
| `_deleted` | `boolean` (default `false`) | Tombstone flag. Enables soft deletes. |

These three columns are non-negotiable. Without them, the sync patterns break down and you end up with either data loss or excessive server calls trying to recover from inconsistencies.

### Keep Sync Payloads Small

RxDB syncs entire documents (not individual fields). If your collection includes a `notes` field that stores 5KB of free-text comments, that 5KB travels in every sync even if only the `status` field changed. Design your schemas with sync payload size in mind:

- **Separate large, rarely-synced data** into its own collection. Keep the frequently-synced operational data lean.
- **Avoid storing binary data** (images, files) in RxDB documents. Store a URL reference and fetch the binary separately.
- **Use key compression** (an RxDB plugin) to reduce the size of JSON keys in storage and transfer.

### Scope Your Collections to What the Client Needs

Do not replicate your entire Neon database to every client. A client device needs only the data relevant to its operational scope. Design your collections and pull queries to filter by organizational unit, user role, or time window:

```sql
-- Pull only today's records for this operational unit
SELECT * FROM transactions
WHERE unit_id = $unit
  AND updated_at > $checkpoint
  AND created_at >= CURRENT_DATE
ORDER BY updated_at, id
LIMIT $batch_size;
```

The smaller the dataset replicated to each client, the faster the initial sync, the less storage consumed on the device, and the smaller each delta pull — all of which reduce server load and cost.

---

## 6. Handling the Initial Sync (The Bootstrap Problem)

The first time a device connects, RxDB's local database is empty. The initial sync must pull the full working dataset from Neon. This is the most expensive single operation in the lifecycle of a local-first app, and it must be managed carefully.

### Strategies to Minimize Bootstrap Cost

**Paginated Bootstrap:** Don't pull everything in one request. Use the checkpoint pattern with an initial checkpoint of `null` (meaning "start from the beginning") and iterate through pages of `$batch_size` documents. This keeps individual requests small and allows the server to handle the load incrementally.

**Stale-While-Revalidate:** Serve the app immediately from a hardcoded or bundled seed dataset (e.g., the reference data as of the last app deployment) and sync the deltas in the background. The user sees the UI instantly, and the data updates within seconds.

**Selective Initial Sync:** Not all collections need to be fully synced at startup. Sync the critical collections first (reference catalog for an operational interface, task list for a field app) and defer less-critical collections until the user navigates to a feature that needs them.

**Pre-built Snapshots:** For large datasets that change infrequently (like a reference catalog), generate a JSON snapshot during your build/deploy process. Bundle it with the app. On first launch, RxDB imports the snapshot directly, and the initial sync only needs to pull changes since the snapshot was generated.

---

## 7. Client-Side Storage Limits and Cleanup

RxDB stores data in the browser's IndexedDB (or OPFS, SQLite, etc. depending on configuration). Browser storage is not infinite, and you cannot predict exactly how much is available on any given user's device.

### Practical Limits

Modern browsers typically allow at least a few hundred MB in IndexedDB, with some allowing up to 10% of total disk space. Safari is the most restrictive — it may delete data for sites not visited in the last 7 days. These are not theoretical concerns; they affect real users.

### Mitigation Strategies

- **Request persistent storage** via the Storage API (`navigator.storage.persist()`) to reduce the risk of the browser evicting your data.
- **Implement collection-level data expiry.** For transaction history, keep only the last 30 days locally. Older data lives on the server and can be fetched on demand.
- **Monitor storage usage** and warn users before hitting limits. A proactive "Your local data is approaching storage limits — please sync and clear old data" message is far better than a silent data loss.
- **Tombstone cleanup:** Periodically remove locally-stored tombstoned records that are older than a defined retention window. They have served their sync purpose and no longer need to consume local storage.

---

## 8. Security Considerations

Storing data on the client device means that data is accessible to anyone with physical or programmatic access to the device.

- **Never replicate sensitive data to the client** unless the feature absolutely requires it. Social security numbers, passwords, full payment card details, and medical records should remain server-side.
- **Use RxDB's encryption plugin** for data at rest. Encrypted fields are stored as ciphertext in IndexedDB and only decrypted in memory when accessed by your application code.
- **Authenticate sync requests.** Every push and pull request to your SvelteKit API must include a valid authentication token. The server must verify the token and enforce authorization (e.g., a client device can only pull data for its assigned scope).
- **Treat the client as untrusted.** The server's push handler must validate all incoming data — check field types, enforce business rules, verify that the authenticated user has permission to modify the records they are pushing.

---

## 9. Summary: The Server-Savings Checklist

Before shipping any RxDB implementation, verify that your architecture satisfies these principles:

- [ ] **Authority topology is explicitly defined per collection.** Every collection has a declared master (server, client, or hybrid). No ambiguity.
- [ ] **Every read that can be served locally IS served locally.** The server is never queried for data that already exists on the device and hasn't changed.
- [ ] **Writes are batched, not streamed.** The server receives one request with N changes, not N individual requests.
- [ ] **`live: true` is never used.** No persistent connections to the database.
- [ ] **Every replicated table has `id`, `updated_at`, and `_deleted`.** The three fundamental patterns are supported.
- [ ] **Pulls are delta-only.** The checkpoint pattern ensures only changed rows are transferred.
- [ ] **Cross-device notifications use SSE, not database polling.** The database connection is closed immediately after data operations.
- [ ] **The initial sync is optimized.** Paginated, selective, or snapshot-based bootstrap minimizes the first-time cost.
- [ ] **Client storage is managed.** Expiry policies and cleanup prevent unbounded growth.
- [ ] **The server validates everything.** The client is untrusted; the server enforces data integrity and authorization.
- [ ] **Conflict resolution strategy is deterministic and documented.** Every client-authoritative collection has an explicitly declared conflict handler.

If every checkbox is ticked, your serverless database will spend the vast majority of its time at zero compute — which is exactly where you want it.

---

*This document is a living reference for the ArjoTech stack. Every pattern described here is calibrated for a SvelteKit + Neon + RxDB architecture where the primary optimization target is minimizing server resource consumption.*
