import re

with open("skills/ux-audit/SKILL.md", "r") as f:
    content = f.read()

# Replace PC-2 entirely
old_pc2 = """### PC-2 — Simulating Multi-User Environments (Single vs Multi-Browser)

You actually *can* run multiple browsers at once using `playwright-cli` Named Sessions, but you must choose the right architectural approach for your scenario.

**Approach 1: Single-Browser Sequential Swapping (Recommended for Shared Tablet)**
If you are testing a scenario where multiple roles share the same physical device (e.g., Staff logs order, hands tablet to Manager for void approval), use the default global session. Swap credentials and `goto` sequentially:
```bash
# Order taken
playwright-cli sessionstorage-set wtfpos_session '{"userName":"Ate Rose","role":"staff","locationId":"tag","isLocked":true}'
playwright-cli goto "http://localhost:5173/pos"

# Manager overrides
playwright-cli sessionstorage-set wtfpos_session '{"userName":"Sir Dan","role":"manager","locationId":"tag","isLocked":false}'
playwright-cli goto "http://localhost:5173/reports/voids"
```
*Why this is good:* It perfectly shares the local RxDB/IndexedDB state exactly as a single device would.

**Approach 2: Multi-Browser Parallel Sessions (Recommended for Multiple Tablets)**
If you are testing real-time sync between two different stations (e.g., Staff fires order on `tablet-1`, Kitchen receives ticket on `tablet-2`), use the `-s` flag to spawn parallel browsers.

```bash
# Open Staff browser (Session A)
playwright-cli -s=staff --headed open "http://localhost:5173"
playwright-cli -s=staff sessionstorage-set wtfpos_session '{"role":"staff", ...}'
playwright-cli -s=staff goto "http://localhost:5173/pos"

# Open Kitchen browser (Session B)
playwright-cli -s=kitchen --headed open "http://localhost:5173"
playwright-cli -s=kitchen sessionstorage-set wtfpos_session '{"role":"kitchen", ...}'
playwright-cli -s=kitchen goto "http://localhost:5173/kitchen/orders"

# Interact across them
playwright-cli -s=staff click e5  # Fires the order
playwright-cli -s=kitchen snapshot # Checks if the ticket appeared instantly
```

> **Warning on `--persistent` with Multi-Browser:** Chrome limits a persistent profile directory to one active browser instance. If you use `-s` for multiple browsers, you cannot use the same `--persistent` profile path for both. For multi-browser tests, drop `--persistent` and rely on memory-only IndexedDB, or explicitly map them to different `--profile=/path` directories if persistence is absolutely required."""

new_pc2 = """### PC-2 — Simulating Multi-User Environments (Same-Browser Swapping)

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

if old_pc2 not in content:
    print("Failed to find PC-2")

content = content.replace(old_pc2, new_pc2)

# Specific lines replacements:
lines = content.split('\n')
for i in range(120, min(650, len(lines))):
    if "playwright-cli" in lines[i] and not lines[i].startswith("playwright-cli -s="):
        # Avoid double replacing or replacing descriptions
        if "playwright-cli" in lines[i] and not "playwright-cli -s=${_ux_run_id}" in lines[i] and not "playwright-cli (" in lines[i] and not "run consecutive `playwright-cli`" in lines[i].lower() and not "every `playwright-cli`" in lines[i].lower() and not "`playwright-cli`" in lines[i] and not "bare: playwright-cli" in lines[i]:
            # Regex to replace playwright-cli followed by a space
            lines[i] = re.sub(r'playwright-cli ([a-zA-Z0-1\-])', r'playwright-cli -s=${_ux_run_id} \1', lines[i])

# Fix any special cases we missed or didn't want to replace directly:
content = '\n'.join(lines)
content = content.replace("```\nplaywright-cli click e86", "```\nplaywright-cli -s=${_ux_run_id} click e86")
content = content.replace("`playwright-cli goto", "`playwright-cli -s=${_ux_run_id} goto")

# Check if there's any bare playwright-cli inside backticks
content = content.replace('`playwright-cli sessionstorage-set', '`playwright-cli -s=${_ux_run_id} sessionstorage-set')
content = content.replace('`playwright-cli resize', '`playwright-cli -s=${_ux_run_id} resize')
content = content.replace('`playwright-cli close', '`playwright-cli -s=${_ux_run_id} close')
content = content.replace('`playwright-cli click`', '`playwright-cli -s=${_ux_run_id} click`')
content = content.replace('bare: playwright-cli snapshot', 'bare: playwright-cli -s=${_ux_run_id} snapshot')
content = content.replace('playwright-cli -s=${_ux_run_id} -cli', 'playwright-cli') # Fix any double match weirdness just in case

with open("skills/ux-audit/SKILL.md", "w") as f:
    f.write(content)

print("Done")
