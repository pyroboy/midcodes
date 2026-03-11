import re

file_path = "skills/ux-audit/SKILL.md"

with open(file_path, "r") as f:
    content = f.read()

# Modify the SKILL.md audit workflow steps
old_step_text = """7. **Snapshot + Checkpoint** — after each meaningful interaction
8. **Multi-User Switch (If Applicable)** — Swap session token + `goto` new route in **same browser** (see PC-2)
9. **Close** — `playwright-cli -s=${_ux_run_id} close`"""

new_step_text = """7. **Snapshot + Checkpoint** — after each meaningful interaction
8. **Multi-User Switch (If Applicable)** — Use a multi-tab approach for multi-role syncing (see PC-2).
   > **CRITICAL RULE FOR ORDER FLOWS:** After all staff cashier input for table orders, you MUST perform kitchen staff inputs first (i.e. to "serve" the table) before you proceed to checkout. A table cannot be checked out until it has been served by the kitchen!
9. **Close** — `playwright-cli -s=${_ux_run_id} close`"""

if old_step_text in content:
    content = content.replace(old_step_text, new_step_text)
else:
    print("Warning: could not find exact text match. Attempting fuzzy replace on step 8...")
    content = re.sub(
        r'8\.\s*\*\*Multi-User Switch.*?\n9\.', 
        r'8. **Multi-User Switch (If Applicable)** — Use a multi-tab approach for multi-role syncing (see PC-2).\n   > **CRITICAL RULE FOR ORDER FLOWS:** After all staff cashier input for table orders, you MUST perform kitchen staff inputs first (i.e. to "serve" the table) before you proceed to checkout. A table cannot be checked out until it has been served by the kitchen!\n9.', 
        content,
        flags=re.DOTALL
    )

with open(file_path, "w") as f:
    f.write(content)

print("Updated SKILL.md with checkout flow rule.")
