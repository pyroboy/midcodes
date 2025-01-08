# List View Pattern (Search + Table)

## Search Section
```svelte
<!-- Search and Filters -->
<div class="w-full space-y-4 mb-4">
  <div class="flex gap-4">
    <!-- Search Input -->
    <div class="flex-1">
      <Input
        type="search"
        placeholder="Search *ENTITIES*..."
        bind:value={searchFilters.searchTerm}
      />
    </div>
    
    <!-- Optional Filters -->
    <Select
      bind:value={searchFilters.*FIELD_1*}
      options={[
        { value: null, label: 'All *FIELD_1*' },
        ...data.*FIELD_1_OPTIONS*.map(opt => ({
          value: opt.id,
          label: opt.name
        }))
      ]}
    />
  </div>

  <!-- Results Count -->
  <div class="text-sm text-muted-foreground">
    Showing {filtered*ENTITIES*.length} of {data.*ENTITIES*.length} *ENTITIES*
  </div>
</div>
```

## Table Section
```svelte
<Card>
  <CardContent class="p-0">
    <!-- Table Header -->
    <div class="grid grid-cols-[*COLUMN_LAYOUT*] gap-4 p-4 font-medium border-b bg-muted/50">
      <!-- Column Headers -->
      <div class="flex items-center">*FIELD_1*</div>
      <div class="flex items-center">*FIELD_2*</div>
      <div class="flex items-center">Status</div>
      <div class="flex items-center justify-end">Actions</div>
    </div>

    <!-- Table Body -->
    {#if filtered*ENTITIES*?.length > 0}
      {#each filtered*ENTITIES* as entity (entity.id)}
        <div class="grid grid-cols-[*COLUMN_LAYOUT*] gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0">
          <!-- Main Column -->
          <div class="font-medium">
            {entity.*MAIN_FIELD*}
            {#if entity.*SUB_FIELD*}
              <div class="text-sm text-muted-foreground">
                {entity.*SUB_FIELD*}
              </div>
            {/if}
          </div>

          <!-- Regular Column -->
          <div>{entity.*FIELD_2* || '-'}</div>

          <!-- Status Badge -->
          <div>
            <Badge variant={entity.badgeVariant}>
              {entity.status}
            </Badge>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              on:click={() => dispatch('edit', entity)}
              disabled={!data.isAdminLevel && !data.isStaffLevel}
            >
              <EditIcon size={16} class="mr-2" />
              Edit
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              on:click={() => handleDelete(entity)}
              disabled={!data.isAdminLevel}
            >
              <TrashIcon size={16} class="mr-2" />
              Delete
            </Button>
          </div>
        </div>
      {/each}
    {:else}
      <div class="p-4 text-center text-muted-foreground">
        No *ENTITIES* found
      </div>
    {/if}
  </CardContent>
</Card>
```

## Required State and Functions
```typescript
// Search State
interface SearchFilters {
  searchTerm: string;
  *FIELD_1*: string | null;
  // Add more filter fields as needed
}

// Initialize search state
let searchFilters: SearchFilters = {
  searchTerm: '',
  *FIELD_1*: null
};

// Filtering Logic
$: filtered*ENTITIES* = data.*ENTITIES*.filter(item => {
  const matchesSearch = searchFilters.searchTerm === '' || 
    item.*SEARCHABLE_FIELD*.toLowerCase().includes(searchFilters.searchTerm.toLowerCase());
    
  const matches*FIELD_1* = !searchFilters.*FIELD_1* || 
    item.*FIELD_1* === searchFilters.*FIELD_1*;

  return matchesSearch && matches*FIELD_1*;
});

// Delete Handler
async function handleDelete(entity: *ENTITY*) {
  if (!confirm(`Are you sure you want to delete ${entity.*MAIN_FIELD*}?`)) {
    return;
  }

  try {
    const result = await fetch('?/delete', {
      method: 'POST',
      body: JSON.stringify({ id: entity.id })
    });
    
    if (result.ok) {
      dispatch('deleteSuccess');
    } else {
      const response = await result.json();
      alert(`Failed to delete: ${response.message}`);
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Failed to delete. Please try again.');
  }
}

// Event Dispatcher
const dispatch = createEventDispatcher<{
  edit: *ENTITY*;
  deleteSuccess: void;
}>();
```

## Variables to Replace
1. *COLUMN_LAYOUT* - Grid template columns (e.g., "2fr 1fr 1fr 2fr")
2. *FIELD_1*, *FIELD_2* - Column headers and field names
3. *ENTITIES* - Plural form of your entity
4. *ENTITY* - Singular form of your entity
5. *MAIN_FIELD* - Primary field to display
6. *SUB_FIELD* - Secondary field for additional info
7. *SEARCHABLE_FIELD* - Field to search by
8. *FIELD_1_OPTIONS* - Array of options for filtering

## Success Indicators
✓ Search instantly filters results
✓ Filters can be combined
✓ Table is responsive
✓ Action buttons have proper authorization
✓ Delete has confirmation
✓ Empty states are handled
✓ Events are properly typed
✓ Loading states work correctly (if added)
✓ Error states show feedback
✓ Results count updates correctly