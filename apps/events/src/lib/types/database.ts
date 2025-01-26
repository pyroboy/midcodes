export interface Event {
    id: string;
    event_name: string;
    long_name: string | null;
    description: string | null;
    start_date: string;
    end_date: string;
    registration_start: string;
    registration_end: string;
    payment_methods: Record<string, Record<string, string>>;
    payment_instructions: string | null;
    payment_timeout_minutes: number;
    other_info: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface EventTicketType {
    id: string;
    event_id: string;
    name: string;
    description: string | null;
    price: number;
    quantity: number;
    sold: number;
    created_at: string;
    updated_at: string;
}

export interface Attendee {
    id: string;
    event_id: string;
    ticket_type_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    reference_code: string;
    reference_code_url: string;
    qr_code_url: string;
    is_paid: boolean;
    payment_deadline: string;
    additional_info: Record<string, string>;
    created_at: string;
    updated_at: string;
}

export interface AttendeeWithScanInfo extends Attendee {
    ticket_type: EventTicketType;
    scan_count: number;
    last_scan: string | null;
}

export interface ActionResultData {
    success: boolean;
    message: string;
    data?: any;
}
