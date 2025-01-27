<script lang="ts">
    import { Card, CardContent, CardHeader } from "$lib/components/ui/card";
    import SearchableCombobox from './SerchableCombobox.svelte';
    import DepartmentLogo from './DepartmentLogo.svelte';
    import { writable } from 'svelte/store';
import CategoryRankingsView from "./CategoryRankingsView.svelte";
import DepartmentMedalsView from './DepartmentMedalsView.svelte';
    interface TabulationDetail {
        event_id: string;
        event_name: string;
        category: EventCategory;
        medal_count: number;
        department_id: string;
        department_name: string;
        department_logo: string;
        rank: number;
        tie_group: number;
        updated_at: string;
        updated_by: string;
        updated_by_username: string;
        is_locked: boolean;
        is_published: boolean;
    }

    interface Event {
        id: string;
        event_name: string;
        category: EventCategory;
        medal_count: number | null;
        is_locked: boolean;
        is_published: boolean;
    }


    const EVENT_CATEGORIES = [
        'Athletics',
        'Academics & Literary',
        'Music',
        'Dances',
        'E-Sports',
        'MMUB',
        'Special'
    ] as const;

    type EventCategory = typeof EVENT_CATEGORIES[number];

    interface CategoryMedalTally {
        department_id: string;
        department_name: string;
        department_acronym: string;
        department_logo: string | null;
        mascot_name: string | null;
        mascot_logo: string | null;
        category: EventCategory;
        updated_at: string;
        updated_by: string | null;
        updated_by_username: string | null;
        gold_count: number;
        silver_count: number;
        bronze_count: number;
        events: number;
    }

    export let tabulationDetails: TabulationDetail[] = [];
    export let events: Event[] = [];
    export let categoryMedalTally: CategoryMedalTally[] = [];
    export let eventCategories: readonly string[] = EVENT_CATEGORIES;

    let selectedEvent = writable<{ value: string; label: string } | undefined>();
    let selectedDepartment = writable<{ value: string; label: string } | undefined>();
    let selectedCategory = writable<{ value: string; label: string } | undefined>();
    let useMascotLogo = writable(false);

    // Create unique department list
    $: uniqueDepartments = [...new Map(
        categoryMedalTally.map(entry => [
            entry.department_id,
            {
                id: entry.department_id,
                name: entry.department_name,
                logo: entry.department_logo,
                acronym: entry.department_acronym,
                mascotName: entry.mascot_name,
                mascotLogo: entry.mascot_logo
            }
        ])
    ).values()];

    $: categoryItems = eventCategories.map(category => ({
        value: category,
        label: category
    }));

    $: departmentItems = uniqueDepartments.map(dept => ({
        value: dept.id,
        label: dept.name
    }));

    $: eventItems = events
        .filter(event => event.is_published)
        .map(event => ({
            value: event.id,
            label: event.event_name,
            category: event.category
        }));

    $: selectedCategoryData = $selectedCategory?.value
        ? categoryMedalTally
            .filter(entry => entry.category === $selectedCategory.value)
            .sort((a, b) => {
                if (a.gold_count !== b.gold_count) return b.gold_count - a.gold_count;
                if (a.silver_count !== b.silver_count) return b.silver_count - a.silver_count;
                return b.bronze_count - a.bronze_count;
            })
        : [];

        $: selectedEventParticipants = $selectedEvent?.value
    ? tabulationDetails
        .filter(detail => detail.is_published && detail.event_id === $selectedEvent.value)
        .sort((a, b) => a.rank - b.rank)
        .map(participant => {
            const eventTabulations = tabulationDetails.filter(
                detail => detail.is_published && detail.event_id === $selectedEvent.value
            );

            if (participant.tie_group) {
                // Find all members of the same tie group
                const tieGroupMembers = eventTabulations
                    .filter(t => t.tie_group === participant.tie_group)
                    .sort((a, b) => a.rank - b.rank);

                if (tieGroupMembers.length > 0) {
                    // Assign the same rank to all members of the tie group
                    participant.rank = tieGroupMembers[0].rank;
                }
            }

            return participant; // Return the modified participant object
        })
    : [];

    $: selectedDepartmentMedals = $selectedDepartment?.value
        ? {
            details: categoryMedalTally
                .filter(entry => entry.department_id === $selectedDepartment.value)
                .reduce((acc, entry) => ({
                    gold: acc.gold + entry.gold_count,
                    silver: acc.silver + entry.silver_count,
                    bronze: acc.bronze + entry.bronze_count
                }), { gold: 0, silver: 0, bronze: 0 }),
            events: tabulationDetails
                .filter(detail => detail.is_published && detail.department_id === $selectedDepartment.value)
                .sort((a, b) => a.rank - b.rank)
        }
        : null;

    $: currentDepartment = $selectedDepartment?.value
        ? uniqueDepartments.find(d => d.id === $selectedDepartment.value)
        : undefined;

    const medalTypes = ['gold', 'silver', 'bronze'] as const;
    type MedalTypeKey = typeof medalTypes[number];

    let selectedEventValue: string | undefined;
    let selectedDepartmentValue: string | undefined;
    let selectedCategoryValue: string | undefined;

    $: selectedEventValue = $selectedEvent?.value;
    $: selectedDepartmentValue = $selectedDepartment?.value;
    $: selectedCategoryValue = $selectedCategory?.value;

    function handleCategoryChange(value: string) {
        // Reset other selections first
        selectedEvent.set(undefined);
        selectedDepartment.set(undefined);
        // Then set the new category
        selectedCategory.set({ value, label: value });
    }

    function handleEventChange(value: string) {
        // Reset other selections first
        selectedCategory.set(undefined);
        selectedDepartment.set(undefined);
        // Then set the new event
        const event = events.find(e => e.id === value);
        if (event) {
            selectedEvent.set({ value: event.id, label: event.event_name });
        } else {
            selectedEvent.set(undefined);
        }
    }

    function handleDepartmentChange(value: string) {
        // Reset other selections first
        selectedCategory.set(undefined);
        selectedEvent.set(undefined);
        // Then set the new department
        const department = uniqueDepartments.find(d => d.id === value);
        if (department) {
            selectedDepartment.set({ value: department.id, label: department.name });
        } else {
            selectedDepartment.set(undefined);
        }
    }
    const medalColors: Record<number, string> = {
    1: 'text-yellow-500',
    2: 'text-gray-400',
    3: 'text-orange-700'
};


// GET EFFECTIVE RANKINGS

    function getOrdinal(rank: number): string {
        const suffixes = ['st', 'nd', 'rd'];
        return rank <= 3 ? `${rank}${suffixes[rank - 1]}` : `${rank}th`;
    }
</script>

<Card class="mt-4">
    <CardHeader>
        <div class="flex flex-col gap-6">
            <div class="flex flex-row gap-4 flex-wrap">
                <!-- Category Selector -->
                <div class="w-[250px]">
                    <SearchableCombobox
                        items={categoryItems}
                        bind:value={selectedCategoryValue}
                        onValueChange={handleCategoryChange}
                        placeholder="Select Category"
                        searchPlaceholder="Search categories..."
                    />
                </div>

                <!-- Event Selector -->
                <div class="w-[250px]">
                    <SearchableCombobox
                        items={eventItems}
                        bind:value={selectedEventValue}
                        onValueChange={handleEventChange}
                        placeholder="Select Event"
                        searchPlaceholder="Search events..."
                    />
                </div>

                <!-- Department Selector -->
                <div class="w-[250px]">
                    <SearchableCombobox
                        items={departmentItems}
                        bind:value={selectedDepartmentValue}
                        onValueChange={handleDepartmentChange}
                        placeholder="Select Department"
                        searchPlaceholder="Search departments..."
                    />
                </div>
            </div>
        </div>
    </CardHeader>

    <CardContent>
        <!-- Category View -->
        {#if $selectedCategory}
        <CategoryRankingsView 
            categoryName={$selectedCategory.label}
            categoryData={selectedCategoryData}
            tabulationDetails={tabulationDetails}
            events={events}
        />
        <!-- Event View -->
       
{:else if $selectedEvent}
<div class="space-y-4">
    <h2 class="text-2xl font-bold mb-4">{$selectedEvent.label}</h2>
    <div class="grid gap-3">
        {#each selectedEventParticipants as participant}
        <div class="flex items-center justify-between p-4 bg-white border-2 rounded-lg hover:shadow-md transition-all duration-200 w-full sm:w-3/4 md:w-1/2 lg:w-3/4 mx-auto">
                <div class="flex items-center gap-4">
                    <DepartmentLogo 
                        departmentLogoSrc={participant.department_logo}
                        acronym={participant.department_name}
                        size={40}
                    />
                    <span class="text-lg font-medium">{participant.department_name}</span>
                </div>
                <div class="flex items-center gap-6">
                    <div class="flex flex-col items-end">

                        {#if participant.rank <= 3}
                        <span
                          class={
                            participant.rank === 1
                              ? "text-yellow-500 font-bold"
                              : participant.rank === 2
                              ? "text-gray-400 font-bold"
                              : "text-orange-700 font-bold"
                          }
                        >
                          {participant.medal_count} - 
                          {participant.rank === 1
                            ? " Gold"
                            : participant.rank === 2
                            ? " Silver"
                            : " Bronze"}
                        </span>
                        {:else}
                        <!-- <span class="text-sm text-gray-500">Rank</span> -->
                        <span class="font-bold text-base {participant.rank <= 3 ? medalColors[participant.rank] : ''}">
                            {getOrdinal(participant.rank)}
                        </span>
                      {/if}
                      
                    </div>
                    <!-- <div class="flex flex-col items-end min-w-[60px]">
          
                    </div> -->
                </div>
            </div>
        {/each}
    </div>
</div>

        <!-- Department View -->
        {:else if selectedDepartmentMedals}
    <DepartmentMedalsView
        currentDepartment={currentDepartment}
        selectedDepartmentMedals={selectedDepartmentMedals}
        useMascotLogo={$useMascotLogo}
    />

        <!-- Default View -->
        {:else}
            <div class="text-center text-gray-500 py-8">
                Select a category, event, or department to view details
            </div>
        {/if}
    </CardContent>
</Card>

<style>
    :global(.text-gold) { color: #FFD700; }
    :global(.text-silver) { color: #C0C0C0; }
    :global(.text-bronze) { color: #CD7F32; }

    /* Ensure tables are responsive */


    /* Enhance hover states */
    .hover\:bg-gray-50:hover {
        background-color: #F9FAFB;
        transition: background-color 150ms ease-in-out;
    }

    /* Add shadow to cards on hover */
    .border:hover {
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        transition: box-shadow 150ms ease-in-out;
    }


    
  
    /* Ranking colors */
    /* .text-rank-1 { color: #FFD700; }
    .text-rank-2 { color: #C0C0C0; }
    .text-rank-3 { color: #CD7F32; } */
</style>