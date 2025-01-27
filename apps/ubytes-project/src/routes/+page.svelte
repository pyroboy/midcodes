<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;

  const { supabase, session, profile } = data;

  function signIn() {
    goto('/auth/signin');
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
    else goto('/');
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">ADMIN PAGE</h1>
  
  {#if session}
    <p>Welcome ADMIN, {session.user.email}</p>
    {#if profile}
      <p>Role: {profile.role}</p>
    {:else}
      <p>Role: Not assigned</p>
    {/if}
    <!-- <button on:click={signOut} class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-2">Sign Out</button> -->
  {:else}
    <button on:click={signIn} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Sign In</button>
  {/if}
</div>