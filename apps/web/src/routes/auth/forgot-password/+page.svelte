<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData } from './$types';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Loader2 } from 'lucide-svelte';

    export let form: ActionData;
    let isLoading = false;
</script>

<div class="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
    <Card class="w-full max-w-[450px] p-4">
        <CardHeader class="text-center">
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>Enter your email address and we'll send you a link to reset your password</CardDescription>
        </CardHeader>
        <CardContent>
            <form
                method="POST"
                use:enhance={() => {
                    isLoading = true;
                    return async ({ update }) => {
                        await update();
                        isLoading = false;
                    };
                }}
                class="space-y-4"
            >
                <div class="space-y-2">
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                        value={form?.email ?? ''}
                    />
                </div>

                {#if form?.error && !form?.success}
                    <p class="text-sm text-destructive">{form.error}</p>
                {/if}

                {#if form?.success}
                    <p class="text-sm text-green-600">{form.message}</p>
                {/if}

                <Button type="submit" class="w-full" disabled={isLoading}>
                    {#if isLoading}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                        Sending reset link...
                    {:else}
                        Send Reset Link
                    {/if}
                </Button>

                <div class="text-center">
                    <a href="/auth" class="text-sm text-muted-foreground hover:text-primary">Back to Sign In</a>
                </div>
            </form>
        </CardContent>
    </Card>
</div>
