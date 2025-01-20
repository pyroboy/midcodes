// import { describe, it, expect, vi, assert, beforeEach } from 'vitest';
// import { render } from '@testing-library/svelte';
// import Page from '../+page.svelte';
// import { checkAccess } from '$lib/utils/roleChecks';
// import { load } from '../+page.server';
// import type { SupabaseClient, User } from '@supabase/supabase-js';
// import type { ServerLoadEvent } from '@sveltejs/kit';
// import type { Rental_unit, Property, Floor } from '../formSchema';
// import type { SuperValidated } from 'sveltekit-superforms';
// import type { UserRole } from '$lib/auth/roleConfig';
// import type { 
//   SessionWithAuth, 
//   ServerProfile 
// } from '$lib/types/auth';
// import type { NavigationState } from '$lib/types/navigation';
// import type { Emulation } from '$lib/types/roles';
// import type { PageParentData } from '$lib/types/pages';
// // Define types needed for load function
// type RouteParams = Record<string, string>;



// // next we have to test the auth server side, because we can insert no problem
// // so what if they are under a policy.
// // so that falls onto integration testing, 

// // this test checks to see auth works with this page, so far so good we can test who is logged in

// // what else do we need to test,we need to have
// // create me a flow chart for testing
// // 1. create a mock event
// // 2. create a mock session
// // 3. create a mock user
// // 4. create a mock supabase client
// // 5. create a mock form data
// // 6. create a mock profile
// // 7. create a mock navigation
// // 8. create a mock emulation
// // 9. create a mock properties
// // 10. create a mock floors
// // 11. create a mock rental_unit
// // 12. render the page
// // 13. check that the page is rendered  

// // Create a specific type for the ServerLoadEvent with proper generic parameters
// type TypedServerLoadEvent = ServerLoadEvent<RouteParams, PageParentData, "/dorm/rental_unit">;

// // Mock the roleChecks module
// vi.mock('$lib/utils/roleChecks', () => ({
//   checkAccess: (role: string, requiredLevel: string) => {
//     // Define role hierarchies
//     const roleHierarchy: Record<string, string[]> = {
//       super_admin: ['super_admin', 'admin', 'staff', 'user'],
//       admin: ['admin', 'staff', 'user'],
//       property_maintenance: ['staff', 'user'],
//       property_tenant: ['user']
//     };

//     // Get allowed levels for the role
//     const allowedLevels = roleHierarchy[role] || [];
//     return allowedLevels.includes(requiredLevel);
//   }
// }));

// // Define the combined type
// type CombinedPageData = Page['props'];

// // Mock SuperValidated form structure
// const mockFormData: SuperValidated<any> = {
//   id: 'test-form',
//   valid: true,
//   posted: false,
//   errors: {},
//   data: {},
//   constraints: {}
// };

// // Mock data using imported types
// const mockRental_Units: Rental_unit[] = [
//   {
//     id: 1,
//     name: 'Test Rental_unit 101',
//     number: 101,
//     capacity: 1,
//     rental_unit_status: 'VACANT',
//     base_rate: 5000,
//     property_id: 1,
//     floor_id: 1,
//     type: 'single',
//     amenities: [],
//     created_at: new Date().toISOString(),
//     updated_at: new Date().toISOString(),
//     property: {
//       id: 1,
//       name: 'Test Property'
//     },
//     floor: {
//       id: 1,
//       property_id: 1,
//       floor_number: 1,
//       wing: 'A'
//     }
//   }
// ];

// const mockProfile: ServerProfile = {
//   id: 'mock-profile-id',
//   email: 'mock@example.com',
//   role: 'super_admin',
//   org_id: 'mock-org-id',
//   context: {},
//   created_at: new Date().toISOString(),
//   updated_at: new Date().toISOString(),
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

// const mockProperties: Property[] = [
//   {
//     id: 1,
//     name: 'Test Property'
//   }
// ];

// const mockFloors: Floor[] = [
//   {
//     id: 1,
//     property_id: 1,
//     floor_number: 1,
//     wing: 'A'
//   }
// ];

// // Mock User data with full User type
// const createMockUser = (id: string, email: string): User => ({
//   id,
//   email,
//   aud: 'authenticated',
//   app_metadata: {},
//   user_metadata: {},
//   created_at: new Date().toISOString(),
//   updated_at: new Date().toISOString(),
//   phone: '',
//   confirmed_at: '',
//   email_confirmed_at: '',
//   last_sign_in_at: '',
//   confirmation_sent_at: '',
//   identities: [],
//   invited_at: '',
// });

// // Mock users with proper User type
// const mockStaffUser = createMockUser('mock-staff-id', 'staff@example.com');
// const mockAdminUser = createMockUser('mock-admin-id', 'admin@example.com');

// // Helper to create proper Supabase response structure
// const createSupabaseResponse = <T>(data: T) => ({
//   data,
//   error: null,
//   count: Array.isArray(data) ? data.length : null,
//   status: 200,
//   statusText: 'OK',
//   body: data
// });

// // Mock session with proper User type
// const mockSession: SessionWithAuth = {
//   access_token: 'mock-token',
//   refresh_token: 'mock-refresh',
//   expires_in: 3600,
//   expires_at: new Date().getTime() + 3600000,
//   token_type: 'bearer',
//   user: mockAdminUser,
//   roleEmulation: {
//     active: false,
//     original_role: 'user',
//     emulated_role: 'super_admin',
//     original_org_id: null,
//     emulated_org_id: null,
//     expires_at: new Date(Date.now() + 3600000).toISOString(),
//     session_id: 'mock-session-id',
//     organizationName: null
//   },
//   // Add required properties to match SessionWithAuth interface
//   session: {
//     roleEmulation: {
//       active: false,
//       emulated_org_id: null
//     }
//   },
//   profile: mockProfile,
//   error: null
// };

// // Mock Supabase client
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

// // Mock SvelteKit functionality
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

// // Mock form handling
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

// // Mock stores
// vi.mock('$app/stores', () => ({
//   page: {
//     subscribe: (fn: (value: any) => void) => {
//       fn({ data: { user: mockStaffUser } });
//       return { unsubscribe: vi.fn() };
//     }
//   }
// }));

// // Create mock event helper with proper types
// const createMockEvent = (user: User, role: UserRole = 'super_admin'): TypedServerLoadEvent => {
//   const profile: ServerProfile = {
//     ...mockProfile,
//     role,
//   };

//   const parentData: PageParentData = {
//     user,
//     profile,
//     navigation: mockNavigation,
//     session: mockSession,
//     emulation: mockEmulation,
//     special_url: undefined
//   };

//   return {
//     locals: {
//       supabase: mockSupabaseClient,
//       safeGetSession: vi.fn().mockResolvedValue({
//         session: mockSession,
//         user,
//         profile,
//         roleEmulation: null,
//         navigation: mockNavigation,
//         error: null
//       }),
//       getSession: vi.fn().mockResolvedValue(mockSession),
//       session: mockSession,
//       user,
//       profile
//     },
//     url: new URL('http://localhost'),
//     params: {},
//     request: new Request('http://localhost'),
//     isDataRequest: false,
//     route: { id: '/dorm/rental_unit' },
//     setHeaders: vi.fn(),
//     fetch: vi.fn(),
//     depends: vi.fn(),
//     parent: async () => parentData,
//     untrack: <T>(fn: () => T) => fn(),
//     platform: {},
//     getClientAddress: () => '127.0.0.1',
//     cookies: {
//       get: vi.fn(),
//       getAll: vi.fn(),
//       set: vi.fn(),
//       delete: vi.fn(),
//       serialize: vi.fn()
//     },
//     isSubRequest: false
//   };
// };

// // Tests
// describe('+page.svelte', () => {
//   const defaultData: CombinedPageData = {
//     user: null,
//     rental_unit: mockRental_Units,
//     properties: mockProperties,
//     floors: mockFloors,
//     form: mockFormData,
//   };

//   beforeEach(() => {
//     vi.clearAllMocks();
//     document.body.innerHTML = '';
//   });

//   it('should render without crashing', () => {
//     const { container } = render(Page, { props: { data: defaultData } });
//     expect(container).toBeTruthy();
//   });

//   it('should allow staff to access staff-level functionality', () => {
//     const userRole = 'property_maintenance';
//     const hasAccess = checkAccess(userRole, 'staff');
//     expect(hasAccess).toBe(true);
//   });

//   it('should not allow view roles to access staff-level functionality', () => {
//     const userRole = 'property_tenant';
//     const hasAccess = checkAccess(userRole, 'staff');
//     expect(hasAccess).toBe(false);
//   });
// });

// describe('Load function access control', () => {
//   beforeEach(() => {
//     vi.clearAllMocks();
//   });

//   it('should redirect unauthorized users', async () => {
//     const mockEvent = createMockEvent(mockStaffUser, 'property_maintenance');
    
//     try {
//       await load(mockEvent);
//       assert.fail('Expected redirect to be thrown');
//     } catch (error: any) {
//       expect(error.status).toBe(302);
//       expect(error.location).toBe('/unauthorized');
//     }
//   });

//   it('should not redirect authorized users', async () => {
//     const mockEvent = createMockEvent(mockAdminUser, 'super_admin');
    
//     try {
//       const result = await load(mockEvent);
      
//       expect(result).toBeDefined();
//       if (result) {
//         expect('rental_unit' in result).toBeTruthy();
//         expect('properties' in result).toBeTruthy();
//         expect('floors' in result).toBeTruthy();
//         expect('form' in result).toBeTruthy();
//         expect('user' in result).toBeTruthy();
        
//         const typedResult = result as {
//           rental_unit: Rental_unit[];
//           properties: Property[];
//           floors: Floor[];
//           form: SuperValidated<any>;
//           user: User;
//         };
        
//         expect(typedResult.rental_unit).toEqual(mockRental_Units);
//         expect(typedResult.properties).toEqual(mockProperties);
//         expect(typedResult.floors).toEqual(mockFloors);
//         expect(typedResult.form).toBeDefined();
//         expect(typedResult.user).toEqual(mockAdminUser);
//       }
//     } catch (error: any) {
//       console.error('Test failed with error:', error);
//       throw error;
//     }
//   });
// });