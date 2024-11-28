<!-- src/routes/auth/+page.svelte -->
<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData } from './$types';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
    import { Loader } from 'lucide-svelte';
    import { auth } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import { supabase } from '$lib/supabaseClient';
    import { profile } from '$lib/stores/profile';
    import type { Profile } from '$lib/types/database';

    export let form: ActionData;
    let isLoading = false;
    let errorMessage = '';

    async function handleSignIn(event: SubmitEvent) {
        event.preventDefault();
        isLoading = true;
        errorMessage = '';

        const formData = new FormData(event.target as HTMLFormElement);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const { user: signedInUser } = await auth.signIn(email, password);
            
            // Wait for profile to be loaded
            let attempts = 0;
            const maxAttempts = 10;
            let currentProfile: Profile | null = null;
            
            while (attempts < maxAttempts) {
                currentProfile = await new Promise(resolve => {
                    let unsubscribe = profile.subscribe(value => {
                        if (unsubscribe) unsubscribe();
                        resolve(value);
                    });
                });
                
                if (currentProfile) break;
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            // Redirect based on role
            if (currentProfile?.role === 'event_qr_checker') {
                // Redirect QR checkers to their specific route
                const { data: eventData } = await supabase
                    .from('events')
                    .select('event_url')
                    .single();
                await goto(`/${eventData?.event_url}/qr-checker`);
            } else {
                // Default redirect
                await goto('/templates');
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Invalid credentials';
            isLoading = false;
        }
    }

    async function handleSignUp(event: SubmitEvent) {
        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            errorMessage = 'Passwords do not match';
            return;
        }

        isLoading = true;
        errorMessage = '';

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) throw error;
            
            if (data?.user?.identities?.length === 0) {
                errorMessage = 'Email already registered';
            } else {
                form = {
                    success: true,
                    message: 'Please check your email for a confirmation link.'
                };
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'An error occurred';
        } finally {
            isLoading = false;
        }
    }
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
                            on:submit={handleSignIn}
                            class="space-y-6"
                        >
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <label for="email" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        class="h-11 text-base"
                                        required
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label for="password" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Password
                                    </label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        class="h-11 text-base"
                                        required
                                    />
                                </div>
                            </div>

                            {#if errorMessage}
                                <div class="text-sm font-medium text-destructive">{errorMessage}</div>
                            {/if}

                            <Button type="submit" class="w-full h-11 text-base font-semibold" disabled={isLoading}>
                                {#if isLoading}
                                    <Loader class="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                {:else}
                                    Sign In
                                {/if}
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="signup">
                        <form
                            on:submit={handleSignUp}
                            class="space-y-6"
                        >
                            <div class="space-y-4">
                                <div class="space-y-2">
                                    <label for="signup-email" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Email
                                    </label>
                                    <Input
                                        id="signup-email"
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        class="h-11 text-base"
                                        required
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label for="signup-password" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Password
                                    </label>
                                    <Input
                                        id="signup-password"
                                        name="password"
                                        type="password"
                                        placeholder="Create a password"
                                        class="h-11 text-base"
                                        required
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label for="confirm-password" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Confirm Password
                                    </label>
                                    <Input
                                        id="confirm-password"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Confirm your password"
                                        class="h-11 text-base"
                                        required
                                    />
                                </div>
                            </div>

                            {#if errorMessage}
                                <div class="text-sm font-medium text-destructive">{errorMessage}</div>
                            {/if}

                            {#if form?.success}
                                <div class="text-sm font-medium text-green-600">{form.message}</div>
                            {/if}

                            <Button type="submit" class="w-full h-11 text-base font-semibold" disabled={isLoading}>
                                {#if isLoading}
                                    <Loader class="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                {:else}
                                    Create Account
                                {/if}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
</div>
