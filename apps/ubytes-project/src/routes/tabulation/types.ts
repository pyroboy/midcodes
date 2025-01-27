export type DepartmentItem = {
    value: string;
    label: string;
    logo: string;
}

export type Ranking = {
    rank: number;
    department_id: number | null;
    tie_group: number | null;
}

export type Tabulation = {
    id: string;
    event_id: string;
    event_name: string;
    medal_count: number;
    department_name: string;
    department_logo?: string;
    rank: number;
    updated_at: string;
    updated_by_username: string;
    event_status: string;
    tie_group?: number | null;
}

export type TabulationPageData = {
    tabulations: Tabulation[];
    events: Array<{
        id: string;
        event_name: string;
        medal_count: number;
        category: string;
        event_status: string;
    }>;
    departments: Array<{ 
        id: number; 
        department_name: string;
        department_acronym: string;
        department_logo?: string;
    }>;
}