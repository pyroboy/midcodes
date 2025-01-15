# SvelteKit Client Pattern Instructions

## GOAL
Congratulations on implementing your SvelteKit client-side code! By following this pattern, you'll create:

- ⚡ A clean, modular client implementation with List and Form components
- 🛡️ Type-safe form handling with superforms and zod client validation
- 🎯 Proper state management for editing and creating records
- ✨ Reusable component structure that scales well
- 🏆 Consistent UI layout with card-based form and list views

Success Indicators:
✓ Components are properly split into List and Form
✓ SuperForm is correctly configured with all required options
✓ Form validation works on both client and server side
✓ Edit and Create modes work independently
✓ State management handles all edge cases
✓ TypeScript types are properly defined and used
✓ Event handlers are properly typed and implemented
✓ UI updates reflect state changes immediately
✓ Error messages are displayed in the correct locations
✓ Form resets work correctly after operations
✓ Delete operations have confirmation steps
✓ Loading states are properly handled
✓ Component event communication follows correct pattern:

Component Events (↑ up events, ↓ down props):

*ENTITY*List.svelte
↑ Dispatches:
  • on:edit → +page.svelte (with entity details)
  • on:deleteSuccess → +page.svelte
↓ Receives:
  • data={data}
  • eventHandlers={handlers}

+page.svelte (Parent)
↓ To List:
  • Passes data and event handlers
↓ To Form:
  • Passes form bindings and state
↑ Handles:
  • edit events from List
  • save/cancel events from Form

*ENTITY*Form.svelte
↑ Dispatches:
  • on:cancel → +page.svelte
  • on:*ENTITY*Saved → +page.svelte
↓ Receives:
  • form={form}
  • errors={errors}
  • enhance={enhance}
  • constraints={constraints}
  • submitting={submitting}

Event Flow Summary:
1. List sends edit/delete events up
2. Parent handles events, updates state
3. Parent passes updated props down
4. Form sends save/cancel events up
5. Parent resets state as needed

## File Structure
```
src/routes/*YOUR_ROUTE*/
├── +page.server.ts    // Server endpoints (from previous pattern)
├── +page.svelte      // Main client page (THIS FILE)
├── *ENTITY*List.svelte    // List component
├── *ENTITY*Form.svelte    // Form component
└── formSchema.ts     // Shared schema definitions
```

## Base Template
```typescript
<script lang="ts">
  // 1. Core Imports
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { *SCHEMA_NAME*, type *TYPE_NAME* } from './formSchema';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import *ENTITY*List from './*ENTITY*List.svelte';
  import *ENTITY*Form from './*ENTITY*Form.svelte';
  import type { PageData } from './$types';

  // 2. Define Types
  interface *ENTITY*Data {
    id: number;
    // ... other fields
  }

  // 3. Component Props
  export let data: PageData;

  // 4. State Management

  // Tracks whether we're in edit mode or create mode
  let editMode = false;

  // Stores the currently selected entity for editing
  // - *ENTITY*Data: The full type of your entity with all its properties
  // - undefined: When no entity is selected (create mode or after cancel/save)
  // Example: let selectedTenant: TenantData | undefined;
  //         let selectedProperty: PropertyData | undefined;
  // Used to:
  // 1. Populate form when editing
  // 2. Track which entity is being modified
  // 3. Reset state after operations
  let selected*ENTITY*: *ENTITY*Data | undefined;

  // 5. Form Setup
  const { form, enhance, errors, constraints, submitting } = superForm(data.form, {
    id: '*ENTITY*-form',
    validators: zodClient(*SCHEMA_NAME*),
    validationMethod: 'onblur',
    dataType: 'json',
    delayMs: 10,
    taintedMessage: null,
    resetForm: true,
    onError: ({ result }) => {
      console.error('Form validation errors:', result.error);
    },
    onResult: ({ result }) => {
      if (result.type === 'success') {
        selected*ENTITY* = undefined;
        editMode = false;
        handleCreate(); // Reset form
      }
    }
  });

  // 6. Event Handlers
  function handleEdit(entity: *ENTITY*Data) {
    editMode = true;
    selected*ENTITY* = entity;
    
    $form = {
      id: entity.id,
      // ... map other fields
    };
  }

  function handleCreate() {
    selected*ENTITY* = undefined;
    editMode = false;
    
    $form = {
      id: 0,
      // ... default values
    };
  }

  function handleCancel() {
    selected*ENTITY* = undefined;
    editMode = false;
  }

  function handleDeleteSuccess() {
    selected*ENTITY* = undefined;
    editMode = false;
  }
</script>

<!-- 7. Layout Structure -->
<div class="container mx-auto p-4 flex">
  <!-- List Component -->
  <*ENTITY*List
    {data}
    on:edit={event => handleEdit(event.detail)}
    on:deleteSuccess={handleDeleteSuccess}
  />

  <!-- Form Component -->
  <div class="w-1/3 pl-4">
    <Card>
      <CardHeader>
        <CardTitle>{editMode ? 'Edit' : 'Add'} *ENTITY*</CardTitle>
      </CardHeader>
      <CardContent>
        <*ENTITY*Form
          {data}
          {editMode}
          {form}
          {errors}
          {enhance}
          {constraints}
          {submitting}
          entity={selected*ENTITY*}
          on:cancel={handleCancel}
          on:*ENTITY*Saved={() => {
            selected*ENTITY* = undefined;
            editMode = false;
          }}
        />
      </CardContent>
    </Card>
  </div>
</div>
```

## Variables to Replace
1. *ENTITY* - Your entity name (e.g., Tenant, Property)
2. *SCHEMA_NAME* - Your Zod schema name (e.g., tenantFormSchema)
3. *TYPE_NAME* - Your TypeScript type name (e.g., TenantFormData)

## Required Components
1. *ENTITY*List.svelte
   - Handles displaying data in a list/table format
   - Emits edit and delete events
   - Manages its own layout/styling

2. *ENTITY*Form.svelte
   - Handles form inputs and validation
   - Uses provided superForm bindings
   - Emits cancel and save events

## State Management
1. editMode: boolean
   - Tracks if we're editing or creating
2. selected*ENTITY*: *ENTITY*Data | undefined
   - Currently selected item for editing
3. form: superForm store
   - Handles form state and validation

## Event Flow
1. List → Parent: edit, deleteSuccess
2. Form → Parent: cancel, *ENTITY*Saved
3. Parent → Components: data, form bindings

## Tips
- Keep form reset logic in handleCreate()
- Use consistent event naming
- Maintain clear type definitions
- Follow the container/component pattern
- Use Card components for consistent layout
- Handle all form states (submitting, error, success)