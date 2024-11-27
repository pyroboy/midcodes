<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { invalidate } from '$app/navigation';
    import { navigating } from '$app/stores';
    import { Progress } from '$lib/components/ui/progress';
    import { Button } from '$lib/components/ui/button';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "$lib/components/ui/dropdown-menu";
    import { User, Sun, Moon, Menu, X } from 'lucide-svelte';
    import { onMount, onDestroy } from 'svelte';
    import { session, user } from '$lib/stores/auth';
    import { settings } from '$lib/stores/settings';
    import { Badge } from "$lib/components/ui/badge";
    import { loadGoogleFonts } from '$lib/config/fonts';
    import { supabase } from '$lib/supabaseClient';
    import "../app.css";
    
    interface Profile {
        role: string;
    }
    
    let isMenuOpen = false;
    let isUserMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
    }

    function toggleUserMenu() {
        isUserMenuOpen = !isUserMenuOpen;
    }

    $: profile = $page.data.profile as Profile | null;
    $: path = $page.url.pathname;
    $: showHeader = $session !== null && path !== '/auth';
    $: userEmail = $user?.email ?? $page.data.user?.email;
    $: selectedTemplate = $settings.selectedTemplate;
    $: createIdUrl = selectedTemplate ? `/use-template/${selectedTemplate.id}` : '/use-template';
    $: isDark = $settings.theme === 'dark';

    let progressValue = 0;
    let progressInterval: ReturnType<typeof setTimeout> | undefined;
    let showProgress = false;

    onMount(() => {
        loadGoogleFonts();
    });

    onDestroy(() => {
        if (progressInterval) clearInterval(progressInterval);
    });

    $: {
        if ($navigating) {
            showProgress = true;
            progressValue = 20;
            progressInterval = setInterval(() => {
                if (progressValue < 90) progressValue += 10;
            }, 100);
        } else {
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = undefined;
            }
            if (showProgress) {
                progressValue = 100;
                setTimeout(() => {
                    progressValue = 0;
                    showProgress = false;
                }, 200);
            }
        }
    }

    function handleThemeChange() {
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            settings.toggleTheme();
            requestAnimationFrame(() => {
                document.body.classList.remove('theme-transition');
            });
        }, 1);
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
            return;
        }
        await invalidate('supabase:auth');
        goto('/auth');
    }
</script>

<svelte:head>
    <title>ID Card Generator</title>
    <link rel="icon" href="/favicon.ico" />
</svelte:head>

{#if showProgress}
    <Progress value={progressValue} class="fixed top-0 left-0 right-0 z-50 h-1 w-full" />
{/if}

{#if showHeader}
<header class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container mx-auto px-4">
        <div class="flex h-16 items-center justify-between">
            <!-- Brand/Logo - Left -->
            <div class="flex items-center">
                <a href="/" class="flex items-center space-x-2">
                    <span class="text-xl font-bold">ID Generator</span>
                </a>
            </div>

            <!-- Desktop Navigation - Middle -->
            <nav class="hidden space-x-8 md:flex">
                <a 
                    href="/templates" 
                    class="text-sm font-medium transition-colors hover:text-foreground/80"
                    class:text-primary={path === '/templates'}
                >
                    Templates
                </a>
                <a 
                    href="/all-ids" 
                    class="text-sm font-medium transition-colors hover:text-foreground/80"
                    class:text-primary={path === '/all-ids'}
                >
                    My IDs
                </a>
            </nav>

            <!-- User Section - Right -->
            <div class="flex items-center space-x-4">
                <!-- Desktop User Menu -->
                <div class="hidden md:flex md:items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <div class="flex items-center space-x-2">
                                <div class="flex flex-col items-end">
                                    <span class="max-w-[200px] truncate text-sm">{userEmail}</span>
                                    {#if profile?.role}
                                        <span class="text-xs text-muted-foreground capitalize">{profile.role}</span>
                                    {/if}
                                </div>
                                <User class="h-5 w-5" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem on:click={handleThemeChange}>
                                {#if isDark}
                                    <Sun class="mr-2 h-4 w-4" />
                                {:else}
                                    <Moon class="mr-2 h-4 w-4" />
                                {/if}
                                Toggle Theme
                            </DropdownMenuItem>
                            <DropdownMenuItem on:click={signOut}>
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <!-- Mobile Menu Button -->
                <Button
                    variant="ghost"
                    size="icon"
                    class="md:hidden"
                    on:click={toggleMenu}
                >
                    {#if isMenuOpen}
                        <X class="h-6 w-6" />
                    {:else}
                        <Menu class="h-6 w-6" />
                    {/if}
                </Button>
            </div>
        </div>

        <!-- Mobile Navigation Menu -->
        {#if isMenuOpen}
        <div class="border-t md:hidden">
            <div class="space-y-4 px-2 py-4">
                <a 
                    href="/templates" 
                    class="block px-3 py-2 text-base font-medium transition-colors hover:bg-muted"
                    class:text-primary={path === '/templates'}
                >
                    Templates
                </a>
                <a 
                    href="/all-ids" 
                    class="block px-3 py-2 text-base font-medium transition-colors hover:bg-muted"
                    class:text-primary={path === '/all-ids'}
                >
                    My IDs
                </a>
                <div class="border-t pt-4">
                    <div class="px-3 py-2">
                        <div class="mb-2 text-sm font-medium">{userEmail}</div>
                        {#if profile?.role}
                            <div class="text-xs text-muted-foreground capitalize">{profile.role}</div>
                        {/if}
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        class="w-full justify-start px-3" 
                        on:click={handleThemeChange}
                    >
                        {#if isDark}
                            <Sun class="mr-2 h-4 w-4" />
                        {:else}
                            <Moon class="mr-2 h-4 w-4" />
                        {/if}
                        Toggle Theme
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        class="w-full justify-start px-3" 
                        on:click={signOut}
                    >
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
        {/if}
    </div>
</header>
{/if}

<main class="min-h-screen">
    <slot />
</main>

<style>
    :global(:root) {
        --nav-height: 4rem;
    }

    :global(html) {
        background-color: theme('colors.background');
        color: theme('colors.foreground');
    }

    :global(html.dark) {
        color-scheme: dark;
    }

    :global(body) {
        transition: opacity 0.5s ease;
    }

    :global(.theme-transition) {
        opacity: 0;
    }
</style>