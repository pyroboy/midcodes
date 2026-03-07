---
name: bluetooth
description: >
  Bluetooth hardware integration for WTFPOS. Use when working with the Bluetooth scale
  (weighing meat at the weigh station), debugging Web Bluetooth connection issues, adding new
  Bluetooth or USB hardware (receipt printer, barcode scanner), handling scale reconnection,
  parsing weight data from GATT characteristics, or designing the weigh-station UX flow.
  Also triggers on "scale", "weight", "Bluetooth", "GATT", "Web Bluetooth", "hardware",
  "printer", "barcode scanner", or "weigh station".
  Current phase: PARTIALLY IMPLEMENTED (scale connection + reading exists).
---

# Bluetooth Hardware — WTFPOS

Web Bluetooth API integration for the kitchen Bluetooth scale (weighing meat cuts).

**Status: PARTIALLY IMPLEMENTED.** Scale connection and weight reading work.
Reconnection logic and printer integration are not yet done.

## Full Reference

- **Full skill:** `skills/bluetooth/SKILL.md`
- **Web Bluetooth patterns:** `skills/bluetooth/references/WEB_BLUETOOTH_GUIDE.md`

## Key Files

| File | Purpose |
|---|---|
| `src/lib/stores/hardware.svelte.ts` | Connection state |
| `src/lib/stores/bluetooth-scale.svelte.ts` | Scale data, weight readings |
| `src/routes/kitchen/weigh-station/+page.svelte` | Weigh station UI |

## Browser Support Warning

Web Bluetooth is NOT available on Firefox, Safari, or iOS Safari.
WTFPOS tablets must use **Chrome on Android** or **Chrome on Windows/macOS**.

## Architecture

```
Bluetooth Scale (BLE device)
    | Web Bluetooth GATT notification
bluetooth-scale.svelte.ts
    | weight (grams) reactive state
weigh-station/+page.svelte
    | display + map to order items
```
