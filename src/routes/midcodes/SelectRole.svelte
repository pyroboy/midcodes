<script lang="ts">
    import { page } from '$app/stores';
    import { roleState } from '$lib/stores/auth';
    import { supabase } from '$lib/supabaseClient';
    import type { UserRole } from '$lib/types/database';
    import toast from 'svelte-french-toast';

    interface RoleEmulationResponse {
        success: boolean;
        session?: {
            id: string;
            role: UserRole;
            expires_at: string;
        };
        error?: string;
    }

    const ROLES = ['org_admin', 'event_admin', 'user'] as const;
    type AvailableRole = (typeof ROLES)[number];

    function isAvailableRole(value: string): value is AvailableRole {
        console.log('Checking if role is available:', value);
        return ROLES.includes(value as AvailableRole);
    }

    let selectedRole: UserRole | null = null;

    $: userId = $page.data.user?.id;
    $: currentRole = $page.data.profile?.role || $roleState.currentRole;
    $: {
        console.log('Current user state:', {
            userId,
            currentRole,
            selectedRole
        });
    }

    async function handleRoleSelect() {
        console.log('Attempting to change role to:', selectedRole);
        
        if (!selectedRole || !userId) {
            console.log('Role selection failed - Missing data:', { selectedRole, userId });
            return;
        }

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.access_token) {
                throw new Error('No active session');
            }

            console.log('Invoking role-emulation function with:', {
                role: selectedRole,
                userId,
                currentRole
            });

            const { data, error } = await supabase.functions.invoke<RoleEmulationResponse>('role-emulation', {
                body: { 
                    role: selectedRole
                },
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Role emulation response:', { data, error });

            if (error || !data?.success) {
                throw new Error(error?.message || data?.error || 'Role emulation failed');
            }

            toast.success(`Role changed to ${selectedRole}`, {
                duration: 3000,
                position: 'top-right'
            });
            
            console.log('Role change successful, reloading page...');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Role change error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to change role';
            
            toast.error(`${errorMessage}. Please try again.`, {
                duration: 3000,
                position: 'top-right'
            });
        }
    }

    async function handleRoleReset() {
        console.log('Attempting to reset role for user:', userId);
        
        if (!userId) {
            console.log('Role reset failed - Missing userId');
            return;
        }

        try {
            console.log('Invoking role-emulation reset');
            const { data, error } = await supabase.functions.invoke<RoleEmulationResponse>('role-emulation', {
                body: { reset: true }
            });

            console.log('Role reset response:', { data, error });

            if (error || !data?.success) {
                throw new Error(error?.message || data?.error || 'Role reset failed');
            }

            toast.success('Role reset successful', {
                duration: 3000,
                position: 'top-right'
            });
            
            console.log('Role reset successful, reloading page...');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Role reset error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to reset role';
            
            toast.error(`${errorMessage}. Please try again.`, {
                duration: 3000,
                position: 'top-right'
            });
        }
    }

    function handleSelectChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        console.log('Select value changed:', select.value);
        
        if (select.value && isAvailableRole(select.value)) {
            console.log('Setting selected role to:', select.value);
            selectedRole = select.value;
        } else {
            console.log('Clearing selected role');
            selectedRole = null;
        }
    }
</script>

<div class="relative">
    <select 
        class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        on:change={handleSelectChange}
        value={selectedRole || ''}
    >
        <option value="">Select a role to emulate</option>
        {#each ROLES as role}
            <option value={role}>
                {role}
            </option>
        {/each}
    </select>

    <div class="mt-4 space-x-2">
        <button
            on:click={handleRoleSelect}
            disabled={!selectedRole}
            class="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
    
    option {
        text-transform: capitalize;
    }
</style>