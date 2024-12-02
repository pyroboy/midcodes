<script lang="ts">
    import { page } from '$app/stores';
    import { Progress } from '$lib/components/ui/progress';
    import { Button } from '$lib/components/ui/button';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "$lib/components/ui/dropdown-menu";
    import { User, Sun, Moon, Menu, X, Crown } from 'lucide-svelte';
    import { onMount, onDestroy } from 'svelte';
    import { session, user, auth, roleState, profile } from '$lib/stores/auth';
    import { settings } from '$lib/stores/settings';
    import { loadGoogleFonts } from '$lib/config/fonts';
    import { supabase } from '$lib/supabaseClient';
    import { navigating } from '$app/stores';
    import { browser } from '$app/environment';
    import "../app.css";
    
    let isMenuOpen = false;
    let isUserMenuOpen = false;
    let showProgress = false;
    let progressValue = 0;
    let progressInterval: ReturnType<typeof setTimeout> | undefined;
    

    $: path = $page.url.pathname;
    $: navigation = $page.data.navigation;
    $: showHeader = navigation?.showHeader ?? false;
    $: isDark = $settings.theme === 'dark';
    $: userEmail = $page.data.user?.email ?? '';
    $: role = $roleState;
    $: userProfile = $page.data.profile;

    // Navigation progress bar
    $: {
        if ($navigating) {
            showProgress = true;
            progressValue = 0;
            progressInterval = setInterval(() => {
                if (progressValue < 90) {
                    progressValue += 10;
                }
            }, 100);
        } else {
            progressValue = 100;
            setTimeout(() => {
                showProgress = false;
                if (progressInterval) {
                    clearInterval(progressInterval);
                    progressInterval = undefined;
                }
            }, 300);
        }
    }

    onMount(async () => {
        if (browser) {
            await loadGoogleFonts();
        }
    });

    onDestroy(() => {
        if (progressInterval) {
            clearInterval(progressInterval);
        }
    });

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
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
        await auth.signOut();
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
            <div class="flex items-center">
                <a href={navigation.homeUrl} class="flex items-center space-x-2">
                    <span class="hidden font-bold sm:inline-block">
                        {navigation.homeUrl === '/' ? 'ID Card Generator' : 
                         navigation.homeUrl.replace('/', '').charAt(0).toUpperCase() + 
                         navigation.homeUrl.replace('/', '').slice(1)}
                    </span>
                </a>
            </div>

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

            <div class="flex items-center space-x-4">
                <div class="hidden md:flex md:items-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <div class="flex items-center space-x-2">
                                <div class="flex flex-col items-end">
                                    <span class="max-w-[200px] truncate text-sm font-medium">{userEmail}</span>
                                    {#if userProfile}
                                        <span class="text-xs text-muted-foreground">
                                            {#if role.isEmulating}
                                                <span class="text-yellow-500">Emulating: {role.currentRole}</span>
                                                <span class="text-muted-foreground">(Base: {role.baseRole})</span>
                                            {:else}
                                                Role: {userProfile.role}
                                            {/if}
                                        </span>
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
                <div class="px-3 py-2">
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Theme</span>
                        <Button variant="ghost" size="sm" on:click={handleThemeChange}>
                            {#if isDark}
                                <Sun class="h-4 w-4" />
                            {:else}
                                <Moon class="h-4 w-4" />
                            {/if}
                        </Button>
                    </div>
                </div>
                <button 
                    class="block w-full px-3 py-2 text-base font-medium text-left text-red-500 transition-colors hover:bg-muted"
                    on:click={signOut}
                >
                    Sign Out
                </button>
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
    :global(body) {
        transition: background-color 0.3s ease;
    }

    :global(body.theme-transition) {
        transition: none !important;
    }

    :global(.theme-transition *) {
        transition: none !important;
    }
</style>