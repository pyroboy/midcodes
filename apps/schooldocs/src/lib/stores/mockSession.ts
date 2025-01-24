import { writable } from 'svelte/store';
import type { GetSessionResult } from '../../app';

// Initial mock session state
const initialSession: GetSessionResult = {
  session: {
    access_token: 'mock_access_token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock_refresh_token',
    user: {
      id: 'mock_user_id',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'mock@example.com',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: { provider: 'email' },
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  error: null,
  user: {
    id: 'mock_user_id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'mock@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

// Create a writable store with the initial mock session
export const mockSession = writable<GetSessionResult>(initialSession);

// Helper functions to simulate auth actions
export const mockAuth = {
  signIn: () => mockSession.set(initialSession),
  signOut: () => mockSession.set({ session: null, error: null, user: null }),
  // Add more mock auth methods as needed
};