<script lang="ts">
    import { page } from '$app/stores';
    import { roleState } from '$lib/stores/auth';
    import { supabase } from '$lib/supabaseClient';
    import type { UserRole } from '$lib/types/database';
    import toast from 'svelte-french-toast';

    const roles: UserRole[] = ['org_admin', 'event_admin', 'user'];
    let selectedRole: UserRole | null = null;

    // Get user role from page data
    $: userId = $page.data.user?.id;
    $: currentRole = $roleState.currentRole;

    async function handleRoleSelect() {
        if (!selectedRole) return;

        try {
            console.log('Sending role emulation request:', { role: selectedRole });
            const { data, error } = await supabase.functions.invoke('role-emulation', {
                body: { 
                    role: selectedRole,
                    metadata: {
                        source: 'web_interface',
                        timestamp: new Date().toISOString()
                    }
                }
            });

            if (error) throw error;

            console.log('Role emulation response:', data);
            toast.success('Role changed to ' + selectedRole, {
                duration: 3000,
                position: 'top-right'
            });
            
            // Refresh the page to get new session with updated claims
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Error setting role:', error);
            toast.error('Failed to change role. Please try again.', {
                duration: 3000,
                position: 'top-right'
            });
        }
    }

    async function handleRoleReset() {
        if (!userId) return;

        try {
            console.log('Sending role reset request');
            const { data, error } = await supabase.functions.invoke('role-emulation', {
                body: { reset: true }
            });

            if (error) throw error;

            console.log('Role reset response:', data);
            toast.success('Role reset successful', {
                duration: 3000,
                position: 'top-right'
            });
            
            // Refresh the page to get new session with updated claims
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Error resetting role:', error);
            toast.error('Failed to reset role. Please try again.', {
                duration: 3000,
                position: 'top-right'
            });
        }
    }
</script>

<div class="relative">
    <select
        bind:value={selectedRole}
        class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
        <option value={null}>Select a role to emulate</option>
        {#each roles as role}
            <option value={role}>{role}</option>
        {/each}
    </select>

    <div class="mt-4 space-x-2">
        <button
            on:click={handleRoleSelect}
            disabled={!selectedRole}
            class="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
            Emulate Role
        </button>

        {#if currentRole}
            <button
                on:click={handleRoleReset}
                class="px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
                Reset Role
            </button>
        {/if}
    </div>

    {#if currentRole !== $roleState.currentRole}
        <div class="mt-2 text-sm">
            <span class="text-yellow-600">
                Currently emulating: {currentRole}
            </span>
        </div>
    {/if}
</div>

<style>
    select {
        text-transform: capitalize;
    }
</style>
