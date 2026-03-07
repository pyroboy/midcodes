# Web Bluetooth API Guide — WTFPOS

## Browser Support Matrix

| Browser | Platform | Support |
|---|---|---|
| Chrome 56+ | Windows, macOS, Android | ✅ Full support |
| Edge 79+ | Windows, macOS | ✅ Full support (Chromium-based) |
| Chrome for Android | Android 6.0+ | ✅ Full support |
| Opera 43+ | Desktop | ✅ Full support |
| Firefox | All | ❌ Not supported |
| Safari | macOS, iOS | ❌ Not supported |
| Chrome on iOS | iOS | ❌ Web Bluetooth not available on iOS WebKit |
| Chrome on Linux | Linux | ⚠️ Experimental (enable via chrome://flags) |

**WTFPOS tablet recommendation:** Chrome on Android tablets or Windows tablets.

---

## Request a Device

```ts
// Must be called from a user gesture (button click)
const device = await navigator.bluetooth.requestDevice({
    // Option A: Filter by GATT service UUID (recommended — only shows compatible devices)
    filters: [{
        services: ['0000181d-0000-1000-8000-00805f9b34fb']  // Weight Scale service
    }],

    // Option B: Filter by device name prefix
    filters: [{
        namePrefix: 'MY-SCALE'
    }],

    // Option C: Accept all devices (for discovery/debugging)
    acceptAllDevices: true,
    optionalServices: ['0000181d-0000-1000-8000-00805f9b34fb']
});
```

**Note:** `acceptAllDevices: true` cannot be combined with `filters`. Use it only for debugging.

---

## Connect and Subscribe

```ts
// Connect to GATT server
const server = await device.gatt!.connect();

// Get service by UUID
const service = await server.getPrimaryService('0000181d-0000-1000-8000-00805f9b34fb');

// Get characteristic by UUID
const characteristic = await service.getCharacteristic('00002a9d-0000-1000-8000-00805f9b34fb');

// One-time read
const value = await characteristic.readValue();

// Subscribe to notifications (fires on every change)
characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
    const data = new DataView(value.buffer);
    // parse data here
});
await characteristic.startNotifications();
```

---

## GATT UUIDs Reference

### Bluetooth SIG Standard (used by quality scales)

| Service | UUID (short) | UUID (full) |
|---|---|---|
| Weight Scale | `0x181D` | `0000181d-0000-1000-8000-00805f9b34fb` |
| Health Thermometer | `0x1809` | `00001809-0000-1000-8000-00805f9b34fb` |
| Battery Service | `0x180F` | `0000180f-0000-1000-8000-00805f9b34fb` |

| Characteristic | UUID (short) | UUID (full) |
|---|---|---|
| Weight Measurement | `0x2A9D` | `00002a9d-0000-1000-8000-00805f9b34fb` |
| Weight Scale Feature | `0x2A9E` | `00002a9e-0000-1000-8000-00805f9b34fb` |

### Common Vendor-Specific UUIDs

Some cheap scales use non-standard UUIDs. To discover them:
1. Install **nRF Connect** app (Android/iOS) on a phone
2. Connect to the scale
3. Browse services and characteristics
4. Note the UUIDs your scale uses

Common vendor patterns:
```
Service: 0000ffe0-0000-1000-8000-00805f9b34fb (common for cheap scales)
Characteristic: 0000ffe1-0000-1000-8000-00805f9b34fb (notify/write)
```

---

## DataView — Parsing Binary Data

All Bluetooth characteristic values arrive as `ArrayBuffer`. Use `DataView` to read them:

```ts
const view = new DataView(value.buffer);

view.getUint8(offset)   // Read 1 byte unsigned
view.getInt8(offset)    // Read 1 byte signed
view.getUint16(offset, littleEndian)  // Read 2 bytes unsigned
view.getInt16(offset, littleEndian)   // Read 2 bytes signed
view.getUint32(offset, littleEndian)  // Read 4 bytes unsigned
view.getFloat32(offset, littleEndian) // Read 4 bytes float
view.getFloat64(offset, littleEndian) // Read 8 bytes float

// Most BLE data is little-endian (true = little-endian)
const weight = view.getUint16(1, true);
```

### Debugging with hex dump

```ts
function hexDump(value: DataView): string {
    const bytes = new Uint8Array(value.buffer);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

// Log all incoming data during development
characteristic.addEventListener('characteristicvaluechanged', (e) => {
    const data = new DataView((e.target as any).value.buffer);
    console.log('[BT Raw]', hexDump(data));
});
```

---

## Connection Lifecycle

```ts
// Track connection state
device.addEventListener('gattserverdisconnected', onDisconnected);

function onDisconnected(event: Event) {
    const device = event.target as BluetoothDevice;
    console.log('[BT] Disconnected from', device.name);
    // Handle reconnect here
}

// Manual disconnect (cleanup)
async function disconnect() {
    if (device.gatt?.connected) {
        device.gatt.disconnect(); // fires gattserverdisconnected event
    }
}

// Check if still connected
const isConnected = device.gatt?.connected ?? false;
```

---

## Security Constraints

Web Bluetooth has strict security requirements:
1. **HTTPS only** (or localhost for dev) — won't work on HTTP in production
2. **User gesture required** — `requestDevice` must be called from a click/tap handler
3. **Permission is per-origin** — if the URL changes (port, subdomain), permission resets
4. **One device per tab** — multiple tabs can't share the same BLE device connection

**SvelteKit dev server (localhost):** Works fine. `adapter-node` in production needs HTTPS.

---

## Write to Characteristic (Advanced)

For scale features like tare:

```ts
// Write a command to the scale
async function tarScale(characteristic: BluetoothRemoteGATTCharacteristic) {
    // Command varies by scale manufacturer — check documentation
    const command = new Uint8Array([0x02]); // example tare command
    await characteristic.writeValue(command);
}

// Some characteristics support writeValueWithResponse (waits for acknowledgment)
await characteristic.writeValueWithResponse(command);

// Others only support writeValueWithoutResponse (fire-and-forget)
await characteristic.writeValueWithoutResponse(command);
```

---

## Testing Without a Physical Scale

For development when the scale isn't available:

```ts
// src/lib/stores/bluetooth-scale.svelte.ts — add mock mode

const MOCK_SCALE = import.meta.env.DEV && !navigator.bluetooth;

if (MOCK_SCALE) {
    // Simulate weight readings for UI development
    const interval = setInterval(() => {
        const mockWeight = 350 + Math.random() * 50; // 350-400g
        handleWeight(mockWeight);
    }, 1000);
    // Cleanup: clearInterval(interval)
}
```

Or use the Chrome DevTools Bluetooth emulator (chrome://bluetooth-internals).

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-07 | Initial creation |
