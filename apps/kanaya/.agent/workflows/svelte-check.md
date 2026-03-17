---
description: How to check for Svelte/TypeScript errors in the id-gen app
---

# Check for Svelte Errors

// turbo-all

1. Navigate to the id-gen app directory:

```powershell
cd c:\Users\jezka\Documents\GitHub\midcodes\apps\id-gen
```

2. Run svelte-check to find errors:

```powershell
npx svelte-check --tsconfig ./tsconfig.json --threshold error 2>&1 | Out-File -FilePath check-output.txt -Encoding utf8
```

**Note:** Always use `npx` instead of `pnpm` for running svelte-check commands.
