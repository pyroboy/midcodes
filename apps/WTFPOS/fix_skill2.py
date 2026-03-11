import re

with open("skills/ux-audit/SKILL.md", "r") as f:
    content = f.read()

# Replace PC-2 entirely again
old_pc2 = """### PC-2 — Simulating Multi-User Environments (Same-Browser Swapping)

You should always use the **same browser** (same run session) to test multiple roles interacting, rather than opening multiple browsers, because it is difficult to synchronize multi-browser states and persistent storage. 

For all tests, pass the `-s=${_ux_run_id}` flag to isolate your audit workflow from other potential runs on the same machine. Do NOT use `-s` to separate roles. Instead, use the same session and just log the users in and out sequentially.

```bash
# Run 1: Order taken by Ate Rose
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Ate Rose","role":"staff","locationId":"tag","isLocked":true}'
playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/pos"

# Same Run: Swap to Sir Dan to approve
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Sir Dan","role":"manager","locationId":"tag","isLocked":false}'
playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/reports/voids"
```
*Why this is good:* It perfectly shares the local RxDB/IndexedDB state. The `-s=${_ux_run_id}` run name ensures this entire sequence remains isolated from other audit runs."""

new_pc2 = """### PC-2 — Simulating Multi-User Environments (Same Browser, Multi-Tab)

WTFPOS stores session state in `sessionStorage` (which is natively isolated per-tab) but database state in `IndexedDB` (which is shared per-origin across tabs).

Because of this architecture, you should **never open multiple browsers** to simulate multiple roles. Instead, use **multiple tabs within the same browser session**. 

For all tests, pass the `-s=${_ux_run_id}` flag to isolate your audit workflow from other potential runs on the same machine.

**Approach 1: Single-Tab Sequential (Simulating a Shared Shared Device)**
If staff and manager share the exact same physical tablet, sequentially swap their sessions in Tab 0:
```bash
# Order taken
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Ate Rose","role":"staff","locationId":"tag","isLocked":true}'
playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/pos"

# Manager overrides
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Sir Dan","role":"manager","locationId":"tag","isLocked":false}'
playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/reports/voids"
```

**Approach 2: Multi-Tab Parallel (Simulating Multiple Physical Tablets)**
If simulating real-time sync (e.g. Staff fires order on tablet A, Kitchen receives it on tablet B), map each role to a different tab!

```bash
# Tab 0: Staff tablet
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Ate Rose","role":"staff",...}'
playwright-cli -s=${_ux_run_id} goto "http://localhost:5173/pos"

# Tab 1: Create new tab for Kitchen
playwright-cli -s=${_ux_run_id} tab-new "http://localhost:5173/kitchen/orders"
playwright-cli -s=${_ux_run_id} sessionstorage-set wtfpos_session '{"userName":"Kuya Marc","role":"kitchen",...}'
playwright-cli -s=${_ux_run_id} reload # Reload so tab 1 picks up its new session

# Now interact across tabs to test real-time IndexedDB sync!
playwright-cli -s=${_ux_run_id} tab-select 0
playwright-cli -s=${_ux_run_id} click e5  # Staff fires the order

playwright-cli -s=${_ux_run_id} tab-select 1
playwright-cli -s=${_ux_run_id} snapshot # Check if the ticket instantly appeared on the kitchen display!
```
*Why this is perfect:* IndexedDB triggers local sync events across tabs instantly, perfectly mirroring the intended multi-tablet network behavior without the hassle of multi-browser profiles."""

if old_pc2 not in content:
    print("Failed to find PC-2")
else:
    content = content.replace(old_pc2, new_pc2)
    with open("skills/ux-audit/SKILL.md", "w") as f:
        f.write(content)
    print("Done")
