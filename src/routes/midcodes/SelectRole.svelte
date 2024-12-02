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
    
    type UserRole = 'super_admin' | 'org_admin' | 'event_admin' | 'user';

    interface RoleOption {
        label: string;
        value: UserRole;
        disabled?: boolean;
    }

    export let currentRole: UserRole;
    
    let selectedRole: RoleOption | undefined = undefined;
    let loading = false;
    
    const roles: RoleOption[] = [
        { label: "Organization Admin", value: "org_admin" },
        { label: "Event Admin", value: "event_admin" },
        { label: "Regular User", value: "user" }
    ];
    
    function handleSelect(event: { value: UserRole } | undefined) {
        if (!event) {
            selectedRole = undefined;
            return;
        }
        selectedRole = roles.find(r => r.value === event.value);
    }
    
    async function handleEmulateRole() {
        if (!selectedRole) return;
        
        loading = true;
        try {
            const payload = { emulatedRole: selectedRole.value };
            console.log('Sending payload:', payload);
            
            const response = await fetch("/api/role-emulation", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            console.log('Response:', data);
            
            if (!response.ok) {
                throw new Error(data.message || "Failed to emulate role");
            }
            
            toast.success("Role emulation started successfully");
            window.location.reload();
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred";
            toast.error(message);
            console.error('Role emulation error:', err);
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

    <div class="space-y-2">
        <Label>Current Role</Label>
        <div class="text-sm font-medium bg-white p-2 rounded border">
            {roles.find(r => r.value === currentRole)?.label || currentRole}
        </div>
    </div>

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
                        disabled={role.value === currentRole}
                    >
                        {role.label}
                    </SelectItem>
                {/each}
            </SelectContent>
        </Select>
    </div>

    <div class="flex gap-2">
        <Button
            on:click={handleEmulateRole}
            disabled={!selectedRole || loading || selectedRole.value === currentRole}
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