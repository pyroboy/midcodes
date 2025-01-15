import type { UserRole } from '$lib/auth/roleConfig';

export type { UserRole } from '$lib/auth/roleConfig';

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

export interface EventOtherInfo {
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    [key: string]: any;
}

export interface EventTicketType {
    name: string;
    price: number;
    description?: string;
    maxQuantity?: number;
    availableQuantity?: number;
    [key: string]: any;
}

export interface Event {
    id: string;  // UUID
    event_name: string;
    event_long_name: string | null;
    event_url: string | null;
    other_info: EventOtherInfo;
    ticketing_data: EventTicketType[];
    payment_timeout_minutes: number;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;  // UUID
    org_id: string;  // UUID
}

export interface Attendee {
    id: string;  // UUID
    basic_info: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    event_id: string;  // UUID
    ticket_info: {
        type: string;
        price: number;
        includes: string[];
    };
    is_printed: boolean;
    is_paid: boolean;
    qr_link: string | null;
    reference_code_url: string | null;
    payment_info?: {
        reference_number: string;
        url: string;
    };
    created_at: string;
    updated_at: string;
    org_id: string;
    attendance_status: 'registered' | 'paymentPending' | 'expired' | 'present' | 'exited';
}

export interface AttendeeWithStatus extends Attendee {
    status: 'registered' | 'paymentPending' | 'expired';
    time_remaining_minutes: number | null;
}

export interface AttendeeWithScanInfo extends Attendee {
    qr_scan_info: Array<{
        scan_time: string;
        scan_type: string;
        scanned_by: string;
        location?: string;
    }>;
    attendance_status: 'registered' | 'paymentPending' | 'expired' | 'present' | 'exited';
}

export interface ActionResultData {
    success: boolean;
    message: string;
    data?: any;
}

export interface PaymentDetails {
    attendeeId: string;  // UUID
    basicInfo: Record<string, any>;
    eventId: string;  // UUID
    isPaid: boolean;
    receivedBy: string | null;  // UUID
    createdAt: string;
    updatedAt: string;
}

export interface PaymentSummary {
    grandTotal: number;
    totalPaid: number;
    totalUnpaid: number;
    totalByReceiver: Record<string, number>;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    org_id: string;
    created_at: string;
    updated_at?: string;
}

export interface Account {
  id: number;
  lease_id: number;
  type: 'CREDIT' | 'DEBIT';
  category: 'RENT' | 'UTILITY' | 'PENALTY' | 'PAYMENT' | 'DEPOSIT' | 'OTHER';
  amount: number;
  paid_amount?: number;
  notes?: string;
  date_issued: string;
  due_on?: string;
  created_at: string;
  updated_at?: string;
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
            payment_details: {
                Row: PaymentDetails;
                Insert: Omit<PaymentDetails, 'createdAt' | 'updatedAt'>;
                Update: Partial<Omit<PaymentDetails, 'attendeeId'>>;
            };
            accounts: {
                Row: Account;
                Insert: Omit<Account, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>;
            };
        };
        Views: {
            public_events: {
                Row: {
                    id: string;
                    event_name: string;
                    event_long_name: string | null;
                    event_url: string | null;
                    other_info: EventOtherInfo;
                    ticketing_data: EventTicketType[];
                    is_public: boolean;
                    org_id: string;
                    organization_name: string;
                };
            };
            payment_summaries: {
                Row: PaymentSummary;
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
