import re

file_path = "skills/ux-audit/SKILL.md"
with open(file_path, "r") as f:
    content = f.read()

# 1. Update the Workflow steps
# Add Step 2 — Present Scenario Plan
# Change old Step 2-4 and renumber

content = content.replace("### Step 2 — Read References and Component Source", "### Step 2 — Read References and Component Source\n\nRead the relevant `.svelte` component source files to identify how the page should flow and find stable selectors.\n\n### Step 3 — Present Scenario Plan (MANDATORY)\n\n**DO NOT OPEN THE BROWSER YET.**\n\nBefore running any CLI commands, you MUST explicitly write out a step-by-step **Scenario Plan** to the user. This plan dictates exactly what you will do during the interactive session.\n\nExample:\n> **Scenario Plan:**\n> 1. Login as Staff at Tagbilaran.\n> 2. Open an available table on `/pos`.\n> 3. Add 1 Pork Unlimited package.\n> 4. Switch tab/session to Kitchen.\n> 5. Wait for the ticket to appear and serve the table.\n> 6. Switch back to Staff and Checkout the order.\n\nOnly proceed to Step 4 after the plan is defined.")

# Renumber Step 3 to 4, 4 to 5, etc.
content = content.replace("### Step 3 — Workspace Setup", "### Step 4 — Workspace Setup")
content = content.replace("### Step 4 — Interactive Browser Session", "### Step 5 — Interactive Browser Session")
content = content.replace("### Step 5 — Write Report + Save Spec", "### Step 6 — Write Report + Save Spec")
content = content.replace("### Step 6 — Fast Replay (Regression Check)", "### Step 7 — Fast Replay (Regression Check)")

# Now fix the end of Step 7 (Cleanup) and add the Failure State & Loop
cleanup_header = "### Step 7 — Clean Up & Respond"
content = content.replace(cleanup_header, "### Step 8 — Report Delivery & Loop\n\n```bash\nrm -rf \"$_ux_work\"\n```\n\n#### Output Format Rules\n\nDepending on how the session went, follow the exact response format:\n\n**Scenario A: Audit Failed (Bug/Blocker)**\nIf the browser crashed or you hit a bug that prevented you from finishing the Scenario Plan:\n1. Save the **Scenario Plan** tracking text to a new file: `skills/ux-audit/plans/YYYY-MM-DD_<name>.md`.\n2. Save the **UX Audit Report** to `audits/` noting exactly which step the plan failed.\n3. Save the **Spec Replay** up until the failure to `skills/ux-audit/specs/`.\n4. **Final message MUST state:** \"Report saved to `...`. I have saved 3 files: an audit report, a replayable spec, and a file for the failed scenario plan.\"\n5. **Summary Display:** Display the summary of the audit, putting the **Structural Proposals FIRST**, followed by the issue list.\n6. **Gated Questions:** Ask the user TWO questions at once:\n   - \"Would you like me to apply these fixes?\"\n   - \"Should we retry the scenario plan after?\"\n> *Do not automatically loop. Wait for user input.*\n\n**Scenario B: Audit Passed (Smooth Flow)**\nIf you reached the end of the Scenario Plan successfully:\n1. Confirmation: audit report saved to `audits/` AND spec saved to `specs/`\n2. **Summary Display:** Display the summary, putting **Structural Proposals FIRST**.\n3. **Full issue list** — list EVERY finding from the audit.\n4. **Overall recommendation** — A single, opinionated sentence\n5. **HITL: Fix Selection Gate** — Ask the user which issues to fix right now.")

# Remove the old step 7 clean up text since we completely replaced it above
old_cleanup_body = """**Final response to the user must be:**
1. Confirmation: audit report saved to `audits/` AND spec saved to `specs/`
2. **Full issue list** — list EVERY finding from the audit.
3. **Structural proposals** (if any)
4. **Overall recommendation** — A single, opinionated sentence
5. **HITL: Fix Selection Gate** — Ask the user which issues to fix right now."""

content = content.replace(old_cleanup_body, "")

with open("skills/ux-audit/SKILL.md", "w") as f:
    f.write(content)

print("Updated SKILL.md")
