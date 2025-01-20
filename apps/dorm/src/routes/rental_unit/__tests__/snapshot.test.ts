// import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// import { render, cleanup } from '@testing-library/svelte';
// import { configureTestEnv, normalizeHtml } from '@test-utils/environment';
// import { toMatchImageSnapshot } from 'jest-image-snapshot';
// import Page from '../+page.svelte';
// import type { SupabaseClient, User } from '@supabase/supabase-js';
// import type { ServerLoadEvent } from '@sveltejs/kit';
// import type { Rental_unit, Property, Floor } from '../formSchema';
// import type { SuperValidated } from 'sveltekit-superforms';
// import type { UserRole } from '$lib/auth/roleConfig';
// import type { SessionWithAuth, ServerProfile } from '$lib/types/auth';
// import type { NavigationState } from '$lib/types/navigation';
// import type { Emulation } from '$lib/types/roles';
// import type { PageParentData } from '$lib/types/pages';
// import type { PageData } from '../$types';

// // Helper function to normalize HTML and remove dynamic content
// const normalizeSnapshot = (html: string): string => {
//   return normalizeHtml(html)
//     // Replace dynamic IDs
//     .replace(/aria-controls="[^"]*"/g, 'aria-controls="test-id"')
//     .replace(/aria-labelledby="[^"]*"/g, 'aria-labelledby="test-label"')
//     .replace(/id="[^"]*"/g, 'id="test-id"')
//     // Replace dynamic dates
//     .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/g, 'TEST_DATE');
// };

// interface DatabaseFloor {
//   id: number;
//   property_id: number;
//   floor_number: number;
//   wing?: string;
//   property?: {
//     id: number;
//     name: string;
//   } | null;
// }

// // Configure test environment
// configureTestEnv();
// expect.extend({ toMatchImageSnapshot });

// type RouteParams = Record<string, string>;
// type TypedServerLoadEvent = ServerLoadEvent<RouteParams, PageParentData, "/dorm/rental_unit">;

// const mockFormData: SuperValidated<any> = {
//   id: 'test-form',
//   valid: true,
//   posted: false,
//   errors: {},
//   data: {},
//   constraints: {}
// };

// const mockProperties = [
//   {
//     id: 1,
//     name: 'Test Property'
//   }
// ] as const;

// const mockFloors: DatabaseFloor[] = [
//   {
//     id: 1,
//     property_id: 1,
//     floor_number: 1,
//     wing: 'A',
//     property: {
//       id: 1,
//       name: 'Test Property'
//     }
//   }
// ];

// const createMockRentalUnit = (id: number, number: number, status: 'VACANT' | 'OCCUPIED'): Rental_unit & { property: { name: string }; floor: { floor_number: number; wing?: string } } => ({
//   id,
//   name: `Test Rental_unit ${number}`,
//   number,
//   capacity: status === 'VACANT' ? 1 : 2,
//   rental_unit_status: status,
//   base_rate: status === 'VACANT' ? 5000 : 6000,
//   property_id: 1,
//   floor_id: 1,
//   type: status === 'VACANT' ? 'single' : 'double',
//   amenities: status === 'VACANT' ? [] : ['wifi', 'aircon'],
//   created_at: '2024-01-01T00:00:00.000Z',
//   updated_at: '2024-01-01T00:00:00.000Z',
//   property: {
//     id: 1,
//     name: 'Test Property'
//   },
//   floor: {
//     id: 1,
//     property_id: 1,
//     floor_number: 1,
//     wing: 'A'
//   }
// });

// const mockRental_Units = [createMockRentalUnit(1, 101, 'VACANT')];
// const mockEmptyRental_Units: typeof mockRental_Units = [];
// const mockLoadedRental_Units = [
//   createMockRentalUnit(1, 101, 'VACANT'),
//   createMockRentalUnit(2, 102, 'OCCUPIED')
// ];

// const mockProfile: ServerProfile = {
//   id: 'mock-profile-id',
//   email: 'mock@example.com',
//   role: 'super_admin',
//   org_id: 'mock-org-id',
//   context: {},
//   created_at: '2024-01-01T00:00:00.000Z',
//   updated_at: '2024-01-01T00:00:00.000Z',
//   isEmulated: false,
//   originalRole: 'user',
//   originalOrgId: null,
// };

// const mockNavigation: NavigationState = {
//   homeUrl: '/home',
//   showHeader: true,
//   allowedPaths: ['/home', '/about', '/contact'],
//   showRoleEmulation: false,
// };

// const mockEmulation: Emulation = {
//   organizationName: null,
//   role: null,
//   context: {},
//   metadata: {}
// };

// const createMockUser = (id: string, email: string): User & { role: string } => ({
//   id,
//   email,
//   role: 'user',
//   aud: 'authenticated',
//   app_metadata: {},
//   user_metadata: {},
//   created_at: '2024-01-01T00:00:00.000Z',
//   updated_at: '2024-01-01T00:00:00.000Z',
//   phone: '',
//   confirmed_at: '',
//   email_confirmed_at: '',
//   last_sign_in_at: '',
//   confirmation_sent_at: '',
//   identities: [],
//   invited_at: '',
// });

// const mockStaffUser = createMockUser('mock-staff-id', 'staff@example.com');
// const mockAdminUser = createMockUser('mock-admin-id', 'admin@example.com');

// const createSupabaseResponse = <T>(data: T) => ({
//   data,
//   error: null,
//   count: Array.isArray(data) ? data.length : null,
//   status: 200,
//   statusText: 'OK',
//   body: data
// });

// const mockSession: SessionWithAuth = {
//   access_token: 'mock-token',
//   refresh_token: 'mock-refresh',
//   expires_in: 3600,
//   expires_at: new Date('2024-01-01T00:00:00.000Z').getTime() + 3600000,
//   token_type: 'bearer',
//   user: mockAdminUser,
//   roleEmulation: {
//     active: false,
//     original_role: 'user',
//     emulated_role: 'super_admin',
//     original_org_id: null,
//     emulated_org_id: null,
//     expires_at: '2024-01-01T01:00:00.000Z',
//     session_id: 'mock-session-id',
//     organizationName: null
//   },
//   session: {
//     roleEmulation: {
//       active: false,
//       emulated_org_id: null
//     }
//   },
//   profile: mockProfile,
//   error: null
// };

// const mockSupabaseClient = {
//   from: vi.fn().mockImplementation((table: string) => ({
//     select: vi.fn().mockReturnValue({
//       eq: vi.fn().mockReturnValue({
//         order: vi.fn().mockImplementation(() => {
//           return Promise.resolve(createSupabaseResponse(
//             table === 'rental_unit' ? mockRental_Units :
//             table === 'properties' ? mockProperties :
//             table === 'floors' ? mockFloors :
//             []
//           ));
//         }),
//         single: vi.fn().mockReturnValue(Promise.resolve(createSupabaseResponse(null))),
//         neq: vi.fn().mockReturnValue({
//           single: vi.fn().mockReturnValue(Promise.resolve(createSupabaseResponse(null)))
//         })
//       }),
//       order: vi.fn().mockImplementation(() => {
//         return Promise.resolve(createSupabaseResponse(
//           table === 'rental_unit' ? mockRental_Units :
//           table === 'properties' ? mockProperties :
//           table === 'floors' ? mockFloors :
//           []
//         ));
//       })
//     })
//   })),
//   rpc: vi.fn().mockReturnValue(Promise.resolve(createSupabaseResponse(null)))
// } as unknown as SupabaseClient;

// // Mocks
// vi.mock('@sveltejs/kit', async () => {
//   const actual = await vi.importActual('@sveltejs/kit');
//   return {
//     ...actual,
//     redirect: (status: number, location: string) => {
//       console.log('[Debug] redirect called:', { status, location });
//       const error = new Error('Redirect');
//       (error as any).status = status;
//       (error as any).location = location;
//       throw error;
//     },
//     fail: (status: number, data?: Record<string, any>) => {
//       console.log('[Debug] fail called:', { status, data });
//       return { status, data };
//     }
//   };
// });

// vi.mock('sveltekit-superforms/server', () => ({
//   superValidate: vi.fn().mockResolvedValue({
//     data: {},
//     errors: {},
//     valid: true
//   })
// }));

// vi.mock('sveltekit-superforms/client', () => ({
//   superForm: () => ({
//     form: {
//       subscribe: (fn: (value: any) => void) => {
//         fn({});
//         return { unsubscribe: vi.fn() };
//       }
//     },
//     errors: {
//       subscribe: (fn: (value: any) => void) => {
//         fn({});
//         return { unsubscribe: vi.fn() };
//       }
//     },
//     enhance: vi.fn(),
//     submitting: {
//       subscribe: (fn: (value: boolean) => void) => {
//         fn(false);
//         return { unsubscribe: vi.fn() };
//       }
//     }
//   })
// }));

// vi.mock('$app/stores', () => ({
//   page: {
//     subscribe: (fn: (value: any) => void) => {
//       fn({ data: { user: mockStaffUser } });
//       return { unsubscribe: vi.fn() };
//     }
//   }
// }));

// const createPageData = (rental_unit: typeof mockRental_Units = mockRental_Units) => ({
//   user: mockAdminUser,
//   rental_unit,
//   properties: mockProperties,
//   floors: mockFloors,
//   form: mockFormData,
// }) satisfies PageData;

// describe('Rental_unit Management UI Snapshots', () => {
//   beforeEach(() => {
//     vi.clearAllMocks();
//     cleanup();
//     // Set a fixed date for consistent snapshots
//     vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
//   });

//   afterEach(() => {
//     vi.useRealTimers();
//   });

//   it('should match snapshot of default rental_unit listing view', () => {
//     const { container } = render(Page, {
//       props: {
//         data: createPageData()
//       }
//     });
//     expect(normalizeSnapshot(container.innerHTML)).toMatchSnapshot();
//   });

//   it('should match snapshot of empty rental_unit listing view', () => {
//     const { container } = render(Page, {
//       props: {
//         data: createPageData(mockEmptyRental_Units)
//       }
//     });
//     expect(normalizeSnapshot(container.innerHTML)).toMatchSnapshot();
//   });

//   it('should match snapshot of populated rental_unit listing view', () => {
//     const { container } = render(Page, {
//       props: {
//         data: createPageData(mockLoadedRental_Units)
//       }
//     });
//     expect(normalizeSnapshot(container.innerHTML)).toMatchSnapshot();
//   });
// });
