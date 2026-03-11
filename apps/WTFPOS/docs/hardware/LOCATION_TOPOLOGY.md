# WTFPOS — Per-Location Setup Topology

**Last updated:** 2026-03-11
**Prepared by:** Arturo Jose T. Magno
**Client:** WTF! Corporation (Christopher Samonte, CEO)

---

## Architecture Principle

Each location runs one **Mini PC as the SvelteKit Node server** — the single source of truth for that branch. All other devices (cashier tablet, kitchen screens) are **thin clients**: Android tablets running Chrome browser, pointed at the mini PC over local WiFi. No data replication, no sync — every device reads and writes to the same server.

```
Internet is NOT required for daily operations.
Internet is only needed for: owner cross-branch dashboard, cloud backup (Phase 2).
```

---

## Alta Citta — Tagbilaran (tag)

**Location:** Alta Citta Mall, Tagbilaran City, 6300 Bohol
**Type:** Retail — full POS + Kitchen + Stock
**Tables:** 20 dining tables

```
┌─────────────────────────────────────────────────────────────────┐
│  DEDICATED ROUTER (TP-Link Archer AX23)                         │
│  192.168.1.1  —  POS network only, not shared with customers    │
└────────────────────────┬────────────────────────────────────────┘
                         │ LAN (wired)
                         │
          ┌──────────────▼──────────────┐
          │  MINI PC — Main Server       │
          │  Beelink EQ12 / Intel N100  │
          │  IP: 192.168.1.10 (static)  │
          │  Port: 3000                 │
          │  RxDB source of truth        │
          │  USB → Receipt Printer      │
          │  Auto-starts on boot        │
          └──────────────┬──────────────┘
                         │ WiFi (all tablets)
          ┌──────────────┼──────────────────────────────┐
          │              │                              │
          ▼              ▼                              ▼
┌─────────────┐  ┌──────────────────────────────────────────────┐
│  CASHIER    │  │  KITCHEN                                      │
│  TABLET     │  │                                               │
│  Android    │  │  ┌────────────┐ ┌──────────┐ ┌───────────┐  │
│  10"        │  │  │ DISPATCHER │ │  MEAT    │ │   STOVE   │  │
│  /pos       │  │  │  Android   │ │ Android  │ │  Android  │  │
│             │  │  │  10"       │ │  10" +BT │ │  10"      │  │
│  ↓          │  │  │ /kitchen/  │ │ /kitchen/│ │ /kitchen/ │  │
│  USB        │  │  │ dispatch   │ │ weigh-   │ │ stove     │  │
│             │  │  │            │ │ station  │ │           │  │
│ RECEIPT     │  │  └────────────┘ └────┬─────┘ └───────────┘  │
│ PRINTER     │  │                      │ Bluetooth             │
│ Epson       │  │               ┌──────▼──────┐               │
│ TM-T82III   │  │               │  BT SCALE   │               │
│  ↓ RJ11     │  │               │  Meat weigh │               │
│             │  └──────────────────────────────────────────────┘
│ CASH DRAWER │
│             │
└─────────────┘
```

### Device Roles

| Device | Route | Role |
|---|---|---|
| Cashier tablet | `/pos` | Order taking, payments, checkout |
| Dispatcher tablet | `/kitchen/dispatch` | Expo — oversees all stations, sides queue |
| Meat station tablet | `/kitchen/weigh-station` | Meat weighing via Bluetooth scale |
| Stove tablet | `/kitchen/stove` | Dishes and drinks queue |
| Mini PC | — | Server, RxDB, print server, cash drawer trigger |

### Network

| Device | Connection | IP |
|---|---|---|
| Router | — | 192.168.1.1 |
| Mini PC | LAN cable (wired) | 192.168.1.10 (static) |
| All tablets | WiFi | 192.168.1.x (DHCP) |

### Print Flow

```
Cashier completes checkout on tablet
  → POST /api/print/receipt to mini PC
    → Mini PC Node server → ESC/POS → USB → Epson TM-T82III
      → Receipt prints
      → RJ11 pulse → Cash drawer opens
```

---

## Alona Beach — Panglao (pgl)

**Location:** Panglao Circumferential Road, Alona Beach Rd, Tawala, Panglao, 6300 Bohol
**Type:** Retail — full POS + Kitchen + Stock
**Tables:** 20 dining tables

```
┌─────────────────────────────────────────────────────────────────┐
│  DEDICATED ROUTER (TP-Link Archer AX23)                         │
│  192.168.1.1  —  POS network only, not shared with customers    │
└────────────────────────┬────────────────────────────────────────┘
                         │ LAN (wired)
                         │
          ┌──────────────▼──────────────┐
          │  MINI PC — Main Server       │
          │  Beelink EQ12 / Intel N100  │
          │  IP: 192.168.1.10 (static)  │
          │  Port: 3000                 │
          │  RxDB source of truth        │
          │  USB → Receipt Printer      │
          │  Auto-starts on boot        │
          └──────────────┬──────────────┘
                         │ WiFi (all tablets)
          ┌──────────────┼──────────────────────────────┐
          │              │                              │
          ▼              ▼                              ▼
┌─────────────┐  ┌──────────────────────────────────────────────┐
│  CASHIER    │  │  KITCHEN                                      │
│  TABLET     │  │                                               │
│  Android    │  │  ┌────────────┐ ┌──────────┐ ┌───────────┐  │
│  10"        │  │  │ DISPATCHER │ │  MEAT    │ │   STOVE   │  │
│  /pos       │  │  │  Android   │ │ Android  │ │  Android  │  │
│             │  │  │  10"       │ │  10" +BT │ │  10"      │  │
│  ↓          │  │  │ /kitchen/  │ │ /kitchen/│ │ /kitchen/ │  │
│  USB        │  │  │ dispatch   │ │ weigh-   │ │ stove     │  │
│             │  │  │            │ │ station  │ │           │  │
│ RECEIPT     │  │  └────────────┘ └────┬─────┘ └───────────┘  │
│ PRINTER     │  │                      │ Bluetooth             │
│ Epson       │  │               ┌──────▼──────┐               │
│ TM-T82III   │  │               │  BT SCALE   │               │
│  ↓ RJ11     │  │               │  Meat weigh │               │
│             │  └──────────────────────────────────────────────┘
│ CASH DRAWER │
│             │
└─────────────┘
```

*Identical setup to Alta Citta. Same device roles, same network layout, same print flow.*

---

## Tagbilaran Central Warehouse (wh-tag)

**Location:** Tagbilaran City, 6300 Bohol
**Type:** Warehouse — inventory only (no POS, no kitchen)
**Access:** Stock receiving, deliveries, transfers to branches

```
┌─────────────────────────────────────────────────────────────────┐
│  DEDICATED ROUTER (TP-Link Archer AX23)                         │
│  192.168.1.1                                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │ LAN (wired)
                         │
          ┌──────────────▼──────────────┐
          │  MINI PC — Main Server       │
          │  Beelink EQ12 / Intel N100  │
          │  IP: 192.168.1.10 (static)  │
          │  Port: 3000                 │
          │  RxDB source of truth        │
          │  USB → Transfer Printer     │
          │  Auto-starts on boot        │
          └──────────────┬──────────────┘
                         │ WiFi
                         │
          ┌──────────────▼──────────────┐
          │  WAREHOUSE STAFF TABLET     │
          │  Android 10"                │
          │  /stock/inventory           │
          │  /stock/deliveries          │
          │  /stock/transfers           │
          └─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TRANSFER / DELIVERY SLIP PRINTER                               │
│  Xprinter XP-80C, USB → Mini PC                                 │
│  Prints: delivery receipts, transfer slips                      │
│  ⚠️  Trigger point TBD — warehouse staff on send               │
│     or branch staff on receive? (confirm with owner)            │
└─────────────────────────────────────────────────────────────────┘
```

### Device Roles

| Device | Route | Role |
|---|---|---|
| Warehouse tablet | `/stock/inventory`, `/stock/deliveries`, `/stock/transfers` | Receive deliveries, initiate transfers, stock counts |
| Mini PC | — | Server, RxDB, print server for transfer slips |

### What the warehouse does NOT have
- No POS (`/pos` route hidden for `wh-tag` location)
- No kitchen screens
- No cash drawer
- No floor plan

---

## Cross-Branch Owner View (internet required)

The owner's device (any browser, any location) can see both branches via the SSE aggregate — reads live order data from both Tag and Pgl servers simultaneously.

```
Owner's browser (anywhere with internet)
  → GET /api/sse/aggregate (owner's own server)
    → fetches Tag server: http://tag-ip:3000/api/sse/kitchen-orders
    → fetches Pgl server: http://pgl-ip:3000/api/sse/kitchen-orders
    → merges both streams
    → owner sees both branches in real-time
```

This requires both branch servers to be reachable from the internet (port forwarding on branch routers, or a cloud relay — to be decided in Phase 2).

---

## Startup Checklist (per branch, daily)

```
□ Mini PC is powered on
□ Node server auto-started (check: http://192.168.1.10:3000 loads)
□ Router is on, POS WiFi network visible
□ Cashier tablet connects to POS WiFi, loads /pos
□ Kitchen tablets connect, load their routes
□ Receipt printer is on and paper loaded
□ Cash drawer is closed and locked
□ Bluetooth scale is on (meat station only)
```
