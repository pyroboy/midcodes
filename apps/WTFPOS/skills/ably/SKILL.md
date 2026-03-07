---
name: ably
description: >
  Ably real-time pub/sub integration for WTFPOS. Use this skill when the user wants to add
  real-time cross-device events, replace the SSE kitchen aggregate view with Ably channels,
  implement live KDS ticket updates between POS and kitchen tablets, add cross-branch alerts
  for managers, implement Ably presence (which devices are online), or set up push notifications
  for stock alerts. Also use when the user mentions "real-time", "Ably", "pub/sub", "channels",
  "push events", "live updates", "replace SSE", or "cross-device notifications".
  IMPORTANT: Ably replaces the SSE kitchen aggregation built in Phase 1.
  Current phase: PREPARATION ONLY. Ably is not yet connected.
version: 1.0.0
---

# Ably — WTFPOS Real-Time Event Bus

Ably is a serverless pub/sub platform. In WTFPOS it is the real-time event bus that connects:
- Kitchen display (KDS) with POS tablets — live ticket updates
- Owner device with all branches — cross-branch order monitoring
- Manager alerts — stock thresholds, high-value cancellations

**Current status: PREPARATION MODE.** Ably is not yet connected.
The SSE kitchen aggregate (`/api/sse/*`) is the Phase 1 bridge that Ably will replace.

## References
- `references/ABLY_GUIDE.md` — Connection, auth, channels, presence, history
- `references/ABLY_WTFPOS_CHANNELS.md` — Exact channel design and message schemas for WTFPOS

---

## What Ably Replaces

When Ably is implemented in Phase 3:

| Phase 1 (SSE — delete these) | Phase 3 (Ably — add these) |
|---|---|
| `src/lib/server/kitchen-sse.ts` | `src/lib/server/ably.ts` (server-side token auth) |
| `src/routes/api/sse/kitchen-orders/+server.ts` | Deleted |
| `src/routes/api/events/kitchen-push/+server.ts` | Deleted |
| `src/routes/api/sse/aggregate/+server.ts` | Deleted |
| `src/lib/stores/kitchen-push.ts` | Replaced by Ably publish in RxDB subscription |
| `EventSource('/api/sse/aggregate')` in all-orders page | `ably.channels.get('wtfpos:all:kitchen').subscribe()` |

---

## Context7 — Fetch Fresh Docs Before Implementing

```
mcp__context7__resolve-library-id({ libraryName: "ably" })

mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "<resolved id>",
  topic: "channels subscribe publish presence history",
  tokens: 8000
})
```

Also check: https://ably.com/docs for current SDK version and breaking changes.

---

## Package

```bash
# Install when Phase 3 begins
pnpm add ably
```

---

## Channel Namespace for WTFPOS

```
wtfpos:{locationId}:{topic}

Examples:
  wtfpos:tag:kitchen       — Tagbilaran kitchen events (new tickets, bumps, item status)
  wtfpos:pgl:kitchen     — Panglao kitchen events
  wtfpos:tag:orders        — Tagbilaran order lifecycle events (open, paid, cancelled)
  wtfpos:pgl:orders      — Panglao order lifecycle events
  wtfpos:tag:stock         — Tagbilaran stock alerts (low stock, waste logged)
  wtfpos:pgl:stock       — Panglao stock alerts
  wtfpos:all:kitchen      — Cross-branch read-only view (owner subscribes)
  wtfpos:all:alerts       — Manager cross-branch alerts
```

The `all` namespace is **subscribe-only** for the owner device. Branch devices publish to their own `tag:*` or `pgl:*` channels. An Ably rule fans out to the `all:*` channel automatically (configured in Ably dashboard) — or the owner subscribes to both branch channels and merges client-side.

---

## Authentication Pattern (Server-Side Token Request)

Never expose the Ably API key in the browser. Use server-side token requests.

```ts
// src/routes/api/ably/token/+server.ts

import Ably from 'ably';
import { json } from '@sveltejs/kit';
import { ABLY_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { locationId, role, deviceId } = await request.json();

    const ably = new Ably.Rest(ABLY_API_KEY);

    // Capability: branch devices can only publish to their own location
    // Owner/admin can subscribe to all channels
    const capability: Record<string, string[]> = role === 'owner' || role === 'admin'
        ? { 'wtfpos:*': ['subscribe', 'presence'] }
        : {
            [`wtfpos:${locationId}:*`]: ['subscribe', 'publish', 'presence'],
            'wtfpos:all:*': ['subscribe']  // can subscribe to aggregate but not publish
          };

    const tokenRequest = await ably.auth.createTokenRequest({
        capability,
        clientId: deviceId,
        ttl: 3600 * 1000  // 1 hour
    });

    return json(tokenRequest);
};
```

---

## Client Initialization

```ts
// src/lib/stores/ably.svelte.ts (create when Phase 3 begins)

import Ably from 'ably';
import { browser } from '$app/environment';
import { session } from '$lib/stores/session.svelte';

let ablyClient: Ably.Realtime | null = null;

export async function getAbly(): Promise<Ably.Realtime> {
    if (!browser) throw new Error('Ably is browser-only');
    if (ablyClient) return ablyClient;

    ablyClient = new Ably.Realtime({
        authUrl: '/api/ably/token',
        authMethod: 'POST',
        authParams: {
            locationId: session.locationId,
            role: session.role,
            deviceId: getDeviceId()  // from localStorage or nanoid
        }
    });

    return ablyClient;
}

export function closeAbly() {
    ablyClient?.close();
    ablyClient = null;
}

function getDeviceId(): string {
    if (!browser) return 'server';
    let id = localStorage.getItem('wtfpos_device_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('wtfpos_device_id', id);
    }
    return id;
}
```

---

## Publish: Branch Device → Ably

When an order changes, publish to the branch's kitchen channel:

```ts
// In kitchen-push.ts (Phase 3 replacement for SSE push)

import { getAbly } from '$lib/stores/ably.svelte';
import { session } from '$lib/stores/session.svelte';
import type { Order } from '$lib/types';

export async function publishKitchenSnapshot(orders: Order[]) {
    const ably = await getAbly();
    const channel = ably.channels.get(`wtfpos:${session.locationId}:kitchen`);

    await channel.publish('order_snapshot', {
        locationId: session.locationId,
        locationName: session.locationId === 'tag' ? 'Alta Citta (Tagbilaran)' : 'Alona Beach (Panglao)',
        orders: orders.filter(o => o.status === 'open' || o.status === 'pending_payment'),
        timestamp: new Date().toISOString()
    });
}
```

---

## Subscribe: Owner Device → Aggregate View

```ts
// In kitchen/all-orders page (Phase 3 replacement for SSE EventSource)

import { getAbly } from '$lib/stores/ably.svelte';
import type { Order } from '$lib/types';

let branchOrders = $state<Record<string, Order[]>>({});
let branchStatus = $state<Record<string, 'connected' | 'error' | 'connecting'>>({
    tag: 'connecting',
    pgl: 'connecting'
});

$effect(() => {
    if (session.locationId !== 'all') return;

    let tagChannel: any, pglChannel: any;

    getAbly().then(ably => {
        tagChannel = ably.channels.get('wtfpos:tag:kitchen');
        pglChannel = ably.channels.get('wtfpos:pgl:kitchen');

        tagChannel.subscribe('order_snapshot', (msg: any) => {
            branchOrders = { ...branchOrders, tag: msg.data.orders };
            branchStatus = { ...branchStatus, tag: 'connected' };
        });

        pglChannel.subscribe('order_snapshot', (msg: any) => {
            branchOrders = { ...branchOrders, pgl: msg.data.orders };
            branchStatus = { ...branchStatus, pgl: 'connected' };
        });

        // Use Ably history to get the last snapshot immediately
        tagChannel.history({ limit: 1 }, (_: any, page: any) => {
            const last = page.items[0];
            if (last?.name === 'order_snapshot') {
                branchOrders = { ...branchOrders, tag: last.data.orders };
                branchStatus = { ...branchStatus, tag: 'connected' };
            }
        });
    });

    return () => {
        tagChannel?.unsubscribe();
        pglChannel?.unsubscribe();
    };
});
```

---

## Presence: Who's Online

Ably presence shows which tablets are active — useful for the admin panel.

```ts
// Enter presence when device loads
const channel = ably.channels.get(`wtfpos:${session.locationId}:kitchen`);
await channel.presence.enter({
    role: session.role,
    userName: session.userName,
    locationId: session.locationId
});

// Subscribe to presence changes
channel.presence.subscribe('enter', (member: any) => {
    console.log(`${member.data.userName} joined kitchen at ${member.data.locationId}`);
});
```

---

## Environment Variables

```bash
# .env (add when Phase 3 begins)
ABLY_API_KEY=xxx.yyy:zzzzz   # Never expose this in the browser
```

---

## Human in the Loop — Critical Gates

**STOP and ask the user before any of these actions.** Ably changes affect live channel
subscriptions across all devices simultaneously — there is no staged rollout at the channel level.

### 1. Deleting SSE endpoints (Phase 1 → Phase 3 migration)

**Trigger:** Any request to delete files under `src/routes/api/sse/` or `kitchen-push.ts`,
or to remove the `EventSource` in `all-orders/+page.svelte`.

**Ask:**
- "Has the Ably kitchen channel been tested end-to-end: branch device publishes → owner device receives?"
- "Is the owner's device configured with a valid Ably token endpoint?"
- "If Ably goes down, is there a fallback plan for the cross-branch kitchen view? (SSE had no cloud dependency.)"
- "Should we run both SSE and Ably in parallel for a period before cutting over?"

**Why:** Removing SSE before Ably is production-verified leaves the owner with zero cross-branch visibility.
Once SSE is gone, it has to be rebuilt if Ably fails.

---

### 2. Changing channel names or namespace

**Trigger:** Any rename of a channel (e.g., `wtfpos:tag:kitchen` → something else), or
restructuring the channel namespace pattern.

**Ask:**
- "Are existing devices already subscribed to the current channel names?"
- "Will all devices (branch tablets, owner device) be redeployed at the same time?"
- "Are there any Ably Integration Rules (fan-out rules) configured in the dashboard that reference the old channel names?"

**Why:** Channel renames are a hard cutover — existing subscribers instantly stop receiving events.
There is no deprecation period unless you explicitly bridge old and new channels.

---

### 3. Setting up the Ably API key

**Trigger:** First time adding `ABLY_API_KEY` to `.env`, or rotating the key.

**Ask:**
- "Is this a production key or a sandbox/dev key? (Production has billing implications from the first message.)"
- "Which Ably app does this key belong to? (Confirm it's the `wtfpos-prod` app, not a personal test app.)"
- "Should the key have capability restrictions, or is it a root key? (Root keys should never go in browser-accessible code.)"

**Why:** The API key must stay server-side only (in `$env/static/private`). Exposing it in the
browser lets anyone publish to any WTFPOS channel. The token request pattern (`/api/ably/token`)
is the correct approach — never skip it.

---

### 4. Changing token capability (what roles can publish vs. subscribe)

**Trigger:** Any change to the `ROLE_CAPABILITY` map in the token endpoint.

**Ask:**
- "Should kitchen staff be able to publish to `orders` channel, or subscribe only?"
- "Should the owner be able to publish manager alerts, or only receive them?"
- "Is there a role that currently has more access than it should?"

**Why:** Capability controls what each device can do. Giving branch staff publish rights to
`all:alerts` lets them spam the manager's view with fake alerts.

---

## Self-Improvement Protocol

When any of the following occur:
- Ably SDK API changes (verify with Context7)
- Channel naming conventions change for WTFPOS
- New real-time features are added that need new channels
- The user corrects an Ably-specific assumption

**Action:** Update this SKILL.md and the references before continuing.
Re-fetch docs: `mcp__context7__resolve-library-id({ libraryName: "ably" })`

---

## Changelog

| Date | Change |
|---|---|
| 2026-03-07 | Initial creation — preparation mode, SSE is Phase 1 bridge |
