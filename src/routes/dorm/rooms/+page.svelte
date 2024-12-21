<script lang="ts">
  import RoomForm from './RoomForm.svelte';
  import { page } from '$app/stores';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import Button from '$lib/components/ui/button/button.svelte';
  import type { Room } from './formSchema';
  import { checkAccess } from '$lib/utils/roleChecks';
  import { enhance } from '$app/forms';

  interface PageData {
    rooms: Array<Room & {
      property: { name: string };
      floor: { floor_number: number; wing?: string };
    }>;
    properties: Array<{ id: number; name: string }>;
    floors: Array<{ id: number; property_id: number; floor_number: number; wing?: string }>;
    form: any;
    user: { role: string } | null;
  }

  export let data: PageData;

  let selectedRoom: (Room & { property: { name: string }; floor: { floor_number: number; wing?: string } }) | undefined = undefined;
  let editMode = false;

  function handleRoomClick(room: PageData['rooms'][number]) {
    selectedRoom = room;
    editMode = true;
  }

  function handleRoomSaved() {
    selectedRoom = undefined;
    editMode = false;
  }

  function handleCancel() {
    selectedRoom = undefined;
    editMode = false;
  }

  type StatusVariant = 'default' | 'destructive' | 'outline' | 'secondary';
  
  function getStatusColor(status: string): StatusVariant {
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

<div class="p-4 space-y-4">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">Rooms</h1>
    {#if checkAccess(data.user?.role, 'staff')}
      <Button on:click={() => {
        selectedRoom = undefined;
        editMode = true;
      }}>Add Room</Button>
    {/if}
  </div>

  {#if editMode}
    <div class="card-container">
      <Card.Root>
        <Card.Header class="flex justify-between items-start">
          <Card.Title>{selectedRoom ? 'Edit' : 'Add'} Room</Card.Title>
          {#if selectedRoom && checkAccess(data.user?.role, 'admin')}
            <form action="?/delete" method="POST" use:enhance>
              <input type="hidden" name="id" value={selectedRoom.id} />
              <Button variant="destructive" type="submit">Delete Room</Button>
            </form>
          {/if}
        </Card.Header>
        <Card.Content>
          <div class:pointer-events-none={!checkAccess(data.user?.role, 'staff')}
               class:opacity-75={!checkAccess(data.user?.role, 'staff')}>
            <RoomForm
              {data}
              {editMode}
              {selectedRoom}
              on:roomSaved={handleRoomSaved}
              on:cancel={handleCancel}
            />
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each data.rooms || [] as room (room.id)}
        <button 
          type="button"
          class="text-left w-full" 
          class:pointer-events-none={!checkAccess(data.user?.role, 'staff')}
          class:opacity-75={!checkAccess(data.user?.role, 'staff')}
          on:click={() => handleRoomClick(room)}
          on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleRoomClick(room);
            }
          }}
          disabled={!checkAccess(data.user?.role, 'staff')}
          aria-label="Edit {room.name || `Room ${room.number}`}"
        >
          <Card.Root>
            <Card.Header>
              <Card.Title>{room.name || `Room ${room.number}`}</Card.Title>
              <Card.Description>
                {room.property?.name} - Floor {room.floor?.floor_number}
                {room.floor?.wing ? `(${room.floor.wing})` : ''}
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span>Status</span>
                  <Badge variant={getStatusColor(room.room_status)}>{room.room_status}</Badge>
                </div>
                <div class="flex justify-between items-center">
                  <span>Capacity</span>
                  <span>{room.capacity} persons</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Base Rate</span>
                  <span>₱{room.base_rate.toLocaleString()}</span>
                </div>
                {#if room.amenities?.length}
                  <div class="pt-2">
                    <span class="text-sm text-muted-foreground">Amenities:</span>
                    <div class="flex flex-wrap gap-1 mt-1">
                      {#each room.amenities as amenity}
                        <Badge variant="outline">{amenity}</Badge>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            </Card.Content>
          </Card.Root>
        </button>
      {/each}
    </div>
  {/if}
</div>