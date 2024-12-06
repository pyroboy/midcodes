<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from "$lib/components/ui/select";
    import { RoleConfig } from "$lib/auth/roleConfig";
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import type { RoleEmulationClaim } from '$lib/types/roleEmulation';
    
    type UserRole = 'super_admin' | 'org_admin' | 'event_admin' | 'event_qr_checker' | 'user';

    interface RoleOption {
        label: string;
        value: UserRole;
        disabled?: boolean;
    }

    interface Organization {
        id: string;
        name: string;
    }
    
    let selectedRole: RoleOption | undefined = undefined;
    let selectedOrgId: string | undefined = undefined;
    let loading = false;
    let organizations: Organization[] = [];
    $: emulation = $page.data.session?.roleEmulation as RoleEmulationClaim | null;
    $: isEmulating = emulation?.active ?? false;
    $: currentRole = emulation?.emulated_role;
    $: organizationName = emulation?.organizationName ?? 'Unknown Organization';
    const roles: RoleOption[] = [
        { label: "Super Admin", value: "super_admin" },
        { label: "Organization Admin", value: "org_admin" },
        { label: "Event Admin", value: "event_admin" },
        { label: "Event QR Checker", value: "event_qr_checker" },
        { label: "Regular User", value: "user" }
    ];

    onMount(async () => {
        try {
            const { data: orgs, error } = await fetch('/api/organizations').then(r => r.json());
            if (error) throw error;
            organizations = orgs;
        } catch (err) {
            console.error('Failed to load organizations:', err);
        }
    });
    
    function handleSelect(event: { value: UserRole } | undefined) {
        if (!event) {
            selectedRole = undefined;
            return;
        }
        selectedRole = roles.find(r => r.value === event.value);
    }

    function handleOrgSelect(event: { value: string } | undefined) {
        selectedOrgId = event?.value;
    }
    
    async function handleEmulateRole() {
        if (!selectedRole) {
            console.error("Please select a role first");
            return;
        }
        
        loading = true;
        try {
            const payload = { 
                emulatedRole: selectedRole.value,
                ...(selectedOrgId && { emulatedOrgId: selectedOrgId })
            };
            console.log('[Role Emulation] Sending payload:', payload);
            
            const response = await fetch("/api/role-emulation", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            console.log('[Role Emulation] Response:', result);
            
            if (!response.ok) {
                const errorMessage = result.error || result.message || "Failed to emulate role";
                console.error('[Role Emulation] Error:', errorMessage);
                throw new Error(errorMessage);
            }
            
            // Wait for role state to update
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get default redirect URL for the selected role
            const defaultRedirect = RoleConfig[selectedRole.value].defaultRedirect;
            window.location.href = defaultRedirect;
        } catch (err) {
            console.error('[Role Emulation] Full error:', err);
            const message = err instanceof Error ? err.message : "An error occurred";
            console.error(message);
        } finally {
            loading = false;
        }
    }
    
    async function handleStopEmulation() {
        loading = true;
        try {
            const response = await fetch("/api/role-emulation", {
                method: "DELETE",
                headers: { 
                    "Accept": "application/json"
                }
            });
            
            const data = await response.json();
            console.log('Stop emulation response:', data);
            
            if (!response.ok) {
                throw new Error(data.message || "Failed to stop emulation");
            }
            
            window.location.reload();
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred";
            console.error('Stop emulation error:', err);
        } finally {
            loading = false;
        }
    }
</script>

<div class="space-y-4 p-4 border rounded-lg bg-card text-card-foreground dark:bg-gray-900 dark:border-gray-800">
    <div class="flex items-center gap-2">
        <h2 class="text-lg font-semibold text-foreground dark:text-white">Role Emulator</h2>
    </div>

    {#if isEmulating}
        <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-900/30">
            <p class="text-sm text-yellow-800 dark:text-yellow-200">
                Currently emulating: <span class="font-medium">{currentRole}</span>
                <br>
                Organization: <span class="font-medium">{organizationName}</span>
            </p>
        </div>
        
        <Button
            on:click={handleStopEmulation}
            variant="outline"
            disabled={loading}
            class="w-full bg-background hover:bg-accent dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:border-gray-700"
        >
            {loading ? "Loading..." : "Stop Emulation"}
        </Button>
    {:else}
        <div class="space-y-3">
            <div class="space-y-2">
                <Select onSelectedChange={handleSelect}>
                    <SelectTrigger class="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                        <SelectValue placeholder="Select role to emulate">
                            {selectedRole?.label ?? "Select role to emulate"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent class="dark:bg-gray-800 dark:border-gray-700">
                        {#each roles as role}
                            <SelectItem 
                                value={role.value}
                                class="dark:text-white dark:focus:bg-gray-700 dark:hover:bg-gray-700"
                            >
                                {role.label}
                            </SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>

            <div class="space-y-2" data-testid="org-select">
                <Select onSelectedChange={handleOrgSelect}>
                    <SelectTrigger class="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                        <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent class="dark:bg-gray-800 dark:border-gray-700">
                        {#each organizations as org}
                            <SelectItem 
                                value={org.id}
                                class="dark:text-white dark:focus:bg-gray-700 dark:hover:bg-gray-700"
                            >
                                {org.name}
                            </SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>

            <Button
                on:click={handleEmulateRole}
                disabled={!selectedRole || !selectedOrgId || loading }
                class="w-full bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
                {loading ? "Loading..." : "Start Emulation"}
            </Button>
        </div>
    {/if}
</div>