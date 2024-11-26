<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { invalidate } from '$app/navigation';
    import { navigating } from '$app/stores';
    import { Progress } from '$lib/components/ui/progress';
    import { Button } from '$lib/components/ui/button';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "$lib/components/ui/dropdown-menu";
    import { User, Sun, Moon } from 'lucide-svelte';
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

    $: profile = $page.data.profile as Profile | null;
    $: path = $page.url.pathname;
    $: showHeader = $session && path !== '/auth';
    $: userEmail = $user?.email;
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

    async function handleSignOut() {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            await goto('/');
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
        <div class="container flex h-14 items-center">
            <div class="mr-4 flex">
                <a href="/" class="mr-6 flex items-center space-x-2">
                    <span class="font-bold">ID Generator</span>
                </a>
                <nav class="flex items-center space-x-6 text-sm font-medium">
                    <a
                        href="/templates"
                        class="transition-colors hover:text-foreground/80 {path === '/templates' ? 'text-foreground' : 'text-foreground/60'}"
                    >
                        Templates
                    </a>
                    <div class="flex flex-col items-start gap-1">
                        {#if selectedTemplate}
                            <a
                                href={createIdUrl}
                                class="transition-colors hover:text-foreground/80 {path.startsWith('/use-template') ? 'text-foreground' : 'text-foreground/60'}"
                            >
                                Create ID
                            </a>
                            <span class="text-xs text-muted-foreground">Using: {selectedTemplate.name}</span>
                        {:else}
                            <span 
                                class="text-muted-foreground cursor-not-allowed"
                                title="Select a template first"
                            >
                                Create ID
                            </span>
                            <span class="text-xs text-muted-foreground">No template selected</span>
                        {/if}
                    </div>
                    <a
                        href="/all-ids"
                        class="transition-colors hover:text-foreground/80 {path === '/all-ids' ? 'text-foreground' : 'text-foreground/60'}"
                    >
                        My IDs
                    </a>
                </nav>
            </div>
            <div class="flex flex-1 items-center justify-end space-x-4">
                {#if selectedTemplate}
                    <Badge variant="outline" class="hidden sm:inline-flex">
                        Using: {selectedTemplate.name}
                    </Badge>
                {/if}
                <Button 
                    variant="ghost" 
                    size="icon"
                    on:click={handleThemeChange}
                >
                    {#if isDark}
                        <Sun class="h-5 w-5" />
                    {:else}
                        <Moon class="h-5 w-5" />
                    {/if}
                </Button>
                <div class="flex items-center gap-4">
                    <span class="text-sm text-gray-600">{userEmail}</span>
                    <Button variant="outline" size="sm" on:click={signOut}>Sign Out</Button>
                </div>
            </div>
        </div>
    </header>
{/if}

<main>
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

    main {
        padding-top: var(--nav-height);
    }
</style>