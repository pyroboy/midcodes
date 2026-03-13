# WTFPOS System Administration Guide

## Overview

This guide covers the operational setup of the WTFPOS system for IT/system administrators. Each branch has one **server** (the machine running the Node.js build) and multiple **clients** (tablets, phones, desktops connecting via the local WiFi network).

---

## How Server Detection Works

Server detection is **fully automatic** — no manual setup or special login role is needed.

### The Mechanism

1. Every browser tab calls `GET /api/device/identify` on startup
2. The endpoint checks the connecting IP address against the machine's own network interfaces
3. If the IP matches (localhost or any local NIC address) → **server**
4. Any other IP → **client**

### What This Means

- The machine running `node build` (or `pnpm dev`) **is** the server — always
- Opening the app on `http://localhost:5173` or `http://192.168.1.50:5173` on the server machine → both detected as server
- A phone connecting to `http://192.168.1.50:5173` over WiFi → detected as client
- No configuration files, environment variables, or special login accounts needed

---

## Topology View (`/admin/devices`)

The topology page shows a visual map of all connected devices, grouped by IP address.

### Node Types

| Symbol | Meaning |
|--------|---------|
| Server rack icon (top center) | The machine running the Node.js build |
| Laptop/tablet/phone icons | Client devices connected via WiFi |
| Blue badge "3 tabs" | Multiple browser tabs on the same machine |

### Connection Lines

| Line Style | Meaning |
|------------|---------|
| Solid green, animated flow | Online (seen < 60 seconds ago) |
| Dashed amber, slow animation | Stale (60–300 seconds since last heartbeat) |
| *(no line — node removed)* | Offline (> 300 seconds) — shown only in Cards view |

### Special Cases

- **Server always visible**: Even if the server goes offline (> 5 min), it stays in the SVG with a red "Offline" badge
- **Session count**: If 3 users are logged in on the same machine (3 browser tabs), the node shows "3 sessions"
- **"No server detected" warning**: Appears if no device has been identified as a server

---

## Setting Up a New Branch

1. **Designate a server machine** — any laptop/desktop/tablet that will run the Node.js build
2. Run the production build:
   ```bash
   cd apps/WTFPOS
   pnpm build
   node build
   ```
3. The server is now running on port 3000 (default)
4. Note the server's LAN IP address (e.g., `192.168.1.50`)
5. On client devices: open `http://192.168.1.50:3000` in Chrome/Safari

That's it. Server detection is automatic.

---

## Multi-Tab on Server

Opening multiple tabs on the server machine **just works**:

- All tabs share the same IP address → same network node in topology
- Each tab can be logged in as a different user (staff, manager, owner)
- The topology shows one node with a session count badge
- This is useful for testing or running multiple POS stations on the same machine

---

## Client Setup

1. Connect the device (tablet/phone) to the same WiFi network as the server
2. Open Chrome or Safari
3. Navigate to `http://<server-ip>:3000`
4. Log in with any account
5. The device appears in the topology automatically within 30 seconds

### Supported Browsers

- Chrome (Android, desktop) — recommended
- Safari (iOS, macOS)
- Firefox (limited Web Bluetooth support)

---

## Sync Monitoring

### SyncStatusBanner

Client devices show a `SyncStatusBanner` when replication is active. States:

| State | Banner |
|-------|--------|
| Syncing | Blue — "Syncing with server..." |
| Synced | Green — briefly shown, then auto-hides |
| Error | Red — "Sync error — data may be stale" |

### Server is Source of Truth

The server's RxDB instance is the authoritative data store. All clients replicate from/to it. If a client has stale data, it will catch up automatically when reconnected.

---

## Troubleshooting

### No server detected

- **Cause**: The Node.js process isn't running, or the app hasn't been opened in a browser on the server machine
- **Fix**: Ensure `node build` is running. Open `http://localhost:3000` on the server machine.

### Stale device (amber in topology)

- **Cause**: The device's browser tab is in the background, or the network connection is slow
- **Fix**: Bring the tab to the foreground. The heartbeat runs every 30 seconds.

### Duplicate servers detected

- **Cause**: Two machines at the same location are both running `node build`
- **Fix**: Only one machine per location should run the build. Stop the extra instance.

### IP address changes (DHCP)

- The system re-checks IP every 5 minutes
- Old device records with the previous IP will naturally expire
- If the server's IP changes, clients need to update their bookmark/URL

### Device appears multiple times

- **Pre-migration**: Devices registered before the IP update use browser fingerprints as IDs
- **Fix**: These will consolidate after the next heartbeat cycle fills in the IP address

---

## Cloud Sync (Phase 2)

> **Not yet active.** Cloud sync to Neon PostgreSQL is planned for Phase 2.

When active, the server will replicate its RxDB data to a cloud PostgreSQL database for:
- Cross-branch analytics (owner dashboard)
- Disaster recovery (cloud backup)
- Historical data archival

The topology page will show a "Cloud Sync" status on server nodes when this is enabled.
