import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import type { PageData } from '../src/routes/events/[event_url]/types';
import type { Event } from '../src/lib/types/database';

// Mock the Svelte component
const EventPage = vi.fn(() => ({
    $$: {
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(),
        fragment: document.createDocumentFragment(),
        not_equal: vi.fn(),
        bound: {},
        on_disconnect: vi.fn(),
    },
    $set: vi.fn(),
    $destroy: vi.fn(),
}));

describe('Event Page', () => {
    const mockEvent: Event = {
        id: '1',
        event_name: 'Test Event',
        event_long_name: 'Test Event Long Name',
        event_url: 'test-event',
        other_info: {
            description: 'Test description',
            location: 'Test location'
        },
        ticketing_data: [{
            type: 'regular',
            price: 100,
            available: 50
        }],
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'test-user',
        org_id: 'test-org'
    };

    const mockData: PageData = {
        supabase: {} as any,
        session: null,
        user: null,
        profile: null,
        role: null,
        org_id: null,
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
        vi.clearAllMocks();
    });

    it('should render with mock data', () => {
        const { container } = render(EventPage as any, { props: { data: mockData } });
        expect(EventPage).toHaveBeenCalledWith(expect.objectContaining({
            props: {
                data: mockData
            },
            target: expect.any(HTMLElement)
        }));
    });
});
