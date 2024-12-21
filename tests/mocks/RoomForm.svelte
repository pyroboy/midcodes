<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  interface Property {
    id: number;
    name: string;
  }

  interface Floor {
    id: number;
    floor_number: number;
    wing: string;
  }

  interface Form {
    name?: string;
    property_id?: number;
    floor_id?: number;
  }

  interface Data {
    properties: Property[];
    floors: Floor[];
    form: Form;
  }

  export let data: Data = {
    properties: [],
    floors: [],
    form: {}
  };

  const dispatch = createEventDispatcher();
  $: ({ properties, floors, form } = data);
</script>

<form>
  <div class="grid gap-4">
    <div>
      <label for="room-name">Name</label>
      <input id="room-name" type="text" value={form?.name || ''} />
    </div>
    <div>
      <label for="property">Property</label>
      <select id="property">
        {#each properties as property}
          <option value={property.id}>{property.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="floor">Floor</label>
      <select id="floor">
        {#each floors as floor}
          <option value={floor.id}>Floor {floor.floor_number} - Wing {floor.wing}</option>
        {/each}
      </select>
    </div>
  </div>
</form>
