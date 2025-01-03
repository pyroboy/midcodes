<script lang="ts">
  import RoomForm from './RoomForm.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { superForm } from 'sveltekit-superforms/client';
  import { zodClient } from 'sveltekit-superforms/adapters';
  import { roomSchema } from './formSchema';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import type { z } from 'zod';
  import type { Room } from './formSchema';

  interface PageData {
    rooms: Array<Room & {
      property: { name: string };
      floor: { floor_number: number; wing?: string };
    }>;
    properties: Array<{ id: number; name: string }>;
    floors: Array<{ id: number; property_id: number; floor_number: number; wing?: string }>;
    form: SuperValidated<z.infer<typeof roomSchema>>;
    user: { role: string } | null;
  }

  export let data: PageData;

  const { form, enhance, errors, constraints } = superForm(data.form, {
  id: 'room-form',
  validators: zodClient(roomSchema),
  validationMethod: 'auto', // Changed from 'auto' to 'onsubmit'
  dataType: 'json',
  delayMs: 10, // Add this line to remove debounce delay
  taintedMessage: null,
  // onSubmit: ({ formData, cancel }) => {
  //   // Remove this validation logic since superForm will handle it
  //   // The zodClient validator will automatically validate the form
  // },
  onError: ({ result }) => {
    console.log('Validation errors:', result.error);
  },
  onResult: ({ result }) => {
    if (result.type === 'success') {
      selectedRoom = undefined;
      editMode = false;
    }
  }
});

  let editMode = false;
  let selectedRoom: Room | undefined = undefined;

  function handleRoomClick(room: PageData['rooms'][number]) {
    selectedRoom = room;
    editMode = true;
    
    $form = {
      ...room,
      property_id: room.property_id,
      floor_id: room.floor_id,
      amenities: room.amenities || []
    };
  }

  function handleAddRoom() {
    selectedRoom = undefined;
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
      room_status: 'VACANT',
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
  }

  function handleCancel() {
    selectedRoom = undefined;
    editMode = false;
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
      <h1 class="text-2xl font-bold">Rooms</h1>
      {#if data.user?.role === 'staff'}
        <Button on:click={handleAddRoom}>Add Room</Button>
      {/if}
    </div>

    <Card>
      <CardContent class="p-0">
        <div class="grid grid-cols-4 gap-4 p-4 font-medium border-b bg-muted/50">
          <div>Room</div>
          <div>Type</div>
          <div>Status</div>
          <div>Rate</div>
        </div>

        {#if data.rooms && data.rooms.length > 0}
          {#each data.rooms as room (room.id)}
            <button 
              type="button"
              class="grid grid-cols-4 gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0"
              class:pointer-events-none={data.user?.role !== 'staff'}
              on:click={() => handleRoomClick(room)}
            >
              <div>
                <div class="font-medium">{room.name}</div>
                <div class="text-sm text-muted-foreground">
                  {room.property.name} - Floor {room.floor.floor_number}
                  {#if room.floor.wing}
                    Wing {room.floor.wing}
                  {/if}
                </div>
              </div>
              <div class="flex items-center">
                <span class="capitalize">{room.type.toLowerCase()}</span>
                {#if room.capacity > 1}
                  <span class="text-sm text-muted-foreground ml-1">
                    ({room.capacity} pax)
                  </span>
                {/if}
              </div>
              <div>
                <Badge variant={getStatusVariant(room.room_status)}>
                  {room.room_status}
                </Badge>
              </div>
              <div>
                ₱{room.base_rate.toLocaleString()}/mo
              </div>
            </button>
          {/each}
        {:else}
          <div class="p-4 text-center text-muted-foreground">
            No rooms found
          </div>
        {/if}
      </CardContent>
    </Card>
  </div>

  <div class="w-1/3 pl-4">
    <Card>
      <CardHeader>
        <CardTitle>{editMode ? 'Edit' : 'Add'} Room</CardTitle>
      </CardHeader>
      <CardContent>
        <RoomForm
          {data}
          {editMode}
          {form}
          {errors}
          {enhance}
          {constraints}
          on:cancel={handleCancel}
          on:roomSaved={() => {
            selectedRoom = undefined;
            editMode = false;
          }}
        />
      </CardContent>
    </Card>
  </div>
</div>