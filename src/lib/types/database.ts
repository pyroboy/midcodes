import type { UserRole } from '$lib/auth/roleConfig';

export interface Organization {
    id: string;  // UUID
    name: string;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;  // UUID, matches auth.users.id
    email: string | null;
    role: UserRole;
    org_id: string | null;  // UUID reference to organizations.id
    created_at: string;
    updated_at: string;
    // Emulation-related fields
    isEmulated?: boolean;
    originalRole?: UserRole;
    originalOrgId?: string | null;
}

export interface RoleEmulationSession {
    id: string;  // UUID
    user_id: string;  // UUID
    original_role: UserRole;
    emulated_role: UserRole;
    created_at: string;
    expires_at: string;
    status: string;
    metadata: Record<string, any>;
}

export interface Template {
    id: string;  // UUID
    user_id: string | null;  // UUID
    name: string;
    front_background: string | null;
    back_background: string | null;
    orientation: string | null;
    created_at: string;
    updated_at: string;
    template_elements: Record<string, any>;
    org_id: string | null;  // UUID
}

export interface IdCard {
    id: string;  // UUID
    template_id: string | null;  // UUID
    front_image: string | null;
    back_image: string | null;
    data: Record<string, any> | null;
    created_at: string;
    org_id: string;  // UUID
}

export interface Event {
    id: string;  // UUID
    event_name: string;
    event_long_name: string | null;
    event_url: string | null;
    other_info: Record<string, any>;
    ticketing_data: Record<string, any>[];
    is_public: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;  // UUID
    org_id: string;  // UUID
}

export interface Attendee {
    id: string;  // UUID
    basic_info: Record<string, any>;
    event_id: string;  // UUID
    ticket_info: Record<string, any>;
    is_paid: boolean;
    is_printed: boolean;
    received_by: string | null;  // UUID
    qr_link: string | null;
    reference_code_url: string | null;
    attendance_status: string;
    qr_scan_info: Record<string, any>[];
    created_at: string;
    updated_at: string;
    org_id: string;  // UUID
}

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: Organization;
                Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Organization, 'id'>>;
            };
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Profile, 'id'>>;
            };
            role_emulation_sessions: {
                Row: RoleEmulationSession;
                Insert: Omit<RoleEmulationSession, 'id' | 'created_at'>;
                Update: Partial<Omit<RoleEmulationSession, 'id'>>;
            };
            templates: {
                Row: Template;
                Insert: Omit<Template, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Template, 'id'>>;
            };
            idcards: {
                Row: IdCard;
                Insert: Omit<IdCard, 'id' | 'created_at'>;
                Update: Partial<Omit<IdCard, 'id'>>;
            };
            events: {
                Row: Event;
                Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Event, 'id'>>;
            };
            attendees: {
                Row: Attendee;
                Insert: Omit<Attendee, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Attendee, 'id'>>;
            };
        };
        Views: {
            public_events: {
                Row: {
                    id: string;
                    event_name: string;
                    event_long_name: string | null;
                    event_url: string | null;
                    other_info: Record<string, any>;
                    ticketing_data: Record<string, any>[];
                    is_public: boolean;
                    org_id: string;
                    organization_name: string;
                };
            };
        };
        Functions: {
            get_effective_role: {
                Args: { user_uuid: string };
                Returns: UserRole;
            };
            get_template_by_id: {
                Args: { p_template_id: string; p_user_id: string };
                Returns: Template[];
            };
        };
        Enums: {
            user_role: UserRole;
        };
    };
}
