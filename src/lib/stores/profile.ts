import { writable } from 'svelte/store';
import type { Profile } from '$lib/types/database';
import { supabase } from '$lib/supabaseClient';

export const profile = writable<Profile | null>(null);

export const profileStore = {
    loadProfile: async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) {
            console.error('Error loading profile:', error);
            profile.set(null);
            return null;
        }
        
        profile.set(data);
        return data;
    },
    
    clearProfile: () => {
        profile.set(null);
    }
};
