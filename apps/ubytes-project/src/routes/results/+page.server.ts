import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

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

interface DepartmentData {
    id: string;
    department_name: string;
    department_acronym: string;
    department_logo: string | null;
    mascot_name: string | null;
    mascot_logo: string | null;
}

interface Event {
    id: string;
    event_name: string;
    medal_count: number | null;
    category: EventCategory;
    event_status: EventStatus;
    updated_by: string;
    updated_by_username?: string;
    created_at: string;
    updated_at: string;
    tie_group?: number | null;
}

interface TabulationDetail {
    tabulation_id: string;
    event_id: string;
    event_name: string;
    medal_count: number;
    department_id: string;
    department_name: string;
    department_logo: string;
    department_acronym: string;
    mascot_name: string | null;
    mascot_logo: string | null;
    tie_group:number;
    rank: number;
    updated_at: string;
    updated_by: string | null;
    updated_by_username: string | null;
    is_locked: boolean;
    is_published: boolean;
}

interface TallyData {
    department_id: string;
    updated_at: string | null;
    updated_by: string | null;
    updated_by_username: string | null;
    gold_count: number;
    silver_count: number;
    bronze_count: number;
    events: number;
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

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    // const session = await safeGetSession();
    let medalTally: TallyData[] = [];
    let events: Event[] = [];
    let departments: DepartmentData[] = [];
    let chartData: ChartData[] = [];
    let tabulationDetails: TabulationDetail[] = [];
    let categoryMedalTally: CategoryMedalTally[] = [];

    const { data: medalData, error: medalError } = await supabase
        .from('combined_tabulation_medal_tally_view')
        .select(`
            department_id,
            updated_at,
            updated_by,
            updated_by_username,
            gold_count,
            silver_count,
            bronze_count,
            events
        `);

    if (medalError) {
        console.error('Error fetching medal tally data:', medalError);
        throw error(500, 'Failed to fetch medal data');
    }

    medalTally = medalData ?? [];

    const { data: tabulationData, error: tabulationError } = await supabase
        .from('tabulation_details')
        .select('*')
        .order('rank');

    if (tabulationError) {
        console.error('Error fetching tabulation details:', tabulationError);
        throw error(500, 'Failed to fetch tabulation details');
    }

    tabulationDetails = tabulationData ?? [];

    const { data: categoryData, error: categoryError } = await supabase
        .from('category_medal_tally_view')
        .select('*')
        .order('category');

    if (categoryError) {
        console.error('Error fetching category medal data:', categoryError);
        throw error(500, 'Failed to fetch category medal data');
    }

    categoryMedalTally = categoryData ?? [];

    const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
            id,
            event_name,
            medal_count,
            category,
            event_status,
            updated_by,
            created_at,
            updated_at,
            tie_groups
        `);

    if (eventsError) {
        console.error('Error fetching events data:', eventsError);
        throw error(500, 'Failed to fetch events data');
    }

    if (eventsData) {
        const updaterIds = eventsData.map(event => event.updated_by).filter(Boolean);
        
        if (updaterIds.length > 0) {
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', updaterIds);

            const usernameLookup = new Map(profilesData?.map(profile => [profile.id, profile.username]) ?? []);

            events = eventsData.map(event => ({
                id: event.id,
                event_name: event.event_name,
                medal_count: event.medal_count,
                category: event.category as EventCategory,
                event_status: event.event_status as EventStatus,
                updated_by: event.updated_by,
                updated_by_username: event.updated_by ? usernameLookup.get(event.updated_by) : undefined,
                created_at: event.created_at,
                updated_at: event.updated_at,
                tie_group: event.tie_groups ? parseInt(event.tie_groups) : null
            }));
        }
    }

    const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select(`
            id,
            department_name,
            department_acronym,
            department_logo,
            mascot_name,
            mascot_logo
        `);

    if (departmentsError) {
        console.error('Error fetching departments data:', departmentsError);
        throw error(500, 'Failed to fetch departments data');
    }

    departments = departmentsData ?? [];

    chartData = medalTally.map(entry => {
        const department = departments.find(d => d.id === entry.department_id) ?? {
            department_name: 'Unknown Department',
            department_acronym: '',
            department_logo: null,
            mascot_name: null,
            mascot_logo: null
        };

        return {
            department_name: department.department_name,
            department_acronym: department.department_acronym,
            department_logo: department.department_logo,
            mascot_name: department.mascot_name,
            mascot_logo: department.mascot_logo,
            updated_at: entry.updated_at,
            updated_by: entry.updated_by,
            updated_by_username: entry.updated_by_username,
            gold_count: entry.gold_count,
            silver_count: entry.silver_count,
            bronze_count: entry.bronze_count,
            events: entry.events
        } satisfies ChartData;
    });

    return {
        medalTally,
        events,
        departments,
        chartData,
        tabulationDetails,
        categoryMedalTally
    };
}