---
description: How to check for Svelte/TypeScript errors in the id-gen app and fix common warnings
---
# Check for Svelte Errors

// turbo-all

## Running Svelte Check

1. Navigate to the id-gen app directory:
```bash
cd /Users/arjomagno/Documents/GitHub/midcodes/apps/id-gen
```

2. Run svelte-kit sync to generate types:
```bash
npx svelte-kit sync
```

3. Run svelte-check to find errors and warnings:
```bash
npx svelte-check 2>&1 | head -200
```

4. For quick check (errors only, truncated output):
```bash
npx svelte-check --threshold error 2>&1 | head -100
```

**Note:** Always use `npx` instead of `pnpm` for running svelte-check commands.

## Common Warnings and Fixes

### a11y_label_has_associated_control
**Problem:** Form label not associated with a control (e.g., slider inputs)
**Fix Options:**
1. Add `for` attribute to label and `id` to input
2. Or add svelte-ignore comment for debug/non-essential UI:
```svelte
<!-- svelte-ignore a11y_label_has_associated_control -->
<label>Label text</label>
```

### state_referenced_locally
**Problem:** Data prop captured outside reactive context
**Fix Options:**
1. Use `$derived` for read-only values:
```typescript
const items = $derived(data.items);
```

2. For mutable state that intentionally captures initial value, add ignore comment:
```typescript
// svelte-ignore state_referenced_locally
let items = $state([...data.items]);
```

3. **IMPORTANT:** You cannot nest `$derived` inside `$state`:
```typescript
// ❌ WRONG - causes error
let items = $state($derived.by(() => data.items));

// ✅ CORRECT - use one or the other
let items = $derived(data.items);  // read-only reactive
// OR
// svelte-ignore state_referenced_locally
let items = $state([...data.items]);  // mutable, initial snapshot
```
