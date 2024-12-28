import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { configureTestEnv, normalizeHtml } from '@test-utils/environment';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import Page from '../+page.svelte';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Room, Property, Floor } from '../formSchema';
import type { SuperValidated } from 'sveltekit-superforms';
import type { UserRole } from '$lib/auth/roleConfig';
import type { SessionWithAuth, ServerProfile } from '$lib/types/auth';
import type { NavigationState } from '$lib/types/navigation';
import type { Emulation } from '$lib/types/roles';
import type { PageParentData } from '$lib/types/pages';

// Helper function to normalize HTML and remove dynamic content
const normalizeSnapshot = (html: string): string => {
  return normalizeHtml(html)
    // Replace dynamic IDs
    .replace(/aria-controls="[^"]*"/g, 'aria-controls="test-id"')
    .replace(/aria-labelledby="[^"]*"/g, 'aria-labelledby="test-label"')
    .replace(/id="[^"]*"/g, 'id="test-id"')
    // Replace dynamic dates
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/g, 'TEST_DATE');
};

interface PageData {
  user: User & { role: string };
  rooms: Room[];
  properties: Property[];
  floors: Floor[];
  form: SuperValidated<any>;
}

// Configure test environment
configureTestEnv();
expect.extend({ toMatchImageSnapshot });

type RouteParams = Record<string, string>;
type TypedServerLoadEvent = ServerLoadEvent<RouteParams, PageParentData, "/dorm/rooms">;

const mockFormData: SuperValidated<any> = {
  id: 'test-form',
  valid: true,
  posted: false,
  errors: {},
  data: {},
  constraints: {}
};

// Mock data using imported types
const mockRooms: Room[] = [
  {
    id: 1,
    name: 'Test Room 101',
    number: 101,
    capacity: 1,
    room_status: 'VACANT',
    base_rate: 5000,
    property_id: 1,
    floor_id: 1,
    type: 'single',
    amenities: [],
    created_at: '2024-01-01T00:00:00.000Z', // Fixed date for consistent snapshots
    updated_at: '2024-01-01T00:00:00.000Z', // Fixed date for consistent snapshots
    property: {
      id: 1,
      name: 'Test Property'
    },
    floor: {
      id: 1,
      property_id: 1,
      floor_number: 1,
      wing: 'A'
    }
  }
];

const mockEmptyRooms: Room[] = [];

const mockLoadedRooms: Room[] = [
  ...mockRooms,
  {
    id: 2,
    name: 'Test Room 102',
    number: 102,
    capacity: 2,
    room_status: 'OCCUPIED',
    base_rate: 6000,
    property_id: 1,
    floor_id: 1,
    type: 'double',
    amenities: ['wifi', 'aircon'],
    created_at: '2024-01-01T00:00:00.000Z', // Fixed date for consistent snapshots
    updated_at: '2024-01-01T00:00:00.000Z', // Fixed date for consistent snapshots
    property: {
      id: 1,
      name: 'Test Property'
    },
    floor: {
      id: 1,
      property_id: 1,
      floor_number: 1,
      wing: 'A'
    }
  }
];

const mockProfile: ServerProfile = {
  id: 'mock-profile-id',
  email: 'mock@example.com',
  role: 'super_admin',
  org_id: 'mock-org-id',
  context: {},
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  isEmulated: false,
  originalRole: 'user',
  originalOrgId: null,
};

const mockNavigation: NavigationState = {
  homeUrl: '/home',
  showHeader: true,
  allowedPaths: ['/home', '/about', '/contact'],
  showRoleEmulation: false,
};

const mockEmulation: Emulation = {
  organizationName: null,
  role: null,
  context: {},
  metadata: {}
};

const mockProperties: Property[] = [
  {
    id: 1,
    name: 'Test Property'
  }
];

const mockFloors: Floor[] = [
  {
    id: 1,
    property_id: 1,
    floor_number: 1,
    wing: 'A'
  }
];

const createMockUser = (id: string, email: string): User & { role: string } => ({
  id,
  email,
  role: 'user',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  phone: '',
  confirmed_at: '',
  email_confirmed_at: '',
  last_sign_in_at: '',
  confirmation_sent_at: '',
  identities: [],
  invited_at: '',
});

const mockStaffUser = createMockUser('mock-staff-id', 'staff@example.com');
const mockAdminUser = createMockUser('mock-admin-id', 'admin@example.com');

const createSupabaseResponse = <T>(data: T) => ({
  data,
  error: null,
  count: Array.isArray(data) ? data.length : null,
  status: 200,
  statusText: 'OK',
  body: data
});

const mockSession: SessionWithAuth = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_in: 3600,
  expires_at: new Date('2024-01-01T00:00:00.000Z').getTime() + 3600000,
  token_type: 'bearer',
  user: mockAdminUser,
  roleEmulation: {
    active: false,
    original_role: 'user',
    emulated_role: 'super_admin',
    original_org_id: null,
    emulated_org_id: null,
    expires_at: '2024-01-01T01:00:00.000Z',
    session_id: 'mock-session-id',
    organizationName: null
  },
  session: {
    roleEmulation: {
      active: false,
      emulated_org_id: null
    }
  },
  profile: mockProfile,
  error: null
};

const mockSupabaseClient = {
  from: vi.fn().mockImplementation((table: string) => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockImplementation(() => {
          return Promise.resolve(createSupabaseResponse(
            table === 'rooms' ? mockRooms :
            table === 'properties' ? mockProperties :
            table === 'floors' ? mockFloors :
            []
          ));
        }),
        single: vi.fn().mockReturnValue(Promise.resolve(createSupabaseResponse(null))),
        neq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue(Promise.resolve(createSupabaseResponse(null)))
        })
      }),
      order: vi.fn().mockImplementation(() => {
        return Promise.resolve(createSupabaseResponse(
          table === 'rooms' ? mockRooms :
          table === 'properties' ? mockProperties :
          table === 'floors' ? mockFloors :
          []
        ));
      })
    })
  })),
  rpc: vi.fn().mockReturnValue(Promise.resolve(createSupabaseResponse(null)))
} as unknown as SupabaseClient;

// Mocks
vi.mock('@sveltejs/kit', async () => {
  const actual = await vi.importActual('@sveltejs/kit');
  return {
    ...actual,
    redirect: (status: number, location: string) => {
      console.log('[Debug] redirect called:', { status, location });
      const error = new Error('Redirect');
      (error as any).status = status;
      (error as any).location = location;
      throw error;
    },
    fail: (status: number, data?: Record<string, any>) => {
      console.log('[Debug] fail called:', { status, data });
      return { status, data };
    }
  };
});

vi.mock('sveltekit-superforms/server', () => ({
  superValidate: vi.fn().mockResolvedValue({
    data: {},
    errors: {},
    valid: true
  })
}));

vi.mock('sveltekit-superforms/client', () => ({
  superForm: () => ({
    form: {
      subscribe: (fn: (value: any) => void) => {
        fn({});
        return { unsubscribe: vi.fn() };
      }
    },
    errors: {
      subscribe: (fn: (value: any) => void) => {
        fn({});
        return { unsubscribe: vi.fn() };
      }
    },
    enhance: vi.fn(),
    submitting: {
      subscribe: (fn: (value: boolean) => void) => {
        fn(false);
        return { unsubscribe: vi.fn() };
      }
    }
  })
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: (fn: (value: any) => void) => {
      fn({ data: { user: mockStaffUser } });
      return { unsubscribe: vi.fn() };
    }
  }
}));

const createPageData = (rooms: Room[] = mockRooms): PageData => ({
  user: mockAdminUser,
  rooms,
  properties: mockProperties,
  floors: mockFloors,
  form: mockFormData,
});

describe('Room Management UI Snapshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    // Set a fixed date for consistent snapshots
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should match snapshot of default room listing view', () => {
    const { container } = render(Page, {
      props: {
        data: createPageData()
      }
    });
    expect(normalizeSnapshot(container.innerHTML)).toMatchSnapshot();
  });

  it('should match snapshot of empty room listing view', () => {
    const { container } = render(Page, {
      props: {
        data: createPageData(mockEmptyRooms)
      }
    });
    expect(normalizeSnapshot(container.innerHTML)).toMatchSnapshot();
  });

  it('should match snapshot of populated room listing view', () => {
    const { container } = render(Page, {
      props: {
        data: createPageData(mockLoadedRooms)
      }
    });
    expect(normalizeSnapshot(container.innerHTML)).toMatchSnapshot();
  });
});