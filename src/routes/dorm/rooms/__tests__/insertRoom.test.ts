import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Room } from '../formSchema';
import type { RequestEvent } from '@sveltejs/kit';
import type { DefaultBodyType, PathParams, HttpHandler } from 'msw';
import { actions } from '../+page.server';

// Define specific route types
type RouteParams = Record<string, string>;
type RouteId = "/dorm/rooms";
type TypedRequestEvent = RequestEvent<RouteParams, RouteId>;

// Define request body type for type safety
interface RoomRequestBody {
  id?: number;
  property_id?: number;
  floor_id?: number;
  number?: number;
  name?: string;
  capacity?: number;
  room_status?: string;
  base_rate?: number;
  type?: string;
  amenities?: string[];
  created_at?: string;
  updated_at?: string;
}

// Add response type definitions
interface SupabaseResponse {
  data: any;
  error: null | {
    code: string;
    message: string;
    details: string;
  };
}

interface ActionResult {
  form?: {
    data: any;
    errors: Record<string, string>;
    id: string;
    valid: boolean;
  };
  status?: number;
  data?: {
    form: any;
    error: string;
    details: string;
    hint: string;
  };
}

// Define constants
const SUPABASE_URL = 'https://wnkqlrfmtiibrqnncgqu.supabase.co';
const SUPABASE_API_URL = `${SUPABASE_URL}/rest/v1`;

// Add debug logging function
const debugLog = (message: string, data?: any) => {
  console.log(`[MSW Debug] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Mock superValidate with error handling
vi.mock('sveltekit-superforms/server', () => ({
  superValidate: vi.fn().mockImplementation(async (request, schema) => {
    const data = request instanceof Request 
      ? await request.json() 
      : request;
    
    return {
      data,
      valid: true,
      errors: {},
      id: 'test-form',
      constraints: {}
    };
  }),
  zod: vi.fn().mockReturnValue((schema: any) => schema)
}));

// Mock Supabase client with proper error responses
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation((data: any) => {
        // Check for required fields
        if (!data.property_id || !data.floor_id) {
          return Promise.resolve({
            data: null,
            error: {
              code: '23502',
              message: 'Property ID and Floor ID are required',
              details: 'not_null_violation'
            }
          });
        }

        // Check for duplicate room
        if (data.number === 101 && data.floor_id === 1) {
          return Promise.resolve({
            data: null,
            error: {
              code: '23505',
              message: 'Room number already exists on this floor',
              details: 'unique_violation'
            }
          });
        }

        // Successful creation
        return Promise.resolve({
          data: { id: 1, ...data },
          error: null
        });
      }),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        debugLog('Supabase mock single() called');
        return Promise.resolve({ data: null, error: null });
      })
    }))
  }))
}));

// Define MSW handlers
const handlers = [
  // Mock the rooms endpoint with logging
  http.get(`${SUPABASE_API_URL}/rooms`, ({ request }) => {
    debugLog('GET request intercepted', { url: request.url });
    const url = new URL(request.url);
    const floorId = url.searchParams.get('floor_id');
    const number = url.searchParams.get('number');

    if (floorId === '1' && number === '101') {
      const response = [{ id: 1, floor_id: 1, number: 101 }];
      debugLog('Returning existing room', response);
      return HttpResponse.json(response, { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    debugLog('No existing room found');
    return HttpResponse.json([], { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Mock the POST request for creating rooms with proper error responses
  http.post(`${SUPABASE_API_URL}/rooms`, async ({ request }) => {
    debugLog('POST request intercepted', { url: request.url });
    const body = await request.json() as RoomRequestBody;
    debugLog('Request body:', body);

    // Check for required fields
    if (!body?.property_id || !body?.floor_id) {
      debugLog('Required fields missing');
      return HttpResponse.json({
        statusText: "Bad Request",
        error: "Property ID and Floor ID are required",
        code: "23502",
        details: "not_null_violation",
      }, { status: 400 });
    }

    // Check for duplicate room
    if (body?.number === 101 && body?.floor_id === 1) {
      debugLog('Duplicate room detected');
      return HttpResponse.json({
        statusText: "Conflict",
        error: "Room number already exists on this floor",
        code: "23505",
        details: "unique_violation",
      }, { status: 409 });
    }

    // Successful creation
    const successResponse = {
      form: {
        data: {
          id: 1,
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        errors: {},
        id: 'test-form',
        valid: true
      }
    };
    debugLog('Room created successfully', successResponse);
    return HttpResponse.json(successResponse, { status: 201 });
  })
];

// Initialize MSW server with handlers
const mswServer = setupServer(...handlers);

// Create mock request event with proper structure
const createMockRequestEvent = (formData: Partial<Room>): TypedRequestEvent => {
  debugLog('Creating mock request event', formData);
  const request = new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  const event = {
    request,
    locals: {
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockImplementation((data: any) => {
            // Check for required fields
            if (!data.property_id || !data.floor_id) {
              return Promise.resolve({
                data: null,
                error: {
                  code: '23502',
                  message: 'Property ID and Floor ID are required',
                  details: 'not_null_violation'
                }
              });
            }

            // Check for duplicate room
            if (data.number === 101 && data.floor_id === 1) {
              return Promise.resolve({
                data: null,
                error: {
                  code: '23505',
                  message: 'Room number already exists on this floor',
                  details: 'unique_violation'
                }
              });
            }

            // Successful creation
            return Promise.resolve({
              data: { id: 1, ...data },
              error: null
            });
          }),
          eq: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }))
      },
      getSession: vi.fn().mockResolvedValue(null),
      session: null,
      safeGetSession: vi.fn().mockResolvedValue({
        session: null,
        user: null,
        profile: {
          role: 'admin'
        }
      })
    },
    url: new URL('http://localhost'),
    params: {},
    route: { id: '/dorm/rooms' as RouteId },
    isDataRequest: false,
    isSubRequest: false,
    setHeaders: vi.fn(),
    fetch: vi.fn(),
    platform: {},
    getClientAddress: vi.fn().mockReturnValue('127.0.0.1'),
    depends: vi.fn(),
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      serialize: vi.fn()
    }
  };

  return event as unknown as TypedRequestEvent;
};

describe('Room Creation Tests', () => {
  beforeAll(() => {
    mswServer.listen({ onUnhandledRequest: 'warn' });
    debugLog('MSW Server started');
  });

  afterEach(() => {
    mswServer.resetHandlers();
    vi.clearAllMocks();
    debugLog('Test cleanup completed');
  });

  afterAll(() => {
    mswServer.close();
    debugLog('MSW Server closed');
  });

  it('should successfully create a new room', async () => {
    const newRoom: Partial<Room> = {
      name: 'New Test Room',
      number: 102,
      capacity: 2,
      room_status: 'VACANT',
      base_rate: 6000,
      property_id: 1,
      floor_id: 1,
      type: 'SINGLE',
      amenities: ['WiFi', 'AC']
    };

    debugLog('Testing successful room creation', newRoom);
    const event = createMockRequestEvent(newRoom);
    const result = await actions.create(event) as ActionResult;
    debugLog('Create action result', result);

    // Check for successful creation
    expect(result).toBeDefined();
    expect(result.form).toBeDefined();
    expect(result.form?.valid).toBe(true);
    expect(result.form?.data).toMatchObject(newRoom);
    expect(result.form?.errors).toEqual({});
  });

  it('should fail when creating a room with duplicate number on same floor', async () => {
    const duplicateRoom: Partial<Room> = {
      name: 'Duplicate Room',
      number: 101,
      floor_id: 1,
      property_id: 1,
      capacity: 2,
      room_status: 'VACANT',
      base_rate: 5000,
      type: 'SINGLE',
      amenities: []
    };

    debugLog('Testing duplicate room creation', duplicateRoom);
    const event = createMockRequestEvent(duplicateRoom);
    const result = await actions.create(event) as ActionResult;
    debugLog('Create action result', result);

    // Check for duplicate room error
    expect(result).toEqual({
      status: 400,
      data: {
        form: expect.any(Object),
        error: 'Room number already exists on this floor',
        details: 'unique_violation',
        hint: 'Choose a different room number'
      }
    });
  });

  it('should fail when required fields are missing', async () => {
    const invalidRoom: Partial<Room> = {
      name: 'Invalid Room',
      number: 103,
      capacity: 2
    };

    debugLog('Testing invalid room creation', invalidRoom);
    const event = createMockRequestEvent(invalidRoom);
    const result = await actions.create(event) as ActionResult;
    debugLog('Create action result', result);

    // Check for missing fields error
    expect(result).toEqual({
      status: 500,
      data: {
        form: expect.any(Object),
        error: 'Property ID and Floor ID are required',
        details: 'not_null_violation',
        hint: 'Required fields are missing'
      }
    });
  });
});