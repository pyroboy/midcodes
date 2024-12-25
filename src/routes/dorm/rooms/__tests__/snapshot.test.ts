import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { configureTestEnv } from '@test-utils/environment';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import Page from '../+page.svelte';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { Room, Property, Floor } from '../formSchema';
import type { SuperValidated } from 'sveltekit-superforms';
import type { UserRole } from '$lib/auth/roleConfig';
import type { 
  SessionWithAuth, 
  ServerProfile 
} from '$lib/types/auth';
import type { NavigationState } from '$lib/types/navigation';
import type { Emulation } from '$lib/types/roles';
import type { PageParentData } from '$lib/types/pages';

// Configure test environment for snapshots
configureTestEnv();
expect.extend({ toMatchImageSnapshot });

// Define types needed for load function
type RouteParams = Record<string, string>;

// Create a specific type for the ServerLoadEvent with proper generic parameters
type TypedServerLoadEvent = ServerLoadEvent<RouteParams, PageParentData, "/dorm/rooms">;

// Mock SuperValidated form structure
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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

// Mock empty rooms state for testing
const mockEmptyRooms: Room[] = [];

// Mock loaded rooms state with multiple entries
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
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

// Mock User data with full User type
const createMockUser = (id: string, email: string): User => ({
  id,
  email,
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  phone: '',
  confirmed_at: '',
  email_confirmed_at: '',
  last_sign_in_at: '',
  confirmation_sent_at: '',
  identities: [],
  invited_at: '',
});

// Mock users with proper User type
const mockStaffUser = createMockUser('mock-staff-id', 'staff@example.com');
const mockAdminUser = createMockUser('mock-admin-id', 'admin@example.com');

// Helper to create proper Supabase response structure
const createSupabaseResponse = <T>(data: T) => ({
  data,
  error: null,
  count: Array.isArray(data) ? data.length : null,
  status: 200,
  statusText: 'OK',
  body: data
});

// Mock session with proper User type
const mockSession: SessionWithAuth = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_in: 3600,
  expires_at: new Date().getTime() + 3600000,
  token_type: 'bearer',
  user: mockAdminUser,
  roleEmulation: {
    active: false,
    original_role: 'user',
    emulated_role: 'super_admin',
    original_org_id: null,
    emulated_org_id: null,
    expires_at: new Date(Date.now() + 3600000).toISOString(),
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

// Mock Supabase client
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

// Mock SvelteKit functionality
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

// Mock form handling
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

// Mock stores
vi.mock('$app/stores', () => ({
  page: {
    subscribe: (fn: (value: any) => void) => {
      fn({ data: { user: mockStaffUser } });
      return { unsubscribe: vi.fn() };
    }
  }
}));

// Helper function to create page data for tests
const createPageData = (rooms: Room[] = mockRooms) => ({
  user: mockAdminUser,
  rooms,
  properties: mockProperties,
  floors: mockFloors,
  form: mockFormData,
});

// Snapshot Tests
describe('Room Management UI Snapshots', () => {
  // Clean up after each test to ensure isolated snapshots
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('should match snapshot of default room listing view', () => {
    const { container } = render(Page, {
      props: {
        data: createPageData()
      }
    });
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot of empty room listing view', () => {
    const { container } = render(Page, {
      props: {
        data: createPageData(mockEmptyRooms)
      }
    });
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot of populated room listing view', () => {
    const { container } = render(Page, {
      props: {
        data: createPageData(mockLoadedRooms)
      }
    });
    expect(container).toMatchSnapshot();
  });
});