<script lang="ts">
    import Button from '$lib/components/ui/button/button.svelte';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function generateRandomData() {
        let randomLocation = {
            locationName: `Random Location ${Math.floor(Math.random() * 1000)}`,
            locationFloorLevel: Math.floor(Math.random() * 10),
            locationCapacity: Math.floor(Math.random() * 20) + 1,
            locationRentRate: Math.floor(Math.random() * 100000),
            locationStatus: locationStatusEnum.enumValues[Math.floor(Math.random() * locationStatusEnum.enumValues.length)],
            createdBy: Math.floor(Math.random() * 100) + 1,
        };

        dispatch('randomData', randomLocation);
    }
</script>

<Button
    on:click={generateRandomData}
    class="border-2 border-gray-300 rounded-full text-[8px] font-bold bg-white-500 hover:bg-white-600 text-black"
>
    ADD RANDOM
</Button>