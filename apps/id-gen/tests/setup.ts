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

// Mock Supabase for testing
vi.mock('$lib/supabaseClient', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
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
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
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
    const userData = mockUserData.get(userId) || { 
      templates_created: 0, 
      unlimited_templates: false 
    };
    
    if (userData.unlimited_templates) return true;
    return userData.templates_created < 2; // Free limit is 2 templates
  }),

  incrementTemplateCount: vi.fn(async (userId: string) => {
    const userData = mockUserData.get(userId) || { 
      templates_created: 0, 
      unlimited_templates: false 
    };
    
    userData.templates_created += 1;
    mockUserData.set(userId, userData);
    
    return {
      success: true,
      newCount: userData.templates_created
    };
  }),

  getUserCredits: vi.fn(async (userId: string) => {
    const userData = mockUserData.get(userId) || { 
      templates_created: 0, 
      unlimited_templates: false,
      credits: 5,
      credits_used: 0
    };
    
    return {
      template_count: userData.templates_created,
      unlimited_templates: userData.unlimited_templates,
      credits: userData.credits,
      credits_used: userData.credits_used
    };
  })
}));

// Export mock data store for test control
(globalThis as any).__mockUserData = mockUserData;
