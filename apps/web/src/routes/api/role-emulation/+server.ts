import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RoleConfig, type UserRole } from '$lib/auth/roleConfig';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

function isValidRole(role: string): role is UserRole {
    return Object.keys(RoleConfig).includes(role as UserRole);
}

// Custom error type for structured error responses
type ErrorResponse = {
    message: string;
    details?: string;
};

// Helper function to create error responses
function createError(status: number, message: string, details?: string): never {
    const errorMsg = `[Role Emulation] ${message}${details ? `: ${details}` : ''}`;
    console.error(errorMsg);
    throw error(status, message);
}

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession } }) => {
    try {
        const session = await safeGetSession();
        if (!session.session?.access_token) {
            throw new Error('No access token');
        }

        // Use SUPABASE_URL from environment
        const functionUrl = `${PUBLIC_SUPABASE_URL}/functions/v1/role-emulation`;
        
        const payload = await request.json();

        // Validate payload
        if (!payload.emulatedRole || !isValidRole(payload.emulatedRole)) {
            return json({ 
                error: 'Invalid role specified' 
            }, { status: 400 });
        }

        console.log('=== DEBUG CLIENT SIDE ===');
        console.log('Function URL:', functionUrl);
        console.log('Sending body:', payload);
        
        // Create a proper request with the body
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Function error response:', errorText);
            throw new Error(`Function returned ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('Function success response:', result);
        
        return json(result);
    } catch (error: unknown) {
        console.error('Error:', error);
        return json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ locals: { supabase, safeGetSession } }) => {
    try {
        console.log('[Role Emulation] Starting stop emulation request');
        
        // Get session with access token
        console.log('[Role Emulation] Getting session...');
        const sessionResult = await safeGetSession();
        console.log('[Role Emulation] Session result:', {
            hasSession: !!sessionResult.session,
            hasUser: !!sessionResult.user,
            hasProfile: !!sessionResult.profile
        });
        
        const { session, user, profile } = sessionResult;
        
        if (!session?.access_token) {
            throw error(401, 'No valid session');
        }

        if (!user) {
            throw error(401, 'No user found');
        }

        if (!profile) {
            throw error(401, 'No profile found');
        }

        console.log(`[Role Emulation] Stopping emulation for user ${user.id}`);

        // Invoke Edge Function with reset flag
        console.log('[Role Emulation] Invoking Edge Function...');
        const functionResult = await supabase.functions.invoke('role-emulation', {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });
        console.log('[Role Emulation] Edge Function result:', functionResult);

        if (functionResult.error) {
            throw error(500, 'Failed to stop role emulation: ' + functionResult.error.message);
        }

        console.log(`[Role Emulation] Successfully stopped emulation for user ${user.id}`);
        return json({ success: true });

    } catch (err) {
        // Log the full error for debugging
        console.error('[Role Emulation] Full error:', err);
        
        // If it's already a SvelteKit error, rethrow it
        if (err instanceof Error && 'status' in err) {
            throw err;
        }
        // Otherwise create a new error
        throw error(500, 'An unexpected error occurred');
    }
};
