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

  const { form, enhance, errors, constraints, message } = superForm(data.form, {
    id: 'room-form',
    validators: zodClient(roomSchema),
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
        selectedRoom = undefined;
        editMode = false;
      } else if (result.type === 'failure') {
        console.error('Form submission failed:', result);
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
      amenities: room.amenities || [],
      property: {
        id: room.property_id,
        name: room.property.name
      },
      floor: {
        id: room.floor_id,
        property_id: room.property_id,
        floor_number: room.floor.floor_number,
        wing: room.floor.wing || undefined
      }
    };
  }

  function handleAddRoom() {
    console.log('[DEBUG] Add Room button clicked');
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
    console.log('[DEBUG] Form reset to default values:', $form);
  }

  function handleCancel() {
    selectedRoom = undefined;
    editMode = false;
  }

  async function handleDeleteRoom(room: Room) {
    if (confirm(`Are you sure you want to delete ${room.name}?`)) {
      const formData = new FormData();
      formData.append('id', room.id.toString());
      
      try {
        console.log('[DEBUG] Attempting to delete room:', room.id);
        const result = await fetch('?/delete', {
          method: 'POST',
          body: formData
        });
        
        const response = await result.json();
        console.log('[DEBUG] Delete response:', response);
        
        if (result.ok && response.type === 'success') {
          console.log('[DEBUG] Room deleted successfully, updating UI');
          // Remove deleted room from the list
          data.rooms = data.rooms.filter(r => r.id !== room.id);
          // Reset form and selection
          selectedRoom = undefined;
          editMode = false;
          // Show success message
          alert('Room deleted successfully');
        } else {
          console.error('Delete failed with status:', result.status, response);
          alert(`Failed to delete room (status ${result.status}): ${response.message || 'Unknown error'}\nDetails: ${JSON.stringify(response, null, 2)}`);
        }
      } catch (error) {
        console.error('Error deleting room:', error);
        alert(`Error deleting room: ${error instanceof Error ? error.message : 'Unknown error'}\nPlease check the console for more details.`);
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
      <h1 class="text-2xl font-bold">Rooms</h1>
      {#if data.user?.role === 'staff'}
        <Button on:click={handleAddRoom}>Add Room</Button>
      {/if}
    </div>

    <Card>
      <CardContent class="p-0">
        <div class="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-muted/50">
          <div>Room</div>
          <div>Type</div>
          <div>Status</div>
          <div>Rate</div>
          <div>Capacity</div>
          <div>Amenities</div>
          <div>Actions</div>
        </div>

        {#if data.rooms && data.rooms.length > 0}
          {#each data.rooms as room (room.id)}
            <div class="grid grid-cols-7 gap-4 p-4 text-left hover:bg-muted/50 w-full border-b last:border-b-0 items-center">
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
              </div>
              <div>
                <Badge variant={getStatusVariant(room.room_status)}>
                  {room.room_status}
                </Badge>
              </div>
              <div>
                ₱{room.base_rate.toLocaleString()}/mo
              </div>
              <div>
                {room.capacity} pax
              </div>
              <div class="flex flex-wrap gap-1">
                {#each room.amenities as amenity}
                  <Badge variant="outline">{amenity}</Badge>
                {/each}
              </div>
              <div class="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  on:click={() => handleRoomClick(room)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  on:click={() => handleDeleteRoom(room)}
                >
                  Delete
                </Button>
              </div>
            </div>
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