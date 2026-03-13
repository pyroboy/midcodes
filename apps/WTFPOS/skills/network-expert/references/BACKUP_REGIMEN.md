# WTFPOS — Backup Regimen & Disaster Recovery

> **Last updated:** 2026-03-13
> **Phase:** 1 (Local-First) — manual export only
> **Target Phase:** 2 (automated local + cloud backups)

---

## Why Backups Are a Network-Layer Concern

In a star-topology POS where the main tablet is the single source of truth, **losing that tablet = losing the business's data**. Client devices cache data in IndexedDB, but they're thin clients — they pull from the server and push to the server. If the server's in-memory store is empty (restart) or its IndexedDB is corrupt, the generation-based re-push mechanism can recover from clients. But if ALL devices lose data simultaneously (fire, theft, factory reset), there is no recovery without backups.

**Backups complete the network resilience story:**
- Layer 0 (LOCAL): RxDB IndexedDB = live data
- Layer 1 (LAN SYNC): Replication = device-to-device copy
- **Layer 1.5 (LOCAL BACKUP)**: Scheduled filesystem snapshots = time-travel
- **Layer 3.5 (CLOUD BACKUP)**: Off-site encrypted archives = disaster recovery

---

## Current State (Phase 1)

| What Exists | Where | Automated? | Restorable? |
|-------------|-------|-----------|-------------|
| Manual JSON export | Device Monitor page → "Export Backup" button | No — user must click | No import UI exists |
| In-memory replication store | Server RAM | N/A — volatile, rebuilt from clients on restart | N/A |
| Device heartbeat + re-identification | `device.svelte.ts` — cookie + localStorage + userAgent fingerprint | Yes (30s interval) | Yes (re-identifies after data clear) |
| Generation-based recovery | `replication.ts` — bumps generation on empty server | Yes (automatic) | Partial (clients re-push, but if all clients are fresh, seed data only) |

### What's Missing

1. **No server-side backup** — the Node.js server can write to filesystem, but doesn't
2. **No import/restore** — `exportJSON()` works but there's no `importJSON()` UI or API
3. **No compression** — full JSON exports are uncompressed (10-50MB for a busy restaurant)
4. **No encryption** — backup files are plaintext (contain order data, names, amounts)
5. **No scheduling** — backup only happens when someone remembers to click the button
6. **No rotation** — no GFS or retention policy
7. **No off-site copy** — all data stays on local devices
8. **No verification** — no checksum, no automated restore test

---

## Backup Architecture (Target)

```
WTFPOS Backup Architecture
═══════════════════════════

Main Tablet (Server — Source of Truth)
├── RxDB (IndexedDB) ─── live operational data
├── /backups/live/ ────── RxDB Backup Plugin (continuous filesystem mirror)
├── /backups/daily/ ───── Scheduled JSON dumps (every 4 hours)
├── /backups/weekly/ ──── GFS rotation (promoted from daily)
├── /backups/monthly/ ─── GFS rotation (promoted from weekly)
├── USB Drive A ────────── Plugged in, receives /backups/ copy nightly
└── node-cron ─────────── Scheduler for all automated jobs

Cloud (Backblaze B2 or Cloudflare R2)
├── wtfpos-backups/{locationId}/daily/
├── wtfpos-backups/{locationId}/weekly/
├── wtfpos-backups/{locationId}/monthly/
└── wtfpos-backups/{locationId}/yearly/    ← BIR 10-year retention

USB Drive B (Air-gapped — Manager takes home)
└── Nightly copy of latest daily backup
```

### 3-2-1-1-0 Rule Applied to WTFPOS

| Copy | Location | Media | Purpose |
|------|----------|-------|---------|
| **1. Primary** | Main tablet IndexedDB | Flash/SSD | Live working database |
| **2. Local backup** | USB Drive A (plugged in) | USB flash | Fast local recovery |
| **3. Off-site backup** | Cloud (B2/R2) | Object storage | Disaster recovery |
| **+1 Air-gapped** | USB Drive B (manager's bag) | USB flash (disconnected) | Theft/ransomware protection |
| **0 errors** | Automated checksum + restore test | — | Verification |

---

## Backup Tiers (Implementation Phases)

### Tier 0: Manual Export (Current — Phase 1)
- User clicks "Export Backup" on Device Monitor page
- Downloads uncompressed JSON to browser's Downloads folder
- **RPO:** Infinite (depends on human memory)
- **RTO:** Unknown (no import path)

### Tier 1: Automated Local Snapshots (Phase 1.5)
- Server-side `node-cron` runs `exportJSON()` every 4 hours
- Compresses with gzip (80-90% size reduction)
- Writes to `/backups/daily/` with GFS rotation
- SHA-256 checksum per backup file
- Backup health banner in admin UI if last backup >24h old
- **RPO:** 4 hours
- **RTO:** 10 minutes (restore from filesystem)

### Tier 2: Cloud Sync (Phase 2)
- Nightly upload of latest daily backup to Backblaze B2 or Cloudflare R2
- Compressed + encrypted (AES-256-GCM) before upload
- Incremental uploads (only changed collections since last upload)
- Resumable uploads (handles Philippine internet drops)
- Upload scheduled at 2-4 AM (off-peak, restaurant closed)
- **RPO:** 4 hours (local) / 24 hours (cloud)
- **RTO:** 10 minutes (local) / 30-60 minutes (cloud restore)

### Tier 3: Continuous PITR (Phase 3+)
- Application-level operation log (extends `audit_logs`)
- Base snapshot every 4 hours + continuous delta log
- Can recover to any point in time within the retention window
- **RPO:** ~1 minute
- **RTO:** 15 minutes

---

## RxDB Backup Mechanisms

### 1. JSON Dump (Export/Import)

The portable, restorable backup format. This is what WTFPOS currently uses for manual export.

```typescript
// Export entire database
const dump = await db.exportJSON();
const json = JSON.stringify(dump);

// Import into a fresh database (restore)
await freshDb.importJSON(dump);
// Note: importJSON fires insert events — triggers reactivity
```

**Pros:** Portable, human-readable, can restore into any RxDB instance
**Cons:** Full export only (no incremental), large for big databases

### 2. RxDB Backup Plugin (Filesystem Mirror)

Writes database state + live changes to the filesystem as plain JSON files. **Node.js only** (not available in browser).

```typescript
import { RxDBBackupPlugin } from 'rxdb/plugins/backup';
addRxPlugin(RxDBBackupPlugin);

// Continuous live backup
const backup = myDatabase.backup({
  live: true,
  directory: '/backups/live/',
  attachments: true
});
await backup.awaitInitialBackup();

// Monitor writes
backup.writeEvents$.subscribe(event => {
  console.log(`Backed up: ${event.collectionName}/${event.documentId}`);
});
```

**Pros:** Continuous, low-latency, survives process crashes
**Cons:** One-way (no built-in import), requires Node.js filesystem access
**WTFPOS fit:** The main tablet runs `adapter-node`, so this works. Client tablets cannot use this.

### 3. Incremental Export (Custom)

Query only documents changed since the last backup using `updatedAt`:

```typescript
async function incrementalExport(
  db: RxDatabase,
  since: string // ISO timestamp of last backup
): Promise<Record<string, any[]>> {
  const delta: Record<string, any[]> = {};
  for (const [name, col] of Object.entries(db.collections)) {
    const changed = await col.find({
      selector: { updatedAt: { $gt: since } }
    }).exec();
    if (changed.length > 0) {
      delta[name] = changed.map(doc => doc.toJSON());
    }
  }
  return delta;
}
```

**Pros:** Much smaller than full export, faster uploads
**Cons:** Cannot restore alone — needs a base snapshot + all incremental deltas

---

## Compression & Encryption

### Compression

POS JSON data compresses extremely well (80-90% reduction). A 50MB daily export compresses to ~5-8MB.

```typescript
import { gzipSync, gunzipSync } from 'zlib';

// Compress
const json = JSON.stringify(await db.exportJSON());
const compressed = gzipSync(json, { level: 9 });
// Write: /backups/daily/wtfpos-tag-2026-03-13T22-00.json.gz

// Decompress (for restore)
const decompressed = gunzipSync(compressed);
const dump = JSON.parse(decompressed.toString());
```

### Encryption (AES-256-GCM)

All backup files should be encrypted before writing to disk or uploading to cloud. GCM provides both encryption and authentication (tamper detection).

```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function encryptBackup(data: Buffer, passphrase: string): Buffer {
  const salt = randomBytes(16);
  const key = scryptSync(passphrase, salt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: [salt:16][iv:12][tag:16][ciphertext:N]
  return Buffer.concat([salt, iv, tag, encrypted]);
}

function decryptBackup(packed: Buffer, passphrase: string): Buffer {
  const salt = packed.subarray(0, 16);
  const iv = packed.subarray(16, 28);
  const tag = packed.subarray(28, 44);
  const encrypted = packed.subarray(44);
  const key = scryptSync(passphrase, salt, 32);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
```

**Key management:** The encryption passphrase lives in `.env` on the main tablet (`BACKUP_ENCRYPTION_KEY`). It is **never** committed to git. The owner keeps a paper copy in a safe.

---

## GFS Rotation Policy (Grandfather-Father-Son)

| Level | Frequency | Retention | WTFPOS Mapping |
|-------|-----------|-----------|----------------|
| **Son** (daily) | Every 4 hours | Keep 14 days (84 snapshots max, pruned to 1/day after 3 days) | After each shift or X-Reading |
| **Father** (weekly) | Sunday night | Keep 6 weeks | Promoted from daily |
| **Grandfather** (monthly) | 1st of month | Keep 24 months | Promoted from weekly |
| **Great-grandfather** (yearly) | Jan 1 | Keep 10 years | BIR compliance archive |

### Directory Structure

```
/backups/
├── live/                          ← RxDB Backup Plugin (continuous mirror)
│   ├── tables/
│   │   ├── tbl-xxx.json
│   │   └── ...
│   ├── orders/
│   └── ...
├── daily/                         ← Scheduled JSON dumps
│   ├── wtfpos-tag-2026-03-13T22-00.json.gz
│   ├── wtfpos-tag-2026-03-13T22-00.json.gz.sha256
│   ├── wtfpos-tag-2026-03-13T18-00.json.gz
│   └── ... (14 days retained)
├── weekly/                        ← Promoted from daily (Sundays)
│   └── wtfpos-tag-2026-W11.json.gz
├── monthly/                       ← Promoted from weekly (1st of month)
│   └── wtfpos-tag-2026-03.json.gz
├── yearly/                        ← BIR 10-year archive
│   └── wtfpos-tag-2025.json.gz
└── manifest.json                  ← Checksum log + verification status
```

### Rotation Logic (Pseudocode)

```
On every scheduled backup:
  1. Export → compress → checksum → write to /daily/
  2. Prune /daily/ files older than 14 days

On Sunday night:
  3. Copy latest /daily/ to /weekly/
  4. Prune /weekly/ files older than 6 weeks

On 1st of month:
  5. Copy latest /weekly/ to /monthly/
  6. Prune /monthly/ files older than 24 months

On Jan 1:
  7. Copy latest /monthly/ to /yearly/
  8. Never auto-delete /yearly/ (BIR 10-year rule)
```

---

## Backup Verification

### After Every Backup

1. **Parse test:** Decompress + JSON.parse the backup file
2. **Count check:** Compare document counts per collection against the live database
3. **Checksum:** SHA-256 hash stored alongside backup file

```typescript
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

function verifyBackup(backupPath: string, expectedCounts: Record<string, number>): boolean {
  // 1. Checksum
  const data = readFileSync(backupPath);
  const checksum = createHash('sha256').update(data).digest('hex');

  // 2. Parse test
  const decompressed = gunzipSync(data);
  const dump = JSON.parse(decompressed.toString());

  // 3. Count check
  for (const [collection, expectedCount] of Object.entries(expectedCounts)) {
    const actualCount = dump.collections?.[collection]?.length ?? 0;
    const tolerance = Math.max(5, Math.ceil(expectedCount * 0.02));
    if (Math.abs(actualCount - expectedCount) > tolerance) {
      console.error(`[BACKUP VERIFY] ${collection}: expected ~${expectedCount}, got ${actualCount}`);
      return false;
    }
  }

  return true;
}
```

### Weekly Restore Test

Automated weekly test that creates a temporary RxDB instance, imports the latest backup, and verifies data integrity:

1. Create an in-memory RxDB instance with the same schemas
2. Call `importJSON()` with the latest backup
3. Verify document counts match
4. Verify critical data (e.g., open orders have valid totals, stock levels are non-negative)
5. Destroy temporary instance
6. Log result to manifest

### Backup Health Monitoring

Show a warning in the admin UI (similar to `DbHealthBanner`) if:
- Last successful backup is older than **24 hours**
- Last backup verification **failed**
- Disk space on backup volume is below **500MB**
- Cloud upload hasn't succeeded in **48 hours** (Phase 2)

---

## Disaster Recovery Scenarios

### Scenario 1: Main Tablet Dies Mid-Shift

**Impact:** Server offline, all client devices lose sync
**RPO:** 4 hours (last scheduled backup) or 0 if live backup plugin was running
**RTO target:** 10 minutes

**Recovery procedure:**
1. Manager grabs **standby tablet** (pre-configured, charged, stored behind counter)
2. Plug in USB Drive A (contains latest /backups/)
3. Start SvelteKit Node.js build on standby tablet
4. Import latest backup via admin restore endpoint
5. Client devices re-connect automatically (same SSID, same port)
6. Verify open orders and table states
7. Resume operations

**Prerequisite:** A standby tablet must be pre-configured with the same SvelteKit build and WiFi SSID. This is a **hardware investment** (~₱15,000 for a budget Android tablet).

### Scenario 2: All On-Site Devices Lost (Fire/Theft)

**Impact:** Total data loss at branch
**RPO:** 24 hours (last cloud upload)
**RTO target:** 2-4 hours (acquire new tablet + cloud restore)

**Recovery procedure:**
1. Acquire a replacement tablet (any device that runs Chrome/Safari)
2. If USB Drive B (air-gapped) is available: restore from USB (faster)
3. If not: download latest cloud backup from Backblaze B2
4. Decrypt → decompress → import into fresh RxDB
5. Reconfigure WiFi, location settings
6. Resume operations with data up to last backup

### Scenario 3: Server Restart (Power Outage)

**Impact:** In-memory replication store lost, but RxDB IndexedDB intact
**RPO:** 0 (no data loss — IndexedDB persists)
**RTO:** ~30 seconds (automatic)

**Recovery procedure (already automated):**
1. SvelteKit restarts, in-memory store is empty
2. First client to connect detects empty server via `/api/replication/status`
3. Client bumps sync generation → forces full re-push of all local data
4. Other clients follow suit
5. Server store rebuilt from client data

**No backup needed** — this is handled by the existing generation-based recovery in `replication.ts`.

### Scenario 4: Database Corruption (RxDB Error)

**Impact:** Main tablet's IndexedDB unreadable
**RPO:** 4 hours (last scheduled backup)
**RTO:** 5 minutes

**Recovery procedure:**
1. `DbHealthBanner` detects corruption and shows emergency reset button
2. User clicks "Reset Database" (calls `resetDatabase()` in `db/index.ts`)
3. IndexedDB is deleted, page reloads
4. Fresh RxDB initialized with seed data
5. Import latest backup from `/backups/daily/` or USB

### Scenario 5: Ransomware / Malicious Data Wipe

**Impact:** All on-site data encrypted or deleted by attacker
**RPO:** Depends on air-gapped backup age
**RTO:** 2-4 hours

**Recovery procedure:**
1. **Do not connect** compromised devices to WiFi
2. Factory reset all compromised tablets
3. Set up fresh SvelteKit build on clean tablet
4. Restore from USB Drive B (air-gapped, physically isolated from attack)
5. If USB Drive B is also compromised: restore from cloud (Backblaze B2 with Object Lock)
6. Change all credentials, WiFi passwords, backup encryption keys

---

## RTO / RPO Summary

| Scenario | RPO | RTO | Backup Source |
|----------|-----|-----|---------------|
| Server restart | 0 | 30s | Automatic (generation re-push) |
| DB corruption | 4h | 5min | Local filesystem backup |
| Tablet dies mid-shift | 4h | 10min | USB Drive A + standby tablet |
| Fire/theft (all devices) | 24h | 2-4h | Cloud backup or USB Drive B |
| Ransomware | Varies | 2-4h | Air-gapped USB Drive B |

---

## Cloud Backup Strategy (Phase 2)

### Provider Recommendation: Backblaze B2

| Factor | Backblaze B2 | AWS S3 | Cloudflare R2 |
|--------|-------------|--------|---------------|
| Cost/GB/month | $0.006 | $0.023 | $0.015 |
| Egress cost | $0.01/GB | $0.09/GB | $0.00 |
| S3-compatible | Yes | Native | Yes |
| Object Lock (immutable) | Yes | Yes | No |
| Best for WTFPOS | **Yes** — cheapest, Object Lock for BIR compliance | Overkill | Good if using Cloudflare already |

**Estimated monthly cost:** A busy restaurant branch generates ~5-10MB/day compressed backup data. At $0.006/GB/month with 2 years of daily backups retained: **<₱5/month** (~$0.10).

### Upload Strategy for Philippine Internet

Philippine internet in Bohol is often 20-50 Mbps down, 5-15 Mbps up, with intermittent drops. The backup upload strategy must handle this:

1. **Schedule uploads at 2-4 AM** — restaurant closed, minimal contention
2. **Compress before upload** — 5-8MB instead of 50MB
3. **Encrypt before upload** — AES-256-GCM (data at rest protection)
4. **Resumable uploads** — use S3 multipart upload API (survives disconnections)
5. **Retry with backoff** — 3 attempts with exponential backoff (5s, 15s, 45s)
6. **Skip if offline** — queue for next available window, don't block POS operations

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const b2 = new S3Client({
  endpoint: process.env.B2_ENDPOINT, // e.g., https://s3.us-west-004.backblazeb2.com
  region: process.env.B2_REGION,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APP_KEY!,
  },
});

async function uploadBackup(filePath: string, locationId: string) {
  const date = new Date().toISOString().split('T')[0];
  const key = `${locationId}/daily/${date}.json.gz.enc`;
  const body = readFileSync(filePath);

  await b2.send(new PutObjectCommand({
    Bucket: 'wtfpos-backups',
    Key: key,
    Body: body,
    ContentType: 'application/octet-stream',
    // Object Lock: retain for 30 days (cannot be deleted even by admin)
    ObjectLockMode: 'GOVERNANCE',
    ObjectLockRetainUntilDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }));
}
```

---

## Philippine BIR Data Retention Requirements

WTFPOS stores financial records (orders, payments, X/Z-readings, expenses) that fall under BIR record-keeping rules.

| Record Type | Retention | Legal Basis | WTFPOS Collection |
|-------------|-----------|-------------|-------------------|
| Books of accounts | **10 years** | NIRC Section 235, RR 17-2013 | `orders`, `expenses` |
| Tax returns (VAT) | **3 years** (10 if fraud) | NIRC Section 235 | `z_reads` (Z-Reading = daily close) |
| Receipts & invoices | **5 years** | BIR guidelines | `orders` (receipt data) |
| Financial statements | **10 years** (SEC), **5 years** (non-SEC) | SEC MC 28-2019 | Derived from `orders` + `expenses` |

### Data Lifecycle Policy

| Collection | Active in RxDB | Archive (cloud) | Deep Archive | Delete |
|------------|---------------|-----------------|-------------|--------|
| Open orders | Until closed | — | — | — |
| Closed orders | 90 days | Years 1-10 | — | After 10 years |
| Z-Readings | 1 year | Years 1-10 | — | After 10 years |
| X-Readings | 30 days | Years 1-5 | — | After 5 years |
| Expenses | 1 year | Years 1-10 | — | After 10 years |
| Stock movements | 90 days | Years 1-5 | — | After 5 years |
| Audit logs | 1 year | Years 1-10 | — | After 10 years |
| KDS tickets | 7 days | 90 days | — | After 90 days |
| Devices | Active only | — | — | Prune offline >30 days |

**Why archival matters for performance:** IndexedDB slows as document count grows into hundreds of thousands. Monthly archival of closed orders keeps the live database responsive.

---

## Automated Scheduling (Node.js Server)

### node-cron Schedule

```typescript
import cron from 'node-cron';

// Every 4 hours — scheduled snapshot
cron.schedule('0 */4 * * *', () => performBackup('scheduled'));

// 11 PM — end-of-day backup + rotation + cloud upload
cron.schedule('0 23 * * *', async () => {
  await performBackup('eod');
  await rotateBackups();
  await uploadToCloud();
});

// Weekly — restore verification test (Sunday 3 AM)
cron.schedule('0 3 * * 0', () => verifyLatestBackup());

// On startup — catch-up backup if last backup is stale
checkAndCatchUp();
```

### Startup Catch-Up

If the server was down and missed scheduled backups, check on startup:

```typescript
async function checkAndCatchUp() {
  const manifest = readManifest();
  const lastBackup = manifest.lastSuccessfulBackup;
  const hoursSinceLastBackup = (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastBackup > 6) {
    console.log(`[BACKUP] Last backup was ${Math.round(hoursSinceLastBackup)}h ago — running catch-up`);
    await performBackup('catch-up');
  }
}
```

---

## Backup Manifest

A `manifest.json` file tracks every backup's metadata:

```json
{
  "locationId": "tag",
  "lastSuccessfulBackup": "2026-03-13T22:00:00Z",
  "lastCloudUpload": "2026-03-13T02:15:00Z",
  "lastVerification": "2026-03-09T03:00:00Z",
  "lastVerificationResult": "pass",
  "backups": [
    {
      "filename": "wtfpos-tag-2026-03-13T22-00.json.gz",
      "timestamp": "2026-03-13T22:00:00Z",
      "trigger": "scheduled",
      "sizeBytes": 5242880,
      "sha256": "a1b2c3d4...",
      "docCounts": {
        "orders": 1245,
        "tables": 12,
        "menu_items": 48,
        "stock_items": 95,
        "expenses": 312
      },
      "verified": true,
      "uploadedToCloud": true
    }
  ]
}
```

---

## Security Checklist

- [ ] Backup encryption key stored in `.env`, never in git
- [ ] All backup files encrypted with AES-256-GCM before writing to disk
- [ ] Cloud uploads use HTTPS (TLS in transit)
- [ ] Backup encryption key is separate from cloud API keys
- [ ] USB drives use device-level encryption where available
- [ ] Backup manifest signed with HMAC to detect tampering
- [ ] Cloud bucket has Object Lock enabled (immutable backups for 30 days minimum)
- [ ] Backup credentials rotated quarterly
- [ ] No backup files contain plaintext PIN codes (manager PIN `1234` is not persisted, but verify)
- [ ] Owner keeps paper copy of encryption passphrase in a safe
- [ ] Restore procedure tested at least once per month

---

## Decision Rules for Backup Questions

| Question | Answer |
|----------|--------|
| How often should we backup? | Every 4 hours + end-of-day. More frequent for high-volume shifts. |
| Should backups block the POS? | **Never.** Backups run on the server in background. Client-side export is async. |
| Can clients trigger a backup? | No. Only the server runs scheduled backups. The manual export button is a convenience, not a backup strategy. |
| What if the USB drive fails? | Cloud backup is the fallback. Always maintain at least 2 backup destinations. |
| Should we backup seed data? | No. Seed data is in `db/seed.ts` in the codebase. Only backup operational data. |
| How do we backup multiple branches? | Each branch backs up independently. Cloud backups are namespaced by `locationId`. |
| When do we archive old orders? | Monthly. Move closed orders older than 90 days from RxDB to compressed archives. |
| What's the minimum viable backup? | Tier 1: automated 4-hour local snapshots with GFS rotation. Cost: ₱0 (just code). |
| What's the ideal backup? | Tier 2: local + cloud + air-gapped USB. Cost: <₱100/month (cloud) + ₱500 (2 USB drives). |

---

## Implementation Priority

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| **P0** | Add `importJSON()` restore endpoint + UI | 1-2 days | Enables ANY recovery |
| **P0** | Server-side scheduled backup with node-cron | 1 day | Automated RPO = 4 hours |
| **P1** | Compression (gzip) for backup files | 2 hours | 80-90% size reduction |
| **P1** | GFS rotation logic | 4 hours | Prevents disk filling up |
| **P1** | Backup health banner in admin UI | 4 hours | Alerts when backup is stale |
| **P2** | Encryption (AES-256-GCM) | 4 hours | Data protection at rest |
| **P2** | Cloud upload to Backblaze B2 | 1 day | Off-site disaster recovery |
| **P2** | Backup verification (weekly restore test) | 4 hours | Confidence that backups work |
| **P3** | USB drive auto-detect + copy | 4 hours | Physical air-gap backup |
| **P3** | PITR operation log | 2-3 days | Minute-level recovery granularity |
| **P3** | Monthly archival job (move old orders out of RxDB) | 1 day | Keep live DB performant |

---

## Key Files (Existing + Planned)

| File | Status | Purpose |
|------|--------|---------|
| `src/routes/admin/devices/+page.svelte` | Exists | Manual "Export Backup" button (client-side) |
| `src/lib/db/index.ts` | Exists | `resetDatabase()` — destructive reset (not backup) |
| `src/lib/db/replication.ts` | Exists | Generation-based recovery (rebuild from clients) |
| `src/lib/server/backup.ts` | **Planned** | Server-side backup engine: schedule, compress, encrypt, rotate |
| `src/routes/api/backup/export/+server.ts` | **Planned** | API endpoint: trigger server-side backup |
| `src/routes/api/backup/restore/+server.ts` | **Planned** | API endpoint: import a backup file |
| `src/routes/api/backup/status/+server.ts` | **Planned** | API endpoint: manifest + health check |
| `src/lib/components/BackupHealthBanner.svelte` | **Planned** | Admin UI warning when backup is stale |
