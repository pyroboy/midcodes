export const EVENT_STATUSES = ['nodata', 'forReview', 'approved', 'locked', 'locked_published'] as const;
export const USER_ROLES = ['Admin', 'TabulationHead'] as const;
export const EVENT_CATEGORIES = [
    'Athletics',
    'Academics & Literary',
    'Music',
    'Dances',
    'E-Sports',
    'MMUB',
    'Special'
] as const;

export type EventStatus = typeof EVENT_STATUSES[number];
export type UserRole = typeof USER_ROLES[number];
export type EventCategory = typeof EVENT_CATEGORIES[number];

export interface Event {
    id: string;
    event_name: string;
    medal_count: number | null;
    category: EventCategory;
    event_status: EventStatus;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

export interface LogChanges {
    previous?: Partial<Event>;
    current?: Partial<Event>;
}

export const AUTHORIZED_ROLES = USER_ROLES;

export const ROLE_STATUS_PERMISSIONS: Record<UserRole, readonly EventStatus[]> = {
    Admin: EVENT_STATUSES,
    TabulationHead: ['nodata', 'forReview', 'approved'] as const
};