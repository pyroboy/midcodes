<script lang="ts">
  import { superForm } from 'sveltekit-superforms/client';
  import { Button } from '$lib/components/ui/button';
  import type { PageData } from './$types';
  import PropertyForm from './PropertyForm.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { formatDateTime } from '$lib/utils';
  import { invalidate } from '$app/navigation';

  export let data: PageData;

  // Make data reactive
  $: ({ properties, form } = data);

  let editMode = false;
  let selectedProperty: any | undefined;

  function handlePropertyClick(property: any) {
    console.log('Property selected for editing:', {
      id: property.id,
      name: property.name
    });
    
    selectedProperty = property;
    editMode = true;
  }



  function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
    switch (status) {
      case 'ACTIVE':
        return 'secondary';
      case 'INACTIVE':
        return 'destructive';
      case 'MAINTENANCE':
        return 'outline';
      default:
        return 'default';
    }
  }

  async function handleDeleteProperty(property: any) {
    if (!confirm(`Are you sure you want to delete property ${property.name}? This action cannot be undone.`)) {
      return;
    }

    
    const formData = new FormData();
    formData.append('id', property.id.toString());
    
    try {
      const result = await fetch('?/delete', {
        method: 'POST',
        body: formData
      });
      
      const response = await result.json();
      
      if (result.ok) {
        selectedProperty = undefined;
        editMode = false;
        await invalidate('app:properties');
        alert('Property deleted successfully');
      } else {
        console.error('Delete failed:', response);
        alert(`Failed to delete property: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      alert(`Error deleting property: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
</script>

<div class="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
  <div class="w-full lg:w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Properties</h1>
    </div>
    <Card.Root>
      <Card.Content class="p-0">
        <div class="grid grid-cols-[2fr_2fr_1fr_1fr_2fr] gap-4 p-4 font-medium border-b bg-muted/50">
          <div class="flex items-center">Name</div>
          <div class="flex items-center">Address</div>
          <div class="flex items-center">Type</div>
          <div class="flex items-center">Status</div>
          <div class="flex items-center">Actions</div>
        </div>

        {#if properties?.length > 0}
          {#each properties as property (property.id)}
            <div class="grid grid-cols-[2fr_2fr_1fr_1fr_2fr] gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0">
              <div class="font-medium">{property.name}</div>
              <div>{property.address}</div>
              <div>{property.type}</div>
              <div>
                <Badge variant={getStatusVariant(property.status)}>
                  {property.status}
                </Badge>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  on:click={() => handlePropertyClick(property)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  on:click={() => handleDeleteProperty(property)}
                  disabled={false}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                  </svg>
                  Delete
                </Button>
              </div>
            </div>
          {/each}
        {:else}
          <div class="p-4 text-center text-muted-foreground">
            No properties found
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
</div>

    

  <div class="w-full lg:w-1/3">
    <Card.Root>
      <Card.Header>
        <Card.Title>{editMode ? 'Edit' : 'Add'} Property</Card.Title>
      </Card.Header>
      <Card.Content>
        <PropertyForm
          {data}
          {editMode}
          property={selectedProperty}
          on:propertyAdded={async () => {
            selectedProperty = undefined;
            editMode = false;
            await invalidate('app:properties');
          }}
        />
      </Card.Content>
    </Card.Root>
  </div>
</div>
