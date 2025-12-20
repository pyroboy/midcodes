---
allowed-tools:
  - Bash(npm run*)
  - Bash(git*)
argument-hint: [feature-name]
description: Check build status and lint before speedrun commit
---

!`git status`

Running speedrun pre-commit checks for: **$ARGUMENTS**

!`npm run check`
!`npm run build`

If all checks pass, create a commit with:

- Concise message about $ARGUMENTS
- Follow project commit style
- Include co-authorship footer

Report any failures and suggest fixes.
