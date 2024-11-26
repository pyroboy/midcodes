import { writable } from 'svelte/store'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export const user = writable<User | null>(null)

export const auth = {
    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
        return data
    },

    signUp: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        })
        if (error) throw error
        return data
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        user.set(null)
    },

    resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
    },

    updatePassword: async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })
        if (error) throw error
    }
}

// Initialize the user store with the current session
supabase.auth.getSession().then(({ data: { session } }) => {
    user.set(session?.user ?? null)
})

// Listen for auth changes
supabase.auth.onAuthStateChange((_event, session) => {
    user.set(session?.user ?? null)
})
