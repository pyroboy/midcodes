# WTFPOS — Full Hardware List

**Last updated:** 2026-03-11
**Prepared by:** Arturo Jose T. Magno
**Client:** WTF! Corporation (Christopher Samonte, CEO)

> All prices are estimates based on Philippine market (Lazada/Shopee/local resellers).
> Prices may vary. Get at least 2 quotations before purchasing.

---

## Alta Citta — Tagbilaran (tag)

| # | Device | Model / Spec | Qty | Unit Price | Total | Notes |
|---|---|---|---|---|---|---|
| 1 | Mini PC | Beelink EQ12, Intel N100, 8GB RAM, 256GB SSD | 1 | ₱6,500 | ₱6,500 | Runs SvelteKit Node server, always on |
| 2 | UPS | APC Back-UPS BX650LI-MS, 650VA | 1 | ₱2,500 | ₱2,500 | Keeps mini PC alive during brownouts |
| 3 | LAN Cable | Cat6, 3m | 1 | ₱200 | ₱200 | Mini PC → router, wired |
| 4 | WiFi Router | TP-Link Archer AX23, WiFi 6, dual-band | 1 | ₱2,500 | ₱2,500 | POS-dedicated, not shared with customers |
| 5 | Cashier Tablet | Samsung Tab A9 / Lenovo Tab M10, Android, 10" | 1 | ₱5,500 | ₱5,500 | POS interface, touchscreen |
| 6 | Tablet Stand | Adjustable counter mount, heavy duty | 1 | ₱600 | ₱600 | Cashier counter facing staff |
| 7 | Receipt Printer | Epson TM-T82III, USB, 80mm thermal | 1 | ₱4,500 | ₱4,500 | USB → mini PC, cash drawer RJ11 port |
| 8 | Cash Drawer | Standard RJ11 cash drawer, 5-bill 8-coin | 1 | ₱2,000 | ₱2,000 | RJ11 → receipt printer |
| 9 | Dispatcher Tablet | Android 10", wall mountable | 1 | ₱5,000 | ₱5,000 | `/kitchen/dispatch` |
| 10 | Meat Station Tablet | Android 10" **with Bluetooth**, wall mountable | 1 | ₱5,500 | ₱5,500 | `/kitchen/weigh-station`, pairs with BT scale |
| 11 | Stove Tablet | Android 10", wall mountable | 1 | ₱5,000 | ₱5,000 | `/kitchen/stove` |
| 12 | Tablet Wall Mount | Heavy duty, adjustable, heat-rated | 3 | ₱600 | ₱1,800 | Kitchen stations — keep meat mount away from direct grill heat |
| 13 | Bluetooth Scale | Meat weighing scale, BT 4.0+ | 1 | ₱2,500 | ₱2,500 | Pairs to meat station tablet only |
| | | | | **Branch Total** | **₱44,100** | |

---

## Alona Beach — Panglao (pgl)

*Identical setup to Alta Citta.*

| # | Device | Model / Spec | Qty | Unit Price | Total | Notes |
|---|---|---|---|---|---|---|
| 1 | Mini PC | Beelink EQ12, Intel N100, 8GB RAM, 256GB SSD | 1 | ₱6,500 | ₱6,500 | |
| 2 | UPS | APC Back-UPS BX650LI-MS, 650VA | 1 | ₱2,500 | ₱2,500 | |
| 3 | LAN Cable | Cat6, 3m | 1 | ₱200 | ₱200 | |
| 4 | WiFi Router | TP-Link Archer AX23, WiFi 6, dual-band | 1 | ₱2,500 | ₱2,500 | |
| 5 | Cashier Tablet | Samsung Tab A9 / Lenovo Tab M10, Android, 10" | 1 | ₱5,500 | ₱5,500 | |
| 6 | Tablet Stand | Adjustable counter mount, heavy duty | 1 | ₱600 | ₱600 | |
| 7 | Receipt Printer | Epson TM-T82III, USB, 80mm thermal | 1 | ₱4,500 | ₱4,500 | |
| 8 | Cash Drawer | Standard RJ11 cash drawer, 5-bill 8-coin | 1 | ₱2,000 | ₱2,000 | |
| 9 | Dispatcher Tablet | Android 10", wall mountable | 1 | ₱5,000 | ₱5,000 | |
| 10 | Meat Station Tablet | Android 10" **with Bluetooth**, wall mountable | 1 | ₱5,500 | ₱5,500 | |
| 11 | Stove Tablet | Android 10", wall mountable | 1 | ₱5,000 | ₱5,000 | |
| 12 | Tablet Wall Mount | Heavy duty, adjustable, heat-rated | 3 | ₱600 | ₱1,800 | |
| 13 | Bluetooth Scale | Meat weighing scale, BT 4.0+ | 1 | ₱2,500 | ₱2,500 | |
| | | | | **Branch Total** | **₱44,100** | |

---

## Tagbilaran Central Warehouse (wh-tag)

| # | Device | Model / Spec | Qty | Unit Price | Total | Notes |
|---|---|---|---|---|---|---|
| 1 | Mini PC | Beelink EQ12, Intel N100, 8GB RAM, 256GB SSD | 1 | ₱6,500 | ₱6,500 | Runs Node server, RxDB for warehouse location |
| 2 | UPS | APC Back-UPS BX650LI-MS, 650VA | 1 | ₱2,500 | ₱2,500 | |
| 3 | LAN Cable | Cat6, 3m | 1 | ₱200 | ₱200 | |
| 4 | WiFi Router | TP-Link Archer AX23, WiFi 6, dual-band | 1 | ₱2,500 | ₱2,500 | |
| 5 | Staff Tablet | Android 10" | 1 | ₱5,000 | ₱5,000 | Stock receiving, deliveries, transfers |
| 6 | Tablet Stand | Counter mount | 1 | ₱600 | ₱600 | |
| 7 | Transfer/Delivery Printer | Xprinter XP-80C, USB, 80mm thermal | 1 | ₱3,500 | ₱3,500 | Prints delivery receipts + transfer slips |
| | | | | **Warehouse Total** | **₱20,800** | |

> ⚠️ **TBD:** Transfer slip print trigger — warehouse staff on send, or branch staff on receive?
> Confirm with owner before finalizing printer placement.

---

## Summary

| Location | Devices | Subtotal |
|---|---|---|
| Alta Citta (Tag) | Mini PC, UPS, router, 5 tablets, printer, cash drawer, scale, mounts | ₱44,100 |
| Alona Beach (Pgl) | Mini PC, UPS, router, 5 tablets, printer, cash drawer, scale, mounts | ₱44,100 |
| Warehouse (wh-tag) | Mini PC, UPS, router, 1 tablet, printer | ₱20,800 |
| **Grand Total** | **15 tablets, 3 mini PCs, 3 routers, 3 printers, 2 cash drawers, 2 scales** | **₱109,000** |

---

## Notes & Open Items

### What's NOT included (client-provided or separate)
- GCash / Maya QR stands — client uses separate devices, no integration needed
- Credit card terminal — not in scope
- Customer WiFi — separate router, not shared with POS network
- Internet connection per branch — client arranges ISP (required for owner dashboard + cloud backup in Phase 2)
- Tablet cases / screen protectors — recommended especially for kitchen tablets near heat/moisture

### Codebase work required for hardware
| Hardware | Phase | Status |
|---|---|---|
| Bluetooth scale | Phase 1 | ⚠️ Partial — connection works, needs auto-reconnect |
| Receipt printer (USB ESC/POS) | Phase 3 | 🔲 Not started |
| Cash drawer trigger | Phase 3 | 🔲 Not started — triggered via printer RJ11 |
| Transfer/delivery slip printer | Phase 3 | 🔲 Not started |

### Recommended purchases
- Buy **1 extra Android tablet** as a spare per branch — if a kitchen tablet breaks mid-service, swap immediately
- Add **₱1,000 per branch** for cable management (velcro ties, cable clips, countertop routing)
- Get **thermal paper rolls in bulk** — Epson 80mm, ~₱50/roll, 20 rolls per branch to start

### Spare / Buffer recommendation

| Item | Extra Qty | Cost |
|---|---|---|
| Android tablet (spare) | 2 (1 per retail branch) | ₱10,000 |
| Thermal paper rolls | 40 rolls total | ₱2,000 |
| Cat6 LAN cables (spare) | 2 | ₱400 |
| **Buffer total** | | **₱12,400** |

---

## Grand Total with Buffer

| | |
|---|---|
| Hardware (3 locations) | ₱109,000 |
| Spare + consumables | ₱12,400 |
| **Total** | **₱121,400** |
