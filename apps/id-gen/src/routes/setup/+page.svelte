<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
    import { Loader2 } from 'lucide-svelte';

    let loading = false;
</script>

<div class="min-h-screen flex items-center justify-center bg-muted/40 p-4">
    <Card class="w-full max-w-md">
        <CardHeader>
            <CardTitle class="text-2xl font-bold text-center">Initial Setup</CardTitle>
            <CardDescription class="text-center">
                Create the superadmin account and organization to get started.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form 
                method="POST" 
                class="space-y-4"
                use:enhance={() => {
                    loading = true;
                    return async ({ update, result }) => {
                        await update();
                        loading = false;
                        if (result.type === 'success') {
                            window.location.href = '/auth';
                        }
                    };
                }}
            >
                <div class="space-y-2">
                    <Label for="orgName">Organization Name</Label>
                    <Input id="orgName" name="orgName" placeholder="My Organization" required />
                </div>
                
                <div class="space-y-2">
                    <Label for="name">Admin Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" required />
                </div>

                <div class="space-y-2">
                    <Label for="email">Admin Email</Label>
                    <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
                </div>

                <div class="space-y-2">
                    <Label for="password">Password</Label>
                    <Input id="password" name="password" type="password" required minlength={8} />
                </div>

                <Button type="submit" class="w-full" disabled={loading}>
                    {#if loading}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                    {:else}
                        Complete Setup
                    {/if}
                </Button>
            </form>
        </CardContent>
    </Card>
</div>
