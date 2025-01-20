  <script lang="ts">
    import Rental_UnitForm from './Rental_UnitForm.svelte';
    import { Badge } from '$lib/components/ui/badge';
    import { Button } from '$lib/components/ui/button';
    import { superForm } from 'sveltekit-superforms/client';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { rental_unitSchema } from './formSchema';
    import type { SuperValidated } from 'sveltekit-superforms';
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import type { z } from 'zod';
    import type { Rental_unit } from './formSchema';

    interface PageData {
      rental_unit: Array<Rental_unit & {
        property: { name: string };
        floor: { floor_number: number; wing?: string };
      }>;
      properties: Array<{ id: number; name: string }>;
      floors: Array<{ id: number; property_id: number; floor_number: number; wing?: string }>;
      form: SuperValidated<z.infer<typeof rental_unitSchema>>;
      user: { role: string } | null;
    }

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();

    const { form, enhance, errors, constraints, message } = superForm(data.form, {
      id: 'rental_unit-form',
      validators: zodClient(rental_unitSchema),
      validationMethod: 'oninput',
      dataType: 'json',
      delayMs: 10,
      taintedMessage: null,
      onError: ({ result }) => {
        console.error('Form submission error:', result.error);
        if (result.error) {
          console.error('Server error:', result.error.message);
        }
      },
      onResult: ({ result }) => {
        if (result.type === 'success') {
          selectedRental_Unit = undefined;
          editMode = false;
        } else if (result.type === 'failure') {
          console.error('Form submission failed:', result);
        }
      }
    });

    let editMode = $state(false);
    let selectedRental_Unit: Rental_unit | undefined = $state(undefined);

    function handleRental_UnitClick(rental_unit: PageData['rental_unit'][number]) {
      selectedRental_Unit = rental_unit;
      editMode = true;
      
      $form = {
        ...rental_unit,
        property_id: rental_unit.property_id,
        floor_id: rental_unit.floor_id,
        amenities: rental_unit.amenities || [],
        property: {
          id: rental_unit.property_id,
          name: rental_unit.property.name
        },
        floor: {
          id: rental_unit.floor_id,
          property_id: rental_unit.property_id,
          floor_number: rental_unit.floor.floor_number,
          wing: rental_unit.floor.wing || undefined
        }
      };
    }

    function handleAddRental_Unit() {
      console.log('[DEBUG] Add Rental_unit button clicked');
      selectedRental_Unit = undefined;
      editMode = false;
      
      $form = {
        id: 0,
        property_id: 0,
        floor_id: 0,
        name: '',
        number: 0,
        type: 'SINGLE',
        capacity: 1,
        base_rate: 0,
        rental_unit_status: 'VACANT',
        property: {
          id: 0,
          name: ''
        },
        floor: {
          id: 0,
          floor_number: 0,
          property_id: 0,
          wing: ''
        },
        amenities: []
      };
      console.log('[DEBUG] Form reset to default values:', $form);
    }

    function handleCancel() {
      selectedRental_Unit = undefined;
      editMode = false;
    }

    async function handleDeleteRental_Unit(rental_unit: Rental_unit) {
      if (confirm(`Are you sure you want to delete ${rental_unit.name}?`)) {
        const formData = new FormData();
        formData.append('id', rental_unit.id.toString());
        
        try {
          console.log('[DEBUG] Attempting to delete rental_unit:', rental_unit.id);
          const result = await fetch('?/delete', {
            method: 'POST',
            body: formData
          });
          
          const response = await result.json();
          console.log('[DEBUG] Delete response:', response);
          
          if (result.ok && response.type === 'success') {
            console.log('[DEBUG] Rental_unit deleted successfully, updating UI');
            // Remove deleted rental_unit from the list
            data.rental_unit = data.rental_unit.filter(r => r.id !== rental_unit.id);
            // Reset form and selection
            selectedRental_Unit = undefined;
            editMode = false;
            // Show success message
            alert('Rental_unit deleted successfully');
          } else {
            console.error('Delete failed with status:', result.status, response);
            alert(`Failed to delete rental_unit (status ${result.status}): ${response.message || 'Unknown error'}\nDetails: ${JSON.stringify(response, null, 2)}`);
          }
        } catch (error) {
          console.error('Error deleting rental_unit:', error);
          alert(`Error deleting rental_unit: ${error instanceof Error ? error.message : 'Unknown error'}\nPlease check the console for more details.`);
        }
      }
    }

    function getStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
      switch (status) {
        case 'VACANT':
          return 'secondary';
        case 'OCCUPIED':
          return 'default';
        case 'RESERVED':
          return 'outline';
        default:
          return 'default';
      }
    }
  </script>

  <div class="container mx-auto p-4 flex">
    <div class="w-2/3">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Rental_Units</h1>
        {#if data.user?.role === 'staff'}
          <Button onclick={handleAddRental_Unit}>Add Rental_unit</Button>
        {/if}
      </div>

      <Card>
        <CardContent class="p-0">
          <div class="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-muted/50">
            <div>Rental_unit</div>
            <div>Type</div>
            <div>Status</div>
            <div>Rate</div>
            <div>Capacity</div>
            <div>Amenities</div>
            <div>Actions</div>
          </div>

          {#if data.rental_unit && data.rental_unit.length > 0}
            {#each data.rental_unit as rental_unit (rental_unit.id)}
              <div class="grid grid-cols-7 gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0 items-center">
                <div>
                  <div class="font-medium">{rental_unit.name}</div>
                  <div class="text-sm text-muted-foreground">
                    {rental_unit.property.name} - Floor {rental_unit.floor.floor_number}
                    {#if rental_unit.floor.wing}
                      Wing {rental_unit.floor.wing}
                    {/if}
                  </div>
                </div>
                <div class="flex items-center">
                  <span class="capitalize">{rental_unit.type.toLowerCase()}</span>
                </div>
                <div>
                  <Badge variant={getStatusVariant(rental_unit.rental_unit_status)}>
                    {rental_unit.rental_unit_status}
                  </Badge>
                </div>
                <div>
                  ₱{rental_unit.base_rate.toLocaleString()}/mo
                </div>
                <div>
                  {rental_unit.capacity} pax
                </div>
                <div class="flex flex-wrap gap-1">
                  {#each rental_unit.amenities as amenity}
                    <Badge variant="outline">{amenity}</Badge>
                  {/each}
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onclick={() => handleRental_UnitClick(rental_unit)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onclick={() => handleDeleteRental_Unit(rental_unit)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            {/each}
          {:else}
            <div class="p-4 text-center text-muted-foreground">
              No rental_unit found
            </div>
          {/if}
        </CardContent>
      </Card>
    </div>

    <div class="w-1/3 pl-4">
      <Card>
        <CardHeader>
          <CardTitle>{editMode ? 'Edit' : 'Add'} Rental_unit</CardTitle>
        </CardHeader>
        <CardContent>
          <Rental_UnitForm
            {data}
            {editMode}
            {form}
            {errors}
            {enhance}
            {constraints}
            on:cancel={handleCancel}
            on:rental_unitSaved={() => {
              selectedRental_Unit = undefined;
              editMode = false;
            }}
          />
        </CardContent>
      </Card>
    </div>
  </div>