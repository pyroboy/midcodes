<script lang="ts">
    import DepartmentLogo from './DepartmentLogo.svelte';
    import { useMascotLogo } from './logoStore';
    import { slide } from 'svelte/transition';

    interface CategoryMedalTally {
        department_id: string;
        department_name: string;
        department_acronym: string;
        department_logo: string | null;
        mascot_name: string | null;
        mascot_logo: string | null;
        category: string;
        updated_at: string;
        updated_by: string | null;
        updated_by_username: string | null;
        gold_count: number;
        silver_count: number;
        bronze_count: number;
        events: number;
    }

    interface TabulationDetail {
        event_id: string;
        event_name: string;
        medal_count: number;
        tie_group: number;
        department_id: string;
        rank: number;
        is_published: boolean;
    }

    interface Event {
        id: string;
        category: string;
    }

    export let categoryName: string;
    export let categoryData: CategoryMedalTally[] = [];
    export let tabulationDetails: TabulationDetail[] = [];
    export let events: Event[] = [];

    let openDepartmentId: string | null = null;

    function toggleDepartmentEvents(departmentId: string) {
        openDepartmentId = openDepartmentId === departmentId ? null : departmentId;
    }

    $: getDepartmentEvents = (departmentId: string) => 
        tabulationDetails
            .filter(detail => 
                detail.is_published && 
                detail.department_id === departmentId &&
                events.find(e => e.id === detail.event_id)?.category === categoryName
            )
            .sort((a, b) => a.rank - b.rank);
</script>

<div class="space-y-4">
    <h2 class="text-2xl font-bold mb-4">{categoryName} Rankings</h2>
    <div class="overflow-x-auto">
        <table class="w-full border-collapse">
            <thead>
                <tr class="border-b">
                    <th class="text-center p-2">Rank</th>
                    <th class="text-center p-2"></th>
                    <th class="text-left p-2">Department</th>
                    <th class="text-center p-2">
                        <span class="font-semibold">Events</span>
                    </th>
                    <th class="text-center p-2">Gold</th>
                    <th class="text-center p-2">Silver</th>
                    <th class="text-center p-2">Bronze</th>
                </tr>
            </thead>
            <tbody>
                {#each categoryData as tally, index}
                    <tr 
                        class="border-b hover:bg-gray-50/80 transition-all duration-200 cursor-pointer"
                        on:click={() => toggleDepartmentEvents(tally.department_id)}
                    >
                        <td class="p-2 text-center">
                            {#if index === 0}
                                <span class="text-yellow-500 font-bold">1st</span>
                            {:else if index === 1}
                                <span class="text-gray-400 font-bold">2nd</span>
                            {:else if index === 2}
                                <span class="text-orange-700 font-bold">3rd</span>
                            {:else}
                                <span class="text-gray-600">{index + 1}th</span>
                            {/if}
                        </td>
                        <td class="p-2 text-center">
                            <div class="flex justify-center">
                                <DepartmentLogo 
                                    departmentLogoSrc={tally.department_logo}
                                    mascotLogoSrc={tally.mascot_logo}
                                    acronym={tally.department_acronym}
                                    mascotName={tally.mascot_name}
                                    size={32}
                                    useMascot={$useMascotLogo}
                                />
                            </div>
                        </td>
                        <td class="p-2">
                            <div class="flex flex-col">
                                <span class="font-medium">{tally.department_name}</span>
                                <span class="text-sm text-gray-500">{tally.department_acronym}</span>
                            </div>
                        </td>
                        <td class="text-center p-2">{tally.events}</td>
                        <td class="text-center p-2 font-bold text-yellow-500">{tally.gold_count}</td>
                        <td class="text-center p-2 font-bold text-gray-400">{tally.silver_count}</td>
                        <td class="text-center p-2 font-bold text-orange-700">{tally.bronze_count}</td>
                    </tr>
                    
                    {#if openDepartmentId === tally.department_id}
                    {@const departmentEvents = getDepartmentEvents(tally.department_id)}
                    <tr class="border-b ">
                        <td colspan="7" class="p-0">
                            <div class="bg-gray-50/50" transition:slide={{ duration: 300 }}>
                                <div class="p-2">
                                    {#if departmentEvents.length > 0}
                                        <div class="grid gap-1">
                                            {#each departmentEvents as event}
                                            <div class="flex items-center justify-between px-3 py-1.5 rounded bg-white shadow-sm w-full max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl mx-auto">
                                                    <span class="font-medium">{event.event_name}</span>
                                                    <div class="flex items-center gap-4">
                                                        {#if event.rank <= 3}
                                                        <span
                                                          class={
                                                            event.rank === 1
                                                              ? "text-yellow-500 font-bold"
                                                              : event.rank === 2
                                                              ? "text-gray-400 font-bold"
                                                              : "text-orange-700 font-bold"
                                                          }
                                                        >
                                                          {event.medal_count} - 
                                                          {event.rank === 1
                                                            ? " Gold"
                                                            : event.rank === 2
                                                            ? " Silver"
                                                            : " Bronze"}
                                                        </span>

                                                        {:else}
                                                        <span class="font-bold text-base text-gray-500">{event.rank}th </span>  
                                                      {/if}
                                                      
                                                      <span></span>  
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    {:else}
                                        <div class="text-center py-2 text-gray-500">
                                            No Events Participated
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </td>
                    </tr>
                {/if}
                {/each}
            </tbody>
        </table>
    </div>
</div>


<style>
    .shadow-sm {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    /* Disable text selection on clickable rows */
    tr {
        user-select: none;
    }
</style>