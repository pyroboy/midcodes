import { vi } from 'vitest';

// Set up environment variables for testing
process.env.PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock the File API for jsdom environment with proper typings
if (!(globalThis as any).File) {
  class MockFile extends Blob implements File {
    readonly name: string;
    readonly lastModified: number;
    readonly webkitRelativePath: string = '';

    constructor(fileBits: BlobPart[], fileName: string, options: FilePropertyBag = {}) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options.lastModified ?? Date.now();
    }
  }
  (globalThis as any).File = MockFile as unknown as typeof File;
}

// Mock data store for credits and templates
const mockUserData = new Map();
const deletedUsers = new Set(); // Track deleted users for error simulation

// Mock Supabase for testing
vi.mock('$lib/supabaseClient', () => {
  const mockSupabase = {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          in: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: vi.fn((updateData: any) => ({
        eq: vi.fn((column: string, value: string) => ({
          select: vi.fn(() => ({
            single: vi.fn(() => {
              // Handle profile updates by updating mock data
              if (table === 'profiles' && column === 'id') {
                const userData = mockUserData.get(value);
                if (userData && updateData) {
                  // Update the mock data with the provided updates
                  Object.assign(userData, updateData);
                  // Handle template_count field mapping
                  if (updateData.template_count !== undefined) {
                    userData.templates_created = updateData.template_count;
                  }
                  mockUserData.set(value, userData);
                }
              }
              return Promise.resolve({ data: null, error: null });
            })
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn((column: string, value: string) => {
          // Simulate user deletion for error testing
          if (column === 'id') {
            deletedUsers.add(value);
          }
          return Promise.resolve({ error: null });
        }),
        in: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  };

  return {
    supabase: mockSupabase
  };
});

// Mock credit utility functions
vi.mock('$lib/utils/credits', () => ({
  canCreateTemplate: vi.fn(async (userId: string) => {
    const userData = mockUserData.get(userId);
    
    // Return false for invalid user IDs (not in mock data or deleted)
    if (!userData || deletedUsers.has(userId)) return false;
    
    if (userData.unlimited_templates) return true;
    return userData.templates_created < 2; // Free limit is 2 templates
  }),

  incrementTemplateCount: vi.fn(async (userId: string) => {
    const userData = mockUserData.get(userId);
    
    // Handle invalid user ID or deleted users
    if (!userData || deletedUsers.has(userId)) {
      return {
        success: false,
        newCount: 0
      };
    }
    
    userData.templates_created += 1;
    mockUserData.set(userId, userData);
    
    return {
      success: true,
      newCount: userData.templates_created
    };
  }),

  getUserCredits: vi.fn(async (userId: string) => {
    const userData = mockUserData.get(userId);
    
    // Return null for invalid user IDs or deleted users
    if (!userData || deletedUsers.has(userId)) return null;
    
    return {
      template_count: userData.templates_created,
      unlimited_templates: userData.unlimited_templates,
      credits: userData.credits,
      credits_used: userData.credits_used
    };
  })
}));

// Export mock data store and deleted users for test control
(globalThis as any).__mockUserData = mockUserData;
(globalThis as any).__deletedUsers = deletedUsers;
