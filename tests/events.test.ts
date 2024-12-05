import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import EventPage from '../src/routes/events/[event_url]/+page.svelte';
import type { PageData } from '../src/routes/events/[event_url]/types';
import type { Event, EventOtherInfo, EventTicketType } from '$lib/types/database';

describe('Event Page', () => {
    const mockEvent: Event = {
        id: '1',
        event_name: 'Test Event',
        event_long_name: 'Test Event Long Name',
        event_url: 'test-event',
        other_info: {
            city: 'Test City',
            venue: 'Test Venue',
            address: 'Test Address',
            endDate: new Date().toISOString(),
            startDate: new Date().toISOString(),
            timezone: 'UTC',
            description: 'Test Description',
            capacity: 100,
            organizer: {
                name: 'Test Organizer',
                phone: '123-456-7890',
                contact: 'test@example.com',
                leadPastor: 'Test Pastor'
            },
            website: 'https://example.com',
            facebook: 'https://facebook.com/testevent',
            instagram: 'https://instagram.com/testevent',
            twitter: 'https://twitter.com/testevent'
        } satisfies EventOtherInfo,
        ticketing_data: [] as EventTicketType[],
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'test-user',
        org_id: '1'
    };

    const mockData: PageData = {
        supabase: {} as any,
        session: null,
        user: null,
        profile: null,
        organizations: [],
        currentOrg: null,
        event: mockEvent,
        eventStatus: {
            isActive: true,
            isRegistrationOpen: true,
            hasCapacity: true,
            registrationStartDate: new Date(),
            registrationEndDate: new Date(Date.now() + 86400000) // 1 day from now
        },
        stats: {
            totalRegistrations: 50,
            paidCount: 40,
            totalRevenue: 5000,
            ticketTypeCounts: {
                'Early Bird': 20,
                'Regular': 30
            },
            recentActivity: []
        }
    };

    beforeEach(() => {
        // Clear any previous renders
        document.body.innerHTML = '';
    });

    it('renders event page with event name', () => {
        render(EventPage, { props: { data: mockData } });
        expect(screen.getByText('Test Event')).toBeTruthy();
        expect(screen.getByText('Test Event Long Name')).toBeTruthy();
    });

    it('renders all navigation routes', () => {
        render(EventPage, { props: { data: mockData } });
        expect(screen.getByText('Registration')).toBeTruthy();
        expect(screen.getByText('Payments')).toBeTruthy();
        expect(screen.getByText('Name Tags')).toBeTruthy();
    });
});
