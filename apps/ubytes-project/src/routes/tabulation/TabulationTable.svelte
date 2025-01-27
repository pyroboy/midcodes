<script lang="ts">
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
import SupabaseImage from '$lib/components/SupabaseImage.svelte';
    type EventStatus = 'nodata' | 'forReview' | 'approved' | 'locked' | 'locked_published';
    type MedalRank = 1 | 2 | 3;
    type TiePosition = 'single' | 'first' | 'middle' | 'last';

    interface Tabulation {
        id: string;
        event_name: string;
        medal_count: number;
        department_name: string;
        department_logo?: string;
        rank: number;
        tie_group: number | null;
        updated_at: string;
        updated_by_username: string;
        event_id: string;
        event_status: EventStatus;
    }
    interface ImageTransformOptions {
    width?: number;
    height?: number;
    quality?: number;
}

    export let tabulations: Tabulation[];
    export let isProcessing: Record<string, boolean> = {};
    export let rowErrors: Record<string, boolean> = {};

    const medalStyles: Record<MedalRank, { color: string, label: string }> = {
        1: { color: 'text-yellow-500', label: 'Gold' },
        2: { color: 'text-gray-400', label: 'Silver' },
        3: { color: 'text-amber-600', label: 'Bronze' }
    };

    const statusConfig: Record<EventStatus, { bgColor: string, textColor: string, label: string }> = {
        nodata: { bgColor: 'bg-gray-100', textColor: 'text-gray-800', label: 'No Data' },
        forReview: { bgColor: 'bg-blue-100', textColor: 'text-blue-800', label: 'For Review' },
        approved: { bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Approved' },
        locked: { bgColor: 'bg-amber-100', textColor: 'text-amber-800', label: 'Locked' },
        locked_published: { bgColor: 'bg-purple-100', textColor: 'text-purple-800', label: 'Published' }
    };


    function getTransformKey(originalUrl: string, options: ImageTransformOptions): string {
    const match = originalUrl.match(/^(.*\/)?([^/]+)\.([^.]+)$/); // Match base URL, filename, and extension
    if (!match) throw new Error("Invalid URL format");
    const [, basePath = '', baseName, ext] = match; // Destructure match results
    const transformString = [
        options.width && `w${options.width}`,
        options.height && `h${options.height}`,
        options.quality && `q${options.quality}`,
    ].filter(Boolean).join('-');

    return `${basePath}${baseName}-${transformString}.${ext}`;
}




    function isFirstInEventGroup(tabulation: Tabulation, index: number): boolean {
        if (index === 0) return true;
        return tabulation.event_name !== tabulations[index - 1].event_name;
    }

    function getEventGroupRowSpan(tabulation: Tabulation, index: number): number {
    if (!isFirstInEventGroup(tabulation, index)) return 1;





    const baseCount = tabulations.slice(index)
        .findIndex(t => t.event_name !== tabulation.event_name);
    
    // If it's the last group (baseCount is -1), count the remaining rows exactly
    if (baseCount === -1) {
        return tabulations.slice(index)
            .filter(t => t.event_name === tabulation.event_name)
            .length * 2
    }
    
    // Multiply by 2 to account for the metadata row for non-last groups
    return baseCount * 2;
}

    function getTiedRankings(tabulation: Tabulation): Tabulation[] {
        if (!tabulation.tie_group) return [];
        
        return tabulations
            .filter(t => 
                t.event_name === tabulation.event_name && 
                t.tie_group === tabulation.tie_group
            )
            .sort((a, b) => a.rank - b.rank);
    }

    function findTieGroupPosition(tabulation: Tabulation): TiePosition {
        if (!tabulation.tie_group) return 'single';

        const tiedRankings = getTiedRankings(tabulation);
        if (!tiedRankings.length) return 'single';

        if (tabulation.rank === tiedRankings[0].rank) return 'first';
        if (tabulation.rank === tiedRankings[tiedRankings.length - 1].rank) return 'last';
        return 'middle';
    }

    function getEffectiveRank(tabulation: Tabulation): number {
        if (!tabulation.tie_group) {
            let rankShift = 0;
            const tiedRanksBefore = tabulations
                .filter(t => 
                    t.event_name === tabulation.event_name && 
                    t.tie_group !== null && 
                    t.rank < tabulation.rank
                );

            const uniqueTieGroups = new Set(tiedRanksBefore.map(t => t.tie_group));
            
            for (const tieGroup of uniqueTieGroups) {
                const groupMembers = tiedRanksBefore.filter(t => t.tie_group === tieGroup);
                rankShift += groupMembers.length - 1;
            }

            return tabulation.rank - rankShift;
        }

        const tieGroupMembers = tabulations
            .filter(t => 
                t.event_name === tabulation.event_name && 
                t.tie_group === tabulation.tie_group
            )
            .sort((a, b) => a.rank - b.rank);

        if (!tieGroupMembers.length) return tabulation.rank;

        const firstRankInGroup = tieGroupMembers[0].rank;
        let rankShift = 0;
        
        const previousTieGroups = tabulations
            .filter(t => 
                t.event_name === tabulation.event_name && 
                t.tie_group !== null && 
                t.tie_group !== tabulation.tie_group &&
                t.rank < firstRankInGroup
            );

        const uniquePreviousGroups = new Set(previousTieGroups.map(t => t.tie_group));
        
        for (const tieGroup of uniquePreviousGroups) {
            const groupMembers = previousTieGroups.filter(t => t.tie_group === tieGroup);
            rankShift += groupMembers.length - 1;
        }

        return firstRankInGroup - rankShift;
    }

    function getTieGroupLength(tabulation: Tabulation): number {
        const tiedRankings = getTiedRankings(tabulation);
        return tiedRankings.length;
    }

    function getRankSuffix(rank: number): string {
        if (rank % 10 === 1 && rank !== 11) return 'st';
        if (rank % 10 === 2 && rank !== 12) return 'nd';
        if (rank % 10 === 3 && rank !== 13) return 'rd';
        return 'th';
    }

    function getMedalInfo(rank: number, medalCount: number): { color: string, label: string } {
        if (rank <= 3 && rank in medalStyles) {
            const style = medalStyles[rank as MedalRank];
            return { ...style, label: `${style.label}-${medalCount}` };
        }
        const suffix = getRankSuffix(rank);
        return { color: 'text-gray-600', label: `${rank}${suffix}` };
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleString();
    }

    function getStatusClasses(status: EventStatus): string {
        const config = statusConfig[status];
        return `${config.bgColor} ${config.textColor}`;
    }

    function getTieGroupStyle(position: TiePosition, length: number): string {
        if (position === 'single') return '';
        
        const baseStyles = 'absolute z-10 flex items-center justify-center';
        const heightStyles = position === 'first' ? 
            'top-0 -bottom-[21px]' : 
            position === 'last' ? 
            '-top-[21px] bottom-0' : 
            '-top-[21px] -bottom-[21px]';
            
        return `${baseStyles} ${heightStyles}`;
    }
</script>

<div class="mt-8 w-full">
    <div class="mb-4">
        <h3 class="text-xl font-bold">Event Tabulations</h3>
    </div>

    {#if tabulations?.length > 0}
        <div class="overflow-x-auto">
            <table class="w-full border-collapse">
                <thead>
                    <tr class="border-b bg-gray-50">
                        <th class="px-4 py-2 text-left font-semibold">Event Status</th>
                        <th class="px-4 py-2 text-left font-semibold">Event</th>
                        <th class="px-4 py-2 w-24 text-center font-semibold">Rank</th>
                        <th class="px-4 py-2 text-center font-semibold">Medal</th>
                        <th class="px-4 py-2 text-left font-semibold">Department</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tabulations as tabulation, index (tabulation.id)}
                        {@const tiePosition = findTieGroupPosition(tabulation)}
                        {@const effectiveRank = getEffectiveRank(tabulation)}
                        {@const medalInfo = getMedalInfo(effectiveRank, tabulation.medal_count)}
                        {@const tieGroupLength = getTieGroupLength(tabulation)}
                        {@const isFirstInGroup = isFirstInEventGroup(tabulation, index)}
                        {@const rowSpan = getEventGroupRowSpan(tabulation, index)}
                        
                        <tr 
                            class="border-b hover:bg-gray-50 transition-colors duration-150 h-10"
                            class:opacity-50={isProcessing[tabulation.id]}
                        >
                            {#if isFirstInGroup}
                                <td class="px-4 py-2" rowspan={rowSpan / 2}>
                                    <div>
                                        <span class={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center justify-center ${getStatusClasses(tabulation.event_status)}`}>
                                            {statusConfig[tabulation.event_status].label}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-4 py-2" rowspan={rowSpan / 2}>
                                    <div class="flex flex-col gap-1">
                                        <span>{tabulation.event_name}</span>
                                        <span class="text-xs text-gray-500">
                                            Updated by: {tabulation.updated_by_username || 'Unknown'} at {formatDate(tabulation.updated_at)}
                                        </span>
                                    </div>
                                </td>
                            {/if}
                            <td class="px-4 py-2 w-24 relative">
                                <div class="relative flex items-center justify-center h-10">
                                    {#if tiePosition !== 'single'}
                                        <div class={getTieGroupStyle(tiePosition, tieGroupLength)}>
                                            <div class="w-[10px] bg-blue-500"
                                                class:rounded-t-full={tiePosition === 'first'}
                                                class:rounded-b-full={tiePosition === 'last'}
                                                style="height: calc(70% );"
                                            />
                                        </div>
                                    {/if}
                                    
                                    {#if tiePosition === 'first'}
                                        <div class="absolute z-20" style="top: calc({tieGroupLength / 2} * 40px - 12px)">
                                            <div class="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-blue-500 bg-white">
                                                <span class="text-sm font-semibold text-gray-700">
                                                    {effectiveRank}
                                                </span>
                                            </div>
                                        </div>
                                    {:else if tiePosition === 'single'}
                                        <div class="flex items-center justify-center w-6 h-6">
                                            <span class="text-sm font-semibold text-gray-700">
                                                {effectiveRank}
                                            </span>
                                        </div>
                                    {/if}
                                </div>
                            </td>
                            <td class="px-4 py-2 text-center">
                                <span class={`font-bold ${medalInfo.color}`}>
                                    {medalInfo.label}
                                </span>
                            </td>
                            <td class="px-4 py-2">
                                <div class="flex items-center gap-2">
                                    {#if tabulation.department_logo}


                      <span  class="w-6 h-6 rounded-full object-cover">
                                    <SupabaseImage
                                    bucket="department-logos"
                                    imageUrl={tabulation.department_logo}
                                    label={tabulation.department_name}
                                    width={57}
                                    height={57}
                                    quality={66}
                                />
                            </span>
                            <!-- {console.log(tabulation.department_logo)} -->
                       
                                        <!-- <img 
                                            src={getTransformKey(tabulation.department_logo,{ width:50,height:50,quality:80})} 
                                            alt={tabulation.department_name}
                                            class="w-6 h-6 rounded-full object-cover"
                                        /> -->
                                    {/if}
                                    <span>{tabulation.department_name}</span>
                                </div>
                            </td>
                        </tr>
                        {#if rowErrors[tabulation.id]}
                            <tr transition:fade|local>
                                <td colspan={isFirstInGroup ? 5 : 3} class="px-4 py-2 bg-red-50">
                                    <div class="text-red-600 text-sm">
                                        {rowErrors[tabulation.id]}
                                    </div>
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <div class="text-center py-8 text-gray-500">
            <p>No tabulations found.</p>
        </div>
    {/if}
</div>

<style>
    :global(.rankings-container) {
        position: relative;
    }

    :global(th) {
        vertical-align: middle;
    }

    :global(tr) {
        position: relative;
        border-bottom: 1px solid #e5e7eb;
    }

    :global(td) {
        position: relative;
        background-clip: padding-box;
    }

    :global(.bg-blue-500) {
        transition: background-color 150ms ease-in-out;
    }

    :global(tr:hover .bg-blue-500) {
        background-color: rgb(59 130 246 / 0.9);
    }

    .border-blue-500 {
        transition: border-color 150ms ease-in-out;
    }

    tr:hover .border-blue-500 {
        border-color: rgb(59 130 246 / 0.8);
    }
</style>