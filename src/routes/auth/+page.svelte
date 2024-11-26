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
            await auth.signIn(email, password);
            await goto('/templates');
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

<div class="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
    <Card class="w-full max-w-[450px] p-4">
        <CardHeader class="text-center">
            <CardTitle>Welcome to ID Generator</CardTitle>
            <CardDescription>Sign in or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value="signin" class="w-full">
                <TabsList class="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                    <form
                        on:submit={handleSignIn}
                        class="space-y-4"
                    >
                        <div class="space-y-2">
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Email"
                                required
                            />
                        </div>
                        <div class="space-y-2">
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Password"
                                required
                            />
                        </div>

                        {#if errorMessage}
                            <p class="text-sm text-destructive">{errorMessage}</p>
                        {/if}

                        <Button type="submit" class="w-full" disabled={isLoading}>
                            {#if isLoading}
                                <Loader class="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            {:else}
                                Sign In
                            {/if}
                        </Button>

                        <div class="text-center">
                            <a href="/auth/forgot-password" class="text-sm text-muted-foreground hover:text-primary">Forgot your password?</a>
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="signup">
                    <form
                        on:submit={handleSignUp}
                        class="space-y-4"
                    >
                        <div class="space-y-2">
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Email"
                                required
                            />
                        </div>
                        <div class="space-y-2">
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Password"
                                required
                            />
                        </div>
                        <div class="space-y-2">
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm Password"
                                required
                            />
                        </div>

                        {#if errorMessage}
                            <p class="text-sm text-destructive">{errorMessage}</p>
                        {/if}

                        {#if form?.success}
                            <p class="text-sm text-green-600">{form.message}</p>
                        {/if}

                        <Button type="submit" class="w-full" disabled={isLoading}>
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
