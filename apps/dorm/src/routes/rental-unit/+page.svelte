<script lang="ts">
  import RentalUnitForm from './Rental_UnitForm.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { rental_unitSchema, type Rental_unit } from './formSchema';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { invalidate } from '$app/navigation';
  import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';

  import { browser } from "$app/environment";
  import type { RentalUnitResponse } from './+page.server';
  import type { Database } from '$lib/database.types';
  import type { SuperValidated } from 'sveltekit-superforms';
  import type { z } from 'zod';

  type DBProperty = Database['public']['Tables']['properties']['Row'];
  type DBFloor = Database['public']['Tables']['floors']['Row'];

  let { data } = $props<{  
    rental_unit?: RentalUnitResponse;
    form: SuperValidated<z.infer<typeof rental_unitSchema>>;
    rentalUnits: RentalUnitResponse[];
    properties: Pick<DBProperty, 'id' | 'name'>[];
    floors: Pick<DBFloor, 'id' | 'floor_number' | 'wing'>[];
  }>();

  let editMode = $state(false);
  let formError = $state('');
  const { form: formData, enhance, errors, constraints, reset } = superForm(data.form, {
    id: 'rental-unit-form',
    validators: zodClient(rental_unitSchema),
    validationMethod: 'oninput',
    dataType: 'json',
    taintedMessage: null,
    resetForm: true,
    onError: ({ result }) => {
      console.error('Form submission error:', {
        error: result.error,
        status: result.status
      });
      if (result.error) {
        console.error('Server error:', result.error.message);
      }
    },
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        editMode = false;
        await invalidate('app:rentalUnits');
      }
      else if (result.type === 'failure') {
        formError = result.data?.message || 'An unknown error occurred';
      }
    }
  });

  function handleRentalUnitClick(rentalUnit: RentalUnitResponse) {
    editMode = true;
    $formData = {
      id: rentalUnit.id,
      property_id: rentalUnit.property_id,
      floor_id: rentalUnit.floor_id,
      name: rentalUnit.name,
      number: rentalUnit.number,
      rental_unit_status: rentalUnit.rental_unit_status,
      capacity: rentalUnit.capacity,
      base_rate: rentalUnit.base_rate,
      type: rentalUnit.type,
      amenities: Array.isArray(rentalUnit.amenities) ? rentalUnit.amenities : [],
      property: rentalUnit.property,
      floor: rentalUnit.floor,
      created_at: rentalUnit.created_at,
      updated_at: rentalUnit.updated_at
    };
  }

  async function handleDeleteRentalUnit(rentalUnit: RentalUnitResponse) {
    if (!confirm(`Are you sure you want to delete rental unit ${rentalUnit.name}?`)) {
      return;
    }

    const formData = new FormData();
    formData.append('id', String(rentalUnit.id));

    try {
      const result = await fetch('?/delete', {
        method: 'POST',
        body: formData
      });

      const response = await result.json();

      if (result.ok) {
        editMode = false;
        await Promise.all([
          invalidate('app:rentalUnits'),
          invalidate((url) => url.pathname.includes('/rental-units'))
        ]);
      } else {
        console.error('Delete failed:', {
          status: result.status,
          response,
          error: response.message
        });
        alert(`Failed to delete rental unit: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting rental unit:', error);
      alert(`Error deleting rental unit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function getStatusVariant(status: RentalUnitResponse['rental_unit_status']): "default" | "destructive" | "outline" | "secondary" {
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

<div class="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
  <div class="w-full lg:w-2/3">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Rental Units</h1>
    </div>

    <Card>
      <CardContent class="p-0">
        <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_2fr] gap-4 p-4 font-medium border-b bg-muted/50">
          <div class="flex items-center">Property / Unit</div>
          <div class="flex items-center">Floor</div>
          <div class="flex items-center">Type</div>
          <div class="flex items-center">Status</div>
          <div class="flex items-center">Rate</div>
          <div class="flex items-center">Capacity</div>
          <div class="flex items-center">Actions</div>
        </div>

        <div class="divide-y">
          {#if !data.rentalUnits?.length}
            <div class="text-center py-8">
              <p class="text-gray-500">No rental units found</p>
            </div>
          {:else}
            {#each data.rentalUnits as unit (unit.id)}
              <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_2fr] gap-4 p-4 text-left hover:bg-muted/50">
                <div>
                  <div class="font-medium">{unit.name}</div>
                  <div class="text-sm text-muted-foreground">{unit.property?.name || 'Unknown Property'}</div>
                </div>
                <div>
                  {#if unit.floor}
                    Floor {unit.floor.floor_number}
                    {#if unit.floor.wing}
                      Wing {unit.floor.wing}
                    {/if}
                  {:else}
                    Unknown Floor
                  {/if}
                </div>
                <div>{unit.type}</div>
                <div>
                  <Badge variant={getStatusVariant(unit.rental_unit_status)}>
                    {unit.rental_unit_status}
                  </Badge>
                </div>
                <div>₱{unit.base_rate.toLocaleString()}</div>
                <div>{unit.capacity} pax</div>
                <div class="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onclick={() => handleRentalUnitClick(unit)}
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
                    onclick={() => handleDeleteRentalUnit(unit)}
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
          {/if}
        </div>
      </CardContent>
    </Card>
  </div>

  <div class="w-full lg:w-1/3">
    <Card>
      <CardHeader>
        <CardTitle>{editMode ? 'Edit' : 'Add'} Rental Unit</CardTitle>
      </CardHeader>
      <CardContent>
        <RentalUnitForm
          {data}
          {editMode}
          form={formData}
          {errors}
          {enhance}
          {constraints}
          on:cancel={() => {
            editMode = false;
            reset();
          }}
          on:rentalUnitSaved={async () => {
            editMode = false;
            await invalidate('app:rentalUnits');
          }}
        />
      </CardContent>
    </Card>
  </div>
</div>

{#if browser}
  <SuperDebug data={$formData} />
{/if}