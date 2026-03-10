# Station Responsibility Matrix

Defines the digital read/write boundaries, physical labeling obligations, and inter-station
handoff protocols for the 4-station kitchen architecture.

---

## Responsibility Matrix

| Station | Digital Write | Digital Read-Only | Physical Output |
|---------|-------------|-------------------|-----------------|
| ⚖️ Weigh | Meat: weight + done | Own meat items only | **Thermal label** with Table # on each plate |
| 🍳 Stove | Dishes/drinks: DONE | Own items by Table # | Verbal callout or printed chit |
| 📋 Dispatch | Sides: DONE · Order: ALL DONE | All stations' progress | Matches labels, assembles tray, runs to table |
| 💻 Cashier | Full order CRUD + payments | Entire order queue | Generates the Table # that all stations use |

---

## Per-Station Digital Boundaries

### ⚖️ Weigh Station (Butcher)
- **Writes:** `dispatchMeatWeight(orderId, itemId, grams)` — sets weight on meat KDS items
- **Writes:** `printMeatLabel()` — auto-triggered on dispatch (non-blocking)
- **Reads:** Pending meat items from `kdsTickets` filtered to `category === 'meats'`
- **Cannot:** Mark dishes, sides, or service items as served

### 🍳 Stove
- **Writes:** `markItemServed(orderId, itemId)` — marks dishes/drinks as served
- **Writes:** `printKitchenOrder(ticketId)` — optional chit print
- **Reads:** KDS tickets filtered to `category === 'dishes' || category === 'drinks'`
- **Cannot:** Weigh meat, mark sides, or clear orders

### 📋 Dispatch (Expo)
- **Writes:** `markItemServed(orderId, itemId)` — marks sides as served
- **Writes:** `completeAllForOrder(card)` — clears entire order when all stations complete
- **Reads:** All station progress (meats, dishes, sides) via dispatch cards
- **Can undo:** `recallTicket(orderId)` — recalls a cleared order within 8s toast window

### 💻 Cashier
- **Writes:** Full order CRUD (open table, add items, void, checkout, payments)
- **Reads:** Entire order queue, floor plan, all KDS state
- **Generates:** The Table # that all other stations reference

---

## Physical Handoff Protocols

### Meat Label (Weigh → Pass)
1. Butcher weighs meat on BT scale
2. Taps DISPATCH → system records weight + auto-prints thermal label
3. Label contains: **Table #**, meat name, weight in grams
4. If printer fails: orange warning on dispatch log, meat still dispatched
5. Butcher can tap 🖨 reprint button on any dispatched entry

### Stove Chit (Stove → Pass)
1. Stove operator cooks dish, taps DONE per item or ALL DONE per table
2. Optionally taps 🖨 Print Chit button for a paper chit
3. Primary callout method: **verbal** ("T5 ramyun ready!")

### Dispatch Assembly (Pass → Table)
1. Dispatch monitors all station progress on dispatch board
2. When all stations complete → card shows "ALL DONE — CLEAR ORDER" button
3. Dispatch matches thermal labels to table, assembles tray with sides
4. Taps ALL DONE → order clears from board, undo toast shows for 8s
5. Food runner delivers to table

---

## Audio Signal Reference

| Station | Tone | Frequency | Trigger |
|---------|------|-----------|---------|
| 📋 Dispatch | Two-tone ascending (C5→E5) | 523Hz → 659Hz | Table transitions to READY TO RUN |
| 🍳 Stove | Single tone (A4) | 440Hz | New dish/drink order arrives |
| 📋 Sides (legacy) | Single tone | 660Hz | New side item arrives |

---

## Inter-Station Data Flow

```
Cashier (POS)
    │
    ├─ Creates order + Table # ─────────────────┐
    │                                            │
    ▼                                            ▼
KDS Ticket created ──────────────────► All Stations
    │                                            │
    ├─► Weigh Station ──► weight + label ───────►│
    ├─► Stove ──► DONE per dish ────────────────►│
    └─► Dispatch ──► DONE per side ─────────────►│
                                                 │
                                                 ▼
                                        Dispatch Board
                                    (cross-station progress)
                                                 │
                                                 ▼
                                    ALL DONE → Order Cleared
                                    (undo available for 8s)
```

---

## Cross-Reference

- Per-station page implementations: see `CLAUDE.md` → Project Structure → `routes/kitchen/`
- Role workflows and frequency data: see `ROLE_WORKFLOWS.md`
- Environment constraints (wet hands, viewing distance): see `ENVIRONMENT.md`
- Hardware integration (BT scale, printers): see `skills/bluetooth/SKILL.md`
