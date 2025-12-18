<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
    import { Loader2, CheckCircle } from 'lucide-svelte';

    let loading = $state(false);
    let success = $state(false);
    let error = $state('');
    
    // Pre-filled values (fixed for this deployment)
    const email = 'arjomagno@gmail.com';
    const orgName = 'MidCodes';
</script>

<div class="min-h-screen flex items-center justify-center bg-muted/40 p-4">
    <Card class="w-full max-w-md">
        {#if success}
            <!-- Success State -->
            <CardHeader>
                <div class="flex justify-center mb-4">
                    <CheckCircle class="h-16 w-16 text-green-500" />
                </div>
                <CardTitle class="text-2xl font-bold text-center text-green-600">Account Created!</CardTitle>
                <CardDescription class="text-center">
                    Your superadmin account has been set up successfully.
                </CardDescription>
            </CardHeader>
            <CardContent class="text-center space-y-4">
                <p class="text-muted-foreground">Redirecting to login page...</p>
                <Loader2 class="h-6 w-6 animate-spin mx-auto" />
            </CardContent>
        {:else}
            <!-- Setup Form -->
            <CardHeader>
                <CardTitle class="text-2xl font-bold text-center">🚀 Initial Setup</CardTitle>
                <CardDescription class="text-center">
                    Create your superadmin account to get started.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {#if error}
                    <div class="bg-destructive/15 text-destructive px-4 py-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                {/if}
                
                <form 
                    method="POST" 
                    class="space-y-4"
                    use:enhance={() => {
                        loading = true;
                        error = '';
                        return async ({ update, result }) => {
                            await update();
                            loading = false;
                            if (result.type === 'success') {
                                success = true;
                                // Redirect after showing success for 2 seconds
                                setTimeout(() => {
                                    window.location.href = '/auth';
                                }, 2000);
                            } else if (result.type === 'failure' && result.data?.error) {
                                error = result.data.error as string;
                            }
                        };
                    }}
                >
                    <!-- Hidden pre-filled fields -->
                    <input type="hidden" name="email" value={email} />
                    <input type="hidden" name="orgName" value={orgName} />
                    
                    <!-- Display-only info -->
                    <div class="rounded-lg bg-muted p-4 space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Organization:</span>
                            <span class="font-medium">{orgName}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Email:</span>
                            <span class="font-medium">{email}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <Label for="name">Your Name</Label>
                        <Input id="name" name="name" placeholder="Enter your name" required />
                    </div>

                    <div class="space-y-2">
                        <Label for="password">Password</Label>
                        <Input id="password" name="password" type="password" placeholder="Min 8 characters" required minlength={8} />
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
        {/if}
    </Card>
</div>
