---
name: user-scenarios
description: >
  Generates comprehensive, real-world user scenarios and an implementation assessment for a
  specific WTFPOS role and location. Use when the user says "create user-scenarios as <role>",
  "generate scenarios for <role>", "user scenarios for <role> role", or "create user-scenarios
  as <role> at <branch>". Produces two saved output files (scenarios + assessment) and prints
  a chat summary with a readiness score. Roles: staff, kitchen, manager, owner, admin.
  Also triggers on "create user-scenarios", "generate scenarios", "role journeys", "scenario
  generation", "as manager", "as staff", "as kitchen", "as owner", "as admin".
---

# User Scenarios — WTFPOS

Generates 15–25 real-world, location-scoped, end-to-end scenarios for a specific WTFPOS role,
then produces an implementation assessment mapping each scenario to IMPLEMENTED / PARTIAL / MISSING.

**Full skill definition:** `skills/user-scenarios/SKILL.md`
**Quick-ref context:** `skills/user-scenarios/references/SCENARIO_CONTEXT.md`

Read `skills/user-scenarios/SKILL.md` before starting — it contains the 8-step workflow,
output templates, Human-in-the-Loop gates, and self-improvement protocol.
