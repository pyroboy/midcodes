<script lang="ts">
    import { enhance } from '$app/forms';
    import type { AuthActionData } from './+page.server';
    import type { SubmitFunction } from '@sveltejs/kit';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
    import { Loader } from 'lucide-svelte';
    import { invalidateAll } from '$app/navigation';

    export let form: AuthActionData;
    let isLoading = false;

    const handleSubmit: SubmitFunction = () => {
        isLoading = true;
        return async ({ result, update }) => {
            if (result.type === 'redirect') {
                await invalidateAll();
                return;
            }
            await update();
            isLoading = false;
        };
    };
</script>

<div class="min-h-screen w-full bg-background px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[500px] lg:w-[600px]">
        <Card class="w-full p-6 shadow-lg">
            <CardHeader class="space-y-4 text-center">
                <CardTitle class="text-3xl font-bold tracking-tight">Welcome to ID Generator</CardTitle>
                <CardDescription class="text-lg text-muted-foreground">Sign in or create an account to continue</CardDescription>
            </CardHeader>
            <CardContent class="pt-6">
                <Tabs value="signin" class="w-full">
                    <TabsList class="grid w-full grid-cols-2 gap-4 rounded-lg p-1">
                        <TabsTrigger value="signin" class="text-base py-2">Sign In</TabsTrigger>
                        <TabsTrigger value="signup" class="text-base py-2">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin">
                        <form
                            method="POST"
                            action="?/signin"
                            use:enhance={handleSubmit}
                            class="space-y-6"
                        >
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <Input
                                        id="signin-email"
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={form?.email ?? ''}
                                        required
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Input
                                        id="signin-password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {#if form?.error}
                                <div class="text-sm text-red-500" role="alert">
                                    {form.error}
                                </div>
                            {/if}

                            <Button type="submit" class="w-full" disabled={isLoading}>
                                {#if isLoading}
                                    <Loader class="mr-2 h-4 w-4 animate-spin" />
                                {/if}
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup">
                        <form
                            method="POST"
                            action="?/signup"
                            use:enhance={handleSubmit}
                            class="space-y-6"
                        >
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <Input
                                        id="signup-email"
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={form?.email ?? ''}
                                        required
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Input
                                        id="signup-password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Input
                                        id="signup-confirm-password"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {#if form?.error}
                                <div class="text-sm text-red-500" role="alert">
                                    {form.error}
                                </div>
                            {/if}

                            {#if form?.success}
                                <div class="text-sm text-green-500" role="alert">
                                    {form.message}
                                </div>
                            {/if}

                            <Button type="submit" class="w-full" disabled={isLoading}>
                                {#if isLoading}
                                    <Loader class="mr-2 h-4 w-4 animate-spin" />
                                {/if}
                                {isLoading ? 'Creating account...' : 'Sign Up'}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
</div>