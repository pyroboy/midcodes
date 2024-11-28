export interface Organization {
    id: string;  // UUID
    name: string;
    created_at: string;
    updated_at: string;
}

export type UserRole = 'super_admin' | 'org_admin' | 'event_admin' | 'user' | 'event_qr_checker';

export interface Profile {
    id: string;  // UUID, matches auth.users.id
    role: UserRole;
    org_id: string | null;  // UUID reference to organizations.id
    created_at: string;
    updated_at: string;
    full_name?: string;
}

export interface EventOtherInfo {
    city: string;
    venue: string;
    address: string;
    endDate: string;
    capacity: number;
    startDate: string;
    organizer: {
        name: string;
        phone: string;
        contact: string;
        leadPastor: string;
    };
}

export interface EventTicketType {
    type: string;
    price: number;
    includes: string[];
    available: number;
}

export interface Event {
    id: string;  // UUID
    event_name: string;
    event_long_name: string | null;
    event_url: string;
    other_info: EventOtherInfo;
    ticketing_data: EventTicketType[];
    is_public: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;  // UUID reference to auth.users.id
    org_id: string;     // UUID reference to organizations.id
    organizations?: Organization;  // Join with organizations table
}

export interface BasicInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    [key: string]: any;  // Allow additional fields
}

export interface TicketInfo {
    type: string;
    price: number;
    [key: string]: any;  // Allow additional fields
}

export interface QrScanInfo {
    scan_time: string;
    scanned_by: string;  // UUID reference to auth.users.id
    scan_type: 'entry' | 'exit';
    scan_notes?: string;
    scan_location?: string;
}

export interface PaymentInfo {
    amount: number;
    payment_method: string;
    payment_date: string;
    payment_reference?: string;
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_notes?: string;
}

export interface PaymentSummary {
    grandTotal: number;
    totalByReceiver: Record<string, number>;
    totalPaid: number;
    totalUnpaid: number;
}

export interface Attendee {
    id: string;  // UUID
    basic_info: BasicInfo;
    event_id: string;  // UUID reference to events.id
    ticket_info: TicketInfo;
    is_paid: boolean;
    payment_info?: PaymentInfo;
    payment_date?: string;
    is_printed: boolean;
    received_by: string | null;  // UUID reference to auth.users.id
    qr_link: string | null;
    reference_code_url: string | null;
    attendance_status: 'notRegistered' | 'registered' | 'present' | 'exited';
    qr_scan_info: QrScanInfo[];
    created_at: string;
    updated_at: string;
    org_id: string;  // UUID reference to organizations.id
    profiles?: Profile;  // Join with profiles table through received_by
}

export interface AttendeeWithScanInfo {
    id: string;
    basic_info: BasicInfo;
    qr_scan_info: QrScanInfo[];
    attendance_status: 'notRegistered' | 'registered' | 'present' | 'exited';
    reference_code_url: string | null;
}

export interface ActionResultData {
    message?: string;
    success: boolean;
    data?: any;
}

export interface PublicEvent {
    id: string;
    event_name: string;
    event_long_name: string;
    event_url: string;
    other_info: EventOtherInfo;
    ticketing_data: EventTicketType[];
    is_public: boolean;
    org_id: string;
    organization_name: string;
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
            events: {
                Row: Event;
                Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'organizations'>;
                Update: Partial<Omit<Event, 'id' | 'organizations'>>;
            };
            attendees: {
                Row: Attendee;
                Insert: Omit<Attendee, 'id' | 'created_at' | 'updated_at' | 'profiles'>;
                Update: Partial<Omit<Attendee, 'id' | 'profiles'>>;
            };
        };
        Functions: {
            // Add any custom database functions here
        };
        Enums: {
            // Add any custom enum types here
        };
    };
}
