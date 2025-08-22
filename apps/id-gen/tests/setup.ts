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
