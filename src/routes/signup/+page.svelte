<script>
    // src/routes/signup/+page.svelte
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';
    
    let email = '';
    let password = '';
    let errorMessage = '';
    
    async function signUp() {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            errorMessage = error.message;
        } else {
            goto('/signin');
            alert('Please check your email for the confirmation link.');
        }
    }
    </script>
    
    <div class="auth-container">
        <h2>Sign Up</h2>
        <form on:submit|preventDefault={signUp}>
            <input type="email" bind:value={email} placeholder="Email" required>
            <input type="password" bind:value={password} placeholder="Password" required>
            <button type="submit">Sign Up</button>
        </form>
        {#if errorMessage}
            <p class="error">{errorMessage}</p>
        {/if}
        <p>Already have an account? <a href="/signin">Sign In</a></p>
    </div>
    
    <style>
    .auth-container {
        max-width: 300px;
        margin: 0 auto;
        padding: 20px;
    }
    input, button {
        display: block;
        width: 100%;
        margin-bottom: 10px;
        padding: 10px;
        box-sizing: border-box;
    }
    .error {
        color: red;
    }
    @media (max-width: 768px) {
        .auth-container {
            width: 100%;
            padding: 20px;
        }
    }
    </style>