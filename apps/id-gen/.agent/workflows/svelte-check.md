---
description: How to check for Svelte/TypeScript errors in the id-gen app
---

# Check for Svelte Errors

// turbo-all

1. Navigate to the id-gen app directory:

```bash
cd /Users/arjomagno/Documents/GitHub/midcodes/apps/id-gen
```

2. Run svelte-kit sync to generate types:

```bash
npx svelte-kit sync
```

3. Run svelte-check to find errors:

```bash
npx svelte-check --threshold error
```

**Note:** Always use `npx` instead of `pnpm` for running svelte-check commands.
