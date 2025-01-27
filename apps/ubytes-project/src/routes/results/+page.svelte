<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
    import { Button } from '$lib/components/ui/button';
    import MedalGraph from './MedalGraph.svelte';
    import EventDetails from './EventDetails.svelte';
    import DepartmentLogo from './DepartmentLogo.svelte';
    import Footer from './Footer.svelte';
    import { useMascotLogo } from './logoStore';
    import { medalTallyStore } from '$lib/stores/medalTallyStore';
    import MedalTallyHeader from './MedalTallyHeader.svelte';
import AuthOverlay from './AuthOverlay.svelte';
    const EVENT_STATUSES = ['nodata', 'forReview', 'approved', 'locked', 'locked_published'] as const;
    const EVENT_CATEGORIES = [
        'Athletics',
        'Academics & Literary',
        'Music',
        'Dances',
        'E-Sports',
        'MMUB',
        'Special'
    ] as const;

    type EventStatus = typeof EVENT_STATUSES[number];
    type EventCategory = typeof EVENT_CATEGORIES[number];

    let activeTab = 'live-tally';
    let tallyViewType: 'graph' | 'table' = 'graph';

    function handleTabChange(value: string | undefined) {
        if (value) {
            activeTab = value;
        }
    }

    interface DepartmentData {
        id: string;
        department_name: string;
        department_acronym: string;
        department_logo: string | null;
        mascot_name: string | null;
        mascot_logo: string | null;
    }

    interface ChartData {
        department_name: string;
        department_acronym: string;
        department_logo: string | null;
        mascot_name: string | null;
        mascot_logo: string | null;
        updated_at: string | null;
        updated_by: string | null;
        updated_by_username: string | null;
        gold_count: number;
        silver_count: number;
        bronze_count: number;
        events: number;
    }

    interface Event {
        id: string;
        event_name: string;
        category: EventCategory;
        event_status: EventStatus;
        medal_count: number | null;
        is_locked: boolean;
        is_published: boolean;
    }

    interface TabulationDetail {
        event_id: string;
        event_name: string;
        medal_count: number;
        player_count: number;
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

    export let data: {
        medalTally: any[];
        events: Event[];
        departments: DepartmentData[];
        chartData: ChartData[];
        tabulationDetails: TabulationDetail[];
        categoryMedalTally: CategoryMedalTally[];
    };

    $: chartData = $medalTallyStore
    .map(entry => {
        const departmentData = data.departments.find(d => d.id === entry.department_id);
        return {
            department_name: departmentData?.department_name || 'Unknown Department',
            department_acronym: departmentData?.department_acronym || '',
            department_logo: departmentData?.department_logo || null,
            mascot_name: departmentData?.mascot_name || null,
            mascot_logo: departmentData?.mascot_logo || null,
            updated_at: entry.updated_at || null,
            updated_by: entry.updated_by || null,
            updated_by_username: entry.updated_by_username || null,
            gold_count: entry.gold_count,
            silver_count: entry.silver_count,
            bronze_count: entry.bronze_count,
            events: entry.events
        } satisfies ChartData;
    })
    .sort((a, b) => {
        if (a.gold_count !== b.gold_count) return b.gold_count - a.gold_count;
        if (a.silver_count !== b.silver_count) return b.silver_count - a.silver_count;
        return b.bronze_count - a.bronze_count;
    });

    interface TabulationDetail {
    event_id: string;
    event_name: string;
    category: EventCategory;  // Added this required field
    medal_count: number;
    player_count: number;
    department_id: string;
    department_name: string;
    department_logo: string;
    rank: number;
    updated_at: string;
    updated_by: string;
    updated_by_username: string;
    is_locked: boolean;
    is_published: boolean;
}

$: tabulationDetails = $medalTallyStore.flatMap(entry => {
    const departmentData = data.departments.find(d => d.id === entry.department_id);
    const publishedEvents = data.events.filter(e => e.event_status === 'locked_published');
    
    return publishedEvents.map(event => ({
        event_id: event.id,
        event_name: event.event_name,
        category: event.category,  // Added the missing field
        medal_count: event.medal_count || 0,
        player_count: 0,
        department_id: entry.department_id,
        department_name: departmentData?.department_name || 'Unknown Department',
        department_logo: departmentData?.department_logo || '',
        rank: entry.gold_count > 0 ? 1 : entry.silver_count > 0 ? 2 : 3,
        updated_at: entry.updated_at || '',
        updated_by: entry.updated_by || '',
        updated_by_username: entry.updated_by_username || '',
        is_locked: event.event_status === 'locked_published',
        is_published: event.event_status === 'locked_published'
    }));
});
    $: eventsForDetails = data.events.map(event => ({
        id: event.id,
        event_name: event.event_name,
        category: event.category,
        medal_count: event.medal_count || 0,
        is_locked: event.event_status === 'locked_published',
        is_published: event.event_status === 'locked_published'
    }));
</script>

<style>
    :global(body) {
        background-image: url('/images/linesBG.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-attachment: fixed;
    }

    .layout-container {
        position: relative;
        min-height: 100vh;
        width: 100%;
    }

    .content-wrapper {
        max-width: 1600px;
        margin: 0 auto;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
    }

    .floating-background {
        position: fixed;
        width: 70.5vw;
        height: 111vh;
        top: 20.7vh;
        left: 52.7vw;
        transform: rotate(9.24deg);
        opacity: 0.90;
        filter: blur(5px);
        will-change: transform;
        pointer-events: none;
        user-select: none;
        z-index: 0;
        background-image: url('/images/floatBG.png');
        background-size: contain;
        background-repeat: no-repeat;
        transition: transform 3s ease-in-out;
        animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
        0% {
            transform: rotate(9.24deg) translateY(0px);
        }
        50% {
            transform: rotate(9.24deg) translateY(-20px);
        }
        100% {
            transform: rotate(9.24deg) translateY(0px);
        }
    }
</style>
<AuthOverlay  />
<div class="floating-background" />
  
<MedalTallyHeader />
<div class="layout-container">
    <div class="content-wrapper">
        <div class="flex flex-col h-full gap-4 mb-10">
            <Tabs value={activeTab} onValueChange={handleTabChange} class="space-y-4">
                               <TabsList>
                    <TabsTrigger value="live-tally">Live Tally</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                <TabsContent value="live-tally" class="space-y-4">              
      
                    <Card>
                        <CardHeader>
                            <div class="flex justify-between items-center">
                               <CardTitle class="pl-5 text-gray-300 italic text-2xl sm:text-3xl md:text-4xl lg:text-5xl">Gold Rankings</CardTitle>

                                <div class="flex gap-2">
                                    <Button 
                                        variant={tallyViewType === 'graph' ? 'default' : 'outline'}
                                        on:click={() => tallyViewType = 'graph'}
                                        class="min-w-[80px]"
                                    >
                                        Graph
                                    </Button>
                                    <Button 
                                        variant={tallyViewType === 'table' ? 'default' : 'outline'}
                                        on:click={() => tallyViewType = 'table'}
                                        class="min-w-[80px]"
                                    >
                                        Table
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent class="min-h-[600px]">
                            {#if tallyViewType === 'graph'}
                                <div class="w-full h-full">
                                    <MedalGraph data={chartData} />
                                </div>
                            {:else}
                                <div class="overflow-x-auto">
                                    <table class="w-full border-collapse">
                                        <thead>
                                            <tr class="border-b">
                                                <th class="text-left p-2">Department</th>
                                                <th class="text-center p-2">Events</th>
                                                <th class="text-center p-2">Gold</th>
                                                <th class="text-center p-2">Silver</th>
                                                <th class="text-center p-2">Bronze</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {#each chartData as entry}
                                                <tr class="border-b hover:bg-gray-50">
                                                    <td class="p-2">
                                                        <div class="flex items-center gap-2">
                                                            <DepartmentLogo 
                                                                departmentLogoSrc={entry.department_logo}
                                                                mascotLogoSrc={entry.mascot_logo} 
                                                                acronym={entry.department_acronym} 
                                                                mascotName={entry.mascot_name} 
                                                                size={32} 
                                                                useMascot={$useMascotLogo}
                                                            />
                                                            <div class="flex flex-col">
                                                                <span class="font-medium">{entry.department_name}</span>
                                                                <span class="text-sm text-gray-500">{entry.department_acronym}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="text-center p-2">{entry.events}</td>
                                                    <td class="text-center p-2 font-medium text-yellow-500">{entry.gold_count}</td>
                                                    <td class="text-center p-2 font-medium text-gray-400">{entry.silver_count}</td>
                                                    <td class="text-center p-2 font-medium text-orange-700">{entry.bronze_count}</td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                </div>
                            {/if}
                        </CardContent>
                        <Footer />
                    </Card>
                </TabsContent>

                <TabsContent value="details" class="space-y-4">
                    <EventDetails 
                        tabulationDetails={data.tabulationDetails}
                        events={eventsForDetails} 
                        categoryMedalTally={data.categoryMedalTally}
                        eventCategories={EVENT_CATEGORIES}
                    />
                </TabsContent>
            </Tabs>
        </div>
    </div>
</div>