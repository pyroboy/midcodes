<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
    import type { User } from '@supabase/supabase-js';
    import { darkMode } from '../stores/darkMode';
    import "../app.css";
    let user: User | null = null;
    let menuOpen = false;
    
    onMount(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            user = session?.user ?? null;
        });
    
        supabase.auth.onAuthStateChange((_, session) => {
            user = session?.user ?? null;
        });
    });
    
    async function signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error signing out:', error);
        else goto('/signin');
    }
    
    function toggleMenu() {
        menuOpen = !menuOpen;
    }
    </script>
    <nav>
        <div class="nav-container">
            <a href="/" class="logo">ID Generator</a>
            <button class="menu-toggle" on:click={toggleMenu}>
                ☰
            </button>
        </div>
        <ul class:open={menuOpen}>
            <li><a href="/" on:click={toggleMenu}>Home</a></li>
            {#if user}
                <li><a href="/all-ids" on:click={toggleMenu}>All IDs</a></li>
                <li><a href="/edit-template" on:click={toggleMenu}>Edit Template</a></li>
                <li><button on:click={() => { signOut(); toggleMenu(); }}>Sign Out</button></li>
            {:else}
                <li><a href="/signin" on:click={toggleMenu}>Sign In</a></li>
                <li><a href="/signup" on:click={toggleMenu}>Sign Up</a></li>
            {/if}
        </ul>
    </nav>
    


    
    <main class:dark={$darkMode}>
        <slot></slot>
    </main>
    
    <style>

:global(html) {
        background-color: theme('colors.background');
        color: theme('colors.foreground');
    }
    :global(.dark) {
        color-scheme: dark;
    }


    nav {
        background-color: #f0f0f0;
        padding: 10px;
    }
    .nav-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .logo {
        font-size: 1.2em;
        font-weight: bold;
        text-decoration: none;
        color: #333;
    }
    .menu-toggle {
        display: none;
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
    }
    ul {
        list-style-type: none;
        padding: 0;
        display: flex;
        justify-content: space-around;
    }
    li {
        margin: 0 10px;
    }
    a {
        text-decoration: none;
        color: #333;
    }
    button {
        background: none;
        border: none;
        cursor: pointer;
        color: #333;
        font-size: 1em;
    }
 
    
    @media (max-width: 768px) {
        .menu-toggle {
            display: block;
        }
        ul {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 50px;
            left: 0;
            right: 0;
            background-color: #f0f0f0;
            padding: 10px;
        }
        ul.open {
            display: flex;
        }
        li {
            margin: 10px 0;
        }
    }
    </style>