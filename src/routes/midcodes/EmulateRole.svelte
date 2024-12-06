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

    interface Event {
        id: string;
        event_url: string;
        event_name: string;
        org_id: string;
    }
    
    let selectedRole: RoleOption | undefined = undefined;
    let selectedOrgId: string | undefined = undefined;
    let selectedEventId: string | undefined = undefined;
    let loading = false;
    let organizations: Organization[] = [];
    let events: Event[] = [];
    
    $: emulation = $page.data.session?.roleEmulation as RoleEmulationClaim | null;
    $: isEmulating = emulation?.active ?? false;
    $: currentRole = emulation?.emulated_role;
    $: organizationName = emulation?.organizationName ?? 'Unknown Organization';
    $: contextData = emulation?.metadata?.context ?? null;
    $: filteredEvents = selectedOrgId 
        ? events.filter(e => e.org_id === selectedOrgId)
        : events;
    
    // Debug log to check emulation data
    $: {
        if (emulation) {
            console.log('Emulation data:', emulation);
            console.log('Context data:', contextData);
        }
    }

    const roles: RoleOption[] = [
        { label: "Super Admin", value: "super_admin" },
        { label: "Organization Admin", value: "org_admin" },
        { label: "Event Admin", value: "event_admin" },
        { label: "Event QR Checker", value: "event_qr_checker" },
        { label: "Regular User", value: "user" }
    ];

    onMount(async () => {
        try {
            // Load organizations
            const { data: orgs, error: orgsError } = await fetch('/api/organizations', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            }).then(r => r.json());
            if (orgsError) throw orgsError;
            organizations = orgs;

            // Load events
            const { data: eventsData, error: eventsError } = await fetch('/api/events', {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            }).then(r => r.json());
            if (eventsError) throw eventsError;
            events = eventsData || [];
            console.log('Loaded events:', events);
        } catch (err) {
            console.error('Failed to load data:', err);
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
        // Reset event selection when org changes
        selectedEventId = undefined;
    }

    function handleEventSelect(event: { value: string } | undefined) {
        selectedEventId = event?.value;
    }
    
    async function handleEmulateRole() {
        if (!selectedRole) {
            console.error("Please select a role first");
            return;
        }
        
        loading = true;
        try {
            // Find the selected event to get its URL
            const selectedEvent = events.find(e => e.id === selectedEventId);
            
            const payload = { 
                emulatedRole: selectedRole.value,
                ...(selectedOrgId && { emulatedOrgId: selectedOrgId }),
                ...(selectedEventId && { 
                    context: {
                        event_id: selectedEventId,
                        event_url: selectedEvent?.event_url || null
                    }
                })
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
            
            // Get default redirect URL for the selected role, passing the context
            const redirectUrl = RoleConfig[selectedRole.value].defaultPath(payload.context);
            window.location.href = redirectUrl;
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

<style>
    :global(.json-key) { color: #f8f8f2; }
    :global(.json-string-value) { color: #a6e22e; }
    :global(.json-number) { color: #ae81ff; }
    :global(.json-boolean) { color: #66d9ef; }
    :global(.json-null) { color: #f92672; }
    :global(.json-punctuation) { color: #75715e; }
</style>

<div class="space-y-4 p-4 border rounded-lg bg-card text-card-foreground dark:bg-gray-900 dark:border-gray-800">
    <div class="flex items-center gap-2">
        <h2 class="text-lg font-semibold text-foreground dark:text-white">Role Emulator</h2>
    </div>

    <!-- Debug Display -->
    <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <h3 class="text-sm font-medium mb-2">Emulation Status:</h3>
        <pre class="text-xs overflow-auto max-h-48 p-2 bg-white dark:bg-gray-900 rounded border dark:border-gray-700">Active: {isEmulating}
Current Role: {currentRole}
Organization: {organizationName}
Has Context: {!!contextData}</pre>
    </div>

    <!-- Context Data Display -->
    {#if emulation?.metadata}
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h3 class="text-sm font-medium mb-2">Metadata:</h3>
            <pre class="text-xs overflow-auto max-h-48 p-2 bg-white dark:bg-gray-900 rounded border dark:border-gray-700">{JSON.stringify(emulation.metadata, null, 2)}</pre>
        </div>
    {/if}

    {#if isEmulating}
        <Button
            on:click={handleStopEmulation}
            variant="outline"
            class="w-full"
            disabled={loading}
        >
            Stop Emulation
        </Button>
    {:else}
        <div class="space-y-4">
            <div class="space-y-2">
                <label for="role" class="text-sm font-medium">Role</label>
                <Select
                    onSelectedChange={handleSelect}
                    disabled={loading}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        {#each roles as role}
                            <SelectItem
                                value={role.value}
                                disabled={role.disabled}
                            >
                                {role.label}
                            </SelectItem>
                        {/each}
                    </SelectContent>
                </Select>
            </div>

            {#if selectedRole?.value === 'org_admin' || selectedRole?.value === 'super_admin'}
                <div class="space-y-2">
                    <label for="organization" class="text-sm font-medium">Organization</label>
                    <Select
                        onSelectedChange={handleOrgSelect}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                            {#each organizations as org}
                                <SelectItem value={org.id}>
                                    {org.name}
                                </SelectItem>
                            {/each}
                        </SelectContent>
                    </Select>
                </div>
            {/if}

            {#if selectedRole && (selectedRole.value === 'event_admin' || selectedRole.value === 'event_qr_checker')}
                <div class="space-y-2">
                    <label for="event" class="text-sm font-medium">Event</label>
                    <Select
                        onSelectedChange={handleEventSelect}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select event" />
                        </SelectTrigger>
                        <SelectContent>
                            {#each filteredEvents as event}
                                <SelectItem value={event.id}>
                                    {event.event_url || event.event_name}
                                </SelectItem>
                            {/each}
                        </SelectContent>
                    </Select>
                </div>
            {/if}

            <Button
                on:click={handleEmulateRole}
                class="w-full"
                disabled={loading || !selectedRole || (
                    (selectedRole.value === 'org_admin' || selectedRole.value === 'super_admin') && !selectedOrgId
                ) || (
                    (selectedRole.value === 'event_admin' || selectedRole.value === 'event_qr_checker') && !selectedEventId
                )}
            >
                Start Emulation
            </Button>
        </div>
    {/if}
</div>