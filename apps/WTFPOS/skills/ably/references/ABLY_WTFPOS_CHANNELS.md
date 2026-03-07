# Ably Channel Design — WTFPOS

Complete channel map, message schemas, and subscription rules.

**Status: PREPARATION. Not yet implemented.**

---

## Channel Map

```
wtfpos:
├── tag:
│   ├── kitchen          — KDS tickets + order status for Tagbilaran
│   ├── orders           — Order lifecycle events for Tagbilaran (open, paid, cancelled)
│   └── stock            — Stock alerts for Tagbilaran
├── pgl:
│   ├── kitchen          — KDS tickets + order status for Panglao
│   ├── orders           — Order lifecycle events for Panglao
│   └── stock            — Stock alerts for Panglao
└── all:
    ├── kitchen          — Aggregate cross-branch (owner subscribe-only)
    └── alerts           — Manager notifications (high-value cancel, low stock)
```

---

## Message Schemas

### `{location}:kitchen` — event: `order_snapshot`

Published every time any order changes for a branch (debounced 3s, same pattern as current SSE push).

```ts
interface KitchenSnapshotMessage {
    locationId: string;            // 'tag' | 'pgl'
    locationName: string;          // 'Alta Citta (Tagbilaran)' | 'Alona Beach (Panglao)'
    orders: Order[];               // All open + pending_payment orders for this branch
    timestamp: string;             // ISO 8601
}
```

### `{location}:kitchen` — event: `ticket_bumped`

Published when kitchen staff bumps a KDS ticket (order items marked served).

```ts
interface TicketBumpedMessage {
    locationId: string;
    orderId: string;
    ticketId: string;
    bumpedBy: string;              // staff name
    bumpedAt: string;              // ISO 8601
}
```

### `{location}:orders` — event: `order_status_changed`

Published when an order transitions state.

```ts
interface OrderStatusMessage {
    locationId: string;
    orderId: string;
    tableNumber: number | null;
    customerName?: string;
    previousStatus: string;
    newStatus: string;             // 'open' | 'pending_payment' | 'paid' | 'cancelled'
    total: number;
    changedBy: string;
    timestamp: string;
}
```

### `{location}:stock` — event: `stock_alert`

Published when a stock item falls below par level.

```ts
interface StockAlertMessage {
    locationId: string;
    stockItemId: string;
    stockItemName: string;
    currentQuantity: number;
    parLevel: number;
    unit: string;
    severity: 'warning' | 'critical';  // warning: <50% par, critical: <20% par
    timestamp: string;
}
```

### `all:alerts` — event: `manager_alert`

Cross-branch alert for elevated roles.

```ts
interface ManagerAlertMessage {
    locationId: string;
    type: 'high_value_cancellation' | 'stock_critical' | 'no_show' | 'device_offline';
    message: string;               // human-readable
    severity: 'info' | 'warning' | 'critical';
    data: Record<string, unknown>; // type-specific payload
    timestamp: string;
}
```

---

## Who Publishes What

| Channel | Publisher | Subscriber |
|---|---|---|
| `tag:kitchen` | Tagbilaran branch browsers (debounced on RxDB change) | KDS tablets at Tagbilaran + owner |
| `pgl:kitchen` | Panglao branch browsers | KDS tablets at Panglao + owner |
| `tag:orders` | Tagbilaran branch (on order status change) | Manager, owner |
| `pgl:orders` | Panglao branch (on order status change) | Manager, owner |
| `tag:stock` | Tagbilaran branch (on stock deduction/adjustment) | Tagbilaran manager, owner |
| `pgl:stock` | Panglao branch | Panglao manager, owner |
| `all:kitchen` | Ably fan-out rule (auto from tag + pgl) OR owner subscribes to both | Owner |
| `all:alerts` | SvelteKit server (evaluates thresholds) | All elevated roles |

---

## Ably Fan-Out Rule (Dashboard Config)

To make `all:kitchen` automatically receive events from both branch channels, configure an Ably Integration Rule in the dashboard:

```
Source: wtfpos:tag:kitchen
Target: wtfpos:all:kitchen
Transform: none (forward as-is)

Source: wtfpos:pgl:kitchen
Target: wtfpos:all:kitchen
Transform: none (forward as-is)
```

Alternative (simpler): Owner subscribes to both `tag:kitchen` and `pgl:kitchen` directly. No fan-out rule needed. This is the recommended approach for Phase 3.

---

## Presence Data

Each device enters presence on the kitchen channel:

```ts
{
    role: 'kitchen' | 'staff' | 'manager' | 'owner',
    userName: string,
    locationId: string,
    deviceType: 'pos' | 'kds' | 'manager' | 'owner'
}
```

Owner/manager admin panel shows presence members = "who's currently online at each branch".

---

## History Usage

Ably persists channel history for 2 minutes (free tier) or longer (paid).
Use history to get the last state when a device reconnects:

```ts
// When KDS tablet reconnects after a brief disconnect
channel.history({ limit: 1 }, (err, page) => {
    const lastSnapshot = page.items.find(m => m.name === 'order_snapshot');
    if (lastSnapshot) {
        // Render immediately without waiting for next publish
        renderOrders(lastSnapshot.data.orders);
    }
});
```

This is Ably's advantage over SSE: SSE requires the server to hold the last snapshot in memory. Ably history works even if the publisher has gone offline.

---

## Capability Map (Token Request)

```ts
// Role → Ably capability
const ROLE_CAPABILITY: Record<string, Record<string, string[]>> = {
    owner: {
        'wtfpos:*': ['subscribe', 'presence']  // read-only on all channels
        // Owner can't publish — read-only aggregate view
    },
    admin: {
        'wtfpos:*': ['subscribe', 'presence']
    },
    manager: {
        'wtfpos:{locationId}:*': ['subscribe', 'publish', 'presence'],
        'wtfpos:all:alerts': ['subscribe']
    },
    staff: {
        'wtfpos:{locationId}:kitchen': ['subscribe', 'publish'],
        'wtfpos:{locationId}:orders': ['subscribe', 'publish']
    },
    kitchen: {
        'wtfpos:{locationId}:kitchen': ['subscribe', 'publish'],
        'wtfpos:{locationId}:orders': ['subscribe']
    }
};
```

---

## Offline Behavior

If Ably is disconnected:
1. `ablyClient.connection.on('disconnected', ...)` fires
2. RxDB continues working locally (no data loss)
3. Kitchen aggregate view shows "Reconnecting..." state
4. When Ably reconnects: `ablyClient.connection.on('connected', ...)` fires → fetch history to catch up

```ts
// Connection recovery in the aggregate view
ably.connection.on('connected', async () => {
    // Fetch history since last known timestamp
    const since = lastSnapshotAt[locationId];
    channel.history({ start: since, limit: 100 }, (err, page) => {
        for (const msg of page.items.reverse()) {  // oldest first
            if (msg.name === 'order_snapshot') {
                branchOrders[msg.data.locationId] = msg.data.orders;
            }
        }
    });
});
```

---

## Rate Limits (Free Tier)

| Limit | Value | WTFPOS impact |
|---|---|---|
| Messages/month | 6,000,000 | ~1 msg/3s per active branch = ~2.6M/month at 2 branches. Safe. |
| Connections | 200 peak | ~10 devices per branch = well within limits |
| History | 2 minutes | Enough for reconnection scenarios |
| Channels | Unlimited | No issue |

For a busy Friday night with 5 tablets per branch:
- kitchen snapshot every 3s × 2 branches × 5 subscribers = 10 msg/3s = 8.6M/month
- Consider increasing debounce to 5s or using differential updates (not full snapshots) if approaching limit

---

## Migration from SSE (Phase 1 → Phase 3)

**Files to delete:**
```
src/lib/server/kitchen-sse.ts
src/routes/api/sse/kitchen-orders/+server.ts
src/routes/api/events/kitchen-push/+server.ts
src/routes/api/sse/aggregate/+server.ts
src/lib/stores/kitchen-push.ts
```

**Files to update:**
```
src/routes/kitchen/+layout.svelte
  → Replace: return startKitchenPush()
  → With:    return startAblyKitchenPublish()

src/routes/kitchen/all-orders/+page.svelte
  → Replace: const es = new EventSource('/api/sse/aggregate')
  → With:    Ably channel subscriptions (see SKILL.md)
```

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-07 | Initial creation — maps Phase 1 SSE → Phase 3 Ably migration path |
