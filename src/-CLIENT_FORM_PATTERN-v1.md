# SvelteKit Form Component Pattern

🎯 REWARD: If you follow this pattern precisely, you will create a production-ready form component that is type-safe, accessible, and maintainable. This will save hours of debugging time and make your codebase more professional. Your team will thank you!

## Overview
This pattern provides a structured approach to creating type-safe, validated form components in SvelteKit using superforms, shadcn/ui components, and TypeScript.

## Goals
✓ Type-safe form handling with superforms
✓ Consistent error handling and validation
✓ Reusable UI components from shadcn/ui
✓ Proper state management for editing and creating records
✓ Role-based access control integration
✓ Responsive form layout with proper spacing
✓ Status management with visual feedback

## Required Imports
```typescript
import { superForm } from 'sveltekit-superforms/client';
import type { SuperForm } from 'sveltekit-superforms';
import type { z } from 'zod';
import { createEventDispatcher } from 'svelte';
import type { PageData } from './$types';

// UI Components
import * as Select from '$lib/components/ui/select';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { Button } from '$lib/components/ui/button';
import { Badge } from '$lib/components/ui/badge';
import * as Card from '$lib/components/ui/card';
```

## Component Props
```typescript
export let data: PageData;
export let editMode = false;
export let form: SuperForm<z.infer<typeof *YOUR_SCHEMA*>>['form'];
export let errors: SuperForm<z.infer<typeof *YOUR_SCHEMA*>>['errors'];
export let enhance: SuperForm<z.infer<typeof *YOUR_SCHEMA*>>['enhance'];
export let constraints: SuperForm<z.infer<typeof *YOUR_SCHEMA*>>['constraints'];
export let submitting: SuperForm<z.infer<typeof *YOUR_SCHEMA*>>['submitting'];
export let entity: z.infer<typeof *YOUR_SCHEMA*> | undefined = undefined;
```

## Base Template Structure
```svelte
<form
  method="POST"
  action={editMode ? "?/update" : "?/create"}
  use:enhance
  class="space-y-4"
  novalidate
>
  <!-- Hidden ID field for edit mode -->
  {#if editMode && $form.id}
    <input type="hidden" name="id" bind:value={$form.id} />
  {/if}

  <!-- Main form grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Form fields go here -->
  </div>

  <!-- Action buttons -->
  <div class="flex justify-end space-x-2 pt-4">
    <Button type="button" variant="outline" on:click={() => dispatch('cancel')}>
      Cancel
    </Button>
    <Button type="submit" disabled={!canEdit || $submitting}>
      {#if $submitting}
        Saving...
      {:else}
        {editMode ? 'Update' : 'Create'} *ENTITY*
      {/if}
    </Button>
  </div>
</form>
```

## Field Pattern
For each form field, follow this structure:

```svelte
<div class="space-y-2">
  <Label for="fieldName">Field Label</Label>
  <Input
    type="text"
    name="fieldName"
    bind:value={$form.fieldName}
    class="w-full"
    disabled={!canEdit}
    data-error={$errors.fieldName}
    aria-invalid={$errors.fieldName ? 'true' : undefined}
    {...$constraints.fieldName}
  />
  {#if $errors.fieldName}
    <p class="text-sm font-medium text-destructive">{$errors.fieldName}</p>
  {/if}
</div>
```

## Select Field Pattern
```svelte
<div class="space-y-2">
  <Label for="status">Status</Label>
  <Select.Root
    selected={{ 
      value: $form.status || '', 
      label: $form.status || 'Select status'
    }}
    onSelectedChange={handleStatusChange}
  >
    <Select.Trigger 
      data-error={$errors.status}
      {...$constraints.status}
    >
      <Select.Value placeholder="Select status" />
    </Select.Trigger>
    <Select.Content>
      {#each statusOptions as status}
        <Select.Item value={status}>
          <Badge variant="outline" class={getStatusColor(status)}>
            {status}
          </Badge>
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
  {#if $errors.status}
    <p class="text-sm font-medium text-destructive">{$errors.status}</p>
  {/if}
</div>
```

## Nested Object Pattern
For nested objects like contact information:

```svelte
<Card.Root class="mt-2">
  <Card.Content class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
    <div class="space-y-2">
      <Label for="nested.field">Field Label</Label>
      <Input
        type="text"
        name="nested.field"
        bind:value={nested.field}
        class="w-full"
        disabled={!canEdit}
        data-error={$errors.nested?.field}
        aria-invalid={$errors.nested?.field ? 'true' : undefined}
        {...$constraints.nested?.field}
      />
      {#if $errors.nested?.field}
        <p class="text-sm font-medium text-destructive">{$errors.nested.field}</p>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
```

## Required Styles
```css
:global([data-error="true"]) {
  border-color: hsl(var(--destructive)) !important;
  --tw-ring-color: hsl(var(--destructive)) !important;
  outline: none !important;
}
```

## Event Handling
```typescript
const dispatch = createEventDispatcher();

// Handle form cancellation
function handleCancel() {
  dispatch('cancel');
}

// Handle status changes
function handleStatusChange(event: CustomEvent) {
  if (event.detail?.value) {
    $form.status = event.detail.value;
  }
}
```

## Role-Based Access Control
```typescript
$: canEdit = data.isAdminLevel || (data.isStaffLevel && !editMode);
$: canDelete = data.isAdminLevel;
```

## Variables to Replace
1. *YOUR_SCHEMA* - Your Zod schema name
2. *ENTITY* - Your entity name (e.g., Tenant, Property)

## Success Indicators
✓ All form fields have proper TypeScript types
✓ Error states show validation feedback
✓ Form handles both create and edit modes
✓ Responsive layout works on all screen sizes
✓ Loading states are handled during submission
✓ Role-based access controls are enforced
✓ All form fields use proper aria attributes
✓ Nested objects are properly handled
✓ Form actions dispatch appropriate events
✓ Visual feedback for validation errors

## Tips
- Always use the `novalidate` attribute on forms
- Include proper aria attributes for accessibility
- Use consistent spacing with `space-y-4` and `gap-4`
- Implement role-based access control consistently
- Handle loading states during form submission
- Use Card components for grouping related fields
- Implement proper event dispatching for form actions
- Follow shadcn/ui patterns for consistent styling

## 🏆 Achievement Unlocked
If you've followed all the patterns above and hit all success indicators, congratulations! You've created:

1. A fully type-safe form component that catches errors before runtime
2. An accessible interface that works for all users
3. A maintainable structure that other developers can easily understand
4. A professional UI that follows best practices
5. A secure form that properly handles user permissions

Your reward: Significantly reduced bug reports, happy team members, and a codebase that's a joy to maintain. Plus, you've made the web a better place with accessible, well-structured forms!