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
        eq: vi.fn((column: string, value: string) => ({
          eq: vi.fn((column2: string, value2: string) => ({
            single: vi.fn(() => {
              if (table === 'credit_transactions') {
                return Promise.resolve({ 
                  data: {
                    id: 'mock-transaction',
                    user_id: value,
                    org_id: value2,
                    type: 'credit_purchase',
                    amount: 100,
                    reference_id: 'mock-ref',
                    metadata: {},
                    created_at: new Date().toISOString()
                  }, 
                  error: null 
                });
              }
              return Promise.resolve({ data: null, error: null });
            }),
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            in: vi.fn(() => Promise.resolve({ data: [], error: null }))
          })),
          single: vi.fn(() => {
            if (table === 'profiles') {
              const userData = mockUserData.get(value);
              if (userData) {
                return Promise.resolve({ 
                  data: {
                    id: value,
                    org_id: userData.org_id,
                    email: userData.email,
                    role: userData.role,
                    context: userData.context,
                    created_at: userData.created_at || new Date().toISOString(),
                    updated_at: userData.updated_at || new Date().toISOString(),
                    unlimited_templates: userData.unlimited_templates || false,
                    remove_watermarks: userData.remove_watermarks || false,
                    credits_balance: userData.credits || 0,
                    card_generation_count: userData.card_generation_count || 0,
                    template_count: userData.templates_created || 0
                  }, 
                  error: null 
                });
              }
            }
            if (table === 'organizations') {
              return Promise.resolve({ 
                data: {
                  id: value,
                  name: 'Test Organization',
                  created_at: new Date().toISOString()
                }, 
                error: null 
              });
            }
            if (table === 'credit_transactions') {
              return Promise.resolve({ 
                data: {
                  id: 'mock-transaction',
                  user_id: value,
                  org_id: 'mock-org-id',
                  type: 'credit_purchase',
                  amount: 100,
                  reference_id: 'mock-ref',
                  metadata: {},
                  created_at: new Date().toISOString()
                }, 
                error: null 
              });
            }
            if (table === 'org_settings') {
              return Promise.resolve({ 
                data: {
                  org_id: value,
                  payments_enabled: true,
                  payments_bypass: false,
                  created_at: new Date().toISOString()
                }, 
                error: null 
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: vi.fn((updateData: any) => ({
        eq: vi.fn((column: string, value: string) => {
          if (table === 'profiles' && column === 'id') {
            const userData = mockUserData.get(value);
            if (userData && updateData) {
              Object.assign(userData, updateData);
              if (updateData.template_count !== undefined) {
                userData.templates_created = updateData.template_count;
              }
              mockUserData.set(value, userData);
            }
          }
          return {
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          };
        })
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn((column: string, value: string) => {
          if (column === 'id') {
            deletedUsers.add(value);
          }
          return Promise.resolve({ error: null });
        }),
        in: vi.fn(() => Promise.resolve({ error: null }))
      })),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  };

  return { supabase: mockSupabase };
});

// Mock credit utility functions
vi.mock('$lib/utils/credits', () => ({
  canCreateTemplate: vi.fn(async (userId: string) => {
    const userData = mockUserData.get(userId);
    
    if (!userData || deletedUsers.has(userId)) return false;
    
    if (userData.unlimited_templates) return true;
    return userData.templates_created < 2;
  }),

  incrementTemplateCount: vi.fn(async (userId: string) => {
    const userData = mockUserData.get(userId);
    
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
    
    if (!userData || deletedUsers.has(userId)) return null;
    
    return {
      credits_balance: userData.credits || 0,
      card_generation_count: userData.card_generation_count || 0,
      template_count: userData.templates_created || 0,
      unlimited_templates: userData.unlimited_templates || false,
      remove_watermarks: userData.remove_watermarks || false
    };
  }),

  addCredits: vi.fn(async (userId: string, orgId: string, amount: number, reference?: string, metadata?: string) => {
    const userData = mockUserData.get(userId);
    if (!userData || deletedUsers.has(userId)) {
      return { success: false, error: 'User not found', newBalance: 0 };
    }
    
    userData.credits = (userData.credits || 0) + amount;
    mockUserData.set(userId, userData);
    
    return { success: true, newBalance: userData.credits };
  }),

  deductCardGenerationCredit: vi.fn(async (userId: string, orgId: string, cardId?: string) => {
    const userData = mockUserData.get(userId);
    if (!userData || deletedUsers.has(userId)) {
      return { success: false, error: 'User not found' };
    }
    
    // Check if user has free generations left
    if ((userData.card_generation_count || 0) < 5) {
      userData.card_generation_count = (userData.card_generation_count || 0) + 1;
      mockUserData.set(userId, userData);
      return { success: true, freeGeneration: true, remainingFree: 5 - userData.card_generation_count };
    }
    
    // Check if user has credits
    if (userData.credits && userData.credits > 0) {
      userData.credits -= 1;
      userData.card_generation_count = (userData.card_generation_count || 0) + 1;
      mockUserData.set(userId, userData);
      return { success: true, freeGeneration: false, remainingCredits: userData.credits };
    }
    
    return { success: false, error: 'Insufficient credits' };
  }),

  canGenerateCard: vi.fn(async (userId: string) => {
    const userData = mockUserData.get(userId);
    if (!userData || deletedUsers.has(userId)) {
      return { canGenerate: false, needsCredits: false, error: 'User not found' };
    }
    
    // Check if user has free generations left
    if ((userData.card_generation_count || 0) < 5) {
      return { canGenerate: true, needsCredits: false, remainingFree: 5 - (userData.card_generation_count || 0) };
    }
    
    // Check if user has credits
    if (userData.credits && userData.credits > 0) {
      return { canGenerate: true, needsCredits: true, remainingCredits: userData.credits };
    }
    
    return { canGenerate: false, needsCredits: true, error: 'Insufficient credits' };
  }),

  grantUnlimitedTemplates: vi.fn(async (userId: string, orgId: string, reference?: string) => {
    const userData = mockUserData.get(userId);
    if (!userData || deletedUsers.has(userId)) {
      return { success: false, error: 'User not found' };
    }
    
    userData.unlimited_templates = true;
    mockUserData.set(userId, userData);
    
    return { success: true, unlimitedTemplates: true };
  }),

  grantWatermarkRemoval: vi.fn(async (userId: string, orgId: string, reference?: string) => {
    const userData = mockUserData.get(userId);
    if (!userData || deletedUsers.has(userId)) {
      return { success: false, error: 'User not found' };
    }
    
    userData.remove_watermarks = true;
    mockUserData.set(userId, userData);
    
    return { success: true, watermarkRemoval: true };
  }),

  getCreditHistory: vi.fn(async (userId: string, limit?: number) => {
    const userData = mockUserData.get(userId);
    if (!userData || deletedUsers.has(userId)) {
      return [];
    }
    
    const transactions = [];
    
    // Only add credit purchase transaction if user actually has credits
    if (userData.credits && userData.credits > 0) {
      transactions.push({
        id: 'mock-transaction-1',
        user_id: userId,
        org_id: userData.org_id,
        type: 'credit_purchase',
        amount: userData.credits,
        reference_id: 'mock-ref-1',
        metadata: { description: 'Mock transaction' },
        created_at: new Date().toISOString()
      });
    }
    
    // Add usage transactions if user has generated cards beyond free limit
    const paidGenerations = Math.max(0, (userData.card_generation_count || 0) - 5);
    if (paidGenerations > 0) {
      for (let i = 0; i < paidGenerations; i++) {
        transactions.push({
          id: `mock-usage-${i + 1}`,
          user_id: userId,
          org_id: userData.org_id,
          type: 'usage',
          amount: -1,
          reference_id: `card-${i + 1}`,
          metadata: { description: 'Card generation' },
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Apply limit if specified
    if (limit) {
      return transactions.slice(0, limit);
    }
    
    return transactions;
  })
}));

// Export mock data store and deleted users for test control
(globalThis as any).__mockUserData = mockUserData;
(globalThis as any).__deletedUsers = deletedUsers;
