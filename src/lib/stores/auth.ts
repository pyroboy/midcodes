import { writable } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '$lib/supabaseClient';
import { profileStore } from './profile';

export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);

// Initialize the stores with the current session
supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
    session.set(currentSession);
    user.set(currentSession?.user ?? null);
    if (currentSession?.user) {
        profileStore.loadProfile(currentSession.user.id);
    }
});

// Listen for auth changes
supabase.auth.onAuthStateChange(async (_event, currentSession) => {
    session.set(currentSession);
    user.set(currentSession?.user ?? null);
    
    if (currentSession?.user) {
        await profileStore.loadProfile(currentSession.user.id);
    } else {
        profileStore.clearProfile();
    }
});

export const auth = {
    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        
        // Load profile immediately after successful sign-in
        if (data.user) {
            await profileStore.loadProfile(data.user.id);
        }
        
        return data;
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        session.set(null);
        user.set(null);
        profileStore.clearProfile();
    },

    resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    },

    updatePassword: async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
    }
};
