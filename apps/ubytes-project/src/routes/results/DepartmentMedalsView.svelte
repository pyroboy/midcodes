<script lang="ts">
    import DepartmentLogo from "./DepartmentLogo.svelte";
    import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip";

    interface Department {
        id: string;
        name: string;
        logo: string | null;
        acronym: string;
        mascotName: string | null;
        mascotLogo: string | null;
    }

    interface TabulationDetail {
        event_id: string;
        event_name: string;
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

    interface MedalsSummary {
        gold: number;
        silver: number;
        bronze: number;
    }

    interface DepartmentMedals {
        details: MedalsSummary;
        events: TabulationDetail[];
    }

    export let currentDepartment: Department | undefined = undefined;
    export let selectedDepartmentMedals: DepartmentMedals;
    export let useMascotLogo: boolean;

    // Reordered medals to put gold in the middle
    const medalTypes = ['silver', 'gold', 'bronze'] as const;

    const medalColors = {
        gold: 'bg-yellow-500',
        silver: 'bg-gray-400',
        bronze: 'bg-orange-700'
    };

    const medalTextColors = {
        gold: 'text-yellow-500',
        silver: 'text-gray-400',
        bronze: 'text-orange-700'
    };

    const medalSizes = {
        gold: {
            circle: 'w-24 h-24',
            text: 'text-4xl',
            count: 'text-2xl'
        },
        silver: {
            circle: 'w-16 h-16',
            text: 'text-2xl',
            count: 'text-xl'
        },
        bronze: {
            circle: 'w-14 h-14',
            text: 'text-xl',
            count: 'text-lg'
        }
    };

    function getOrdinal(rank: number): string {
        const suffixes = ['st', 'nd', 'rd'];
        return rank <= 3 ? `${rank}${suffixes[rank - 1]}` : `${rank}th`;
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    $: totalEvents = selectedDepartmentMedals.events.length;
</script>

<div class="space-y-4">
    {#if currentDepartment}
        <div class="flex items-center gap-4 mb-6">
            <DepartmentLogo 
                departmentLogoSrc={currentDepartment.logo}
                mascotLogoSrc={currentDepartment.mascotLogo}
                acronym={currentDepartment.acronym}
                mascotName={currentDepartment.mascotName}
                size={64}
                useMascot={useMascotLogo}
            />
            <div>
                <h2 class="text-2xl font-bold">{currentDepartment.name}</h2>
                <p class="text-gray-500">{currentDepartment.acronym}</p>
            </div>
        </div>
    {/if}
    
    <!-- Medal Summary -->
    <div class="bg-gray-50 rounded-lg p-6">
        <div class="grid grid-cols-3 gap-8 py-4 border-t border-gray-200">
            {#each medalTypes as medalType}
                <div class="medal-item flex flex-col items-center text-center relative">
                    <div class="{medalColors[medalType]} {medalSizes[medalType].circle} rounded-full absolute opacity-20" />
                    <span class="font-bold capitalize {medalTextColors[medalType]} {medalSizes[medalType].text} z-10">
                        {medalType.charAt(0).toUpperCase() + medalType.slice(1)}
                    </span>
                    <span class="font-bold {medalTextColors[medalType]} {medalSizes[medalType].count} z-10">
                        {selectedDepartmentMedals.details[medalType]}
                    </span>
                </div>
            {/each}
        </div>
    </div>

    <!-- Events List -->
    <div class="space-y-2">
        <h3 class="text-xl font-semibold mb-4">
            Events Participated ({totalEvents} {totalEvents === 1 ? 'Event' : 'Events'})
        </h3>
        <div class="grid gap-3">
            {#each selectedDepartmentMedals.events as event}
                <Tooltip>
                    <TooltipTrigger class="w-full">
                        <div class="flex items-center justify-between px-3 py-1.5 rounded bg-white shadow-sm w-full max-w-screen-sm sm:max-w-screen-md md:max-w-screen-lg lg:max-w-screen-xl mx-auto">
                            <div class="flex flex-col items-start">
                                <span class="text-lg">{event.event_name}</span>
                                <!-- <span class="text-sm text-gray-500">Medals: {event.medal_count}</span> -->
                            </div>
                            <span class="font-medium text-lg {
                                event.rank === 1 ? medalTextColors.gold :
                                event.rank === 2 ? medalTextColors.silver :
                                event.rank === 3 ? medalTextColors.bronze : ''
                            }">
                                {getOrdinal(event.rank)}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent class="bg-gray-800 text-white border-gray-700">
                        <div class="text-sm space-y-1">
                            <p>Last Updated: {formatDate(event.updated_at)}</p>
                            <p>Updated By: {event.updated_by_username || 'Unknown'}</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            {/each}
        </div>
    </div>
</div>

<style>
    :global(.tooltip-content) {
        background-color: rgb(31, 41, 55) !important;
        border-color: rgb(55, 65, 81) !important;
    }
</style>