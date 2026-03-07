---
name: bluetooth
description: >
  Bluetooth hardware integration for WTFPOS. Use this skill when working with the Bluetooth scale
  (weighing meat at the weigh station), debugging Web Bluetooth connection issues, adding new
  Bluetooth or USB hardware (receipt printer, barcode scanner), handling scale reconnection,
  parsing weight data from GATT characteristics, or designing the weigh-station UX flow.
  Also use when the user mentions "scale", "weight", "Bluetooth", "GATT", "Web Bluetooth",
  "hardware", "printer", "barcode scanner", or "weigh station".
  Current phase: PARTIALLY IMPLEMENTED (scale connection + reading exists; reconnect and
  printer integration are not yet done).
version: 1.0.0
---

# Bluetooth Hardware — WTFPOS

WTFPOS uses the Web Bluetooth API to connect to a Bluetooth scale for weighing meat cuts at
the kitchen weigh station. Weight data flows directly into order items.

**Current implementation:**
- `src/lib/stores/hardware.svelte.ts` — Connection state (connected/disconnecting/error)
- `src/lib/stores/bluetooth-scale.svelte.ts` — Scale data, weight readings
- `src/routes/kitchen/weigh-station/+page.svelte` — Weigh station UI

## References
- `references/WEB_BLUETOOTH_GUIDE.md` — Web Bluetooth API patterns, GATT, browser support
- `references/BLUETOOTH_DEVICES.md` — Scale models, characteristic UUIDs, data format parsing

---

## Context7 / Documentation

Web Bluetooth has no npm package (it's a browser API). Use:

```
// Search for current browser support and API:
WebSearch("Web Bluetooth API 2025 GATT characteristic notification")
WebSearch("navigator.bluetooth requestDevice browser support iOS Android")

// MDN reference (always current):
WebSearch("MDN Web Bluetooth API site:developer.mozilla.org")
```

**Browser support warning:** Web Bluetooth is NOT available on:
- Firefox (any version)
- Safari / iOS Safari
- Chromium on Linux (experimental)

For WTFPOS: tablets should use Chrome on Android or Chrome on Windows/MacOS.

---

## Architecture

```
Bluetooth Scale (BLE device)
    ↓ Web Bluetooth GATT notification
bluetooth-scale.svelte.ts
    weight (grams) reactive state
    ↓
Weigh Station UI (weigh-station/+page.svelte)
    Staff confirms weight
    ↓
Order item created with weight field
    ↓
RxDB.orders.incrementalModify()
    ↓
KDS displays item with weight annotation
```

---

## Key Concepts

### GATT (Generic Attribute Profile)

Bluetooth LE devices expose data via GATT services and characteristics.

```
Device
└── Service (UUID: e.g., "0000181d-0000-1000-8000-00805f9b34fb" for Weight Scale)
    └── Characteristic (UUID: e.g., "00002a9d-0000-1000-8000-00805f9b34fb" for Weight Measurement)
        └── Notifications: fires when weight reading changes
```

### Standard Weight Scale Profile (Bluetooth SIG)

Most commercial BLE scales implement the standard Weight Scale profile:
- Service UUID: `0x181D` (Weight Scale)
- Measurement characteristic: `0x2A9D` (Weight Measurement)
- Data format: First byte is flags, then weight in resolution units

### Custom Scale Protocol (common in cheap scales)

Many affordable scales (common in restaurant suppliers) use a vendor-specific protocol:
- Custom service UUID (varies by brand)
- Data arrives as raw bytes, need to parse per manufacturer spec
- Check the scale's documentation or use nRF Connect app to reverse-engineer the protocol

---

## Connection Pattern

```ts
// Connect to scale (called from weigh-station UI)
async function connectScale() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            // Option A: filter by known scale service UUID
            filters: [{ services: ['0000181d-0000-1000-8000-00805f9b34fb'] }],

            // Option B: accept any device (shows all nearby BLE devices)
            // acceptAllDevices: true,
            // optionalServices: ['0000181d-0000-1000-8000-00805f9b34fb']
        });

        device.addEventListener('gattserverdisconnected', onDisconnected);

        const server = await device.gatt!.connect();
        const service = await server.getPrimaryService('0000181d-0000-1000-8000-00805f9b34fb');
        const characteristic = await service.getCharacteristic('00002a9d-0000-1000-8000-00805f9b34fb');

        characteristic.addEventListener('characteristicvaluechanged', handleWeightReading);
        await characteristic.startNotifications();

        // Store device reference for reconnect
        currentDevice = device;
        connectionState = 'connected';

    } catch (error: any) {
        if (error.name === 'NotFoundError') {
            // User cancelled the device picker
            connectionState = 'idle';
        } else {
            connectionState = 'error';
            console.error('[Bluetooth]', error);
        }
    }
}
```

---

## Weight Parsing

```ts
// Standard BLE Weight Scale profile (Bluetooth SIG)
function parseWeightMeasurement(event: Event): number | null {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
    const view = new DataView(value.buffer);

    const flags = view.getUint8(0);
    const measurementUnits = (flags & 0x01) === 0 ? 'SI' : 'imperial'; // bit 0: 0=kg, 1=lb
    const weightResolved = (flags & 0x04) !== 0; // bit 2: weight successfully measured

    if (!weightResolved) return null;

    if (measurementUnits === 'SI') {
        // SI: weight in 0.005 kg increments
        const rawWeight = view.getUint16(1, true); // little-endian
        return rawWeight * 5; // convert to grams (0.005 kg × 1000 g/kg × rawWeight)
    } else {
        // Imperial: weight in 0.01 lb increments
        const rawWeight = view.getUint16(1, true);
        return Math.round(rawWeight * 0.01 * 453.592); // convert to grams
    }
}
```

---

## Reconnect Strategy

Auto-reconnect is NOT built into Web Bluetooth. Implement it manually:

```ts
function onDisconnected(event: Event) {
    const device = event.target as BluetoothDevice;
    connectionState = 'disconnected';

    // Attempt reconnect after 3 seconds
    setTimeout(async () => {
        if (connectionState !== 'disconnected') return; // user may have manually disconnected

        try {
            connectionState = 'reconnecting';
            await device.gatt!.connect();
            // Re-subscribe to notifications after reconnect
            const server = device.gatt!;
            const service = await server.getPrimaryService('0000181d-0000-1000-8000-00805f9b34fb');
            const char = await service.getCharacteristic('00002a9d-0000-1000-8000-00805f9b34fb');
            await char.startNotifications();
            char.addEventListener('characteristicvaluechanged', handleWeightReading);
            connectionState = 'connected';
        } catch (err) {
            connectionState = 'error';
        }
    }, 3000);
}
```

---

## Data Flow into Orders

When staff confirms a weight reading at the weigh station:

```ts
// src/routes/kitchen/weigh-station/+page.svelte

async function confirmWeight(orderId: string, menuItemId: string, weightGrams: number) {
    if (!browser) return;
    const db = await getDb();
    const doc = await db.orders.findOne(orderId).exec();
    if (!doc) return;

    const newItem: OrderItem = {
        id: nanoid(),
        menuItemId,
        menuItemName: getMenuItemName(menuItemId),
        quantity: 1,
        unitPrice: calculateMeatPrice(menuItemId, weightGrams), // price per gram × weight
        weight: weightGrams,
        status: 'pending',
        sentAt: new Date().toISOString(),
        tag: null,
        notes: `${weightGrams}g`
    };

    await doc.incrementalModify((d) => {
        d.items = [...d.items, newItem];
        d.updatedAt = new Date().toISOString();
        return d;
    });
}
```

---

## Known Issues & Missing Features

| Issue | Status | Notes |
|---|---|---|
| Auto-reconnect on disconnect | 🔲 Missing | Implement `onDisconnected` handler with retry |
| iOS/Safari support | ❌ Not possible | Web Bluetooth not supported on iOS |
| Tare/zero support | 🔲 Missing | Some scales support tare via write characteristic |
| Weight stability detection | 🔲 Missing | Only confirm when reading is stable (3 consistent readings) |
| Receipt printer via Bluetooth | 🔲 Future | Need to identify printer model and ESC/POS protocol |
| Multiple scale support | 🔲 Future | One scale per weigh station is sufficient for now |

---

## Human in the Loop — Critical Gates

**STOP and ask the user before any of these actions.** Hardware integration mistakes cause
silent failures at the weigh station during service — staff will weigh meat incorrectly and
not know it.

### 1. Changing or hardcoding GATT service/characteristic UUIDs

**Trigger:** Any change to the UUID strings used in `requestDevice`, `getPrimaryService`,
or `getCharacteristic`.

**Ask:**
- "Have you verified these exact UUIDs on the actual scale using nRF Connect or a similar BLE scanner?"
- "Which scale model is being used? (Brand, model number — so I can cross-reference the spec.)"
- "Is this UUID from the Bluetooth SIG standard profile, or a vendor-specific UUID?"

**Why:** Wrong UUIDs fail silently — `getPrimaryService` throws `NotFoundError`, the scale appears
to connect but never sends weight data. Staff will see 0g or stale readings without knowing why.

---

### 2. Writing a command to the scale (tare, zero, unit change)

**Trigger:** Any code that calls `characteristic.writeValue()` or `characteristic.writeValueWithResponse()`.

**Ask:**
- "What is the exact command byte sequence from the manufacturer's documentation or reverse-engineered spec?"
- "Has this command been tested on a non-production scale first?"
- "What happens if the wrong command is sent — does the scale require a power cycle to recover?"

**Why:** Sending an incorrect write command to a Bluetooth scale can crash its firmware, change
its unit (kg → lb), or require a factory reset. In a restaurant context this means the weigh
station is down during service.

---

### 3. Modifying weight parsing logic

**Trigger:** Any change to how raw `DataView` bytes are interpreted into grams.

**Ask:**
- "Is the new parsing based on the Bluetooth SIG Weight Measurement spec, or a vendor-specific format?"
- "Can we test with a known reference weight (e.g., a 500g calibration weight) before deploying?"
- "Does the scale send SI (kg) or imperial (lb) units by default, and is the unit flag being read correctly?"

**Why:** An off-by-one byte in the `DataView` offset, or a wrong endianness assumption, produces
plausible-but-wrong weights (e.g., reading 235g instead of 352g). Meat is priced by weight —
this directly affects order accuracy and revenue.

---

### 4. Deploying any Bluetooth change during restaurant service hours

**Trigger:** Any Bluetooth change being pushed to devices while the restaurant is open.

**Ask:**
- "What time is it at the restaurant? (Service hours: roughly 11am–11pm PH time.)"
- "Is the weigh station actively being used right now?"
- "Can this wait until after the last service (11pm+) when staff can test before the next day?"

**Why:** A broken weigh station during service means staff either skip weighing (revenue loss)
or guess weights (food cost inaccuracy). Both are worse than delaying a deploy by a few hours.

---

## Self-Improvement Protocol

When any of the following occur:
- A new scale model is added or the existing model's UUIDs are confirmed
- Web Bluetooth API changes (check MDN)
- Auto-reconnect is implemented (update "Known Issues" table)
- A receipt printer is integrated
- The user corrects Bluetooth parsing logic

**Action:** Update this SKILL.md and the relevant references before continuing.

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-07 | Initial creation — scale partially implemented, reconnect + printer missing |
