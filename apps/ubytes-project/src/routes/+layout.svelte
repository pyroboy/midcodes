<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { invalidate } from '$app/navigation';
    import { navigating } from '$app/stores';
    import { Progress } from '$lib/components/ui/progress';
    import { onMount, onDestroy, setContext } from 'svelte';
    import type { Session, RealtimeChannel } from '@supabase/supabase-js';
    import { medalTallyStore } from '$lib/stores/medalTallyStore';
    import '../app.css';
    
    interface Profile {
        role: string;
    }

    $: session = $page.data.session as Session | null;
    $: profile = $page.data.profile as Profile | null;
    $: path = $page.url.pathname;
    $: showHeader = session && profile && path !== '/auth/signin';

    let progressValue = 0;
    let progressInterval: ReturnType<typeof setTimeout> | undefined;
    let showProgress = false;
    let storeCleanup: (() => void);
    let tabulationChannel: RealtimeChannel;

    $: if ($page.data.supabase) {
        console.log('🔵 Setting Supabase client in context');
        setContext('supabase', $page.data.supabase);
    }
    onMount(() => {
        const supabase = $page.data.supabase;
        console.log('🔵 Layout mounted, Supabase client:', !!supabase);
        storeCleanup = medalTallyStore.initialize(supabase);
    });

    onDestroy(() => {
        if (progressInterval) clearInterval(progressInterval);
        if (storeCleanup) storeCleanup();
        if (tabulationChannel) $page.data.supabase.removeChannel(tabulationChannel);
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
    function handleNavigation(event: MouseEvent) {
        event.preventDefault();
        const target = event.target as HTMLAnchorElement;
        goto(target.href);
    }

    async function handleSignOut(event: Event) {
        event.preventDefault();
        const { error } = await $page.data.supabase.auth.signOut();
        if (!error) {
            await invalidate('supabase:auth');
            localStorage.clear();
            sessionStorage.clear();
            goto('/auth/signin');
        }
    }
</script>

<svelte:head>
    <title>UB-DAYS 2024</title>
    <!-- Favicons -->
    <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <!-- You can also add a web manifest if you have one -->
    <meta name="theme-color" content="#ffffff">
</svelte:head>

{#if showHeader}
    <div class="fixed-header-container">
        <nav class="w-full bg-gray-50 shadow-md">
            <div class="nav-container w-full">
                <div class="nav-left">
                    <div class="logo-container">
                        <img src="/images/cornerTag.png" alt="Logo" class="h-32 w-auto object-contain" />
                    </div>
                    <ul class="nav-links">
                        {#if profile?.role === 'Admin'}
                            <li><a href="/events" on:click={handleNavigation}>Events</a></li>
                            <li><a href="/departments" on:click={handleNavigation}>Departments</a></li>
                            <li><a href="/tabulation" on:click={handleNavigation}>Tabulation</a></li>
                            <li><a href="/auth/register" on:click={handleNavigation}>Register</a></li>
                            <li><a href="/results" on:click={handleNavigation}>Results</a></li>
                            <li><a href="/log" on:click={handleNavigation}>Log</a></li>
                            <li><a href="/about" on:click={handleNavigation}>About Us</a></li>
                        {:else if profile?.role === 'TabulationHead'}
                            <li><a href="/events" on:click={handleNavigation}>Events</a></li>
                            <li><a href="/departments" on:click={handleNavigation}>Departments</a></li>
                            <li><a href="/tabulation" on:click={handleNavigation}>Tabulation</a></li>
                            <li><a href="/results" on:click={handleNavigation}>Results</a></li>
                            <li><a href="/log" on:click={handleNavigation}>Log</a></li>
                            <li><a href="/about" on:click={handleNavigation}>About Us</a></li>
                        {:else if profile?.role === 'TabulationCommittee'}
                            <li><a href="/tabulation" on:click={handleNavigation}>Tabulation</a></li>
                            <li><a href="/results" on:click={handleNavigation}>Results</a></li>
                            <li><a href="/about" on:click={handleNavigation}>About Us</a></li>
                        {/if}
                    </ul>
                </div>
                <div class="nav-right">
                    <span class="user-info">
                        <span class="user-email">{session?.user.email}</span>
                        <span class="user-role">{profile?.role ?? 'N/A'}</span>
                    </span>
                    <form on:submit={handleSignOut}>
                        <button type="submit" class="sign-out-btn">Sign out</button>
                    </form>
                </div>
            </div>
        </nav>

        <div class="progress-wrapper">
            {#if showProgress}
                <div class="progress-container">
                    <Progress value={progressValue} class="h-[2px]" />
                    <div class="progress-animation" />
                </div>
            {/if}
        </div>
    </div>
{/if}

<main class="content-wrapper">
    <slot />
</main>

<style>
    :global(:root) {
        --nav-height: 128px;
    }

    .fixed-header-container {
        position: relative;
        height: calc(var(--nav-height) + 4px);
        z-index: 50;
        background-color: #f8f9fa;
    }

    nav {
        background-color: #f8f9fa;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        position: relative;
        z-index: 50;
        height: var(--nav-height);
    }

    .nav-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0 auto;
        position: relative;
        padding-right: 6rem;
        height: 100%;
    }

    .logo-container {
        display: flex;
        align-items: center;
    }

    .nav-left {
        display: flex;
        align-items: center;
        gap: 2rem;
        height: 100%;
    }

    .nav-links {
        list-style-type: none;
        padding: 0;
        display: flex;
        gap: 1.5rem;
        margin: 0;
        align-items: center;
    }

    .nav-links a {
        text-decoration: none;
        color: #333;
        font-weight: 500;
        transition: color 0.3s ease;
        padding: 0.5rem;
    }

    .nav-links a:hover {
        color: #007bff;
    }

    .nav-right {
        display: flex;
        align-items: center;
    }

    .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        margin-right: 1rem;
    }

    .user-email {
        font-weight: 500;
    }

    .user-role {
        font-size: 0.8rem;
        color: #666;
    }

    .sign-out-btn {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .sign-out-btn:hover {
        background-color: #0056b3;
    }

    .progress-wrapper {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        z-index: 50;
        background-color: transparent;
    }

    .progress-container {
        position: relative;
        width: 100%;
        height: 100%;
        background-color: transparent;
    }

    .progress-animation {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
        );
        animation: shimmer 1s infinite linear;
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }
</style>