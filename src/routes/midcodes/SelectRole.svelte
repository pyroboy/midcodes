<script lang="ts">
    import { Crown } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from "$lib/components/ui/select";
    import toast from "svelte-french-toast";
    import { RoleConfig } from "$lib/auth/roleConfig";
    import { onMount } from "svelte";
    
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
            toast.error('Failed to load organizations');
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
        if (!selectedRole) return;
        
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
                throw new Error(result.message || "Failed to emulate role");
            }
            
            // Wait for role state to update
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            toast.success("Role emulation started successfully");
            
            // Get default redirect URL for the selected role
            const defaultRedirect = RoleConfig[selectedRole.value].defaultRedirect;
            window.location.href = defaultRedirect;
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred";
            toast.error(message);
            console.error('[Role Emulation] Error:', err);
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
            
            toast.success("Role emulation stopped successfully");
            window.location.reload();
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred";
            toast.error(message);
            console.error('Stop emulation error:', err);
        } finally {
            loading = false;
        }
    }
</script>

<div class="space-y-4 p-4 border rounded-lg bg-gray-50">
    <div class="flex items-center gap-2">
        <Crown class="h-5 w-5 text-yellow-500" />
        <h2 class="text-lg font-semibold">Role Emulator</h2>
    </div>

    <div class="space-y-4">
        <div class="space-y-2">
            <Label>Emulate Role</Label>
            <Select onSelectedChange={handleSelect}>
                <SelectTrigger class="w-full">
                    <SelectValue placeholder="Select role to emulate">
                        {selectedRole?.label ?? "Select role to emulate"}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {#each roles as role}
                        <SelectItem 
                            value={role.value}
                        >
                            {role.label}
                        </SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>

        <div class="space-y-2" data-testid="org-select">
            <Label for="organization">Organization</Label>
            <Select onSelectedChange={handleOrgSelect}>
                <SelectTrigger class="w-full">
                    <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                    {#each organizations as org}
                        <SelectItem value={org.id}>{org.name}</SelectItem>
                    {/each}
                </SelectContent>
            </Select>
        </div>
    </div>

    <div class="flex gap-2">
        <Button
            on:click={handleEmulateRole}
            disabled={!selectedRole || !selectedOrgId || loading }
            class="w-full"
        >
            {loading ? "Loading..." : "Start Emulation"}
        </Button>
        <Button
            on:click={handleStopEmulation}
            variant="outline"
            disabled={loading}
            class="w-full"
        >
            Stop Emulation
        </Button>
    </div>
</div>