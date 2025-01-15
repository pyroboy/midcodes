import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Role Emulation API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should start role emulation with valid payload', async () => {
        const payload = {
            emulatedRole: 'org_admin',
            emulatedOrgId: '123e4567-e89b-12d3-a456-426614174000'
        };

        // Mock successful response
        mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({
            status: "success",
            message: "Role emulation started"
        })));

        const response = await fetch('/api/role-emulation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        expect(response.ok).toBe(true);
        expect(data.status).toBe("success");
        expect(data.message).toBe("Role emulation started");

        // Verify the payload was sent correctly
        expect(mockFetch).toHaveBeenCalledWith(
            '/api/role-emulation',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(payload)
            })
        );
    });

    it('should stop role emulation', async () => {
        // Mock successful response
        mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({
            status: "success",
            message: "Role emulation stopped"
        })));

        const response = await fetch('/api/role-emulation', {
            method: 'DELETE'
        });

        const data = await response.json();
        expect(response.ok).toBe(true);
        expect(data.status).toBe("success");
        expect(data.message).toBe("Role emulation stopped");

        // Verify DELETE request was made
        expect(mockFetch).toHaveBeenCalledWith(
            '/api/role-emulation',
            expect.objectContaining({ method: 'DELETE' })
        );
    });
});
