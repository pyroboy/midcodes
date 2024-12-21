import { describe, it, expect, beforeEach, vi } from 'vitest';
import { load } from '../../../src/routes/id-gen/use-template/[id]/+page.server';
import { supabase } from '../../../src/lib/supabaseClient';
import { redirect, error } from '@sveltejs/kit';

// Mock supabase client
vi.mock('../../../src/lib/supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn()
        }))
    }
}));

describe('Templates Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should redirect to /auth if no session', async () => {
        const locals = {
            safeGetSession: vi.fn().mockResolvedValue({ session: null })
        };

        try {
            await load({ locals } as any);
            // If we reach here, the test should fail
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.status).toBe(303);
            expect(e.location).toBe('/auth');
        }
    });

    it('should load templates for super_admin', async () => {
        const mockTemplates = [
            { id: 1, name: 'Template 1' },
            { id: 2, name: 'Template 2' }
        ];

        const locals = {
            safeGetSession: vi.fn().mockResolvedValue({
                session: { 
                    user: { 
                        id: '123',
                        user_metadata: { role: 'super_admin' }
                    }
                }
            })
        };

        const mockSelect = vi.fn().mockResolvedValue({
            data: mockTemplates,
            error: null
        });

        const mockFrom = vi.fn().mockReturnValue({
            select: mockSelect
        });

        // @ts-ignore - mocking
        supabase.from.mockImplementation(mockFrom);

        const result = await load({ locals } as any);

        expect(supabase.from).toHaveBeenCalledWith('templates');
        expect(result).toEqual({
            templates: mockTemplates
        });
    });

    it('should return empty templates array for non-super_admin', async () => {
        const locals = {
            safeGetSession: vi.fn().mockResolvedValue({
                session: { 
                    user: { 
                        id: '123',
                        user_metadata: { role: 'user' }
                    }
                }
            })
        };

        const mockSelect = vi.fn().mockResolvedValue({
            data: [{ id: 1, name: 'Template 1' }],
            error: null
        });

        const mockFrom = vi.fn().mockReturnValue({
            select: mockSelect
        });

        // @ts-ignore - mocking
        supabase.from.mockImplementation(mockFrom);

        const result = await load({ locals } as any);

        expect(result).toEqual({
            templates: []
        });
    });

    it('should handle database error', async () => {
        const locals = {
            safeGetSession: vi.fn().mockResolvedValue({
                session: { 
                    user: { 
                        id: '123',
                        user_metadata: { role: 'super_admin' }
                    }
                }
            })
        };

        const mockSelect = vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
        });

        const mockFrom = vi.fn().mockReturnValue({
            select: mockSelect
        });

        // @ts-ignore - mocking
        supabase.from.mockImplementation(mockFrom);

        try {
            await load({ locals } as any);
            // If we reach here, the test should fail
            expect(true).toBe(false);
        } catch (e: any) {
            expect(e.status).toBe(500);
            expect(e.body.message).toBe('Error loading templates');
        }
    });
});
